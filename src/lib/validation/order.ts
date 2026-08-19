import { z } from "zod";

const orderStatusEnum = z.enum([
  "NEW",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]);

const decimalString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid monetary value");

export const createOrderSchema = z.object({
  order: z.object({
    id: z.uuid(),
    orderNumber: z.string().min(1),
    terminalId: z.uuid(),
    status: orderStatusEnum.default("NEW"),
    total: decimalString,
    clientModifiedAt: z.iso.datetime(),
    createdAt: z.iso.datetime(),
  }),
  items: z
    .array(
      z.object({
        id: z.uuid(),
        productId: z.uuid(),
        quantity: z.number().int().positive(),
        priceAtOrder: decimalString,
      }),
    )
    .min(1, "Order must have at least one item"),
});

export const createStatusEventSchema = z.object({
  statusEvent: z.object({
    id: z.uuid(),
    orderId: z.uuid(),
    status: orderStatusEnum,
    terminalId: z.uuid(),
    clientModifiedAt: z.iso.datetime(),
  }),
});
