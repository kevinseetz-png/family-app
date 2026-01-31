import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_LIMIT = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }; // 5 per 15min
const REGISTER_LIMIT = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }; // 3 per hour
const DATA_MUTATION_LIMIT = { maxAttempts: 30, windowMs: 60 * 1000 }; // 30 per min
const INVITE_LIMIT = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }; // 3 per hour

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const { allowed, retryAfterMs } = checkRateLimit(`login:${ip}`, LOGIN_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }
  }

  if (pathname === "/api/auth/register" && request.method === "POST") {
    const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`, REGISTER_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }
  }

  if (pathname === "/api/auth/invite" && request.method === "POST") {
    const { allowed, retryAfterMs } = checkRateLimit(`invite:${ip}`, INVITE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many invite attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }
  }

  const dataMutationPaths = ["/api/feedings", "/api/notes", "/api/weekmenu"];
  if (
    dataMutationPaths.some((p) => pathname.startsWith(p)) &&
    ["POST", "PUT", "DELETE"].includes(request.method)
  ) {
    const { allowed, retryAfterMs } = checkRateLimit(`data:${ip}`, DATA_MUTATION_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
