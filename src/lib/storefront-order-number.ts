import type { Prisma } from "@prisma/client";

const STALL_TIMEZONE = "Asia/Manila";

export function getStallDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STALL_TIMEZONE,
  }).format(new Date());
}

export async function allocateStorefrontOrderNumber(
  tx: Prisma.TransactionClient,
): Promise<{ orderNumber: string; terminalId: string }> {
  const dateKey = getStallDateKey();
  const terminalId = `storefront-${dateKey}`;

  const rows = await tx.$queryRaw<{ count: number }[]>`
    INSERT INTO "DailyOrderCounter" ("date", "count")
    VALUES (${dateKey}, 1)
    ON CONFLICT ("date") DO UPDATE SET "count" = "DailyOrderCounter"."count" + 1
    RETURNING "count";
  `;

  const count = rows[0]?.count;
  if (count === undefined) {
    throw new Error("Failed to allocate storefront order number");
  }

  return { orderNumber: `C-${count}`, terminalId };
}
