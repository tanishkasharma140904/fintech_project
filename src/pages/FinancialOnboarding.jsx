import { useState } from "react";
import { useOnboarding } from "../context/OnboardingContext";

const EMPLOYMENT_TYPES = [
  { id: "salaried", label: "Salaried Professional", emoji: "👔", desc: "Steady monthly paycheck" },
  { id: "self_employed", label: "Self-Employed", emoji: "💻", desc: "Freelance or contract work" },
  { id: "business_owner", label: "Business Owner", emoji: "🏢", desc: "Run your own company" },
  { id: "student", label: "Student", emoji: "🎓", desc: "Academic or learning phase" },
  { id: "retired", label: "Retired", emoji: "🏖️", desc: "Enjoying post-career life" },
];

const GOAL_OPTIONS = [
  { id: "savings", label: "Build Savings Buffer", emoji: "🛡️", desc: "Grow liquid emergency funds" },
  { id: "investment", label: "Wealth Creation", emoji: "📈", desc: "Maximize capital growth & returns" },
  { id: "debt_payoff", label: "Debt Elimination", emoji: "⛓️", desc: "Pay off loans & credit burden" },
  { id: "retirement", label: "Early Retirement", emoji: "🌴", desc: "Secure long-term financial freedom" },
  { id: "home", label: "Buy a Home/Property", emoji: "🏠", desc: "Save for property down payment" },
  { id: "education", label: "Higher Education", emoji: "📚", desc: "Fund degree or skill courses" },
];

const RISK_APPETITES = [
  {
    id: "conservative",
    label: "Conservative Saver",
    emoji: "🛡️",
    desc: "Capital protection is your top priority. Prefer Fixed Deposits, Gold, and low-volatility debt funds.",
    color: "#10d078",
  },
  {
    id: "moderate",
    label: "Moderate Balanced",
    emoji: "⚖️",
    desc: "A balanced mix of growth and stability. Prefer Mutual Funds, diversified equity portfolios, and blue-chip stocks.",
    color: "#4d9fff",
  },
  {
    id: "aggressive",
    label: "Aggressive Investor",
    emoji: "⚡",
    desc: "High risk for maximum returns. Active stock trading, high-growth tech sectors, crypto, and venture equity.",
    color: "#c084fc",
  },
];

const INVESTMENT_TYPES = [
  { id: "mutual_funds", label: "Mutual Funds", emoji: "📊" },
  { id: "stocks", label: "Direct Equity / Stocks", emoji: "📈" },
  { id: "fixed_deposits", label: "Fixed Deposits / FDs", emoji: "🏦" },
  { id: "real_estate", label: "Real Estate", emoji: "🏠" },
  { id: "crypto", label: "Crypto / Digital Assets", emoji: "🪙" },
  { id: "gold", label: "Gold & Commodities", emoji: "🪙" },
];

const ANIM_CSS = `
@keyframes onboardingFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 16px rgba(0, 212, 170, 0.15); }
  50% { box-shadow: 0 0 32px rgba(0, 212, 170, 0.35); }
}
`;

export default function FinancialOnboarding() {
  const { completeOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    occupation: "",
    cityCountry: "",
    monthlyIncome: "",
    employmentType: "salaried",
    maritalStatus: "single",
    dependents: "0",
    goals: [], // Multi-select array
    monthlySavingsGoal: "",
    riskAppetite: "moderate",
    preferredInvestments: [], // Multi-select array
    hasLoans: "no",
    approxDebtBalance: "0",
  });

  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleGoal = (goalId) => {
    setFormData((prev) => {
      const active = prev.goals.includes(goalId);
      const updated = active
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId];
      return { ...prev, goals: updated };
    });
  };

  const toggleInvestment = (invId) => {
    setFormData((prev) => {
      const active = prev.preferredInvestments.includes(invId);
      const updated = active
        ? prev.preferredInvestments.filter((i) => i !== invId)
        : [...prev.preferredInvestments, invId];
      return { ...prev, preferredInvestments: updated };
    });
  };

  // Inline Step Validations
  const validateStep = () => {
    const errs = {};
    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = "Full name is required";
      if (!formData.age || parseInt(formData.age) <= 0) errs.age = "Valid age is required";
      if (!formData.occupation.trim()) errs.occupation = "Occupation is required";
      if (!formData.cityCountry.trim()) errs.cityCountry = "Location is required";
    } else if (step === 2) {
      if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) {
        errs.monthlyIncome = "Valid monthly income is required";
      }
    } else if (step === 3) {
      if (formData.goals.length === 0) {
        errs.goals = "Please select at least one financial goal";
      }
      if (!formData.monthlySavingsGoal || parseFloat(formData.monthlySavingsGoal) < 0) {
        errs.monthlySavingsGoal = "Valid savings target is required";
      }
    } else if (step === 4) {
      if (formData.preferredInvestments.length === 0) {
        errs.preferredInvestments = "Please select at least one investment preference";
      }
    } else if (step === 5) {
      if (formData.hasLoans === "yes" && (!formData.approxDebtBalance || parseFloat(formData.approxDebtBalance) < 0)) {
        errs.approxDebtBalance = "Please specify approximate debt balance";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    if (validateStep()) {
      completeOnboarding({
        ...formData,
        age: parseInt(formData.age),
        monthlyIncome: parseFloat(formData.monthlyIncome),
        monthlySavingsGoal: parseFloat(formData.monthlySavingsGoal),
        approxDebtBalance: formData.hasLoans === "yes" ? parseFloat(formData.approxDebtBalance) : 0,
        completedAt: new Date().toISOString(),
      });
    }
  };

  // Determine dynamic preview personality for Step 6 summary
  const getPreviewPersonality = () => {
    const income = parseFloat(formData.monthlyIncome) || 1;
    const targetSavings = parseFloat(formData.monthlySavingsGoal) || 0;
    const ratio = (targetSavings / income) * 100;
    const risk = formData.riskAppetite;

    if (risk === "conservative") return "Conservative Saver";
    if (risk === "aggressive") return "Growth-Focused Investor";
    if (ratio > 35) return "Wealth Builder";
    return "Balanced Planner";
  };

  return (
    <main
      className="flex-1 overflow-y-auto flex items-center justify-center p-6"
      style={{
        background: "var(--bg-base)",
        backgroundImage: "radial-gradient(circle at 50% 20%, rgba(0,212,170,0.03) 0%, transparent 60%)",
      }}
    >
      <style>{ANIM_CSS}</style>

      <div
        className="w-full max-w-2xl card relative"
        style={{
          animation: "onboardingFadeIn 0.5s ease-out",
          background: "linear-gradient(180deg, var(--bg-surface) 0%, rgba(17,24,39,0.8) 100%)",
          borderTop: "3px solid var(--accent-primary)",
        }}
      >
        {/* Step Indicator Top */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--accent-primary)" }}
            >
              Step {step} of 6
            </span>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {step === 1 && "Personal Financial Identity"}
              {step === 2 && "Income & Career Profile"}
              {step === 3 && "Financial Goals & Aspirations"}
              {step === 4 && "Risk & Investment DNA"}
              {step === 5 && "Liabilities & Outstanding Debt"}
              {step === 6 && "Create Your Financial Personality"}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-secondary)" }}>
              {Math.round((step / 6) * 100)}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(step / 6) * 100}%`,
              background: "linear-gradient(90deg, var(--accent-primary), #4d9fff)",
            }}
          />
        </div>

        {/* ═══════════ STEP CONTENT ═══════════ */}

        {/* STEP 1: Personal Profile */}
        {step === 1 && (
          <div style={{ animation: "onboardingFadeIn 0.3s ease" }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OnboardingField
                label="Full Name"
                placeholder="Aryan Kumar"
                value={formData.fullName}
                onChange={(v) => updateField("fullName", v)}
                error={errors.fullName}
                icon="👤"
              />
              <OnboardingField
                label="Age"
                placeholder="28"
                type="number"
                value={formData.age}
                onChange={(v) => updateField("age", v)}
                error={errors.age}
                icon="🎂"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OnboardingField
                label="Occupation / Designation"
                placeholder="Senior Software Engineer"
                value={formData.occupation}
                onChange={(v) => updateField("occupation", v)}
                error={errors.occupation}
                icon="💼"
              />
              <OnboardingField
                label="City, Country"
                placeholder="New Delhi, India"
                value={formData.cityCountry}
                onChange={(v) => updateField("cityCountry", v)}
                error={errors.cityCountry}
                icon="📍"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Income & Employment */}
        {step === 2 && (
          <div style={{ animation: "onboardingFadeIn 0.3s ease" }} className="space-y-6">
            <OnboardingField
              label="Monthly Take-Home Income"
              placeholder="e.g. 150000"
              type="number"
              value={formData.monthlyIncome}
              onChange={(v) => updateField("monthlyIncome", v)}
              error={errors.monthlyIncome}
              prefix="₹"
              icon="💰"
            />

            <div>
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3 block">
                Employment Status
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMPLOYMENT_TYPES.map((e) => {
                  const active = formData.employmentType === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => updateField("employmentType", e.id)}
                      className="p-3 text-left rounded-xl transition-all border flex gap-3 items-start"
                      style={{
                        background: active ? "var(--accent-glow)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent-primary)" : "var(--bg-border)",
                      }}
                    >
                      <span className="text-xl mt-0.5">{e.emoji}</span>
                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: active ? "var(--accent-primary)" : "var(--text-primary)" }}
                        >
                          {e.label}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{e.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2 block">
                  Marital Status (optional)
                </label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => updateField("maritalStatus", e.target.value)}
                  className="w-full p-2.5 rounded-lg text-xs"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <OnboardingField
                label="Number of Dependents (optional)"
                placeholder="0"
                type="number"
                value={formData.dependents}
                onChange={(v) => updateField("dependents", v)}
                icon="👨‍👩‍👧‍👦"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Goals & Vision */}
        {step === 3 && (
          <div style={{ animation: "onboardingFadeIn 0.3s ease" }} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block">
                  What are your primary financial goals?
                </label>
                {errors.goals && <span className="text-[11px] text-red-500">{errors.goals}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOAL_OPTIONS.map((g) => {
                  const active = formData.goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className="p-3 text-left rounded-xl transition-all border flex gap-3 items-start"
                      style={{
                        background: active ? "var(--accent-glow)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent-primary)" : "var(--bg-border)",
                      }}
                    >
                      <span className="text-xl mt-0.5">{g.emoji}</span>
                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: active ? "var(--accent-primary)" : "var(--text-primary)" }}
                        >
                          {g.label}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{g.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <OnboardingField
              label="Target Monthly Savings Goal"
              placeholder="e.g. 40000"
              type="number"
              value={formData.monthlySavingsGoal}
              onChange={(v) => updateField("monthlySavingsGoal", v)}
              error={errors.monthlySavingsGoal}
              prefix="₹"
              icon="🎯"
            />
          </div>
        )}

        {/* STEP 4: Risk & Investment DNA */}
        {step === 4 && (
          <div style={{ animation: "onboardingFadeIn 0.3s ease" }} className="space-y-6">
            <div>
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3 block">
                Select Your Risk Appetite Preset
              </label>
              <div className="space-y-3">
                {RISK_APPETITES.map((r) => {
                  const active = formData.riskAppetite === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => updateField("riskAppetite", r.id)}
                      className="w-full p-4 rounded-xl text-left transition-all border flex gap-4 items-center"
                      style={{
                        background: active ? "var(--accent-glow)" : "var(--bg-elevated)",
                        borderColor: active ? r.color : "var(--bg-border)",
                      }}
                    >
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: active ? `${r.color}20` : "var(--bg-surface)", border: `1px solid ${active ? r.color : "var(--bg-border)"}` }}
                      >
                        {r.emoji}
                      </span>
                      <div className="flex-1">
                        <p
                          className="text-xs font-bold"
                          style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                        >
                          {r.label}
                        </p>
                        <p className="text-[10.5px] text-gray-400 mt-0.5 leading-relaxed">{r.desc}</p>
                      </div>
                      {active && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase block">
                  Preferred Investment Vehicles
                </label>
                {errors.preferredInvestments && (
                  <span className="text-[11px] text-red-500">{errors.preferredInvestments}</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {INVESTMENT_TYPES.map((i) => {
                  const active = formData.preferredInvestments.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      onClick={() => toggleInvestment(i.id)}
                      className="p-2.5 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-2"
                      style={{
                        background: active ? "var(--accent-glow)" : "var(--bg-elevated)",
                        borderColor: active ? "var(--accent-primary)" : "var(--bg-border)",
                        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <span>{i.emoji}</span>
                      <span>{i.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Liabilities */}
        {step === 5 && (
          <div style={{ animation: "onboardingFadeIn 0.3s ease" }} className="space-y-6">
            <div>
              <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3 block">
                Do you currently have outstanding loans, debts, or credit liabilities?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateField("hasLoans", "no")}
                  className="p-4 rounded-xl text-center border text-xs font-bold transition-all"
                  style={{
                    background: formData.hasLoans === "no" ? "rgba(16,208,120,0.08)" : "var(--bg-elevated)",
                    borderColor: formData.hasLoans === "no" ? "var(--green)" : "var(--bg-border)",
                    color: formData.hasLoans === "no" ? "var(--green)" : "var(--text-secondary)",
                  }}
                >
                  🟢 No active loans
                </button>
                <button
                  onClick={() => updateField("hasLoans", "yes")}
                  className="p-4 rounded-xl text-center border text-xs font-bold transition-all"
                  style={{
                    background: formData.hasLoans === "yes" ? "rgba(255,77,106,0.08)" : "var(--bg-elevated)",
                    borderColor: formData.hasLoans === "yes" ? "var(--red)" : "var(--bg-border)",
                    color: formData.hasLoans === "yes" ? "var(--red)" : "var(--text-secondary)",
                  }}
                >
                  🔴 Yes, I have active debt
                </button>
              </div>
            </div>

            {formData.hasLoans === "yes" && (
              <div style={{ animation: "onboardingFadeIn 0.3s ease" }}>
                <OnboardingField
                  label="Approximate Total Outstanding Liabilities"
                  placeholder="e.g. 1500000"
                  type="number"
                  value={formData.approxDebtBalance}
                  onChange={(v) => updateField("approxDebtBalance", v)}
                  error={errors.approxDebtBalance}
                  prefix="₹"
                  icon="💸"
                />
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  💡 This includes home loans, car loans, personal loans, or outstanding credit card balances. We'll
                  use this to dynamically establish your combined debt stress score.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Summary */}
        {step === 6 && (
          <div style={{ animation: "onboardingFadeIn 0.3s ease" }} className="space-y-6">
            <div className="p-4 rounded-xl border bg-opacity-40" style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)" }}>
              <div className="flex gap-4 items-center mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), #4d9fff)",
                    color: "var(--bg-base)",
                  }}
                >
                  {formData.fullName ? formData.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "AK"}
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {formData.fullName}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {formData.occupation} • {formData.cityCountry}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                    style={{
                      background: "rgba(0,212,170,0.1)",
                      color: "var(--accent-primary)",
                      border: "1px solid rgba(0,212,170,0.2)",
                    }}
                  >
                    {getPreviewPersonality()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mt-2 border-t pt-4" style={{ borderColor: "var(--bg-border)" }}>
                <div>
                  <p className="text-gray-500">Monthly Income</p>
                  <p className="font-semibold text-sm mt-0.5 font-finance" style={{ color: "var(--text-primary)" }}>
                    ₹{parseFloat(formData.monthlyIncome).toLocaleString("en-IN")}/mo
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Savings Target</p>
                  <p className="font-semibold text-sm mt-0.5 font-finance" style={{ color: "var(--green)" }}>
                    ₹{parseFloat(formData.monthlySavingsGoal).toLocaleString("en-IN")}/mo
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Risk DNA Profile</p>
                  <p className="font-semibold mt-0.5 capitalize" style={{ color: "var(--text-primary)" }}>
                    {formData.riskAppetite}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Liabilities</p>
                  <p
                    className="font-semibold mt-0.5 font-finance"
                    style={{ color: formData.hasLoans === "yes" ? "var(--red)" : "var(--green)" }}
                  >
                    {formData.hasLoans === "yes"
                      ? `₹${parseFloat(formData.approxDebtBalance).toLocaleString("en-IN")}`
                      : "Debt Free"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs bg-cyan-950 bg-opacity-20 border border-cyan-800 border-opacity-30">
              <span className="text-base mt-0.5">🧠</span>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                By finalizing, Antigravity AI will create a **premium personalized financial identity dashboard** linking
                your expense trends, planned investments, and liabilities. You can override these options anytime.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════ NAVIGATION BUTTONS ═══════════ */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t" style={{ borderColor: "var(--bg-border)" }}>
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-lg text-xs font-bold transition-all border"
              style={{
                background: "transparent",
                borderColor: "var(--bg-border)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--text-muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bg-border)"; }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary), #00b894)",
                color: "var(--bg-base)",
                boxShadow: "0 4px 14px rgba(0, 212, 170, 0.25)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary), #00d4aa)",
                color: "var(--bg-base)",
                boxShadow: "0 0 20px rgba(0, 212, 170, 0.4)",
                animation: "pulseGlow 2s infinite",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Generate Portfolio Profile ✨
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// Custom Helper Input Component
function OnboardingField({ label, placeholder, value, onChange, error, type = "text", prefix, suffix, icon }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </label>
        {error && <span className="text-[10px] text-red-500">{error}</span>}
      </div>
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all"
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${error ? "var(--red)" : "var(--bg-border)"}`,
        }}
        onFocus={(e) => {
          if (!error) e.currentTarget.style.borderColor = "var(--accent-primary)";
        }}
        onBlur={(e) => {
          if (!error) e.currentTarget.style.borderColor = "var(--bg-border)";
        }}
      >
        {prefix && <span className="text-xs font-bold text-gray-500 font-mono">{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        />
        {suffix && <span className="text-xs text-gray-500 font-mono">{suffix}</span>}
      </div>
    </div>
  );
}
