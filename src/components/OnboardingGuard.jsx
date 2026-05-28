import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

/**
 * OnboardingGuard — Route-level guard enforcing mandatory onboarding.
 * 
 * If user.completed is false → redirects to /onboarding
 * If user.completed is true → renders children normally
 */
export default function OnboardingGuard({ children }) {
  const { user, loading } = useUser();

  // Wait for user data to load from Firestore/mock DB
  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0d14] text-white z-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent-primary,#00d4aa)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
        <div className="relative flex flex-col items-center p-10 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(17,24,39,0.7)] backdrop-blur-xl shadow-2xl">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.05)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent-primary,#00d4aa)] border-r-[var(--accent-primary,#00d4aa)] animate-spin" />
          </div>
          <p className="text-xs text-gray-400 font-mono animate-pulse">Loading financial identity...</p>
        </div>
      </div>
    );
  }

  // User hasn't completed onboarding → redirect
  if (!user?.completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // User is onboarded → allow access
  return children;
}
