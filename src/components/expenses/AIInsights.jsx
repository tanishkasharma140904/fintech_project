// ============================================================
// FILE: src/components/expenses/AIInsights.jsx
// PURPOSE: Displays a list of AI-generated spending insights.
//
// WHAT IT TEACHES:
//   1. Pure presentational component — no state needed
//   2. Deriving styles from data (insight.type → color)
//   3. Object lookup pattern instead of if/else chains
//   4. Clean .map() rendering with good visual hierarchy
//
// HOW IT CONNECTS:
//   Dashboard.jsx renders this below the two charts as a
//   full-width section. Data comes directly from expenseData.js.
// ============================================================

import { aiInsights } from "../../data/expenseData";

// ── Style Map ────────────────────────────────────────────────
// Instead of writing if/else for every type, we use an object
// as a lookup table. This is cleaner and easier to extend.
// insight.type ("warning" / "alert" / "info") → style object
const TYPE_STYLES = {
  warning: {
    borderColor: "rgba(245, 166, 35, 0.3)",
    background:  "rgba(245, 166, 35, 0.06)",
    dotColor:    "#f5a623",
    label:       "Warning",
    labelColor:  "#f5a623",
  },
  alert: {
    borderColor: "rgba(255, 77, 106, 0.3)",
    background:  "rgba(255, 77, 106, 0.06)",
    dotColor:    "#ff4d6a",
    label:       "Alert",
    labelColor:  "#ff4d6a",
  },
  info: {
    borderColor: "rgba(0, 212, 170, 0.2)",
    background:  "rgba(0, 212, 170, 0.05)",
    dotColor:    "#00d4aa",
    label:       "Insight",
    labelColor:  "#00d4aa",
  },
};

// ── Single Insight Card (child component) ───────────────────
// This is a component that renders inside AIInsights using .map().
// Props:
//   insight → one object from the aiInsights array
function InsightCard({ insight }) {
  // Look up the style for this insight's type
  // If type is unknown, fall back to "info" styles
  const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl transition-all duration-150"
      style={{
        background:  style.background,
        border:      `1px solid ${style.borderColor}`,
      }}
    >
      {/* Emoji icon in a small container */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
        style={{
          background: "var(--bg-surface)",
          border:     `1px solid ${style.borderColor}`,
        }}
      >
        {insight.icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {insight.title}
          </p>
          {/* Type badge */}
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              background: `${style.dotColor}18`,
              color:      style.labelColor,
              fontSize:   "0.65rem",
            }}
          >
            {style.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {insight.detail}
        </p>
      </div>

      {/* Colored left-edge indicator dot */}
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
        style={{ background: style.dotColor }}
      />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function AIInsights() {
  return (
    <div className="card">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            AI Insights
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Patterns detected in your spending behaviour
          </p>
        </div>

        {/* Model badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
          style={{
            background: "var(--accent-glow)",
            border:     "1px solid rgba(0,212,170,0.2)",
            color:      "var(--accent-primary)",
          }}
        >
          {/* Animated pulse dot */}
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--accent-primary)",
              animation:  "pulse 2s ease-in-out infinite",
            }}
          />
          AI Active
        </div>
      </div>

      {/* Insight Cards Grid
          On mobile: 1 column
          On medium screens: 2 columns
          On large screens: 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {aiInsights.map((insight) => (
          // key must be unique — we use insight.id from our data
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Footer note */}
      <div
        className="mt-4 pt-4 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--bg-border)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Insights are generated from your transaction patterns. Upload more data for higher accuracy.
        </p>
      </div>
    </div>
  );
}
