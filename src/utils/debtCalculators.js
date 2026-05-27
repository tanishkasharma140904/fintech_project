/**
 * debtCalculators.js — Pure debt analysis & repayment functions.
 * Reusable across Debt Management and future Financial Planning module.
 */

// ── Debt Type Presets ───────────────────────────────────────

export const DEBT_PRESETS = {
  home: { id: "home", label: "Home Loan", emoji: "🏠", defaultRate: 8.5, defaultTenure: 20, color: "#00d4aa" },
  car: { id: "car", label: "Car Loan", emoji: "🚗", defaultRate: 9.5, defaultTenure: 5, color: "#4d9fff" },
  credit_card: { id: "credit_card", label: "Credit Card", emoji: "💳", defaultRate: 36.0, defaultTenure: 2, color: "#ff4d6a" },
  education: { id: "education", label: "Education Loan", emoji: "🎓", defaultRate: 10.0, defaultTenure: 7, color: "#f5a623" },
  personal: { id: "personal", label: "Personal Loan", emoji: "👤", defaultRate: 14.0, defaultTenure: 3, color: "#c084fc" },
  custom: { id: "custom", label: "Custom Debt", emoji: "⚙️", defaultRate: 12.0, defaultTenure: 5, color: "#38bdf8" },
};

export const DEBT_PRESET_LIST = Object.values(DEBT_PRESETS);

// ── Core EMI Calculation ────────────────────────────────────

export function calculateEMI(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / (years * 12));
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const factor = Math.pow(1 + r, n);
  return Math.round((principal * r * factor) / (factor - 1));
}

// ── Aggregate Debt Metrics ──────────────────────────────────

export function calculateDebtMetrics(debts, income, expenses, savings) {
  const totalDebt = debts.reduce((s, d) => s + (d.amount || 0), 0);
  const totalEMI = debts.reduce((s, d) => s + (d.emi || 0), 0);
  const totalMonthlyInterest = debts.reduce((s, d) => {
    const r = (d.rate || 0) / 100 / 12;
    return s + (d.amount || 0) * r;
  }, 0);

  const dti = income > 0 ? parseFloat(((totalEMI / income) * 100).toFixed(1)) : 100;
  const monthlyCashFlow = income - expenses - totalEMI;
  const cashFlowRatio = income > 0 ? parseFloat(((monthlyCashFlow / income) * 100).toFixed(1)) : 0;
  const survivalMonths = monthlyCashFlow > 0 ? parseFloat((savings / (expenses + totalEMI)).toFixed(1)) : 0;
  const recommendedMaxEMI = Math.round(income * 0.4);

  // Weighted average interest rate
  const weightedRate = totalDebt > 0
    ? debts.reduce((s, d) => s + (d.rate || 0) * (d.amount || 0), 0) / totalDebt
    : 0;

  // Debt stress score (0-100, higher = more stress)
  const stressScore = Math.min(100, Math.max(0, Math.round(
    (Math.min(dti, 100) * 0.35) +
    (Math.max(0, 100 - cashFlowRatio) * 0.25) +
    (Math.max(0, 100 - survivalMonths * 8) * 0.2) +
    (Math.min(weightedRate, 40) / 40 * 100 * 0.2)
  )));

  // Financial stability (inverse of stress)
  const stabilityScore = Math.max(0, Math.min(100, 100 - stressScore));

  let riskStatus, riskColor;
  if (stabilityScore >= 70) { riskStatus = "Financially Stable"; riskColor = "#10d078"; }
  else if (stabilityScore >= 45) { riskStatus = "Moderate Debt Risk"; riskColor = "#f5a623"; }
  else if (stabilityScore >= 25) { riskStatus = "High Financial Stress"; riskColor = "#ff4d6a"; }
  else { riskStatus = "Critical Debt Burden"; riskColor = "#ff4d6a"; }

  return {
    totalDebt, totalEMI, totalMonthlyInterest: Math.round(totalMonthlyInterest),
    dti, monthlyCashFlow, cashFlowRatio, survivalMonths,
    recommendedMaxEMI, weightedRate: parseFloat(weightedRate.toFixed(1)),
    stressScore, stabilityScore, riskStatus, riskColor,
  };
}

// ── Repayment Plan Generator ────────────────────────────────

/**
 * Generate month-by-month repayment plan for a given strategy.
 * @param {Array} debts — [{id, label, amount, rate, emi, tenure}]
 * @param {"avalanche"|"snowball"|"balanced"} strategy
 * @param {number} extraMonthly — extra amount to pay per month above minimum EMIs
 * @returns {{ schedule: Array, debtFreeMonth: number, totalInterest: number, monthlySnapshots: Array }}
 */
export function generateRepaymentPlan(debts, strategy = "avalanche", extraMonthly = 0) {
  if (!debts.length) return { schedule: [], debtFreeMonth: 0, totalInterest: 0, monthlySnapshots: [] };

  // Clone debts
  let balances = debts.map(d => ({
    id: d.id, label: d.label || d.type, amount: d.amount || 0,
    rate: d.rate || 0, emi: d.emi || 0, emoji: d.emoji || "📋",
  }));

  const monthlySnapshots = [];
  let totalInterestPaid = 0;
  let month = 0;
  const maxMonths = 360; // 30 year cap

  while (balances.some(b => b.amount > 0) && month < maxMonths) {
    month++;
    let extraLeft = extraMonthly;

    // Sort based on strategy for extra payment priority
    let sorted;
    if (strategy === "avalanche") {
      sorted = [...balances].sort((a, b) => b.rate - a.rate);
    } else if (strategy === "snowball") {
      sorted = [...balances].sort((a, b) => a.amount - b.amount);
    } else {
      sorted = [...balances]; // balanced — distribute proportionally
    }

    // Apply minimum EMIs first
    for (const debt of balances) {
      if (debt.amount <= 0) continue;
      const r = debt.rate / 100 / 12;
      const interest = debt.amount * r;
      totalInterestPaid += interest;
      const principalPaid = Math.min(debt.emi - interest, debt.amount);
      debt.amount = Math.max(0, debt.amount - principalPaid);
    }

    // Apply extra payments based on strategy
    if (strategy === "balanced" && extraLeft > 0) {
      const activeDebts = sorted.filter(d => d.amount > 0);
      const perDebt = activeDebts.length > 0 ? Math.floor(extraLeft / activeDebts.length) : 0;
      for (const debt of activeDebts) {
        const payment = Math.min(perDebt, debt.amount);
        debt.amount = Math.max(0, debt.amount - payment);
        extraLeft -= payment;
      }
    } else {
      for (const debt of sorted) {
        if (debt.amount <= 0 || extraLeft <= 0) continue;
        const payment = Math.min(extraLeft, debt.amount);
        debt.amount = Math.max(0, debt.amount - payment);
        extraLeft -= payment;
      }
    }

    // Snapshot
    const totalRemaining = balances.reduce((s, b) => s + b.amount, 0);
    monthlySnapshots.push({
      month,
      totalRemaining: Math.round(totalRemaining),
      interestPaid: Math.round(totalInterestPaid),
    });
  }

  return {
    debtFreeMonth: month,
    totalInterest: Math.round(totalInterestPaid),
    monthlySnapshots,
  };
}

/**
 * Compare all 3 strategies to show trade-offs.
 */
export function compareStrategies(debts, extraMonthly = 0) {
  const avalanche = generateRepaymentPlan(debts, "avalanche", extraMonthly);
  const snowball = generateRepaymentPlan(debts, "snowball", extraMonthly);
  const balanced = generateRepaymentPlan(debts, "balanced", extraMonthly);

  return { avalanche, snowball, balanced };
}

/**
 * Generate yearly interest breakdown for chart.
 */
export function getYearlyInterestBreakdown(debts) {
  if (!debts.length) return [];
  const breakdown = [];
  let balances = debts.map(d => ({ amount: d.amount || 0, rate: d.rate || 0, emi: d.emi || 0 }));
  const maxYears = Math.max(...debts.map(d => d.tenure || 5));

  for (let y = 1; y <= Math.min(maxYears, 30); y++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (const debt of balances) {
      if (debt.amount <= 0) continue;
      const r = debt.rate / 100 / 12;
      for (let m = 0; m < 12; m++) {
        if (debt.amount <= 0) break;
        const interest = debt.amount * r;
        const principal = Math.min(debt.emi - interest, debt.amount);
        yearInterest += interest;
        yearPrincipal += principal;
        debt.amount = Math.max(0, debt.amount - principal);
      }
    }
    if (yearInterest <= 0 && yearPrincipal <= 0) break;
    breakdown.push({ year: `Y${y}`, interest: Math.round(yearInterest), principal: Math.round(yearPrincipal) });
  }
  return breakdown;
}

/**
 * Project stress score over time as debts are paid off.
 */
export function projectStressTrend(debts, income, expenses, savings, months = 36) {
  if (!debts.length || income <= 0) return [];

  let balances = debts.map(d => ({ amount: d.amount || 0, rate: d.rate || 0, emi: d.emi || 0 }));
  const trend = [];
  let accSavings = savings;

  for (let m = 0; m <= months; m += 3) {
    const totalEMI = balances.reduce((s, b) => s + (b.amount > 0 ? b.emi : 0), 0);
    const dti = (totalEMI / income) * 100;
    const cashFlow = income - expenses - totalEMI;
    const survival = cashFlow > 0 ? accSavings / (expenses + totalEMI) : 0;
    const weightedRate = balances.reduce((s, b) => s + b.rate * Math.max(0, b.amount), 0) /
      Math.max(1, balances.reduce((s, b) => s + Math.max(0, b.amount), 0));

    const stress = Math.min(100, Math.max(0, Math.round(
      (Math.min(dti, 100) * 0.35) + (Math.max(0, 100 - (cashFlow / income * 100)) * 0.25) +
      (Math.max(0, 100 - survival * 8) * 0.2) + (Math.min(weightedRate, 40) / 40 * 100 * 0.2)
    )));

    trend.push({ month: `M${m}`, stress: 100 - stress });

    // Simulate 3 months of payments
    for (let s = 0; s < 3; s++) {
      for (const b of balances) {
        if (b.amount <= 0) continue;
        const r = b.rate / 100 / 12;
        const interest = b.amount * r;
        b.amount = Math.max(0, b.amount - (b.emi - interest));
      }
      accSavings += Math.max(0, cashFlow);
    }
  }
  return trend;
}

// ── Recommendation Engine ───────────────────────────────────

export function generateDebtRecommendations(metrics, debts) {
  const recs = [];
  let id = 1;

  // 1. Overall assessment
  if (metrics.stabilityScore >= 70) {
    recs.push({ id: id++, icon: "✅", type: "info", title: "Debt levels are manageable",
      detail: `Stability score of ${metrics.stabilityScore}/100. Your debt-to-income ratio of ${metrics.dti}% is within healthy limits.` });
  } else if (metrics.stabilityScore >= 45) {
    recs.push({ id: id++, icon: "⚠️", type: "warning", title: "Moderate debt burden detected",
      detail: `Stability score is ${metrics.stabilityScore}/100. Total EMI of ₹${metrics.totalEMI.toLocaleString("en-IN")} consumes ${metrics.dti}% of income.` });
  } else {
    recs.push({ id: id++, icon: "🚨", type: "alert", title: "Critical debt burden — action needed",
      detail: `Stability score is only ${metrics.stabilityScore}/100. EMI burden of ${metrics.dti}% exceeds safe limits. Immediate action recommended.` });
  }

  // 2. Credit card priority
  const ccDebt = debts.filter(d => d.type === "credit_card" && d.amount > 0);
  if (ccDebt.length > 0) {
    const ccTotal = ccDebt.reduce((s, d) => s + d.amount, 0);
    recs.push({ id: id++, icon: "💳", type: "alert", title: "Prioritize credit card debt",
      detail: `₹${ccTotal.toLocaleString("en-IN")} in credit card debt at 36%+ interest. This compounds fastest — pay this off before anything else.` });
  }

  // 3. DTI warning
  if (metrics.dti > 50) {
    recs.push({ id: id++, icon: "📊", type: "alert", title: `DTI ratio is dangerously high (${metrics.dti}%)`,
      detail: `Total EMI exceeds 50% of income. Banks consider this high-risk. Consider debt consolidation or extending tenure to reduce monthly burden.` });
  } else if (metrics.dti > 40) {
    recs.push({ id: id++, icon: "📊", type: "warning", title: `DTI ratio is elevated (${metrics.dti}%)`,
      detail: `Financial advisors recommend keeping DTI below 40%. You're at ${metrics.dti}%. Avoid taking on new debt.` });
  }

  // 4. Cash flow
  if (metrics.monthlyCashFlow < 0) {
    recs.push({ id: id++, icon: "🔴", type: "alert", title: "Negative monthly cash flow",
      detail: `You're spending ₹${Math.abs(metrics.monthlyCashFlow).toLocaleString("en-IN")} more than you earn after EMIs. This is unsustainable — reduce expenses or restructure debt.` });
  } else if (metrics.monthlyCashFlow < metrics.totalEMI * 0.5) {
    recs.push({ id: id++, icon: "💡", type: "warning", title: "Tight cash flow after EMIs",
      detail: `Only ₹${metrics.monthlyCashFlow.toLocaleString("en-IN")} remains after all obligations. Build a buffer of at least 3 months' expenses.` });
  }

  // 5. Emergency buffer
  if (metrics.survivalMonths < 3) {
    recs.push({ id: id++, icon: "🛡️", type: "alert", title: `Emergency buffer critically low (${metrics.survivalMonths.toFixed(1)} months)`,
      detail: `If you lose income, savings would last only ${metrics.survivalMonths.toFixed(1)} months. Build 6+ months of expenses before aggressive debt repayment.` });
  }

  // 6. Prepayment opportunity
  if (metrics.monthlyCashFlow > 5000 && metrics.totalDebt > 100000) {
    const annual = Math.round(metrics.monthlyCashFlow * 0.3) * 12;
    recs.push({ id: id++, icon: "⚡", type: "info", title: `You can safely prepay ~₹${(annual / 100000).toFixed(1)}L/year`,
      detail: `With ₹${metrics.monthlyCashFlow.toLocaleString("en-IN")} monthly surplus, allocating 30% to prepayment could save significant interest over time.` });
  }

  // 7. High-interest consolidation
  const highRateDebts = debts.filter(d => d.rate > 15 && d.amount > 50000);
  if (highRateDebts.length >= 2) {
    recs.push({ id: id++, icon: "🔄", type: "warning", title: "Consider debt consolidation",
      detail: `You have ${highRateDebts.length} debts above 15% interest. A single consolidated loan at 10-12% could reduce your monthly burden and total interest.` });
  }

  return recs.slice(0, 6);
}

// ── INR Formatting ──────────────────────────────────────────

export function formatINR(num) {
  if (num == null || isNaN(num)) return "—";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

export function formatINRFull(num) {
  if (num == null || isNaN(num)) return "—";
  const sign = num < 0 ? "-" : "";
  return `${sign}₹${Math.abs(Math.round(num)).toLocaleString("en-IN")}`;
}
