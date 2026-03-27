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

  it("zwraca null dla nieprawidłowych danych wejściowych", async () => {
    await expect(authorizeCredentials(null, { "x-forwarded-for": "203.0.113.8" })).resolves.toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("zwraca null gdy prisma rzuca wyjątek", async () => {
    findUniqueMock.mockRejectedValue(new Error("db error"));

    await expect(
      authorizeCredentials(
        { email: "john@example.com", password: "password1234" },
        { "x-real-ip": "203.0.113.9" }
      )
    ).resolves.toBeNull();
  });

  it("obsługuje x-forwarded-for jako tablicę i brak usera bez hasła", async () => {
    findUniqueMock.mockResolvedValue(null);
    compareMock.mockResolvedValue(false);

    await expect(
      authorizeCredentials(
        { email: "john@example.com", password: "password1234" },
        { "x-forwarded-for": ["203.0.113.8, 10.0.0.1"] }
      )
    ).resolves.toBeNull();
  });

  it("obsługuje brak nagłówków i x-real-ip jako tablicę", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user_2",
      email: "john@example.com",
      name: "John",
      image: null,
      password: "hashed-password",
    });
    compareMock.mockResolvedValue(true);

    await expect(
      authorizeCredentials(
        { email: "john@example.com", password: "password1234" },
        { "x-real-ip": ["203.0.113.9"] }
      )
    ).resolves.toMatchObject({ id: "user_2" });

    await expect(
      authorizeCredentials({ email: "john@example.com", password: "password1234" })
    ).resolves.toMatchObject({ id: "user_2" });
  });
});
