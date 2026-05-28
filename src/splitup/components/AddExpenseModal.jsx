/**
 * AddExpenseModal.jsx
 * Premium glassmorphism modal for creating/editing shared expenses.
 * Supports Equal, Exact, and Percentage split types with real-time previews.
 */

import { useState, useEffect, useMemo } from 'react';
import { equalSplit, exactSplit, percentageSplit, formatINR, roundCurrency } from '../utils/splitCalculators';
import MemberAvatar from './MemberAvatar';

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍽️' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'rent', label: 'Rent & Housing', icon: '🏠' },
  { id: 'utilities', label: 'Utilities & Bills', icon: '💡' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'health', label: 'Healthcare', icon: '🏥' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱' },
  { id: 'general', label: 'General', icon: '📝' },
  { id: 'other', label: 'Other', icon: '💰' },
];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  members = {},
  currentUid,
  editingExpense = null,
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUid);
  const [splitType, setSplitType] = useState('equal');
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [exactAmounts, setExactAmounts] = useState({});
  const [percentages, setPercentages] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const memberEntries = Object.entries(members);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setDescription(editingExpense.description || '');
        setAmount(String(editingExpense.amount || ''));
        setPaidBy(editingExpense.paidBy || currentUid);
        setSplitType(editingExpense.splitType || 'equal');
        setCategory(editingExpense.category || 'general');
        setNotes(editingExpense.notes || '');
        setSelectedParticipants(editingExpense.participants || Object.keys(members));
      } else {
        setDescription('');
        setAmount('');
        setPaidBy(currentUid);
        setSplitType('equal');
        setCategory('general');
        setNotes('');
        setSelectedParticipants(Object.keys(members));
        setExactAmounts({});
        setPercentages({});
      }
    }
  }, [isOpen, editingExpense, currentUid, members]);

  const numAmount = parseFloat(amount) || 0;

  // Compute splits preview
  const splitPreview = useMemo(() => {
    if (numAmount <= 0 || selectedParticipants.length === 0) return {};

    switch (splitType) {
      case 'equal':
        return equalSplit(numAmount, selectedParticipants);
      case 'exact': {
        const result = exactSplit(numAmount, exactAmounts);
        return result.splits;
      }
      case 'percentage': {
        const result = percentageSplit(numAmount, percentages);
        return result.splits;
      }
      default:
        return equalSplit(numAmount, selectedParticipants);
    }
  }, [numAmount, splitType, selectedParticipants, exactAmounts, percentages]);

  const toggleParticipant = (uid) => {
    setSelectedParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async () => {
    if (!description.trim() || numAmount <= 0 || selectedParticipants.length === 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        amount: numAmount,
        paidBy,
        participants: selectedParticipants,
        splitType,
        splits: splitPreview,
        category,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error submitting expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const splitTotal = Object.values(splitPreview).reduce((s, v) => s + v, 0);
  const splitValid = splitType === 'equal' || Math.abs(splitTotal - numAmount) < 0.1;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
      style={{
        background: 'rgba(3, 7, 18, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden flex flex-col"
        style={{
          background: 'rgba(17, 24, 39, 0.97)',
          borderColor: 'var(--bg-border)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0,212,170,0.3)',
          maxHeight: '85vh',
        }}
      >
        {/* Accent line */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Split costs with your group members
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Description */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at restaurant"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--bg-border)'}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none border transition-all font-mono"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--bg-border)'}
              />
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Paid By
            </label>
            <div className="flex flex-wrap gap-2">
              {memberEntries.map(([uid, info]) => (
                <button
                  key={uid}
                  onClick={() => setPaidBy(uid)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
                  style={{
                    background: paidBy === uid ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                    borderColor: paidBy === uid ? 'rgba(0,212,170,0.3)' : 'var(--bg-border)',
                    color: paidBy === uid ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <MemberAvatar name={info.name || info.email} size={20} fontSize={8} />
                  {uid === currentUid ? 'You' : (info.name || info.email)}
                </button>
              ))}
            </div>
          </div>

          {/* Split Type Tabs */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Split Type
            </label>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              {['equal', 'exact', 'percentage'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSplitType(type)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize"
                  style={{
                    background: splitType === type ? 'var(--bg-surface)' : 'transparent',
                    color: splitType === type ? 'var(--accent-primary)' : 'var(--text-muted)',
                    border: splitType === type ? '1px solid rgba(0,212,170,0.2)' : '1px solid transparent',
                  }}
                >
                  {type === 'percentage' ? '% Split' : type === 'exact' ? 'Exact ₹' : 'Equal ÷'}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Split Among ({selectedParticipants.length} selected)
            </label>
            <div className="space-y-1.5">
              {memberEntries.map(([uid, info]) => {
                const isSelected = selectedParticipants.includes(uid);
                const share = splitPreview[uid] || 0;
                const name = uid === currentUid ? 'You' : (info.name || info.email);

                return (
                  <div
                    key={uid}
                    className="flex items-center gap-3 p-2.5 rounded-xl border transition-all"
                    style={{
                      background: isSelected ? 'rgba(0,212,170,0.03)' : 'var(--bg-elevated)',
                      borderColor: isSelected ? 'rgba(0,212,170,0.15)' : 'var(--bg-border)',
                      opacity: isSelected ? 1 : 0.5,
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleParticipant(uid)}
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all border"
                      style={{
                        background: isSelected ? 'var(--accent-primary)' : 'transparent',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-border)',
                      }}
                    >
                      {isSelected && <span className="text-[10px] text-white font-bold">✓</span>}
                    </button>

                    <MemberAvatar name={info.name || info.email} size={24} fontSize={8} />
                    <span className="text-xs font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
                      {name}
                    </span>

                    {/* Split input for exact/percentage */}
                    {isSelected && splitType === 'exact' && (
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--text-muted)' }}>₹</span>
                        <input
                          type="number"
                          value={exactAmounts[uid] || ''}
                          onChange={(e) => setExactAmounts(prev => ({ ...prev, [uid]: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-5 pr-2 py-1.5 rounded-lg text-xs font-mono outline-none border"
                          style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
                          placeholder="0"
                        />
                      </div>
                    )}

                    {isSelected && splitType === 'percentage' && (
                      <div className="relative w-20">
                        <input
                          type="number"
                          value={percentages[uid] || ''}
                          onChange={(e) => setPercentages(prev => ({ ...prev, [uid]: parseFloat(e.target.value) || 0 }))}
                          className="w-full pr-5 pl-2 py-1.5 rounded-lg text-xs font-mono outline-none border text-right"
                          style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
                          placeholder="0"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--text-muted)' }}>%</span>
                      </div>
                    )}

                    {/* Share preview */}
                    {isSelected && numAmount > 0 && (
                      <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                        {formatINR(share)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border"
                  style={{
                    background: category === cat.id ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                    borderColor: category === cat.id ? 'rgba(0,212,170,0.25)' : 'var(--bg-border)',
                    color: category === cat.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any details..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all resize-none"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--bg-border)'}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          {/* Split summary */}
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {numAmount > 0 && selectedParticipants.length > 0 && (
              <span>
                {formatINR(numAmount)} ÷ {selectedParticipants.length} people
                {splitType === 'equal' && ` = ${formatINR(numAmount / selectedParticipants.length)}/person`}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all border"
              style={{
                background: 'transparent',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || numAmount <= 0 || selectedParticipants.length === 0 || submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold transition-all border"
              style={{
                background: description.trim() && numAmount > 0 && selectedParticipants.length > 0
                  ? 'var(--accent-primary)'
                  : 'var(--bg-elevated)',
                borderColor: 'transparent',
                color: description.trim() && numAmount > 0 && selectedParticipants.length > 0
                  ? '#000'
                  : 'var(--text-muted)',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
