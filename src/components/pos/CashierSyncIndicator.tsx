"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { getLastHeartbeatOk, subscribeHeartbeat } from "@/lib/sync-engine";

const OFFLINE_DEBOUNCE_MS = 5_000;

function useHeartbeatOk(): boolean {
  const [ok, setOk] = useState(getLastHeartbeatOk());
  useEffect(() => subscribeHeartbeat(() => setOk(getLastHeartbeatOk())), []);
  return ok;
}

function useBrowserOnline(): boolean {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

function useDebouncedOffline(rawOffline: boolean): boolean {
  const [confirmedOffline, setConfirmedOffline] = useState(false);

  useEffect(() => {
    if (!rawOffline) return;
    const timer = setTimeout(
      () => setConfirmedOffline(true),
      OFFLINE_DEBOUNCE_MS,
    );

    return () => {
      clearTimeout(timer);
      setConfirmedOffline(false);
    };
  }, [rawOffline]);

  return rawOffline && confirmedOffline;
}

export function CashierSyncIndicator() {
  const heartbeatOk = useHeartbeatOk();
  const browserOnline = useBrowserOnline();
  const offline = useDebouncedOffline(!browserOnline || !heartbeatOk);

  const permanentFailureCount = useLiveQuery(
    () =>
      db.syncOperations
        .where("status")
        .equals("FAILED")
        .filter((op) => op.permanentFailure)
        .count(),
    [],
  );

  const waitingCount = useLiveQuery(async () => {
    const pending = await db.syncOperations
      .where("status")
      .equals("PENDING")
      .count();
    const retrying = await db.syncOperations
      .where("status")
      .equals("FAILED")
      .filter((op) => !op.permanentFailure)
      .count();
    return pending + retrying;
  }, []);

  const syncingCount = useLiveQuery(
    () => db.syncOperations.where("status").equals("SYNCING").count(),
    [],
  );

  if (
    permanentFailureCount === undefined ||
    waitingCount === undefined ||
    syncingCount === undefined
  ) {
    return null; // still loading — stay quiet, not "healthy"
  }

  if (permanentFailureCount > 0) {
    return (
      <div className="px-3 py-2 text-sm font-medium text-status-attention">
        ⚠ {permanentFailureCount} needs attention
      </div>
    );
  }

  if (offline) {
    return (
      <div className="px-3 py-2 text-sm text-ink/60">
        Offline — orders saved locally
      </div>
    );
  }

  if (waitingCount > 0) {
    return (
      <div className="px-3 py-2 text-sm text-ink/60">
        {waitingCount} order{waitingCount === 1 ? "" : "s"} waiting to sync
      </div>
    );
  }

  if (syncingCount > 0) {
    return (
      <div className="px-3 py-2 text-sm text-ink/50">
        ↻ {syncingCount} syncing
      </div>
    );
  }

  return null; // healthy — invisible
}
