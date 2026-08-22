"use client";

import { useEffect } from "react";
import { attachSyncTriggers } from "@/lib/sync-engine";
import { attachRealtimeOrderSync } from "@/lib/realtime-order-sync";

export function SyncEngineProvider() {
  useEffect(() => {
    const detachSync = attachSyncTriggers();
    const detachRealtime = attachRealtimeOrderSync();
    return () => {
      detachSync();
      detachRealtime();
    };
  }, []);

  return null;
}
