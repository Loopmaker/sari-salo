import { db } from "@/db/schema";

const BACKOFF_SCHEDULE_MS = [5_000, 15_000, 60_000, 300_000, 900_000]; // 5s..15m
const MAX_ATTEMPTS = BACKOFF_SCHEDULE_MS.length;

const REQUEST_TIMEOUT_MS = 15_000; // 15s
const STALE_SYNCING_THRESHOLD_MS = 45_000; // 45s — comfortable margin above REQUEST_TIMEOUT_MS

function computeNextAttempt(attempts: number): string {
  const delay =
    BACKOFF_SCHEDULE_MS[Math.min(attempts, BACKOFF_SCHEDULE_MS.length - 1)];
  return new Date(Date.now() + delay).toISOString();
}

function classifyFailure(httpStatus: number | null): "retryable" | "permanent" {
  if (httpStatus === null) return "retryable"; // network error/timeout, no response at all
  if (httpStatus === 429) return "retryable"; // rate limited — expected to succeed on retry
  if (httpStatus >= 500) return "retryable";
  if (httpStatus >= 400 && httpStatus < 500) return "permanent";
  return "retryable";
}

async function checkHeartbeat(): Promise<boolean> {
  try {
    const res = await fetch("/api/ping", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function getSyncableOperations() {
  const now = new Date().toISOString();

  const pending = await db.syncOperations
    .where("status")
    .equals("PENDING")
    .toArray();
  const failedReady = await db.syncOperations
    .where("status")
    .equals("FAILED")
    .filter((op) => !op.permanentFailure && op.nextAttemptAt <= now)
    .toArray();

  return [...pending, ...failedReady].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

async function recoverStaleSyncingOperations() {
  const now = Date.now();

  const stuck = await db.syncOperations
    .where("status")
    .equals("SYNCING")
    .filter((op) => {
      if (!op.syncingStartedAt) return true; // defensive: no timestamp means we can't confirm it's fresh
      return (
        now - new Date(op.syncingStartedAt).getTime() >
        STALE_SYNCING_THRESHOLD_MS
      );
    })
    .toArray();

  for (const op of stuck) {
    await db.syncOperations.update(op.id, {
      status: "PENDING",
      syncingStartedAt: null,
    });
  }
}

async function sendCreateOrder(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendUpdateStatus(payload: {
  statusEvent: { orderId: string; [key: string]: unknown };
}): Promise<{ ok: boolean; status: number | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(
      `/api/orders/${payload.statusEvent.orderId}/status-events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processOperation(
  op: Awaited<ReturnType<typeof getSyncableOperations>>[number],
) {
  await db.syncOperations.update(op.id, {
    status: "SYNCING",
    syncingStartedAt: new Date().toISOString(),
  });

  const result =
    op.operation === "CREATE_ORDER"
      ? await sendCreateOrder(op.payload)
      : await sendUpdateStatus(
          op.payload as {
            statusEvent: { orderId: string; [key: string]: unknown };
          },
        );

  if (result.ok) {
    await db.syncOperations.update(op.id, {
      status: "SYNCED",
      syncingStartedAt: null,
    });

    if (op.entityType === "ORDER") {
      await db.orders.update(op.entityId, { syncStatus: "SYNCED" });
    } else {
      await db.orderStatusEvents.update(op.entityId, { syncStatus: "SYNCED" });
    }
    return;
  }

  const classification = classifyFailure(result.status);
  const attempts = op.attempts + 1;
  const permanentFailure =
    classification === "permanent" || attempts >= MAX_ATTEMPTS;

  await db.syncOperations.update(op.id, {
    status: "FAILED",
    attempts,
    lastError: `HTTP ${result.status ?? "network error"}`,
    nextAttemptAt: computeNextAttempt(attempts),
    permanentFailure,
    syncingStartedAt: null,
  });

  if (permanentFailure) {
    if (op.entityType === "ORDER") {
      await db.orders.update(op.entityId, { syncStatus: "FAILED" });
    } else {
      await db.orderStatusEvents.update(op.entityId, { syncStatus: "FAILED" });
    }
  }
}

let syncInProgress = false;

export async function runSyncCycle(): Promise<void> {
  if (syncInProgress) return;
  syncInProgress = true;

  try {
    const heartbeatOk = await checkHeartbeat();
    setLastHeartbeatOk(heartbeatOk);
    if (!heartbeatOk) return;

    await recoverStaleSyncingOperations();

    const operations = await getSyncableOperations();
    for (const op of operations) {
      await processOperation(op);
    }
  } finally {
    syncInProgress = false;
  }
}

let lastHeartbeatOk = true; // optimistic default so boot doesn't flash "offline"
const heartbeatListeners = new Set<() => void>();

export function getLastHeartbeatOk(): boolean {
  return lastHeartbeatOk;
}

export function subscribeHeartbeat(listener: () => void): () => void {
  heartbeatListeners.add(listener);
  return () => heartbeatListeners.delete(listener);
}

function setLastHeartbeatOk(ok: boolean) {
  if (lastHeartbeatOk === ok) return;
  lastHeartbeatOk = ok;
  heartbeatListeners.forEach((listener) => listener());
}

const PERIODIC_SYNC_INTERVAL_MS = 20_000; // 20s

export function attachSyncTriggers(): () => void {
  const handleOnline = () => {
    runSyncCycle();
  };

  window.addEventListener("online", handleOnline);

  if (navigator.onLine) {
    runSyncCycle();
  }

  const intervalId = setInterval(runSyncCycle, PERIODIC_SYNC_INTERVAL_MS);

  return () => {
    window.removeEventListener("online", handleOnline);
    clearInterval(intervalId);
  };
}
