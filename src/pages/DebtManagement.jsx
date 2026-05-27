import { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line,
} from "recharts";
import { useAnalytics } from "../context/AnalyticsContext";
import useDebtAnalyzer from "../hooks/useDebtAnalyzer";
import { DEBT_PRESETS, DEBT_PRESET_LIST, calculateEMI, formatINR, formatINRFull } from "../utils/debtCalculators";

const ANIM = `
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,212,170,.2)}50%{box-shadow:0 0 40px rgba(0,212,170,.4)}}
`;

let nextDebtId = 1;
function makeDebt(typeId = "home") {
  const p = DEBT_PRESETS[typeId];
  return {
    id: nextDebtId++, type: typeId, label: p.label, emoji: p.emoji, color: p.color,
    amount: 0, rate: p.defaultRate, emi: 0, tenure: p.defaultTenure,
  };
}

/* ═══════════════════════════════════════════════════════════ */
/*  SHARED ATOMS                                               */
/* ═══════════════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(17,24,39,.95)", border: "1px solid var(--bg-border)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 12px 40px rgba(0,0,0,.5)", backdropFilter: "blur(12px)" }}>
      {label && <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6 }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>{typeof p.value === "number" && p.value > 1000 ? formatINRFull(p.value) : p.value}</span>
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
    </svg>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</p>}
    </div>
  );
}

function HeroBadge({ label, value, color }) {
  return (
    <div style={{ padding: "6px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--bg-border)", textAlign: "center" }}>
      <p style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "var(--font-mono)", margin: 0 }}>{value}</p>
    </div>
  );
}

function RiskChip({ label, level }) {
  const c = level === "high" ? "#ff4d6a" : level === "med" ? "#f5a623" : "#10d078";
  return <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: `${c}12`, color: c, border: `1px solid ${c}25` }}>{label}</span>;
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 3, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                  */
/* ═══════════════════════════════════════════════════════════ */

export default function DebtManagement() {
  const { analytics } = useAnalytics();
  const summary = analytics?.summary;

  /* ── Profile ── */
  const [profile, setProfile] = useState({ monthlyIncome: 0, monthlyExpenses: 0, currentSavings: 0 });
  const [profileEditing, setProfileEditing] = useState({});

  useEffect(() => {
    if (summary) {
      const months = Math.max(1, analytics?.by_month?.length || 1);
      setProfile(prev => ({
        monthlyIncome: summary.total_income > 0 ? Math.round(summary.total_income / months) : prev.monthlyIncome,
        monthlyExpenses: summary.avg_monthly_spending || prev.monthlyExpenses,
        currentSavings: Math.max(0, summary.net_savings) || prev.currentSavings,
      }));
    }
  }, [summary, analytics?.by_month?.length]);

  /* ── Debts ── */
  const [debts, setDebts] = useState([makeDebt("home")]);
  const [activeStrategy, setActiveStrategy] = useState("avalanche");
  const [extraPayment, setExtraPayment] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const addDebt = () => setDebts(prev => [...prev, makeDebt("personal")]);
  const removeDebt = (id) => { setDebts(prev => prev.filter(d => d.id !== id)); setShowResults(false); };
  const updateDebt = (id, key, val) => {
    setDebts(prev => prev.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, [key]: val };
      if (key === "type") {
        const p = DEBT_PRESETS[val];
        updated.label = p.label; updated.emoji = p.emoji; updated.color = p.color;
        updated.rate = p.defaultRate; updated.tenure = p.defaultTenure;
      }
      if (key === "amount" || key === "rate" || key === "tenure") {
        const a = key === "amount" ? val : updated.amount;
        const r = key === "rate" ? val : updated.rate;
        const t = key === "tenure" ? val : updated.tenure;
        if (a > 0 && t > 0) updated.emi = calculateEMI(a, r, t);
      }
      return updated;
    }));
    setShowResults(false);
  };
  const updateProfile = (k, v) => { setProfile(p => ({ ...p, [k]: v })); if (showResults) setShowResults(false); };

  const result = useDebtAnalyzer(debts, profile, extraPayment);
  const healthScore = analytics?.dashboard_cards?.financial_health?.value;
  const activePlan = result.ready ? result.strategies[activeStrategy] : null;

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <style>{ANIM}</style>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ background: "linear-gradient(135deg, rgba(255,77,106,.04) 0%, rgba(192,132,252,.04) 50%, rgba(0,212,170,.04) 100%)", borderBottom: "1px solid var(--bg-border)", padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ff4d6a, #c084fc)", fontSize: 18 }}>🛡️</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Debt Management</h1>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Optimize debts & build a stress-free repayment roadmap</p>
            </div>
          </div>
          {summary && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <HeroBadge label="Income/mo" value={formatINR(Math.round(summary.total_income / Math.max(1, analytics?.by_month?.length || 1)))} color="#00d4aa" />
              {healthScore != null && <HeroBadge label="Health" value={`${healthScore}`} color="#4d9fff" />}
            </div>
          )}
        </div>
      </section>

      <div style={{ padding: "1.5rem" }}>

        {/* ═══════════ FINANCIAL PROFILE ═══════════ */}
        <section style={{ marginBottom: 32 }}>
          <SectionHeader title="Financial Profile" subtitle={summary ? "Auto-detected — click Edit to override" : "Enter your details"} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </section>

        {/* ═══════════ DEBT CARDS ═══════════ */}
        <section style={{ marginBottom: 32 }}>
          <SectionHeader title="Your Debts" subtitle="Add all active loans and credit obligations" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {debts.map((debt, idx) => (
              <DebtCard key={debt.id} debt={debt} index={idx} onUpdate={updateDebt} onRemove={removeDebt}
                canRemove={debts.length > 1} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button onClick={addDebt}
              style={{ padding: "10px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "var(--bg-surface)", color: "var(--accent-primary)", border: "1px solid rgba(0,212,170,.2)", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-glow)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-surface)"; }}
            >+ Add Another Debt</button>

            {debts.some(d => d.amount > 0) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", padding: "6px 14px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Debt:</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ff4d6a" }}>
                  {formatINR(debts.reduce((s, d) => s + (d.amount || 0), 0))}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>Total EMI:</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f5a623" }}>
                  {formatINRFull(debts.reduce((s, d) => s + (d.emi || 0), 0))}/mo
                </span>
              </div>
            )}
          </div>

          {/* Extra payment input */}
          <div className="card" style={{ marginTop: 16, padding: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Extra monthly prepayment</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>₹</span>
              <input type="number" value={extraPayment || ""} onChange={e => { setExtraPayment(parseInt(e.target.value) || 0); setShowResults(false); }}
                style={{ width: 100, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }} />
            </div>
            <button onClick={() => setShowResults(true)}
              style={{ padding: "10px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#00d4aa,#00b894)", color: "#0a0d14", cursor: "pointer", border: "none", boxShadow: "0 4px 20px rgba(0,212,170,.3)", animation: "glow 3s ease-in-out infinite", marginLeft: "auto" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >Analyze Debts →</button>
          </div>
        </section>

        {/* ═══════════ RESULTS ═══════════ */}
        {showResults && result.ready && (
          <div style={{ animation: "fadeSlideIn .5s ease" }}>

            {/* ── Metrics ── */}
            <section style={{ marginBottom: 32 }}>
              <SectionHeader title="Debt Analysis" subtitle="Key metrics across all your debts" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="Total Debt" value={formatINR(result.metrics.totalDebt)} icon="🏦" color="#ff4d6a" />
                <MetricCard label="Total EMI" value={formatINRFull(result.metrics.totalEMI)} icon="💳" color="#f5a623" sub="/month" />
                <MetricCard label="DTI Ratio" value={`${result.metrics.dti}%`} icon="📊"
                  color={result.metrics.dti > 50 ? "#ff4d6a" : result.metrics.dti > 40 ? "#f5a623" : "#10d078"}
                  sub={result.metrics.dti > 50 ? "Critical" : result.metrics.dti > 40 ? "Elevated" : "Healthy"} />
                <MetricCard label="Cash Flow" value={formatINRFull(result.metrics.monthlyCashFlow)} icon="💰"
                  color={result.metrics.monthlyCashFlow > 0 ? "#10d078" : "#ff4d6a"} sub="/month" />
                <MetricCard label="Survival" value={`${result.metrics.survivalMonths.toFixed(1)}mo`} icon="🛡️"
                  color={result.metrics.survivalMonths >= 6 ? "#10d078" : result.metrics.survivalMonths >= 3 ? "#f5a623" : "#ff4d6a"} />
                <MetricCard label="Safe EMI Limit" value={formatINRFull(result.metrics.recommendedMaxEMI)} icon="⚖️" color="#4d9fff" />
              </div>
            </section>

            {/* ── Strategy Selector ── */}
            <section style={{ marginBottom: 32 }}>
              <SectionHeader title="Repayment Strategy" subtitle="Choose your debt payoff approach" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "avalanche", label: "Avalanche", emoji: "🏔️", desc: "Pay highest interest first", sub: "Saves the most money" },
                  { key: "snowball", label: "Snowball", emoji: "☃️", desc: "Pay smallest balance first", sub: "Quick psychological wins" },
                  { key: "balanced", label: "Balanced", emoji: "⚖️", desc: "Spread payments evenly", sub: "Steady reduction" },
                ].map(s => {
                  const plan = result.strategies[s.key];
                  const active = activeStrategy === s.key;
                  return (
                    <button key={s.key} onClick={() => setActiveStrategy(s.key)}
                      className="card" style={{
                        textAlign: "left", cursor: "pointer", position: "relative", overflow: "hidden",
                        borderColor: active ? "rgba(0,212,170,.3)" : "var(--bg-border)",
                        background: active ? "linear-gradient(135deg, rgba(0,212,170,.08), rgba(0,212,170,.02))" : "var(--bg-surface)",
                        boxShadow: active ? "0 0 16px rgba(0,212,170,.1)" : "none",
                        transition: "all .2s",
                      }}>
                      {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#00d4aa,#4d9fff)" }} />}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{s.emoji}</span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: active ? "var(--accent-primary)" : "var(--text-primary)", margin: 0 }}>{s.label}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.desc}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <div>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Debt-free in</p>
                          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", margin: 0 }}>
                            {plan ? `${Math.ceil(plan.debtFreeMonth / 12)}y ${plan.debtFreeMonth % 12}m` : "—"}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total Interest</p>
                          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f5a623", margin: 0 }}>
                            {plan ? formatINR(plan.totalInterest) : "—"}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: 10, color: active ? "var(--accent-primary)" : "var(--text-muted)", marginTop: 8, opacity: .8 }}>{s.sub}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Risk Panel + Recommendations ── */}
            <section style={{ marginBottom: 32 }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Risk Panel */}
                <div className="lg:col-span-2">
                  <div className="card" style={{ height: "100%", position: "relative", overflow: "hidden", borderTop: `3px solid ${result.metrics.riskColor}` }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${result.metrics.riskColor}08 0%, transparent 70%)` }} />
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>Financial Stability</p>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 20 }}>
                      <div style={{ position: "relative" }}>
                        <ScoreRing score={result.metrics.stabilityScore} color={result.metrics.riskColor} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <p style={{ fontSize: 32, fontWeight: 800, color: result.metrics.riskColor, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{result.metrics.stabilityScore}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)" }}>out of 100</p>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: result.metrics.riskColor, textAlign: "center", marginBottom: 8 }}>{result.metrics.riskStatus}</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.5, marginBottom: 16 }}>
                      {result.metrics.stabilityScore >= 70 ? "Your debts are well-managed. Keep up the discipline." :
                       result.metrics.stabilityScore >= 45 ? "Debt is manageable but creating pressure. Follow the recommendations." :
                       "Significant financial stress from debt. Prioritize reducing high-interest obligations."}
                    </p>
                    {/* Risk chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                      {result.metrics.dti > 40 && <RiskChip label={`DTI ${result.metrics.dti}%`} level={result.metrics.dti > 50 ? "high" : "med"} />}
                      {result.metrics.monthlyCashFlow < 0 && <RiskChip label="Negative cash flow" level="high" />}
                      {result.metrics.survivalMonths < 3 && <RiskChip label={`${result.metrics.survivalMonths.toFixed(1)}mo buffer`} level="high" />}
                      {activePlan && <RiskChip label={`Debt-free: ${Math.ceil(activePlan.debtFreeMonth / 12)}yr`} level={activePlan.debtFreeMonth > 120 ? "med" : "low"} />}
                    </div>
                    {/* Future teaser */}
                    <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📋</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Financial Planning</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Long-term forecasting</p>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600, background: "var(--bg-surface)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" }}>Soon</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-3">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-muted)" }}>AI Recommendations</p>
                    <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: "var(--accent-glow)", color: "var(--accent-primary)", border: "1px solid rgba(0,212,170,.2)" }}>AI Active</span>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.recommendations.map((rec, i) => (
                      <div key={rec.id} className="card" style={{
                        padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12,
                        borderLeft: `3px solid ${rec.type === "alert" ? "#ff4d6a" : rec.type === "warning" ? "#f5a623" : "#00d4aa"}`,
                        animation: `fadeSlideIn .4s ease ${i * .08}s both`,
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>{rec.title}</p>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{rec.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ═══════════ CHARTS ═══════════ */}
            <section style={{ marginBottom: 32 }}>
              <SectionHeader title="Visual Analysis" subtitle="Interactive charts for deeper understanding" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Debt Breakdown Donut */}
                <div className="card">
                  <ChartHeader title="Debt Breakdown" subtitle="Distribution by loan type" />
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.debtBreakdown} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {result.debtBreakdown.map(e => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ position: "relative", marginTop: -135, marginBottom: 95, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Total</p>
                    <p style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{formatINR(result.metrics.totalDebt)}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                    {result.debtBreakdown.map(item => (
                      <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>{item.name}</span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{formatINR(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EMI vs Income */}
                <div className="card">
                  <ChartHeader title="EMI vs Income" subtitle="Monthly income allocation" />
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.emiAllocation} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {result.emiAllocation.map(e => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ position: "relative", marginTop: -135, marginBottom: 95, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)" }}>DTI</p>
                    <p style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: result.metrics.dti > 50 ? "#ff4d6a" : "#00d4aa" }}>{result.metrics.dti}%</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                    {result.emiAllocation.map(item => (
                      <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Debt-Free Timeline */}
                {activePlan && activePlan.monthlySnapshots.length > 0 && (
                  <div className="card">
                    <ChartHeader title="Debt-Free Timeline" subtitle={`${activeStrategy.charAt(0).toUpperCase() + activeStrategy.slice(1)} strategy — balance over time`} />
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activePlan.monthlySnapshots.filter((_, i) => i % 3 === 0 || i === activePlan.monthlySnapshots.length - 1)}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradDebt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff4d6a" stopOpacity={.2} />
                              <stop offset="100%" stopColor="#ff4d6a" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={v => v % 12 === 0 ? `Y${v / 12}` : ""} />
                          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="totalRemaining" name="Remaining Debt" stroke="#ff4d6a" fill="url(#gradDebt)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <LegendDot color="#ff4d6a" label={`Debt-free in ${Math.ceil(activePlan.debtFreeMonth / 12)}y ${activePlan.debtFreeMonth % 12}m`} />
                  </div>
                )}

                {/* Interest Over Time */}
                {result.yearlyBreakdown.length > 0 && (
                  <div className="card">
                    <ChartHeader title="Yearly Repayment Split" subtitle="Principal vs interest paid per year" />
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.yearlyBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={result.yearlyBreakdown.length > 15 ? 10 : 16}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="principal" name="Principal" stackId="a" fill="#00d4aa" />
                          <Bar dataKey="interest" name="Interest" stackId="a" fill="#ff4d6a" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                      <LegendDot color="#00d4aa" label="Principal" />
                      <LegendDot color="#ff4d6a" label="Interest" />
                    </div>
                  </div>
                )}

                {/* Cash Flow Bar */}
                <div className="card">
                  <ChartHeader title="Monthly Cash Flow" subtitle="Income allocation breakdown" />
                  <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={50}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="expenses" name="Expenses" stackId="a" fill="#f5a623" />
                        <Bar dataKey="emi" name="EMIs" stackId="a" fill="#ff4d6a" />
                        <Bar dataKey="savings" name="Remaining" stackId="a" fill="#10d078" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <LegendDot color="#f5a623" label="Expenses" />
                    <LegendDot color="#ff4d6a" label="EMIs" />
                    <LegendDot color="#10d078" label="Remaining" />
                  </div>
                </div>

                {/* Stress Trend */}
                {result.stressTrend.length > 1 && (
                  <div className="card">
                    <ChartHeader title="Financial Stability Trend" subtitle="Projected stability as debts are paid off" />
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.stressTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Line type="monotone" dataKey="stress" name="Stability Score" stroke="#00d4aa" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <LegendDot color="#00d4aa" label="Stability score (higher = better)" />
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  SUB-COMPONENTS                                             */
/* ═══════════════════════════════════════════════════════════ */

function ProfileCard({ label, value, icon, color, editing, onToggle, onChange, detected }) {
  return (
    <div className="card" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: .6 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", margin: 0 }}>{label}</p>
        </div>
        <button onClick={onToggle} style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", background: editing ? "var(--accent-glow)" : "var(--bg-elevated)", color: editing ? "var(--accent-primary)" : "var(--text-muted)", border: editing ? "1px solid rgba(0,212,170,.2)" : "1px solid var(--bg-border)", transition: "all .15s" }}>{editing ? "Done" : "Edit"}</button>
      </div>
      {editing ? (
        <input type="number" value={value || ""} onChange={e => onChange(parseFloat(e.target.value) || 0)} autoFocus
          style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-primary)", background: "transparent", border: "none", borderBottom: "2px solid var(--accent-primary)", outline: "none", width: "100%", padding: "4px 0" }} />
      ) : (
        <p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", margin: 0 }}>{formatINRFull(value)}</p>
      )}
      {detected && !editing && <p style={{ fontSize: 10, color, marginTop: 6, opacity: .8 }}>✓ Detected from analytics</p>}
    </div>
  );
}

function DebtCard({ debt, index, onUpdate, onRemove, canRemove }) {
  return (
    <div className="card" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${debt.color}, transparent)` }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{debt.emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Debt #{index + 1}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{debt.label}</p>
        </div>
        {debt.emi > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>EMI</p>
            <p style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f5a623", margin: 0 }}>{formatINRFull(debt.emi)}</p>
          </div>
        )}
        {canRemove && (
          <button onClick={() => onRemove(debt.id)}
            style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(255,77,106,.08)", color: "#ff4d6a", border: "1px solid rgba(255,77,106,.15)" }}>✕</button>
        )}
      </div>

      {/* Type selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {DEBT_PRESET_LIST.map(p => (
          <button key={p.id} onClick={() => onUpdate(debt.id, "type", p.id)}
            style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, transition: "all .15s",
              background: debt.type === p.id ? "var(--accent-glow)" : "var(--bg-elevated)",
              color: debt.type === p.id ? "var(--accent-primary)" : "var(--text-secondary)",
              border: debt.type === p.id ? "1px solid rgba(0,212,170,.2)" : "1px solid var(--bg-border)",
            }}>
            <span style={{ fontSize: 13 }}>{p.emoji}</span>{p.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DebtField label="Loan Amount" prefix="₹" value={debt.amount} onChange={v => onUpdate(debt.id, "amount", v)} />
        <DebtField label="Interest Rate" suffix="% p.a." value={debt.rate} onChange={v => onUpdate(debt.id, "rate", v)} isDecimal />
        <DebtField label="Tenure" suffix="years" value={debt.tenure} onChange={v => onUpdate(debt.id, "tenure", v)} />
        <DebtField label="Monthly EMI" prefix="₹" value={debt.emi} onChange={v => onUpdate(debt.id, "emi", v)} highlight />
      </div>
    </div>
  );
}

function DebtField({ label, value, onChange, prefix, suffix, isDecimal, highlight }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8,
        background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", transition: "border-color .15s",
      }}
        onFocus={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
        onBlur={e => e.currentTarget.style.borderColor = "var(--bg-border)"}
      >
        {prefix && <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{prefix}</span>}
        <input type="number" value={value || ""} step={isDecimal ? "0.1" : "1"}
          onChange={e => onChange(isDecimal ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: highlight ? "#f5a623" : "var(--text-primary)", minWidth: 0 }} />
        {suffix && <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ padding: 14, textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
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
