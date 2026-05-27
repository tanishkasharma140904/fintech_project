/**
 * navigationConfig.js
 * Centralized navigation configuration for the Fintech SaaS platform.
 * Exposes page titles, breadcrumbs list, routes metadata, and helper functions.
 */

export const NAVIGATION_ROUTES = [
  {
    path: "/dashboard",
    title: "Dashboard Overview",
    label: "Dashboard",
    breadcrumbs: ["Home", "Dashboard"],
    iconName: "dashboard",
    description: "Personal wealth aggregate meters and analytics cards",
  },
  {
    path: "/portfolio",
    title: "Portfolio Overview",
    label: "Portfolio",
    breadcrumbs: ["Home", "Portfolio"],
    iconName: "portfolio",
    description: "Unified AI-powered personal financial identity and assets overview",
  },
  {
    path: "/transactions",
    title: "Transaction Explorer",
    label: "Transactions",
    breadcrumbs: ["Home", "Transactions"],
    iconName: "transactions",
    description: "Detailed ledger and smart AI-categorized transaction records",
  },
  {
    path: "/analytics",
    title: "Financial Intelligence Analytics",
    label: "Analytics",
    breadcrumbs: ["Home", "Analytics"],
    iconName: "analytics",
    description: "Deep spending insights and business intelligence dashboard",
  },
  {
    path: "/investment-estimator",
    title: "Investment Estimator",
    label: "Investment Estimator",
    breadcrumbs: ["Home", "Investment Estimator"],
    iconName: "estimator",
    description: "Affordability calculator for large future planned expenditures",
  },
  {
    path: "/debt-management",
    title: "Debt Management Assistant",
    label: "Debt Management",
    breadcrumbs: ["Home", "Debt Management"],
    iconName: "debt",
    description: "Liabilities analysis, payoff stress indexes, and payout models",
  },
  {
    path: "/settings",
    title: "Control Center Settings",
    label: "Settings",
    breadcrumbs: ["Home", "Settings"],
    iconName: "settings",
    description: "Personalization dials, theme customizers, bank linkages, and active sessions",
  },
  {
    path: "/profile",
    title: "SaaS User Profile",
    label: "Profile",
    breadcrumbs: ["Home", "Profile"],
    iconName: "profile",
    description: "SaaS identity card, financial personality logs, and target goals",
  }
];

/**
 * Resolves current location path to matching config object with fallback to dashboard.
 */
export function getRouteMetadata(pathname) {
  if (!pathname || pathname === "/") {
    return NAVIGATION_ROUTES.find(r => r.path === "/dashboard");
  }
  
  const match = NAVIGATION_ROUTES.find(
    r => r.path.toLowerCase() === pathname.toLowerCase()
  );
  
  return match || NAVIGATION_ROUTES.find(r => r.path === "/dashboard");
}
