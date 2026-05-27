// ============================================================
// FILE: src/components/Navbar.jsx
// PURPOSE: The horizontal top bar that sits above all content.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useNotifications } from "../context/NotificationContext";
import { getRouteMetadata } from "../utils/navigationConfig";

const CATEGORY_ICONS = {
  Analytics: { emoji: "📈", color: "#10d078" },
  Investment: { emoji: "🎯", color: "#c084fc" },
  Debt: { emoji: "💸", color: "#ff4d6a" },
  Security: { emoji: "🛡️", color: "#ff4d6a" },
  System: { emoji: "⚙️", color: "#00d4aa" },
  Transactions: { emoji: "💳", color: "#f5a623" },
};

export default function Navbar() {
  const { user, telemetry } = useUser();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();
  
  const location = useLocation();
  const metadata = getRouteMetadata(location.pathname);

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const panelRef = useRef(null);

  // Extract initials dynamically
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AK";

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "alerts") return n.category === "Debt" || n.category === "Security" || n.priority === "high";
    if (activeFilter === "tx") return n.category === "Transactions";
    if (activeFilter === "system") return n.category === "System" || n.category === "Analytics";
    return true;
  });

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-10"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--bg-border)",
        backdropFilter: "blur(var(--backdrop-blur, 12px))",
      }}
    >
      {/* ── LEFT SIDE: Page Title + Breadcrumb ── */}
      <div>
        <h1
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {metadata?.title || "Dashboard Overview"}
        </h1>
        {/* Dynamic breadcrumb rendering */}
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {metadata?.breadcrumbs.map((crumb, idx) => {
            const isLast = idx === metadata.breadcrumbs.length - 1;
            return (
              <span key={idx}>
                {idx > 0 && <span className="mx-1">/</span>}
                <span style={{ color: isLast ? "var(--accent-primary)" : "inherit" }}>
                  {crumb}
                </span>
              </span>
            );
          })}
        </p>
      </div>

      {/* ── RIGHT SIDE: Search + Notifications + Date + Telemetry + Profile ── */}
      <div className="flex items-center gap-3 relative">

        {/* Global Search trigger bar */}
        <div
          onClick={() => window.dispatchEvent(new CustomEvent("open-search"))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all border select-none hover:border-cyan-500 hover:border-opacity-35"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--bg-border)",
            color: "var(--text-muted)",
            width: "180px",
            cursor: "pointer",
          }}
        >
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
          <span className="text-xs">Search... (Cmd+K)</span>
        </div>

        {/* Live Telemetry Latency Badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: telemetry.heartbeat ? "rgba(16, 208, 120, 0.1)" : "rgba(16, 208, 120, 0.05)",
            border: `1px solid ${telemetry.heartbeat ? "rgba(16, 208, 120, 0.2)" : "rgba(16, 208, 120, 0.1)"}`,
            color: "var(--green)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--green)",
              animation: telemetry.heartbeat ? "pulse 1s ease-in-out infinite" : "none",
              boxShadow: telemetry.heartbeat ? "0 0 6px var(--green)" : "none",
            }}
          />
          <span>API: {telemetry.apiLatency}ms</span>
        </div>

        {/* Notification Bell Toggler Wrapper */}
        <div ref={panelRef} className="relative">
          <button
            onClick={() => setPanelOpen((prev) => !prev)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: panelOpen ? "1px solid var(--accent-primary)" : "1px solid var(--bg-border)",
              color: panelOpen ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: panelOpen ? "0 0 8px var(--accent-glow)" : "none",
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
            
            {/* Dynamic Numeric Badge count */}
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold px-1 animate-pulse"
                style={{
                  background: "var(--red)",
                  color: "#fff",
                  boxShadow: "0 0 8px var(--red)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Absolute Dropdown panel */}
          {panelOpen && (
            <div
              className="absolute right-0 top-11 w-80 rounded-xl border flex flex-col z-[9999]"
              style={{
                background: "rgba(17, 24, 39, 0.96)",
                borderColor: "var(--bg-border)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px var(--accent-glow)",
                backdropFilter: "blur(var(--backdrop-blur, 12px))",
              }}
            >
              {/* Sticky Header */}
              <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--bg-border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-red-950 text-red-400 border border-red-900 border-opacity-40 px-1.5 py-0.5 rounded font-extrabold font-mono leading-none">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <button 
                    onClick={markAllAsRead} 
                    className="text-cyan-400 hover:text-white transition-colors font-semibold"
                  >
                    Mark all read
                  </button>
                  <span className="text-gray-600">|</span>
                  <button 
                    onClick={clearAll} 
                    className="text-gray-500 hover:text-red-400 transition-colors font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 p-1.5 bg-gray-950 bg-opacity-40 border-b" style={{ borderColor: "var(--bg-border)" }}>
                {[
                  { id: "all", label: "All" },
                  { id: "alerts", label: "Alerts" },
                  { id: "tx", label: "Tx" },
                  { id: "system", label: "System" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className="flex-1 py-1 rounded-md text-[9px] font-bold transition-all text-center"
                    style={{
                      background: activeFilter === tab.id ? "var(--bg-elevated)" : "transparent",
                      color: activeFilter === tab.id ? "var(--accent-primary)" : "var(--text-secondary)",
                      border: activeFilter === tab.id ? "1px solid rgba(0,212,170,0.15)" : "1px solid transparent"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto p-2 space-y-1.5 max-h-64 scrollbar-thin">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => {
                    const details = CATEGORY_ICONS[n.category] || CATEGORY_ICONS.System;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className="p-2.5 rounded-xl border text-left flex gap-2.5 transition-all relative overflow-hidden cursor-pointer"
                        style={{
                          background: n.unread ? "rgba(31, 45, 69, 0.15)" : "var(--bg-elevated)",
                          borderColor: n.unread ? "rgba(0, 212, 170, 0.15)" : "var(--bg-border)",
                        }}
                      >
                        {/* Priority border highlight marker */}
                        {n.unread && (
                          <div 
                            className="absolute top-0 left-0 bottom-0 w-1" 
                            style={{ 
                              background: n.priority === "high" ? "var(--red)" : n.priority === "medium" ? "var(--yellow)" : "var(--green)" 
                            }} 
                          />
                        )}
                        
                        <span className="text-base flex-shrink-0 mt-0.5">{details.emoji}</span>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-1">
                            <p className="text-[11px] font-bold text-gray-200 leading-tight truncate">{n.title}</p>
                            <span className="text-[9px] text-gray-500 font-mono flex-shrink-0 leading-none mt-0.5">{n.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 leading-normal">{n.description}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-xl mb-1">📭</span>
                    <p className="text-xs font-bold text-gray-400">All caught up!</p>
                    <p className="text-[9.5px] text-gray-500 mt-0.5">No outstanding Artho alerts.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date display */}
        <div
          className="hidden md:flex flex-col items-end"
        >
          <p className="text-[11px] font-medium leading-none" style={{ color: "var(--text-secondary)" }}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
          <p className="text-[10px] leading-none mt-1" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Premium Personalized User Identity block */}
        <div 
          className="flex items-center gap-2.5 pl-3 border-l" 
          style={{ borderColor: "var(--bg-border)" }}
        >
          <div className="hidden lg:flex flex-col items-end">
            <p className="text-xs font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
              {user?.fullName || "Aryan Kumar"}
            </p>
            <p className="text-[10px] leading-none mt-1" style={{ color: "var(--text-muted)" }}>
              {user?.occupation || "Senior Portfolio Analyst"}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), #4d9fff)",
              color: "#fff",
            }}
          >
            {initials}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
