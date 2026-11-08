interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (can be swapped with Redis for multi-instance clusters)
const ipStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ipStore.entries()) {
      if (now > value.resetAt) {
        ipStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (timer && typeof timer.unref === "function") {
    timer.unref();
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

export interface RateLimitOptions {
  limit: number; // Maximum allowed requests
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const existing = ipStore.get(key);

  if (!existing || now > existing.resetAt) {
    ipStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count++;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}
