import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation/order";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { order, items } = parsed.data;
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

  const existing = await prisma.order.findUnique({ where: { id: order.id } });
  if (existing) {
    return NextResponse.json(
      { order: existing, alreadyExisted: true },
      { status: 200 },
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0);
      const itemsWithPrice = items.map((item) => {
        const product = productMap.get(item.productId)!;
        const lineTotal = product.price.mul(item.quantity);
        total = total.add(lineTotal);
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: product.price,
        };
      });

      const newOrder = await tx.order.create({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          terminalId: order.terminalId,
          status: order.status,
          total,
          clientModifiedAt: new Date(order.clientModifiedAt),
          createdAt: new Date(order.createdAt),
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
      { order: created, alreadyExisted: false },
      { status: 201 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = err.meta?.target;
      const isIdConflict =
        Array.isArray(target) && target.length === 1 && target[0] === "id";

      if (isIdConflict) {
        const raceWinner = await prisma.order.findUnique({
          where: { id: order.id },
        });
        return NextResponse.json(
          { order: raceWinner, alreadyExisted: true },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          error: "Order number already used for this terminal",
          details: {
            terminalId: order.terminalId,
            orderNumber: order.orderNumber,
          },
        },
        { status: 409 },
      );
    }
    throw err;
  }
}
