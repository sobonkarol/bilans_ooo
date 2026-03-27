import { BillingCycle, RateType, TaxType, TransactionType, ZusType } from "@prisma/client";

type CompanyFinanceInput = {
  rateType: RateType | null;
  rateValue: number | null;
  workingHoursPerDay: number;
  taxType: TaxType | null;
  zusType: ZusType | null;
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

const WORKING_DAYS_IN_MONTH = 22;

const ZUS_ESTIMATE_BY_TYPE: Record<ZusType, number> = {
  ULGA_NA_START: 420,
  MALY_ZUS_PLUS: 980,
  DUZY_ZUS: 1780,
};

const TAX_RATE_BY_TYPE: Record<TaxType, number> = {
  SKALA: 0.12,
  LINIOWY: 0.19,
  RYCZALT: 0.085,
};

function toMonthlySubscriptionCost(subscriptions: SubscriptionInput[]): number {
  return subscriptions.reduce((sum, item) => {
    if (item.cycle === "MONTHLY") {
      return sum + item.amount;
    }

    return sum + item.amount / 12;
  }, 0);
}

function estimateRevenueFromRate(company: CompanyFinanceInput): number {
  if (!company.rateType || !company.rateValue || company.rateValue <= 0) {
    return 0;
  }

  if (company.rateType === "DAILY") {
    return company.rateValue * WORKING_DAYS_IN_MONTH;
  }

  return company.rateValue * company.workingHoursPerDay * WORKING_DAYS_IN_MONTH;
}

export function estimateMonthlyFinance(
  company: CompanyFinanceInput,
  transactions: TransactionInput[],
  subscriptions: SubscriptionInput[]
): MonthlyFinanceSummary {
  const incomesFromTransactions = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + item.amount, 0);

  const expensesFromTransactions = transactions
    .filter((item) => item.type === "EXPENSE" || item.type === "TAX")
    .reduce((sum, item) => sum + item.amount, 0);

  const estimatedRevenue = Math.max(estimateRevenueFromRate(company), incomesFromTransactions);
  const monthlySubscriptions = toMonthlySubscriptionCost(subscriptions);
  const zusEstimate = company.zusType ? ZUS_ESTIMATE_BY_TYPE[company.zusType] : 0;
  const taxRate = company.taxType ? TAX_RATE_BY_TYPE[company.taxType] : 0;

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
