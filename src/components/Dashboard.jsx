import { useAnalytics } from "../context/AnalyticsContext";
import { useUser } from "../context/UserContext";
import CSVUpload from "./expenses/CSVUpload";
import ExpensePieChart from "./expenses/ExpensePieChart";
import ExpenseBarChart from "./expenses/ExpenseBarChart";
import AIInsights from "./expenses/AIInsights";

// Default cards shown before data is uploaded
const DEFAULT_CARDS = [
  {
    id: "balance",
    title: "Total Balance",
    value: "—",
    change: "—",
    changeType: "up",
    period: "upload CSV to see data",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    accentColor: "#00d4aa",
    sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "savings",
    title: "Monthly Savings",
    value: "—",
    change: "—",
    changeType: "up",
    period: "upload CSV to see data",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    accentColor: "#10d078",
    sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "risk",
    title: "Spending Risk",
    value: "—",
    change: "—",
    changeType: "up",
    period: "upload CSV to see data",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accentColor: "#f5a623",
    sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "health",
    title: "Financial Health",
    value: "—",
    change: "—",
    changeType: "up",
    period: "upload CSV to see data",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    accentColor: "#c084fc",
    sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];

const ICONS = {
  balance: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  savings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  risk: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  health: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
};

const ACCENT_COLORS = {
  balance: "#00d4aa",
  savings: "#10d078",
  risk: "#f5a623",
  health: "#c084fc",
};

function formatINR(num) {
  if (num == null || isNaN(num)) return "—";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

function buildDynamicCards(dashCards) {
  if (!dashCards) return DEFAULT_CARDS;

  const pChg = dashCards.portfolio?.change_pct ?? 0;
  const sChg = dashCards.monthly_pnl?.change_pct ?? 0;
  const riskVal = dashCards.risk_score?.value ?? 50;
  const healthVal = dashCards.financial_health?.value ?? 50;

  return [
    {
      id: "balance",
      title: "Total Balance",
      value: formatINR(dashCards.portfolio?.value),
      change: `${pChg > 0 ? "+" : ""}${pChg.toFixed(1)}%`,
      changeType: pChg >= 0 ? "up" : "down",
      period: "net balance",
      icon: ICONS.balance,
      accentColor: ACCENT_COLORS.balance,
      sparkline: [40, 55, 48, 65, 58, 72, 80, 75, 88, 95],
    },
    {
      id: "savings",
      title: "Monthly Savings",
      value: formatINR(dashCards.monthly_pnl?.value),
      change: `${sChg > 0 ? "+" : ""}${sChg.toFixed(1)}%`,
      changeType: sChg >= 0 ? "up" : "down",
      period: "vs last month",
      icon: ICONS.savings,
      accentColor: ACCENT_COLORS.savings,
      sparkline: [30, 38, 34, 50, 46, 60, 55, 70, 68, 82],
    },
    {
      id: "risk",
      title: "Spending Risk",
      value: `${riskVal} / 100`,
      change: riskVal <= 35 ? "Low risk" : riskVal <= 60 ? "Moderate" : "High risk",
      changeType: riskVal <= 50 ? "up" : "down",
      period: "spending volatility",
      icon: ICONS.risk,
      accentColor: ACCENT_COLORS.risk,
      sparkline: [90, 85, 80, 78, 72, 68, 65, 58, 50, riskVal],
    },
    {
      id: "health",
      title: "Financial Health",
      value: `${healthVal} / 100`,
      change: healthVal >= 70 ? "Excellent" : healthVal >= 45 ? "Good" : "Needs work",
      changeType: healthVal >= 50 ? "up" : "down",
      period: "composite score",
      icon: ICONS.health,
      accentColor: ACCENT_COLORS.health,
      sparkline: [20, 30, 35, 42, 50, 55, 60, 65, 72, healthVal],
    },
  ];
}

function Sparkline({ points, color }) {
  if (!points || points.length < 2 || points.every(p => p === 0)) {
    return (
      <svg viewBox="0 0 100 40" width="80" height="32">
        <line x1="0" y1="20" x2="100" y2="20" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      </svg>
    );
  }
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

function CardSkeleton() {
  return (
    <div className="card card-gradient flex flex-col gap-4" style={{ position: "relative", overflow: "hidden" }}>
      <div className="flex items-start justify-between">
        <div className="h-3 w-24 rounded" style={{ background: "var(--bg-elevated)", animation: "pulse 2s ease-in-out infinite" }} />
        <div className="w-9 h-9 rounded-xl" style={{ background: "var(--bg-elevated)", animation: "pulse 2s ease-in-out infinite" }} />
      </div>
      <div className="h-7 w-32 rounded" style={{ background: "var(--bg-elevated)", animation: "pulse 2s ease-in-out infinite" }} />
      <div className="flex items-end justify-between mt-auto">
        <div className="h-5 w-20 rounded-full" style={{ background: "var(--bg-elevated)", animation: "pulse 2s ease-in-out infinite" }} />
        <div className="h-8 w-20 rounded" style={{ background: "var(--bg-elevated)", animation: "pulse 2s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { analytics, status } = useAnalytics();
  const { user } = useUser();
  const cards = buildDynamicCards(analytics?.dashboard_cards);
  const isLoading = status === "loading";

  // Extract first name for the personal greeting
  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Aryan";

  return (
    <main
      className="flex-1 overflow-y-auto p-6"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Good morning, {firstName} 👋
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Here's what's happening in your portfolio today.
        </p>
      </div>

      {/* Key Metrics Cards — 4 cards */}
      <section className="mb-10">
        <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)" }}>
          Key Metrics
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {isLoading
            ? [1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)
            : cards.map((card) => <AnalyticsCard key={card.id} card={card} />)
          }
        </div>
      </section>

      {/* Section Divider */}
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
            background: analytics ? "var(--accent-glow)" : "var(--bg-elevated)",
            border: analytics ? "1px solid rgba(0,212,170,0.2)" : "1px solid var(--bg-border)",
            color: analytics ? "var(--accent-primary)" : "var(--text-muted)",
          }}
        >
          {analytics ? "✓ Data Loaded" : "Step 1 → 4"}
        </div>
      </div>

      {/* CSV Upload */}
      <CSVUpload />

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ExpensePieChart />
        <ExpenseBarChart />
      </section>

      {/* AI Insights */}
      <section className="mb-8">
        <AIInsights />
      </section>
    </main>
  );
}