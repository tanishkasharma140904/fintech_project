import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { useAnalytics } from "../../context/AnalyticsContext";

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

function RoundedBar(props) {
  const { x, y, width, height, fill } = props;
  const radius = 4;

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

export default function ExpenseBarChart() {
  const { analytics, status } = useAnalytics();
  const monthlyData = analytics?.by_month || [];
  const chartData = monthlyData.map(m => ({ month: m.month, amount: m.spending }));
  const annualTotal = chartData.reduce((s, m) => s + m.amount, 0);
  const maxAmount = chartData.length > 0 ? Math.max(...chartData.map(m => m.amount)) : 0;

  if (status === "loading") {
    return (
      <div className="card flex flex-col gap-5">
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Monthly Spending</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Processing...</p>
          </div>
        </div>
        <div className="relative" style={{ height: "200px" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-transparent"
              style={{ borderTopColor: "var(--accent-primary)", animation: "spin 1s linear infinite" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-4 rounded" style={{ background: "var(--bg-elevated)", animation: "pulse 2s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Monthly Spending</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Full year overview</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12" style={{ color: "var(--text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: "12px" }}>
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p className="text-xs">Upload a CSV to see monthly trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-5">

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Monthly Spending
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Full year overview
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Annual Total</p>
          <p className="text-sm font-bold font-finance" style={{ color: "var(--text-primary)" }}>
            ₹{(annualTotal / 100000).toFixed(2)}L
          </p>
        </div>
      </div>

      <div style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--bg-border)"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: "var(--text-muted)",
                fontSize: 11,
                fontFamily: "DM Sans, sans-serif",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "var(--text-muted)",
                fontSize: 10,
                fontFamily: "DM Mono, monospace",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />

            <Bar
              dataKey="amount"
              shape={<RoundedBar />}
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={
                    entry.amount === maxAmount
                      ? "var(--accent-primary)"
                      : "var(--bg-border)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
