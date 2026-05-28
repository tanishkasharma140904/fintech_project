import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isDemoMode } = useAuth();
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // Interactive UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Remember email pre-population
  useEffect(() => {
    const savedEmail = localStorage.getItem("artho_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
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
      await login(email, password);
      
      // Save or clear remembered email
      if (rememberMe) {
        localStorage.setItem("artho_remember_email", email.trim());
      } else {
        localStorage.removeItem("artho_remember_email");
      }
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (
        err.code === "auth/invalid-credential" || 
        err.message === "auth/invalid-credential" || 
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("This account has been temporarily locked due to too many failed login attempts. Please reset password or try again later.");
      } else {
        setError(err.message || "Failed to log in. Please try again.");
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

        {/* Login Card */}
        <div className="border border-[rgba(255,255,255,0.06)] bg-[rgba(17,24,39,0.5)] backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative">
          
          {isDemoMode && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-3 py-1 rounded-full font-mono flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Developer Sandbox Active (Firebase Offline)
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold font-outfit text-white">Welcome Back</h2>
            <p className="text-xs text-gray-400 mt-1">Provide secure credentials to enter dashboard</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-start gap-2.5 animate-shake">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
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

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--accent-primary,#00d4aa)] hover:underline">
                  Forgot Password?
                </Link>
              </div>
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

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 bg-[rgba(10,13,20,0.8)] border border-[rgba(255,255,255,0.15)] rounded text-[var(--accent-primary,#00d4aa)] focus:ring-[var(--accent-primary,#00d4aa)] focus:ring-offset-[#0a0d14] cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-gray-400 cursor-pointer select-none">
                Remember my email
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
                  <span>Verifying Session...</span>
                </div>
              ) : (
                <span>Unlock Secure Dashboard</span>
              )}
            </button>
          </form>

          {/* Signup Redirection */}
          <div className="mt-8 text-center border-t border-[rgba(255,255,255,0.06)] pt-6">
            <p className="text-xs text-gray-500">
              New to the platform?{" "}
              <Link to="/signup" className="text-[var(--accent-primary,#00d4aa)] font-semibold hover:underline">
                Register Credentials
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
