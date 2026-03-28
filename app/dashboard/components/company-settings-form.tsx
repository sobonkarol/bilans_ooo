"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, CheckCircle2, Info, Landmark, ShieldPlus, Wallet } from "lucide-react";
import { type CompanyOnboardingInput } from "@/lib/company-onboarding";
import { DEFAULT_RULE_YEAR, SUPPORTED_RULE_YEARS, getFinanceRules } from "@/lib/finance-rules";

export type CompanySettingsFormValues = Partial<CompanyOnboardingInput>;

type CompanySettingsFormProps = {
  initialValues?: CompanySettingsFormValues;
  submitLabel: string;
  onSuccess?: () => void;
};

const TAX_TYPE_OPTIONS = [
  { value: "SKALA", label: "Skala podatkowa" },
  { value: "LINIOWY", label: "Podatek liniowy" },
  { value: "RYCZALT", label: "Ryczałt" },
] as const;

const ZUS_TYPE_OPTIONS = [
  { value: "ULGA_NA_START", label: "Ulga na start" },
  { value: "MALY_ZUS_PLUS", label: "Mały ZUS Plus" },
  { value: "DUZY_ZUS", label: "Duży ZUS" },
] as const;

const BILLING_UNIT_OPTIONS = [
  { value: "HOURLY", label: "Godz." },
  { value: "DAILY", label: "Dzień" },
] as const;

const RYCZALT_RATE_OPTIONS = [
  { value: 2, label: "2%" },
  { value: 3, label: "3%" },
  { value: 5.5, label: "5,5%" },
  { value: 8.5, label: "8,5%" },
  { value: 10, label: "10%" },
  { value: 12, label: "12%" },
  { value: 12.5, label: "12,5%" },
  { value: 14, label: "14%" },
  { value: 15, label: "15%" },
  { value: 17, label: "17%" },
] as const;

const fieldClass =
  "h-11 w-full rounded-xl border border-(--surface-border) bg-(--bg-elevated) px-3 text-(--text-strong) transition outline-none focus:border-(--accent) focus:shadow-[0_0_0_2px_color-mix(in_oklab,var(--accent)_14%,transparent)]";

function formatRate(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value.toFixed(2));
}

function convertRate(
  currentUnit: "HOURLY" | "DAILY",
  nextUnit: "HOURLY" | "DAILY",
  value: string,
  hoursPerDay: string
): string {
  const parsedValue = Number(value);
  const parsedHours = Number(hoursPerDay);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return value;
  }

  if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
    return value;
  }

  if (currentUnit === nextUnit) {
    return value;
  }

  const converted = currentUnit === "HOURLY" ? parsedValue * parsedHours : parsedValue / parsedHours;
  return formatRate(converted);
}

export function CompanySettingsForm({ initialValues, submitLabel, onSuccess }: CompanySettingsFormProps) {
  const router = useRouter();
  const [rulesYear, setRulesYear] = useState(initialValues?.rulesYear ?? DEFAULT_RULE_YEAR);
  const [rateType, setRateType] = useState(initialValues?.rateType ?? "HOURLY");
  const [rateValue, setRateValue] = useState(String(initialValues?.rateValue ?? ""));
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(String(initialValues?.workingHoursPerDay ?? 8));
  const [taxType, setTaxType] = useState(initialValues?.taxType ?? "SKALA");
  const [ryczaltRate, setRyczaltRate] = useState(String(initialValues?.ryczaltRate ?? 8.5));
  const [zusType, setZusType] = useState(initialValues?.zusType ?? "DUZY_ZUS");
  const [choroboweEnabled, setChoroboweEnabled] = useState(initialValues?.choroboweEnabled ?? false);
  const rules = useMemo(() => getFinanceRules(rulesYear), [rulesYear]);
  const [choroboweBase, setChoroboweBase] = useState(() => {
    const initialRules = getFinanceRules(initialValues?.rulesYear ?? DEFAULT_RULE_YEAR);
    if (!initialValues?.choroboweEnabled) {
      return String(initialRules.defaultChoroboweBaseByZus[initialValues?.zusType ?? "DUZY_ZUS"]);
    }

    if (typeof initialValues?.choroboweMonthly === "number" && initialValues.choroboweMonthly > 0) {
      return String(Number((initialValues.choroboweMonthly / (initialRules.choroboweRatePercent / 100)).toFixed(2)));
    }

    return String(initialRules.defaultChoroboweBaseByZus[initialValues?.zusType ?? "DUZY_ZUS"]);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const choroboweMonthly = useMemo(() => {
    const base = Number(choroboweBase);
    if (!Number.isFinite(base) || base <= 0) {
      return 0;
    }

    return Number(((base * rules.choroboweRatePercent) / 100).toFixed(2));
  }, [choroboweBase, rules.choroboweRatePercent]);

  function validateBeforeSubmit(): string | null {
    const parsedRateValue = Number(rateValue);
    const parsedHours = Number(workingHoursPerDay);
    const parsedBase = Number(choroboweBase);

    if (!Number.isFinite(parsedRateValue) || parsedRateValue <= 0) {
      return "Podaj poprawną wartość stawki.";
    }

    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 24) {
      return "Liczba godzin dziennie musi być w zakresie 1-24.";
    }

    if (rateType === "DAILY" && parsedRateValue < parsedHours) {
      return "Stawka dzienna nie może być niższa niż liczba godzin pracy.";
    }

    if (taxType === "RYCZALT") {
      const parsedRyczaltRate = Number(ryczaltRate);
      if (!Number.isFinite(parsedRyczaltRate)) {
        return "Wybierz poprawną stawkę ryczałtu.";
      }
    }

    if (choroboweEnabled) {
      if (zusType === "ULGA_NA_START") {
        return "Przy uldze na start chorobowe nie jest dostępne.";
      }

      if (!Number.isFinite(parsedBase) || parsedBase <= 0) {
        return "Podaj poprawną podstawę chorobowego.";
      }
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/company/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          rulesYear,
          rateType,
          rateValue: Number(rateValue),
          workingHoursPerDay: Number(workingHoursPerDay),
          taxType,
          ryczaltRate: taxType === "RYCZALT" ? Number(ryczaltRate) : null,
          zusType,
          choroboweEnabled,
          choroboweMonthly: choroboweEnabled ? choroboweMonthly : null,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(payload.message ?? "Nie udało się zapisać ustawień.");
        return;
      }

      setSuccess("Ustawienia zapisane.");
      onSuccess?.();
      router.refresh();
    } catch {
      setError("Wystąpił błąd sieci. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-(--surface-border) bg-(--bg-soft) p-4 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-(--accent-soft) p-2 text-(--accent)">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-semibold text-(--text-strong)">Stawka i sposób pracy</p>
            <p className="text-sm text-(--text-muted)">Nowoczesny skrót konfiguracji. Wszystkie wartości stawek podajesz netto.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-(--text-muted)">Rok stawek</span>
              <select
                value={rulesYear}
                onChange={(e) => {
                  const nextRulesYear = Number(e.target.value);
                  const nextRules = getFinanceRules(nextRulesYear);
                  setRulesYear(nextRulesYear);
                  setChoroboweBase(String(nextRules.defaultChoroboweBaseByZus[zusType]));
                }}
                className={fieldClass}
              >
                {SUPPORTED_RULE_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-(--text-muted)">Godzin pracy dziennie</span>
              <input
                type="number"
                min="1"
                max="24"
                step="1"
                value={workingHoursPerDay}
                onChange={(e) => {
                  const nextHours = e.target.value;
                  const converted = convertRate(rateType, rateType, rateValue, nextHours);
                  setWorkingHoursPerDay(nextHours);
                  setRateValue(converted);
                }}
                required
                className={fieldClass}
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-(--text-muted)">Stawka netto (PLN)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rateValue}
                onChange={(e) => setRateValue(e.target.value)}
                required
                className={fieldClass}
              />
            </label>

            <div className="text-sm">
              <span className="mb-1.5 block text-(--text-muted)">Typ stawki</span>
              <div className="grid h-11 grid-cols-2 rounded-xl border border-(--surface-border) bg-(--bg-elevated) p-1">
                {BILLING_UNIT_OPTIONS.map((option) => {
                  const active = rateType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const converted = convertRate(rateType, option.value, rateValue, workingHoursPerDay);
                        setRateType(option.value);
                        setRateValue(converted);
                      }}
                      className={`rounded-lg px-3 text-sm font-medium transition ${
                        active
                          ? "bg-(--accent) text-white"
                          : "text-(--text-muted) hover:bg-(--bg-soft) hover:text-(--text-strong)"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-(--text-muted)">
              Przełączenie typu stawki automatycznie konwertuje wartość między godziną i dniem.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-(--surface-border) bg-(--bg-soft) p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-xl bg-(--accent-soft) p-2 text-(--accent)">
            <Landmark className="h-4 w-4" />
          </div>
          <p className="text-base font-semibold text-(--text-strong)">Podatki i składki</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm md:col-span-1">
            <span className="mb-1 block text-(--text-muted)">Forma opodatkowania</span>
            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value as typeof taxType)}
              className={fieldClass}
            >
              {TAX_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {taxType === "RYCZALT" ? (
            <label className="block text-sm md:col-span-1">
              <span className="mb-1 block text-(--text-muted)">Stawka ryczałtu</span>
              <select
                value={ryczaltRate}
                onChange={(e) => setRyczaltRate(e.target.value)}
                className={fieldClass}
              >
                {RYCZALT_RATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="hidden md:block" />
          )}

          <label className="block text-sm md:col-span-1">
            <span className="mb-1 block text-(--text-muted)">Wariant ZUS</span>
            <select
              value={zusType}
              onChange={(e) => {
                const nextZusType = e.target.value as typeof zusType;
                setZusType(nextZusType);
                setChoroboweBase(String(rules.defaultChoroboweBaseByZus[nextZusType]));

                if (nextZusType === "ULGA_NA_START") {
                  setChoroboweEnabled(false);
                }
              }}
              className={fieldClass}
            >
              {ZUS_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-(--text-strong)">
                <ShieldPlus className="h-4 w-4 text-(--accent)" />
                Dobrowolne chorobowe
                <span
                  className="inline-flex items-center text-(--text-muted)"
                  title={`Składka chorobowa liczona jest jako ${rules.choroboweRatePercent}% podstawy wymiaru (zgodnie z zasadami ZUS).`}
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-(--text-muted)">
                Zaznacz, czy opłacasz składkę chorobową. Kwota wylicza się automatycznie jako {rules.choroboweRatePercent}% podstawy.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChoroboweEnabled(true)}
                aria-pressed={choroboweEnabled}
                disabled={zusType === "ULGA_NA_START"}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  choroboweEnabled
                    ? "bg-(--accent) text-white shadow"
                    : "border border-(--surface-border) bg-(--bg-soft) text-(--text-muted) hover:text-(--text-strong)"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Tak, opłacam
              </button>

              <button
                type="button"
                onClick={() => setChoroboweEnabled(false)}
                aria-pressed={!choroboweEnabled}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  !choroboweEnabled
                    ? "bg-(--accent) text-white shadow"
                    : "border border-(--surface-border) bg-(--bg-soft) text-(--text-muted) hover:text-(--text-strong)"
                }`}
              >
                Nie opłacam
              </button>
            </div>
          </div>

          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-(--text-muted)">Podstawa chorobowego (PLN)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={choroboweBase}
              onChange={(e) => setChoroboweBase(e.target.value)}
              disabled={!choroboweEnabled}
              className={`${fieldClass} bg-(--bg-soft) disabled:cursor-not-allowed disabled:opacity-55`}
            />
          </label>

          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-(--text-muted)">Miesięczna kwota chorobowego (PLN, auto)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={choroboweEnabled ? choroboweMonthly : 0}
              readOnly
              disabled={!choroboweEnabled}
              className={`${fieldClass} bg-(--bg-soft) disabled:cursor-not-allowed disabled:opacity-55`}
            />
          </label>

          {zusType === "ULGA_NA_START" ? (
            <p className="mt-2 text-xs text-(--text-muted)">
              Przy &quot;Uldze na start&quot; nie opłaca się składek społecznych, więc chorobowe jest niedostępne.
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-(--surface-border) bg-(--bg-elevated) px-3 py-2">
          <p className="flex items-center gap-2 text-xs text-(--text-muted)">
            <Wallet className="h-4 w-4" />
            Ryczałt i ZUS wpływają bezpośrednio na estymację netto na dashboardzie.
          </p>
        </div>
      </section>

      {error ? <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}
      {success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-(--accent) px-6 text-sm font-semibold text-white transition hover:bg-(--accent-hover) sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Zapisywanie..." : submitLabel}
      </button>
    </form>
  );
}
