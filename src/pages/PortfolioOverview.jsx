import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend
} from "recharts";
import { useAnalytics } from "../context/AnalyticsContext";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import FinancialOnboarding from "./FinancialOnboarding";
import { formatINR, formatINRFull } from "../utils/financeCalculators";
import {
  determineFinancialPersonality,
  generateExecutiveInsights,
  calculateNetWorthTimeline,
  calculateGoalProgress
} from "../utils/portfolioCalculators";

/* ═══════════════════════════════════════════════════════════
   ANIMATIONS & CUSTOM TOOLTIPS
   ═══════════════════════════════════════════════════════════ */

const ANIM_CSS = `
@keyframes portfolioFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes borderGlow {
  0%, 100% { border-color: var(--bg-border); }
  50% { border-color: var(--accent-dim); }
}
`;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(17,24,39,0.95)", border: "1px solid var(--bg-border)",
      borderRadius: 12, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      backdropFilter: "blur(12px)",
    }}>
      {label && <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6 }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{p.name}</span>
          <span style={{ color: "var(--text-primary)", fontSize: 11, fontWeight: 600, marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            {typeof p.value === "number" && p.value > 1000 ? formatINRFull(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreRing({ score, color, size = 80 }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 4px ${color}40)` }} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function PortfolioOverview() {
  const { onboardingData, isOnboarded, resetOnboarding } = useOnboarding();
  const { analytics } = useAnalytics();
  const { currentUser } = useAuth();
  
  // Tab index for the timelines section (5 charts)
  const [activeTab, setActiveTab] = useState("networth");

  // Load active module states from localStorage dynamically scoped by UID
  const [activeInvestment, setActiveInvestment] = useState(null);
  const [activeDebts, setActiveDebts] = useState(null);

  useEffect(() => {
    if (isOnboarded) {
      const uid = currentUser?.uid || "guest";
      try {
        const inv = localStorage.getItem(`fintech_active_investment_${uid}`);
        if (inv) setActiveInvestment(JSON.parse(inv));
        else setActiveInvestment(null);

        const dbt = localStorage.getItem(`fintech_active_debts_${uid}`);
        if (dbt) setActiveDebts(JSON.parse(dbt));
        else setActiveDebts(null);
      } catch (e) {
        console.error("Error loading cross-module states:", e);
      }
    }
  }, [isOnboarded, currentUser]);

  // Handle case where Onboarding has not been completed
  if (!isOnboarded) {
    return <FinancialOnboarding />;
  }

  // ── Calculated States ──
  const summary = analytics?.summary;
  const healthScore = analytics?.dashboard_cards?.financial_health?.value || 72;
  const months = Math.max(1, analytics?.by_month?.length || 1);

  // Income metrics
  const monthlyIncome = parseFloat(onboardingData.effectiveIncome || onboardingData.monthlyIncome) || 0;

  const monthlyExpenses = summary?.avg_monthly_spending || (monthlyIncome - (parseFloat(onboardingData.monthlySavingsGoal) || 0));
  const activeDebtEMI = activeDebts?.totalEMI || 0;
  const activeInvestmentEMI = activeInvestment?.emi || 0;
  const totalEMIs = activeDebtEMI + activeInvestmentEMI;

  const netSavings = Math.max(0, monthlyIncome - monthlyExpenses - totalEMIs);

  // Personality
  const personality = determineFinancialPersonality(onboardingData, analytics, activeDebts);
  
  // Timeline Charts
  const timelineData = calculateNetWorthTimeline(onboardingData, analytics, activeInvestment, activeDebts);

  // Insights
  const insights = generateExecutiveInsights(onboardingData, analytics, activeInvestment, activeDebts);

  // Goals
  const goals = calculateGoalProgress(onboardingData, analytics, activeInvestment, activeDebts);

  // Mock historical health data for the 5th chart
  const healthTimeline = [
    { month: "Month 1", score: healthScore - 8 },
    { month: "Month 3", score: healthScore - 4 },
    { month: "Month 6", score: healthScore - 2 },
    { month: "Month 9", score: healthScore + 1 },
    { month: "Month 12", score: Math.min(100, healthScore + 8) },
  ];

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <style>{ANIM_CSS}</style>

      {/* ═══════════ 1. PERSONAL PROFILE HEADER ═══════════ */}
      <section style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(77,159,255,0.04) 50%, rgba(192,132,252,0.04) 100%)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "2rem 1.5rem 1.5rem",
        animation: "portfolioFadeIn 0.4s ease-out"
      }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold select-none flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${personality.badgeColor}, #00d4aa)`,
                boxShadow: `0 0 12px ${personality.badgeColor}40`,
                color: "#0a0d14",
              }}
            >
              {onboardingData.fullName ? onboardingData.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "AK"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {onboardingData.fullName}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border"
                  style={{
                    background: `${personality.badgeColor}12`,
                    borderColor: `${personality.badgeColor}30`,
                    color: personality.badgeColor,
                  }}
                >
                  {personality.name}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {onboardingData.occupation} • {onboardingData.cityCountry} • Risk Profile: <span className="capitalize font-semibold text-gray-300">{onboardingData.riskAppetite}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-opacity-30 border"
                style={{
                  background: onboardingData.hasLoans === "yes" ? "rgba(255,77,106,0.08)" : "rgba(16,208,120,0.08)",
                  borderColor: onboardingData.hasLoans === "yes" ? "rgba(255,77,106,0.2)" : "rgba(16,208,120,0.2)",
                  color: onboardingData.hasLoans === "yes" ? "var(--red)" : "var(--green)"
                }}
              >
                {onboardingData.hasLoans === "yes" ? "Active Liabilities" : "Debt-Free Badge"}
              </span>

              <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-opacity-30 border"
                style={{
                  background: "rgba(0,212,170,0.08)",
                  borderColor: "rgba(0,212,170,0.2)",
                  color: "var(--accent-primary)"
                }}
              >
                Score: {healthScore}
              </span>
            </div>

            <button
              onClick={resetOnboarding}
              className="px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all border"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--bg-border)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--bg-border)"}
            >
              Reset Identity
            </button>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6" style={{ animation: "portfolioFadeIn 0.5s ease" }}>

        {/* ═══════════ 2. FINANCIAL SNAPSHOT SECTION ═══════════ */}
        <section>
          <SectionHeader title="Executive Overview" subtitle="Real-time aggregates synchronized across all modules" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SnapshotCard label="Liquid Reserves" value={formatINRFull(currentSavings(summary, onboardingData))} icon="🏦" color="#00d4aa" />
            <SnapshotCard label="Monthly Savings surplus" value={formatINRFull(netSavings)} icon="💰" color="#10d078" sub="surplus cash" />
            <SnapshotCard label="Active Debt Outstanding" value={formatINR(activeDebts?.totalDebt || (onboardingData?.hasLoans === "yes" ? parseFloat(onboardingData.approxDebtBalance) : 0))} icon="💸" color="#ff4d6a" />
            <SnapshotCard label="Monthly EMI burden" value={formatINRFull(totalEMIs)} icon="💳" color="#f5a623" sub={`DTI: ${activeDebts?.dti || 0}%`} />
            
            <div className="card flex items-center justify-between" style={{ padding: "12px 16px" }}>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Health Index</p>
                <p className="text-lg font-extrabold font-mono mt-0.5" style={{ color: "var(--accent-primary)" }}>{healthScore}</p>
                <p className="text-[9px] text-gray-500 truncate mt-0.5">Unified Rating</p>
              </div>
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <ScoreRing score={healthScore} color="var(--accent-primary)" size={48} />
                <span className="absolute text-[10px] font-bold font-mono">AQ</span>
              </div>
            </div>
          </div>
        </section>

        {/* Snapshots Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ═══════════ 3. INVESTMENT SNAPSHOT SECTION ═══════════ */}
          <div className="card relative overflow-hidden" style={{ borderTop: "3px solid #c084fc" }}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>📊</span> Investment Estimator Hub
            </p>
            {activeInvestment ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-900 bg-opacity-40 p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{activeInvestment.emoji}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{activeInvestment.label}</p>
                      <p className="text-[10px] text-gray-500">Duration: {activeInvestment.loanYears}yr @ {activeInvestment.interestRate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase">Cost Value</p>
                    <p className="text-xs font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>{formatINR(activeInvestment.cost)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-gray-950 bg-opacity-40 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500">Planned EMI</p>
                    <p className="text-xs font-extrabold font-mono mt-0.5" style={{ color: "var(--text-primary)" }}>{formatINRFull(activeInvestment.emi)}</p>
                  </div>
                  <div className="p-2 bg-gray-950 bg-opacity-40 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500">Affordability</p>
                    <p className="text-xs font-extrabold font-mono mt-0.5" style={{ color: "#10d078" }}>{activeInvestment.affordabilityRatio}%</p>
                  </div>
                  <div className="p-2 bg-gray-950 bg-opacity-40 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500">Feasibility</p>
                    <p className="text-xs font-extrabold font-mono mt-0.5" style={{ color: activeInvestment.feasibilityColor }}>{activeInvestment.feasibilityScore}/100</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-gray-400">Risk Assessment:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${activeInvestment.feasibilityColor}12`, color: activeInvestment.feasibilityColor }}>
                    {activeInvestment.feasibilityStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-3xl mb-3">📈</span>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>No Active Planned Investments</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Analyze your next big purchase (Car, House, Education) with our AI Affordability framework.
                </p>
                <Link to="/investment-estimator" className="mt-4 px-4 py-1.5 rounded-lg text-[10px] font-bold text-gray-950 no-underline" style={{ background: "linear-gradient(135deg, #c084fc, #a855f7)" }}>
                  Plan Investment →
                </Link>
              </div>
            )}
          </div>

          {/* ═══════════ 4. DEBT SNAPSHOT SECTION ═══════════ */}
          <div className="card relative overflow-hidden" style={{ borderTop: "3px solid #ff4d6a" }}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>🛡️</span> Debt Management cockpit
            </p>
            {activeDebts ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-900 bg-opacity-40 p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Debt Reduction Portfolio</p>
                      <p className="text-[10px] text-gray-500">Active strategies synced</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase">EMI Outflow</p>
                    <p className="text-xs font-extrabold font-mono" style={{ color: "#ff4d6a" }}>{formatINRFull(activeDebts.totalEMI)}/mo</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-gray-950 bg-opacity-40 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500">Liabilities</p>
                    <p className="text-xs font-extrabold font-mono mt-0.5" style={{ color: "var(--text-primary)" }}>{formatINR(activeDebts.totalDebt)}</p>
                  </div>
                  <div className="p-2 bg-gray-950 bg-opacity-40 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500">Debt-Free In</p>
                    <p className="text-xs font-extrabold font-mono mt-0.5" style={{ color: "#10d078" }}>{Math.ceil(activeDebts.debtFreeMonth / 12)} yrs</p>
                  </div>
                  <div className="p-2 bg-gray-950 bg-opacity-40 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500">Stability Score</p>
                    <p className="text-xs font-extrabold font-mono mt-0.5" style={{ color: activeDebts.stabilityScore >= 60 ? "#10d078" : "#ff4d6a" }}>{activeDebts.stabilityScore}/100</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-gray-400">Repayment Stress:</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full text-[10px]" style={{
                    background: activeDebts.stressScore > 55 ? "rgba(255,77,106,0.1)" : "rgba(16,208,120,0.1)",
                    color: activeDebts.stressScore > 55 ? "var(--red)" : "var(--green)"
                  }}>
                    {activeDebts.stressScore > 55 ? "High Pressure" : "Stable Buffer"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-3xl mb-3">🛡️</span>
                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>No Active Payoff Strategy</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Track outstanding liabilities, model Avalanche / Snowball payouts, and fast-track debt freedom.
                </p>
                <Link to="/debt-management" className="mt-4 px-4 py-1.5 rounded-lg text-[10px] font-bold text-gray-950 no-underline" style={{ background: "linear-gradient(135deg, #ff4d6a, #c084fc)" }}>
                  Configure Debts →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ 5. FINANCIAL TIMELINE SECTION ═══════════ */}
        <section className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-6 gap-3" style={{ borderColor: "var(--bg-border)" }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Financial Timelines Forecast</h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Interactive predictive models mapped over 12 months</p>
            </div>
            
            {/* Tabs for Timeline Charts */}
            <div className="flex gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800 self-start">
              {[
                { id: "networth", label: "Net Worth" },
                { id: "savings", label: "Savings" },
                { id: "debt", label: "Debt Curve" },
                { id: "cashflow", label: "Cash Flow" },
                { id: "health", label: "Health Score" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: activeTab === tab.id ? "var(--bg-elevated)" : "transparent",
                    color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: activeTab === tab.id ? "1px solid rgba(0,212,170,0.15)" : "1px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display Container */}
          <div style={{ width: "100%", height: 300 }}>
            {activeTab === "networth" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/100000).toFixed(1)}L`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="netWorth" name="Projected Net Worth" stroke="var(--accent-primary)" fill="url(#gradNetWorth)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === "savings" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/100000).toFixed(1)}L`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="savings" name="Reserves Value" stroke="#10d078" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeTab === "debt" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDebtTimeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff4d6a" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ff4d6a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/100000).toFixed(1)}L`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="debt" name="Outstanding Liabilities" stroke="#ff4d6a" fill="url(#gradDebtTimeline)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeTab === "cashflow" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { label: "Gross Income", amount: monthlyIncome, color: "#00d4aa" },
                  { label: "Standard Expenses", amount: monthlyExpenses, color: "#f5a623" },
                  { label: "Active EMIs", amount: totalEMIs, color: "#ff4d6a" },
                  { label: "Savings Surplus", amount: netSavings, color: "#10d078" },
                ]} margin={{ top: 10, right: 10, left: -5, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="amount" name="Value" radius={[4,4,0,0]}>
                    <Area type="monotone" dataKey="amount" fill="#00d4aa" />
                    {/* Recharts inline custom colors */}
                    {[
                      { fill: "var(--accent-primary)" },
                      { fill: "#f5a623" },
                      { fill: "#ff4d6a" },
                      { fill: "#10d078" }
                    ].map((entry, idx) => (
                      <Bar key={idx} dataKey="amount" fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === "health" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthTimeline} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="score" name="Health Score Index" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ r: 4, stroke: "var(--bg-base)", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Personality & Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ═══════════ 6. AI EXECUTIVE INSIGHTS SECTION ═══════════ */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                🧠 Executive Decision Engine
              </p>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                AI Pipeline Active
              </span>
            </div>

            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="card"
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    borderLeft: `3px solid ${insight.type === "alert" ? "var(--red)" : insight.type === "warning" ? "var(--yellow)" : "var(--green)"}`,
                  }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>{insight.title}</p>
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════ 7. FINANCIAL PERSONALITY PANEL ═══════════ */}
          <div className="lg:col-span-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
              ✨ Financial Archetype
            </p>
            
            <div
              className="card relative overflow-hidden flex flex-col justify-between"
              style={{
                height: "calc(100% - 24px)",
                borderTop: `3px solid ${personality.badgeColor}`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${personality.badgeColor}08 0%, transparent 70%)`
                }}
              />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{personality.emoji}</span>
                  <h4 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                    {personality.name}
                  </h4>
                </div>

                <p className="text-[11.5px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  {personality.description}
                </p>
              </div>

              <div className="bg-gray-950 bg-opacity-50 p-3 rounded-lg border border-gray-800 mt-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Strategic Recommendation
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {personality.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals & Future Prep */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ═══════════ 8. GOAL TRACKING SECTION ═══════════ */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
              🎯 Financial Milestones tracking
            </p>
            
            <div className="card space-y-4">
              {goals.map(g => (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                      <span>{g.icon}</span> {g.label}
                    </span>
                    <span className="font-bold font-mono" style={{ color: g.color }}>
                      {g.pct}%
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${g.pct}%`,
                        background: g.color,
                        boxShadow: `0 0 6px ${g.color}50`
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════ 9. FUTURE ARCHITECTURE PREPARATION ═══════════ */}
          <div className="lg:col-span-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
              🔐 Future Enterprise Stack
            </p>
            
            <div className="card space-y-3 relative overflow-hidden" style={{ borderTop: "3px solid var(--accent-primary)", animation: "borderGlow 5s infinite" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚙️</span>
                <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  Firebase Sync & Firestore Hooks
                </h4>
              </div>

              <p className="text-[10.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                This identity profile is fully standardized. Swapping the active state persistency layer to Firestore involves matching the model parameters already integrated within `OnboardingContext.jsx`.
              </p>

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-emerald-500">✔</span>
                  <span>User UID Session Mapping ready</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-emerald-500">✔</span>
                  <span>Real-time aggregation API nodes</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="text-emerald-500">✔</span>
                  <span>Export Report PDF handler hook</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

// ── Shared Subcomponents ──

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 }}>
        {title}
      </p>
      {subtitle && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{subtitle}</p>}
    </div>
  );
}

function SnapshotCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ padding: "12px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
          <p className="text-lg font-extrabold font-mono mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>{value}</p>
          {sub ? (
            <p className="text-[9px] text-gray-500 truncate mt-0.5">{sub}</p>
          ) : (
            <p className="text-[9px] text-gray-400 mt-0.5">Connected node</p>
          )}
        </div>
        <span className="text-xl flex-shrink-0">{icon}</span>
      </div>
    </div>
  );
}

// Fallback to fetch Liquid Savings safely
function currentSavings(summary, onboardingData) {
  if (summary?.net_savings > 0) {
    return summary.net_savings;
  }
  // Estimated baseline liquid buffer
  const monthlySavingsGoal = parseFloat(onboardingData.monthlySavingsGoal) || 20000;
  return monthlySavingsGoal * 4;
}
