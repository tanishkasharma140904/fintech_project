import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "Expense Analytics",
    desc: "AI-categorized spending insights and trend analysis across all your accounts.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    color: "#10d078",
  },
  {
    title: "Investment Estimator",
    desc: "Future purchase affordability calculator with compound growth projections.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="12" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="12" y2="18" />
      </svg>
    ),
    color: "#4d9fff",
  },
  {
    title: "Debt Management",
    desc: "Smart debt payoff strategies, stress analysis, and elimination planning.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "#ff4d6a",
  },
  {
    title: "Portfolio Intelligence",
    desc: "Unified wealth overview with asset allocation and performance tracking.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    color: "#c084fc",
  },
  {
    title: "Financial Health",
    desc: "Real-time health scoring and behavioral analytics for smarter decisions.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    color: "#f5a623",
  },
  {
    title: "Smart AI Insights",
    desc: "Intelligent recommendations powered by deep financial data analysis.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    color: "#00d4aa",
  },
];

const TESTIMONIALS = [
  { name: "Parimal", role: "Product Manager", quote: "Artho completely transformed how I manage my monthly spending. The AI insights are genuinely actionable.", initials: "PK" },
  { name: "Harsha", role: "Software Engineer", quote: "The investment estimator alone saved me from 3 bad financial decisions this year.", initials: "HN" },
  { name: "Madhavi", role: "Chartered Accountant", quote: "Finally a platform that understands Indian financial behavior and regulatory context.", initials: "MS" },
  { name: "Sohil", role: "Entrepreneur", quote: "The debt management tool helped me create a structured payoff plan in minutes.", initials: "SA" },
];

const PARTNERS = ["HDFC Securities", "Zerodha", "Groww", "CRED", "INDmoney"];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full text-white" style={{ background: "var(--bg-base, #0a0d14)" }}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
        style={{
          background: "rgba(10, 13, 20, 0.8)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-primary, #00d4aa)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wide">Artho</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#why-artho" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Why Artho</a>
          <a href="#testimonials" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Testimonials</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-xs font-semibold text-gray-300 hover:text-white transition-colors px-3 py-2">
            Login
          </Link>
          <Link
            to="/signup"
            className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary, #00d4aa), #00b894)",
              color: "#0a0d14",
              boxShadow: "0 2px 12px rgba(0, 212, 170, 0.25)",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "var(--accent-primary, #00d4aa)", opacity: 0.04, filter: "blur(120px)" }} />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "#4d9fff", opacity: 0.03, filter: "blur(100px)" }} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-6" style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", color: "var(--accent-primary, #00d4aa)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary,#00d4aa)] animate-pulse" />
              AI-Powered Financial Intelligence
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6" style={{ color: "var(--text-primary, #e8edf5)" }}>
              Let's make finances{" "}
              <br />
              <span className="gradient-text">Go Better With Artho +</span>
            </h1>

            <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
              Artho combines AI-powered analytics, investment planning, debt management, and portfolio intelligence into one unified financial ecosystem. Built for modern Indians who demand more from their money.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                to="/signup"
                className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-xl group flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, var(--accent-primary, #00d4aa), #00b894)",
                  color: "#0a0d14",
                  boxShadow: "0 4px 20px rgba(0, 212, 170, 0.3)",
                }}
              >
                Get Started Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <button className="px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 hover:border-gray-500" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary, #8b9ab5)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-primary, #00d4aa)" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-8">
              {[
                { value: "10K+", label: "Active Users" },
                { value: "₹25Cr+", label: "Assets Tracked" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-bold font-mono" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted, #4a5a72)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl pointer-events-none" style={{ background: "var(--accent-primary, #00d4aa)", opacity: 0.05, filter: "blur(60px)" }} />
            <div className="relative rounded-2xl p-6 border" style={{ background: "rgba(17,24,39,0.7)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              {/* Mock navbar */}
              <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[var(--accent-primary,#00d4aa)] opacity-80" />
                  <div className="w-16 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
                </div>
                <div className="flex gap-2">
                  <div className="w-20 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="w-6 h-6 rounded-full" style={{ background: "linear-gradient(135deg, var(--accent-primary, #00d4aa), #4d9fff)" }} />
                </div>
              </div>

              {/* Mock stat cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Balance", value: "₹2,54,890", color: "#00d4aa" },
                  { label: "Savings", value: "₹42,300", color: "#10d078" },
                  { label: "Invested", value: "₹1,85,000", color: "#4d9fff" },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[8px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{card.label}</p>
                    <p className="text-xs font-bold font-mono" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Mock chart bars */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Monthly Spending</p>
                  <div className="w-12 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="flex items-end gap-2 h-20">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${h}%`, background: i === 6 ? "var(--accent-primary, #00d4aa)" : "rgba(0, 212, 170, 0.15)" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-6" style={{ color: "var(--text-muted, #4a5a72)" }}>Trusted by Leading Institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {PARTNERS.map((p) => (
              <span key={p} className="text-sm font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.15)" }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section id="features" className="landing-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary, #00d4aa)" }}>Platform Features</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              Everything you need to master your finances
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
              Six powerful modules working together as one unified financial intelligence platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="glow-card group cursor-default">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: `${f.color}15`, border: `1px solid ${f.color}25`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary, #8b9ab5)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DASHBOARD PREVIEW ═══════════ */}
      <section className="landing-section" style={{ background: "rgba(17,24,39,0.3)" }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary, #00d4aa)" }}>Real-Time Dashboard</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Deposit your data, <br />earn intelligence +
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
              Upload your bank statements and watch Artho transform raw transaction data into actionable financial intelligence in seconds.
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--accent-primary, #00d4aa)" }}>15%</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Avg. Savings Increase</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#4d9fff" }}>35%</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Better Decisions</p>
              </div>
            </div>
          </div>

          {/* Right: Mock balance card */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{ background: "#4d9fff", opacity: 0.04, filter: "blur(80px)" }} />
            <div className="relative rounded-2xl p-6 border" style={{ background: "rgba(17,24,39,0.8)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, #f5a623, #ff4d6a)" }}>₹</div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Total Portfolio Value</p>
                  <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>₹6,54,890.10</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg p-3" style={{ background: "rgba(16,208,120,0.06)", border: "1px solid rgba(16,208,120,0.12)" }}>
                  <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Savings</p>
                  <p className="text-sm font-bold font-mono" style={{ color: "#10d078" }}>₹1,42,300</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "rgba(77,159,255,0.06)", border: "1px solid rgba(77,159,255,0.12)" }}>
                  <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Invested</p>
                  <p className="text-sm font-bold font-mono" style={{ color: "#4d9fff" }}>₹3,85,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY ARTHO ═══════════ */}
      <section id="why-artho" className="landing-section">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary, #00d4aa)" }}>Why Artho</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Make your finances <br />work harder for you
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
              Artho has been designed for modern Indian professionals who want a holistic view of their financial health. Our AI-driven analytics engine processes your data locally and provides real-time actionable recommendations.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "🔒", title: "Secure & Insured", desc: "Your data is encrypted with bank-grade AES-256 encryption. Zero third-party access." },
              { icon: "💎", title: "Zero Hidden Fees", desc: "Transparent pricing with no lock-in. Free tier available for individual users." },
              { icon: "✅", title: "Licensed & Regulated", desc: "Compliant with RBI data guidelines and Indian financial regulatory standards." },
            ].map((item) => (
              <div key={item.title} className="glow-card flex gap-4 items-start">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary, #8b9ab5)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonials" className="landing-section" style={{ background: "rgba(17,24,39,0.3)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary, #00d4aa)" }}>Testimonials</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>What they say about us</h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
              Hear from professionals who transformed their financial management with Artho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, var(--accent-primary, #00d4aa), #4d9fff)", color: "#fff" }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#f5a623" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-xs leading-relaxed italic" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
                  "{t.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="landing-section">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute -inset-4 rounded-3xl pointer-events-none" style={{ background: "var(--accent-primary, #00d4aa)", opacity: 0.04, filter: "blur(80px)" }} />
          <div className="relative rounded-2xl p-10 text-center border" style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(77,159,255,0.04) 100%)", borderColor: "rgba(0,212,170,0.1)" }}>
            <h2 className="text-2xl lg:text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              Let's start your financial <br />intelligence journey +
            </h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--text-secondary, #8b9ab5)" }}>
              Create a free account today and experience AI-powered financial management designed for modern India.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary, #00d4aa), #00b894)",
                color: "#0a0d14",
                boxShadow: "0 4px 20px rgba(0, 212, 170, 0.3)",
              }}
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="px-6 py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-primary, #00d4aa)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-bold">Artho</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Your complete financial intelligence platform for modern India.
              </p>
            </div>

            {/* Company */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Company</p>
              <div className="space-y-2">
                {["About", "Careers", "Contact"].map(l => (
                  <p key={l} className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: "var(--text-secondary, #8b9ab5)" }}>{l}</p>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Resources</p>
              <div className="space-y-2">
                {["Blog", "Documentation", "API"].map(l => (
                  <p key={l} className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: "var(--text-secondary, #8b9ab5)" }}>{l}</p>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Legal</p>
              <div className="space-y-2">
                {["Privacy", "Terms", "Security"].map(l => (
                  <p key={l} className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: "var(--text-secondary, #8b9ab5)" }}>{l}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>© 2025 Artho. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
