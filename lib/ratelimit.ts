import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("[PSIQUE] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
  }
  return new Redis({ url, token });
}

function makeRatelimiter(prefix: string, limit: number, window: string): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    // @ts-expect-error — Ratelimit sliding window types vary by version
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
  });
}

/** AI endpoints: 10 requests/minute per therapist */
export function getAIRatelimiter(): Ratelimit {
  return makeRatelimiter("psique:rl:ai", 10, "1 m");
}

/** Auth endpoints: 5 requests/minute per IP */
export function getAuthRatelimiter(): Ratelimit {
  return makeRatelimiter("psique:rl:auth", 5, "1 m");
}

/** General API: 60 requests/minute per user */
export function getApiRatelimiter(): Ratelimit {
  return makeRatelimiter("psique:rl:api", 60, "1 m");
}
