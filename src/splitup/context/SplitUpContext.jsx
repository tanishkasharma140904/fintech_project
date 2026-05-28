/**
 * SplitUpContext.jsx
 * Central state management for the SplitUp module.
 * Provides real-time group data, balance computations, and CRUD operations.
 * Fully isolated from existing Artho contexts — connects only through clean interfaces.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSplitUpFirestore } from '../hooks/useSplitUpFirestore';
import { getNetBalances, computeDetailedBalances, getTotalGroupSpending, getUserBurdenAnalysis } from '../utils/balanceEngine';

const SplitUpContext = createContext(null);

export function SplitUpProvider({ children }) {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const firestore = useSplitUpFirestore();

  const uid = currentUser?.uid;

  // ── Core State ──
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active group state (for detail pages)
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeExpenses, setActiveExpenses] = useState([]);
  const [activeSettlements, setActiveSettlements] = useState([]);
  const [activeActivity, setActiveActivity] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);

  // ── Subscribe to user's groups (real-time) ──
  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore.subscribeToGroups(async (groupsList) => {
      setGroups(groupsList);
      setLoading(false);

      // Self-healing migration for legacy groups missing parent balances map
      if (groupsList && groupsList.length > 0) {
        for (const group of groupsList) {
          if (!group.balances || Object.keys(group.balances).length === 0) {
            console.log('[SplitUp debug] Group is missing parent-level balances. Triggering self-healing recalculation for:', group.id);
            try {
              await firestore.recalculateGroupStats(group.id);
            } catch (err) {
              console.error('[SplitUp debug] Self-healing recalculation failed for group:', group.id, err);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [uid, firestore.subscribeToGroups, firestore.recalculateGroupStats]);

  // ── Subscribe to active group details (real-time) ──
  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroup(null);
      setActiveExpenses([]);
      setActiveSettlements([]);
      setActiveActivity([]);
      return;
    }

    setActiveLoading(true);
    const unsubscribe = firestore.subscribeToGroupDetails(activeGroupId, {
      onGroup: (group) => {
        setActiveGroup(group);
        setActiveLoading(false);
      },
      onExpenses: (expenses) => setActiveExpenses(expenses),
      onSettlements: (settlements) => setActiveSettlements(settlements),
      onActivity: (activity) => setActiveActivity(activity),
    });

    return () => unsubscribe();
  }, [activeGroupId, firestore.subscribeToGroupDetails]);

  // ── Computed balances for active group ──
  const activeBalances = useMemo(() => {
    if (!activeExpenses.length && !activeSettlements.length) return {};
    return getNetBalances(activeExpenses, activeSettlements);
  }, [activeExpenses, activeSettlements]);

  const activeDetailedBalances = useMemo(() => {
    if (!activeExpenses.length && !activeSettlements.length) return [];
    return computeDetailedBalances(activeExpenses, activeSettlements);
  }, [activeExpenses, activeSettlements]);

  const activeTotalSpending = useMemo(() => {
    return getTotalGroupSpending(activeExpenses);
  }, [activeExpenses]);

  // ── User's balance in active group ──
  const activeUserBalance = useMemo(() => {
    if (!uid || !activeBalances) return 0;
    return activeBalances[uid] || 0;
  }, [uid, activeBalances]);

  // ── CRUD Operations with notification integration ──

  const createGroup = useCallback(async (groupData) => {
    const groupId = await firestore.createGroup(groupData);
    addNotification({
      title: 'New SplitUp Group',
      description: `You created "${groupData.name}". Start adding expenses!`,
      category: 'SplitUp',
      priority: 'medium',
    });
    return groupId;
  }, [firestore, addNotification]);

  const addExpense = useCallback(async (groupId, expenseData) => {
    const expenseId = await firestore.addExpense(groupId, expenseData);
    const groupName = groups.find(g => g.id === groupId)?.name || 'group';
    addNotification({
      title: 'Expense Added',
      description: `₹${expenseData.amount.toLocaleString('en-IN')} for "${expenseData.description}" in ${groupName}`,
      category: 'SplitUp',
      priority: 'low',
    });
    return expenseId;
  }, [firestore, groups, addNotification]);

  const editExpense = useCallback(async (groupId, expenseId, updates) => {
    await firestore.editExpense(groupId, expenseId, updates);
    const groupName = groups.find(g => g.id === groupId)?.name || 'group';
    addNotification({
      title: 'Balance Updated',
      description: `Expense edited in "${groupName}". Group balances updated.`,
      category: 'SplitUp',
      priority: 'low',
    });
  }, [firestore, groups, addNotification]);

  const deleteExpense = useCallback(async (groupId, expenseId) => {
    const groupName = groups.find(g => g.id === groupId)?.name || 'group';
    await firestore.deleteExpense(groupId, expenseId);
    addNotification({
      title: 'Balance Updated',
      description: `Expense deleted from "${groupName}". Group balances updated.`,
      category: 'SplitUp',
      priority: 'low',
    });
  }, [firestore, groups, addNotification]);

  const settleBalance = useCallback(async (groupId, settlementData) => {
    const settlementId = await firestore.settleBalance(groupId, settlementData);
    const groupName = groups.find(g => g.id === groupId)?.name || 'group';
    addNotification({
      title: 'Settlement Recorded',
      description: `₹${settlementData.amount.toLocaleString('en-IN')} settled in ${groupName}`,
      category: 'SplitUp',
      priority: 'medium',
    });
    return settlementId;
  }, [firestore, groups, addNotification]);

  const addMember = useCallback(async (groupId, memberInfo) => {
    await firestore.addMember(groupId, memberInfo);
    addNotification({
      title: 'Member Added',
      description: `${memberInfo.fullName || memberInfo.email} was added to the group`,
      category: 'SplitUp',
      priority: 'low',
    });
  }, [firestore, addNotification]);

  const removeMember = useCallback(async (groupId, memberUid) => {
    await firestore.removeMember(groupId, memberUid);
  }, [firestore]);

  const deleteGroup = useCallback(async (groupId) => {
    const groupName = groups.find(g => g.id === groupId)?.name || 'group';
    await firestore.deleteGroup(groupId);
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
    addNotification({
      title: 'Group Deleted',
      description: `"${groupName}" has been deleted`,
      category: 'SplitUp',
      priority: 'low',
    });
  }, [firestore, groups, activeGroupId, addNotification]);

  // ── Analytics Integration ──
  const getSplitUpAnalytics = useCallback(() => {
    if (!uid || groups.length === 0) {
      return {
        totalSharedExpenses: 0,
        yourActualBurden: 0,
        recoverableAmount: 0,
        pendingSettlements: 0,
        groupCount: 0,
        insights: [],
      };
    }

    // For the active group only (detailed analysis)
    const analysis = getUserBurdenAnalysis(uid, activeExpenses);
    
    // Aggregate across all groups (from net balances)
    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    // Use activeBalances for the active group
    if (activeBalances[uid]) {
      if (activeBalances[uid] > 0) totalOwedToYou += activeBalances[uid];
      else totalYouOwe += Math.abs(activeBalances[uid]);
    }

    const insights = [];
    if (analysis.recoverable > 0) {
      const pct = Math.round((analysis.recoverable / analysis.totalPaid) * 100);
      insights.push(`Shared expenses reduced your actual burden by ${pct}%.`);
    }
    if (totalOwedToYou > 0) {
      insights.push(`Pending settlements total ₹${totalOwedToYou.toLocaleString('en-IN')}.`);
    }
    if (analysis.totalPaid > analysis.personalShare) {
      insights.push(`You paid more than your share — others owe you money.`);
    }

    return {
      totalSharedExpenses: analysis.totalParticipated,
      yourActualBurden: analysis.personalShare,
      recoverableAmount: analysis.recoverable,
      pendingSettlements: totalOwedToYou,
      groupCount: groups.length,
      insights,
    };
  }, [uid, groups, activeExpenses, activeBalances]);

  const value = useMemo(() => ({
    // State
    groups,
    loading,
    activeGroupId,
    activeGroup,
    activeExpenses,
    activeSettlements,
    activeActivity,
    activeBalances,
    activeDetailedBalances,
    activeTotalSpending,
    activeUserBalance,
    activeLoading,

    // Actions
    setActiveGroupId,
    createGroup,
    deleteGroup,
    addExpense,
    editExpense,
    deleteExpense,
    settleBalance,
    addMember,
    removeMember,
    lookupUserByEmail: firestore.lookupUserByEmail,

    // Analytics
    getSplitUpAnalytics,
  }), [
    groups, loading, activeGroupId, activeGroup, activeExpenses, activeSettlements,
    activeActivity, activeBalances, activeDetailedBalances, activeTotalSpending,
    activeUserBalance, activeLoading, createGroup, deleteGroup, addExpense, editExpense,
    deleteExpense, settleBalance, addMember, removeMember, firestore.lookupUserByEmail,
    getSplitUpAnalytics,
  ]);

  return (
    <SplitUpContext.Provider value={value}>
      {children}
    </SplitUpContext.Provider>
  );
}

export function useSplitUp() {
  const context = useContext(SplitUpContext);
  if (!context) {
    throw new Error('useSplitUp must be used within a SplitUpProvider');
  }
  return context;
}
