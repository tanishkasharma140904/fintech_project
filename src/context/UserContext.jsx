/**
 * UserContext — the master global source of truth for user SaaS personalization.
 * 
 * Provides:
 *   user       - profile data object (fullName, occupation, income, risk, isOnboarded)
 *   appearance - UI variables object (theme, accent, compactMode, glassIntensity, reducedMotion)
 *   telemetry  - real-time fluctuating server stats (latency, heartbeat status)
 *   
 * Methods:
 *   updateProfile(data)      - updates profile properties
 *   updateAppearance(data)   - instantly updates visual CSS variables globally
 *   completeOnboarding(data) - flags onboarding as completed
 *   resetUser()              - resets both profile and appearance to defaults
 */
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

const STORAGE_KEYS = {
  profile: "fintech_user_profile",
  appearance: "fintech_user_appearance",
};

const DEFAULT_PROFILE = {
  fullName: "Aryan Kumar",
  age: 28,
  occupation: "Senior Portfolio Analyst",
  cityCountry: "New Delhi, India",
  monthlyIncome: 150000,
  employmentType: "salaried",
  maritalStatus: "single",
  dependents: 0,
  goals: ["investment", "savings"],
  monthlySavingsGoal: 40000,
  riskAppetite: "moderate",
  preferredInvestments: ["mutual_funds", "stocks"],
  hasLoans: "no",
  approxDebtBalance: 0,
  completed: false, // Onboarding status
};

const DEFAULT_APPEARANCE = {
  theme: "dark",
  accent: "#00d4aa", // Original Teal
  compactMode: false,
  glassIntensity: 12,
  reducedMotion: false,
};

export function UserProvider({ children }) {
  // ── 1. CORE STATES ──
  const [user, setUser] = useState(DEFAULT_PROFILE);
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [telemetry, setTelemetry] = useState({
    apiLatency: 84,
    aiStatus: "Operational",
    analyticsStatus: "Healthy",
    heartbeat: true,
  });
  const [loading, setLoading] = useState(true);

  // ── 2. INITIALIZATION ON MOUNT ──
  useEffect(() => {
    try {
      // Load Profile
      const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
      const oldOnboarding = localStorage.getItem("fintech_onboarding"); // check legacy key for seamless compatibility
      
      let profileObj = DEFAULT_PROFILE;
      if (storedProfile) {
        profileObj = JSON.parse(storedProfile);
      } else if (oldOnboarding) {
        // Migration support from old onboarding context
        const parsed = JSON.parse(oldOnboarding);
        profileObj = { ...DEFAULT_PROFILE, ...parsed, completed: true };
      }
      setUser(profileObj);

      // Load Appearance
      const storedAppearance = localStorage.getItem(STORAGE_KEYS.appearance);
      let appearanceObj = DEFAULT_APPEARANCE;
      if (storedAppearance) {
        appearanceObj = JSON.parse(storedAppearance);
      } else {
        // Fallback checks on old setting values
        const legacyTheme = localStorage.getItem("fintech_theme_mode");
        const legacyAccent = localStorage.getItem("fintech_accent_color");
        const legacyCompact = localStorage.getItem("fintech_compact_mode") === "true";
        const legacyGlass = localStorage.getItem("fintech_glass_intensity");
        const legacyMotion = localStorage.getItem("fintech_reduced_motion") === "true";

        appearanceObj = {
          theme: legacyTheme || DEFAULT_APPEARANCE.theme,
          accent: legacyAccent || DEFAULT_APPEARANCE.accent,
          compactMode: legacyCompact,
          glassIntensity: legacyGlass ? parseInt(legacyGlass) : DEFAULT_APPEARANCE.glassIntensity,
          reducedMotion: legacyMotion,
        };
      }
      setAppearance(appearanceObj);
      
      // Inject Visual Custom Properties instantly on load
      applyCSSVariables(appearanceObj);

    } catch (err) {
      console.error("Error initializing UserContext:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 3. TELEMETRY INTERVAL FLUCTUATIONS ──
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const delta = Math.floor(Math.random() * 20) - 10; // fluc +/- 10ms
        let nextLatency = prev.apiLatency + delta;
        if (nextLatency < 45) nextLatency = 48;
        if (nextLatency > 115) nextLatency = 110;
        
        return {
          ...prev,
          apiLatency: nextLatency,
          heartbeat: !prev.heartbeat, // toggling heartbeat pulse
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ── 4. VISUAL STYLE PROPERTY WRITERS ──
  const applyCSSVariables = (cfg) => {
    try {
      // 1. Accent color variables
      document.documentElement.style.setProperty('--accent-primary', cfg.accent);
      document.documentElement.style.setProperty('--accent-glow', `${cfg.accent}15`);
      document.documentElement.style.setProperty('--accent-dim', `${cfg.accent}60`);

      // 2. Base layer themes variables
      const themes = {
        dark: { base: "#0a0d14", surface: "#111827", elevated: "#1a2235", border: "#1f2d45" },
        midnight: { base: "#05070a", surface: "#0b0e14", elevated: "#131924", border: "#1b2434" },
        ocean: { base: "#030c1b", surface: "#08142a", elevated: "#0d1e3d", border: "#132b53" },
        graphite: { base: "#101114", surface: "#17181c", elevated: "#212329", border: "#2c2e36" }
      };
      const colors = themes[cfg.theme] || themes.dark;
      document.documentElement.style.setProperty('--bg-base', colors.base);
      document.documentElement.style.setProperty('--bg-surface', colors.surface);
      document.documentElement.style.setProperty('--bg-elevated', colors.elevated);
      document.documentElement.style.setProperty('--bg-border', colors.border);

      // 3. Glassmorphism blur slider
      document.documentElement.style.setProperty('--backdrop-blur', `${cfg.glassIntensity}px`);
    } catch (e) {
      console.error("Style property injection failure:", e);
    }
  };

  // ── 5. EXPORTED MUTATION METHODS ──
  const updateProfile = (data) => {
    setUser((prev) => {
      const next = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
      return next;
    });
  };

  const updateAppearance = (data) => {
    setAppearance((prev) => {
      const next = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEYS.appearance, JSON.stringify(next));
      applyCSSVariables(next);
      return next;
    });
  };

  const completeOnboarding = (data) => {
    setUser((prev) => {
      const next = { ...prev, ...data, completed: true };
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
      // Keep old key synced for backwards-compatibility safety
      localStorage.setItem("fintech_onboarding", JSON.stringify(next));
      return next;
    });
  };

  const resetUser = () => {
    setUser(DEFAULT_PROFILE);
    setAppearance(DEFAULT_APPEARANCE);
    localStorage.removeItem(STORAGE_KEYS.profile);
    localStorage.removeItem(STORAGE_KEYS.appearance);
    localStorage.removeItem("fintech_onboarding");
    applyCSSVariables(DEFAULT_APPEARANCE);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        appearance,
        telemetry,
        loading,
        updateProfile,
        updateAppearance,
        completeOnboarding,
        resetUser,
      }}
    >
      {!loading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
