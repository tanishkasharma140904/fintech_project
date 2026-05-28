import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const GENERATION_STEPS = [
  { label: "Mapping financial identity", icon: "👤", duration: 800 },
  { label: "Analyzing risk appetite", icon: "⚡", duration: 700 },
  { label: "Building spending profile", icon: "📊", duration: 900 },
  { label: "Configuring investment models", icon: "🎯", duration: 600 },
  { label: "Generating personalized insights", icon: "🧠", duration: 800 },
  { label: "Initializing your dashboard", icon: "✨", duration: 500 },
];

const ANIM_CSS = `
@keyframes genFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes genPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes genSpin {
  to { transform: rotate(360deg); }
}
@keyframes genProgress {
  from { width: 0%; }
  to { width: 100%; }
}
@keyframes orbFloat {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-12px) scale(1.05); }
}
`;

export default function DashboardGeneration() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "there";

  // Progress through generation steps
  useEffect(() => {
    if (currentStep >= GENERATION_STEPS.length) {
      setCompleted(true);
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, GENERATION_STEPS[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, navigate]);

  const progressPercent = Math.min(
    ((currentStep) / GENERATION_STEPS.length) * 100,
    100
  );

  // Determine financial personality archetype
  const getPersonality = () => {
    const risk = user?.riskAppetite;
    if (risk === "conservative" || risk === "low") return "Capital Shield Guardian";
    if (risk === "aggressive" || risk === "high") return "Growth-Focused Investor";
    return "Balanced Portfolio Architect";
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center text-white relative overflow-hidden"
      style={{
        background: "var(--bg-base, #0a0d14)",
      }}
    >
      <style>{ANIM_CSS}</style>

      {/* Ambient glow effects */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--accent-primary, #00d4aa)",
          opacity: 0.04,
          filter: "blur(120px)",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          bottom: "10%",
          right: "20%",
          background: "#4d9fff",
          opacity: 0.03,
          filter: "blur(100px)",
        }}
      />

      {/* Main content */}
      <div
        className="relative z-10 flex flex-col items-center max-w-lg w-full px-6 text-center"
        style={{ animation: "genFadeIn 0.6s ease-out" }}
      >
        {/* Artho Logo */}
        <div className="mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative"
            style={{
              background: "var(--accent-primary, #00d4aa)",
              boxShadow: "0 0 30px rgba(0, 212, 170, 0.3)",
              animation: "orbFloat 3s ease-in-out infinite",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Artho</h1>
        </div>

        {/* Greeting */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: "var(--text-primary, #e8edf5)" }}
        >
          {completed ? `Welcome aboard, ${firstName}! 🎉` : `Building your dashboard, ${firstName}...`}
        </h2>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--text-muted, #4a5a72)" }}
        >
          {completed
            ? "Your personalized financial intelligence ecosystem is ready."
            : "Artho is analyzing your financial profile to create a personalized experience."}
        </p>

        {/* Central spinner / completion icon */}
        <div className="relative w-20 h-20 mb-8">
          {!completed ? (
            <>
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: "3px solid rgba(255,255,255,0.05)" }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "3px solid transparent",
                  borderTopColor: "var(--accent-primary, #00d4aa)",
                  borderRightColor: "var(--accent-primary, #00d4aa)",
                  animation: "genSpin 1s linear infinite",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">
                  {currentStep < GENERATION_STEPS.length
                    ? GENERATION_STEPS[currentStep].icon
                    : "✨"}
                </span>
              </div>
            </>
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0, 212, 170, 0.1)",
                border: "2px solid var(--accent-primary, #00d4aa)",
                boxShadow: "0 0 30px rgba(0, 212, 170, 0.25)",
                animation: "genFadeIn 0.4s ease-out",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-primary, #00d4aa)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mb-6">
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, var(--accent-primary, #00d4aa), #4d9fff)",
                boxShadow: "0 0 8px var(--accent-primary, #00d4aa)",
              }}
            />
          </div>
          <p
            className="text-xs font-mono mt-2"
            style={{
              color: "var(--text-muted, #4a5a72)",
              animation: "genPulse 2s ease-in-out infinite",
            }}
          >
            {completed
              ? "100% — Dashboard ready"
              : `${Math.round(progressPercent)}% — ${
                  currentStep < GENERATION_STEPS.length
                    ? GENERATION_STEPS[currentStep].label
                    : "Finalizing..."
                }`}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-3 mb-8">
          {GENERATION_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1"
              style={{ opacity: i <= currentStep ? 1 : 0.3 }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-300"
                style={{
                  background:
                    i < currentStep
                      ? "rgba(0, 212, 170, 0.15)"
                      : i === currentStep
                      ? "rgba(0, 212, 170, 0.1)"
                      : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    i < currentStep
                      ? "rgba(0, 212, 170, 0.3)"
                      : i === currentStep
                      ? "rgba(0, 212, 170, 0.2)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                }}
              >
                {i < currentStep ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-primary, #00d4aa)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-xs">{step.icon}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Financial personality preview */}
        <div
          className="w-full max-w-sm rounded-xl p-4 border"
          style={{
            background: "rgba(17, 24, 39, 0.6)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary, #00d4aa), #4d9fff)",
                color: "#fff",
              }}
            >
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "AR"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                {user?.fullName || "User"}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {user?.occupation || "Financial Professional"} • {user?.cityCountry || "India"}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(0, 212, 170, 0.06)",
              border: "1px solid rgba(0, 212, 170, 0.12)",
            }}
          >
            <span className="text-sm">🧠</span>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--accent-primary, #00d4aa)" }}
              >
                Financial Archetype
              </p>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {getPersonality()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
