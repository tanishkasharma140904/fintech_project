import { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

// Detect if real Firebase config is provided (not placeholder)
export const isFirebaseConfigured = (() => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return (
    apiKey && 
    apiKey !== "your-api-key-here" && 
    !apiKey.startsWith("AIzaSyA1B2C3D")
  );
})();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isFirebaseConfigured);

  // ── MOCK FIREBASE FOR DEMO MODE ──
  const mockUsersKey = "artho_mock_auth_users";
  const mockSessionKey = "artho_mock_auth_session";

  const getMockUsers = () => {
    try {
      const data = localStorage.getItem(mockUsersKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const saveMockUser = (uid, userData) => {
    try {
      const users = getMockUsers();
      users[uid] = userData;
      localStorage.setItem(mockUsersKey, JSON.stringify(users));
    } catch (e) {
      console.error("Mock save user error:", e);
    }
  };

  // ── AUTH OPERATIONS ──

  const signup = async (email, password, fullName) => {
    if (isDemoMode) {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 800));
      
      const users = getMockUsers();
      if (users[email.toLowerCase()]) {
        throw new Error("auth/email-already-in-use");
      }

      const mockUid = "mock_uid_" + Math.random().toString(36).substr(2, 9);
      const newUser = {
        uid: mockUid,
        email: email.toLowerCase(),
        fullName,
        createdAt: new Date().toISOString()
      };

      // Register user
      users[email.toLowerCase()] = { ...newUser, password }; // simple credentials store
      localStorage.setItem(mockUsersKey, JSON.stringify(users));

      // Create mock Firestore document seed
      const defaultProfile = {
        fullName,
        email: email.toLowerCase(),
        age: 28,
        occupation: "Senior Portfolio Analyst",
        cityCountry: "New Delhi, India",
        monthlyIncome: 150000,
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
        completed: false,
      };
      
      const defaultAppearance = {
        theme: "dark",
        accent: "#00d4aa",
        compactMode: false,
        glassIntensity: 12,
        reducedMotion: false,
      };

      localStorage.setItem(`artho_mock_db_${mockUid}`, JSON.stringify({
        profile: defaultProfile,
        appearance: defaultAppearance
      }));

      // Set session
      localStorage.setItem(mockSessionKey, JSON.stringify(newUser));
      setCurrentUser(newUser);
      return newUser;
    } else {
      // Real Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Seed baseline profile in Cloud Firestore
      const defaultProfile = {
        fullName,
        email: email.toLowerCase(),
        age: 28,
        occupation: "Senior Portfolio Analyst",
        cityCountry: "New Delhi, India",
        monthlyIncome: 150000,
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
        completed: false,
      };
      
      const defaultAppearance = {
        theme: "dark",
        accent: "#00d4aa",
        compactMode: false,
        glassIntensity: 12,
        reducedMotion: false,
      };

      await setDoc(doc(db, "users", user.uid), {
        profile: defaultProfile,
        appearance: defaultAppearance,
        createdAt: new Date().toISOString()
      });

      return user;
    }
  };

  const login = async (email, password) => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 800));
      const users = getMockUsers();
      const userRecord = users[email.toLowerCase()];

      if (!userRecord || userRecord.password !== password) {
        throw new Error("auth/invalid-credential");
      }

      const activeUser = {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName: userRecord.fullName
      };

      localStorage.setItem(mockSessionKey, JSON.stringify(activeUser));
      setCurrentUser(activeUser);
      return activeUser;
    } else {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 300));
      localStorage.removeItem(mockSessionKey);
      setCurrentUser(null);
    } else {
      await signOut(auth);
    }
  };

  const resetPassword = async (email) => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 600));
      const users = getMockUsers();
      if (!users[email.toLowerCase()]) {
        throw new Error("auth/user-not-found");
      }
      return true;
    } else {
      await sendPasswordResetEmail(auth, email);
    }
  };

  // ── PERSISTENT SESSION OBSERVER ──
  useEffect(() => {
    if (isDemoMode) {
      const session = localStorage.getItem(mockSessionKey);
      if (session) {
        try {
          setCurrentUser(JSON.parse(session));
        } catch {
          localStorage.removeItem(mockSessionKey);
        }
      }
      setLoading(false);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      }, (error) => {
        console.error("Firebase auth state change error:", error);
        // Gracefully switch to Demo Mode if Firebase auth fails to load
        setIsDemoMode(true);
        const session = localStorage.getItem(mockSessionKey);
        if (session) {
          try {
            setCurrentUser(JSON.parse(session));
          } catch {
            localStorage.removeItem(mockSessionKey);
          }
        }
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [isDemoMode]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isDemoMode,
        signup,
        login,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
