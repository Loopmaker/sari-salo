import { NextRequest, NextResponse } from "next/server";
import {
  KITCHEN_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/kitchen-session";

export const config = {
  matcher: ["/kitchen/:path*", "/api/orders/:id/status-events"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/kitchen/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(KITCHEN_SESSION_COOKIE)?.value;
  const authed = await verifySessionToken(token);

  if (authed) {
    return NextResponse.next();
  }

  const isApiRequest = pathname.startsWith("/api/");
  if (isApiRequest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/kitchen/login", req.url));
}
