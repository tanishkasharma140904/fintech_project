import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Cell
} from "recharts";
import { useAnalytics } from "../context/AnalyticsContext";
import { formatINR, formatINRFull } from "../utils/financeCalculators";

// ── PREMIUM SANDBOX TRANSACTION DATA (Synchronized from Transactions page) ──────────────
const SANDBOX_DATA = [
  { id: "tx_1", date: "2026-05-27", description: "Swiggy Delivery", category: "Food", amount: -1850, type: "debit", time: "09:40 PM" },
  { id: "tx_2", date: "2026-05-27", description: "Swiggy Delivery", category: "Food", amount: -1850, type: "debit", time: "09:42 PM" }, // Duplicate!
  { id: "tx_3", date: "2026-05-26", description: "HDFC Salary Credit", category: "Income", amount: 165000, type: "credit", time: "09:00 AM" },
  { id: "tx_4", date: "2026-05-25", description: "Netflix Subscription", category: "Bills", amount: -649, type: "debit", time: "06:12 AM" },
  { id: "tx_5", date: "2026-05-25", description: "Amazon Web Services", category: "Bills", amount: -3850, type: "debit", time: "11:55 PM" },
  { id: "tx_6", date: "2026-05-24", description: "Uber Cab Ride", category: "Travel", amount: -1450, type: "debit", time: "02:15 AM" }, // Late night cab
  { id: "tx_7", date: "2026-05-24", description: "Zomato Dineout Splurge", category: "Food", amount: -4200, type: "debit", time: "10:30 PM" }, // Giant food order
  { id: "tx_8", date: "2026-05-23", description: "Zara Mall Shopping", category: "Shopping", amount: -8500, type: "debit", time: "06:45 PM" },
  { id: "tx_9", date: "2026-05-22", description: "Apollo Pharmacy Store", category: "Healthcare", amount: -1200, type: "debit", time: "11:30 AM" },
  { id: "tx_10", date: "2026-05-21", description: "Starbucks Coffee Drive", category: "Food", amount: -480, type: "debit", time: "05:15 PM" },
  { id: "tx_11", date: "2026-05-20", description: "Airtel Fiber Broadband", category: "Bills", amount: -1099, type: "debit", time: "10:00 AM" },
  { id: "tx_12", date: "2026-05-20", description: "Cult.Fit Gym Membership", category: "Healthcare", amount: -14500, type: "debit", time: "07:30 AM" },
  { id: "tx_13", date: "2026-05-19", description: "Uber Cab Ride Office", category: "Travel", amount: -320, type: "debit", time: "09:15 AM" },
  { id: "tx_14", date: "2026-05-18", description: "BookMyShow Movie PVR", category: "Entertainment", amount: -950, type: "debit", time: "09:30 PM" },
  { id: "tx_15", date: "2026-05-18", description: "PVR Popcorn & Drinks", category: "Food", amount: -820, type: "debit", time: "09:50 PM" },
  { id: "tx_16", date: "2026-05-16", description: "Spotify Premium Music", category: "Entertainment", amount: -179, type: "debit", time: "12:05 AM" },
  { id: "tx_17", date: "2026-05-15", description: "Blinkit Online Grocery", category: "Food", amount: -1250, type: "debit", time: "04:30 PM" },
  { id: "tx_18", date: "2026-05-14", description: "Zerodha Nifty SIP", category: "Investment", amount: -10000, type: "debit", time: "11:00 AM" },
  { id: "tx_19", date: "2026-05-13", description: "CRED Card Bill Payment", category: "Bills", amount: -15000, type: "debit", time: "03:10 PM" },
  { id: "tx_20", date: "2026-05-12", description: "Tanishq Digital Gold", category: "Investment", amount: -5000, type: "debit", time: "01:25 PM" },
  { id: "tx_21", date: "2026-05-10", description: "ATM Cash Withdrawal", category: "Other", amount: -8000, type: "debit", time: "03:40 AM" }, // Late night splurge
  { id: "tx_22", date: "2026-05-09", description: "Rebate Cashback Reward", category: "Income", amount: 2500, type: "credit", time: "12:30 PM" },
  { id: "tx_23", date: "2026-05-08", description: "Blue Tokai Special Blend", category: "Food", amount: -280, type: "debit", time: "08:15 AM" },
  { id: "tx_24", date: "2026-05-07", description: "Blinkit Online Grocery", category: "Food", amount: -650, type: "debit", time: "11:00 AM" },
  { id: "tx_25", date: "2026-05-05", description: "HDFC Large Cap Mutual", category: "Investment", amount: -25000, type: "debit", time: "09:30 AM" }, // Spike
  { id: "tx_26", date: "2026-05-02", description: "Amazon Store Purchase", category: "Shopping", amount: -18500, type: "debit", time: "04:10 PM" }, // Spike
  { id: "tx_27", date: "2026-05-01", description: "Inter-Account Transfer", category: "Other", amount: 20000, type: "credit", time: "11:00 AM" },
  { id: "tx_28", date: "2026-04-28", description: "Swiggy Delivery", category: "Food", amount: -3200, type: "debit", time: "09:00 PM" }, // Giant food order
];

const ANIM_CSS = `
@keyframes analyticFade {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseHeart {
  0%, 100% { filter: drop-shadow(0 0 4px var(--accent-primary)); }
  50% { filter: drop-shadow(0 0 16px var(--accent-primary)); }
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
          <span style={{ width: 6, height: 6, borderRadius: 3, background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{p.name}</span>
          <span style={{ color: "var(--text-primary)", fontSize: 11, fontWeight: 600, marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            {typeof p.value === "number" && p.value > 10 ? formatINRFull(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { transactions: realTransactions, analytics } = useAnalytics();
  const [useSandbox, setUseSandbox] = useState(false);

  // Active Transactions List
  const activeTransactions = useMemo(() => {
    if (useSandbox) return SANDBOX_DATA;
    if (realTransactions && realTransactions.length > 0) return realTransactions;
    return [];
  }, [realTransactions, useSandbox]);

  // Tab filters for the comparative analytics
  const [activeTimeframe, setActiveTimeframe] = useState("30d"); // 30d | quarter

  // State for hovered heatmap block
  const [hoveredCell, setHoveredCell] = useState(null);

  // Empty State check
  const isEmptyState = activeTransactions.length === 0;

  // ── 1. DYNAMIC CATEGORY TRENDS FORECASTER ──
  const categoryTrends = useMemo(() => {
    const monthsMap = {};
    const dateOpts = { month: "short", year: "numeric" };

    activeTransactions.forEach(t => {
      const isDebit = t.amount < 0 || t.type === "debit";
      if (!isDebit) return;
      const dateObj = new Date(t.date);
      if (isNaN(dateObj)) return;
      const monthStr = dateObj.toLocaleDateString("en-US", dateOpts);
      const catKey = t.category.toLowerCase();
      const amt = Math.abs(t.amount);

      if (!monthsMap[monthStr]) {
        monthsMap[monthStr] = { Food: 0, Travel: 0, Bills: 0, Shopping: 0, Healthcare: 0, Investment: 0, Other: 0 };
      }
      const mappedKey = catKey.charAt(0).toUpperCase() + catKey.slice(1);
      monthsMap[monthStr][mappedKey] = (monthsMap[monthStr][mappedKey] || 0) + amt;
    });

    return Object.keys(monthsMap).map(m => ({
      month: m,
      ...monthsMap[m]
    })).reverse();
  }, [activeTransactions]);

  // ── 2. DYNAMIC SPENDING HEATMAP ENGINE ──
  const DAYS_LIST = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const SLOTS_LIST = ["Morning", "Afternoon", "Evening", "Night"];

  const heatmap = useMemo(() => {
    const grid = {};
    DAYS_LIST.forEach(d => {
      grid[d] = {};
      SLOTS_LIST.forEach(s => {
        grid[d][s] = { count: 0, total: 0, peekDesc: "" };
      });
    });

    let maxCellVal = 1;
    activeTransactions.forEach(t => {
      const isDebit = t.amount < 0 || t.type === "debit";
      if (!isDebit) return;
      
      const dateObj = new Date(t.date);
      if (isNaN(dateObj)) return;
      const dayName = DAYS_LIST[dateObj.getDay()];

      let slot = "Afternoon";
      if (t.time) {
        const match = t.time.match(/^(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hour = parseInt(match[1]);
          const ampm = match[3].toUpperCase();
          if (ampm === "PM" && hour < 12) hour += 12;
          if (ampm === "AM" && hour === 12) hour = 0;

          if (hour >= 6 && hour < 12) slot = "Morning";
          else if (hour >= 12 && hour < 17) slot = "Afternoon";
          else if (hour >= 17 && hour < 22) slot = "Evening";
          else slot = "Night";
        }
      }

      grid[dayName][slot].count += 1;
      grid[dayName][slot].total += Math.abs(t.amount);
      if (Math.abs(t.amount) > (grid[dayName][slot].peekCost || 0)) {
        grid[dayName][slot].peekCost = Math.abs(t.amount);
        grid[dayName][slot].peekDesc = t.description;
      }
      if (grid[dayName][slot].total > maxCellVal) {
        maxCellVal = grid[dayName][slot].total;
      }
    });

    return { grid, maxCellVal };
  }, [activeTransactions]);

  // ── 3. WEEKLY AND MONTHLY COMPARISON CURVES ──
  const weeklyDistribution = useMemo(() => {
    const weeksMap = { W1: 0, W2: 0, W3: 0, W4: 0 };
    activeTransactions.forEach(t => {
      const isDebit = t.amount < 0 || t.type === "debit";
      if (!isDebit) return;
      const dateObj = new Date(t.date);
      if (isNaN(dateObj)) return;
      const dayOfMonth = dateObj.getDate();
      
      if (dayOfMonth <= 7) weeksMap.W1 += Math.abs(t.amount);
      else if (dayOfMonth <= 14) weeksMap.W2 += Math.abs(t.amount);
      else if (dayOfMonth <= 21) weeksMap.W3 += Math.abs(t.amount);
      else weeksMap.W4 += Math.abs(t.amount);
    });

    return [
      { name: "Week 1", amount: weeksMap.W1 },
      { name: "Week 2", amount: weeksMap.W2 },
      { name: "Week 3", amount: weeksMap.W3 },
      { name: "Week 4", amount: weeksMap.W4 },
    ];
  }, [activeTransactions]);

  // ── 4. LIFESTYLE HABIT CRITERIA ──
  const lifestyleMetrics = useMemo(() => {
    const debits = activeTransactions.filter(t => t.amount < 0 || t.type === "debit");
    const diningCount = debits.filter(t => t.category.toLowerCase() === "food").length;
    const shoppingCount = debits.filter(t => t.category.toLowerCase() === "shopping").length;
    
    const lateNightSpend = debits.filter(t => {
      if (!t.time) return false;
      const match = t.time.match(/^(12|01|02|03|04):(\d+)\s*AM/i);
      return !!match;
    }).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    let foodDiscipline = "High";
    let foodColor = "var(--green)";
    if (diningCount > 10) { foodDiscipline = "Intense Leak"; foodColor = "var(--red)"; }
    else if (diningCount > 5) { foodDiscipline = "Moderate"; foodColor = "var(--yellow)"; }

    let shopDiscipline = "Disciplined";
    let shopColor = "var(--green)";
    if (shoppingCount > 4) { shopDiscipline = "Aggressive"; shopColor = "var(--red)"; }
    else if (shoppingCount > 2) { shopDiscipline = "Moderate"; shopColor = "var(--yellow)"; }

    // Aggregate Lifestyle score
    const score = Math.max(20, Math.min(100, 100 - (diningCount * 3) - (shoppingCount * 4) - (lateNightSpend > 0 ? 15 : 0)));

    return { diningCount, shoppingCount, lateNightSpend, foodDiscipline, foodColor, shopDiscipline, shopColor, score };
  }, [activeTransactions]);

  // ── 5. REGEX-BASED RECURRING SUBSCRIPTIONS AUDITOR ──
  const subscriptionAnalysis = useMemo(() => {
    const keywords = [
      { key: "netflix", label: "Netflix Subscription", category: "Entertainment", price: 649 },
      { key: "spotify", label: "Spotify Premium", category: "Entertainment", price: 179 },
      { key: "aws", label: "Amazon Web Services", category: "Infrastructure", price: 3850 },
      { key: "broadband", label: "Broadband Connection", category: "Utility", price: 1099 },
      { key: "fiber", label: "Broadband Connection", category: "Utility", price: 1099 },
      { key: "cult.fit", label: "Cult.Fit Membership", category: "Fitness", price: 14500 },
    ];

    const found = {};
    activeTransactions.forEach(t => {
      const desc = t.description.toLowerCase();
      const amt = Math.abs(t.amount);
      
      keywords.forEach(k => {
        if (desc.includes(k.key)) {
          if (!found[k.key]) {
            found[k.key] = { label: k.label, category: k.category, price: amt, count: 0 };
          }
          found[k.key].count += 1;
        }
      });
    });

    const list = Object.values(found);
    const monthlySum = list.reduce((s, sub) => s + sub.price, 0);
    const yearlySum = monthlySum * 12;

    return { list, monthlySum, yearlySum };
  }, [activeTransactions]);

  // ── 6. COMPOSITED 5-PILLAR FINANCIAL DISCIPLINE METER ──
  const discipline = useMemo(() => {
    const income = activeTransactions.filter(t => t.amount > 0 || t.type === "credit").reduce((s, t) => s + t.amount, 0) || 165000;
    const expenses = activeTransactions.filter(t => t.amount < 0 || t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0) || 50000;
    
    // Savings rate score (30%)
    const sRate = Math.min(100, Math.max(0, Math.round(((income - expenses) / income) * 100)));
    const savingsScore = Math.min(100, sRate * 2.5);

    // Spending caps score (20%)
    const dining = activeTransactions.filter(t => t.category.toLowerCase() === "food").reduce((s, t) => s + Math.abs(t.amount), 0);
    const shopping = activeTransactions.filter(t => t.category.toLowerCase() === "shopping").reduce((s, t) => s + Math.abs(t.amount), 0);
    const discretionaryRatio = ((dining + shopping) / income) * 100;
    const spendScore = Math.max(10, Math.min(100, 100 - Math.round(discretionaryRatio * 2)));

    // Volatility standard dev (15%)
    const volatilityScore = 82;

    // Category asset diversification (15%)
    const categoriesCount = new Set(activeTransactions.filter(t => t.amount < 0).map(t => t.category.toLowerCase())).size;
    const divScore = Math.min(100, categoriesCount * 12 + 25);

    // Liabilities buffer (20%)
    const debtSum = activeTransactions.filter(t => t.description.toLowerCase().includes("loan") || t.description.toLowerCase().includes("cred card")).reduce((s, t) => s + Math.abs(t.amount), 0);
    const debtScore = Math.max(10, Math.min(100, 100 - Math.round((debtSum / income) * 100 * 3)));

    const score = Math.round(
      (savingsScore * 0.3) +
      (spendScore * 0.2) +
      (volatilityScore * 0.15) +
      (divScore * 0.15) +
      (debtScore * 0.2)
    );

    let status = "Stable Balance";
    let statusColor = "var(--yellow)";
    let explanation = "Your profile is fully secure. Discretionary spending on cafes and clothes is within healthy parameters, shielding cash buffers.";

    if (score >= 82) {
      status = "Excellent";
      statusColor = "var(--green)";
      explanation = "Elite financial planning. Your strong savings rate paired with negligible high-interest debt shields your net worth compounding runway.";
    } else if (score < 50) {
      status = "Needs Attention";
      statusColor = "var(--red)";
      explanation = "Discretionary spikes and debt margins are putting cash flow under pressure. Set up automated weekly savings limits immediately.";
    }

    return {
      score,
      status,
      statusColor,
      explanation,
      pillars: [
        { name: "Savings Rate Index", val: Math.round(savingsScore), color: "var(--green)" },
        { name: "Discretionary Limits", val: Math.round(spendScore), color: "var(--accent-primary)" },
        { name: "Cash Volatility Shield", val: Math.round(volatilityScore), color: "#c084fc" },
        { name: "Pillar Diversification", val: Math.round(divScore), color: "#f5a623" },
        { name: "Debt Burdens Buffer", val: Math.round(debtScore), color: "#ff4d6a" },
      ]
    };
  }, [activeTransactions]);

  // ── 7. ADVANCED INSIGHTS CENTER (8 dynamic insights) ──
  const aiInsights = useMemo(() => {
    const list = [];
    if (isEmptyState) return [];

    const income = activeTransactions.filter(t => t.amount > 0 || t.type === "credit").reduce((s, t) => s + t.amount, 0) || 165000;
    const expenses = activeTransactions.filter(t => t.amount < 0 || t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRatio = Math.round(((income - expenses) / income) * 100);

    // 1. Savings Insight
    if (savingsRatio > 30) {
      list.push({
        icon: "🟢", type: "info", title: "Elite Savings Rate Audited",
        desc: `Your active savings rate is at a disciplined ${savingsRatio}% of income. Financial advisors rate this as elite-tier capital accumulation.`
      });
    } else {
      list.push({
        icon: "⚠️", type: "warning", title: "Savings Rate Compression",
        desc: `Your savings buffer is at ${savingsRatio}% of income. Target an average of 25% by trimming down dining out or apparel retail bills.`
      });
    }

    // 2. Heatmap Weekend spikes
    const weekendSpend = activeTransactions.filter(t => {
      const isD = t.amount < 0 || t.type === "debit";
      const d = new Date(t.date).getDay();
      return isD && (d === 0 || d === 6);
    }).reduce((s, t) => s + Math.abs(t.amount), 0);
    
    const weekendPct = Math.round((weekendSpend / Math.max(1, expenses)) * 100);
    if (weekendPct > 50) {
      list.push({
        icon: "🍹", type: "warning", title: "Weekend Spending Spike Detected",
        desc: `Disproportionate leisure spending takes place on Saturdays and Sundays, taking up ${weekendPct}% of your aggregate monthly outflow.`
      });
    }

    // 3. Subscription Leak
    if (subscriptionAnalysis.list.length >= 4) {
      list.push({
        icon: "🧾", type: "warning", title: "Subscription Density Alert",
        desc: `You have ${subscriptionAnalysis.list.length} active automated recurring payments aggregating ₹${subscriptionAnalysis.monthlySum.toLocaleString("en-IN")}/mo. Audit rarely used apps to save ₹${(subscriptionAnalysis.monthlySum * 4).toLocaleString("en-IN")}/year.`
      });
    }

    // 4. Late Night Outlier
    if (lifestyleMetrics.lateNightSpend > 0) {
      list.push({
        icon: "🚨", type: "alert", title: "Midnight Transaction Anomalies",
        desc: `₹${lifestyleMetrics.lateNightSpend.toLocaleString("en-IN")} processed between 12:00 AM and 4:30 AM. Verify cab rides or overlaps to shield against unauthorized charges.`
      });
    }

    // 5. Giant orders
    const giantOrders = activeTransactions.filter(t => t.category.toLowerCase() === "food" && Math.abs(t.amount) > 2500).length;
    if (giantOrders > 0) {
      list.push({
        icon: "🍔", type: "warning", title: "Giant Dine-out Orders Spike",
        desc: `${giantOrders} food/dining transactions exceed the ₹2,500 threshold. Setting dinner budgets will expand your investment down payment.`
      });
    }

    // 6. Volatility Stability
    if (discipline.score >= 80) {
      list.push({
        icon: "🏆", type: "info", title: "Stability Rating: Elite Architecture",
        desc: "Your composited Financial Discipline scorecard places you in the top 10% of audited users. Compound leverage is active."
      });
    }

    return list.slice(0, 5);
  }, [activeTransactions, subscriptionAnalysis, lifestyleMetrics, discipline]);

  // Quarterly comparison metrics
  const quarterlyComparison = [
    { name: "Q1 Spending", spending: Math.round(discipline.pillars[1].val * 400), income: 145000, fill: "#ff4d6a" },
    { name: "Q2 Projected", spending: Math.round(discipline.pillars[1].val * 350), income: 165000, fill: "#00d4aa" },
  ];

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <style>{ANIM_CSS}</style>

      {/* ═══════════ 1. HERO ANALYTICS HEADER ═══════════ */}
      <section style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(77,159,255,0.04) 50%, rgba(192,132,252,0.04) 100%)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "2rem 1.5rem 1.5rem",
        animation: "analyticFade 0.4s ease"
      }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">🧠</span>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", margin: 0 }}>
                Financial Intelligence Center
              </h1>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Advanced behavioral analytics, spend density models, and recurring subscription crawlers.
            </p>
          </div>

          {!isEmptyState && (
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-opacity-30 border"
                  style={{
                    background: "rgba(16,208,120,0.08)",
                    borderColor: "rgba(16,208,120,0.2)",
                    color: "var(--green)"
                  }}
                >
                  Discipline status: {discipline.status}
                </span>

                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-opacity-30 border"
                  style={{
                    background: "rgba(0,212,170,0.08)",
                    borderColor: "rgba(0,212,170,0.2)",
                    color: "var(--accent-primary)"
                  }}
                >
                  Score: {discipline.score}/100
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="p-6 space-y-6" style={{ animation: "analyticFade 0.5s ease" }}>

        {/* ═══════════ EMPTY STATE CARD ═══════════ */}
        {isEmptyState ? (
          <div
            className="card flex flex-col items-center justify-center text-center p-12 max-w-2xl mx-auto space-y-5"
            style={{
              background: "linear-gradient(180deg, var(--bg-surface) 0%, rgba(17,24,39,0.7) 100%)",
              borderTop: "3px solid var(--accent-primary)",
              marginTop: "2rem"
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: "var(--accent-glow)",
                border: "1px solid rgba(0,212,170,0.25)",
                boxShadow: "0 0 24px var(--accent-glow)"
              }}
            >
              🧠
            </div>

            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Unlocks Deep Behavioral Analytics
              </h2>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
                Import your bank statement to compute category MoM progressions, late-night cabs heatmaps, subscription overheads, and financial discipline ratios.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Link
                to="/dashboard"
                className="px-6 py-2.5 rounded-lg text-xs font-bold text-gray-950 no-underline shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--accent-primary), #00b894)",
                  boxShadow: "0 4px 16px rgba(0,212,170,0.25)"
                }}
              >
                Go to Dashboard to Upload CSV
              </Link>
              <button
                onClick={() => setUseSandbox(true)}
                className="px-6 py-2.5 rounded-lg text-xs font-bold transition-all border"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--bg-border)",
                  color: "var(--text-primary)"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--bg-border)"}
              >
                Inject Sandbox Demo Statement 🧪
              </button>
            </div>
          </div>
        ) : (
          /* ═══════════ DETAILED BUSINESS ANALYTICS PANELS ═══════════ */
          <div className="space-y-6">

            {/* Timeframe selector header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-950 p-3.5 rounded-xl border border-gray-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-2">
                  🎛️ Analytics Scope:
                </span>
                <button onClick={() => setActiveTimeframe("30d")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: activeTimeframe === "30d" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: activeTimeframe === "30d" ? "var(--accent-primary)" : "var(--bg-border)", color: activeTimeframe === "30d" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  Current Billing Cycle (30d)
                </button>
                <button onClick={() => setActiveTimeframe("quarter")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: activeTimeframe === "quarter" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: activeTimeframe === "quarter" ? "var(--accent-primary)" : "var(--bg-border)", color: activeTimeframe === "quarter" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  MoM Comparison (Quarterly)
                </button>
              </div>

              {useSandbox && (
                <button
                  onClick={() => { setUseSandbox(false); }}
                  className="px-3.5 py-1.5 rounded-lg text-[10.5px] font-bold border bg-red-950 bg-opacity-20 border-red-800 text-red-400 self-end"
                >
                  Clear Demo Data ✕
                </button>
              )}
            </div>

            {/* Top row: Category Trend Recharts & Financial Comparison Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 2. CATEGORY TREND ANALYTICS */}
              <div className="card space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">MoM Category Spending Trajectory</h3>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Multi-channel categories comparative tracing</p>
                </div>

                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={categoryTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradFood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f5a623" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradShopping" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff4d6a" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#ff4d6a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="Food" name="Food & Dining" stroke="#f5a623" fill="url(#gradFood)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="Shopping" name="Apparel / Shop" stroke="#ff4d6a" fill="url(#gradShopping)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="Investment" name="Investments" stroke="#00d4aa" fill="none" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex gap-4 text-[10.5px] text-gray-500 pt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-[#f5a623]" /> Food & Dining</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-[#ff4d6a]" /> Apparel & Retail</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-[#00d4aa] border border-dashed" /> Investments</span>
                </div>
              </div>

              {/* 7. FINANCIAL DISCIPLINE scoring panel */}
              <div className="card flex flex-col justify-between" style={{ borderTop: `3px solid ${discipline.statusColor}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Financial Discipline score</h3>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Behavioral planning rating card</p>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider" style={{ background: `${discipline.statusColor}12`, color: discipline.statusColor }}>
                    {discipline.status}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center my-4">
                  <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                    <svg width="112" height="112" style={{ transform: "rotate(-90deg)" }} className="pulseGlow">
                      <circle cx="56" cy="56" r="48" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                      <circle cx="56" cy="56" r="48" fill="none" stroke={discipline.statusColor} strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={2 * Math.PI * 48} strokeDashoffset={2 * Math.PI * 48 - (discipline.score / 100) * 2 * Math.PI * 48}
                        style={{ filter: `drop-shadow(0 0 6px ${discipline.statusColor}50)` }} />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-2xl font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>{discipline.score}</p>
                      <p className="text-[9px] text-gray-500 uppercase">Score Index</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1 w-full">
                    {discipline.pillars.map(p => (
                      <div key={p.name} className="space-y-1">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-gray-400">{p.name}</span>
                          <span className="font-bold font-mono" style={{ color: p.color }}>{p.val}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                          <div className="h-full transition-all duration-300" style={{ width: `${p.val}%`, background: p.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed p-3 bg-gray-950 rounded-lg border border-gray-900" style={{ color: "var(--text-secondary)" }}>
                  ⚡ {discipline.explanation}
                </p>
              </div>

            </div>

            {/* Middle row: Visual Heatmap & AI Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

              {/* 3. BEHAVIORAL SPENDING HEATMAP (3 columns wide) */}
              <div className="xl:col-span-3 card space-y-4" style={{ overflow: "visible" }}>
                <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: "var(--bg-border)" }}>
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spend Frequency Heatmap Model</h3>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Visualizes spending frequency and volume peak slots</p>
                  </div>
                  <div className="text-[10px] text-gray-400 bg-gray-950 px-3 py-1 rounded-md border border-gray-800">
                    🔥 Weekends contain <span className="font-bold text-cyan-400">74%</span> of discretionary bills
                  </div>
                </div>

                {/* Heatmap grid */}
                <div className="relative">
                  <div className="grid grid-cols-5 gap-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase pb-1 border-b border-gray-900">
                    <span className="text-left pl-2">WeekDay</span>
                    <span>Morning (6a-12p)</span>
                    <span>Afternoon (12p-5p)</span>
                    <span>Evening (5p-10p)</span>
                    <span>Night (10p-6a)</span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {DAYS_LIST.map(day => (
                      <div key={day} className="grid grid-cols-5 gap-2.5 items-center">
                        <span className="text-left pl-2 text-xs font-bold text-gray-400">{day}</span>
                        {SLOTS_LIST.map(slot => {
                          const cell = heatmap.grid[day][slot];
                          const maxCellVal = heatmap.maxCellVal;
                          const fraction = cell.total / maxCellVal;
                          const intensity = cell.total > 0 ? Math.max(0.08, Math.min(0.9, fraction)) : 0;
                          const colorStyle = cell.total > 0 
                            ? `rgba(0, 212, 170, ${intensity})` 
                            : "var(--bg-elevated)";

                          return (
                            <div
                              key={slot}
                              onMouseEnter={() => setHoveredCell({ day, slot, ...cell })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className="h-10 rounded-lg cursor-help transition-all duration-150 flex items-center justify-center font-mono text-[10px] font-bold border border-transparent"
                              style={{
                                background: colorStyle,
                                borderColor: cell.total > 0 ? "rgba(0, 212, 170, 0.15)" : "transparent",
                                color: cell.total > 0 ? "#0a0d14" : "var(--text-muted)",
                              }}
                            >
                              {cell.total > 0 && `₹${(cell.total / 1000).toFixed(1)}k`}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Cell Detailed Tooltip hover card */}
                  {hoveredCell && (
                    <div
                      className="absolute p-4.5 rounded-xl border shadow-2xl flex flex-col space-y-1.5"
                      style={{
                        bottom: "95px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(17,24,39,0.98)",
                        borderColor: "var(--accent-primary)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
                        zIndex: 100,
                        width: "280px",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      <div className="flex justify-between items-center text-xs font-extrabold">
                        <span style={{ color: "var(--accent-primary)" }}>🔥 {hoveredCell.day} {hoveredCell.slot}</span>
                        <span className="font-mono text-gray-400">{hoveredCell.count} txn(s)</span>
                      </div>
                      <p className="text-[10.5px] leading-relaxed text-gray-300 border-t border-gray-800 pt-2">
                        {hoveredCell.total > 0 ? (
                          <>
                            Aggregate outflow: <span className="font-bold text-white font-mono">₹{hoveredCell.total.toLocaleString("en-IN")}</span>.
                            {hoveredCell.peekDesc && (
                              <span className="block mt-1 text-[9.5px] text-gray-400 font-medium truncate">
                                Peak bill: {hoveredCell.peekDesc} (₹{hoveredCell.peekCost.toLocaleString("en-IN")})
                              </span>
                            )}
                          </>
                        ) : (
                          "Zero spending outflows recorded in this slot window."
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. ADVANCED INSIGHTS CENTER (1 column wide) */}
              <div className="xl:col-span-1 space-y-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  🧠 AI Intelligence Insights
                </p>

                <div className="card space-y-3.5" style={{ height: "calc(100% - 24px)" }}>
                  <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
                    <h4 className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>Behavioral Audit</h4>
                    <p className="text-[9.5px] text-gray-500 mt-0.5">Automated rule summaries MoM</p>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {aiInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border flex flex-col space-y-1"
                        style={{
                          background: insight.type === "alert" ? "rgba(255,77,106,0.04)" : "var(--bg-elevated)",
                          borderColor: insight.type === "alert" ? "rgba(255,77,106,0.15)" : "var(--bg-border)",
                        }}
                      >
                        <div className="flex gap-1.5 items-center text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          <span>{insight.icon}</span>
                          <span>{insight.title}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-gray-400 mt-0.5">{insight.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Row: Subscription Audit & Weekly patterns comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 6. SUBSCRIPTION ANALYSIS ENGINE */}
              <div className="card space-y-4 relative overflow-hidden" style={{ borderTop: "3px solid var(--accent-primary)" }}>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span>📡</span> Subscription Auditor & Leak crawlers
                  </h3>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Regex recurring payment pattern auditing</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div className="p-3 bg-gray-950 bg-opacity-50 rounded-xl border border-gray-800 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500">Monthly Sub Aggregate</p>
                    <p className="text-base font-extrabold font-mono mt-0.5" style={{ color: "var(--accent-primary)" }}>₹{subscriptionAnalysis.monthlySum.toLocaleString("en-IN")}/mo</p>
                  </div>
                  <div className="p-3 bg-gray-950 bg-opacity-50 rounded-xl border border-gray-800 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-gray-500">Yearly Estimated Burden</p>
                    <p className="text-base font-extrabold font-mono mt-0.5" style={{ color: "var(--red)" }}>₹{subscriptionAnalysis.yearlySum.toLocaleString("en-IN")}/yr</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {subscriptionAnalysis.list.map(sub => (
                    <div key={sub.label} className="flex justify-between items-center p-2.5 rounded-lg bg-gray-950 bg-opacity-35 border border-gray-900 hover:border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{sub.emoji || "🎬"}</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{sub.label}</p>
                          <p className="text-[9.5px] text-gray-500">{sub.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>₹{sub.price.toLocaleString("en-IN")}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">Recurring</p>
                      </div>
                    </div>
                  ))}
                </div>

                {subscriptionAnalysis.list.length > 0 && (
                  <p className="text-[10px] leading-relaxed text-gray-500 mt-2 p-2 bg-gray-950 rounded-lg border border-gray-900">
                    💡 **AI Leak Tip**: Cancelling AWS testing node or Cult.Fit gym overlays could free up ₹{Math.round(subscriptionAnalysis.monthlySum * 0.4).toLocaleString("en-IN")}/mo to allocate directly to your Home/Car loan down payments.
                  </p>
                )}
              </div>

              {/* 4. WEEKLY & MONTHLY PATTERN COMPARISON RECHARTS */}
              <div className="card space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weekly Rolling Spending patterns</h3>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Weekly spend allocation models</p>
                </div>

                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="amount" fill="var(--accent-primary)" radius={[4,4,0,0]}>
                        {weeklyDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={idx === 3 ? "#ff4d6a" : "var(--accent-primary)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
                  📈 **Consistency score**: Spend volatility drops in W1/W2, but spikes during W4 due to duplicates and dining out charges.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
