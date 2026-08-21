import { db } from "@/db/schema";
import { allocateNextOrderNumber } from "./terminal";

interface CartLineInput {
  id: string;
  productId: string;
  productName: string;
  price: string;
  quantity: number;
}

export async function createOrderOffline(cart: CartLineInput[]) {
  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();

  const totalCents = cart.reduce(
    (sum, line) =>
      sum + Math.round(parseFloat(line.price) * 100) * line.quantity,
    0,
  );
  const total = (totalCents / 100).toFixed(2);

  let resultOrderNumber = "";

  await db.transaction(
    "rw",
    db.orders,
    db.orderItems,
    db.syncOperations,
    db.meta,
    async () => {
      const { orderNumber, terminalId } = await allocateNextOrderNumber();
      resultOrderNumber = orderNumber;

      const order = {
        id: orderId,
        orderNumber,
        terminalId,
        status: "NEW" as const,
        total,
        clientModifiedAt: now,
        createdAt: now,
        syncStatus: "PENDING" as const,
      };

      const items = cart.map((line) => ({
        id: line.id,
        orderId,
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity,
        priceAtOrder: parseFloat(line.price).toFixed(2),
        createdAt: now,
      }));

      await db.orders.add(order);
      await db.orderItems.bulkAdd(items);
      const syncPayload = {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          terminalId: order.terminalId,
          status: order.status,
          clientModifiedAt: order.clientModifiedAt,
          createdAt: order.createdAt,
        },
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await db.syncOperations.add({
        id: crypto.randomUUID(),
        entityType: "ORDER" as const,
        entityId: orderId,
        operation: "CREATE_ORDER" as const,
        payload: syncPayload,
        status: "PENDING" as const,
        attempts: 0,
        lastError: null,
        createdAt: now,
        nextAttemptAt: now, // immediately eligible for the first sync attempt
        permanentFailure: false,
      });
    },
  );

  return { orderId, orderNumber: resultOrderNumber, total };
}
