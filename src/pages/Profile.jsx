import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, appearance, resetUser } = useUser();
  const navigate = useNavigate();

  // Extract initials dynamically
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AK";

  return (
    <main className="flex-1 overflow-y-auto p-6 page-fade-in" style={{ background: "var(--bg-base)" }}>
      {/* ═══════════ HERO BANNER HEADER ═══════════ */}
      <section 
        className="card mb-6 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          background: "linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(77,159,255,0.04) 50%, rgba(192,132,252,0.04) 100%)",
          borderColor: "var(--bg-border)",
        }}
      >
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold select-none flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), #4d9fff)",
              color: "#fff",
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
          >
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {user?.fullName || "Aryan Kumar"}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border"
                style={{
                  background: "var(--accent-glow)",
                  borderColor: "rgba(0, 212, 170, 0.2)",
                  color: "var(--accent-primary)",
                }}
              >
                {user?.completed ? "Verified Account" : "Demo Account"}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {user?.occupation || "Senior Portfolio Analyst"} • {user?.cityCountry || "New Delhi, India"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--bg-border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--bg-border)"}
          >
            Edit Identity Settings
          </button>
          <button
            onClick={() => {
              resetUser();
              navigate("/settings");
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-all border border-red-950 text-red-400 bg-red-950 bg-opacity-20 hover:bg-opacity-30"
          >
            Reset Profile
          </button>
        </div>
      </section>

      {/* ═══════════ DETAILED PROFILE DATA ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SaaS User Settings Parameters */}
        <div className="card space-y-5 lg:col-span-2">
          <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              👤 SaaS Identity Snapshot
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Detailed ledger mappings synced globally</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)" }}>
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Monthly Income</p>
              <p className="text-base font-bold font-finance mt-1" style={{ color: "var(--text-primary)" }}>
                ₹{(user?.monthlyIncome || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Primary cash-inflow ledger</p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)" }}>
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Risk Appetite</p>
              <p className="text-base font-bold mt-1 capitalize" style={{ color: "var(--accent-primary)" }}>
                {user?.riskAppetite || "Moderate"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Investment volatility tolerance</p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)" }}>
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Employment Status</p>
              <p className="text-base font-bold capitalize mt-1" style={{ color: "var(--text-primary)" }}>
                {user?.employmentType || "Salaried"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Tax and stability factor</p>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)" }}>
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">Savings Target</p>
              <p className="text-base font-bold font-finance mt-1" style={{ color: "var(--green)" }}>
                ₹{(user?.monthlySavingsGoal || 40000).toLocaleString("en-IN")} / mo
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Minimum recurring buffer</p>
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: "var(--bg-border)" }}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Core Financial Motivations</p>
            <div className="flex flex-wrap gap-2">
              {(user?.goals || ["investment", "savings"]).map((g, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)", color: "var(--text-secondary)" }}
                >
                  🎯 {g.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Personality Archetype */}
        <div className="card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                ✨ SaaS Archetype Summary
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Intelligent profile analysis model</p>
            </div>

            <div className="p-3 bg-gray-950 bg-opacity-40 rounded-xl border border-gray-900">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {user?.riskAppetite === "high" ? "Aggressive Wealth Compounder" : user?.riskAppetite === "low" ? "Capital Shield Guardian" : "Balanced Portfolio Architect"}
                  </p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Dynamic based on settings</p>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {user?.riskAppetite === "high" 
                  ? "Your profile aggressively seeks equity-heavy compounds, prioritizing substantial capitalization leaps over short-term market drawdowns."
                  : user?.riskAppetite === "low"
                  ? "Your profile is defensive, locking in security layers, fixed cash-reserves, and low-volatility debt pay-down shields."
                  : "Your profile maps standard balanced aggregates. You divide segments cleanly between high-dividend funds and recurring liquidity lines."}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-cyan-950 bg-opacity-20 border border-cyan-900 border-opacity-30">
            <p className="text-[10px] font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AI Advice Active
            </p>
            <p className="text-[10.5px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              To optimize wealth indexing, configure active scheduled investment plans under the Estimator Hub and links settings variables dynamically.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
