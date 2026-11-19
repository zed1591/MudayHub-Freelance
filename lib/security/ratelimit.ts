/**
 * Security by Design & Defense-in-Depth: Distributed Rate Limiter
 * 
 * Implements a 2-tier rate limiter:
 * 1. Distributed Tier: Upstash Redis REST API (when UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are set).
 *    Works seamlessly in serverless, multi-instance, and edge deployments with zero native dependencies.
 * 2. In-Memory Tier: Bounded LRU sliding bucket fallback when Redis is unconfigured or temporarily unreachable.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  backend: "redis" | "memory";
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();
const MAX_MEMORY_BUCKETS = 5_000;

function pruneMemoryBuckets(now: number): void {
  if (memoryBuckets.size <= MAX_MEMORY_BUCKETS) return;

  for (const [k, b] of memoryBuckets.entries()) {
    if (b.resetAt <= now) {
      memoryBuckets.delete(k);
    }
  }

  if (memoryBuckets.size > MAX_MEMORY_BUCKETS) {
    let count = 0;
    const toRemove = Math.floor(MAX_MEMORY_BUCKETS * 0.2);
    for (const k of memoryBuckets.keys()) {
      memoryBuckets.delete(k);
      if (++count >= toRemove) break;
    }
  }
}

function checkMemoryLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  pruneMemoryBuckets(now);

  const current = memoryBuckets.get(key);
  const resetAt = !current || current.resetAt <= now ? now + windowSec * 1000 : current.resetAt;
  const count = !current || current.resetAt <= now ? 1 : current.count + 1;

  memoryBuckets.set(key, { count, resetAt });

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    backend: "memory",
  };
}

async function checkRedisLimit(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult | null> {
  const redisKey = `rl:${key}`;
  const endpoint = url.replace(/\/+$/, "") + "/pipeline";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, windowSec, "NX"],
    ]),
    signal: AbortSignal.timeout(1_200), // Fail fast (1.2s) if network degrades
  });

  if (!res.ok) {
    return null;
  }

  const results = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  if (!Array.isArray(results) || typeof results[0]?.result !== "number") {
    return null;
  }

  const count = results[0].result;
  const resetAt = Date.now() + windowSec * 1000;

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    backend: "redis",
  };
}

/**
 * Checks rate limits for a given identifier (IP or user ID + route).
 * Automatically uses Upstash Redis if configured, falling back to local memory.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number = 60
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const redisResult = await checkRedisLimit(redisUrl, redisToken, key, limit, windowSec);
      if (redisResult) return redisResult;
    } catch {
      // Redis timeout or connection error -> graceful degradation to memory
    }
  }

  return checkMemoryLimit(key, limit, windowSec);
}
