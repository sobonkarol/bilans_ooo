export type RateType = "HOURLY" | "DAILY";
export type TaxType = "RYCZALT" | "LINIOWY" | "SKALA";
export type ZusType = "ULGA_NA_START" | "MALY_ZUS_PLUS" | "DUZY_ZUS";

export const RYCZALT_RATES = [2, 3, 5.5, 8.5, 10, 12, 12.5, 14, 15, 17] as const;

export type FinanceRules = {
  year: number;
  workingDaysInMonth: number;
  choroboweRatePercent: number;
  taxRateByType: Record<Exclude<TaxType, "RYCZALT">, number>;
  zusEstimateByType: Record<ZusType, number>;
  defaultChoroboweBaseByZus: Record<ZusType, number>;
};

const RULES_BY_YEAR: Record<number, FinanceRules> = {
  2026: {
    year: 2026,
    workingDaysInMonth: 22,
    choroboweRatePercent: 2.45,
    taxRateByType: {
      SKALA: 0.12,
      LINIOWY: 0.19,
    },
    zusEstimateByType: {
      ULGA_NA_START: 420,
      MALY_ZUS_PLUS: 980,
      DUZY_ZUS: 1780,
    },
    defaultChoroboweBaseByZus: {
      ULGA_NA_START: 0,
      MALY_ZUS_PLUS: 1441.8,
      DUZY_ZUS: 5652,
    },
  },
};

export const SUPPORTED_RULE_YEARS = Object.keys(RULES_BY_YEAR)
  .map((year) => Number(year))
  .sort((a, b) => a - b);

export const DEFAULT_RULE_YEAR = 2026;

export function isSupportedRulesYear(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && SUPPORTED_RULE_YEARS.includes(value);
}

export function resolveRulesYear(value: unknown): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && RULES_BY_YEAR[parsed]) {
    return parsed;
  }

  return DEFAULT_RULE_YEAR;
}

export function getFinanceRules(year: unknown): FinanceRules {
  return RULES_BY_YEAR[resolveRulesYear(year)];
}
