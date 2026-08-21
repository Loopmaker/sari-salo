import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const KITCHEN_ACTIVE_STATUSES: OrderStatus[] = ["NEW", "PREPARING", "READY"];

export async function GET() {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: KITCHEN_ACTIVE_STATUSES },
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    clientModifiedAt: order.clientModifiedAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
    })),
  }));

  return NextResponse.json({ orders: serialized });
}
