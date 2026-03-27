"use client";

import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold text-(--text-strong)">Dokończ konfigurację firmy</h2>
        <p className="mt-2 text-sm text-(--text-muted)">
          Uzupełnij ustawienia składek i podatków. Ten krok jest wymagany, aby poprawnie wyliczać Twój bilans.
        </p>

        <div className="mt-6">
          <CompanySettingsForm
            initialValues={initialValues}
            submitLabel="Zapisz i przejdź do dashboardu"
            onSuccess={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
