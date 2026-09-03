import { prisma } from "./prisma";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function checkRateLimit(
  scope: string,
  ip: string,
  limit: number,
): Promise<{ allowed: boolean }> {
  const windowStart =
    Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const key = `${scope}:${ip}:${windowStart}`;

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitEntry" ("id", "count")
    VALUES (${key}, 1)
    ON CONFLICT ("id") DO UPDATE SET "count" = "RateLimitEntry"."count" + 1
    RETURNING "count";
  `;

  const count = rows[0]?.count ?? 1;
  return { allowed: count <= limit };
}
