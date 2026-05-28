/**
 * SplitUpDashboard.jsx
 * Main /splitup route — Groups overview with hero summary,
 * smart insights, create group modal, and groups grid.
 */

import { useState, useMemo } from 'react';
import { useSplitUp } from '../context/SplitUpContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { formatINR } from '../utils/splitCalculators';
import { getNetBalances } from '../utils/balanceEngine';
import GroupCard from '../components/GroupCard';
import MemberAvatar from '../components/MemberAvatar';

const GROUP_TYPES = [
  { id: 'trip', label: 'Trip', icon: '✈️' },
  { id: 'flatmates', label: 'Flatmates', icon: '🏠' },
  { id: 'friends', label: 'Friends', icon: '🍕' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'couples', label: 'Couples', icon: '💑' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱' },
  { id: 'custom', label: 'Custom', icon: '👥' },
];

export default function SplitUpDashboard() {
  const { groups, loading, createGroup } = useSplitUp();
  const { currentUser } = useAuth();
  const { user } = useUser();
  const uid = currentUser?.uid;

  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupType, setNewGroupType] = useState('friends');
  const [creating, setCreating] = useState(false);

  // Aggregate balances across all groups
  const aggregateStats = useMemo(() => {
    let totalOwed = 0;     // others owe you
    let totalOwe = 0;      // you owe others
    let totalSpent = 0;

    const balancePerGroup = {};

    groups.forEach((group) => {
      totalSpent += group.totalExpense || 0;

      // Compute balance from group data if available
      // For now use simple member-based estimation
      const expenses = group.expenses ? Object.values(group.expenses) : [];
      const settlements = group.settlements ? Object.values(group.settlements) : [];

      if (expenses.length > 0) {
        const nets = getNetBalances(expenses, settlements);
        const myBalance = nets[uid] || 0;
        balancePerGroup[group.id] = myBalance;
        if (myBalance > 0) totalOwed += myBalance;
        if (myBalance < 0) totalOwe += Math.abs(myBalance);
      } else {
        balancePerGroup[group.id] = 0;
      }
    });

    return { totalOwed, totalOwe, totalSpent, netBalance: totalOwed - totalOwe, balancePerGroup };
  }, [groups, uid]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const selectedType = GROUP_TYPES.find((t) => t.id === newGroupType);
      await createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        type: newGroupType,
        icon: selectedType?.icon || '👥',
      });
      setShowCreate(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupType('friends');
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ══════════ HERO HEADER ══════════ */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔀</span>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                SplitUp
              </h1>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider"
                style={{
                  background: 'rgba(0,212,170,0.1)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(0,212,170,0.2)',
                }}
              >
                by Artho
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Collaborative shared expense management integrated with your financial intelligence
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: 'var(--accent-primary)',
              color: '#000',
            }}
            onMouseEnter={(e) => { e.target.style.boxShadow = '0 0 20px rgba(0,212,170,0.3)'; }}
            onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Group
          </button>
        </div>

        {/* ══════════ SUMMARY CARDS ══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* You are owed */}
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(16,208,120,0.1)', border: '1px solid rgba(16,208,120,0.2)' }}
              >
                📈
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                You are owed
              </span>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--green)' }}>
              {aggregateStats.totalOwed > 0 ? `+${formatINR(aggregateStats.totalOwed)}` : formatINR(0)}
            </p>
          </div>

          {/* You owe */}
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)' }}
              >
                📉
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                You owe
              </span>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: aggregateStats.totalOwe > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
              {aggregateStats.totalOwe > 0 ? `-${formatINR(aggregateStats.totalOwe)}` : formatINR(0)}
            </p>
          </div>

          {/* Net Balance */}
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}
              >
                ⚖️
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Net Balance
              </span>
            </div>
            <p
              className="text-lg font-bold font-mono"
              style={{
                color: aggregateStats.netBalance > 0 ? 'var(--green)' : aggregateStats.netBalance < 0 ? 'var(--red)' : 'var(--text-muted)',
              }}
            >
              {aggregateStats.netBalance > 0 ? '+' : ''}{formatINR(aggregateStats.netBalance)}
            </p>
          </div>

          {/* Total Groups */}
          <div
            className="p-4 rounded-2xl border transition-all duration-300"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(77,159,255,0.1)', border: '1px solid rgba(77,159,255,0.2)' }}
              >
                👥
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Active Groups
              </span>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              {groups.length}
            </p>
          </div>
        </div>

        {/* ══════════ SMART INSIGHTS ══════════ */}
        {groups.length > 0 && (
          <div
            className="p-4 rounded-2xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.03), rgba(77,159,255,0.03))',
              borderColor: 'rgba(0,212,170,0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🧠</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                Shared Finance Insights
              </span>
            </div>
            <div className="space-y-1">
              {aggregateStats.totalOwed > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  💡 Pending settlements total <span className="font-bold font-mono" style={{ color: 'var(--green)' }}>{formatINR(aggregateStats.totalOwed)}</span> across {groups.length} group{groups.length > 1 ? 's' : ''}.
                </p>
              )}
              {aggregateStats.totalSpent > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  📊 Total shared spending across all groups: <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{formatINR(aggregateStats.totalSpent)}</span>.
                </p>
              )}
              {groups.length > 0 && aggregateStats.totalOwed === 0 && aggregateStats.totalOwe === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  ✨ All balances are settled across your groups. Great financial hygiene!
                </p>
              )}
            </div>
          </div>
        )}

        {/* ══════════ GROUPS GRID ══════════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Your Groups
            </h2>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {groups.length} group{groups.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl shimmer"
                  style={{ border: '1px solid var(--bg-border)' }}
                />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
              >
                🔀
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                No groups yet
              </h3>
              <p className="text-xs mb-4 text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Create your first shared expense group to start splitting costs with friends, flatmates, or family.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'var(--accent-primary)', color: '#000' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  userBalance={aggregateStats.balancePerGroup[group.id] || 0}
                  uid={uid}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ CREATE GROUP MODAL ══════════ */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
          style={{
            background: 'rgba(3, 7, 18, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              background: 'rgba(17, 24, 39, 0.97)',
              borderColor: 'var(--bg-border)',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0,212,170,0.3)',
            }}
          >
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)' }} />

            <div className="p-5">
              <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Create New Group
              </h2>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                Start a shared expense group and invite members
              </p>

              <div className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Goa Trip 2026"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--bg-border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--bg-border)'}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Optional description..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--bg-border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Group Type */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                    Group Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewGroupType(type.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
                        style={{
                          background: newGroupType === type.id ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                          borderColor: newGroupType === type.id ? 'rgba(0,212,170,0.25)' : 'var(--bg-border)',
                          color: newGroupType === type.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border"
                  style={{
                    background: 'transparent',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: newGroupName.trim() ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: newGroupName.trim() ? '#000' : 'var(--text-muted)',
                    opacity: creating ? 0.6 : 1,
                  }}
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
