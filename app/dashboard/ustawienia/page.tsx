import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CompanySettingsForm } from "@/app/dashboard/components/company-settings-form";
import { DEFAULT_RULE_YEAR } from "@/lib/finance-rules";

export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({ where: { userId: session.user.id } });

  const companyRecord = company as Record<string, unknown> | null;

  const rateType = companyRecord?.rateType === "DAILY" ? "DAILY" : "HOURLY";
  const rateValue = typeof companyRecord?.rateValue === "number" ? companyRecord.rateValue : undefined;
  const workingHoursPerDay =
    typeof companyRecord?.workingHoursPerDay === "number" ? companyRecord.workingHoursPerDay : 8;
  const taxType =
    companyRecord?.taxType === "RYCZALT" || companyRecord?.taxType === "LINIOWY" ? companyRecord.taxType : "SKALA";
  const ryczaltRate = typeof companyRecord?.ryczaltRate === "number" ? companyRecord.ryczaltRate : undefined;
  const zusType =
    companyRecord?.zusType === "ULGA_NA_START" || companyRecord?.zusType === "MALY_ZUS_PLUS"
      ? companyRecord.zusType
      : "DUZY_ZUS";
  const choroboweEnabled =
    typeof companyRecord?.choroboweEnabled === "boolean" ? companyRecord.choroboweEnabled : false;
  const choroboweMonthly =
    typeof companyRecord?.choroboweMonthly === "number" ? companyRecord.choroboweMonthly : undefined;
  const rulesYear = typeof companyRecord?.rulesYear === "number" ? companyRecord.rulesYear : DEFAULT_RULE_YEAR;

  return (
    <section className="mx-auto w-full max-w-4xl">
      <h1 className="text-3xl font-bold text-(--text-strong)">Ustawienia profilu</h1>
      <p className="mt-2 text-sm text-(--text-muted)">
        Zmień parametry składek i podatków. Te ustawienia wpływają na wyliczenia w dashboardzie.
      </p>

      <div className="mt-6 rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5">
        <CompanySettingsForm
          submitLabel="Zapisz ustawienia"
          initialValues={{
            rateType,
            rateValue,
            workingHoursPerDay,
            taxType,
            ryczaltRate,
            zusType,
            choroboweEnabled,
            choroboweMonthly,
            rulesYear,
          }}
        />
      </div>
    </section>
  );
}
