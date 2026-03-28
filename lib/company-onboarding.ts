import {
  DEFAULT_RULE_YEAR,
  RYCZALT_RATES,
  getFinanceRules,
  isSupportedRulesYear,
  type RateType,
  type TaxType,
  type ZusType,
} from "@/lib/finance-rules";

export type CompanyOnboardingInput = {
  rulesYear: number;
  rateType: RateType;
  rateValue: number;
  workingHoursPerDay: number;
  taxType: TaxType;
  ryczaltRate: number | null;
  zusType: ZusType;
  choroboweEnabled: boolean;
  choroboweMonthly: number | null;
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

function isRyczaltRate(value: unknown): value is number {
  return typeof value === "number" && RYCZALT_RATES.includes(value as (typeof RYCZALT_RATES)[number]);
}

export function validateCompanyOnboardingInput(input: unknown): CompanyOnboardingValidationResult {
  if (!isRecord(input)) {
    return { ok: false, message: "Nieprawidłowe dane formularza" };
  }

  const parsedRulesYear = Number(input.rulesYear);
  const rulesYear = parsedRulesYear || DEFAULT_RULE_YEAR;
  if (!isSupportedRulesYear(rulesYear)) {
    return { ok: false, message: "Wybierz poprawny rok stawek" };
  }

  const rules = getFinanceRules(rulesYear);

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

  if (input.rateType === "DAILY" && rateValue < workingHoursPerDay) {
    return { ok: false, message: "Stawka dzienna nie może być niższa niż liczba godzin pracy" };
  }

  if (!isTaxType(input.taxType)) {
    return { ok: false, message: "Wybierz poprawną formę opodatkowania" };
  }

  let ryczaltRate: number | null = null;
  if (input.taxType === "RYCZALT") {
    const parsedRate = Number(input.ryczaltRate);
    if (!Number.isFinite(parsedRate) || !isRyczaltRate(parsedRate)) {
      return { ok: false, message: "Wybierz poprawną stawkę ryczałtu" };
    }

    ryczaltRate = parsedRate;
  }

  if (!isZusType(input.zusType)) {
    return { ok: false, message: "Wybierz poprawny wariant składek ZUS" };
  }

  if (typeof input.choroboweEnabled !== "boolean") {
    return { ok: false, message: "Wybierz, czy opłacasz dobrowolne chorobowe" };
  }

  let choroboweMonthly: number | null = null;
  if (input.choroboweEnabled) {
    if (input.zusType === "ULGA_NA_START") {
      return { ok: false, message: "Przy uldze na start chorobowe nie jest dostępne" };
    }

    const parsedChorobowe = Number(input.choroboweMonthly);
    const maxAllowedChorobowe = Number(
      ((rules.defaultChoroboweBaseByZus[input.zusType] * rules.choroboweRatePercent) / 100).toFixed(2)
    );
    if (
      !Number.isFinite(parsedChorobowe) ||
      parsedChorobowe <= 0 ||
      parsedChorobowe > Math.max(maxAllowedChorobowe * 5, 500)
    ) {
      return { ok: false, message: "Podaj poprawną miesięczną kwotę chorobowego" };
    }

    choroboweMonthly = parsedChorobowe;
  }

  return {
    ok: true,
    data: {
      rulesYear,
      rateType: input.rateType,
      rateValue,
      workingHoursPerDay,
      taxType: input.taxType,
      ryczaltRate,
      zusType: input.zusType,
      choroboweEnabled: input.choroboweEnabled,
      choroboweMonthly,
    },
  };
}
