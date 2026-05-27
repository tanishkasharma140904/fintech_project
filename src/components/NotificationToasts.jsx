import { useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";

const CATEGORY_COLORS = {
  Analytics: { border: "#10d078", glow: "rgba(16, 208, 120, 0.15)", emoji: "📈" },
  Investment: { border: "#c084fc", glow: "rgba(192, 132, 252, 0.15)", emoji: "🎯" },
  Debt: { border: "#ff4d6a", glow: "rgba(255, 77, 106, 0.15)", emoji: "💸" },
  Security: { border: "#ff4d6a", glow: "rgba(255, 77, 106, 0.15)", emoji: "🛡️" },
  System: { border: "#00d4aa", glow: "rgba(0, 212, 170, 0.15)", emoji: "⚙️" },
  Transactions: { border: "#f5a623", glow: "rgba(245, 166, 35, 0.15)", emoji: "💳" },
};

function ToastCard({ toast, onDismiss }) {
  const { border, glow, emoji } = CATEGORY_COLORS[toast.category] || CATEGORY_COLORS.System;

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="p-4 rounded-xl border flex items-start gap-3 w-80 pointer-events-auto transition-all"
      style={{
        background: "rgba(17, 24, 39, 0.95)",
        borderColor: "var(--bg-border)",
        borderLeft: `4px solid ${border}`,
        boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 10px ${glow}`,
        animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">{toast.category}</p>
          <button 
            onClick={() => onDismiss(toast.id)} 
            className="text-[10px] text-gray-500 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
        <p className="text-xs font-bold text-gray-200 mt-1">{toast.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{toast.description}</p>
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(120px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function NotificationToasts() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-[999999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
