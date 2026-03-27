type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function cleanupExpiredBuckets(currentTime: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= currentTime) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const currentTime = now();
  cleanupExpiredBuckets(currentTime);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= currentTime) {
    const next: Bucket = {
      count: 1,
      resetAt: currentTime + windowMs,
    };
    buckets.set(key, next);

    return {
      allowed: true,
      remaining: Math.max(0, limit - next.count),
      retryAfterMs: 0,
    };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - currentTime),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterMs: 0,
  };
}
