import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const SEED_NOTIFICATIONS = [
  {
    id: "notif_seed_1",
    title: "Welcome to Artho!",
    description: "Your personalized premium Indian fintech SaaS dashboard is active. Complete your Settings profile.",
    category: "System",
    timestamp: "10 mins ago",
    unread: true,
    priority: "high",
  },
  {
    id: "notif_seed_2",
    title: "AI Spending Alert",
    description: "Food & dining expenses have crossed ₹5,000 this month. Consider reviewing Swiggy limits under Analytics.",
    category: "Analytics",
    timestamp: "1 hour ago",
    unread: true,
    priority: "medium",
  },
  {
    id: "notif_seed_3",
    title: "HDFC Premium Banking Synced",
    description: "Recurring ledger accounts and savings records synchronized successfully.",
    category: "System",
    timestamp: "4 hours ago",
    unread: false,
    priority: "low",
  },
  {
    id: "notif_seed_4",
    title: "Investment Score Elevated",
    description: "Affordability indices for your planned House purchase improved due to standard cash surplus increments.",
    category: "Investment",
    timestamp: "1 day ago",
    unread: false,
    priority: "medium",
  }
];

const TELEMETRY_ALERTS = [
  {
    title: "AI Ledger Audit Nominal",
    description: "All uploaded transaction logs audited successfully. Fraud risk metrics at 0.02% (Excellent).",
    category: "Analytics",
    priority: "low",
  },
  {
    title: "Security: New Session Detected",
    description: "A secure login session was successfully validated on Chrome App (New Delhi, India).",
    category: "Security",
    priority: "medium",
  },
  {
    title: "Investment buffer updated",
    description: "Dynamic savings surplus reached ₹40,000, improving feasibility indexes on all custom goals.",
    category: "Investment",
    priority: "medium",
  },
  {
    title: "Artho API Round-Trip Sync Nominal",
    description: "API latencies settled at 54ms. Telemetry active and pulsing.",
    category: "System",
    priority: "low",
  },
  {
    title: "Liability Stress Index reduced",
    description: "Calculated debt payoff milestones accelerated by 2 months due to surplus EMIs allocations.",
    category: "Debt",
    priority: "high",
  }
];

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [toasts, setToasts] = useState([]);

  // Load notifications dynamically when user logs in/switches
  useEffect(() => {
    const uid = currentUser?.uid || "guest";
    try {
      const saved = localStorage.getItem(`artho_notifications_${uid}`);
      setNotifications(saved ? JSON.parse(saved) : SEED_NOTIFICATIONS);
    } catch (e) {
      console.error("Error loading notifications from localStorage:", e);
      setNotifications(SEED_NOTIFICATIONS);
    }
  }, [currentUser]);

  // Persist notifications on update
  useEffect(() => {
    const uid = currentUser?.uid || "guest";
    try {
      localStorage.setItem(`artho_notifications_${uid}`, JSON.stringify(notifications));
    } catch (e) {
      console.error("Error persisting notifications to localStorage:", e);
    }
  }, [notifications, currentUser]);

  // Master Dynamic Alert Trigger
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: "Just Now",
      unread: true,
      priority: notif.priority || "low",
      ...notif,
    };

    // Prepend to notifications list
    setNotifications((prev) => [newNotif, ...prev]);

    // Push new pop-up toast on screen
    const newToast = {
      id: `toast_${Date.now()}`,
      title: newNotif.title,
      description: newNotif.description,
      category: newNotif.category,
      priority: newNotif.priority,
    };
    setToasts((prev) => [newToast, ...prev]);

    // Play subtle modern audio-ready cue (e.g. system console log)
    console.log(`[Artho Notification Center] New Alert: ${newNotif.title}`);
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Compute unread count reactively
  const unreadCount = notifications.filter((n) => n.unread).length;

  // ── 35-SECOND TELEMETRY HEARTBEAT ALERTS ──
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random simulated alert from pool
      const alert = TELEMETRY_ALERTS[Math.floor(Math.random() * TELEMETRY_ALERTS.length)];
      addNotification(alert);
    }, 35000);

    return () => clearInterval(interval);
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
