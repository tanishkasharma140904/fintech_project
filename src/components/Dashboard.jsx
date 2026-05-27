// ============================================================
// FILE: src/components/Dashboard.jsx  (UPDATED VERSION)
// PURPOSE: Main content page — now includes the full
//          Expense Analytics section below the existing cards.
//
// WHAT CHANGED FROM v1:
//   + 4 new imports (CSVUpload, charts, AIInsights)
//   + A new <section> block for "Expense Analytics"
//   + The placeholder "coming next" block is now replaced
//
// HOW IMPORTS WORK HERE:
//   "./expenses/CSVUpload" means:
//     start in the same folder (components/)
//     go into the expenses/ subfolder
//     find CSVUpload.jsx
// ============================================================

// The 3 original analytics cards data (unchanged from v1)
const ANALYTICS_CARDS = [
  {
    id: "portfolio",
    title: "Total Portfolio",
    value: "₹14,82,340",
    change: "+8.24%",
    changeType: "up",
    period: "vs last month",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    accentColor: "#00d4aa",
    sparkline: [40, 55, 48, 65, 58, 72, 80, 75, 88, 95],
  },
  {
    id: "profit",
    title: "Monthly P&L",
    value: "+₹1,24,780",
    change: "+12.6%",
    changeType: "up",
    period: "vs last month",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    accentColor: "#10d078",
    sparkline: [30, 38, 34, 50, 46, 60, 55, 70, 68, 82],
  },
  {
    id: "risk",
    title: "Risk Score",
    value: "34 / 100",
    change: "-5 pts",
    changeType: "up",
    period: "vs last week",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accentColor: "#4d9fff",
    sparkline: [90, 85, 80, 78, 72, 68, 65, 58, 50, 44],
  },
];

function Sparkline({ points, color }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 40 - ((p - min) / range) * 36 + 2;
    return `${x},${y}`;
  });
  const polylinePoints = coords.join(" ");
  return (
    <svg viewBox="0 0 100 40" width="80" height="32" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,40 ${polylinePoints} 100,40`} fill={`url(#grad-${color.replace("#", "")})`} />
      <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].split(",")[0]} cy={coords[coords.length - 1].split(",")[1]} r="2.5" fill={color} />
    </svg>
  );
}

function AnalyticsCard({ card }) {
  const isUp = card.changeType === "up";
  return (
    <div className="card card-gradient flex flex-col gap-4" style={{ position: "relative", overflow: "hidden" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{card.title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${card.accentColor}18`, border: `1px solid ${card.accentColor}30`, color: card.accentColor }}>{card.icon}</div>
      </div>
      <p className="text-2xl font-bold font-finance" style={{ color: "var(--text-primary)" }}>{card.value}</p>
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col gap-1">
          <span className={`badge ${isUp ? "badge-green" : "badge-red"}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">{isUp ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}</svg>
            {card.change}
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{card.period}</p>
        </div>
        <Sparkline points={card.sparkline} color={card.accentColor} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px rounded-b-xl" style={{ background: `linear-gradient(90deg, transparent, ${card.accentColor}50, transparent)` }} />
    </div>
  );
}

// ── NEW IMPORTS: the 4 expense analytics components ──────────
// Each import path starts with "./expenses/" because these files
// live in src/components/expenses/ and we're in src/components/
import CSVUpload       from "./expenses/CSVUpload";
import ExpensePieChart from "./expenses/ExpensePieChart";
import ExpenseBarChart from "./expenses/ExpenseBarChart";
import AIInsights      from "./expenses/AIInsights";

// ── Main Dashboard Component ─────────────────────────────────
export default function Dashboard() {
  return (
    <main
      className="flex-1 overflow-y-auto p-6"
      style={{ background: "var(--bg-base)" }}
    >

      {/* ── SECTION 1: Page Header ── */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Good morning, Aryan 👋
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Here's what's happening in your portfolio today.
        </p>
      </div>

      {/* ── SECTION 2: Key Metrics Cards ── */}
      <section className="mb-10">
        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)" }}>
          Key Metrics
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {ANALYTICS_CARDS.map((card) => (
            <AnalyticsCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      {/* ── SECTION DIVIDER ── */}
      <div
        className="flex items-center gap-4 mb-8"
        style={{ borderTop: "1px solid var(--bg-border)", paddingTop: "2rem" }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Expense Analytics
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Import, visualise, and understand your spending
          </p>
        </div>
        <div
          className="ml-auto px-3 py-1 rounded-lg text-xs font-medium"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            color: "var(--text-muted)",
          }}
        >
          Step 1 → 4
        </div>
      </div>

      {/* ── STEP 1: CSV Upload ──
          CSVUpload manages its own state (uploaded / not).
          Dashboard just places it. No props needed. */}
      <CSVUpload />

      {/* ── STEP 2 & 3: Charts Side by Side ──
          lg:grid-cols-2 = side by side on large screens
          grid-cols-1    = stacked on mobile */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ExpensePieChart />
        <ExpenseBarChart />
      </section>

      {/* ── STEP 4: AI Insights Full Width ── */}
      <section className="mb-8">
        <AIInsights />
      </section>

    </main>
  );
}