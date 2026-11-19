import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/ratelimit";

const MAX_JSON_BYTES = 128 * 1024;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB cap for deliverables and evidence
const DISALLOWED_METHODS = new Set(["TRACE", "TRACK"]);

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function limitFor(request: NextRequest): number {
  if (request.nextUrl.pathname.startsWith("/api/auth/")) return 10;
  if (request.nextUrl.pathname.startsWith("/api/storage/upload")) return 30;
  return ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) ? 60 : 240;
}

function isBrowserMutation(request: NextRequest): boolean {
  return (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    !request.nextUrl.pathname.startsWith("/api/auth/") &&
    request.nextUrl.pathname !== "/api/escrow/webhook"
  );
}

function isSignedPaymentRequest(pathname: string): boolean {
  return pathname === "/api/escrow/webhook" || pathname === "/api/escrow/mock-pay";
}

export async function middleware(request: NextRequest) {
  // Layer 1: Protocol & Method verification
  if (DISALLOWED_METHODS.has(request.method.toUpperCase())) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const path = request.nextUrl.pathname;
  const limit = limitFor(request);
  const key = `${clientIp(request)}:${path}:${request.method}`;

  // Layer 1: Multi-instance distributed rate limiting (Upstash Redis + LRU memory fallback)
  const rl = await checkRateLimit(key, limit, 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
          "X-Content-Type-Options": "nosniff",
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Backend": rl.backend,
        },
      }
    );
  }

  // Layer 1 & 2: Content-Type & Payload size restrictions
  if (isBrowserMutation(request) && !isSignedPaymentRequest(path)) {
    const contentType = request.headers.get("content-type") || "";
    const contentLength = Number(request.headers.get("content-length") || 0);
    const isUpload = path === "/api/storage/upload";
    const maxBytes = isUpload ? MAX_UPLOAD_BYTES : MAX_JSON_BYTES;

    if (contentLength > 0 || contentType) {
      if (isUpload) {
        if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
          return NextResponse.json(
            { error: "Multipart form data required for file upload" },
            { status: 415 }
          );
        }
      } else {
        if (!contentType.toLowerCase().startsWith("application/json")) {
          return NextResponse.json({ error: "JSON requests only" }, { status: 415 });
        }
      }

      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        return NextResponse.json({ error: "Request body is too large" }, { status: 413 });
      }
    }
  }

  // Layer 2: CSRF & Origin Defense in Depth
  if (isBrowserMutation(request)) {
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }

    if (!origin) {
      const referer = request.headers.get("referer");
      if (referer) {
        try {
          const refererOrigin = new URL(referer).origin;
          if (refererOrigin !== request.nextUrl.origin) {
            return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
        }
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-RateLimit-Limit", String(rl.limit));
  response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  response.headers.set("X-RateLimit-Backend", rl.backend);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
