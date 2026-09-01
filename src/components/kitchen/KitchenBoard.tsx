"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { OrderCard } from "./OrderCard";
import { getKitchenTerminalId } from "@/lib/kitchen-terminal";
import { getNextKitchenStatus } from "@/lib/kitchen-status";
import {
  KitchenSyncIndicator,
  type RealtimeConnectionState,
} from "./KitchenSyncIndicator";

type OrderStatus = "NEW" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string | null;
  clientModifiedAt: string;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
}

const ACTIVE_STATUSES: OrderStatus[] = ["NEW", "PREPARING", "READY"];
const COLUMNS: { status: OrderStatus; label: string; colorClass: string }[] = [
  { status: "NEW", label: "New", colorClass: "text-status-new" },
  {
    status: "PREPARING",
    label: "Preparing",
    colorClass: "text-status-pending",
  },
  { status: "READY", label: "Ready", colorClass: "text-status-ok" },
];

const REALTIME_SETTLE_DELAY_MS = 3000;

// Temporary while Supabase Realtime is affected by a PoolingReplicationError
const POLL_INTERVAL_MS = 12_000; // 12s

async function fetchKitchenOrders(): Promise<KitchenOrder[]> {
  const res = await fetch("/api/kitchen/orders");
  const data = await res.json();
  return data.orders;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyOrderEvent(
  prev: KitchenOrder[],
  newRow: { id: string; status: OrderStatus } | undefined,
  oldRow: { id: string } | undefined,
  removedIds: Set<string>,
): { orders: KitchenOrder[]; needsRefetch: boolean } {
  if (!newRow || !ACTIVE_STATUSES.includes(newRow.status)) {
    const removeId = newRow?.id ?? oldRow?.id;
    if (removeId) removedIds.add(removeId);
    return {
      orders: prev.filter((o) => o.id !== removeId),
      needsRefetch: false,
    };
  }

  const existing = prev.find((o) => o.id === newRow.id);
  if (existing) {
    return {
      orders: prev.map((o) =>
        o.id === newRow.id ? { ...o, status: newRow.status } : o,
      ),
      needsRefetch: false,
    };
  }

  return { orders: prev, needsRefetch: true };
}

export function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("connecting");

  const readyRef = useRef(false);
  const bufferedEventsRef = useRef<
    { newRow?: { id: string; status: OrderStatus }; oldRow?: { id: string } }[]
  >([]);

  const refetchTokenRef = useRef(0);
  const removedIdsRef = useRef<Set<string>>(new Set());
  const ordersRef = useRef<KitchenOrder[]>([]);
  const isFetchingRef = useRef(false);

  function commitOrders(next: KitchenOrder[]) {
    ordersRef.current = next;
    setOrders(next);
  }

  function reconcileWithServer() {
    if (!readyRef.current) return; // initial connect/settle sequence still in progress
    if (isFetchingRef.current) return; // avoid overlapping fetches

    isFetchingRef.current = true;
    const myToken = ++refetchTokenRef.current;

    fetchKitchenOrders()
      .then((fresh) => {
        if (myToken !== refetchTokenRef.current) return; // superseded by a newer reconcile
        const reconciled = fresh.filter(
          (o) => !removedIdsRef.current.has(o.id),
        );
        commitOrders(reconciled);
      })
      .catch(() => {
        // A failed poll/refetch shouldn't crash the board — the next
        // cycle will retry.
      })
      .finally(() => {
        isFetchingRef.current = false;
      });
  }

  useEffect(() => {
    let cancelled = false;

    const channel = supabase
      .channel("kitchen-order-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Order" },
        (payload) => {
          const newRow = payload.new as
            | { id: string; status: OrderStatus }
            | undefined;
          const oldRow = payload.old as { id: string } | undefined;

          if (!readyRef.current) {
            bufferedEventsRef.current.push({ newRow, oldRow });
            return;
          }

          const result = applyOrderEvent(
            ordersRef.current,
            newRow,
            oldRow,
            removedIdsRef.current,
          );
          commitOrders(result.orders);
          if (result.needsRefetch) reconcileWithServer();
        },
      );

    const subscribed = new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          resolve();
          if (readyRef.current) setConnectionState("connected");
        } else if (
          readyRef.current &&
          (status === "CLOSED" ||
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT")
        ) {
          setConnectionState("disconnected");
        }
      });
    });

    subscribed
      .then(() => delay(REALTIME_SETTLE_DELAY_MS))
      .then(() => {
        if (cancelled) return;
        return fetchKitchenOrders();
      })
      .then((initial) => {
        if (cancelled || !initial) return;

        let result = initial;
        let needsRefetchAfterInit = false;

        for (const { newRow, oldRow } of bufferedEventsRef.current) {
          const applied = applyOrderEvent(
            result,
            newRow,
            oldRow,
            removedIdsRef.current,
          );
          result = applied.orders;
          if (applied.needsRefetch) needsRefetchAfterInit = true;
        }
        bufferedEventsRef.current = [];

        readyRef.current = true;
        commitOrders(result);
        setConnectionState("connected");

        if (needsRefetchAfterInit) reconcileWithServer();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      reconcileWithServer();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  async function advanceOrder(order: KitchenOrder) {
    const nextStatus = getNextKitchenStatus(order.status);
    if (!nextStatus) return;

    setAdvancingId(order.id);
    setAdvanceError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/status-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusEvent: {
            id: crypto.randomUUID(),
            orderId: order.id,
            status: nextStatus,
            terminalId: getKitchenTerminalId(),
            clientModifiedAt: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        let message = "Could not update order status.";
        try {
          const data = await res.json();
          message = data.error ?? message;
        } catch {}
        setAdvanceError(message);
      }
    } catch {
      setAdvanceError("Network error — status not updated.");
    } finally {
      setAdvancingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-ink/50">Loading orders...</div>;
  }

  return (
    <div className="p-4">
      {advanceError && (
        <div className="mb-4 text-status-attention text-sm">{advanceError}</div>
      )}
      <div className="flex gap-4 h-screen">
        {COLUMNS.map((col) => (
          <div key={col.status} className="flex-1 bg-counter/40 rounded-lg p-3">
            <h2 className={`font-semibold mb-3 ${col.colorClass}`}>
              {col.label}
            </h2>
            <div className="space-y-3">
              {orders
                .filter((o) => o.status === col.status)
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAdvance={advanceOrder}
                    advancing={advancingId === order.id}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <KitchenSyncIndicator connectionState={connectionState} />
    </div>
  );
}
