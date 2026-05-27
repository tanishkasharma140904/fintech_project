import { useAnalytics } from "../../context/AnalyticsContext";

const TYPE_STYLES = {
  warning: {
    borderColor: "rgba(245, 166, 35, 0.3)",
    background: "rgba(245, 166, 35, 0.06)",
    dotColor: "#f5a623",
    label: "Warning",
    labelColor: "#f5a623",
  },
  alert: {
    borderColor: "rgba(255, 77, 106, 0.3)",
    background: "rgba(255, 77, 106, 0.06)",
    dotColor: "#ff4d6a",
    label: "Alert",
    labelColor: "#ff4d6a",
  },
  info: {
    borderColor: "rgba(0, 212, 170, 0.2)",
    background: "rgba(0, 212, 170, 0.05)",
    dotColor: "#00d4aa",
    label: "Insight",
    labelColor: "#00d4aa",
  },
};

function InsightCard({ insight }) {
  const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl transition-all duration-150"
      style={{
        background: style.background,
        border: `1px solid ${style.borderColor}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
        style={{
          background: "var(--bg-surface)",
          border: `1px solid ${style.borderColor}`,
        }}
      >
        {insight.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {insight.title}
          </p>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              background: `${style.dotColor}18`,
              color: style.labelColor,
              fontSize: "0.65rem",
            }}
          >
            {style.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {insight.detail}
        </p>
      </div>

      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
        style={{ background: style.dotColor }}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-border)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0"
        style={{ background: "var(--bg-surface)", animation: "pulse 2s ease-in-out infinite" }}
      />
      <div className="flex-1 space-y-2">
        <div
          className="h-3 rounded w-3/4"
          style={{ background: "var(--bg-surface)", animation: "pulse 2s ease-in-out infinite" }}
        />
        <div
          className="h-3 rounded w-full"
          style={{ background: "var(--bg-surface)", animation: "pulse 2s ease-in-out infinite", animationDelay: "0.2s" }}
        />
      </div>
    </div>
  );
}

export default function AIInsights() {
  const { analytics, status } = useAnalytics();
  const insights = analytics?.insights || [];

  // Empty state
  if (status !== "loading" && insights.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Insights
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Patterns detected in your spending behaviour
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              color: "var(--text-muted)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--text-muted)" }}
            />
            Waiting for data
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12" style={{ color: "var(--text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: "12px" }}>
            <path d="M12 2a10 10 0 0 1 7.38 16.75" /><path d="M12 2a10 10 0 0 0-7.38 16.75" />
            <circle cx="12" cy="12" r="3" /><line x1="12" y1="9" x2="12" y2="2" />
          </svg>
          <p className="text-xs">Upload a CSV to generate AI-powered insights</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Insights
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Analyzing patterns...
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{
              background: "var(--accent-glow)",
              border: "1px solid rgba(0,212,170,0.2)",
              color: "var(--accent-primary)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--accent-primary)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            Processing
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Data loaded state
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            AI Insights
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Patterns detected in your spending behaviour
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
          style={{
            background: "var(--accent-glow)",
            border: "1px solid rgba(0,212,170,0.2)",
            color: "var(--accent-primary)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--accent-primary)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          AI Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      <div
        className="mt-4 pt-4 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--bg-border)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {insights.length} insight{insights.length !== 1 ? "s" : ""} generated from your transaction data. Upload more data for higher accuracy.
        </p>
      </div>
    </div>
  );
}
