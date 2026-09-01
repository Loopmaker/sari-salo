import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStorefrontOrderSchema } from "@/lib/validation/storefront-order";
import { allocateStorefrontOrderNumber } from "@/lib/storefront-order-number";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createStorefrontOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, customerName, items } = parsed.data;

  const existingOrder = await prisma.order.findUnique({ where: { id } });
  if (existingOrder) {
    return NextResponse.json(
      {
        orderNumber: existingOrder.orderNumber,
        customerName: existingOrder.customerName,
        total: existingOrder.total.toString(),
      },
      { status: 200 },
    );
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product not found: ${item.productId}` },
        { status: 422 },
      );
    }
    if (!product.active) {
      return NextResponse.json(
        { error: `Product is no longer available: ${product.name}` },
        { status: 422 },
      );
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const { orderNumber, terminalId } =
        await allocateStorefrontOrderNumber(tx);

      let total = new Prisma.Decimal(0);
      const itemsWithPrice = items.map((item) => {
        const product = productMap.get(item.productId)!;
        const lineTotal = product.price.mul(item.quantity);
        total = total.add(lineTotal);
        return {
          id: crypto.randomUUID(),
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price,
        };
      });

      const now = new Date();
      const newOrder = await tx.order.create({
        data: {
          id,
          orderNumber,
          terminalId,
          status: "NEW",
          total,
          customerName,
          clientModifiedAt: now,
          createdAt: now,
        },
      });

      await tx.orderItem.createMany({
        data: itemsWithPrice.map((item) => ({
          ...item,
          orderId: newOrder.id,
        })),
      });

      return newOrder;
    });

    return NextResponse.json(
      {
        orderNumber: created.orderNumber,
        customerName: created.customerName,
        total: created.total.toString(),
      },
      { status: 201 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Could not allocate order number — please try again" },
        { status: 409 },
      );
    }
    throw err;
  }
}
