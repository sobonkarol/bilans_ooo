"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { CompanySettingsForm, type CompanySettingsFormValues } from "@/app/dashboard/components/company-settings-form";

type OnboardingModalProps = {
  isCompleted: boolean;
  initialValues?: CompanySettingsFormValues;
};

export function OnboardingModal({ isCompleted, initialValues }: OnboardingModalProps) {
  const [open, setOpen] = useState(!isCompleted);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 px-3 py-6 backdrop-blur-sm sm:px-6 sm:py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f1512] shadow-[0_32px_100px_rgba(0,0,0,0.55)] lg:grid-cols-[1.05fr_1.45fr]"
      >
        <aside className="relative border-b border-white/10 bg-[radial-gradient(1200px_500px_at_10%_-10%,rgba(95,219,165,0.28),transparent_60%),linear-gradient(180deg,#13201b_0%,#0f1512_100%)] p-6 lg:border-r lg:border-b-0 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#d8efe4]">
            <Sparkles className="h-3.5 w-3.5" />
            Start konfiguracji
          </div>

          <h2 id="onboarding-title" className="mt-5 text-3xl font-semibold leading-tight text-white">
            Ustaw firmę raz,
            <br />
            licz bilans automatycznie
          </h2>
          <p id="onboarding-description" className="mt-3 max-w-md text-sm text-[#b7d2c4]">
            Potrzebujemy kilku danych o stawce, podatkach i ZUS. Dzięki temu dashboard pokaże realny wynik netto
            miesiąca.
          </p>

          <div className="mt-7 space-y-3 text-sm text-[#c8e0d5]">
            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <TrendingUp className="mt-0.5 h-4 w-4" />
              <p>Inteligentne estymacje przychodu i podatku na podstawie Twojego modelu rozliczeń.</p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <p>Dane zapisują się do Twojego profilu i możesz je zmienić w każdej chwili w Ustawieniach.</p>
            </div>
          </div>
        </aside>

        <section className="bg-(--bg-elevated) p-5 sm:p-7">
          <CompanySettingsForm
            initialValues={initialValues}
            submitLabel="Zapisz i przejdź do dashboardu"
            onSuccess={() => setOpen(false)}
          />
        </section>
      </div>
    </div>
  );
}
