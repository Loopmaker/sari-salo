import type { OrderStatus } from "@prisma/client";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  NEW: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export function getNextKitchenStatus(current: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[current] ?? null;
}

export function getNextActionLabel(current: OrderStatus): string {
  const next = NEXT_STATUS[current];
  if (next === "PREPARING") return "Start Preparing";
  if (next === "READY") return "Mark Ready";
  if (next === "COMPLETED") return "Complete";
  return "";
}
