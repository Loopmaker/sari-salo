"use client";

import { useEffect, useState } from "react";
import type { KitchenOrder } from "./KitchenBoard";
import { getNextActionLabel } from "@/lib/kitchen-status";

const ELAPSED_AMBER_THRESHOLD_MS = 5 * 60 * 1000;
const ELAPSED_ATTENTION_THRESHOLD_MS = 10 * 60 * 1000;
const ELAPSED_TICK_MS = 15_000;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function elapsedColorClass(ms: number): string {
  if (ms >= ELAPSED_ATTENTION_THRESHOLD_MS) return "text-status-attention";
  if (ms >= ELAPSED_AMBER_THRESHOLD_MS) return "text-status-pending";
  return "text-ink/70";
}

export function OrderCard({
  order,
  onAdvance,
  advancing,
}: {
  order: KitchenOrder;
  onAdvance: (order: KitchenOrder) => void;
  advancing: boolean;
}) {
  const actionLabel = getNextActionLabel(order.status);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), ELAPSED_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = now - new Date(order.createdAt).getTime();

  return (
    <div className="bg-paper border border-counter-line rounded-lg p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-mono font-bold text-lg text-ink">
          #{order.orderNumber}
        </div>
        <div className={`font-mono text-base ${elapsedColorClass(elapsedMs)}`}>
          {formatElapsed(elapsedMs)}
        </div>
      </div>
      <ul className="text-sm text-ink/80 mb-3 space-y-1">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.productName}
          </li>
        ))}
      </ul>
      {actionLabel && (
        <button
          onClick={() => onAdvance(order)}
          disabled={advancing}
          className="w-full min-h-12 bg-annatto text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-annatto/90 transition-colors"
        >
          {advancing ? "Updating..." : actionLabel}
        </button>
      )}
    </div>
  );
}
