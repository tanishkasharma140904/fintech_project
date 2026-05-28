/**
 * GroupDetails.jsx
 * Full group detail view at /splitup/group/:groupId
 * Tabbed interface: Expenses | Balances | Activity | Settings
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSplitUp } from '../context/SplitUpContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../utils/splitCalculators';
import { AvatarStack } from '../components/MemberAvatar';
import MemberAvatar from '../components/MemberAvatar';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import AddMembersModal from '../components/AddMembersModal';
import BalancesSummary from '../components/BalancesSummary';
import ActivityFeed from '../components/ActivityFeed';

const CATEGORY_ICONS = {
  food: '🍽️', travel: '✈️', transport: '🚗', rent: '🏠',
  utilities: '💡', entertainment: '🎬', shopping: '🛍️', groceries: '🛒',
  health: '🏥', subscriptions: '📱', general: '📝', other: '💰',
};

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const {
    setActiveGroupId,
    activeGroup,
    activeExpenses,
    activeSettlements,
    activeActivity,
    activeBalances,
    activeTotalSpending,
    activeUserBalance,
    activeLoading,
    addExpense,
    editExpense,
    deleteExpense,
    settleBalance,
    addMember,
    removeMember,
    deleteGroup,
    lookupUserByEmail,
  } = useSplitUp();

  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Set active group on mount
  useEffect(() => {
    if (groupId) {
      setActiveGroupId(groupId);
    }
    return () => setActiveGroupId(null);
  }, [groupId, setActiveGroupId]);

  const memberDetails = activeGroup?.memberDetails || {};
  const members = activeGroup?.members || [];
  const isOwner = activeGroup?.createdBy === uid;

  const memberList = useMemo(() => {
    return Object.entries(memberDetails).map(([id, info]) => ({
      uid: id,
      name: info.name || info.email || 'Member',
      email: info.email,
    }));
  }, [memberDetails]);

  // Sort expenses by date
  const sortedExpenses = useMemo(() => {
    return [...activeExpenses].sort((a, b) => {
      const da = a.createdAt?.toDate?.() ? a.createdAt.toDate() : new Date(a.createdAt);
      const db2 = b.createdAt?.toDate?.() ? b.createdAt.toDate() : new Date(b.createdAt);
      return db2 - da;
    });
  }, [activeExpenses]);

  const getName = (uid2) => {
    if (uid2 === uid) return 'You';
    return memberDetails[uid2]?.name || memberDetails[uid2]?.email || 'Unknown';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = dateStr?.toDate?.() ? dateStr.toDate() : new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleAddExpense = async (expenseData) => {
    await addExpense(groupId, expenseData);
  };

  const handleEditExpense = async (expenseData) => {
    if (editingExpense?.id) {
      await editExpense(groupId, editingExpense.id, expenseData);
      setEditingExpense(null);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    await deleteExpense(groupId, expenseId);
    setConfirmDelete(null);
  };

  const handleSettleUp = (debt) => {
    setSelectedDebt(debt);
    setShowSettleUp(true);
  };

  const handleSettlement = async (settlementData) => {
    await settleBalance(groupId, settlementData);
  };

  const handleAddMember = async (memberInfo) => {
    await addMember(groupId, memberInfo);
  };

  const handleRemoveMember = async (memberUid) => {
    await removeMember(groupId, memberUid);
  };

  const handleDeleteGroup = async () => {
    await deleteGroup(groupId);
    navigate('/splitup');
  };

  if (activeLoading && !activeGroup) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl shimmer" />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading group...</p>
        </div>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Group not found</p>
          <button
            onClick={() => navigate('/splitup')}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'var(--accent-primary)', color: '#000' }}
          >
            Back to SplitUp
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'expenses', label: 'Expenses', count: activeExpenses.length },
    { id: 'balances', label: 'Balances', count: null },
    { id: 'activity', label: 'Activity', count: activeActivity.length },
    { id: 'settings', label: 'Settings', count: null },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* ══════════ BACK + GROUP HEADER ══════════ */}
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

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
              >
                {activeGroup.icon || '👥'}
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeGroup.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <AvatarStack members={memberList} maxShow={6} size={22} fontSize={8} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddMembers(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
              >
                + Member
              </button>
              <button
                onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'var(--accent-primary)', color: '#000' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* ══════════ STAT CARDS ══════════ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Total Spent</p>
            <p className="text-base font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{formatINR(activeTotalSpending)}</p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Your Balance</p>
            <p className="text-base font-bold font-mono" style={{
              color: Math.abs(activeUserBalance) < 0.01 ? 'var(--text-muted)' : activeUserBalance > 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {Math.abs(activeUserBalance) < 0.01 ? 'Settled ✓' : activeUserBalance > 0 ? `+${formatINR(activeUserBalance)}` : formatINR(activeUserBalance)}
            </p>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Expenses</p>
            <p className="text-base font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{activeExpenses.length}</p>
          </div>
        </div>

        {/* ══════════ TABS ══════════ */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: activeTab === tab.id ? '1px solid rgba(0,212,170,0.15)' : '1px solid transparent',
              }}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
                  style={{
                    background: activeTab === tab.id ? 'rgba(0,212,170,0.1)' : 'var(--bg-border)',
                    color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════ TAB CONTENT ══════════ */}
        <div className="min-h-[300px]">
          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="space-y-2">
              {sortedExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
                  <span className="text-3xl mb-3">💰</span>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No expenses yet</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Add your first shared expense</p>
                  <button
                    onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'var(--accent-primary)', color: '#000' }}
                  >
                    Add Expense
                  </button>
                </div>
              ) : (
                sortedExpenses.map((expense) => {
                  const catIcon = CATEGORY_ICONS[expense.category] || '💰';
                  const paidByName = getName(expense.paidBy);
                  const yourShare = expense.splits?.[uid] || 0;
                  const paidByYou = expense.paidBy === uid;

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bg-border)'; }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
                      >
                        {catIcon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {expense.description}
                          </p>
                          {expense.notes && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                              📝
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Paid by <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{paidByName}</span> · {formatDate(expense.createdAt)}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                          {formatINR(expense.amount)}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: paidByYou ? 'var(--green)' : 'var(--red)' }}>
                          {paidByYou
                            ? `you lent ${formatINR(expense.amount - yourShare)}`
                            : `you owe ${formatINR(yourShare)}`
                          }
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingExpense(expense); setShowAddExpense(true); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Edit"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmDelete(expense.id)}
                          className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                          style={{ color: 'var(--text-muted)' }}
                          title="Delete"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* BALANCES TAB */}
          {activeTab === 'balances' && (
            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
              <BalancesSummary
                expenses={activeExpenses}
                settlements={activeSettlements}
                memberDetails={memberDetails}
                currentUid={uid}
                onSettleUp={handleSettleUp}
              />
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
              <ActivityFeed activities={activeActivity} maxItems={30} />
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Group Info */}
              <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Group Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Name</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeGroup.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeGroup.icon} {activeGroup.type}</span>
                  </div>
                  {activeGroup.description && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>Description</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{activeGroup.description}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Created</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatDate(activeGroup.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Members ({members.length})
                  </h3>
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="text-[10px] font-bold transition-colors"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    + Add Member
                  </button>
                </div>
                <div className="space-y-2">
                  {members.map((memberUid) => {
                    const info = memberDetails[memberUid] || {};
                    return (
                      <div
                        key={memberUid}
                        className="flex items-center gap-3 p-2.5 rounded-xl border"
                        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)' }}
                      >
                        <MemberAvatar name={info.name || info.email || '?'} size={30} fontSize={10} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {memberUid === uid ? 'You' : (info.name || info.email || 'Member')}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {info.email || ''} · {info.role || 'member'}
                          </p>
                        </div>
                        {info.role === 'owner' && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent-primary)' }}>
                            OWNER
                          </span>
                        )}
                        {isOwner && memberUid !== uid && (
                          <button
                            onClick={() => handleRemoveMember(memberUid)}
                            className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.target.style.color = 'var(--red)'; e.target.style.background = 'rgba(255,77,106,0.1)'; }}
                            onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'transparent'; }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone */}
              {isOwner && (
                <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'rgba(255,77,106,0.2)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--red)' }}>
                    Danger Zone
                  </h3>
                  <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                    Deleting this group will permanently remove all expenses, balances, and activity history.
                  </p>
                  <button
                    onClick={handleDeleteGroup}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: 'rgba(255,77,106,0.1)',
                      color: 'var(--red)',
                      border: '1px solid rgba(255,77,106,0.2)',
                    }}
                  >
                    Delete Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ MODALS ══════════ */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
        onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
        members={memberDetails}
        currentUid={uid}
        editingExpense={editingExpense}
      />

      <SettleUpModal
        isOpen={showSettleUp}
        onClose={() => { setShowSettleUp(false); setSelectedDebt(null); }}
        onSubmit={handleSettlement}
        debt={selectedDebt}
        memberDetails={memberDetails}
        currentUid={uid}
      />

      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        onAddMember={handleAddMember}
        lookupUserByEmail={lookupUserByEmail}
        existingMembers={members}
        memberDetails={memberDetails}
      />

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
          style={{ background: 'rgba(3,7,18,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-5"
            style={{ background: 'rgba(17,24,39,0.97)', borderColor: 'var(--bg-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Expense?</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>This action cannot be undone. Balances will be recalculated.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                style={{ borderColor: 'var(--bg-border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteExpense(confirmDelete)}
                className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'var(--red)', color: '#fff' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
