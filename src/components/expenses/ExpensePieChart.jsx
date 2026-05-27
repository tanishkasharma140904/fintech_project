import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { useAnalytics } from "../../context/AnalyticsContext";

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;

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
  return null;
}

export default function ExpensePieChart() {
  const { analytics, status } = useAnalytics();
  const categoryData = analytics?.by_category || [];
  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  if (status === "loading") {
    return (
      <div className="card flex flex-col gap-5">
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Spending by Category</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Processing...</p>
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

  if (categoryData.length === 0) {
    return (
      <div className="card flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Spending by Category</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Current month breakdown</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12" style={{ color: "var(--text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: "12px" }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p className="text-xs">Upload a CSV to see category breakdown</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-5">

      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Spending by Category
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Current month breakdown
        </p>
      </div>

      <div className="relative" style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {categoryData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

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

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {categoryData.map((item) => {
          const pct = ((item.value / total) * 100).toFixed(1);

          return (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.color }}
              />
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
