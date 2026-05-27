/**
 * useDebtAnalyzer — Reactive hook for debt analysis.
 * Takes debt entries + financial profile, returns all computed data.
 */
import { useMemo } from "react";
import {
  calculateDebtMetrics,
  compareStrategies,
  getYearlyInterestBreakdown,
  projectStressTrend,
  generateDebtRecommendations,
} from "../utils/debtCalculators";

export default function useDebtAnalyzer(debts, financialProfile, extraPayment = 0) {
  return useMemo(() => {
    const { monthlyIncome = 0, monthlyExpenses = 0, currentSavings = 0 } = financialProfile;
    const validDebts = debts.filter(d => d.amount > 0 && d.emi > 0);

    if (validDebts.length === 0 || monthlyIncome <= 0) {
      return { ready: false };
    }

    const metrics = calculateDebtMetrics(validDebts, monthlyIncome, monthlyExpenses, currentSavings);
    const strategies = compareStrategies(validDebts, extraPayment);
    const yearlyBreakdown = getYearlyInterestBreakdown(validDebts);
    const stressTrend = projectStressTrend(validDebts, monthlyIncome, monthlyExpenses, currentSavings);
    const recommendations = generateDebtRecommendations(metrics, validDebts);

    // Pie chart: debt by type
    const debtBreakdown = validDebts.map(d => ({
      name: d.label || d.type, value: d.amount, color: d.color || "#4d9fff",
    }));

    // EMI allocation donut
    const emiAllocation = [
      { name: "Total EMI", value: metrics.totalEMI, color: "#ff4d6a" },
      { name: "Expenses", value: monthlyExpenses, color: "#f5a623" },
      { name: "Remaining", value: Math.max(0, metrics.monthlyCashFlow), color: "#10d078" },
    ].filter(d => d.value > 0);

    // Cash flow bar
    const cashFlowData = [
      {
        label: "Monthly",
        income: monthlyIncome,
        expenses: monthlyExpenses,
        emi: metrics.totalEMI,
        savings: Math.max(0, metrics.monthlyCashFlow),
      },
    ];

    return {
      ready: true,
      metrics,
      strategies,
      yearlyBreakdown,
      stressTrend,
      recommendations,
      debtBreakdown,
      emiAllocation,
      cashFlowData,
    };
  }, [debts, financialProfile, extraPayment]);
}
