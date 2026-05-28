import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading, isDemoMode } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0d14] text-white z-50 overflow-hidden">
        {/* Glowing backdrop ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent-primary,#00d4aa)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
        
        {/* Centered Glass Card */}
        <div className="relative flex flex-col items-center p-10 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(17,24,39,0.7)] backdrop-blur-xl shadow-2xl max-w-sm w-full mx-4 text-center">
          {/* Pulsing Brand Logo */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-[var(--accent-primary,#00d4aa)] opacity-20 blur-md animate-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-[var(--accent-primary,#00d4aa)] bg-[#0d1527] flex items-center justify-center">
              <span className="text-xl font-bold tracking-wider text-[var(--accent-primary,#00d4aa)] font-outfit">A</span>
            </div>
          </div>
          
          <h2 className="text-xl font-bold font-outfit tracking-wide mb-1 text-white">Artho</h2>
          <p className="text-xs text-[var(--accent-primary,#00d4aa)] font-mono tracking-widest uppercase mb-4 animate-pulse">
            {isDemoMode ? "Initializing Sandbox..." : "Securing Session..."}
          </p>
          
          {/* Glassmorphic Infinite Spinner */}
          <div className="relative w-12 h-12 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.05)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent-primary,#00d4aa)] border-r-[var(--accent-primary,#00d4aa)] animate-spin" />
          </div>

          <div className="text-[10px] text-gray-500 font-mono">
            {isDemoMode ? (
              <span className="text-amber-500/80">Offline Sandbox Active</span>
            ) : (
              <span>Connecting to secure cloud nodes...</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
