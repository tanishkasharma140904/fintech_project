/**
 * splitCalculators.js
 * Pure utility functions for computing expense splits across participants.
 * Supports: Equal, Exact Amount, and Percentage split types.
 * All amounts in ₹ (INR) with smart rounding.
 */

/**
 * Rounds a currency amount to 2 decimal places.
 */
export function roundCurrency(amount) {
  return Math.round(amount * 100) / 100;
}

/**
 * Equal Split — divides amount equally among participants.
 * The last participant absorbs any rounding remainder.
 *
 * @param {number} amount - Total expense amount
 * @param {string[]} participantIds - Array of participant UIDs
 * @returns {{ [uid: string]: number }} - Map of uid → share
 *
 * Example: equalSplit(2400, ['a','b','c','d']) → { a: 600, b: 600, c: 600, d: 600 }
 * Example: equalSplit(1000, ['a','b','c']) → { a: 333.33, b: 333.33, c: 333.34 }
 */
export function equalSplit(amount, participantIds) {
  if (!participantIds || participantIds.length === 0) return {};
  if (amount <= 0) return participantIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});

  const count = participantIds.length;
  const baseShare = Math.floor((amount / count) * 100) / 100; // floor to 2 decimals
  const totalBase = roundCurrency(baseShare * (count - 1));
  const lastShare = roundCurrency(amount - totalBase);

  const splits = {};
  participantIds.forEach((id, idx) => {
    splits[id] = idx === count - 1 ? lastShare : baseShare;
  });

  return splits;
}

/**
 * Exact Amount Split — each participant pays a specified amount.
 * Validates that all amounts sum to the total.
 *
 * @param {number} totalAmount - Total expense amount
 * @param {{ [uid: string]: number }} exactAmounts - Map of uid → exact amount
 * @returns {{ valid: boolean, splits: { [uid: string]: number }, diff: number }}
 *
 * Example: exactSplit(1200, { a: 500, b: 700 }) → { valid: true, splits: { a: 500, b: 700 }, diff: 0 }
 */
export function exactSplit(totalAmount, exactAmounts) {
  const splits = {};
  let sum = 0;

  Object.entries(exactAmounts).forEach(([uid, amount]) => {
    const rounded = roundCurrency(Math.max(0, amount));
    splits[uid] = rounded;
    sum += rounded;
  });

  sum = roundCurrency(sum);
  const diff = roundCurrency(totalAmount - sum);

  return {
    valid: Math.abs(diff) < 0.02, // tolerance for rounding
    splits,
    diff,
  };
}

/**
 * Percentage Split — each participant pays a percentage of the total.
 * Validates that all percentages sum to 100%.
 * Last participant absorbs rounding remainder.
 *
 * @param {number} amount - Total expense amount
 * @param {{ [uid: string]: number }} percentages - Map of uid → percentage (0-100)
 * @returns {{ valid: boolean, splits: { [uid: string]: number }, totalPercent: number }}
 *
 * Example: percentageSplit(2000, { a: 60, b: 40 }) → { valid: true, splits: { a: 1200, b: 800 } }
 */
export function percentageSplit(amount, percentages) {
  const entries = Object.entries(percentages);
  const totalPercent = roundCurrency(entries.reduce((sum, [, pct]) => sum + pct, 0));

  const splits = {};
  let allocated = 0;

  entries.forEach(([uid, pct], idx) => {
    if (idx === entries.length - 1) {
      // Last participant gets the remainder to avoid rounding issues
      splits[uid] = roundCurrency(amount - allocated);
    } else {
      const share = roundCurrency((pct / 100) * amount);
      splits[uid] = share;
      allocated += share;
    }
  });

  return {
    valid: Math.abs(totalPercent - 100) < 0.1,
    splits,
    totalPercent,
  };
}

/**
 * Computes the splits for an expense based on split type.
 *
 * @param {Object} params
 * @param {number} params.amount - Total expense amount
 * @param {string} params.splitType - 'equal' | 'exact' | 'percentage'
 * @param {string[]} params.participants - Participant UIDs (for equal split)
 * @param {{ [uid: string]: number }} params.exactAmounts - For exact split
 * @param {{ [uid: string]: number }} params.percentages - For percentage split
 * @returns {{ [uid: string]: number }} - Computed splits
 */
export function computeSplits({ amount, splitType, participants, exactAmounts, percentages }) {
  switch (splitType) {
    case 'equal':
      return equalSplit(amount, participants);

    case 'exact': {
      const result = exactSplit(amount, exactAmounts || {});
      return result.splits;
    }

    case 'percentage': {
      const result = percentageSplit(amount, percentages || {});
      return result.splits;
    }

    default:
      return equalSplit(amount, participants);
  }
}

/**
 * Format currency for display.
 * @param {number} amount
 * @returns {string} e.g. "₹1,200.00" or "₹1,200"
 */
export function formatINR(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}₹${formatted}`;
}
