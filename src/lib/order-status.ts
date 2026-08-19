import type { OrderStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true; // idempotent no-op, not an error
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
