// ============================================================
// FILE: src/components/Sidebar.jsx
// PURPOSE: The vertical navigation panel on the LEFT side.
//
// WHY THIS FILE EXISTS:
//   Navigation is its own concern — separating it into its own
//   file means you can edit the menu without touching the rest
//   of the app. This is the core idea of React components:
//   one job per file.
//
// HOW IT CONNECTS:
//   App.jsx imports this and places it on the left side of the
//   layout. It receives no props right now — all data is
//   defined inside. Later you'll pass props from App.jsx.
// ============================================================

import { useState } from "react";

// ----- DATA: Define your navigation items here -----
// Each item has:
//   label → what the user sees
//   icon  → an SVG icon (inline, no icon library needed)
//   id    → a unique key React uses to track list items
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ----- COMPONENT -----
// useState is a React "hook" — it lets a component remember
// something between renders. Here we track which nav item
// is currently active (clicked/selected).
export default function Sidebar() {
  const [activeId, setActiveId] = useState("dashboard");

  return (
    // The outer <aside> is the full sidebar container.
    // h-screen = 100% of viewport height
    // flex flex-col = stack children vertically
    // w-60 = 240px wide
    <aside
      className="h-screen w-60 flex flex-col"
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--bg-border)",
      }}
    >
      {/* ── Logo Area ── */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid var(--bg-border)" }}
      >
        {/* Logo icon — a simple geometric shape */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-primary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {/* Brand name */}
        <div>
          <p className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
            NovaTrade
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Pro Dashboard
          </p>
        </div>
      </div>

      {/* ── Navigation Section Label ── */}
      <div className="px-6 pt-6 pb-2">
        <p
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Main Menu
        </p>
      </div>

      {/* ── Navigation Items ──
          We loop over NAV_ITEMS using .map() — a very common
          React pattern for rendering lists. Each item needs
          a unique "key" prop so React can track it efficiently. */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              onClick={() => setActiveId(item.id)}
              // Conditional classes: if active, apply different colors
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150 group"
              style={{
                background: isActive ? "var(--accent-glow)" : "transparent",
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                border: isActive
                  ? "1px solid rgba(0,212,170,0.2)"
                  : "1px solid transparent",
              }}
              // Hover style is handled via inline onMouseEnter/Leave
              // In real projects you'd use Tailwind hover: classes
            >
              {/* Icon */}
              <span
                className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
              >
                {item.icon}
              </span>
              {/* Label */}
              <span>{item.label}</span>

              {/* Active dot indicator on the right */}
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom User Profile Area ── */}
      <div
        className="p-4 mx-3 mb-4 rounded-xl flex items-center gap-3"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #00d4aa, #4d9fff)",
            color: "#fff",
          }}
        >
          AK
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            Aryan Kumar
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            Pro Plan
          </p>
        </div>
        {/* Online status dot */}
        <span
          className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green)" }}
        />
      </div>
    </aside>
  );
}
