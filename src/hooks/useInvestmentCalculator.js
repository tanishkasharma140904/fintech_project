/**
 * useInvestmentCalculator — Reactive hook for investment analysis.
 * Takes form inputs + financial profile, returns all computed data.
 */
import { useMemo } from "react";
import {
  computeAllMetrics,
  generateRecommendations,
  calculateSavingsProjection,
  getLoanBreakdown,
  calculateEMI,
} from "../utils/financeCalculators";

export default function useInvestmentCalculator(formInputs, financialProfile) {
  return useMemo(() => {
    const {
      totalCost = 0,
      downPayment = 0,
      interestRate = 10,
      loanYears = 5,
      existingEMIs = 0,
    } = formInputs;

    const {
      monthlyIncome = 0,
      monthlyExpenses = 0,
      currentSavings = 0,
      emergencyReserve = 0,
    } = financialProfile;

    // Skip calculation if no meaningful inputs
    if (totalCost <= 0 || monthlyIncome <= 0) {
      return { ready: false };
    }

    const inputs = {
      totalCost,
      downPayment,
      interestRate,
      loanYears,
      monthlyIncome,
      monthlyExpenses,
      existingEMIs,
      currentSavings,
      emergencyReserve,
    };

    const metrics = computeAllMetrics(inputs);
    const recommendations = generateRecommendations(metrics, inputs);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsProjection = calculateSavingsProjection(monthlySavings, metrics.emi, loanYears);
    const loanBreakdown = getLoanBreakdown(metrics.principal, interestRate, loanYears);

    // Chart data: EMI vs Income donut
    const emiVsIncome = [
      { name: "EMI", value: metrics.emi, color: "#ff4d6a" },
      { name: "Expenses", value: monthlyExpenses, color: "#f5a623" },
      { name: "Existing EMIs", value: existingEMIs, color: "#c084fc" },
      { name: "Remaining", value: Math.max(0, metrics.remainingSavings), color: "#10d078" },
    ].filter(d => d.value > 0);

    // Chart data: Monthly budget comparison
    const budgetComparison = [
      {
        label: "Before",
        income: monthlyIncome,
        expenses: monthlyExpenses,
        emi: existingEMIs,
        savings: Math.max(0, monthlySavings - existingEMIs),
      },
      {
        label: "After",
        income: monthlyIncome,
        expenses: monthlyExpenses,
        emi: metrics.emi + existingEMIs,
        savings: Math.max(0, metrics.remainingSavings),
      },
    ];

    return {
      ready: true,
      metrics,
      recommendations,
      savingsProjection,
      loanBreakdown,
      emiVsIncome,
      budgetComparison,
    };
  }, [formInputs, financialProfile]);
}
