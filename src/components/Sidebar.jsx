import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
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
    to: "/portfolio",
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
    to: "/transactions",
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
    to: "/analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "estimator",
    label: "Investment Estimator",
    to: "/investment-estimator",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="12" y2="10" />
        <line x1="8" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="12" y2="18" />
      </svg>
    ),
  },
  {
    id: "debt",
    label: "Debt Management",
    to: "/debt-management",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "splitup",
    label: "SplitUp",
    to: "/splitup",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M8 3H3v5" />
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
        <path d="m15 9 6-6" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    to: "/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Extract initials dynamically
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AK";

  return (
    <aside
      className="h-screen w-60 flex flex-col"
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--bg-border)",
      }}
    >
      {/* Logo Area */}
      <div
        className="flex items-center gap-3 px-6 py-5 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ borderBottom: "1px solid var(--bg-border)" }}
        onClick={() => navigate("/dashboard")}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-primary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
            Artho
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Pro Dashboard
          </p>
        </div>
      </div>

      {/* Section Label */}
      <div className="px-6 pt-6 pb-2">
        <p
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Main Menu
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150 group no-underline"
            style={({ isActive }) => ({
              background: isActive ? "var(--accent-glow)" : "transparent",
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
              border: isActive
                ? "1px solid rgba(0,212,170,0.2)"
                : "1px solid transparent",
              textDecoration: "none",
            })}
          >
            {({ isActive }) => (
              <>
                <span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--accent-primary)" }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Footer */}
      <NavLink
        to="/profile"
        className="mx-3 mb-4 rounded-xl flex items-center gap-3 p-4 transition-all duration-200 outline-none hover:border-cyan-500 hover:border-opacity-35"
        style={({ isActive }) => ({
          background: "var(--bg-elevated)",
          border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--bg-border)",
          boxShadow: isActive ? "0 0 12px var(--accent-glow)" : "none",
          textDecoration: "none",
          cursor: "pointer"
        })}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent-primary), #4d9fff)",
            color: "#fff",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {user?.fullName || "Aryan Kumar"}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {user?.completed ? (user.riskAppetite ? `${user.riskAppetite.charAt(0).toUpperCase() + user.riskAppetite.slice(1)} Risk` : "Pro Plan") : "Onboarding Stage"}
          </p>
        </div>
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              await logout();
              navigate("/login");
            } catch (err) {
              console.error("Sidebar logout failed:", err);
            }
          }}
          className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all flex-shrink-0"
          title="Sign Out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </NavLink>
    </aside>
  );
}
