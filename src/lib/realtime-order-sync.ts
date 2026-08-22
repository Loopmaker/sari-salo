import { supabase } from "./supabase-client";
import { db } from "@/db/schema";

type OrderStatus = "NEW" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

interface RealtimeOrderRow {
  id: string;
  status: OrderStatus;
  clientModifiedAt: string;
  [key: string]: unknown;
}

const REALTIME_SETTLE_DELAY_MS = 3000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function applyIncomingOrderUpdate(row: RealtimeOrderRow) {
  await db.transaction("rw", db.orders, async () => {
    const local = await db.orders.get(row.id);

    if (!local) return;

    const hasUnresolvedLocalIntent = local.syncStatus === "PENDING";

    if (hasUnresolvedLocalIntent) {
      return;
    }
    if (row.clientModifiedAt > local.clientModifiedAt) {
      await db.orders.update(row.id, {
        status: row.status,
        clientModifiedAt: row.clientModifiedAt,
        syncStatus: "SYNCED",
      });
    }
  });
}

export function attachRealtimeOrderSync(): () => void {
  let ready = false;
  let cancelled = false;
  const buffered: RealtimeOrderRow[] = [];

  const channel = supabase
    .channel("cashier-order-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "Order" },
      (payload) => {
        const row = payload.new as RealtimeOrderRow | undefined;
        if (!row) return;

        if (!ready) {
          buffered.push(row);
          return;
        }

        if (cancelled) return;

        applyIncomingOrderUpdate(row);
      },
    );

  const subscribed = new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
  });

  subscribed
    .then(() => delay(REALTIME_SETTLE_DELAY_MS))
    .then(async () => {
      if (cancelled) return;
      for (const row of buffered) {
        await applyIncomingOrderUpdate(row);
      }
      buffered.length = 0;
      ready = true;
    });

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}
