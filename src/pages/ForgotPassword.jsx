import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { resetPassword, isDemoMode } = useAuth();
  
  // Form State
  const [email, setEmail] = useState("");
  
  // Interactive UI State
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setMessage("A password reset link has been dispatched to your inbox. Please check your spam folder if it doesn't arrive shortly.");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found" || err.message === "auth/user-not-found") {
        setError("No account was found matching this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else {
        setError(err.message || "Failed to trigger password reset. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0d14] text-white p-4 relative overflow-hidden">
      {/* Background gradients and glows */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-[var(--accent-primary,#00d4aa)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-blue-500 opacity-[0.02] rounded-full blur-[120px] pointer-events-none" />
      
      {/* Container */}
      <div className="relative w-full max-w-md z-10">
        {/* Logo and Brand Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary,#00d4aa)] flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-outfit text-white">Artho</h1>
          <p className="text-xs text-gray-400 mt-1">Premium AI-Powered Financial Identity</p>
        </div>

        {/* Card */}
        <div className="border border-[rgba(255,255,255,0.06)] bg-[rgba(17,24,39,0.5)] backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative">
          
          {isDemoMode && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-3 py-1 rounded-full font-mono flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Developer Sandbox Active (Firebase Offline)
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold font-outfit text-white">Reset Password</h2>
            <p className="text-xs text-gray-400 mt-1">Enter your registered email to request recovery link</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,13,20,0.6)] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent-primary,#00d4aa)] focus:ring-1 focus:ring-[var(--accent-primary,#00d4aa)] transition-all"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide overflow-hidden transition-all duration-300 group flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary,#00d4aa), #0077ff)",
                boxShadow: "0 4px 20px rgba(0, 212, 170, 0.25)"
              }}
            >
              {/* Button shimmer hover effect */}
              <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Dispatching Reset Email...</span>
                </div>
              ) : (
                <span>Dispatch Recovery Link</span>
              )}
            </button>
          </form>

          {/* Redirection */}
          <div className="mt-8 text-center border-t border-[rgba(255,255,255,0.06)] pt-6">
            <p className="text-xs text-gray-500">
              Remember your password?{" "}
              <Link to="/login" className="text-[var(--accent-primary,#00d4aa)] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
