import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { estimateMonthlyFinance } from "@/lib/finance-estimator";
import { prisma } from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: {
      rateType: true,
      rateValue: true,
      workingHoursPerDay: true,
      taxType: true,
      zusType: true,
      onboardingCompleted: true,
      transactions: {
        where: {
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        select: {
          amount: true,
          type: true,
        },
      },
      subscriptions: {
        select: {
          amount: true,
          cycle: true,
        },
      },
    },
  });

  if (!company) {
    return (
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold text-(--text-strong)">Główny bilans</h1>
        <div className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-6">
          <p className="text-(--text-muted)">
            Nie znaleziono profilu firmy. Uzupełnij onboarding, aby rozpocząć wyliczenia.
          </p>
        </div>
      </section>
    );
  }

  const summary = estimateMonthlyFinance(
    {
      rateType: company.rateType,
      rateValue: company.rateValue,
      workingHoursPerDay: company.workingHoursPerDay,
      taxType: company.taxType,
      zusType: company.zusType,
    },
    company.transactions,
    company.subscriptions
  );

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-(--text-strong)">Główny bilans</h1>
        <p className="text-sm text-(--text-muted)">
          Miesiąc: {now.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
        </p>
      </div>

      {!company.onboardingCompleted ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Aby uzyskać dokładniejsze wyliczenia, dokończ onboarding w sekcji Ustawienia.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5">
          <p className="text-sm text-(--text-muted)">Przychód miesięczny (est.)</p>
          <p className="mt-2 text-2xl font-semibold text-(--text-strong)">
            {formatCurrency(summary.estimatedRevenue)}
          </p>
        </article>

        <article className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5">
          <p className="text-sm text-(--text-muted)">Koszty (transakcje + subskrypcje)</p>
          <p className="mt-2 text-2xl font-semibold text-(--text-strong)">
            {formatCurrency(summary.expensesFromTransactions + summary.monthlySubscriptions)}
          </p>
        </article>

        <article className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5">
          <p className="text-sm text-(--text-muted)">Składki ZUS (est.)</p>
          <p className="mt-2 text-2xl font-semibold text-(--text-strong)">
            {formatCurrency(summary.zusEstimate)}
          </p>
        </article>

        <article className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5">
          <p className="text-sm text-(--text-muted)">Podatek PIT (est.)</p>
          <p className="mt-2 text-2xl font-semibold text-(--text-strong)">
            {formatCurrency(summary.taxEstimate)}
          </p>
        </article>

        <article className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5 sm:col-span-2 xl:col-span-2">
          <p className="text-sm text-(--text-muted)">Bilans netto (est.)</p>
          <p className="mt-2 text-3xl font-bold text-(--text-strong)">
            {formatCurrency(summary.netEstimate)}
          </p>
          <p className="mt-3 text-xs text-(--text-muted)">
            Wyliczenie orientacyjne na podstawie ustawień firmy oraz danych z bieżącego miesiąca.
          </p>
        </article>
      </div>

      <div className="rounded-2xl border border-(--surface-border) bg-(--bg-elevated) p-5">
        <h2 className="text-lg font-semibold text-(--text-strong)">Szczegóły miesiąca</h2>
        <div className="mt-4 grid gap-2 text-sm text-(--text-muted) sm:grid-cols-2">
          <p>Wpływy z transakcji: {formatCurrency(summary.incomesFromTransactions)}</p>
          <p>Wydatki z transakcji: {formatCurrency(summary.expensesFromTransactions)}</p>
          <p>Subskrypcje (miesięcznie): {formatCurrency(summary.monthlySubscriptions)}</p>
          <p>Model podatkowy: {company.taxType ?? "brak"}</p>
        </div>
      </div>
    </section>
  );
}
