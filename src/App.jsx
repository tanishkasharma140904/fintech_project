import "./main.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { UserProvider, useUser } from "./context/UserContext";
import { NotificationProvider } from "./context/NotificationContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import InvestmentEstimator from "./pages/InvestmentEstimator";
import DebtManagement from "./pages/DebtManagement";
import PortfolioOverview from "./pages/PortfolioOverview";
import TransactionsExplorer from "./pages/TransactionsExplorer";
import AnalyticsPage from "./pages/AnalyticsPage";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import SearchOverlay from "./components/SearchOverlay";
import NotificationToasts from "./components/NotificationToasts";
import { getRouteMetadata } from "./utils/navigationConfig";

/**
 * RouteObserver Component
 * Observes location changes to:
 * 1. Animate a premium top progress loading bar.
 * 2. Dynamically set the browser document <title> to Artho.
 */
function RouteObserver() {
  const location = useLocation();
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Start top progress loader
    setProgressWidth(30);
    const t1 = setTimeout(() => setProgressWidth(70), 80);
    const t2 = setTimeout(() => setProgressWidth(90), 200);
    const t3 = setTimeout(() => {
      setProgressWidth(100);
      setTimeout(() => setProgressWidth(0), 120);
    }, 350);

    // Update document title reactively from navigation metadata to Artho Pro
    const metadata = getRouteMetadata(location.pathname);
    if (metadata) {
      document.title = `${metadata.title} | Artho Pro`;
    } else {
      document.title = "Artho Pro | Premium Fintech SaaS";
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  if (progressWidth === 0) return null;
  return <div id="route-progress-bar" style={{ width: `${progressWidth}%` }} />;
}

/**
 * LayoutWrapper Component
 * Wraps routes inside the common Sidebar + Navbar dashboard layout.
 */
function LayoutWrapper({ children }) {
  const { appearance } = useUser();
  const location = useLocation();
  
  return (
    <div className={`flex h-screen overflow-hidden ${appearance?.compactMode ? "compact-layout" : ""}`}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        {/* Render actual route viewport with dynamic fade animations */}
        <div key={location.pathname} className="flex-1 flex flex-col overflow-hidden page-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // Globally register Cmd+K or Ctrl+K key handlers to toggle Search overlay
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    
    const handleOpenSearch = () => setSearchOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
    };
  }, []);

  return (
    <BrowserRouter>
      <AnalyticsProvider>
        <UserProvider>
          <NotificationProvider>
            <OnboardingProvider>
              
              {/* Top progress loader indicator */}
              <RouteObserver />

              {/* Toast notifications overlay popup portal */}
              <NotificationToasts />

              {/* Custom Search Command Overlay Modal */}
              <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

              <LayoutWrapper>
                <Routes>
                  {/* Standard Redirections */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* SaaS Route Register */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/portfolio" element={<PortfolioOverview />} />
                  <Route path="/transactions" element={<TransactionsExplorer />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/investment-estimator" element={<InvestmentEstimator />} />
                  <Route path="/debt-management" element={<DebtManagement />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Fallback to Dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </LayoutWrapper>

            </OnboardingProvider>
          </NotificationProvider>
        </UserProvider>
      </AnalyticsProvider>
    </BrowserRouter>
  );
}
