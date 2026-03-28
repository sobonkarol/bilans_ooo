import { describe, expect, it } from "vitest";

import { validateCompanyOnboardingInput } from "@/lib/company-onboarding";

describe("company-onboarding validation", () => {
  it("akceptuje poprawne dane", () => {
    const result = validateCompanyOnboardingInput({
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

    expect(result).toEqual({
      ok: true,
      data: {
        rulesYear: 2026,
        rateType: "HOURLY",
        rateValue: 120,
        workingHoursPerDay: 8,
        taxType: "LINIOWY",
        ryczaltRate: null,
        zusType: "MALY_ZUS_PLUS",
        choroboweEnabled: false,
        choroboweMonthly: null,
      },
    });
  });

  it("odrzuca błędną wartość stawki", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: -1,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "MALY_ZUS_PLUS",
      choroboweEnabled: false,
      choroboweMonthly: null,
    });

    expect(result).toEqual({ ok: false, message: "Podaj poprawną wartość stawki" });
  });

  it("odrzuca błędny wariant ZUS", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: 100,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "INVALID",
      choroboweEnabled: false,
      choroboweMonthly: null,
    });

    expect(result).toEqual({ ok: false, message: "Wybierz poprawny wariant składek ZUS" });
  });

  it("wymaga poprawnej stawki przy ryczałcie", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: 100,
      workingHoursPerDay: 8,
      taxType: "RYCZALT",
      ryczaltRate: null,
      zusType: "DUZY_ZUS",
      choroboweEnabled: false,
      choroboweMonthly: null,
    });

    expect(result).toEqual({ ok: false, message: "Wybierz poprawną stawkę ryczałtu" });
  });

  it("wymaga kwoty gdy chorobowe jest włączone", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: 120,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "DUZY_ZUS",
      choroboweEnabled: true,
      choroboweMonthly: null,
    });

    expect(result).toEqual({ ok: false, message: "Podaj poprawną miesięczną kwotę chorobowego" });
  });

  it("blokuje chorobowe przy Uldze na start", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2026,
      rateType: "HOURLY",
      rateValue: 120,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "ULGA_NA_START",
      choroboweEnabled: true,
      choroboweMonthly: 50,
    });

    expect(result).toEqual({ ok: false, message: "Przy uldze na start chorobowe nie jest dostępne" });
  });

  it("odrzuca nieobsługiwany rok stawek", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2035,
      rateType: "HOURLY",
      rateValue: 120,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "DUZY_ZUS",
      choroboweEnabled: false,
      choroboweMonthly: null,
    });

    expect(result).toEqual({ ok: false, message: "Wybierz poprawny rok stawek" });
  });

  it("odrzuca za niską stawkę dzienną", () => {
    const result = validateCompanyOnboardingInput({
      rulesYear: 2026,
      rateType: "DAILY",
      rateValue: 6,
      workingHoursPerDay: 8,
      taxType: "LINIOWY",
      ryczaltRate: null,
      zusType: "DUZY_ZUS",
      choroboweEnabled: false,
      choroboweMonthly: null,
    });

    expect(result).toEqual({ ok: false, message: "Stawka dzienna nie może być niższa niż liczba godzin pracy" });
  });
});
