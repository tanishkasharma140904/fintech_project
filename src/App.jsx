import "./main.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import InvestmentEstimator from "./pages/InvestmentEstimator";
import DebtManagement from "./pages/DebtManagement";

function PlaceholderPage({ title }) {
  return (
    <main className="flex-1 overflow-y-auto p-8" style={{ background: "var(--bg-base)" }}>
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Coming soon — this module is under development.</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/estimator" element={<InvestmentEstimator />} />
              <Route path="/debt" element={<DebtManagement />} />
              <Route path="/portfolio" element={<PlaceholderPage title="Portfolio" />} />
              <Route path="/transactions" element={<PlaceholderPage title="Transactions" />} />
              <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            </Routes>
          </div>
        </div>
      </AnalyticsProvider>
    </BrowserRouter>
  );
}
