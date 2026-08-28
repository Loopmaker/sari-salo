"use client";

import { useEffect, useRef, useState } from "react";

export type RealtimeConnectionState =
  | "connecting"
  | "connected"
  | "disconnected";

const DISCONNECT_DEBOUNCE_MS = 5_000;
const RECOVERY_FLASH_MS = 2_000;

export function KitchenSyncIndicator({
  connectionState,
}: {
  connectionState: RealtimeConnectionState;
}) {
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [showRecovered, setShowRecovered] = useState(false);
  const wasDisconnectedRef = useRef(false);

  useEffect(() => {
    if (connectionState === "disconnected") {
      const timer = setTimeout(() => {
        setShowDisconnected(true);
        wasDisconnectedRef.current = true;
      }, DISCONNECT_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }

    if (connectionState === "connected" && wasDisconnectedRef.current) {
      setShowDisconnected(false);
      setShowRecovered(true);
      wasDisconnectedRef.current = false;
      const timer = setTimeout(
        () => setShowRecovered(false),
        RECOVERY_FLASH_MS,
      );
      return () => clearTimeout(timer);
    }
  }, [connectionState]);

  if (connectionState === "connecting") {
    return <div className="px-3 py-2 text-sm text-ink/40">Connecting…</div>;
  }

  if (showDisconnected) {
    return (
      <div className="px-3 py-2 text-sm font-medium text-status-attention">
        ⚠ Live updates disconnected
      </div>
    );
  }

  if (showRecovered) {
    return (
      <div className="px-3 py-2 text-sm text-status-ok">
        Live updates restored
      </div>
    );
  }

  return null; // connected and settled — invisible
}
