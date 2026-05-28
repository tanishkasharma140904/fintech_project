/**
 * UserContext — the master global source of truth for user SaaS personalization.
 * Synchronized reactively with Cloud Firestore database or local mock DB under active Auth sessions.
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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { useAnalytics } from "./AnalyticsContext";

const UserContext = createContext(null);

const DEFAULT_PROFILE = {
  fullName: "Guest User",
  age: 28,
  occupation: "Senior Portfolio Analyst",
  cityCountry: "New Delhi, India",
  monthlyIncome: 150000, // kept for backwards-compatibility
  manualIncome: 150000,
  detectedIncome: null,
  effectiveIncome: 150000,
  incomeSource: "manual",
  incomeMismatchDetected: false,
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
  const { currentUser, isDemoMode, loading: authLoading } = useAuth();
  const { analytics } = useAnalytics();

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

  // ── 2. REACTIVE DB SYNCHRONIZATION ──
  useEffect(() => {
    // CRITICAL: If auth is still loading, keep UserContext loading too.
    // This prevents OnboardingGuard from seeing stale completed=false.
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!currentUser) {
      // Auth finished loading and user is genuinely logged out
      setUser(DEFAULT_PROFILE);
      setAppearance(DEFAULT_APPEARANCE);
      applyCSSVariables(DEFAULT_APPEARANCE);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        if (isDemoMode) {
          const storedData = localStorage.getItem(`artho_mock_db_${currentUser.uid}`);
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.profile) setUser(parsed.profile);
            if (parsed.appearance) {
              setAppearance(parsed.appearance);
              applyCSSVariables(parsed.appearance);
            }
          } else {
            // Seed mock database if not exists
            const initProfile = { 
              ...DEFAULT_PROFILE, 
              fullName: currentUser.fullName || "Aryan Kumar", 
              email: currentUser.email 
            };
            localStorage.setItem(`artho_mock_db_${currentUser.uid}`, JSON.stringify({
              profile: initProfile,
              appearance: DEFAULT_APPEARANCE
            }));
            setUser(initProfile);
            setAppearance(DEFAULT_APPEARANCE);
            applyCSSVariables(DEFAULT_APPEARANCE);
          }
        } else {
          // Real Cloud Firestore Database Fetch
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profile) setUser(data.profile);
            if (data.appearance) {
              setAppearance(data.appearance);
              applyCSSVariables(data.appearance);
            }
          } else {
            // Seed Cloud document on first login if Auth exists but Firestore doc is blank
            const initProfile = { 
              ...DEFAULT_PROFILE, 
              fullName: currentUser.displayName || "Aryan Kumar", 
              email: currentUser.email 
            };
            await setDoc(docRef, {
              profile: initProfile,
              appearance: DEFAULT_APPEARANCE,
              createdAt: new Date().toISOString()
            });
            setUser(initProfile);
            setAppearance(DEFAULT_APPEARANCE);
            applyCSSVariables(DEFAULT_APPEARANCE);
          }
        }
      } catch (err) {
        console.error("Error fetching user data from DB:", err);
        // Robust offline fallback
        setUser(DEFAULT_PROFILE);
        setAppearance(DEFAULT_APPEARANCE);
        applyCSSVariables(DEFAULT_APPEARANCE);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, isDemoMode, authLoading]);

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
    if (!currentUser) return;

    setUser((prev) => {
      const next = { ...prev, ...data };
      
      const saveToDb = async () => {
        try {
          if (isDemoMode) {
            const stored = localStorage.getItem(`artho_mock_db_${currentUser.uid}`);
            const parsed = stored ? JSON.parse(stored) : {};
            parsed.profile = next;
            localStorage.setItem(`artho_mock_db_${currentUser.uid}`, JSON.stringify(parsed));
          } else {
            const docRef = doc(db, "users", currentUser.uid);
            await setDoc(docRef, { profile: next }, { merge: true });
          }
        } catch (e) {
          console.error("Failed to update profile in DB:", e);
        }
      };
      saveToDb();

      return next;
    });
  };

  const updateAppearance = (data) => {
    if (!currentUser) return;

    setAppearance((prev) => {
      const next = { ...prev, ...data };
      applyCSSVariables(next);

      const saveToDb = async () => {
        try {
          if (isDemoMode) {
            const stored = localStorage.getItem(`artho_mock_db_${currentUser.uid}`);
            const parsed = stored ? JSON.parse(stored) : {};
            parsed.appearance = next;
            localStorage.setItem(`artho_mock_db_${currentUser.uid}`, JSON.stringify(parsed));
          } else {
            const docRef = doc(db, "users", currentUser.uid);
            await setDoc(docRef, { appearance: next }, { merge: true });
          }
        } catch (e) {
          console.error("Failed to update appearance in DB:", e);
        }
      };
      saveToDb();

      return next;
    });
  };

  const completeOnboarding = (data) => {
    if (!currentUser) return;

    setUser((prev) => {
      const next = { ...prev, ...data, completed: true };

      const saveToDb = async () => {
        try {
          if (isDemoMode) {
            const stored = localStorage.getItem(`artho_mock_db_${currentUser.uid}`);
            const parsed = stored ? JSON.parse(stored) : {};
            parsed.profile = next;
            localStorage.setItem(`artho_mock_db_${currentUser.uid}`, JSON.stringify(parsed));
          } else {
            const docRef = doc(db, "users", currentUser.uid);
            await setDoc(docRef, { profile: next }, { merge: true });
          }
        } catch (e) {
          console.error("Failed to complete onboarding in DB:", e);
        }
      };
      saveToDb();

      return next;
    });
  };

  const resolveIncomeMismatch = (preference) => {
    if (!currentUser) return;

    if (preference === "manual") {
      updateProfile({
        effectiveIncome: user.manualIncome,
        monthlyIncome: user.manualIncome, // compatibility mirror
        incomeSource: "manual",
        incomeMismatchDetected: false
      });
    } else if (preference === "detected") {
      updateProfile({
        effectiveIncome: user.detectedIncome,
        monthlyIncome: user.detectedIncome, // compatibility mirror
        incomeSource: "detected",
        incomeMismatchDetected: false
      });
    } else if (preference === "remind") {
      // Temporarily clear mismatch flag for this runtime session without updating database
      updateProfile({
        incomeMismatchDetected: false
      });
    }
  };

  // Dynamic Income Estimation & Mismatch Detection Logic
  useEffect(() => {
    if (!currentUser || !analytics?.summary) return;

    const summary = analytics.summary;
    const months = Math.max(1, analytics.by_month?.length || 1);
    const detected = summary.total_income > 0 ? Math.round(summary.total_income / months) : 0;

    if (detected === 0) return;

    // Check if detected income has changed compared to user's currently stored detectedIncome
    if (detected !== user.detectedIncome) {
      const manual = user.manualIncome;
      let nextEffective = user.effectiveIncome;
      let nextSource = user.incomeSource;
      let mismatch = false;

      if (manual === null || manual === undefined) {
        // CASE A: manualIncome is null/empty
        nextEffective = detected;
        nextSource = "detected";
        mismatch = false;
      } else {
        // Both manualIncome and detectedIncome exist
        const diffPercent = Math.abs(detected - manual) / manual;
        if (diffPercent <= 0.20) {
          // CASE B: Difference is small (<= 20%)
          nextEffective = manual;
          nextSource = "manual";
          mismatch = false;
        } else {
          // CASE C: Mismatch exceeds threshold (> 20%)
          mismatch = true;
          // Keep effectiveIncome and source unchanged for now, let user decide
        }
      }

      // Update the user profile with estimated values
      updateProfile({
        detectedIncome: detected,
        effectiveIncome: nextEffective,
        monthlyIncome: nextEffective, // compatibility mirror
        incomeSource: nextSource,
        incomeMismatchDetected: mismatch
      });
    }
  }, [analytics, currentUser, user.detectedIncome, user.manualIncome, user.effectiveIncome, user.incomeSource]);

  const resetUser = () => {
    setUser(DEFAULT_PROFILE);
    setAppearance(DEFAULT_APPEARANCE);
    applyCSSVariables(DEFAULT_APPEARANCE);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        appearance,
        telemetry,
        loading: loading,
        isOnboarded: !!user?.completed,
        updateProfile,
        updateAppearance,
        completeOnboarding,
        resetUser,
        resolveIncomeMismatch,
      }}
    >
      {children}
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
