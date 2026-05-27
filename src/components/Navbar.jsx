// ============================================================
// FILE: src/components/Navbar.jsx
// PURPOSE: The horizontal top bar that sits above all content.
//
// WHY THIS FILE EXISTS:
//   The top navbar is a globally persistent UI element. Having
//   it in its own file means you can update search, alerts, or
//   user controls in one place. It sits at the top of every
//   page — so it's separate from dashboard-specific content.
//
// HOW IT CONNECTS:
//   App.jsx places this above the <Dashboard /> component.
//   It spans the full width of the right-side content area.
// ============================================================

export default function Navbar() {
  return (
    // The <header> element spans the full width of the content area.
    // h-16 = 64px tall   sticky top-0 = stays visible when scrolling
    // z-10 = sits above other content (important!)
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-10"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--bg-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── LEFT SIDE: Page Title + Breadcrumb ── */}
      <div>
        <h1
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Overview
        </h1>
        {/* Breadcrumb — tells the user where they are */}
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Home &nbsp;/&nbsp;
          <span style={{ color: "var(--accent-primary)" }}>Dashboard</span>
        </p>
      </div>

      {/* ── RIGHT SIDE: Search + Notifications + Date ── */}
      <div className="flex items-center gap-3">

        {/* Search Bar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            color: "var(--text-muted)",
            width: "180px",
          }}
        >
          {/* Search icon (inline SVG — no import needed) */}
          <svg
            width="14" height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-xs">Search...</span>
        </div>

        {/* Live Market Badge — shows the market is "live" */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: "rgba(16, 208, 120, 0.1)",
            border: "1px solid rgba(16, 208, 120, 0.2)",
            color: "var(--green)",
          }}
        >
          {/* Animated pulsing dot — a CSS animation */}
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--green)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          Live Market
        </div>

        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)",
            color: "var(--text-secondary)",
          }}
        >
          <svg
            width="16" height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {/* Red notification dot — the absolute positioning trick */}
          {/* "absolute" means it positions relative to the button */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{
              background: "var(--red)",
              boxShadow: "0 0 6px var(--red)",
            }}
          />
        </button>

        {/* Date display */}
        <div
          className="hidden md:flex flex-col items-end"
        >
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {/* JavaScript Date object gives us today's date */}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Inline keyframe for the pulse animation on the live dot.
          In a real project, you'd put this in main.css instead. */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
