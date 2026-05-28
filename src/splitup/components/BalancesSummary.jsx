/**
 * BalancesSummary.jsx
 * Visual balance display showing who-owes-whom with simplify toggle.
 * Color-coded with animated bars and settle-up actions.
 */

import { useState, useMemo } from 'react';
import { formatINR } from '../utils/splitCalculators';
import { getNetBalances, simplifyDebts, computeDirectDebts } from '../utils/balanceEngine';
import MemberAvatar from './MemberAvatar';

export default function BalancesSummary({
  expenses = [],
  settlements = [],
  memberDetails = {},
  currentUid,
  onSettleUp,
}) {
  const [simplified, setSimplified] = useState(true);

  const netBalances = useMemo(() => {
    return getNetBalances(expenses, settlements);
  }, [expenses, settlements]);

  const detailedDebts = useMemo(() => {
    if (simplified) {
      return simplifyDebts(netBalances);
    }
    return computeDirectDebts(expenses, settlements);
  }, [netBalances, expenses, settlements, simplified]);

  const getName = (uid) => memberDetails[uid]?.name || memberDetails[uid]?.email || 'Unknown';
  const isYou = (uid) => uid === currentUid;

  // Sort net balances: user first, then by absolute value
  const sortedMembers = useMemo(() => {
    return Object.entries(netBalances)
      .sort((a, b) => {
        if (a[0] === currentUid) return -1;
        if (b[0] === currentUid) return 1;
        return Math.abs(b[1]) - Math.abs(a[1]);
      });
  }, [netBalances, currentUid]);

  const maxBalance = useMemo(() => {
    return Math.max(...sortedMembers.map(([, v]) => Math.abs(v)), 1);
  }, [sortedMembers]);

  return (
    <div className="space-y-5">
      {/* Net Balances Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Net Balances
          </h4>
        </div>

        <div className="space-y-2">
          {sortedMembers.map(([uid, balance]) => {
            const isPositive = balance > 0;
            const isZero = Math.abs(balance) < 0.01;
            const barWidth = Math.max(4, (Math.abs(balance) / maxBalance) * 100);

            return (
              <div
                key={uid}
                className="p-3 rounded-xl border transition-all duration-200"
                style={{
                  background: isYou(uid) ? 'rgba(0,212,170,0.04)' : 'var(--bg-elevated)',
                  borderColor: isYou(uid) ? 'rgba(0,212,170,0.15)' : 'var(--bg-border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar name={getName(uid)} size={30} fontSize={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {isYou(uid) ? 'You' : getName(uid)}
                      </span>
                      <span
                        className="text-xs font-bold font-mono"
                        style={{
                          color: isZero ? 'var(--text-muted)' : isPositive ? 'var(--green)' : 'var(--red)',
                        }}
                      >
                        {isZero ? 'Settled ✓' : isPositive ? `gets back ${formatINR(balance)}` : `owes ${formatINR(Math.abs(balance))}`}
                      </span>
                    </div>
                    {/* Balance bar */}
                    {!isZero && (
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-border)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${barWidth}%`,
                            background: isPositive
                              ? 'linear-gradient(90deg, var(--green), #34d399)'
                              : 'linear-gradient(90deg, var(--red), #fb7185)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplify Toggle */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Simplify Balances
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Minimize total transactions needed
            </p>
          </div>
        </div>
        <button
          onClick={() => setSimplified(!simplified)}
          className="relative w-10 h-5 rounded-full transition-all duration-300"
          style={{
            background: simplified ? 'var(--accent-primary)' : 'var(--bg-border)',
          }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300"
            style={{ left: simplified ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Detailed Debts */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          {simplified ? 'Simplified Settlements' : 'All Debts'} ({detailedDebts.length})
        </h4>

        {detailedDebts.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-2xl">✨</span>
            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
              All settled up!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {detailedDebts.map((debt, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--bg-border)',
                }}
              >
                <MemberAvatar name={getName(debt.from)} size={28} fontSize={9} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {isYou(debt.from) ? 'You' : getName(debt.from)}
                    </span>
                    {' owes '}
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {isYou(debt.to) ? 'you' : getName(debt.to)}
                    </span>
                  </p>
                </div>
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color: 'var(--red)' }}
                >
                  {formatINR(debt.amount)}
                </span>
                {onSettleUp && (isYou(debt.from) || isYou(debt.to)) && (
                  <button
                    onClick={() => onSettleUp(debt)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200"
                    style={{
                      background: 'rgba(0,212,170,0.1)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(0,212,170,0.2)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0,212,170,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0,212,170,0.1)';
                    }}
                  >
                    Settle
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
