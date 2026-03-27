import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, createMock, hashMock, checkRateLimitMock, checkPasswordPwnedMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  hashMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  checkPasswordPwnedMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: hashMock,
  },
}));

vi.mock("@/lib/auth-rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock("@/lib/password-breach", () => ({
  checkPasswordPwned: checkPasswordPwnedMock,
}));

vi.mock("@/lib/auth-logger", () => ({
  logAuth: vi.fn(),
}));

import { POST } from "@/app/api/auth/register/route";

function createJsonRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.10",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    checkRateLimitMock.mockReturnValue({
      allowed: true,
      remaining: 1,
      retryAfterMs: 0,
    });

    checkPasswordPwnedMock.mockResolvedValue({
      checked: true,
      pwned: false,
      count: 0,
    });
  });

  it("zwraca 201 dla poprawnej rejestracji", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed-password");
    createMock.mockResolvedValue({
      id: "user_1",
      email: "john@example.com",
      name: "John",
    });

    const res = await POST(
      createJsonRequest({
        email: "john@example.com",
        password: "password1234",
        name: "John",
      })
    );

    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.user).toMatchObject({ email: "john@example.com", name: "John" });
    expect(hashMock).toHaveBeenCalledWith("password1234", 12);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        email: "john@example.com",
        name: "John",
        password: "hashed-password",
      },
    });
  });

  it("zwraca 409 gdy użytkownik już istnieje", async () => {
    findUniqueMock.mockResolvedValue({ id: "existing_user" });

    const res = await POST(
      createJsonRequest({
        email: "john@example.com",
        password: "password1234",
        name: "John",
      })
    );

    expect(res.status).toBe(409);
  });

  it("zwraca 429 gdy limiter blokuje", async () => {
    checkRateLimitMock
      .mockReturnValueOnce({ allowed: false, remaining: 0, retryAfterMs: 60000 })
      .mockReturnValueOnce({ allowed: true, remaining: 1, retryAfterMs: 0 });

    const res = await POST(
      createJsonRequest({
        email: "john@example.com",
        password: "password1234",
        name: "John",
      })
    );

    expect(res.status).toBe(429);
  });

  it("zwraca 400 dla hasła z wycieku", async () => {
    checkPasswordPwnedMock.mockResolvedValue({
      checked: true,
      pwned: true,
      count: 42,
    });

    const res = await POST(
      createJsonRequest({
        email: "john@example.com",
        password: "password1234",
        name: "John",
      })
    );

    expect(res.status).toBe(400);
  });

  it("zwraca 400 dla uszkodzonego JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{invalid-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
