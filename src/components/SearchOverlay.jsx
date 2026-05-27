import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "../context/AnalyticsContext";
import { useUser } from "../context/UserContext";
import { NAVIGATION_ROUTES } from "../utils/navigationConfig";

const MOCK_FALLBACK_TRANSACTIONS = [
  { id: "tx_1", name: "Swiggy Food Delivery", category: "Food & Dining", amount: 580, date: "28 May 2026" },
  { id: "tx_2", name: "Uber Cab Ride", category: "Travel & Commute", amount: 240, date: "27 May 2026" },
  { id: "tx_3", name: "Netflix Recurring Premium", category: "Utilities & Bills", amount: 649, date: "25 May 2026" },
  { id: "tx_4", name: "Amazon Shopping Order", category: "Shopping & Lifestyle", amount: 1200, date: "24 May 2026" },
  { id: "tx_5", name: "HDFC Monthly Salary Payout", category: "Salary Credit", amount: 150000, date: "01 May 2026" },
  { id: "tx_6", name: "Starbucks Double Coffee", category: "Food & Dining", amount: 320, date: "28 May 2026" },
];

const ANALYTICS_CATEGORIES = [
  { id: "cat_1", label: "Food & Dining Category analytics", desc: "Detailed breakdown of Swiggy, Zomato, and restaurant ledgers" },
  { id: "cat_2", label: "Travel & Commute Category analytics", desc: "Volatile monthly Uber, petrol, and airline expenses" },
  { id: "cat_3", label: "Utilities & Monthly Bills tracker", desc: "Fixed outlays for electricity, Netflix, Wi-Fi, and credit charges" },
  { id: "cat_4", label: "Shopping & Lifestyle trends", desc: "Retail expenditures on Amazon, Zara, and lifestyle brands" },
];

const AI_INSIGHTS = [
  { id: "ins_1", label: "High Food Spends Warning", desc: "AI detected a 14% increase in Food Delivery charges over past week" },
  { id: "ins_2", label: "EMI Outflow Debt Ratio Stress", desc: "Dynamic debt-to-income aggregates are nearing the 35% caution line" },
  { id: "ins_3", label: "Surplus Savings Cash Margin", desc: "You have a ₹24,000 cash surplus available for active compounding investments" },
];

export default function SearchOverlay({ isOpen, onClose }) {
  const { transactions } = useAnalytics();
  const { user, appearance, updateAppearance, resetUser } = useUser();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Load Recent Searches on mount or open
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("fintech_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 2. Perform intelligent multi-grouped search matching
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const matches = [];

    // --- Group 1: QUICK ACTIONS COMMANDS ---
    const commands = [];
    if ("theme midnight".includes(q) || "midnight".includes(q)) {
      commands.push({
        id: "cmd_theme_midnight",
        type: "command",
        title: "Activate Midnight Carbon Theme Mode",
        desc: "Instantly applies deep absolute carbon styles to entire app",
        action: () => updateAppearance({ theme: "midnight" }),
      });
    }
    if ("theme graphite".includes(q) || "graphite".includes(q)) {
      commands.push({
        id: "cmd_theme_graphite",
        type: "command",
        title: "Activate Graphite Grey Theme Mode",
        desc: "Instantly applies professional industrial slate variables",
        action: () => updateAppearance({ theme: "graphite" }),
      });
    }
    if ("theme dark".includes(q) || "original".includes(q)) {
      commands.push({
        id: "cmd_theme_dark",
        type: "command",
        title: "Activate Original Dark Theme Mode",
        desc: "Resets branding bases back to clean navy dark mode",
        action: () => updateAppearance({ theme: "dark" }),
      });
    }
    if ("accent purple".includes(q) || "purple".includes(q)) {
      commands.push({
        id: "cmd_accent_purple",
        type: "command",
        title: "Set active brand accent to Royal Purple",
        desc: "Swaps all high-performance CSS highlight components globally",
        action: () => updateAppearance({ accent: "#c084fc" }),
      });
    }
    if ("accent green".includes(q) || "green".includes(q)) {
      commands.push({
        id: "cmd_accent_green",
        type: "command",
        title: "Set active brand accent to Emerald Green",
        desc: "Swaps all CSS variables highlights to vibrant emerald",
        action: () => updateAppearance({ accent: "#10d078" }),
      });
    }
    if ("accent blue".includes(q) || "blue".includes(q)) {
      commands.push({
        id: "cmd_accent_blue",
        type: "command",
        title: "Set active brand accent to Cobalt Blue",
        desc: "Swaps all CSS highlights to rich blue",
        action: () => updateAppearance({ accent: "#4d9fff" }),
      });
    }
    if ("accent orange".includes(q) || "orange".includes(q)) {
      commands.push({
        id: "cmd_accent_orange",
        type: "command",
        title: "Set active brand accent to Neon Orange",
        desc: "Swaps all highlights to high-contrast orange",
        action: () => updateAppearance({ accent: "#f5a623" }),
      });
    }
    if ("accent teal".includes(q) || "teal".includes(q)) {
      commands.push({
        id: "cmd_accent_teal",
        type: "command",
        title: "Set active brand accent to Electric Teal",
        desc: "Resets brand highlights back to primary electric teal",
        action: () => updateAppearance({ accent: "#00d4aa" }),
      });
    }
    if ("compact dashboard mode toggle".includes(q) || "compact".includes(q)) {
      commands.push({
        id: "cmd_compact",
        type: "command",
        title: "Toggle Compact Dashboard Mode Layout",
        desc: "Squeezes paddings and spacing on cards globally",
        action: () => updateAppearance({ compactMode: !appearance.compactMode }),
      });
    }
    if ("reset saas user profile data".includes(q) || "reset".includes(q)) {
      commands.push({
        id: "cmd_reset",
        type: "command",
        title: "Reset SaaS User Profile State Data",
        desc: "Purges cache entries and restores Aryan fallbacks",
        action: () => {
          resetUser();
          navigate("/dashboard");
        },
      });
    }

    if (commands.length > 0) {
      matches.push({ group: "SaaS Quick Commands", items: commands });
    }

    // --- Group 2: PAGES ---
    const matchedPages = NAVIGATION_ROUTES.filter(
      (r) => r.label.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    ).map((r) => ({
      id: r.path,
      type: "page",
      title: r.label,
      desc: r.description,
      action: () => navigate(r.path),
    }));

    if (matchedPages.length > 0) {
      matches.push({ group: "Connected Pages", items: matchedPages });
    }

    // --- Group 3: TRANSACTIONS (CSV or fallback) ---
    const txSource = transactions?.length > 0 ? transactions : MOCK_FALLBACK_TRANSACTIONS;
    const matchedTx = txSource
      .filter((t) => {
        const desc = (t.name || t.description || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        return desc.includes(q) || cat.includes(q);
      })
      .map((t) => ({
        id: t.id || `tx_${Math.random()}`,
        type: "transaction",
        title: t.name || t.description,
        desc: `${t.category} • ₹${t.amount.toLocaleString("en-IN")} • ${t.date}`,
        action: () => navigate("/transactions"),
      }))
      .slice(0, 4);

    if (matchedTx.length > 0) {
      matches.push({ group: "Matching Ledger Transactions", items: matchedTx });
    }

    // --- Group 4: ANALYTICS & CATEGORIES ---
    const matchedCats = ANALYTICS_CATEGORIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    ).map((c) => ({
      id: c.id,
      type: "category",
      title: c.label,
      desc: c.desc,
      action: () => navigate("/analytics"),
    }));

    if (matchedCats.length > 0) {
      matches.push({ group: "Spending Categories Analytics", items: matchedCats });
    }

    // --- Group 5: AI INSIGHTS & SCENARIOS ---
    const matchedInsights = AI_INSIGHTS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)
    ).map((i) => ({
      id: i.id,
      type: "insight",
      title: i.label,
      desc: i.desc,
      action: () => navigate("/analytics"),
    }));

    if (matchedInsights.length > 0) {
      matches.push({ group: "AI Engine Decisions", items: matchedInsights });
    }

    setResults(matches);
    setSelectedIndex(0);
  }, [query, transactions, appearance]);

  // 3. Flatten list helper for keyboard Arrow navigations
  const getFlattenedItems = () => {
    return results.reduce((acc, currentGroup) => {
      return acc.concat(currentGroup.items);
    }, []);
  };

  // 4. Keyboard Arrow, Enter, and Escape key listeners
  const handleKeyDown = (e) => {
    const flattened = getFlattenedItems();
    if (flattened.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flattened.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattened.length) % flattened.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = flattened[selectedIndex];
      if (selected) executeAction(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // 5. Select item and update search history logs
  const executeAction = (item) => {
    item.action();
    
    // Save to Recent Searches list
    const newRecent = [
      item.title,
      ...recentSearches.filter((t) => t !== item.title)
    ].slice(0, 5);

    setRecentSearches(newRecent);
    localStorage.setItem("fintech_recent_searches", JSON.stringify(newRecent));
    
    onClose();
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("fintech_recent_searches");
  };

  // 6. Bold query search text highlights helper
  const highlightMatch = (text, matchStr) => {
    if (!matchStr) return text;
    const parts = text.split(new RegExp(`(${matchStr})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === matchStr.toLowerCase() ? (
            <span key={i} className="text-cyan-400 font-bold bg-cyan-950 bg-opacity-35 px-0.5 rounded border border-cyan-900 border-opacity-30">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  // Flatten once for layout indexing visual states
  const flattened = getFlattenedItems();

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh] px-4"
      style={{
        background: "rgba(3, 7, 18, 0.65)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-xl rounded-2xl border flex flex-col relative overflow-hidden"
        style={{
          background: "rgba(17, 24, 39, 0.95)",
          borderColor: "var(--bg-border)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.7), 0 0 1px var(--accent-glow)",
          maxHeight: "65vh",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Dynamic Glowing Accent lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* --- SEARCH HEADER INPUT --- */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--bg-border)" }}>
          <span className="text-gray-400 text-lg flex-shrink-0">🔍</span>
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, insights, categories, or commands (accent blue)..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-full border-none p-0 focus:ring-0"
          />
          <span className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-bold font-mono">ESC</span>
        </div>

        {/* --- SEARCH RESULTS CONTAINER --- */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          
          {/* Default suggestion logs when query is empty */}
          {!query && (
            <div className="space-y-4">
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest font-semibold px-2">
                    <span>Recent Searches</span>
                    <button onClick={handleClearRecent} className="hover:text-red-400 transition-colors">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {recentSearches.map((term, i) => (
                      <button 
                        key={i}
                        onClick={() => setQuery(term)}
                        className="px-2.5 py-1 text-xs rounded-lg border hover:border-gray-700 bg-gray-950 bg-opacity-35"
                        style={{ borderColor: "var(--bg-border)", color: "var(--text-secondary)" }}
                      >
                        ⏱️ {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold px-2">Common Shortcuts & Commands</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-1">
                  <button onClick={() => setQuery("theme midnight")} className="p-2.5 rounded-lg border text-left bg-gray-950 bg-opacity-35 flex items-center gap-2 hover:border-gray-700" style={{ borderColor: "var(--bg-border)" }}>
                    <span className="text-base">🌌</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-300">theme midnight</p>
                      <p className="text-[10px] text-gray-500 truncate">SaaS Absolute Midnight Mode</p>
                    </div>
                  </button>
                  <button onClick={() => setQuery("accent purple")} className="p-2.5 rounded-lg border text-left bg-gray-950 bg-opacity-35 flex items-center gap-2 hover:border-gray-700" style={{ borderColor: "var(--bg-border)" }}>
                    <span className="text-base">🎨</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-300">accent purple</p>
                      <p className="text-[10px] text-gray-500 truncate">Royal Purple brand accent variables</p>
                    </div>
                  </button>
                  <button onClick={() => setQuery("compact")} className="p-2.5 rounded-lg border text-left bg-gray-950 bg-opacity-35 flex items-center gap-2 hover:border-gray-700" style={{ borderColor: "var(--bg-border)" }}>
                    <span className="text-base">🎛️</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-300">compact</p>
                      <p className="text-[10px] text-gray-500 truncate">Toggle compact padding ratios</p>
                    </div>
                  </button>
                  <button onClick={() => setQuery("uber")} className="p-2.5 rounded-lg border text-left bg-gray-950 bg-opacity-35 flex items-center gap-2 hover:border-gray-700" style={{ borderColor: "var(--bg-border)" }}>
                    <span className="text-base">🚗</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-300">uber</p>
                      <p className="text-[10px] text-gray-500 truncate">Search active commute transactions</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results render block */}
          {query && results.length > 0 && (
            <div className="space-y-4">
              {results.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  <p className="text-[9.5px] text-gray-500 uppercase tracking-widest font-semibold px-2">{group.group}</p>
                  
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      // Calculate global index offset for arrow selectors
                      const currentFlatIdx = flattened.findIndex((x) => x.id === item.id);
                      const isSelected = currentFlatIdx === selectedIndex;

                      return (
                        <button
                          key={item.id}
                          onClick={() => executeAction(item)}
                          className="w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden"
                          style={{
                            background: isSelected ? "var(--bg-elevated)" : "rgba(31,45,69,0.1)",
                            borderColor: isSelected ? "var(--accent-primary)" : "transparent",
                            boxShadow: isSelected ? "0 0 12px var(--accent-glow)" : "none",
                          }}
                        >
                          <span className="text-lg flex-shrink-0">
                            {item.type === "command" ? "⚡" : item.type === "page" ? "📄" : item.type === "transaction" ? "💳" : item.type === "category" ? "📊" : "🧠"}
                          </span>
                          
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-200">
                              {highlightMatch(item.title, query)}
                            </p>
                            <p className="text-[10.5px] text-gray-500 truncate mt-0.5">
                              {highlightMatch(item.desc, query)}
                            </p>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] text-gray-400 font-bold bg-gray-800 px-1.5 py-0.5 rounded font-mono">ENTER</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty search results block */}
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-2xl mb-2">🤔</span>
              <p className="text-xs font-semibold text-gray-400">No matching SaaS elements found</p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                Check key inputs like "food", "debt", "estimator", or commands like "theme midnight", "compact".
              </p>
            </div>
          )}

        </div>

        {/* --- FOOTER INSTRUCTIONS --- */}
        <div className="px-4 py-2 border-t flex items-center justify-between text-[10px] text-gray-500 font-mono" style={{ borderColor: "var(--bg-border)" }}>
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>Enter Select</span>
          </div>
          <span>Ctrl+K to close</span>
        </div>

      </div>
    </div>
  );
}
