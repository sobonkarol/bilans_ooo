import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CompanySettingsForm } from "@/app/dashboard/components/company-settings-form";

export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: {
      rateType: true,
      rateValue: true,
      workingHoursPerDay: true,
      taxType: true,
      zusType: true,
    },
  });

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
            rateType: company?.rateType ?? "HOURLY",
            rateValue: company?.rateValue ?? undefined,
            workingHoursPerDay: company?.workingHoursPerDay ?? 8,
            taxType: company?.taxType ?? "SKALA",
            zusType: company?.zusType ?? "DUZY_ZUS",
          }}
        />
      </div>
    </section>
  );
}
