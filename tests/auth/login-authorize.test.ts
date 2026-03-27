import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, checkRateLimitMock, compareMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  compareMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/auth-rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/auth-logger", () => ({
  logAuth: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
    hash: vi.fn(),
  },
  compare: compareMock,
  hash: vi.fn(),
}));

import { authorizeCredentials } from "@/lib/auth-login";

describe("auth credentials authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockReturnValue({
      allowed: true,
      remaining: 1,
      retryAfterMs: 0,
    });
  });

  it("zwraca użytkownika dla poprawnych danych", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user_1",
      email: "john@example.com",
      name: "John",
      image: null,
      password: "hashed-password",
    });
    compareMock.mockResolvedValue(true);

    const result = await authorizeCredentials(
      { email: "john@example.com", password: "password1234" },
      { "x-forwarded-for": "203.0.113.8" }
    );

    expect(result).toMatchObject({
      id: "user_1",
      email: "john@example.com",
      name: "John",
    });
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: "john@example.com" } });
    expect(compareMock).toHaveBeenCalled();
  });

  it("zwraca null dla błędnego hasła", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user_1",
      email: "john@example.com",
      name: "John",
      image: null,
      password: "hashed-password",
    });
    compareMock.mockResolvedValue(false);

    const result = await authorizeCredentials(
      { email: "john@example.com", password: "password1234" },
      { "x-forwarded-for": "203.0.113.8" }
    );

    expect(result).toBeNull();
  });

  it("rzuca TOO_MANY_ATTEMPTS gdy limiter blokuje login", async () => {
    checkRateLimitMock
      .mockReturnValueOnce({ allowed: false, remaining: 0, retryAfterMs: 120000 })
      .mockReturnValueOnce({ allowed: true, remaining: 20, retryAfterMs: 0 });

    await expect(
      authorizeCredentials(
        { email: "john@example.com", password: "password1234" },
        { "x-forwarded-for": "203.0.113.8" }
      )
    ).rejects.toThrow("TOO_MANY_ATTEMPTS");
  });
});
