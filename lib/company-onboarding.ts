import { type RateType, type TaxType, type ZusType } from "@prisma/client";

export type CompanyOnboardingInput = {
  rateType: RateType;
  rateValue: number;
  workingHoursPerDay: number;
  taxType: TaxType;
  zusType: ZusType;
};

export type CompanyOnboardingValidationResult =
  | { ok: true; data: CompanyOnboardingInput }
  | { ok: false; message: string };

const RATE_TYPES: RateType[] = ["HOURLY", "DAILY"];
const TAX_TYPES: TaxType[] = ["RYCZALT", "LINIOWY", "SKALA"];
const ZUS_TYPES: ZusType[] = ["ULGA_NA_START", "MALY_ZUS_PLUS", "DUZY_ZUS"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRateType(value: unknown): value is RateType {
  return typeof value === "string" && RATE_TYPES.includes(value as RateType);
}

function isTaxType(value: unknown): value is TaxType {
  return typeof value === "string" && TAX_TYPES.includes(value as TaxType);
}

function isZusType(value: unknown): value is ZusType {
  return typeof value === "string" && ZUS_TYPES.includes(value as ZusType);
}

export function validateCompanyOnboardingInput(input: unknown): CompanyOnboardingValidationResult {
  if (!isRecord(input)) {
    return { ok: false, message: "Nieprawidłowe dane formularza" };
  }

  if (!isRateType(input.rateType)) {
    return { ok: false, message: "Wybierz poprawny typ stawki" };
  }

  const rateValue = Number(input.rateValue);
  if (!Number.isFinite(rateValue) || rateValue <= 0 || rateValue > 1_000_000) {
    return { ok: false, message: "Podaj poprawną wartość stawki" };
  }

  const workingHoursPerDay = Number(input.workingHoursPerDay);
  if (!Number.isInteger(workingHoursPerDay) || workingHoursPerDay < 1 || workingHoursPerDay > 24) {
    return { ok: false, message: "Liczba godzin dziennie musi być w zakresie 1-24" };
  }

  if (!isTaxType(input.taxType)) {
    return { ok: false, message: "Wybierz poprawną formę opodatkowania" };
  }

  if (!isZusType(input.zusType)) {
    return { ok: false, message: "Wybierz poprawny wariant składek ZUS" };
  }

  return {
    ok: true,
    data: {
      rateType: input.rateType,
      rateValue,
      workingHoursPerDay,
      taxType: input.taxType,
      zusType: input.zusType,
    },
  };
}
