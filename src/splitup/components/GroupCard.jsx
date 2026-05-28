/**
 * GroupCard.jsx
 * Premium glassmorphism card for displaying group previews in the SplitUp dashboard.
 */

import { useNavigate } from 'react-router-dom';
import { AvatarStack } from './MemberAvatar';
import { formatINR } from '../utils/splitCalculators';

const GROUP_TYPE_ICONS = {
  trip: '✈️',
  flatmates: '🏠',
  friends: '🍕',
  family: '👨‍👩‍👧‍👦',
  couples: '💑',
  subscriptions: '📱',
  custom: '👥',
};

export default function GroupCard({ group, userBalance = 0, uid }) {
  const navigate = useNavigate();

  const memberDetails = group.memberDetails || {};
  const memberList = Object.entries(memberDetails).map(([id, info]) => ({
    uid: id,
    name: info.name || info.email || 'Member',
    email: info.email,
  }));

  const icon = group.icon || GROUP_TYPE_ICONS[group.type] || '👥';
  const isPositive = userBalance > 0;
  const isZero = Math.abs(userBalance) < 0.01;

  const timeSince = (dateStr) => {
    if (!dateStr) return '';
    const date = dateStr?.toDate?.() ? dateStr.toDate() : new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      onClick={() => navigate(`/splitup/group/${group.id}`)}
      className="group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--bg-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(0,212,170,0.08), 0 8px 32px rgba(0,0,0,0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--bg-border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.03) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
            }}
          >
            {icon}
          </div>
          <div>
            <h3
              className="text-sm font-bold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {group.name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {group.members?.length || 0} members
            </p>
          </div>
        </div>

        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-md"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            border: '1px solid var(--bg-border)',
          }}
        >
          {timeSince(group.updatedAt)}
        </span>
      </div>

      {/* Avatars */}
      <div className="mb-4">
        <AvatarStack members={memberList} maxShow={5} size={26} fontSize={9} />
      </div>

      {/* Stats Row */}
      <div
        className="flex items-center justify-between pt-3 relative"
        style={{ borderTop: '1px solid var(--bg-border)' }}
      >
        <div>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Total Spent
          </p>
          <p
            className="text-sm font-bold font-mono tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatINR(group.totalExpense || 0)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Your Balance
          </p>
          <p
            className="text-sm font-bold font-mono tracking-tight"
            style={{
              color: isZero
                ? 'var(--text-muted)'
                : isPositive
                ? 'var(--green)'
                : 'var(--red)',
            }}
          >
            {isZero ? 'Settled' : isPositive ? `+${formatINR(userBalance)}` : formatINR(userBalance)}
          </p>
        </div>
      </div>
    </div>
  );
}
