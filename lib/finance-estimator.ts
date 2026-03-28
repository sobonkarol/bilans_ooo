import { BillingCycle, TransactionType } from "@prisma/client";
import { getFinanceRules, resolveRulesYear, type RateType, type TaxType, type ZusType } from "@/lib/finance-rules";

type CompanyFinanceInput = {
  rulesYear: number | null;
  rateType: RateType | null;
  rateValue: number | null;
  workingHoursPerDay: number;
  taxType: TaxType | null;
  ryczaltRate: number | null;
  zusType: ZusType | null;
  choroboweEnabled: boolean;
  choroboweMonthly: number | null;
};

type TransactionInput = {
  amount: number;
  type: TransactionType;
};

type SubscriptionInput = {
  amount: number;
  cycle: BillingCycle;
};

export type MonthlyFinanceSummary = {
  estimatedRevenue: number;
  incomesFromTransactions: number;
  expensesFromTransactions: number;
  monthlySubscriptions: number;
  zusEstimate: number;
  taxEstimate: number;
  netEstimate: number;
};

function readTaxRate(company: CompanyFinanceInput): number {
  const rules = getFinanceRules(company.rulesYear);

  if (!company.taxType) {
    return 0;
  }

  if (company.taxType === "RYCZALT") {
    if (!company.ryczaltRate || company.ryczaltRate <= 0) {
      return 0.085;
    }

    return company.ryczaltRate / 100;
  }

  return rules.taxRateByType[company.taxType];
}

function toMonthlySubscriptionCost(subscriptions: SubscriptionInput[]): number {
  return subscriptions.reduce((sum, item) => {
    if (item.cycle === "MONTHLY") {
      return sum + item.amount;
    }

    return sum + item.amount / 12;
  }, 0);
}

function estimateRevenueFromRate(company: CompanyFinanceInput): number {
  const rules = getFinanceRules(company.rulesYear);

  if (!company.rateType || !company.rateValue || company.rateValue <= 0) {
    return 0;
  }

  if (company.rateType === "DAILY") {
    return company.rateValue * rules.workingDaysInMonth;
  }

  return company.rateValue * company.workingHoursPerDay * rules.workingDaysInMonth;
}

export function estimateMonthlyFinance(
  company: CompanyFinanceInput,
  transactions: TransactionInput[],
  subscriptions: SubscriptionInput[]
): MonthlyFinanceSummary {
  const rulesYear = resolveRulesYear(company.rulesYear);
  const rules = getFinanceRules(rulesYear);
  const incomesFromTransactions = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + item.amount, 0);

  const expensesFromTransactions = transactions
    .filter((item) => item.type === "EXPENSE" || item.type === "TAX")
    .reduce((sum, item) => sum + item.amount, 0);

  const estimatedRevenue = Math.max(estimateRevenueFromRate(company), incomesFromTransactions);
  const monthlySubscriptions = toMonthlySubscriptionCost(subscriptions);
  const baseZusEstimate = company.zusType ? rules.zusEstimateByType[company.zusType] : 0;
  const choroboweEstimate =
    company.choroboweEnabled && company.choroboweMonthly && company.choroboweMonthly > 0
      ? company.choroboweMonthly
      : 0;
  const zusEstimate = baseZusEstimate + choroboweEstimate;
  const taxRate = readTaxRate(company);

  const taxableBase = Math.max(
    0,
    estimatedRevenue - expensesFromTransactions - monthlySubscriptions - zusEstimate
  );
  const taxEstimate = taxableBase * taxRate;
  const netEstimate =
    estimatedRevenue - expensesFromTransactions - monthlySubscriptions - zusEstimate - taxEstimate;

  return {
    estimatedRevenue,
    incomesFromTransactions,
    expensesFromTransactions,
    monthlySubscriptions,
    zusEstimate,
    taxEstimate,
    netEstimate,
  };
}
