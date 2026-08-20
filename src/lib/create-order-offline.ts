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

  // Integer-centavo arithmetic avoids floating-point drift when
  // summing money across multiple cart lines.
  const totalCents = cart.reduce(
    (sum, line) =>
      sum + Math.round(parseFloat(line.price) * 100) * line.quantity,
    0,
  );
  const total = (totalCents / 100).toFixed(2);

  let resultOrderNumber = "";

  // Single Dexie transaction spanning: sequence allocation, order
  // write, item writes, and sync-operation creation. This is the
  // "never split the write" invariant from the offline-data-flow
  // design — if the app crashes mid-transaction, either everything
  // lands or nothing does. There is no partial state where an order
  // exists without a corresponding sync operation.
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

      await db.syncOperations.add({
        id: crypto.randomUUID(),
        entityType: "ORDER" as const,
        entityId: orderId,
        operation: "CREATE_ORDER" as const,
        payload: { order, items },
        status: "PENDING" as const,
        attempts: 0,
        lastError: null,
        createdAt: now,
      });
    },
  );

  return { orderId, orderNumber: resultOrderNumber, total };
}
