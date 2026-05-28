import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Load notifications dynamically when user logs in/switches
  useEffect(() => {
    const uid = currentUser?.uid || "guest";
    try {
      const saved = localStorage.getItem(`artho_notifications_${uid}`);
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error("Error loading notifications from localStorage:", e);
      setNotifications([]);
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
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: timeString,
      unread: true,
      priority: notif.priority || "low",
      ...notif,
    };

    // Prepend to notifications list and enforce 30-notification limit
    setNotifications((prev) => [newNotif, ...prev].slice(0, 30));

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
