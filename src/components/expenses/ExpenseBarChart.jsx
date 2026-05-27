// ============================================================
// FILE: src/components/expenses/ExpenseBarChart.jsx
// PURPOSE: Bar chart showing monthly spending trends over 12 months.
//
// WHAT IT TEACHES:
//   1. Recharts BarChart — different chart type, same pattern
//   2. XAxis / YAxis configuration (tick formatting)
//   3. CartesianGrid for readable background lines
//   4. Custom bar shape using a function (advanced but useful)
//   5. How to format currency on Y-axis labels
//
// HOW IT CONNECTS:
//   Dashboard.jsx renders this in the right column of the charts grid,
//   next to ExpensePieChart.
// ============================================================

import {
  BarChart,            // outer wrapper for bar charts
  Bar,                 // the actual bars
  XAxis,               // horizontal axis
  YAxis,               // vertical axis
  CartesianGrid,       // background grid lines
  Tooltip,             // hover popup
  ResponsiveContainer, // auto-resize
  Cell,                // per-bar coloring
} from "recharts";

import { monthlyExpenses } from "../../data/expenseData";

// ── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <p className="font-mono font-bold" style={{ color: "var(--accent-primary)" }}>
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
}

// ── Rounded Bar Shape ────────────────────────────────────────
// Recharts lets you pass a custom "shape" to Bar.
// This function draws a rectangle with rounded TOP corners only.
// props = the bar's position/size data provided by Recharts
function RoundedBar(props) {
  const { x, y, width, height, fill } = props;
  const radius = 4; // corner radius in pixels

  if (height <= 0) return null;

  return (
    <path
      d={`
        M ${x},${y + height}
        L ${x},${y + radius}
        Q ${x},${y} ${x + radius},${y}
        L ${x + width - radius},${y}
        Q ${x + width},${y} ${x + width},${y + radius}
        L ${x + width},${y + height}
        Z
      `}
      fill={fill}
    />
  );
}

// ── Main Component ───────────────────────────────────────────
export default function ExpenseBarChart() {

  // Find the highest spending month — we'll highlight it
  const maxAmount = Math.max(...monthlyExpenses.map(m => m.amount));

  return (
    <div className="card flex flex-col gap-5">

      {/* Card Header with total annual figure */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Monthly Spending
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Full year overview
          </p>
        </div>

        {/* Annual total — calculated from the data */}
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Annual Total</p>
          <p className="text-sm font-bold font-finance" style={{ color: "var(--text-primary)" }}>
            ₹{(monthlyExpenses.reduce((s, m) => s + m.amount, 0) / 100000).toFixed(2)}L
          </p>
        </div>
      </div>

      {/* ── Bar Chart ─────────────────────────────────────── */}
      <div style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyExpenses}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            // left: -20 nudges Y-axis labels left so they don't get cut off
            barSize={18}
          >
            {/* Grid lines — strokeDasharray makes them dotted */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--bg-border)"
              vertical={false}  // only horizontal lines — cleaner
            />

            {/* X Axis (months) */}
            <XAxis
              dataKey="month"   // ← must match key name in your data array
              tick={{
                fill: "var(--text-muted)",
                fontSize: 11,
                fontFamily: "DM Sans, sans-serif",
              }}
              axisLine={false}   // hide the axis border line
              tickLine={false}   // hide the little tick marks
            />

            {/* Y Axis (amounts) */}
            <YAxis
              tick={{
                fill: "var(--text-muted)",
                fontSize: 10,
                fontFamily: "DM Mono, monospace",
              }}
              axisLine={false}
              tickLine={false}
              // tickFormatter: converts raw numbers to readable labels
              // 18400 → "18k", 31200 → "31k" etc.
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }} // hover highlight
            />

            {/* The bars themselves */}
            <Bar
              dataKey="amount"       // ← which data field = bar height
              shape={<RoundedBar />} // use our custom rounded shape
              radius={[4, 4, 0, 0]}  // fallback if RoundedBar fails
            >
              {/* Color each bar individually:
                  highest month = accent teal, others = dimmer blue */}
              {monthlyExpenses.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={
                    entry.amount === maxAmount
                      ? "var(--accent-primary)"  // highlight the max bar
                      : "var(--bg-border)"       // muted for others
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend note */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ background: "var(--accent-primary)" }} />
          Highest month
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ background: "var(--bg-border)" }} />
          Other months
        </div>
      </div>

    </div>
  );
}
