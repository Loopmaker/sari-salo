"use client";

import type { KitchenOrder } from "./KitchenBoard";
import { getNextActionLabel } from "@/lib/kitchen-status";

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

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="font-semibold mb-2">#{order.orderNumber}</div>
      <ul className="text-sm text-gray-700 mb-3 space-y-1">
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
          className="w-full bg-black text-white text-sm py-2 rounded disabled:opacity-40"
        >
          {advancing ? "Updating..." : actionLabel}
        </button>
      )}
    </div>
  );
}
