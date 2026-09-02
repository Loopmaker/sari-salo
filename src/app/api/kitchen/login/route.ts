import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/kitchen-password";
import {
  createSessionToken,
  KITCHEN_SESSION_COOKIE,
  SESSION_DURATION_MS,
} from "@/lib/kitchen-session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const storedHash = process.env.KITCHEN_PASSWORD_HASH;

  const genericError = NextResponse.json(
    { error: "Invalid password" },
    { status: 401 },
  );

  if (!storedHash || !password) return genericError;
  if (!verifyPassword(password, storedHash)) return genericError;

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(KITCHEN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
  return res;
}
