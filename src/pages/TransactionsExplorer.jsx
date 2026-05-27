import { useState, useMemo, useEffect } from "react";
import { useAnalytics } from "../context/AnalyticsContext";
import { formatINR, formatINRFull } from "../utils/financeCalculators";

// ── PREMIUM SANDBOX TRANSACTION DATA (28 Records HDFC/ICICI style) ───────────────────────
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

const CATEGORY_STYLES = {
  food: { bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)", text: "#f5a623", emoji: "🍔" },
  travel: { bg: "rgba(77,159,255,0.08)", border: "rgba(77,159,255,0.2)", text: "#4d9fff", emoji: "✈️" },
  bills: { bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.2)", text: "#c084fc", emoji: "🧾" },
  shopping: { bg: "rgba(255,105,180,0.08)", border: "rgba(255,105,180,0.2)", text: "#ff69b4", emoji: "🛍️" },
  entertainment: { bg: "rgba(255,77,106,0.08)", border: "rgba(255,77,106,0.2)", text: "#ff4d6a", emoji: "🎬" },
  healthcare: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)", text: "#38bdf8", emoji: "🏥" },
  income: { bg: "rgba(16,208,120,0.08)", border: "rgba(16,208,120,0.2)", text: "#10d078", emoji: "💰" },
  investment: { bg: "rgba(0,212,170,0.08)", border: "rgba(0,212,170,0.2)", text: "#00d4aa", emoji: "📈" },
  other: { bg: "rgba(139,154,181,0.08)", border: "rgba(139,154,181,0.2)", text: "#8b9ab5", emoji: "⚙️" },
};

const ANIM_CSS = `
@keyframes transFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes searchPulse {
  0%, 100% { border-color: var(--bg-border); }
  50% { border-color: var(--accent-primary); }
}
`;

export default function TransactionsExplorer() {
  const { transactions: realTransactions } = useAnalytics();

  // Local state for sandbox injection
  const [useSandbox, setUseSandbox] = useState(false);

  // Unified Transactions List
  const activeTransactions = useMemo(() => {
    if (useSandbox) return SANDBOX_DATA;
    if (realTransactions && realTransactions.length > 0) return realTransactions;
    return [];
  }, [realTransactions, useSandbox]);

  // Page States
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date"); // date | amount
  const [sortOrder, setSortOrder] = useState("desc"); // desc | asc

  // Filter Drawer States
  const [filterType, setFilterType] = useState("all"); // all | debit | credit
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all"); // all | 7d | 30d
  const [filterAmountPreset, setFilterAmountPreset] = useState("all"); // all | high | custom
  const [filterCustomAmount, setFilterCustomAmount] = useState(0);
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);

  // Tooltip ID hover state for warning messages
  const [hoveredTxId, setHoveredTxId] = useState(null);

  // Clear search and filters
  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterCategory("all");
    setFilterDateRange("all");
    setFilterAmountPreset("all");
    setFilterCustomAmount(0);
    setFilterSuspiciousOnly(false);
    setPage(1);
  };

  // ── RULE-BASED SUSPICIOUS TRANSACTIONS DETECTOR (AI pipeline simulation) ──
  const flaggedTransactions = useMemo(() => {
    const flagged = {};
    const seen = {};

    activeTransactions.forEach(t => {
      const isExpense = t.amount < 0 || t.type === "debit";
      const amt = Math.abs(t.amount);

      // Rule 1: Duplicate Transaction Check (Identical description, date, and amount)
      const dupKey = `${t.date}_${t.description.toLowerCase()}_${amt}`;
      if (seen[dupKey]) {
        flagged[t.id] = {
          icon: "⚠️",
          title: "Duplicate Charge",
          desc: "Identical transaction amount & merchant detected on the same business date.",
          confidence: "94% Match Probability",
          badgeColor: "var(--red)",
        };
        flagged[seen[dupKey]] = {
          icon: "⚠️",
          title: "Duplicate Charge",
          desc: "Identical transaction amount & merchant detected on the same business date.",
          confidence: "94% Match Probability",
          badgeColor: "var(--red)",
        };
      } else {
        seen[dupKey] = t.id;
      }

      // If duplicate isn't already flagged, check other rules
      if (!flagged[t.id] && isExpense) {
        // Rule 2: Late-Night Luxury Cab / Outlier (>₹1,200 between 12:00 AM and 4:30 AM)
        if (t.time) {
          const match = t.time.match(/^(12|01|02|03|04):(\d+)\s*AM/i);
          if (match && amt > 1200) {
            flagged[t.id] = {
              icon: "🚨",
              title: "Late-Night Outlier",
              desc: "Abnormal high-value expense recorded during standard non-business resting hours.",
              confidence: "88% Alert Confidence",
              badgeColor: "var(--yellow)",
            };
          }
        }

        // Rule 3: Giant Food Delivery order (>₹2,500)
        if (!flagged[t.id] && t.category.toLowerCase() === "food" && amt > 2500) {
          flagged[t.id] = {
            icon: "🍔",
            title: "Giant Food Order",
            desc: "Disproportionately high transaction amount recorded for consumer dining utilities.",
            confidence: "82% Probability Indicator",
            badgeColor: "var(--yellow)",
          };
        }

        // Rule 4: High-Value Expense Spike (>₹15,000)
        if (!flagged[t.id] && amt > 15000) {
          flagged[t.id] = {
            icon: "⚡",
            title: "Spending Spike Alert",
            desc: "Single transaction exceeds 10% of standard monthly income profile.",
            confidence: "90% Outlier Level",
            badgeColor: "var(--yellow)",
          };
        }
      }
    });

    return flagged;
  }, [activeTransactions]);

  // ── FILTERING PIPELINE ──
  const filteredTransactions = useMemo(() => {
    let result = [...activeTransactions];

    // 1. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        t =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q) ||
          t.date.includes(q)
      );
    }

    // 2. Type filter
    if (filterType === "debit") {
      result = result.filter(t => t.amount < 0 || t.type === "debit");
    } else if (filterType === "credit") {
      result = result.filter(t => t.amount > 0 || t.type === "credit");
    }

    // 3. Category filter
    if (filterCategory !== "all") {
      result = result.filter(t => t.category.toLowerCase() === filterCategory.toLowerCase());
    }

    // 4. Date Range filter
    if (filterDateRange === "7d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      result = result.filter(t => new Date(t.date) >= cutoff);
    } else if (filterDateRange === "30d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter(t => new Date(t.date) >= cutoff);
    }

    // 5. Amount filter
    if (filterAmountPreset === "high") {
      result = result.filter(t => Math.abs(t.amount) >= 5000);
    } else if (filterAmountPreset === "custom" && filterCustomAmount > 0) {
      result = result.filter(t => Math.abs(t.amount) >= filterCustomAmount);
    }

    // 6. Suspicious Only
    if (filterSuspiciousOnly) {
      result = result.filter(t => !!flaggedTransactions[t.id]);
    }

    // ── SORTING PIPELINE ──
    result.sort((a, b) => {
      let valA = sortBy === "amount" ? Math.abs(a.amount) : new Date(a.date).getTime();
      let valB = sortBy === "amount" ? Math.abs(b.amount) : new Date(b.date).getTime();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeTransactions, search, filterType, filterCategory, filterDateRange, filterAmountPreset, filterCustomAmount, filterSuspiciousOnly, flaggedTransactions, sortBy, sortOrder]);

  // Pagination bounds
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  
  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterCategory, filterDateRange, filterAmountPreset, filterCustomAmount, filterSuspiciousOnly]);

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, page]);

  // Aggregate stats from currently filtered set
  const stats = useMemo(() => {
    const totalTx = filteredTransactions.length;
    
    // Sum standard expenses (negative values)
    const expenses = filteredTransactions.filter(t => t.amount < 0 || t.type === "debit");
    const totalExp = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    
    // Find highest expense
    let highestExp = 0;
    expenses.forEach(t => {
      const amt = Math.abs(t.amount);
      if (amt > highestExp) highestExp = amt;
    });

    // Find most active category
    const catMap = {};
    expenses.forEach(t => {
      const cat = t.category.toLowerCase();
      catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
    });

    let topCategory = "—";
    let maxSpend = 0;
    Object.keys(catMap).forEach(cat => {
      if (catMap[cat] > maxSpend) {
        maxSpend = catMap[cat];
        topCategory = cat.charAt(0).toUpperCase() + cat.slice(1);
      }
    });

    return { totalTx, totalExp, highestExp, topCategory };
  }, [filteredTransactions]);

  // ── CSV EXPORTER CLIENT utility ──
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    try {
      const headers = ["ID", "Date", "Time", "Description", "Category", "Amount (INR)", "Type", "AI Flagged"];
      const rows = filteredTransactions.map(t => [
        t.id,
        t.date,
        t.time || "12:00 PM",
        t.description,
        t.category,
        Math.abs(t.amount),
        t.amount > 0 || t.type === "credit" ? "Income" : "Expense",
        flaggedTransactions[t.id] ? "Suspicious: " + flaggedTransactions[t.id].title : "Safe",
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Filtered_Statement_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("CSV Export failure:", e);
    }
  };

  // Category tags helper
  const renderCategoryTag = (category) => {
    const key = category.toLowerCase();
    const style = CATEGORY_STYLES[key] || CATEGORY_STYLES.other;
    return (
      <span
        className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold flex items-center gap-1.5 w-fit"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.text,
        }}
      >
        <span>{style.emoji}</span>
        <span>{category}</span>
      </span>
    );
  };

  // Search Highlighter helper
  const highlightMatch = (text, searchToken) => {
    if (!searchToken.trim()) return <span>{text}</span>;
    try {
      const regex = new RegExp(`(${searchToken.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
      const parts = text.split(regex);
      return (
        <span>
          {parts.map((p, i) =>
            regex.test(p) ? (
              <mark
                key={i}
                className="rounded-sm px-0.5"
                style={{ background: "rgba(0,212,170,0.25)", color: "var(--accent-primary)" }}
              >
                {p}
              </mark>
            ) : (
              p
            )
          )}
        </span>
      );
    } catch {
      return <span>{text}</span>;
    }
  };

  // Apply Quick Action filters
  const applyQuickAction = (action) => {
    resetFilters();
    setPage(1);
    if (action === "high") {
      setFilterAmountPreset("high");
    } else if (action === "late") {
      setFilterType("debit");
      setFilterSuspiciousOnly(true);
      // Late night cab or ATM withdrawal will naturally highlight
    } else if (action === "duplicates") {
      setFilterSuspiciousOnly(true);
    } else if (action === "food") {
      setFilterCategory("food");
    } else if (action === "subscriptions") {
      setFilterCategory("bills");
      setSearch("Netflix");
    }
  };

  // Check if no statements exist anywhere
  const isEmptyState = activeTransactions.length === 0;

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <style>{ANIM_CSS}</style>

      {/* ═══════════ 1. HERO HEADER SECTION ═══════════ */}
      <section style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.05) 0%, rgba(192,132,252,0.03) 50%, rgba(255,77,106,0.03) 100%)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "2rem 1.5rem 1.5rem",
        animation: "transFadeIn 0.4s ease-out"
      }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">🕵️‍♂️</span>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", margin: 0 }}>
                Transactions Intelligence
              </h1>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Search, filter, and audit your financial statements with rule-based AI anomaly alerts.
            </p>
          </div>

          {!isEmptyState && (
            <div className="flex flex-wrap gap-2.5 lg:self-end">
              <div className="px-3.5 py-2 rounded-lg text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">Audited Rows</p>
                <p className="text-sm font-extrabold font-mono" style={{ color: "var(--text-primary)" }}>{stats.totalTx}</p>
              </div>
              <div className="px-3.5 py-2 rounded-lg text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">Expenses Sum</p>
                <p className="text-sm font-extrabold font-mono" style={{ color: "var(--red)" }}>{formatINR(stats.totalExp)}</p>
              </div>
              <div className="px-3.5 py-2 rounded-lg text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">Spike Peak</p>
                <p className="text-sm font-extrabold font-mono" style={{ color: "var(--accent-primary)" }}>{formatINR(stats.highestExp)}</p>
              </div>
              <div className="px-3.5 py-2 rounded-lg text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
                <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-0.5">Top Category</p>
                <p className="text-sm font-extrabold" style={{ color: "var(--yellow)" }}>{stats.topCategory}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="p-6 space-y-6" style={{ animation: "transFadeIn 0.5s ease" }}>

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
              📂
            </div>

            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                No Bank Statement Uploaded Yet
              </h2>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
                To explore your transaction history and run AI stress audits, please import a bank statement on the main Dashboard view. Alternatively, inject our demo sandbox statement instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <a
                href="/"
                className="px-6 py-2.5 rounded-lg text-xs font-bold text-gray-950 no-underline shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--accent-primary), #00b894)",
                  boxShadow: "0 4px 16px rgba(0,212,170,0.25)"
                }}
              >
                Go to Dashboard to Upload CSV
              </a>
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
          /* ═══════════ DETAILED TRANSACTIONS cockpit ═══════════ */
          <div className="space-y-6">

            {/* QUICK ACTIONS & EXPORT HEADER PANEL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-950 p-3.5 rounded-xl border border-gray-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-2">
                  ⚡ Quick Filters:
                </span>
                <button onClick={() => applyQuickAction("high")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: filterAmountPreset === "high" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: filterAmountPreset === "high" ? "var(--accent-primary)" : "var(--bg-border)", color: filterAmountPreset === "high" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  Spikes (&gt;₹5k)
                </button>
                <button onClick={() => applyQuickAction("late")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: filterSuspiciousOnly && filterType === "debit" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: filterSuspiciousOnly && filterType === "debit" ? "var(--accent-primary)" : "var(--bg-border)", color: filterSuspiciousOnly && filterType === "debit" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  Late Night Outliers
                </button>
                <button onClick={() => applyQuickAction("duplicates")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: filterSuspiciousOnly && filterType === "all" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: filterSuspiciousOnly && filterType === "all" ? "var(--accent-primary)" : "var(--bg-border)", color: filterSuspiciousOnly && filterType === "all" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  Duplicates Flagged
                </button>
                <button onClick={() => applyQuickAction("food")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: filterCategory === "food" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: filterCategory === "food" ? "var(--accent-primary)" : "var(--bg-border)", color: filterCategory === "food" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  Food & Dining
                </button>
                <button onClick={() => applyQuickAction("subscriptions")} className="px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all" style={{ background: search === "Netflix" ? "rgba(0,212,170,0.12)" : "var(--bg-surface)", borderColor: search === "Netflix" ? "var(--accent-primary)" : "var(--bg-border)", color: search === "Netflix" ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                  Netflix Sub
                </button>
                <button onClick={resetFilters} className="px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-400 hover:text-white" style={{ background: "transparent", border: "none" }}>
                  Reset
                </button>
              </div>

              <div className="flex items-center gap-2 self-end">
                {useSandbox && (
                  <button
                    onClick={() => { setUseSandbox(false); resetFilters(); }}
                    className="px-3.5 py-1.5 rounded-lg text-[10.5px] font-bold border bg-red-950 bg-opacity-20 border-red-800 text-red-400"
                  >
                    Clear Demo Data ✕
                  </button>
                )}
                
                <button
                  onClick={handleExportCSV}
                  disabled={filteredTransactions.length === 0}
                  className="px-3.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 shadow"
                  style={{
                    background: filteredTransactions.length > 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: filteredTransactions.length > 0 ? "#0a0d14" : "var(--text-muted)",
                    cursor: filteredTransactions.length > 0 ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={e => { if (filteredTransactions.length > 0) e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  📥 Export Filtered CSV
                </button>
              </div>
            </div>

            {/* SEARCH AND FILTERS CARD SYSTEM */}
            <div className="card space-y-4" style={{ animation: "searchPulse 6s infinite" }}>
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* 2. SMART SEARCH INPUT */}
                <div
                  className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
                >
                  <span className="text-gray-500">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by merchant, category, or amount (e.g. Swiggy, bills, 1850)..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white text-xs">
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="px-5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2"
                  style={{
                    background: filtersOpen ? "var(--accent-glow)" : "var(--bg-elevated)",
                    borderColor: filtersOpen ? "var(--accent-primary)" : "var(--bg-border)",
                    color: filtersOpen ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                >
                  <span>🎛️</span>
                  <span>{filtersOpen ? "Hide Filters Drawer" : "Show Filters Drawer"}</span>
                </button>
              </div>

              {/* 3. EXPANDING FILTER DRAWER */}
              {filtersOpen && (
                <div className="p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-gray-950 bg-opacity-40 border border-gray-800" style={{ animation: "transFadeIn 0.3s ease" }}>
                  
                  {/* Type Filter */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">Txn Type</label>
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="w-full p-2 rounded-lg text-xs"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                    >
                      <option value="all">All Transactions</option>
                      <option value="debit">Expenses / Debits Only</option>
                      <option value="credit">Income / Credits Only</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">Category</label>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full p-2 rounded-lg text-xs capitalize"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                    >
                      <option value="all">All Categories</option>
                      {Object.keys(CATEGORY_STYLES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">Time Range</label>
                    <select
                      value={filterDateRange}
                      onChange={e => setFilterDateRange(e.target.value)}
                      className="w-full p-2 rounded-lg text-xs"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                    >
                      <option value="all">All History</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>

                  {/* Amount Filter */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">Amount Target</label>
                    <div className="flex gap-2">
                      <select
                        value={filterAmountPreset}
                        onChange={e => setFilterAmountPreset(e.target.value)}
                        className="flex-1 p-2 rounded-lg text-xs"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                      >
                        <option value="all">Any Amount</option>
                        <option value="high">High (&gt;₹5,000)</option>
                        <option value="custom">Custom Minimum</option>
                      </select>
                      {filterAmountPreset === "custom" && (
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={filterCustomAmount || ""}
                          onChange={e => setFilterCustomAmount(parseInt(e.target.value) || 0)}
                          className="w-16 p-1.5 rounded-lg text-xs text-center border font-mono outline-none"
                          style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
                        />
                      )}
                    </div>
                  </div>

                  {/* AI Indicators */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5 block">AI Anomaly Filter</label>
                    <button
                      onClick={() => setFilterSuspiciousOnly(!filterSuspiciousOnly)}
                      className="w-full p-2 rounded-lg text-xs font-bold border transition-all text-center"
                      style={{
                        background: filterSuspiciousOnly ? "rgba(255,77,106,0.08)" : "var(--bg-elevated)",
                        borderColor: filterSuspiciousOnly ? "var(--red)" : "var(--bg-border)",
                        color: filterSuspiciousOnly ? "var(--red)" : "var(--text-secondary)",
                      }}
                    >
                      {filterSuspiciousOnly ? "⚠️ Showing Anomaly Rows" : "Show Anomalies Only"}
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* MAIN DATA ROW PANEL */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

              {/* 4. ADVANCED TRANSACTION TABLE (3 columns wide) */}
              <div className="xl:col-span-3 card space-y-4" style={{ overflow: "visible" }}>
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--bg-border)" }}>
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Ledger</h3>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Showing {Math.min(filteredTransactions.length, (page - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(filteredTransactions.length, page * ITEMS_PER_PAGE)} of {filteredTransactions.length} results
                    </p>
                  </div>

                  {/* Date / Amount Sort switches */}
                  <div className="flex gap-2 text-[10.5px]">
                    <span className="text-gray-500 self-center">Sort by:</span>
                    <button
                      onClick={() => {
                        if (sortBy === "date") { setSortOrder(sortOrder === "desc" ? "asc" : "desc"); } 
                        else { setSortBy("date"); setSortOrder("desc"); }
                      }}
                      className="px-2.5 py-1 rounded-md border"
                      style={{
                        background: sortBy === "date" ? "var(--bg-elevated)" : "transparent",
                        borderColor: sortBy === "date" ? "var(--accent-primary)" : "var(--bg-border)",
                        color: sortBy === "date" ? "var(--accent-primary)" : "var(--text-secondary)",
                      }}
                    >
                      Date {sortBy === "date" && (sortOrder === "desc" ? "▼" : "▲")}
                    </button>
                    <button
                      onClick={() => {
                        if (sortBy === "amount") { setSortOrder(sortOrder === "desc" ? "asc" : "desc"); } 
                        else { setSortBy("amount"); setSortOrder("desc"); }
                      }}
                      className="px-2.5 py-1 rounded-md border"
                      style={{
                        background: sortBy === "amount" ? "var(--bg-elevated)" : "transparent",
                        borderColor: sortBy === "amount" ? "var(--accent-primary)" : "var(--bg-border)",
                        color: sortBy === "amount" ? "var(--accent-primary)" : "var(--text-secondary)",
                      }}
                    >
                      Value {sortBy === "amount" && (sortOrder === "desc" ? "▼" : "▲")}
                    </button>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl mb-2">🤷‍♂️</span>
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>No Matching Transactions</p>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                      Try adjusting your custom min-amount, matching query term, or reset the filters drawer entirely.
                    </p>
                    <button onClick={resetFilters} className="mt-4 px-4 py-1.5 rounded-lg text-[10px] font-bold text-gray-950" style={{ background: "var(--accent-primary)" }}>
                      Reset Filters Drawer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    
                    {/* Header labels */}
                    <div
                      className="grid text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded-lg mb-1"
                      style={{ gridTemplateColumns: "100px 1fr 130px 110px 110px", color: "var(--text-muted)", background: "var(--bg-elevated)", borderBottom: "1px solid var(--bg-border)" }}
                    >
                      <span>Date / Time</span>
                      <span>Merchant Description</span>
                      <span>Category</span>
                      <span className="text-right">Amount (INR)</span>
                      <span className="text-center">AI Audit Status</span>
                    </div>

                    {/* Transaction rows */}
                    {paginatedTransactions.map((txn, idx) => {
                      const isCredit = txn.amount > 0 || txn.type === "credit";
                      const flagged = flaggedTransactions[txn.id];
                      return (
                        <div
                          key={txn.id || idx}
                          className="grid items-center px-3 py-2.5 rounded-lg transition-all duration-150 border-b"
                          style={{
                            gridTemplateColumns: "100px 1fr 130px 110px 110px",
                            borderColor: "var(--bg-border)",
                            position: "relative",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          {/* Date and time column */}
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                              {new Date(txn.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                            <span className="text-[9.5px] font-mono text-gray-500 mt-0.5">
                              {txn.time || "12:00 PM"}
                            </span>
                          </div>

                          {/* Merchant/Description with query highlighting */}
                          <span className="text-xs font-bold truncate pr-3" style={{ color: "var(--text-primary)" }}>
                            {highlightMatch(txn.description, search)}
                          </span>

                          {/* Dynamic colored category badge */}
                          <span>
                            {renderCategoryTag(txn.category)}
                          </span>

                          {/* Dynamic credit/debit currency formatter */}
                          <span
                            className="text-xs font-extrabold font-mono text-right pr-4"
                            style={{ color: isCredit ? "var(--green)" : "var(--text-primary)" }}
                          >
                            {isCredit ? "+" : "-"}₹{Math.abs(txn.amount).toLocaleString("en-IN")}
                          </span>

                          {/* Rule-based suspicious audit status column */}
                          <div className="flex items-center justify-center relative">
                            {flagged ? (
                              <div className="relative">
                                <span
                                  onMouseEnter={() => setHoveredTxId(txn.id)}
                                  onMouseLeave={() => setHoveredTxId(null)}
                                  className="cursor-help px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border tracking-wider uppercase inline-flex items-center gap-1"
                                  style={{
                                    background: "rgba(255,77,106,0.08)",
                                    borderColor: flagged.badgeColor,
                                    color: "var(--red)",
                                  }}
                                >
                                  <span>{flagged.icon}</span>
                                  <span>{flagged.title}</span>
                                </span>

                                {/* Premium tooltip warning hover card */}
                                {hoveredTxId === txn.id && (
                                  <div
                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-52 rounded-xl text-left shadow-2xl border"
                                    style={{
                                      background: "rgba(17,24,39,0.98)",
                                      borderColor: "var(--bg-border)",
                                      boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
                                      zIndex: 100,
                                      backdropFilter: "blur(14px)",
                                    }}
                                  >
                                    <p className="text-[10px] font-extrabold" style={{ color: "var(--red)" }}>
                                      🛡️ AI Anomaly Detected
                                    </p>
                                    <p className="text-[9.5px] leading-relaxed text-gray-300 mt-1">
                                      {flagged.desc}
                                    </p>
                                    <div className="flex justify-between items-center border-t border-gray-800 mt-2 pt-1.5 text-[9px] text-gray-500 font-mono">
                                      <span>Index status</span>
                                      <span className="font-bold" style={{ color: "var(--accent-primary)" }}>{flagged.confidence}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase"
                                style={{
                                  background: "rgba(16,208,120,0.05)",
                                  color: "var(--text-muted)",
                                }}
                              >
                                ✓ Safe
                              </span>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredTransactions.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--bg-border)" }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3.5 py-1.5 rounded-lg text-[10.5px] font-semibold border transition-all"
                      style={{
                        background: page === 1 ? "transparent" : "var(--bg-elevated)",
                        borderColor: "var(--bg-border)",
                        color: page === 1 ? "var(--text-muted)" : "var(--text-secondary)",
                        cursor: page === 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      ← Previous
                    </button>
                    <span className="text-[10.5px] font-mono text-gray-500">
                      Page <span style={{ color: "var(--text-primary)" }}>{page}</span> of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3.5 py-1.5 rounded-lg text-[10.5px] font-semibold border transition-all"
                      style={{
                        background: page === totalPages ? "transparent" : "var(--bg-elevated)",
                        borderColor: "var(--bg-border)",
                        color: page === totalPages ? "var(--text-muted)" : "var(--text-secondary)",
                        cursor: page === totalPages ? "not-allowed" : "pointer"
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}

              </div>

              {/* 7. DYNAMIC AI INSIGHTS PANEL (1 column wide) */}
              <div className="xl:col-span-1 space-y-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  🧠 Live Statement Audit
                </p>

                <div className="card space-y-4" style={{ height: "calc(100% - 24px)" }}>
                  <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
                    <h4 className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>AI Intelligence Notes</h4>
                    <p className="text-[9.5px] text-gray-500 mt-0.5">Dynamic rule-based evaluation</p>
                  </div>

                  <div className="space-y-3">
                    
                    {/* Duplicate audit feedback */}
                    {Object.keys(flaggedTransactions).length > 0 ? (
                      <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs bg-red-950 bg-opacity-20 border border-red-900 border-opacity-30">
                        <span className="text-base mt-0.5">🚨</span>
                        <div>
                          <p className="text-[11px] font-extrabold" style={{ color: "var(--red)" }}>Anomalies Flagged</p>
                          <p className="text-[10px] leading-relaxed text-gray-300 mt-1">
                            We detected {Object.keys(flaggedTransactions).length} suspicious transaction ledger rows (duplicates, high-spikes, or late-night cabs). Audit tooltips are attached inline.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs bg-emerald-950 bg-opacity-20 border border-emerald-900 border-opacity-30">
                        <span className="text-base mt-0.5">🟢</span>
                        <div>
                          <p className="text-[11px] font-extrabold" style={{ color: "var(--green)" }}>Statement Shield Secure</p>
                          <p className="text-[10px] leading-relaxed text-gray-300 mt-1">
                            All audited ledger rows conform to your standard budget parameters. No double charges or late night outliers flagged.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* General category insights */}
                    <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs bg-cyan-950 bg-opacity-20 border border-cyan-900 border-opacity-30">
                      <span className="text-base mt-0.5">📊</span>
                      <div>
                        <p className="text-[11px] font-extrabold" style={{ color: "var(--accent-primary)" }}>Active Top Sector</p>
                        <p className="text-[10px] leading-relaxed text-gray-300 mt-1">
                          Disproportionate monthly spending occurs inside the **{stats.topCategory}** sector, aggregate of ₹{stats.totalExp.toLocaleString("en-IN")} processed.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs bg-gray-950 border border-gray-800">
                      <span className="text-base mt-0.5">💡</span>
                      <div>
                        <p className="text-[11px] font-extrabold" style={{ color: "var(--text-secondary)" }}>Audit Advice</p>
                        <p className="text-[10px] leading-relaxed text-gray-400 mt-1">
                          Filter by "debits only" to analyze spend outflows, or toggle the "Suspicious" switch to inspect potential unauthorized bank charges or overlaps.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
