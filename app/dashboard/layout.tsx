import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  BarChart3,
  CalendarDays,
  ChartSpline,
  CreditCard,
  HandCoins,
  LucideIcon,
  ReceiptText,
  Settings,
  TrendingUp,
} from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DASHBOARD_MENU_ITEMS, type DashboardMenuIcon } from "@/lib/dashboard-menu";
import { prisma } from "@/lib/prisma";
import { OnboardingModal } from "@/app/dashboard/components/onboarding-modal";
import { DEFAULT_RULE_YEAR } from "@/lib/finance-rules";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

function readRateType(value: unknown): "HOURLY" | "DAILY" {
  return value === "DAILY" ? "DAILY" : "HOURLY";
}

function readTaxType(value: unknown): "RYCZALT" | "LINIOWY" | "SKALA" {
  if (value === "RYCZALT" || value === "LINIOWY") {
    return value;
  }

  return "SKALA";
}

function readZusType(value: unknown): "ULGA_NA_START" | "MALY_ZUS_PLUS" | "DUZY_ZUS" {
  if (value === "ULGA_NA_START" || value === "MALY_ZUS_PLUS") {
    return value;
  }

  return "DUZY_ZUS";
}

const iconByKey: Record<DashboardMenuIcon, LucideIcon> = {
  mainBalance: BarChart3,
  income: TrendingUp,
  expenses: ReceiptText,
  subscriptions: CreditCard,
  history: CalendarDays,
  forecasts: ChartSpline,
  settings: Settings,
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
  const companyRecord = company as Record<string, unknown> | null;

  const onboardingCompleted =
    typeof companyRecord?.onboardingCompleted === "boolean" ? companyRecord.onboardingCompleted : false;
  const rateType = readRateType(companyRecord?.rateType);
  const rateValue = typeof companyRecord?.rateValue === "number" ? companyRecord.rateValue : undefined;
  const workingHoursPerDay =
    typeof companyRecord?.workingHoursPerDay === "number" ? companyRecord.workingHoursPerDay : 8;
  const rawTaxType = companyRecord?.taxType ?? companyRecord?.taxationType;
  const taxType = readTaxType(rawTaxType);
  const ryczaltRate = typeof companyRecord?.ryczaltRate === "number" ? companyRecord.ryczaltRate : undefined;
  const zusType = readZusType(companyRecord?.zusType);
  const choroboweEnabled = typeof companyRecord?.choroboweEnabled === "boolean" ? companyRecord.choroboweEnabled : false;
  const choroboweMonthly =
    typeof companyRecord?.choroboweMonthly === "number" ? companyRecord.choroboweMonthly : undefined;
  const rulesYear = typeof companyRecord?.rulesYear === "number" ? companyRecord.rulesYear : DEFAULT_RULE_YEAR;

  return (
    <div className="min-h-screen bg-(--bg-canvas) text-(--text-strong)">
      <div className="mx-auto grid min-h-screen w-full max-w-400 grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#111815] px-5 py-6 text-[#d9e6df]">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9fb3a9]">bilans.ooo</p>
              <p className="text-sm text-[#d9e6df]">Panel finansowy</p>
            </div>
          </div>

          <nav className="space-y-1">
            {DASHBOARD_MENU_ITEMS.map(({ id, href, label, icon }) => {
              const Icon = iconByKey[icon];

              return (
                <Link
                  key={id}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#b6c8c0] transition hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-[#7fa294] transition group-hover:text-[#b0c9be]" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
      <OnboardingModal
        isCompleted={onboardingCompleted}
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
  );
}
