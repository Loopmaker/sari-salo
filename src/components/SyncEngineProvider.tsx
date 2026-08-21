"use client";

import { useEffect } from "react";
import { attachSyncTriggers } from "@/lib/sync-engine";

export function SyncEngineProvider() {
  useEffect(() => {
    const detach = attachSyncTriggers();
    return detach;
  }, []);

  return null;
}
