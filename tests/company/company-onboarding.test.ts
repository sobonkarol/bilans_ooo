import { describe, expect, it } from "vitest";

import { validateCompanyOnboardingInput } from "@/lib/company-onboarding";

describe("company-onboarding validation", () => {
  it("akceptuje poprawne dane", () => {
    const result = validateCompanyOnboardingInput({
      rateType: "HOURLY",
      rateValue: 120,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      zusType: "MALY_ZUS_PLUS",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        rateType: "HOURLY",
        rateValue: 120,
        workingHoursPerDay: 8,
        taxType: "LINIOWY",
        zusType: "MALY_ZUS_PLUS",
      },
    });
  });

  it("odrzuca błędną wartość stawki", () => {
    const result = validateCompanyOnboardingInput({
      rateType: "HOURLY",
      rateValue: -1,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      zusType: "MALY_ZUS_PLUS",
    });

    expect(result).toEqual({ ok: false, message: "Podaj poprawną wartość stawki" });
  });

  it("odrzuca błędny wariant ZUS", () => {
    const result = validateCompanyOnboardingInput({
      rateType: "HOURLY",
      rateValue: 100,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      zusType: "INVALID",
    });

    expect(result).toEqual({ ok: false, message: "Wybierz poprawny wariant składek ZUS" });
  });
});
