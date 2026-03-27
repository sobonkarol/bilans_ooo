"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type CompanyOnboardingInput } from "@/lib/company-onboarding";

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

const RATE_TYPE_OPTIONS = [
  { value: "HOURLY", label: "Stawka godzinowa" },
  { value: "DAILY", label: "Stawka dzienna" },
] as const;

export function CompanySettingsForm({ initialValues, submitLabel, onSuccess }: CompanySettingsFormProps) {
  const router = useRouter();
  const [rateType, setRateType] = useState(initialValues?.rateType ?? "HOURLY");
  const [rateValue, setRateValue] = useState(String(initialValues?.rateValue ?? ""));
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(String(initialValues?.workingHoursPerDay ?? 8));
  const [taxType, setTaxType] = useState(initialValues?.taxType ?? "SKALA");
  const [zusType, setZusType] = useState(initialValues?.zusType ?? "DUZY_ZUS");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/company/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          rateType,
          rateValue: Number(rateValue),
          workingHoursPerDay: Number(workingHoursPerDay),
          taxType,
          zusType,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-(--text-muted)">Forma opodatkowania</span>
          <select
            value={taxType}
            onChange={(e) => setTaxType(e.target.value as typeof taxType)}
            className="w-full rounded-lg border border-(--surface-border) bg-(--bg-elevated) px-3 py-2 text-(--text-strong)"
          >
            {TAX_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-(--text-muted)">Wariant ZUS</span>
          <select
            value={zusType}
            onChange={(e) => setZusType(e.target.value as typeof zusType)}
            className="w-full rounded-lg border border-(--surface-border) bg-(--bg-elevated) px-3 py-2 text-(--text-strong)"
          >
            {ZUS_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-(--text-muted)">Typ stawki</span>
          <select
            value={rateType}
            onChange={(e) => setRateType(e.target.value as typeof rateType)}
            className="w-full rounded-lg border border-(--surface-border) bg-(--bg-elevated) px-3 py-2 text-(--text-strong)"
          >
            {RATE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-(--text-muted)">Wartość stawki (PLN)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
            required
            className="w-full rounded-lg border border-(--surface-border) bg-(--bg-elevated) px-3 py-2 text-(--text-strong)"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-(--text-muted)">Godzin pracy dziennie</span>
          <input
            type="number"
            min="1"
            max="24"
            step="1"
            value={workingHoursPerDay}
            onChange={(e) => setWorkingHoursPerDay(e.target.value)}
            required
            className="w-full rounded-lg border border-(--surface-border) bg-(--bg-elevated) px-3 py-2 text-(--text-strong)"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-500">{success}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:bg-(--accent-hover) disabled:opacity-60"
      >
        {isSaving ? "Zapisywanie..." : submitLabel}
      </button>
    </form>
  );
}
