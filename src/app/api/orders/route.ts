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

  // Validate referenced products actually exist before touching the DB
  const productIds = items.map((i) => i.productId);
  const foundProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  if (foundProducts.length !== new Set(productIds).size) {
    return NextResponse.json(
      { error: "One or more products not found" },
      { status: 422 },
    );
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
      const newOrder = await tx.order.create({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          terminalId: order.terminalId,
          status: order.status,
          total: order.total,
          clientModifiedAt: new Date(order.clientModifiedAt),
          createdAt: new Date(order.createdAt),
        },
      });

      await tx.orderItem.createMany({
        data: items.map((item) => ({
          id: item.id,
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
        })),
      });

      return newOrder;
    });

    return NextResponse.json(
      { order: created, alreadyExisted: false },
      { status: 201 },
    );
  } catch (err) {
    // Race: two concurrent requests both passed findUnique before either
    // committed. The DB's unique constraint on `id` is the real source
    // of truth — catch it and treat it as "already existed" instead of
    // surfacing a 500.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raceWinner = await prisma.order.findUnique({
        where: { id: order.id },
      });
      return NextResponse.json(
        { order: raceWinner, alreadyExisted: true },
        { status: 200 },
      );
    }
    throw err;
  }
}
