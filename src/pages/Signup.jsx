import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isDemoMode } = useAuth();
  const { addNotification } = useNotifications();
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Interactive UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form validation
  const validateForm = () => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!acceptTerms) return "You must agree to the Terms of Service.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName);
      addNotification({
        title: "Welcome to Artho!",
        description: `Your premium SaaS profile has been successfully created. Welcome aboard, ${fullName || "User"}!`,
        category: "Account",
        priority: "high",
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use" || err.message === "auth/email-already-in-use") {
        setError("This email address is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/weak-password") {
        setError("The password is too weak. Please use a stronger password.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
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
      <div className="relative w-full max-w-lg z-10">
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

        {/* Signup Card */}
        <div className="border border-[rgba(255,255,255,0.06)] bg-[rgba(17,24,39,0.5)] backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative">
          
          {isDemoMode && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-3 py-1 rounded-full font-mono flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Developer Sandbox Active (Firebase Offline)
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold font-outfit text-white">Create Account</h2>
            <p className="text-xs text-gray-400 mt-1">Sign up for full access to the wealth suite</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Aryan Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,13,20,0.6)] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent-primary,#00d4aa)] focus:ring-1 focus:ring-[var(--accent-primary,#00d4aa)] transition-all"
                required
              />
            </div>

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

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,13,20,0.6)] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent-primary,#00d4aa)] focus:ring-1 focus:ring-[var(--accent-primary,#00d4aa)] transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,13,20,0.6)] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent-primary,#00d4aa)] focus:ring-1 focus:ring-[var(--accent-primary,#00d4aa)] transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start pt-1.5">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 bg-[rgba(10,13,20,0.8)] border border-[rgba(255,255,255,0.15)] rounded text-[var(--accent-primary,#00d4aa)] focus:ring-[var(--accent-primary,#00d4aa)] focus:ring-offset-[#0a0d14] cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="ml-2 text-xs text-gray-400 cursor-pointer select-none">
                I agree to the{" "}
                <a href="#terms-link" className="text-[var(--accent-primary,#00d4aa)] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy-link" className="text-[var(--accent-primary,#00d4aa)] hover:underline">
                  Privacy Policy
                </a>.
              </label>
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
                  <span>Securing Credentials...</span>
                </div>
              ) : (
                <span>Register Platform Access</span>
              )}
            </button>
          </form>

          {/* Login Redirection */}
          <div className="mt-8 text-center border-t border-[rgba(255,255,255,0.06)] pt-6">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
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
