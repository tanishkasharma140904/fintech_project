/**
 * OnboardingContext — Facade wrapper backing Onboarding flow with centralized UserContext.
 * 
 * This ensures that existing files (FinancialOnboarding.jsx and PortfolioOverview.jsx)
 * continue to parse and mutate their states using useOnboarding() seamlessly, 
 * while the absolute source of truth remains consolidated inside UserContext.jsx.
 */
import { useUser } from "./UserContext";

export function OnboardingProvider({ children }) {
  // Pass-through wrapper since UserProvider already wraps the app inside App.jsx
  return <>{children}</>;
}

export function useOnboarding() {
  const { user, completeOnboarding, resetUser } = useUser();
  
  return {
    onboardingData: user.completed ? user : null,
    isOnboarded: user.completed,
    loading: false,
    completeOnboarding,
    resetOnboarding: resetUser,
  };
}
export default useOnboarding;
