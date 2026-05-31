import { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { useAnalytics } from "../context/AnalyticsContext";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import useInvestmentCalculator from "../hooks/useInvestmentCalculator";
import { INVESTMENT_PRESETS, formatINR, formatINRFull } from "../utils/financeCalculators";
import { useNotifications } from "../context/NotificationContext";

const PRESET_LIST = Object.values(INVESTMENT_PRESETS);

/* ═══════════════════════════════════════════════════════════
   SHARED UI ATOMS
   ═══════════════════════════════════════════════════════════ */

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
            {formatINRFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreRing({ score, color, size = 140 }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
    </svg>
  );
}

const ANIM_CSS = `
@keyframes fadeSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
@keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,212,170,0.2); } 50% { box-shadow: 0 0 40px rgba(0,212,170,0.4); } }
`;

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function InvestmentEstimator() {
  const { analytics } = useAnalytics();
  const { currentUser } = useAuth();
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const summary = analytics?.summary;

  const [profile, setProfile] = useState({ monthlyIncome: 0, monthlyExpenses: 0, currentSavings: 0, emergencyReserve: 0 });
  const [profileEditing, setProfileEditing] = useState({});
  const [selectedType, setSelectedType] = useState("house");
  const [form, setForm] = useState({
    totalCost: INVESTMENT_PRESETS.house.defaultCost,
    downPayment: Math.round(INVESTMENT_PRESETS.house.defaultCost * INVESTMENT_PRESETS.house.defaultDownPct / 100),
    interestRate: INVESTMENT_PRESETS.house.defaultRate,
    loanYears: INVESTMENT_PRESETS.house.defaultYears,
    existingEMIs: 0,
  });
  const [showResults, setShowResults] = useState(false);

  // Load from localStorage dynamically when currentUser is resolved
  useEffect(() => {
    const uid = currentUser?.uid || "guest";
    try {
      const savedProfile = localStorage.getItem(`fintech_estimator_profile_${uid}`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        parsed.monthlyIncome = user?.effectiveIncome || user?.monthlyIncome || parsed.monthlyIncome || 0;
        setProfile(parsed);
      } else {
        setProfile({ 
          monthlyIncome: user?.effectiveIncome || user?.monthlyIncome || 0, 
          monthlyExpenses: 0, 
          currentSavings: 0, 
          emergencyReserve: 0 
        });
      }

      const savedType = localStorage.getItem(`fintech_estimator_selected_type_${uid}`);
      setSelectedType(savedType || "house");

      const savedForm = localStorage.getItem(`fintech_estimator_form_${uid}`);
      if (savedForm) {
        setForm(JSON.parse(savedForm));
      } else {
        setForm({
          totalCost: INVESTMENT_PRESETS.house.defaultCost,
          downPayment: Math.round(INVESTMENT_PRESETS.house.defaultCost * INVESTMENT_PRESETS.house.defaultDownPct / 100),
          interestRate: INVESTMENT_PRESETS.house.defaultRate,
          loanYears: INVESTMENT_PRESETS.house.defaultYears,
          existingEMIs: 0,
        });
      }

      const savedShow = localStorage.getItem(`fintech_estimator_show_results_${uid}`);
      setShowResults(savedShow === "true");
    } catch (e) {
      console.error("Error loading estimator state from localStorage:", e);
    }
  }, [currentUser, user]);

  // Dynamic self-healing auto-fill from CSV analytics when it becomes available
  useEffect(() => {
    if (summary && profile.monthlyIncome === 0 && profile.monthlyExpenses === 0) {
      setProfile({
        monthlyIncome: user?.effectiveIncome || user?.monthlyIncome || 0,
        monthlyExpenses: Math.round(summary.avg_monthly_spending) || 0,
        currentSavings: Math.max(0, Math.round(summary.net_savings)) || 0,
        emergencyReserve: Math.round((summary.avg_monthly_spending || 0) * 3),
      });
    }
  }, [summary, analytics?.by_month?.length, profile.monthlyIncome, profile.monthlyExpenses]);

  const handleTypeChange = useCallback((typeId) => {
    setSelectedType(typeId);
    const p = INVESTMENT_PRESETS[typeId];
    setForm(prev => ({
      totalCost: p.defaultCost,
      downPayment: Math.round(p.defaultCost * p.defaultDownPct / 100),
      interestRate: p.defaultRate,
      loanYears: p.defaultYears,
      existingEMIs: prev.existingEMIs,
    }));
    setShowResults(false);
  }, []);

  const updateForm = (k, v) => { setForm(p => ({ ...p, [k]: v })); setShowResults(false); };
  const updateProfile = (k, v) => { setProfile(p => ({ ...p, [k]: v })); if (showResults) setShowResults(false); };

  const result = useInvestmentCalculator(form, profile);

  // Sync to localStorage
  useEffect(() => {
    const uid = currentUser?.uid || "guest";
    try {
      localStorage.setItem(`fintech_estimator_form_${uid}`, JSON.stringify(form));
      localStorage.setItem(`fintech_estimator_profile_${uid}`, JSON.stringify(profile));
      localStorage.setItem(`fintech_estimator_selected_type_${uid}`, selectedType);
      localStorage.setItem(`fintech_estimator_show_results_${uid}`, showResults ? "true" : "false");

      if (showResults && result.ready) {
        const activeInvestmentData = {
          type: selectedType,
          emoji: INVESTMENT_PRESETS[selectedType]?.emoji || "⚙️",
          label: INVESTMENT_PRESETS[selectedType]?.label || "Custom Investment",
          cost: form.totalCost,
          downPayment: form.downPayment,
          loanYears: form.loanYears,
          interestRate: form.interestRate,
          emi: result.metrics.emi,
          feasibilityScore: result.metrics.feasibilityScore,
          feasibilityStatus: result.metrics.feasibilityStatus,
          feasibilityColor: result.metrics.feasibilityColor,
          affordabilityRatio: result.metrics.affordabilityRatio,
          dti: result.metrics.dti,
          totalInterest: result.metrics.totalInterest,
          recommendations: result.recommendations,
          ready: true,
        };
        localStorage.setItem(`fintech_active_investment_${uid}`, JSON.stringify(activeInvestmentData));
      }
    } catch (e) {
      console.error("Error persisting Investment Estimator state to localStorage:", e);
    }
  }, [form, profile, selectedType, showResults, result, currentUser]);

  // Trigger notifications on successful analysis
  useEffect(() => {
    if (showResults && result.ready) {
      // 1. Affordability analysis generated
      addNotification({
        title: "Affordability Analysis Generated",
        description: `Feasibility score is ${result.metrics.feasibilityScore}/100 for your "${INVESTMENT_PRESETS[selectedType]?.label || "Investment"}" plan.`,
        category: "Investment",
        priority: "medium",
      });

      // 2. EMI calculation completed
      addNotification({
        title: "EMI Calculation Completed",
        description: `Your computed monthly payment for this investment is ${formatINRFull(result.metrics.emi)}.`,
        category: "Investment",
        priority: "low",
      });

      // 3. Budget risk warning triggered (if feasibility score < 50 or DTI > 36 or negative remaining savings)
      if (result.metrics.feasibilityScore < 50 || result.metrics.dti > 36 || result.metrics.remainingSavings <= 0) {
        addNotification({
          title: "Budget Risk Warning Triggered",
          description: `High risk indicators flagged. DTI ratio is ${result.metrics.dti}% and feasibility is ${result.metrics.feasibilityStatus}.`,
          category: "Investment",
          priority: "high",
        });
      }
    }
  }, [showResults, result.ready, selectedType, result.metrics?.feasibilityScore, result.metrics?.emi, result.metrics?.dti, result.metrics?.remainingSavings, result.metrics?.feasibilityStatus, addNotification]);

  const healthScore = analytics?.dashboard_cards?.financial_health?.value;

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <style>{ANIM_CSS}</style>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(77,159,255,0.04) 50%, rgba(192,132,252,0.04) 100%)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "2rem 1.5rem 1.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #00d4aa, #4d9fff)", fontSize: 18,
              }}>📊</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
                  Investment Estimator
                </h1>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  AI-powered affordability & risk analysis for major financial decisions
                </p>
              </div>
            </div>
          </div>

          {summary && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <HeroBadge label="Income/mo" value={formatINR(Math.round(summary.total_income / Math.max(1, analytics?.by_month?.length || 1)))} color="#00d4aa" />
              <HeroBadge label="Savings" value={`${summary.savings_rate}%`} color="#10d078" />
              {healthScore != null && <HeroBadge label="Health" value={`${healthScore}`} color="#4d9fff" />}
            </div>
          )}
        </div>
      </section>

      <div style={{ padding: "1.5rem" }}>

        {/* ═══════════ FINANCIAL PROFILE ═══════════ */}
        <section style={{ marginBottom: 32 }}>
          <SectionHeader title="Financial Profile" subtitle={summary ? "Auto-detected from your analytics — click Edit to override" : "Enter your financial details manually"} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProfileCard label="Monthly Income" value={profile.monthlyIncome} icon="💰" color="#00d4aa"
              editing={profileEditing.monthlyIncome}
              onToggle={() => setProfileEditing(p => ({ ...p, monthlyIncome: !p.monthlyIncome }))}
              onChange={v => updateProfile("monthlyIncome", v)} detected={!!summary} />
            <ProfileCard label="Monthly Expenses" value={profile.monthlyExpenses} icon="📊" color="#f5a623"
              editing={profileEditing.monthlyExpenses}
              onToggle={() => setProfileEditing(p => ({ ...p, monthlyExpenses: !p.monthlyExpenses }))}
              onChange={v => updateProfile("monthlyExpenses", v)} detected={!!summary} />
            <ProfileCard label="Current Savings" value={profile.currentSavings} icon="🏦" color="#4d9fff"
              editing={profileEditing.currentSavings}
              onToggle={() => setProfileEditing(p => ({ ...p, currentSavings: !p.currentSavings }))}
              onChange={v => updateProfile("currentSavings", v)} detected={!!summary} />
            <ProfileCard label="Emergency Reserve" value={profile.emergencyReserve} icon="🛡️" color="#c084fc"
              editing={profileEditing.emergencyReserve}
              onToggle={() => setProfileEditing(p => ({ ...p, emergencyReserve: !p.emergencyReserve }))}
              onChange={v => updateProfile("emergencyReserve", v)} detected={!!summary} />
          </div>
        </section>

        {/* ═══════════ INVESTMENT TYPE ═══════════ */}
        <section style={{ marginBottom: 32 }}>
          <SectionHeader title="What are you investing in?" subtitle="Select a category for smart defaults, or customize" />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 10, marginBottom: 24,
          }}>
            {PRESET_LIST.map(p => {
              const active = selectedType === p.id;
              return (
                <button key={p.id} onClick={() => handleTypeChange(p.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "14px 8px", borderRadius: 14, cursor: "pointer",
                    background: active
                      ? "linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,212,170,0.04))"
                      : "var(--bg-surface)",
                    border: active ? "1px solid rgba(0,212,170,0.35)" : "1px solid var(--bg-border)",
                    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                    transition: "all 0.2s ease",
                    boxShadow: active ? "0 0 16px rgba(0,212,170,0.15)" : "none",
                    transform: active ? "scale(1.04)" : "scale(1)",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "var(--text-muted)"; e.currentTarget.style.transform = "scale(1.03)"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.transform = "scale(1)"; } }}
                >
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{p.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* ═══════════ FORM ═══════════ */}
          <div className="card" style={{
            background: "linear-gradient(180deg, var(--bg-surface) 0%, rgba(17,24,39,0.6) 100%)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Top accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, #00d4aa, #4d9fff, #c084fc)" }} />

            <div style={{ padding: "4px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 24 }}>{INVESTMENT_PRESETS[selectedType].emoji}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {INVESTMENT_PRESETS[selectedType].label}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                    {INVESTMENT_PRESETS[selectedType].description} • Typical: {formatINR(INVESTMENT_PRESETS[selectedType].typicalMin)} – {formatINR(INVESTMENT_PRESETS[selectedType].typicalMax)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <FormField label="Total Investment Cost" value={form.totalCost} onChange={v => updateForm("totalCost", v)}
                  prefix="₹" icon="🏷️" />
                <FormField label="Down Payment" value={form.downPayment} onChange={v => updateForm("downPayment", v)}
                  prefix="₹" icon="💵"
                  badge={form.totalCost > 0 ? `${((form.downPayment / form.totalCost) * 100).toFixed(0)}%` : null} />
                <FormField label="Loan Interest Rate" value={form.interestRate} onChange={v => updateForm("interestRate", v)}
                  suffix="% p.a." icon="📈" isDecimal />
                <FormField label="Loan Duration" value={form.loanYears} onChange={v => updateForm("loanYears", v)}
                  suffix="years" icon="📅" />
                <FormField label="Existing Monthly EMIs" value={form.existingEMIs} onChange={v => updateForm("existingEMIs", v)}
                  prefix="₹" icon="🔄" />
                <FormField label="Available Savings" value={profile.currentSavings} onChange={v => updateProfile("currentSavings", v)}
                  prefix="₹" icon="🏦" />
              </div>

              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => setShowResults(true)}
                  style={{
                    padding: "12px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(135deg, #00d4aa, #00b894)", color: "#0a0d14",
                    cursor: "pointer", border: "none", transition: "all 0.2s ease",
                    boxShadow: "0 4px 20px rgba(0,212,170,0.3)",
                    animation: "glow 3s ease-in-out infinite",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(0,212,170,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,212,170,0.3)"; }}
                >
                  Analyze Investment →
                </button>
                {result.ready && !showResults && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Click to see detailed analysis</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ RESULTS ═══════════ */}
        {showResults && result.ready && (
          <div style={{ animation: "fadeSlideIn 0.5s ease" }}>

            {/* ── Metrics Strip ── */}
            <section style={{ marginBottom: 32 }}>
              <SectionHeader title="Financial Analysis" subtitle="Key metrics for your investment scenario" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="Monthly EMI" value={formatINRFull(result.metrics.emi)} icon="💳"
                  color={result.metrics.affordabilityRatio > 40 ? "#ff4d6a" : "#00d4aa"} />
                <MetricCard label="Total Interest" value={formatINR(result.metrics.totalInterest)} icon="📊" color="#f5a623" />
                <MetricCard label="Total Payable" value={formatINR(result.metrics.totalPayable)} icon="🧾" color="#4d9fff" />
                <MetricCard label="Affordability" value={`${result.metrics.affordabilityRatio}%`} icon="⚖️"
                  color={result.metrics.affordabilityRatio > 40 ? "#ff4d6a" : result.metrics.affordabilityRatio > 30 ? "#f5a623" : "#10d078"}
                  sub={result.metrics.affordabilityRatio > 40 ? "Risky" : result.metrics.affordabilityRatio > 30 ? "Tight" : "Safe"} />
                <MetricCard label="Debt-to-Income" value={`${result.metrics.dti}%`} icon="🏦"
                  color={result.metrics.dti > 50 ? "#ff4d6a" : result.metrics.dti > 36 ? "#f5a623" : "#10d078"}
                  sub={result.metrics.dti > 50 ? "Critical" : result.metrics.dti > 36 ? "Moderate" : "Healthy"} />
                <MetricCard label="Post-EMI Savings" value={formatINRFull(result.metrics.remainingSavings)} icon="💰"
                  color={result.metrics.remainingSavings > 0 ? "#10d078" : "#ff4d6a"} />
              </div>
            </section>

            {/* ── Feasibility + Recommendations side by side ── */}
            <section style={{ marginBottom: 32 }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Feasibility Panel (2 cols) */}
                <div className="lg:col-span-2">
                  <div className="card" style={{
                    height: "100%", position: "relative", overflow: "hidden",
                    borderTop: `3px solid ${result.metrics.feasibilityColor}`,
                  }}>
                    <div style={{
                      position: "absolute", top: 0, right: 0, width: 150, height: 150, borderRadius: "50%",
                      background: `radial-gradient(circle, ${result.metrics.feasibilityColor}08 0%, transparent 70%)`,
                    }} />

                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                      color: "var(--text-muted)", marginBottom: 16 }}>Investment Feasibility</p>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 20 }}>
                      <div style={{ position: "relative" }}>
                        <ScoreRing score={result.metrics.feasibilityScore} color={result.metrics.feasibilityColor} />
                        <div style={{
                          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <p style={{ fontSize: 32, fontWeight: 800, color: result.metrics.feasibilityColor,
                            fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                            {result.metrics.feasibilityScore}
                          </p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)" }}>out of 100</p>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: 16, fontWeight: 700, color: result.metrics.feasibilityColor,
                      textAlign: "center", marginBottom: 8 }}>
                      {result.metrics.feasibilityStatus}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.5, marginBottom: 16 }}>
                      {result.metrics.feasibilityScore >= 75
                        ? "This investment aligns well with your finances. Proceed with confidence."
                        : result.metrics.feasibilityScore >= 50
                        ? "Feasible but will strain your budget. Review the suggestions."
                        : "Significant financial stress predicted. Consider alternatives."}
                    </p>

                    {/* Risk chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                      {result.metrics.affordabilityRatio > 35 && (
                        <RiskChip label={`EMI ${result.metrics.affordabilityRatio}%`} level={result.metrics.affordabilityRatio > 40 ? "high" : "med"} />
                      )}
                      {result.metrics.dti > 36 && (
                        <RiskChip label={`DTI ${result.metrics.dti}%`} level={result.metrics.dti > 50 ? "high" : "med"} />
                      )}
                      {result.metrics.savingsDepletionPct > 60 && (
                        <RiskChip label={`${result.metrics.savingsDepletionPct.toFixed(0)}% savings used`} level={result.metrics.savingsDepletionPct > 80 ? "high" : "med"} />
                      )}
                      {result.metrics.remainingSavings <= 0 && (
                        <RiskChip label="Negative savings" level="high" />
                      )}
                    </div>

                    {/* Debt management teaser */}
                    <div style={{
                      marginTop: 20, padding: "12px 14px", borderRadius: 10,
                      background: "var(--bg-elevated)", border: "1px solid var(--bg-border)",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 16 }}>🔗</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Debt Management</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Repayment strategies</p>
                      </div>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600,
                        background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--bg-border)",
                      }}>Soon</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations (3 cols) */}
                <div className="lg:col-span-3">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      AI Recommendations
                    </p>
                    <span style={{
                      padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                      background: "var(--accent-glow)", color: "var(--accent-primary)", border: "1px solid rgba(0,212,170,0.2)",
                    }}>AI Active</span>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.recommendations.map((rec, i) => (
                      <div key={rec.id} className="card" style={{
                        padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12,
                        borderLeft: `3px solid ${rec.type === "alert" ? "#ff4d6a" : rec.type === "warning" ? "#f5a623" : "#00d4aa"}`,
                        animation: `fadeSlideIn 0.4s ease ${i * 0.08}s both`,
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>
                            {rec.title}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                            {rec.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Charts ── */}
            <section style={{ marginBottom: 32 }}>
              <SectionHeader title="Visual Analysis" subtitle="Interactive charts for deeper understanding" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* EMI vs Income Donut */}
                <div className="card">
                  <ChartHeader title="Income Allocation" subtitle="Monthly budget after investment" />
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.emiVsIncome} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                          paddingAngle={3} dataKey="value" strokeWidth={0} animationBegin={0} animationDuration={800}>
                          {result.emiVsIncome.map(e => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ position: "relative", marginTop: -140, marginBottom: 100, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Monthly EMI</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                      {formatINR(result.metrics.emi)}
                    </p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                    {result.emiVsIncome.map(item => (
                      <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>{item.name}</span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {profile.monthlyIncome > 0 ? `${((item.value / profile.monthlyIncome) * 100).toFixed(0)}%` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings Projection */}
                <div className="card">
                  <ChartHeader title="Savings Projection" subtitle="Cumulative savings over loan tenure" />
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.savingsProjection} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradWithout" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradWith" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f5a623" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="withoutInvestment" name="Without Investment"
                          stroke="#00d4aa" fill="url(#gradWithout)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="withInvestment" name="With Investment"
                          stroke="#f5a623" fill="url(#gradWith)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                    <LegendDot color="#00d4aa" label="Without investment" />
                    <LegendDot color="#f5a623" label="With investment" dashed />
                  </div>
                </div>

                {/* Loan Repayment */}
                <div className="card">
                  <ChartHeader title="Loan Repayment Schedule" subtitle="Principal vs interest breakdown by year" />
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.loanBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={form.loanYears > 15 ? 10 : 16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="principal" name="Principal" stackId="a" fill="#00d4aa" radius={[0,0,0,0]} />
                        <Bar dataKey="interest" name="Interest" stackId="a" fill="#ff4d6a" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                    <LegendDot color="#00d4aa" label="Principal" />
                    <LegendDot color="#ff4d6a" label="Interest" />
                  </div>
                </div>

                {/* Budget Comparison */}
                <div className="card">
                  <ChartHeader title="Monthly Budget Impact" subtitle="Before vs after this investment" />
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.budgetComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="expenses" name="Expenses" stackId="a" fill="#f5a623" />
                        <Bar dataKey="emi" name="EMIs" stackId="a" fill="#ff4d6a" />
                        <Bar dataKey="savings" name="Savings" stackId="a" fill="#10d078" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <LegendDot color="#f5a623" label="Expenses" />
                    <LegendDot color="#ff4d6a" label="EMIs" />
                    <LegendDot color="#10d078" label="Savings" />
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 }}>
        {title}
      </p>
      {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</p>}
    </div>
  );
}

function HeroBadge({ label, value, color }) {
  return (
    <div style={{
      padding: "6px 14px", borderRadius: 10,
      background: "var(--bg-surface)", border: "1px solid var(--bg-border)",
      textAlign: "center",
    }}>
      <p style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "var(--font-mono)", margin: 0 }}>{value}</p>
    </div>
  );
}

function ProfileCard({ label, value, icon, color, editing, onToggle, onChange, detected }) {
  return (
    <div className="card" style={{
      padding: "16px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.6,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", margin: 0 }}>{label}</p>
        </div>
        <button onClick={onToggle} style={{
          padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
          background: editing ? "var(--accent-glow)" : "var(--bg-elevated)",
          color: editing ? "var(--accent-primary)" : "var(--text-muted)",
          border: editing ? "1px solid rgba(0,212,170,0.2)" : "1px solid var(--bg-border)",
          transition: "all 0.15s ease",
        }}>{editing ? "Done" : "Edit"}</button>
      </div>
      {editing ? (
        <input type="number" value={value || ""} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          autoFocus
          style={{
            fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)",
            color: "var(--accent-primary)", background: "transparent", border: "none",
            borderBottom: `2px solid var(--accent-primary)`,
            outline: "none", width: "100%", padding: "4px 0",
          }} />
      ) : (
        <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", margin: 0 }}>
          {formatINRFull(value)}
        </p>
      )}
      {detected && !editing && (
        <p style={{ fontSize: 10, color, marginTop: 6, opacity: 0.8 }}>✓ Detected from analytics</p>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, prefix, suffix, icon, badge, isDecimal }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        <label style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>{label}</label>
        {badge && (
          <span style={{
            marginLeft: "auto", padding: "1px 7px", borderRadius: 6, fontSize: 9, fontWeight: 700,
            background: "var(--accent-glow)", color: "var(--accent-primary)", border: "1px solid rgba(0,212,170,0.15)",
          }}>{badge}</span>
        )}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10,
        background: "var(--bg-elevated)", border: "1px solid var(--bg-border)",
        transition: "border-color 0.15s ease",
      }}
        onFocus={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
        onBlur={e => e.currentTarget.style.borderColor = "var(--bg-border)"}
      >
        {prefix && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{prefix}</span>}
        <input type="number" value={value || ""} step={isDecimal ? "0.1" : "1"}
          onChange={e => onChange(isDecimal ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)",
          }} />
        {suffix && <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ padding: 14, textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <span style={{ fontSize: 18, display: "block", marginBottom: 4 }}>{icon}</span>
      <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, fontWeight: 600, color, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function ChartHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 10, height: 3, borderRadius: 2, background: dashed ? "transparent" : color,
        border: dashed ? `1px dashed ${color}` : "none",
      }} />
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function RiskChip({ label, level }) {
  const c = level === "high" ? "#ff4d6a" : level === "med" ? "#f5a623" : "#10d078";
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600,
      background: `${c}12`, color: c, border: `1px solid ${c}25`,
    }}>{label}</span>
  );
}
