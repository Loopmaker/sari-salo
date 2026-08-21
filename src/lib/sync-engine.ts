import { db } from "@/db/schema";

const BACKOFF_SCHEDULE_MS = [5_000, 15_000, 60_000, 300_000, 900_000]; // 5s..15m
const MAX_ATTEMPTS = BACKOFF_SCHEDULE_MS.length;

function computeNextAttempt(attempts: number): string {
  const delay =
    BACKOFF_SCHEDULE_MS[Math.min(attempts, BACKOFF_SCHEDULE_MS.length - 1)];
  return new Date(Date.now() + delay).toISOString();
}

// Network/5xx/timeout are treated as retryable — the world might just
// be flaky right now. 4xx (validation, invalid transition, not found)
// are permanent — retrying the exact same payload won't change the
// outcome, so don't waste retry cycles on it.
function classifyFailure(httpStatus: number | null): "retryable" | "permanent" {
  if (httpStatus === null) return "retryable"; // network error/timeout, no response at all
  if (httpStatus >= 500) return "retryable";
  if (httpStatus >= 400 && httpStatus < 500) return "permanent";
  return "retryable";
}

// Heartbeat is a GATE, not a guarantee. It avoids obviously pointless
// sync attempts (server unreachable), but the sync loop's own
// per-request error handling is what actually catches "heartbeat
// passed, then network dropped mid-sync" — that's just a normal
// retryable failure hitting classifyFailure() below.
async function checkHeartbeat(): Promise<boolean> {
  try {
    const res = await fetch("/api/ping", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

// Operations for the same entity must process in the correct order.
// For v1's realistic queue size, global sequential processing
// satisfies that trivially without needing per-entity grouping logic.
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

async function sendCreateOrder(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number | null }> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // 200 (alreadyExisted) and 201 (created) both count as success —
    // idempotency means a duplicate is not a failure.
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  }
}

async function sendUpdateStatus(payload: {
  statusEvent: { orderId: string; [key: string]: unknown };
}): Promise<{ ok: boolean; status: number | null }> {
  try {
    const res = await fetch(
      `/api/orders/${payload.statusEvent.orderId}/status-events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  }
}

async function processOperation(
  op: Awaited<ReturnType<typeof getSyncableOperations>>[number],
) {
  await db.syncOperations.update(op.id, { status: "SYNCING" });

  const result =
    op.operation === "CREATE_ORDER"
      ? await sendCreateOrder(op.payload)
      : await sendUpdateStatus(
          op.payload as {
            statusEvent: { orderId: string; [key: string]: unknown };
          },
        );

  if (result.ok) {
    await db.syncOperations.update(op.id, { status: "SYNCED" });

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

  const heartbeatOk = await checkHeartbeat();
  if (!heartbeatOk) return;

  syncInProgress = true;
  try {
    const operations = await getSyncableOperations();
    for (const op of operations) {
      await processOperation(op);
    }
  } finally {
    syncInProgress = false;
  }
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
