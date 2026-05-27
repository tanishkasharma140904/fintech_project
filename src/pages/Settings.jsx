import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNotifications } from "../context/NotificationContext";

const THEMES_PRESETS = [
  { id: "dark", label: "Original Dark", base: "#0a0d14", surface: "#111827", border: "#1f2d45", circle: "#111827" },
  { id: "midnight", label: "Midnight Carbon", base: "#05070a", surface: "#0b0e14", border: "#1b2434", circle: "#0b0e14" },
  { id: "ocean", label: "Deep Ocean", base: "#030c1b", surface: "#08142a", border: "#132b53", circle: "#08142a" },
  { id: "graphite", label: "Graphite Grey", base: "#101114", surface: "#17181c", border: "#2c2e36", circle: "#17181c" },
];

const ACCENTS_PRESETS = [
  { id: "teal", label: "Electric Teal", hex: "#00d4aa" },
  { id: "blue", label: "Cobalt Blue", hex: "#4d9fff" },
  { id: "purple", label: "Royal Purple", hex: "#c084fc" },
  { id: "green", label: "Emerald Green", hex: "#10d078" },
  { id: "orange", label: "Neon Orange", hex: "#f5a623" },
];

const ANIM_CSS = `
@keyframes settingsFade {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseHeartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px var(--green)); opacity: 0.9; }
  50% { transform: scale(1.1); filter: drop-shadow(0 0 10px var(--green)); opacity: 1; }
}
@keyframes spinSync {
  to { transform: rotate(360deg); }
}
`;

export default function Settings() {
  const { user, appearance, telemetry, updateProfile, updateAppearance, resetUser } = useUser();
  const { addNotification } = useNotifications();

  // ── SECURITY STATE ──
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [passwordHealth, setPasswordHealth] = useState("Weak");
  const [passwordHealthColor, setPasswordHealthColor] = useState("var(--red)");

  const handlePasswordChange = (val) => {
    setNewPassword(val);
    if (!val) { setPasswordHealth("Weak"); setPasswordHealthColor("var(--red)"); }
    else if (val.length < 6) { setPasswordHealth("Weak"); setPasswordHealthColor("var(--red)"); }
    else if (val.length < 10) { setPasswordHealth("Medium"); setPasswordHealthColor("var(--yellow)"); }
    else { setPasswordHealth("Strong"); setPasswordHealthColor("var(--green)"); }
  };

  // Login Activity Devices sessions (linked to central user profile state)
  const [sessions, setSessions] = useState([
    { id: "ses_1", device: "MacBook Pro M3", browser: "Chrome", location: "New Delhi, IN", status: "Active Now", icon: "💻", current: true },
    { id: "ses_2", device: "iPhone 15 Pro", browser: "Safari App", location: "Mumbai, IN", status: "Last Active: 3 hours ago", icon: "📱", current: false },
    { id: "ses_3", device: "Windows desktop PC", browser: "Microsoft Edge", location: "Bangalore, IN", status: "Last Active: Yesterday", icon: "🖥️", current: false },
  ]);

  const handleRevokeSession = (id) => {
    const ses = sessions.find(s => s.id === id);
    setSessions(prev => prev.filter(s => s.id !== id));
    updateProfile({ activeSessionsCount: sessions.length - 1 });
    addNotification({
      title: "Security: Session Revoked",
      description: `Active terminal link for ${ses?.device || "device"} terminated.`,
      category: "Security",
      priority: "medium",
    });
  };

  const handleLogoutAll = () => {
    setSessions(prev => prev.filter(s => s.current));
    updateProfile({ activeSessionsCount: 1 });
    addNotification({
      title: "Security: Sessions Cleared",
      description: "Logged out from all alternate active desktop and mobile terminals successfully.",
      category: "Security",
      priority: "high",
    });
  };

  // ── CONNECTED ACCOUNTS STATE ──
  const [accounts, setAccounts] = useState({
    hdfc: { id: "hdfc", label: "HDFC Premium Banking", type: "Bank Account", status: "Connected", syncTime: "2 mins ago", health: "Healthy", logo: "🏦", syncLoading: false },
    sbi: { id: "sbi", label: "SBI Wealth Accounts", type: "Bank Account", status: "Connected", syncTime: "1 hour ago", health: "Healthy", logo: "🏦", syncLoading: false },
    icici: { id: "icici", label: "ICICI Credit Core", type: "Credit Cards", status: "Requires Attention", syncTime: "1 day ago", health: "Warning", logo: "💳", syncLoading: false },
    axis: { id: "axis", label: "Axis Retail Card", type: "Credit Cards", status: "Disconnected", syncTime: "Never", health: "Error", logo: "💳", syncLoading: false },
    google: { id: "google", label: "Google Account Login", type: "SSO Provider", status: "Connected", syncTime: "Just Now", health: "Healthy", logo: "🪙", syncLoading: false },
  });

  const handleSyncAccount = (id) => {
    setAccounts(prev => ({
      ...prev,
      [id]: { ...prev[id], syncLoading: true }
    }));

    // Simulate standard sync loading
    setTimeout(() => {
      setAccounts(prev => {
        const nextAcc = {
          ...prev,
          [id]: {
            ...prev[id],
            syncLoading: false,
            status: "Connected",
            syncTime: "Just Now",
            health: "Healthy"
          }
        };
        addNotification({
          title: `${nextAcc[id].label} Synced`,
          description: "Recurring balance ledgers and cashflow sheets updated dynamically.",
          category: "Transactions",
          priority: "medium",
        });
        return nextAcc;
      });
      updateProfile({ lastAccountSync: new Date().toISOString() });
    }, 2000);
  };

  const handleToggleAccount = (id) => {
    setAccounts(prev => {
      const active = prev[id].status !== "Disconnected";
      const nextAcc = {
        ...prev,
        [id]: {
          ...prev[id],
          status: active ? "Disconnected" : "Connected",
          syncTime: active ? "Never" : "Just Now",
          health: active ? "Error" : "Healthy"
        }
      };
      addNotification({
        title: `${nextAcc[id].label} Link Changed`,
        description: `Connection status altered to ${active ? "Disconnected" : "Connected"} successfully.`,
        category: "System",
        priority: "low",
      });
      return nextAcc;
    });
  };

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <style>{ANIM_CSS}</style>

      {/* ═══════════ HERO HEADER SECTION ═══════════ */}
      <section style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.05) 0%, rgba(192,132,252,0.03) 50%, rgba(77,159,255,0.04) 100%)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "2rem 1.5rem 1.5rem",
        animation: "settingsFade 0.4s ease-out"
      }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">⚙️</span>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", margin: 0 }}>
                Control Center
              </h1>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Customize app themes globally, audit logged sessions, sync bank ledgers, and check core systems metrics.
            </p>
          </div>

          <div 
            className="flex items-center gap-3 text-xs bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800 self-start transition-all"
            style={{ borderColor: telemetry.heartbeat ? "var(--accent-dim)" : "var(--bg-border)" }}
          >
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{
                background: "var(--green)",
                animation: telemetry.heartbeat ? "pulseHeartbeat 1s infinite" : "none",
                boxShadow: "0 0 6px var(--green)"
              }}
            />
            <span style={{ color: "var(--text-secondary)" }}>API Latency: <span className="font-mono font-bold text-emerald-400">{telemetry.apiLatency}ms</span></span>
          </div>
        </div>
      </section>

      <div className="p-6 space-y-6" style={{ animation: "settingsFade 0.5s ease" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ═══════════ USER IDENTITY & PROFILE ═══════════ */}
          <div className="card space-y-5">
            <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span>👤</span> SaaS User Identity & Profile
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Updates SaaS identity and dashboard greetings in real-time</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Full Name</label>
                <input
                  type="text"
                  value={user?.fullName || ""}
                  onChange={e => updateProfile({ fullName: e.target.value })}
                  onBlur={() => addNotification({
                    title: "Security: Identity Updated",
                    description: `Your full name has been securely modified inside your profile.`,
                    category: "Security",
                    priority: "low",
                  })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Occupation</label>
                <input
                  type="text"
                  value={user?.occupation || ""}
                  onChange={e => updateProfile({ occupation: e.target.value })}
                  onBlur={() => addNotification({
                    title: "SaaS Identity Modified",
                    description: `Occupational metadata updated to ${user?.occupation || "new role"}.`,
                    category: "Security",
                    priority: "low",
                  })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">City & Country</label>
                <input
                  type="text"
                  value={user?.cityCountry || ""}
                  onChange={e => updateProfile({ cityCountry: e.target.value })}
                  onBlur={() => addNotification({
                    title: "Location Parameters Synced",
                    description: "Your primary regional ledger node is synchronized successfully.",
                    category: "System",
                    priority: "low",
                  })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={user?.monthlyIncome || ""}
                  onChange={e => updateProfile({ monthlyIncome: parseFloat(e.target.value) || 0 })}
                  onBlur={() => addNotification({
                    title: "Surplus Forecast Updated",
                    description: "Estimated monthly cash-inflows and compound potentials have been recalculated.",
                    category: "Analytics",
                    priority: "medium",
                  })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: "var(--bg-border)" }}>
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Risk Appetite</label>
                <select
                  value={user?.riskAppetite || "moderate"}
                  onChange={e => {
                    updateProfile({ riskAppetite: e.target.value });
                    addNotification({
                      title: "Risk Parameters Shifted",
                      description: `Active investment risk preferences altered to ${e.target.value}.`,
                      category: "Investment",
                      priority: "medium",
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                >
                  <option value="low">Low Risk</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Actions</label>
                <button
                  onClick={resetUser}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all border border-red-900 text-red-400 bg-red-950 bg-opacity-20 hover:bg-opacity-30"
                >
                  Reset SaaS State
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════ APPEARANCE & SETTINGS ═══════════ */}
          <div className="card space-y-5">
            <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span>🎨</span> Personalization & Themes
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Instant dynamic customization of root CSS variables</p>
            </div>

            {/* Accent Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Brand Accent Highlights</label>
              <div className="flex flex-wrap gap-2.5">
                {ACCENTS_PRESETS.map(accent => {
                  const active = appearance?.accent?.toLowerCase() === accent.hex.toLowerCase();
                  return (
                    <button
                      key={accent.id}
                      onClick={() => updateAppearance({ accent: accent.hex })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2"
                      style={{
                        background: active ? "var(--accent-glow)" : "var(--bg-elevated)",
                        borderColor: active ? accent.hex : "var(--bg-border)",
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent.hex }} />
                      <span>{accent.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Mode Grid */}
            <div className="space-y-2.5 pt-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">UI Base Layer Themes</label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES_PRESETS.map(theme => {
                  const active = appearance?.theme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => updateAppearance({ theme: theme.id })}
                      className="p-3.5 text-left rounded-xl border transition-all flex items-center gap-3 relative overflow-hidden"
                      style={{
                        background: theme.surface,
                        borderColor: active ? "var(--accent-primary)" : "var(--bg-border)",
                        boxShadow: active ? "0 0 16px var(--accent-glow)" : "none",
                      }}
                    >
                      <div className="w-6 h-6 rounded-full border border-gray-800 flex-shrink-0" style={{ background: theme.base }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: active ? "var(--accent-primary)" : "var(--text-primary)" }}>{theme.label}</p>
                        <p className="text-[9.5px] text-gray-500 mt-0.5 truncate">Base: {theme.base}</p>
                      </div>
                      {active && (
                        <span className="ml-auto w-2 h-2 rounded-full" style={{ background: "var(--accent-primary)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles & Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: "var(--bg-border)" }}>
              {/* Glass Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Glassmorphism Blur</span>
                  <span className="font-mono text-cyan-400">{appearance?.glassIntensity}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={appearance?.glassIntensity || 0}
                  onChange={e => updateAppearance({ glassIntensity: parseInt(e.target.value) })}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
              </div>

              {/* Toggles list */}
              <div className="space-y-3 self-end">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">Compact Dashboard Mode</span>
                  <button
                    onClick={() => updateAppearance({ compactMode: !appearance?.compactMode })}
                    className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none"
                    style={{ background: appearance?.compactMode ? "var(--accent-primary)" : "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-900 transition-transform duration-200" style={{ transform: appearance?.compactMode ? "translateX(16px)" : "translateX(0)" }} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">Reduced Motion Controls</span>
                  <button
                    onClick={() => updateAppearance({ reducedMotion: !appearance?.reducedMotion })}
                    className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none"
                    style={{ background: appearance?.reducedMotion ? "var(--accent-primary)" : "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-900 transition-transform duration-200" style={{ transform: appearance?.reducedMotion ? "translateX(16px)" : "translateX(0)" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════ 2. SECURITY SETTINGS ═══════════ */}
          <div className="card space-y-5">
            <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span>🛡️</span> Security Center
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Password strengths, Two-Factor, and active sessions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Change Password inputs */}
              <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Update Credentials</label>
                
                <input
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />

                <div className="relative">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => handlePasswordChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                  />
                  {newPassword && (
                    <span className="absolute right-3 top-2 text-[9.5px] font-bold tracking-widest uppercase font-mono" style={{ color: passwordHealthColor }}>
                      {passwordHealth}
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </div>

              {/* 2FA and Security metrics */}
              <div className="space-y-4 md:pl-4 md:border-l" style={{ borderColor: "var(--bg-border)" }}>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block font-mono">Authentication Options</label>
                
                <div className="p-3 rounded-lg bg-gray-950 bg-opacity-35 border border-gray-900 flex justify-between items-center">
                  <div>
                    <p className="text-[11.5px] font-extrabold" style={{ color: "var(--text-primary)" }}>Two-Factor Authenticator</p>
                    <p className="text-[9.5px] text-gray-500 mt-0.5">Locks logins using mobile TOTP.</p>
                  </div>
                  <button
                    onClick={() => setTfaEnabled(!tfaEnabled)}
                    className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none"
                    style={{ background: tfaEnabled ? "var(--accent-primary)" : "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-900 transition-transform duration-200" style={{ transform: tfaEnabled ? "translateX(16px)" : "translateX(0)" }} />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-gray-950 bg-opacity-35 border border-gray-900 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500">Global Protection status</p>
                  <p className="text-sm font-extrabold mt-0.5" style={{ color: tfaEnabled ? "var(--green)" : "var(--yellow)" }}>
                    {tfaEnabled ? "✓ Fully Armed System" : "🛡️ Basic Protection Active"}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Second Row: Session manager & Connected Financial Accounts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Connected Device Sessions (Security continued) */}
          <div className="xl:col-span-1 card space-y-4">
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active login sessions</h3>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Audited logged-in devices list</p>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={handleLogoutAll}
                  className="px-2.5 py-1 rounded-md text-[9.5px] font-bold border border-red-800 text-red-400 bg-red-950 bg-opacity-20 transition-all hover:bg-opacity-30"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {sessions.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-gray-950 bg-opacity-35 border border-gray-900 flex justify-between items-center hover:border-gray-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {s.device} {s.current && <span className="text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-900 ml-1">Current</span>}
                      </p>
                      <p className="text-[9.5px] text-gray-500 truncate mt-0.5">{s.browser} • {s.location}</p>
                    </div>
                  </div>

                  {!s.current && (
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-2.5 py-1 rounded-md text-[9.5px] font-bold border border-gray-800 text-gray-500 hover:border-red-900 hover:text-red-400 transition-all"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. CONNECTED ACCOUNTS COCKPIT */}
          <div className="xl:col-span-2 card space-y-4">
            <div className="border-b pb-2" style={{ borderColor: "var(--bg-border)" }}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <span>🏦</span> Linked Accounts Sync Ledger
              </h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Believable financial statements pull simulator (No Real APIs)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(accounts).map(acc => {
                const isDisconnected = acc.status === "Disconnected";
                const isWarning = acc.status === "Requires Attention";
                const badgeColor = isDisconnected ? "var(--red)" : isWarning ? "var(--yellow)" : "var(--green)";

                return (
                  <div
                    key={acc.id}
                    className="p-3.5 rounded-xl border flex flex-col justify-between space-y-3 relative overflow-hidden"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--bg-border)"
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center text-base border border-gray-850 flex-shrink-0">{acc.logo}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{acc.label}</p>
                          <p className="text-[9.5px] text-gray-500 mt-0.5">{acc.type}</p>
                        </div>
                      </div>

                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border flex-shrink-0"
                        style={{
                          background: `${badgeColor}12`,
                          borderColor: `${badgeColor}25`,
                          color: badgeColor
                        }}
                      >
                        {acc.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] border-t border-gray-950 pt-2.5">
                      <span className="text-gray-500">Sync: <span className="font-mono text-gray-300">{acc.syncTime}</span></span>
                      
                      <div className="flex items-center gap-2">
                        {!isDisconnected && (
                          <button
                            disabled={acc.syncLoading}
                            onClick={() => handleSyncAccount(acc.id)}
                            className="px-2.5 py-1 rounded-md text-[9.5px] font-bold border transition-all flex items-center gap-1"
                            style={{
                              background: acc.syncLoading ? "transparent" : "var(--accent-glow)",
                              borderColor: acc.syncLoading ? "var(--bg-border)" : "rgba(0,212,170,0.25)",
                              color: acc.syncLoading ? "var(--text-muted)" : "var(--accent-primary)",
                              cursor: acc.syncLoading ? "not-allowed" : "pointer"
                            }}
                          >
                            {acc.syncLoading ? (
                              <>
                                <span className="w-2 h-2 rounded-full border border-transparent border-t-teal-400 inline-block animate-spin" style={{ animation: "spinSync 1s linear infinite" }} />
                                <span>Syncing...</span>
                              </>
                            ) : (
                              <span>Sync Now</span>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleAccount(acc.id)}
                          className="px-2.5 py-1 rounded-md text-[9.5px] font-bold border border-gray-950 text-gray-400 hover:text-white"
                        >
                          {isDisconnected ? "Link" : "Unlink"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ═══════════ 4. ABOUT & SYSTEM INFO (System telemetry) ═══════════ */}
        <section className="card space-y-4">
          <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: "var(--bg-border)" }}>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telemetry Monitoring</h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Core AI model pipelines and database metrics</p>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-950 px-3 py-1 rounded-md border border-gray-800">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" style={{ animation: "pulseHeartbeat 2.5s infinite" }} />
              <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono tracking-wider">Heartbeat active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="p-3 bg-gray-950 bg-opacity-35 rounded-xl border border-gray-900 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-500">App Version</p>
              <p className="text-sm font-extrabold font-mono mt-0.5" style={{ color: "var(--accent-primary)" }}>v1.2.4</p>
            </div>
            
            <div className="p-3 bg-gray-950 bg-opacity-35 rounded-xl border border-gray-900 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-500">AI Engine</p>
              <p className="text-sm font-extrabold mt-0.5 text-emerald-400">Operational</p>
            </div>

            <div className="p-3 bg-gray-950 bg-opacity-35 rounded-xl border border-gray-900 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-500">Ledger API status</p>
              <p className="text-sm font-extrabold mt-0.5 text-emerald-400">Nominal</p>
            </div>

            <div className="p-3 bg-gray-950 bg-opacity-35 rounded-xl border border-gray-900 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-500">Session ID status</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: "var(--accent-primary)" }}>Authorized</p>
            </div>

            <div className="p-3 bg-gray-950 bg-opacity-35 rounded-xl border border-gray-900 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-500">Local Storage Cache</p>
              <p className="text-sm font-extrabold font-mono mt-0.5" style={{ color: "var(--text-primary)" }}>452 KB</p>
            </div>

            <div className="p-3 bg-gray-950 bg-opacity-35 rounded-xl border border-gray-900 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-500">Database Engine</p>
              <p className="text-sm font-extrabold mt-0.5 text-gray-400 font-mono">SQLite / FS</p>
            </div>

          </div>

          <div className="p-3 rounded-lg flex items-start gap-2.5 text-xs bg-cyan-950 bg-opacity-20 border border-cyan-900 border-opacity-30">
            <span className="text-base mt-0.5">🧠</span>
            <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              All settings are client-side reactive. Local storage captures theme presets, accent variable values, and mock session revocations. The synchronization bars simulate transactional ledger pulls using mock hooks to model Fi Money/CRED and allow testing without banking API keys.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
