/**
 * useSplitUpFirestore.js
 * Firestore CRUD abstraction for SplitUp module.
 * Supports both real Firebase mode and demo mode (localStorage).
 * All operations are async and return promises.
 */

import { useCallback } from 'react';
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc,
  updateDoc, onSnapshot, query, where, orderBy, serverTimestamp,
  arrayUnion, arrayRemove, writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

// ── DEMO MODE HELPERS ──
const DEMO_KEY = 'artho_splitup_data';

function getDemoData() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : { groups: {}, userGroups: {} };
  } catch {
    return { groups: {}, userGroups: {} };
  }
}

function saveDemoData(data) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save SplitUp demo data:', e);
  }
}

function generateId() {
  return 'su_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

// ── HOOK ──
export function useSplitUpFirestore() {
  const { currentUser, isDemoMode } = useAuth();
  const uid = currentUser?.uid;

  // ════════════════════════════════════════
  // GROUP OPERATIONS
  // ════════════════════════════════════════

  const createGroup = useCallback(async (groupData) => {
    if (!uid) throw new Error('Not authenticated');

    const groupId = generateId();
    const now = new Date().toISOString();

    const group = {
      id: groupId,
      name: groupData.name || 'Untitled Group',
      description: groupData.description || '',
      type: groupData.type || 'custom',
      icon: groupData.icon || '👥',
      createdBy: uid,
      members: [uid, ...(groupData.members || [])],
      memberDetails: {
        [uid]: {
          name: currentUser.fullName || currentUser.displayName || currentUser.email || 'You',
          email: currentUser.email || '',
          role: 'owner',
          joinedAt: now,
        },
        ...(groupData.memberDetails || {}),
      },
      totalExpense: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (isDemoMode) {
      const data = getDemoData();
      data.groups[groupId] = {
        ...group,
        expenses: {},
        settlements: {},
        activity: {},
      };
      // Index all members
      group.members.forEach((memberId) => {
        if (!data.userGroups[memberId]) data.userGroups[memberId] = [];
        if (!data.userGroups[memberId].includes(groupId)) {
          data.userGroups[memberId].push(groupId);
        }
      });
      // Add creation activity
      const actId = generateId();
      data.groups[groupId].activity[actId] = {
        id: actId,
        type: 'group_created',
        userId: uid,
        userName: group.memberDetails[uid]?.name || 'You',
        description: `created the group "${group.name}"`,
        createdAt: now,
      };
      saveDemoData(data);
    } else {
      const groupRef = doc(db, 'splitup_groups', groupId);
      await setDoc(groupRef, {
        ...group,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Add activity
      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      await setDoc(actRef, {
        type: 'group_created',
        userId: uid,
        userName: group.memberDetails[uid]?.name || 'You',
        description: `created the group "${group.name}"`,
        createdAt: serverTimestamp(),
      });
    }

    return groupId;
  }, [uid, currentUser, isDemoMode]);

  const deleteGroup = useCallback(async (groupId) => {
    if (!uid) throw new Error('Not authenticated');

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (group) {
        group.members.forEach((memberId) => {
          if (data.userGroups[memberId]) {
            data.userGroups[memberId] = data.userGroups[memberId].filter((id) => id !== groupId);
          }
        });
        delete data.groups[groupId];
        saveDemoData(data);
      }
    } else {
      // Delete subcollections first
      const subcollections = ['expenses', 'settlements', 'activity'];
      for (const sub of subcollections) {
        const snap = await getDocs(collection(db, 'splitup_groups', groupId, sub));
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        if (!snap.empty) await batch.commit();
      }
      await deleteDoc(doc(db, 'splitup_groups', groupId));
    }
  }, [uid, isDemoMode]);

  // ════════════════════════════════════════
  // MEMBER OPERATIONS
  // ════════════════════════════════════════

  const lookupUserByEmail = useCallback(async (email) => {
    const normalizedEmail = email.toLowerCase().trim();

    if (isDemoMode) {
      // Check mock auth users
      try {
        const mockUsersRaw = localStorage.getItem('artho_mock_auth_users');
        if (mockUsersRaw) {
          const mockUsers = JSON.parse(mockUsersRaw);
          const found = mockUsers[normalizedEmail];
          if (found) {
            return { uid: found.uid, email: found.email, fullName: found.fullName };
          }
        }
      } catch { /* ignore */ }
      return null;
    } else {
      // Query Firestore users collection by email
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('profile.email', '==', normalizedEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          const data = userDoc.data();
          return {
            uid: userDoc.id,
            email: data.profile?.email || normalizedEmail,
            fullName: data.profile?.fullName || 'User',
          };
        }
      } catch (e) {
        console.error('Error looking up user by email:', e);
      }
      return null;
    }
  }, [isDemoMode]);

  const addMember = useCallback(async (groupId, memberInfo) => {
    if (!uid) throw new Error('Not authenticated');

    const { uid: memberUid, email: memberEmail, fullName: memberName } = memberInfo;
    const now = new Date().toISOString();

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (!group) throw new Error('Group not found');

      if (!group.members.includes(memberUid)) {
        group.members.push(memberUid);
      }
      group.memberDetails[memberUid] = {
        name: memberName || memberEmail,
        email: memberEmail,
        role: 'member',
        joinedAt: now,
      };
      group.updatedAt = now;

      // Index user's groups
      if (!data.userGroups[memberUid]) data.userGroups[memberUid] = [];
      if (!data.userGroups[memberUid].includes(groupId)) {
        data.userGroups[memberUid].push(groupId);
      }

      // Add activity
      const actId = generateId();
      group.activity[actId] = {
        id: actId,
        type: 'member_joined',
        userId: memberUid,
        userName: memberName || memberEmail,
        description: `was added to the group`,
        createdAt: now,
      };

      saveDemoData(data);
    } else {
      const groupRef = doc(db, 'splitup_groups', groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(memberUid),
        [`memberDetails.${memberUid}`]: {
          name: memberName || memberEmail,
          email: memberEmail,
          role: 'member',
          joinedAt: now,
        },
        updatedAt: serverTimestamp(),
      });

      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      await setDoc(actRef, {
        type: 'member_joined',
        userId: memberUid,
        userName: memberName || memberEmail,
        description: `was added to the group`,
        createdAt: serverTimestamp(),
      });
    }
  }, [uid, isDemoMode]);

  const removeMember = useCallback(async (groupId, memberUid) => {
    if (!uid) throw new Error('Not authenticated');

    const now = new Date().toISOString();

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (!group) return;

      const memberName = group.memberDetails[memberUid]?.name || 'Unknown';
      group.members = group.members.filter((id) => id !== memberUid);
      delete group.memberDetails[memberUid];
      group.updatedAt = now;

      if (data.userGroups[memberUid]) {
        data.userGroups[memberUid] = data.userGroups[memberUid].filter((id) => id !== groupId);
      }

      const actId = generateId();
      group.activity[actId] = {
        id: actId,
        type: 'member_removed',
        userId: memberUid,
        userName: memberName,
        description: `was removed from the group`,
        createdAt: now,
      };

      saveDemoData(data);
    } else {
      const groupRef = doc(db, 'splitup_groups', groupId);
      const groupSnap = await getDoc(groupRef);
      const memberName = groupSnap.data()?.memberDetails?.[memberUid]?.name || 'Unknown';

      await updateDoc(groupRef, {
        members: arrayRemove(memberUid),
        [`memberDetails.${memberUid}`]: null,
        updatedAt: serverTimestamp(),
      });

      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      await setDoc(actRef, {
        type: 'member_removed',
        userId: memberUid,
        userName: memberName,
        description: `was removed from the group`,
        createdAt: serverTimestamp(),
      });
    }
  }, [uid, isDemoMode]);

  // ════════════════════════════════════════
  // EXPENSE OPERATIONS
  // ════════════════════════════════════════

  const addExpense = useCallback(async (groupId, expenseData) => {
    if (!uid) throw new Error('Not authenticated');

    const expenseId = generateId();
    const now = new Date().toISOString();

    const expense = {
      id: expenseId,
      description: expenseData.description || 'Untitled Expense',
      amount: expenseData.amount || 0,
      paidBy: expenseData.paidBy || uid,
      participants: expenseData.participants || [],
      splitType: expenseData.splitType || 'equal',
      splits: expenseData.splits || {},
      category: expenseData.category || 'General',
      notes: expenseData.notes || '',
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
    };

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (!group) throw new Error('Group not found');

      group.expenses[expenseId] = expense;
      group.totalExpense = Object.values(group.expenses).reduce((s, e) => s + (e.amount || 0), 0);
      group.updatedAt = now;

      const payerName = group.memberDetails[expense.paidBy]?.name || 'Someone';
      const actId = generateId();
      group.activity[actId] = {
        id: actId,
        type: 'expense_added',
        userId: uid,
        userName: payerName,
        description: `added "${expense.description}" — ₹${expense.amount.toLocaleString('en-IN')}`,
        amount: expense.amount,
        createdAt: now,
      };

      saveDemoData(data);
    } else {
      const expRef = doc(db, 'splitup_groups', groupId, 'expenses', expenseId);
      await setDoc(expRef, {
        ...expense,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update group total
      const groupRef = doc(db, 'splitup_groups', groupId);
      const groupSnap = await getDoc(groupRef);
      const currentTotal = groupSnap.data()?.totalExpense || 0;
      await updateDoc(groupRef, {
        totalExpense: currentTotal + expense.amount,
        updatedAt: serverTimestamp(),
      });

      // Activity
      const payerName = groupSnap.data()?.memberDetails?.[expense.paidBy]?.name || 'Someone';
      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      await setDoc(actRef, {
        type: 'expense_added',
        userId: uid,
        userName: payerName,
        description: `added "${expense.description}" — ₹${expense.amount.toLocaleString('en-IN')}`,
        amount: expense.amount,
        createdAt: serverTimestamp(),
      });
    }

    return expenseId;
  }, [uid, isDemoMode]);

  const editExpense = useCallback(async (groupId, expenseId, updates) => {
    if (!uid) throw new Error('Not authenticated');

    const now = new Date().toISOString();

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (!group || !group.expenses[expenseId]) throw new Error('Expense not found');

      group.expenses[expenseId] = { ...group.expenses[expenseId], ...updates, updatedAt: now };
      group.totalExpense = Object.values(group.expenses).reduce((s, e) => s + (e.amount || 0), 0);
      group.updatedAt = now;

      const actId = generateId();
      group.activity[actId] = {
        id: actId,
        type: 'expense_edited',
        userId: uid,
        userName: group.memberDetails[uid]?.name || 'Someone',
        description: `edited "${updates.description || group.expenses[expenseId].description}"`,
        createdAt: now,
      };

      saveDemoData(data);
    } else {
      const expRef = doc(db, 'splitup_groups', groupId, 'expenses', expenseId);
      await updateDoc(expRef, { ...updates, updatedAt: serverTimestamp() });

      // Recalculate total
      const allExps = await getDocs(collection(db, 'splitup_groups', groupId, 'expenses'));
      const total = allExps.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      await updateDoc(doc(db, 'splitup_groups', groupId), {
        totalExpense: total,
        updatedAt: serverTimestamp(),
      });

      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      const groupSnap = await getDoc(doc(db, 'splitup_groups', groupId));
      await setDoc(actRef, {
        type: 'expense_edited',
        userId: uid,
        userName: groupSnap.data()?.memberDetails?.[uid]?.name || 'Someone',
        description: `edited "${updates.description || 'an expense'}"`,
        createdAt: serverTimestamp(),
      });
    }
  }, [uid, isDemoMode]);

  const deleteExpense = useCallback(async (groupId, expenseId) => {
    if (!uid) throw new Error('Not authenticated');

    const now = new Date().toISOString();

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (!group) return;

      const expense = group.expenses[expenseId];
      const expName = expense?.description || 'an expense';
      delete group.expenses[expenseId];
      group.totalExpense = Object.values(group.expenses).reduce((s, e) => s + (e.amount || 0), 0);
      group.updatedAt = now;

      const actId = generateId();
      group.activity[actId] = {
        id: actId,
        type: 'expense_deleted',
        userId: uid,
        userName: group.memberDetails[uid]?.name || 'Someone',
        description: `deleted "${expName}"`,
        createdAt: now,
      };

      saveDemoData(data);
    } else {
      const expRef = doc(db, 'splitup_groups', groupId, 'expenses', expenseId);
      const expSnap = await getDoc(expRef);
      const expName = expSnap.data()?.description || 'an expense';
      await deleteDoc(expRef);

      // Recalculate total
      const allExps = await getDocs(collection(db, 'splitup_groups', groupId, 'expenses'));
      const total = allExps.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      const groupRef = doc(db, 'splitup_groups', groupId);
      await updateDoc(groupRef, { totalExpense: total, updatedAt: serverTimestamp() });

      const groupSnap = await getDoc(groupRef);
      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      await setDoc(actRef, {
        type: 'expense_deleted',
        userId: uid,
        userName: groupSnap.data()?.memberDetails?.[uid]?.name || 'Someone',
        description: `deleted "${expName}"`,
        createdAt: serverTimestamp(),
      });
    }
  }, [uid, isDemoMode]);

  // ════════════════════════════════════════
  // SETTLEMENT OPERATIONS
  // ════════════════════════════════════════

  const settleBalance = useCallback(async (groupId, settlementData) => {
    if (!uid) throw new Error('Not authenticated');

    const settlementId = generateId();
    const now = new Date().toISOString();

    const settlement = {
      id: settlementId,
      from: settlementData.from,
      to: settlementData.to,
      amount: settlementData.amount,
      type: settlementData.type || 'cash',
      notes: settlementData.notes || '',
      status: 'completed',
      createdAt: now,
    };

    if (isDemoMode) {
      const data = getDemoData();
      const group = data.groups[groupId];
      if (!group) throw new Error('Group not found');

      group.settlements[settlementId] = settlement;
      group.updatedAt = now;

      const fromName = group.memberDetails[settlement.from]?.name || 'Someone';
      const toName = group.memberDetails[settlement.to]?.name || 'Someone';

      const actId = generateId();
      group.activity[actId] = {
        id: actId,
        type: 'settlement',
        userId: uid,
        userName: fromName,
        description: `settled ₹${settlement.amount.toLocaleString('en-IN')} with ${toName}`,
        amount: settlement.amount,
        createdAt: now,
      };

      saveDemoData(data);
    } else {
      const setRef = doc(db, 'splitup_groups', groupId, 'settlements', settlementId);
      await setDoc(setRef, { ...settlement, createdAt: serverTimestamp() });

      const groupSnap = await getDoc(doc(db, 'splitup_groups', groupId));
      const fromName = groupSnap.data()?.memberDetails?.[settlement.from]?.name || 'Someone';
      const toName = groupSnap.data()?.memberDetails?.[settlement.to]?.name || 'Someone';

      const actRef = doc(collection(db, 'splitup_groups', groupId, 'activity'));
      await setDoc(actRef, {
        type: 'settlement',
        userId: uid,
        userName: fromName,
        description: `settled ₹${settlement.amount.toLocaleString('en-IN')} with ${toName}`,
        amount: settlement.amount,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'splitup_groups', groupId), { updatedAt: serverTimestamp() });
    }

    return settlementId;
  }, [uid, isDemoMode]);

  // ════════════════════════════════════════
  // REAL-TIME SUBSCRIPTIONS
  // ════════════════════════════════════════

  /**
   * Subscribe to all groups the current user belongs to.
   * Returns an unsubscribe function.
   */
  const subscribeToGroups = useCallback((callback) => {
    if (!uid) return () => {};

    if (isDemoMode) {
      // For demo mode, poll localStorage every 500ms
      const poll = () => {
        const data = getDemoData();
        const myGroupIds = data.userGroups[uid] || [];
        const groups = myGroupIds
          .map((gid) => data.groups[gid])
          .filter(Boolean);
        callback(groups);
      };
      poll();
      const interval = setInterval(poll, 500);
      return () => clearInterval(interval);
    } else {
      const q = query(
        collection(db, 'splitup_groups'),
        where('members', 'array-contains', uid)
      );
      return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(groups);
      }, (err) => {
        console.error('Error subscribing to groups:', err);
        callback([]);
      });
    }
  }, [uid, isDemoMode]);

  /**
   * Subscribe to a specific group's expenses, settlements, and activity.
   * Returns an unsubscribe function.
   */
  const subscribeToGroupDetails = useCallback((groupId, callbacks) => {
    if (!groupId) return () => {};

    const { onExpenses, onSettlements, onActivity, onGroup } = callbacks;

    if (isDemoMode) {
      const poll = () => {
        const data = getDemoData();
        const group = data.groups[groupId];
        if (!group) return;

        if (onGroup) onGroup(group);
        if (onExpenses) onExpenses(Object.values(group.expenses || {}));
        if (onSettlements) onSettlements(Object.values(group.settlements || {}));
        if (onActivity) {
          const activities = Object.values(group.activity || {})
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          onActivity(activities);
        }
      };
      poll();
      const interval = setInterval(poll, 500);
      return () => clearInterval(interval);
    } else {
      const unsubs = [];

      // Group doc
      if (onGroup) {
        unsubs.push(
          onSnapshot(doc(db, 'splitup_groups', groupId), (snap) => {
            if (snap.exists()) onGroup({ id: snap.id, ...snap.data() });
          })
        );
      }

      // Expenses subcollection
      if (onExpenses) {
        unsubs.push(
          onSnapshot(collection(db, 'splitup_groups', groupId, 'expenses'), (snap) => {
            onExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          })
        );
      }

      // Settlements subcollection
      if (onSettlements) {
        unsubs.push(
          onSnapshot(collection(db, 'splitup_groups', groupId, 'settlements'), (snap) => {
            onSettlements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          })
        );
      }

      // Activity subcollection
      if (onActivity) {
        unsubs.push(
          onSnapshot(collection(db, 'splitup_groups', groupId, 'activity'), (snap) => {
            const activities = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a, b) => {
                const ta = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const tb = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return tb - ta;
              });
            onActivity(activities);
          })
        );
      }

      return () => unsubs.forEach((u) => u());
    }
  }, [isDemoMode]);

  return {
    createGroup,
    deleteGroup,
    lookupUserByEmail,
    addMember,
    removeMember,
    addExpense,
    editExpense,
    deleteExpense,
    settleBalance,
    subscribeToGroups,
    subscribeToGroupDetails,
  };
}
