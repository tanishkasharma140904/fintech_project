/**
 * SettleUpModal.jsx
 * Settlement flow modal with amount input, partial settlement support,
 * and settlement type selection (Cash / Manual / External).
 */

import { useState, useEffect } from 'react';
import { formatINR } from '../utils/splitCalculators';
import MemberAvatar from './MemberAvatar';

export default function SettleUpModal({
  isOpen,
  onClose,
  onSubmit,
  debt = null,
  memberDetails = {},
  currentUid,
}) {
  const [amount, setAmount] = useState('');
  const [settlementType, setSettlementType] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && debt) {
      setAmount(String(debt.amount || ''));
      setSettlementType('cash');
      setNotes('');
      setShowSuccess(false);
    }
  }, [isOpen, debt]);

  const getName = (uid) => {
    if (uid === currentUid) return 'You';
    return memberDetails[uid]?.name || memberDetails[uid]?.email || 'Unknown';
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !debt) return;

    setSubmitting(true);
    try {
      await onSubmit({
        from: debt.from,
        to: debt.to,
        amount: numAmount,
        type: settlementType,
        notes: notes.trim(),
      });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Settlement error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !debt) return null;

  const numAmount = parseFloat(amount) || 0;
  const isPartial = numAmount > 0 && numAmount < debt.amount;
  const isOverpay = numAmount > debt.amount;

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
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{
          background: 'rgba(17, 24, 39, 0.97)',
          borderColor: 'var(--bg-border)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0,212,170,0.3)',
        }}
      >
        {/* Accent line */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)' }} />

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4"
              style={{
                background: 'rgba(16,208,120,0.15)',
                border: '2px solid rgba(16,208,120,0.3)',
                animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              ✅
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Settlement Recorded!
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatINR(numAmount)} has been marked as settled
            </p>
            <style>{`
              @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Settle Up
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Transaction Visual */}
              <div
                className="flex items-center justify-center gap-4 py-5 rounded-xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
              >
                <div className="flex flex-col items-center gap-1">
                  <MemberAvatar name={memberDetails[debt.from]?.name || ''} size={40} fontSize={13} />
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getName(debt.from)}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-[1px]" style={{ background: 'var(--accent-primary)' }} />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>
                    {formatINR(debt.amount)}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <MemberAvatar name={memberDetails[debt.to]?.name || ''} size={40} fontSize={13} />
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getName(debt.to)}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Settlement Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 rounded-xl text-base font-mono font-bold outline-none border transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: isOverpay ? 'var(--red)' : 'var(--bg-border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => e.target.style.borderColor = isOverpay ? 'var(--red)' : 'var(--accent-primary)'}
                    onBlur={(e) => e.target.style.borderColor = isOverpay ? 'var(--red)' : 'var(--bg-border)'}
                  />
                </div>
                {isPartial && (
                  <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--yellow)' }}>
                    ⚠️ Partial settlement — {formatINR(debt.amount - numAmount)} will remain
                  </p>
                )}
                {isOverpay && (
                  <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--red)' }}>
                    ⚠️ Amount exceeds the owed balance of {formatINR(debt.amount)}
                  </p>
                )}
              </div>

              {/* Settlement Type */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Payment Method
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: '💵' },
                    { id: 'manual', label: 'Manual', icon: '📝' },
                    { id: 'external', label: 'External', icon: '🔗' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSettlementType(type.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border"
                      style={{
                        background: settlementType === type.id ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                        borderColor: settlementType === type.id ? 'rgba(0,212,170,0.25)' : 'var(--bg-border)',
                        color: settlementType === type.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                      }}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid via UPI"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
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
                  onClick={handleSubmit}
                  disabled={numAmount <= 0 || isOverpay || submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: numAmount > 0 && !isOverpay ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: numAmount > 0 && !isOverpay ? '#000' : 'var(--text-muted)',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Recording...' : 'Record Settlement'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
