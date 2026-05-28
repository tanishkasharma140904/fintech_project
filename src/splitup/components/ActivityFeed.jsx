/**
 * ActivityFeed.jsx
 * Real-time activity timeline for SplitUp groups.
 * Shows chronological activity with icons, animations, and timestamps.
 */

import MemberAvatar from './MemberAvatar';

const ACTIVITY_CONFIG = {
  expense_added: { icon: '💰', color: 'var(--green)', label: 'Expense' },
  expense_edited: { icon: '✏️', color: 'var(--yellow)', label: 'Edited' },
  expense_deleted: { icon: '🗑️', color: 'var(--red)', label: 'Deleted' },
  settlement: { icon: '🤝', color: 'var(--accent-primary)', label: 'Settlement' },
  member_joined: { icon: '➕', color: 'var(--blue)', label: 'Joined' },
  member_removed: { icon: '➖', color: 'var(--red)', label: 'Removed' },
  group_created: { icon: '🎉', color: 'var(--accent-primary)', label: 'Created' },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = dateStr?.toDate?.() ? dateStr.toDate() : new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ActivityFeed({ activities = [], maxItems = 20 }) {
  const items = activities.slice(0, maxItems);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-3xl mb-2">📭</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          No activity yet
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Activity will appear here when expenses are added
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item, idx) => {
        const config = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.group_created;

        return (
          <div
            key={item.id || idx}
            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-opacity-50"
            style={{
              animation: `fadeSlideIn 0.3s ease-out ${idx * 0.05}s both`,
              background: idx === 0 ? 'rgba(0,212,170,0.03)' : 'transparent',
              borderLeft: idx === 0 ? `2px solid ${config.color}` : '2px solid transparent',
            }}
          >
            {/* Activity Icon */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
              style={{
                background: `${config.color}15`,
                border: `1px solid ${config.color}25`,
              }}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                <span className="font-bold">{item.userName || 'Someone'}</span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {formatTimeAgo(item.createdAt)}
                </span>
                {item.amount && (
                  <span
                    className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: `${config.color}12`,
                      color: config.color,
                      border: `1px solid ${config.color}20`,
                    }}
                  >
                    ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Pulse for latest */}
            {idx === 0 && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{
                  background: config.color,
                  boxShadow: `0 0 8px ${config.color}`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
