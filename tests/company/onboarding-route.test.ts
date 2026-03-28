import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, upsertMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  default: vi.fn(() => vi.fn()),
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      upsert: upsertMock,
    },
  },
}));

import { POST } from "@/app/api/company/onboarding/route";

function createJsonRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/company/onboarding", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/company/onboarding", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("zwraca 401, gdy użytkownik nie jest zalogowany", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const res = await POST(
      createJsonRequest({
        rulesYear: 2026,
        rateType: "HOURLY",
        rateValue: 120,
        workingHoursPerDay: 8,
        taxType: "LINIOWY",
        ryczaltRate: null,
        zusType: "MALY_ZUS_PLUS",
        choroboweEnabled: false,
        choroboweMonthly: null,
      })
    );

    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("zwraca 400 dla uszkodzonego JSON", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user_1" } });

    const req = new NextRequest("http://localhost:3000/api/company/onboarding", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{invalid-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("zwraca 400 dla danych nieprzechodzących walidacji", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user_1" } });

    const res = await POST(
      createJsonRequest({
        rulesYear: 2026,
        rateType: "HOURLY",
        rateValue: -10,
        workingHoursPerDay: 8,
        taxType: "LINIOWY",
        ryczaltRate: null,
        zusType: "MALY_ZUS_PLUS",
        choroboweEnabled: false,
        choroboweMonthly: null,
      })
    );

    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toBe("Podaj poprawną wartość stawki");
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("zapisuje onboarding i zwraca 200 dla poprawnych danych", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user_1" } });
    upsertMock.mockResolvedValue({
      id: "company_1",
      userId: "user_1",
      onboardingCompleted: true,
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: 120,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "MALY_ZUS_PLUS",
      choroboweEnabled: false,
      choroboweMonthly: null,
    });

    const payload = {
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: 120,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "MALY_ZUS_PLUS",
      choroboweEnabled: false,
      choroboweMonthly: null,
    };

    const res = await POST(createJsonRequest(payload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Ustawienia firmy zostały zapisane");
    expect(upsertMock).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      create: {
        userId: "user_1",
        ...payload,
        onboardingCompleted: true,
      },
      update: {
        ...payload,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        userId: true,
        onboardingCompleted: true,
        rulesYear: true,
        rateType: true,
        rateValue: true,
        workingHoursPerDay: true,
        taxType: true,
        ryczaltRate: true,
        zusType: true,
        choroboweEnabled: true,
        choroboweMonthly: true,
      },
    });
  });

  it("zwraca 500 gdy zapis do bazy rzuca wyjątek", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user_1" } });
    upsertMock.mockRejectedValue(new Error("db error"));

    const res = await POST(
      createJsonRequest({
        rulesYear: 2026,
        rateType: "HOURLY",
        rateValue: 120,
        workingHoursPerDay: 8,
        taxType: "LINIOWY",
        ryczaltRate: null,
        zusType: "MALY_ZUS_PLUS",
        choroboweEnabled: false,
        choroboweMonthly: null,
      })
    );

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[company-onboarding][POST]",
      expect.objectContaining({
        requestId: expect.any(String),
        error: expect.any(Error),
      })
    );
  });
});
