/**
 * SettlementPage.jsx
 * Settlement center at /splitup/settlements
 * Shows all pending settlements across all groups + settlement history.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSplitUp } from '../context/SplitUpContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../utils/splitCalculators';
import { getNetBalances, simplifyDebts } from '../utils/balanceEngine';
import MemberAvatar from '../components/MemberAvatar';

export default function SettlementPage() {
  const navigate = useNavigate();
  const { groups } = useSplitUp();
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [activeView, setActiveView] = useState('pending');

  // Compute all pending settlements across all groups
  const { pendingSettlements, settlementHistory, stats } = useMemo(() => {
    const pending = [];
    const history = [];
    let totalPendingAmount = 0;
    let totalSettledAmount = 0;

    groups.forEach((group) => {
      const expenses = group.expenses ? Object.values(group.expenses) : [];
      const settlements = group.settlements ? Object.values(group.settlements) : [];

      // Get simplified debts for this group
      if (expenses.length > 0) {
        const nets = getNetBalances(expenses, settlements);
        const debts = simplifyDebts(nets);

        debts.forEach((debt) => {
          // Only show debts involving the current user
          if (debt.from === uid || debt.to === uid) {
            pending.push({
              ...debt,
              groupId: group.id,
              groupName: group.name,
              groupIcon: group.icon || '👥',
              memberDetails: group.memberDetails || {},
            });
            totalPendingAmount += debt.amount;
          }
        });
      }

      // Collect settlement history
      settlements.forEach((s) => {
        if (s.from === uid || s.to === uid) {
          history.push({
            ...s,
            groupId: group.id,
            groupName: group.name,
            groupIcon: group.icon || '👥',
            memberDetails: group.memberDetails || {},
          });
          totalSettledAmount += s.amount;
        }
      });
    });

    // Sort history by date
    history.sort((a, b) => {
      const da = a.createdAt?.toDate?.() ? a.createdAt.toDate() : new Date(a.createdAt);
      const db2 = b.createdAt?.toDate?.() ? b.createdAt.toDate() : new Date(b.createdAt);
      return db2 - da;
    });

    return {
      pendingSettlements: pending,
      settlementHistory: history,
      stats: { totalPendingAmount, totalSettledAmount, pendingCount: pending.length, settledCount: history.length },
    };
  }, [groups, uid]);

  const getName = (membUid, memberDetails) => {
    if (membUid === uid) return 'You';
    return memberDetails?.[membUid]?.name || memberDetails?.[membUid]?.email || 'Unknown';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = dateStr?.toDate?.() ? dateStr.toDate() : new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/splitup')}
            className="flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to SplitUp
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🤝</span>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Settlement Center
            </h1>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Manage all your pending and completed settlements across groups
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Pending</p>
            <p className="text-base font-bold font-mono" style={{ color: 'var(--yellow)' }}>{stats.pendingCount}</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Pending Amount</p>
            <p className="text-base font-bold font-mono" style={{ color: 'var(--red)' }}>{formatINR(stats.totalPendingAmount)}</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Settled</p>
            <p className="text-base font-bold font-mono" style={{ color: 'var(--green)' }}>{stats.settledCount}</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Total Settled</p>
            <p className="text-base font-bold font-mono" style={{ color: 'var(--green)' }}>{formatINR(stats.totalSettledAmount)}</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
          {[
            { id: 'pending', label: 'Pending', count: stats.pendingCount },
            { id: 'history', label: 'Settlement History', count: stats.settledCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeView === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeView === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: activeView === tab.id ? '1px solid rgba(0,212,170,0.15)' : '1px solid transparent',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md" style={{
                  background: activeView === tab.id ? 'rgba(0,212,170,0.1)' : 'var(--bg-border)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[200px]">
          {activeView === 'pending' && (
            <div className="space-y-2">
              {pendingSettlements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
                  <span className="text-3xl mb-3">✨</span>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>All settled up!</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No pending settlements across any of your groups</p>
                </div>
              ) : (
                pendingSettlements.map((item, idx) => {
                  const isYouOwe = item.from === uid;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-xl border transition-all"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                        {item.groupIcon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {isYouOwe ? (
                            <>You owe <span style={{ color: 'var(--accent-primary)' }}>{getName(item.to, item.memberDetails)}</span></>
                          ) : (
                            <><span style={{ color: 'var(--accent-primary)' }}>{getName(item.from, item.memberDetails)}</span> owes you</>
                          )}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          in {item.groupName}
                        </p>
                      </div>

                      <span className="text-sm font-bold font-mono" style={{ color: isYouOwe ? 'var(--red)' : 'var(--green)' }}>
                        {isYouOwe ? `-${formatINR(item.amount)}` : `+${formatINR(item.amount)}`}
                      </span>

                      <button
                        onClick={() => navigate(`/splitup/group/${item.groupId}`)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                        style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(0,212,170,0.2)' }}
                      >
                        View
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeView === 'history' && (
            <div className="space-y-2">
              {settlementHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
                  <span className="text-3xl mb-3">📋</span>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No settlement history</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Settlements will appear here once recorded</p>
                </div>
              ) : (
                settlementHistory.map((item, idx) => {
                  const isPayer = item.from === uid;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-xl border"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(16,208,120,0.1)', border: '1px solid rgba(16,208,120,0.2)' }}>
                        ✅
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {isPayer ? (
                            <>You paid <span style={{ color: 'var(--accent-primary)' }}>{getName(item.to, item.memberDetails)}</span></>
                          ) : (
                            <><span style={{ color: 'var(--accent-primary)' }}>{getName(item.from, item.memberDetails)}</span> paid you</>
                          )}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.groupName} · {formatDate(item.createdAt)} · {item.type || 'cash'}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      <span className="text-sm font-bold font-mono" style={{ color: 'var(--green)' }}>
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
