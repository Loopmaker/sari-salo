"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";

const RECENT_ORDERS_LIMIT = 20;

function getFailureReason(
  orderId: string,
  failedOperations:
    | { entityId: string; lastError: string | null }[]
    | undefined,
): string {
  const op = failedOperations?.find((o) => o.entityId === orderId);
  return describeFailure(op?.lastError ?? null);
}

function describeFailure(lastError: string | null): string {
  if (!lastError) return "Needs attention";
  const match = lastError.match(/HTTP (\d+)/);
  if (!match) return "Sync failed — retry limit reached";
  const status = parseInt(match[1], 10);
  if (status >= 400 && status < 500) return "Rejected by server";
  return "Sync failed — retry limit reached";
}

export function RecentOrders() {
  const orders = useLiveQuery(
    () =>
      db.orders
        .orderBy("createdAt")
        .reverse()
        .limit(RECENT_ORDERS_LIMIT)
        .toArray(),
    [],
  );

  const failedOperations = useLiveQuery(
    () =>
      db.syncOperations
        .where("status")
        .equals("FAILED")
        .and((op) => op.entityType === "ORDER")
        .toArray(),
    [],
  );

  if (!orders) {
    return null; // still loading
  }

  if (orders.length === 0) {
    return <p className="text-gray-400 text-sm">No recent orders.</p>;
  }

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-sm text-gray-600 mb-2">
        Recent Orders
      </h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex justify-between items-center text-sm py-1 px-2 rounded bg-gray-50"
          >
            <span>
              #{order.orderNumber} — {order.status}
            </span>
            {order.syncStatus === "FAILED" && (
              <span className="text-red-600 font-medium text-xs">
                ⚠ {getFailureReason(order.id, failedOperations)}
              </span>
            )}
            {order.syncStatus === "PENDING" && (
              <span className="text-gray-400 text-xs">Syncing...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
