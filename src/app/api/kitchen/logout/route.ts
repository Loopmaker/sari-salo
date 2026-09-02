import { NextResponse } from "next/server";
import { KITCHEN_SESSION_COOKIE } from "@/lib/kitchen-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(KITCHEN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return res;
}
