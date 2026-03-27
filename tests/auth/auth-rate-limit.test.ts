import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit } from "@/lib/auth-rate-limit";

describe("auth-rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-27T12:00:00.000Z"));
  });

  it("pozwala na pierwsze żądanie i zmniejsza remaining", () => {
    expect(checkRateLimit(`key:${crypto.randomUUID()}`, 3, 1000)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterMs: 0,
    });
  });

  it("blokuje po przekroczeniu limitu", () => {
    const key = `key:${crypto.randomUUID()}`;
    expect(checkRateLimit(key, 1, 1000).allowed).toBe(true);
    const second = checkRateLimit(key, 1, 1000);

    expect(second.allowed).toBe(false);
    expect(second.remaining).toBe(0);
    expect(second.retryAfterMs).toBeGreaterThan(0);
  });

  it("resetuje bucket po upływie okna", () => {
    const key = `key:${crypto.randomUUID()}`;
    checkRateLimit(key, 1, 1000);
    vi.advanceTimersByTime(1001);

    expect(checkRateLimit(key, 1, 1000)).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterMs: 0,
    });
  });
});
