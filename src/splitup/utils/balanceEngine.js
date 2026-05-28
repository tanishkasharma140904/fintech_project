/**
 * balanceEngine.js
 * Core balance computation engine for SplitUp.
 * Computes who-owes-whom from expenses and settlements.
 * Implements the "Simplify Balances" algorithm to minimize transactions.
 */

import { roundCurrency } from './splitCalculators';

/**
 * Compute raw balances from expenses and settlements.
 * Returns a map of directed debts: { fromUid: { toUid: amount } }
 *
 * Logic: For each expense, the payer is owed their share by each participant.
 * Settlements reduce these debts.
 *
 * @param {Array} expenses - Array of expense objects with { paidBy, splits: { uid: amount } }
 * @param {Array} settlements - Array of settlement objects with { from, to, amount }
 * @param {string[]} memberIds - All member UIDs in the group
 * @returns {{ [fromUid: string]: { [toUid: string]: number } }}
 */
export function computeRawBalances(expenses = [], settlements = []) {
  // Net balance per user: positive = net creditor, negative = net debtor
  const netBalances = {};

  // Process all expenses
  expenses.forEach((expense) => {
    const { paidBy, splits } = expense;
    if (!paidBy || !splits) return;

    Object.entries(splits).forEach(([uid, share]) => {
      if (uid === paidBy) return; // Skip self

      // The payer gains credit, the participant gains debt
      netBalances[paidBy] = (netBalances[paidBy] || 0) + share;
      netBalances[uid] = (netBalances[uid] || 0) - share;
    });
  });

  // Process all settlements (settlements reduce debts)
  settlements.forEach((settlement) => {
    const { from, to, amount } = settlement;
    if (!from || !to || !amount) return;

    // 'from' paid 'to', so from's debt decreases, to's credit decreases
    netBalances[from] = (netBalances[from] || 0) + amount;
    netBalances[to] = (netBalances[to] || 0) - amount;
  });

  // Round all values
  Object.keys(netBalances).forEach((uid) => {
    netBalances[uid] = roundCurrency(netBalances[uid]);
  });

  return netBalances;
}

/**
 * Get net balance for each member.
 * Positive = others owe you (you're a creditor)
 * Negative = you owe others (you're a debtor)
 *
 * @param {Array} expenses
 * @param {Array} settlements
 * @returns {{ [uid: string]: number }}
 */
export function getNetBalances(expenses = [], settlements = []) {
  return computeRawBalances(expenses, settlements);
}

/**
 * Compute detailed who-owes-whom directed debts.
 * Returns an array of { from, to, amount } representing minimum transactions.
 *
 * @param {Array} expenses
 * @param {Array} settlements
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function computeDetailedBalances(expenses = [], settlements = []) {
  const netBalances = computeRawBalances(expenses, settlements);
  return simplifyDebts(netBalances);
}

/**
 * SIMPLIFY BALANCES ALGORITHM
 * 
 * Uses a greedy approach to minimize the number of transactions:
 * 1. Compute net balance for each member
 * 2. Separate into creditors (positive) and debtors (negative)
 * 3. Sort both lists by absolute amount (descending)
 * 4. Match largest debtor with largest creditor iteratively
 *
 * Example:
 *   Without simplify: A→B ₹300, B→C ₹300
 *   With simplify:    A→C ₹300 (1 transaction instead of 2)
 *
 * @param {{ [uid: string]: number }} netBalances - Net balance per member
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function simplifyDebts(netBalances) {
  const transactions = [];

  // Build creditor and debtor lists
  const creditors = []; // people who are owed money (positive balance)
  const debtors = [];   // people who owe money (negative balance)

  Object.entries(netBalances).forEach(([uid, balance]) => {
    const rounded = roundCurrency(balance);
    if (rounded > 0.01) {
      creditors.push({ uid, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ uid, amount: Math.abs(rounded) });
    }
  });

  // Sort descending by amount for greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const settleAmount = roundCurrency(Math.min(creditor.amount, debtor.amount));

    if (settleAmount > 0.01) {
      transactions.push({
        from: debtor.uid,
        to: creditor.uid,
        amount: settleAmount,
      });
    }

    creditor.amount = roundCurrency(creditor.amount - settleAmount);
    debtor.amount = roundCurrency(debtor.amount - settleAmount);

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return transactions;
}

/**
 * Compute unsimplified (direct) debts from expenses.
 * Shows every individual debt as it was created by each expense.
 *
 * @param {Array} expenses
 * @param {Array} settlements
 * @returns {Array<{ from: string, to: string, amount: number }>}
 */
export function computeDirectDebts(expenses = [], settlements = []) {
  // Track directed debts: key = "from->to", value = amount
  const debtMap = {};

  expenses.forEach((expense) => {
    const { paidBy, splits } = expense;
    if (!paidBy || !splits) return;

    Object.entries(splits).forEach(([uid, share]) => {
      if (uid === paidBy) return;

      const key = `${uid}->${paidBy}`;
      const reverseKey = `${paidBy}->${uid}`;

      if (debtMap[reverseKey]) {
        // Offset against reverse debt
        debtMap[reverseKey] -= share;
        if (debtMap[reverseKey] < 0.01) {
          const overflow = Math.abs(debtMap[reverseKey]);
          delete debtMap[reverseKey];
          if (overflow > 0.01) {
            debtMap[key] = (debtMap[key] || 0) + overflow;
          }
        }
      } else {
        debtMap[key] = (debtMap[key] || 0) + share;
      }
    });
  });

  // Apply settlements
  settlements.forEach((settlement) => {
    const { from, to, amount } = settlement;
    const key = `${from}->${to}`;
    const reverseKey = `${to}->${from}`;

    if (debtMap[reverseKey]) {
      debtMap[reverseKey] = roundCurrency(debtMap[reverseKey] - amount);
      if (debtMap[reverseKey] < 0.01) {
        delete debtMap[reverseKey];
      }
    }
  });

  // Convert map to array
  return Object.entries(debtMap)
    .filter(([, amount]) => amount > 0.01)
    .map(([key, amount]) => {
      const [from, to] = key.split('->');
      return { from, to, amount: roundCurrency(amount) };
    });
}

/**
 * Get the total group spending from expenses.
 * @param {Array} expenses
 * @returns {number}
 */
export function getTotalGroupSpending(expenses = []) {
  return roundCurrency(expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0));
}

/**
 * Get a user's total personal burden from shared expenses.
 * (What they actually owe, not what the full expense was)
 *
 * @param {string} uid - User's UID
 * @param {Array} expenses
 * @returns {{ totalParticipated: number, personalShare: number, recoverable: number }}
 */
export function getUserBurdenAnalysis(uid, expenses = []) {
  let totalParticipated = 0;
  let personalShare = 0;
  let totalPaidByUser = 0;

  expenses.forEach((expense) => {
    const { paidBy, splits, amount } = expense;
    if (!splits) return;

    if (splits[uid] !== undefined) {
      totalParticipated += amount;
      personalShare += splits[uid];
    }

    if (paidBy === uid) {
      totalPaidByUser += amount;
    }
  });

  return {
    totalParticipated: roundCurrency(totalParticipated),
    personalShare: roundCurrency(personalShare),
    recoverable: roundCurrency(totalPaidByUser - personalShare > 0 ? totalPaidByUser - personalShare : 0),
    totalPaid: roundCurrency(totalPaidByUser),
  };
}
