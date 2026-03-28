import { describe, expect, it } from "vitest";

import { estimateMonthlyFinance } from "@/lib/finance-estimator";

describe("finance-estimator", () => {
  it("liczy miesięczny bilans dla stawki godzinowej", () => {
    const summary = estimateMonthlyFinance(
      {
        rulesYear: 2026,
        rateType: "HOURLY",
        rateValue: 100,
        workingHoursPerDay: 8,
        taxType: "LINIOWY",
        ryczaltRate: null,
        zusType: "MALY_ZUS_PLUS",
        choroboweEnabled: false,
        choroboweMonthly: null,
      },
      [
        { amount: 2000, type: "EXPENSE" },
        { amount: 1000, type: "INCOME" },
      ],
      [
        { amount: 300, cycle: "MONTHLY" },
        { amount: 1200, cycle: "YEARLY" },
      ]
    );

    expect(summary.estimatedRevenue).toBe(17600);
    expect(summary.monthlySubscriptions).toBe(400);
    expect(summary.zusEstimate).toBe(980);
    expect(summary.taxEstimate).toBeCloseTo(2701.8, 5);
    expect(summary.netEstimate).toBeCloseTo(11518.2, 5);
  });

  it("używa rzeczywistych wpływów, jeśli są wyższe niż estymacja", () => {
    const summary = estimateMonthlyFinance(
      {
        rulesYear: 2026,
        rateType: "DAILY",
        rateValue: 400,
        workingHoursPerDay: 8,
        taxType: "RYCZALT",
        ryczaltRate: 12,
        zusType: "ULGA_NA_START",
        choroboweEnabled: true,
        choroboweMonthly: 120,
      },
      [
        { amount: 12000, type: "INCOME" },
        { amount: 1000, type: "EXPENSE" },
      ],
      []
    );

    expect(summary.estimatedRevenue).toBe(12000);
    expect(summary.zusEstimate).toBe(540);
    expect(summary.taxEstimate).toBeCloseTo(1255.2, 5);
    expect(summary.netEstimate).toBeCloseTo(9204.8, 5);
  });
});
