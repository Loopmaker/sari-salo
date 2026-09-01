import { z } from "zod";

export const createStorefrontOrderSchema = z.object({
  id: z.uuid(),
  customerName: z.string().trim().min(1, "Name is required").max(80),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Order must have at least one item"),
});
