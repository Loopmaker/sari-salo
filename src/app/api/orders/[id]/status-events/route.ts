import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStatusEventSchema } from "@/lib/validation/order";
import { isValidTransition } from "@/lib/order-status";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = createStatusEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { statusEvent } = parsed.data;
  if (statusEvent.orderId !== id) {
    return NextResponse.json(
      { error: "orderId mismatch with route param" },
      { status: 400 },
    );
  }

  const existingEvent = await prisma.orderStatusEvent.findUnique({
    where: { id: statusEvent.id },
  });
  if (existingEvent) {
    return NextResponse.json(
      { event: existingEvent, alreadyExisted: true },
      { status: 200 },
    );
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const incomingModifiedAt = new Date(statusEvent.clientModifiedAt);
  const isNewerOrEqual = incomingModifiedAt >= order.clientModifiedAt;
  const isValidWorkflowStep = isValidTransition(
    order.status,
    statusEvent.status,
  );

  if (!isValidWorkflowStep) {
    return NextResponse.json(
      {
        error: "Invalid status transition",
        currentStatus: order.status,
        requestedStatus: statusEvent.status,
      },
      { status: 409 },
    );
  }

  const shouldApply = isNewerOrEqual;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.orderStatusEvent.create({
        data: {
          id: statusEvent.id,
          orderId: id,
          status: statusEvent.status,
          terminalId: statusEvent.terminalId,
          clientModifiedAt: incomingModifiedAt,
        },
      });

      let updatedOrder = order;
      if (shouldApply) {
        updatedOrder = await tx.order.update({
          where: { id },
          data: {
            status: statusEvent.status,
            clientModifiedAt: incomingModifiedAt,
          },
        });
      }

      return { event, order: updatedOrder };
    });

    return NextResponse.json(
      {
        ...result,
        alreadyExisted: false,
        applied: shouldApply,
        reason: shouldApply ? undefined : "stale_timestamp",
      },
      { status: 201 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raceWinner = await prisma.orderStatusEvent.findUnique({
        where: { id: statusEvent.id },
      });
      return NextResponse.json(
        { event: raceWinner, alreadyExisted: true },
        { status: 200 },
      );
    }
    throw err;
  }
}
