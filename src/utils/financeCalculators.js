/**
 * financeCalculators.js — Pure financial calculation functions.
 * Reusable across Investment Estimator and future Debt Management module.
 */

// ── Investment Type Presets ─────────────────────────────────

export const INVESTMENT_PRESETS = {
  house: {
    id: "house",
    label: "House / Flat",
    emoji: "🏠",
    defaultRate: 8.5,
    defaultYears: 20,
    typicalMin: 3000000,
    typicalMax: 30000000,
    defaultCost: 5000000,
    defaultDownPct: 20,
    description: "Home loan for property purchase",
  },
  car: {
    id: "car",
    label: "Car",
    emoji: "🚗",
    defaultRate: 9.0,
    defaultYears: 5,
    typicalMin: 500000,
    typicalMax: 5000000,
    defaultCost: 1000000,
    defaultDownPct: 15,
    description: "Vehicle financing",
  },
  education: {
    id: "education",
    label: "Education",
    emoji: "🎓",
    defaultRate: 10.0,
    defaultYears: 7,
    typicalMin: 500000,
    typicalMax: 5000000,
    defaultCost: 1500000,
    defaultDownPct: 10,
    description: "Higher education or course fees",
  },
  renovation: {
    id: "renovation",
    label: "Renovation",
    emoji: "🏗️",
    defaultRate: 12.0,
    defaultYears: 5,
    typicalMin: 200000,
    typicalMax: 2500000,
    defaultCost: 500000,
    defaultDownPct: 20,
    description: "Home improvement & renovation",
  },
  wedding: {
    id: "wedding",
    label: "Wedding",
    emoji: "💍",
    defaultRate: 14.0,
    defaultYears: 3,
    typicalMin: 500000,
    typicalMax: 3000000,
    defaultCost: 1000000,
    defaultDownPct: 30,
    description: "Wedding & ceremony expenses",
  },
  travel: {
    id: "travel",
    label: "Travel",
    emoji: "✈️",
    defaultRate: 15.0,
    defaultYears: 2,
    typicalMin: 100000,
    typicalMax: 1000000,
    defaultCost: 300000,
    defaultDownPct: 25,
    description: "International or luxury travel",
  },
  business: {
    id: "business",
    label: "Business",
    emoji: "💼",
    defaultRate: 12.0,
    defaultYears: 7,
    typicalMin: 500000,
    typicalMax: 10000000,
    defaultCost: 2000000,
    defaultDownPct: 25,
    description: "Startup or business investment",
  },
  medical: {
    id: "medical",
    label: "Medical",
    emoji: "🏥",
    defaultRate: 11.0,
    defaultYears: 5,
    typicalMin: 200000,
    typicalMax: 3000000,
    defaultCost: 500000,
    defaultDownPct: 10,
    description: "Medical procedure or emergency",
  },
  custom: {
    id: "custom",
    label: "Custom",
    emoji: "⚙️",
    defaultRate: 10.0,
    defaultYears: 5,
    typicalMin: 0,
    typicalMax: 100000000,
    defaultCost: 1000000,
    defaultDownPct: 20,
    description: "Define your own investment",
  },
};

// ── Core Calculations ───────────────────────────────────────

/**
 * Calculate EMI using standard amortization formula.
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);

  const r = annualRate / 100 / 12; // monthly rate
  const n = years * 12; // total months
  const factor = Math.pow(1 + r, n);
  return Math.round((principal * r * factor) / (factor - 1));
}

/**
 * Affordability Ratio = EMI / Monthly Income × 100
 * Safe: < 30%, Moderate: 30-40%, Risky: > 40%
 */
export function calculateAffordabilityRatio(emi, monthlyIncome) {
  if (monthlyIncome <= 0) return 100;
  return parseFloat(((emi / monthlyIncome) * 100).toFixed(1));
}

/**
 * Debt-to-Income Ratio = (All EMIs) / Monthly Income × 100
 * Safe: < 36%, Moderate: 36-50%, Risky: > 50%
 */
export function calculateDTI(emi, existingEMIs, monthlyIncome) {
  if (monthlyIncome <= 0) return 100;
  return parseFloat((((emi + existingEMIs) / monthlyIncome) * 100).toFixed(1));
}

/**
 * Project savings over loan tenure.
 * Returns array of { year, withoutInvestment, withInvestment }
 */
export function calculateSavingsProjection(monthlySavings, emi, years) {
  const projection = [];
  for (let y = 0; y <= years; y++) {
    projection.push({
      year: `Y${y}`,
      withoutInvestment: Math.round(monthlySavings * 12 * y),
      withInvestment: Math.round(Math.max(0, (monthlySavings - emi) * 12 * y)),
    });
  }
  return projection;
}

/**
 * Year-by-year loan breakdown: principal vs interest paid each year.
 */
export function getLoanBreakdown(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return [];

  const r = annualRate / 100 / 12;
  const n = years * 12;
  const emi = calculateEMI(principal, annualRate, years);
  const breakdown = [];
  let balance = principal;

  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const interest = balance * r;
      const principalPaid = Math.min(emi - interest, balance);
      yearInterest += interest;
      yearPrincipal += principalPaid;
      balance -= principalPaid;
    }

    breakdown.push({
      year: `Y${y}`,
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      balance: Math.round(Math.max(0, balance)),
    });
  }

  return breakdown;
}

/**
 * Calculate total interest paid over the loan tenure.
 */
export function calculateTotalInterest(principal, annualRate, years) {
  const emi = calculateEMI(principal, annualRate, years);
  return emi * years * 12 - principal;
}

/**
 * Compute all metrics for a given investment scenario.
 */
export function computeAllMetrics(inputs) {
  const {
    totalCost = 0,
    downPayment = 0,
    interestRate = 10,
    loanYears = 5,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    existingEMIs = 0,
    currentSavings = 0,
    emergencyReserve = 0,
  } = inputs;

  const principal = Math.max(0, totalCost - downPayment);
  const emi = calculateEMI(principal, interestRate, loanYears);
  const affordabilityRatio = calculateAffordabilityRatio(emi, monthlyIncome);
  const dti = calculateDTI(emi, existingEMIs, monthlyIncome);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const remainingSavings = monthlySavings - emi - existingEMIs;
  const totalInterest = calculateTotalInterest(principal, interestRate, loanYears);
  const totalPayable = principal + totalInterest;

  // Savings depletion risk: how much of current savings goes into down payment
  const savingsDepletionPct = currentSavings > 0
    ? parseFloat(((downPayment / currentSavings) * 100).toFixed(1))
    : 100;

  // Emergency buffer: savings left after down payment vs reserve needed
  const savingsAfterDown = currentSavings - downPayment;
  const emergencyMonths = remainingSavings > 0
    ? parseFloat((savingsAfterDown / (monthlyExpenses + emi)).toFixed(1))
    : 0;

  // Financial burden score (0-100, lower = better)
  const burdenScore = Math.min(100, Math.max(0, Math.round(
    (affordabilityRatio * 0.3) +
    (dti * 0.3) +
    (Math.min(savingsDepletionPct, 100) * 0.2) +
    (Math.max(0, 100 - emergencyMonths * 10) * 0.2)
  )));

  // Feasibility score (0-100, higher = better)
  const feasibilityScore = Math.max(0, Math.min(100, 100 - burdenScore));

  // Feasibility status
  let feasibilityStatus, feasibilityColor;
  if (feasibilityScore >= 75) {
    feasibilityStatus = "Financially Safe";
    feasibilityColor = "#10d078";
  } else if (feasibilityScore >= 50) {
    feasibilityStatus = "Moderate Risk";
    feasibilityColor = "#f5a623";
  } else if (feasibilityScore >= 30) {
    feasibilityStatus = "High Financial Stress";
    feasibilityColor = "#ff4d6a";
  } else {
    feasibilityStatus = "Not Recommended";
    feasibilityColor = "#ff4d6a";
  }

  return {
    principal,
    emi,
    totalInterest: Math.round(totalInterest),
    totalPayable: Math.round(totalPayable),
    affordabilityRatio,
    dti,
    monthlySavings,
    remainingSavings,
    savingsDepletionPct,
    savingsAfterDown,
    emergencyMonths,
    burdenScore,
    feasibilityScore,
    feasibilityStatus,
    feasibilityColor,
  };
}

/**
 * Generate dynamic AI recommendations based on metrics.
 */
export function generateRecommendations(metrics, inputs) {
  const recs = [];
  let id = 1;

  const {
    emi, affordabilityRatio, dti, remainingSavings,
    savingsDepletionPct, emergencyMonths, feasibilityScore,
  } = metrics;

  const { totalCost, downPayment, interestRate, loanYears, monthlyIncome } = inputs;

  // 1. Overall assessment
  if (feasibilityScore >= 75) {
    recs.push({
      id: id++, icon: "✅", type: "info",
      title: "Investment appears financially safe",
      detail: `With a feasibility score of ${feasibilityScore}/100, this investment aligns well with your current financial capacity.`,
    });
  } else if (feasibilityScore >= 50) {
    recs.push({
      id: id++, icon: "⚠️", type: "warning",
      title: "Moderate financial risk detected",
      detail: `Feasibility score is ${feasibilityScore}/100. The investment is possible but will strain your finances. Consider the suggestions below.`,
    });
  } else {
    recs.push({
      id: id++, icon: "🚨", type: "alert",
      title: "High financial stress predicted",
      detail: `Feasibility score is only ${feasibilityScore}/100. This investment would severely strain your finances. Strong reconsideration advised.`,
    });
  }

  // 2. EMI affordability
  if (affordabilityRatio > 40) {
    const safeEMI = Math.round(monthlyIncome * 0.35);
    const safeBudget = Math.round((safeEMI / emi) * totalCost);
    recs.push({
      id: id++, icon: "📊", type: "alert",
      title: `EMI exceeds safe income ratio (${affordabilityRatio}%)`,
      detail: `Your EMI of ₹${emi.toLocaleString("en-IN")} is ${affordabilityRatio}% of income. Safe limit is 35-40%. Consider a budget of ₹${(safeBudget / 100000).toFixed(1)}L instead.`,
    });
  } else if (affordabilityRatio > 30) {
    recs.push({
      id: id++, icon: "💡", type: "warning",
      title: `EMI is ${affordabilityRatio}% of income — manageable but tight`,
      detail: `Financial experts recommend keeping EMI below 30% of income for comfort. You're slightly above that threshold.`,
    });
  }

  // 3. Down payment suggestion
  const downPct = totalCost > 0 ? (downPayment / totalCost) * 100 : 0;
  if (downPct < 20 && totalCost > 500000) {
    const suggestedDown = Math.round(totalCost * 0.2);
    const savings = emi - calculateEMI(totalCost - suggestedDown, interestRate, loanYears);
    recs.push({
      id: id++, icon: "💰", type: "warning",
      title: `Increase down payment to 20% (₹${(suggestedDown / 100000).toFixed(1)}L)`,
      detail: `Currently ${downPct.toFixed(0)}%. A 20% down payment would reduce your EMI by ₹${Math.abs(savings).toLocaleString("en-IN")}/month and lower total interest.`,
    });
  }

  // 4. DTI warning
  if (dti > 50) {
    recs.push({
      id: id++, icon: "🏦", type: "alert",
      title: `Debt-to-income ratio is critically high (${dti}%)`,
      detail: `Total debt obligations would consume ${dti}% of your income. Banks typically reject loans when DTI exceeds 50%. Reduce existing debts first.`,
    });
  }

  // 5. Savings depletion
  if (savingsDepletionPct > 80) {
    recs.push({
      id: id++, icon: "🛡️", type: "alert",
      title: "Savings would be dangerously depleted",
      detail: `Down payment uses ${savingsDepletionPct.toFixed(0)}% of your savings. Maintain at least 6 months of expenses as emergency buffer.`,
    });
  }

  // 6. Emergency buffer
  if (emergencyMonths < 3 && remainingSavings > 0) {
    recs.push({
      id: id++, icon: "⏰", type: "warning",
      title: `Only ${emergencyMonths.toFixed(1)} months of emergency buffer`,
      detail: `After the down payment, you'd have limited emergency savings. Financial advisors recommend 6+ months of expenses as buffer.`,
    });
  }

  // 7. Loan tenure optimization
  if (loanYears > 15 && affordabilityRatio < 25) {
    const shorterYears = Math.max(10, loanYears - 5);
    const shorterEMI = calculateEMI(totalCost - downPayment, interestRate, shorterYears);
    const interestSaved = (emi * loanYears * 12) - (shorterEMI * shorterYears * 12);
    if (interestSaved > 0) {
      recs.push({
        id: id++, icon: "⚡", type: "info",
        title: `Shorten loan to ${shorterYears} years to save ₹${(interestSaved / 100000).toFixed(1)}L`,
        detail: `Since your affordability ratio is healthy (${affordabilityRatio}%), you can afford a shorter tenure. EMI increases to ₹${shorterEMI.toLocaleString("en-IN")} but saves significantly on interest.`,
      });
    }
  }

  // 8. Positive remaining savings
  if (remainingSavings > 0 && feasibilityScore >= 50) {
    recs.push({
      id: id++, icon: "📈", type: "info",
      title: `₹${remainingSavings.toLocaleString("en-IN")}/month remaining after EMI`,
      detail: `You'll still have surplus income after all obligations. Consider investing this in SIPs or fixed deposits for wealth building.`,
    });
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
