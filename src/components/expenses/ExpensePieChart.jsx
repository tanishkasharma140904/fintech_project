// ============================================================
// FILE: src/components/expenses/ExpensePieChart.jsx
// PURPOSE: Donut-style pie chart showing expense by category.
//
// WHAT IT TEACHES:
//   1. How to import and use a Recharts chart component
//   2. How ResponsiveContainer makes charts fill their parent
//   3. Custom legend rendering with .map()
//   4. How Recharts uses your data array (name + value fields)
//
// HOW IT CONNECTS:
//   Dashboard.jsx renders this in the left column of the charts grid.
//   It imports categoryExpenses data directly — no props needed here.
// ============================================================

// Named imports from recharts — you only import what you use
import {
  PieChart,          // the outer chart wrapper
  Pie,               // the actual pie/donut shape
  Cell,              // lets you colour each slice individually
  Tooltip,           // the popup that shows on hover
  ResponsiveContainer // makes the chart resize with its parent
} from "recharts";

import { categoryExpenses } from "../../data/expenseData";

// ── Custom Tooltip ───────────────────────────────────────────
// Recharts calls this component when the user hovers a slice.
// It receives "active" (is a slice hovered?) and "payload" (the data).
// This replaces Recharts' default plain-white tooltip.
function CustomTooltip({ active, payload }) {
  // "active" is true only when the cursor is over a slice
  if (active && payload && payload.length) {
    const item = payload[0].payload; // the hovered category's data object

    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          color: "var(--text-primary)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <p className="font-semibold mb-0.5" style={{ color: item.color }}>
          {item.name}
        </p>
        <p className="font-mono">₹{item.value.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null; // return null = render nothing when not hovering
}

// ── Main Component ───────────────────────────────────────────
export default function ExpensePieChart() {

  // Calculate total for percentage display in the legend
  // .reduce() sums all "value" fields: (0 + 12400 + 9800 + ...) = total
  const total = categoryExpenses.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card flex flex-col gap-5">

      {/* Card Header */}
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Spending by Category
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Current month breakdown
        </p>
      </div>

      {/* ── Chart + Center Label ────────────────────────────
          The chart container is "relative" positioned so we can
          place an absolutely-positioned total label at the center. */}
      <div className="relative" style={{ height: "200px" }}>

        {/* ResponsiveContainer: fills the parent div's width/height.
            Always wrap your chart in this — never hardcode chart width! */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryExpenses}  // ← your array from expenseData.js
              cx="50%"                 // center X (50% = horizontal center)
              cy="50%"                 // center Y
              innerRadius={60}         // makes it a donut (0 = full pie)
              outerRadius={90}         // outer size
              paddingAngle={3}         // gap between slices
              dataKey="value"          // which field = the slice SIZE
              strokeWidth={0}          // no border between slices
            >
              {/* For each data item, render a Cell with its own color.
                  Without Cell, all slices would be the same color. */}
              {categoryExpenses.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  // On hover, the slice gets a slight opacity drop
                  // (Recharts handles this automatically)
                />
              ))}
            </Pie>

            {/* Tooltip uses our custom component defined above */}
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — absolute positioned over the donut hole */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total</p>
          <p
            className="text-base font-bold font-finance"
            style={{ color: "var(--text-primary)" }}
          >
            ₹{(total / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────
          We build our own legend instead of using Recharts' default.
          Why? More control over layout, font, and spacing. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {categoryExpenses.map((item) => {
          const pct = ((item.value / total) * 100).toFixed(1);

          return (
            <div key={item.name} className="flex items-center gap-2">
              {/* Colour dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.color }}
              />
              {/* Name + percentage */}
              <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {item.name}
              </span>
              <span
                className="text-xs font-mono ml-auto flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
