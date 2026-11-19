import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const uptimeSeconds = Math.floor(process.uptime());
  const memUsage = process.memoryUsage();

  let databaseStatus: "connected" | "demo_store" | "unreachable" = "demo_store";
  let dbLatencyMs = 0;

  if (isDemoMode()) {
    databaseStatus = "demo_store";
  } else {
    try {
      const dbCheckStart = Date.now();
      const admin = createAdminClient();
      const { error } = await admin.from("profiles").select("id").limit(1);
      dbLatencyMs = Date.now() - dbCheckStart;
      databaseStatus = error ? "unreachable" : "connected";
    } catch {
      databaseStatus = "unreachable";
    }
  }

  const isHealthy = databaseStatus !== "unreachable";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      service: "mudayhub-freelance",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      demo_mode: isDemoMode(),
      database: {
        status: databaseStatus,
        latency_ms: dbLatencyMs,
      },
      system: {
        uptime_seconds: uptimeSeconds,
        memory_mb: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heap_used: Math.round(memUsage.heapUsed / 1024 / 1024),
          heap_total: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
      },
      response_time_ms: Date.now() - startTime,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
