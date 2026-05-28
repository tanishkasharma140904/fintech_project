/**
 * AddMembersModal.jsx
 * Invite members by email with real-time validation against Artho registered users.
 */

import { useState, useCallback } from 'react';
import MemberAvatar from './MemberAvatar';

export default function AddMembersModal({
  isOpen,
  onClose,
  onAddMember,
  lookupUserByEmail,
  existingMembers = [],
  memberDetails = {},
}) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [addedMembers, setAddedMembers] = useState([]);

  const handleSearch = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      setSearchResult(null);
      return;
    }

    // Check if already a member
    const isExisting = existingMembers.some(
      (uid) => memberDetails[uid]?.email?.toLowerCase() === trimmed
    );
    if (isExisting) {
      setError('This user is already a member of this group');
      setSearchResult(null);
      return;
    }

    // Check if already added in this session
    if (addedMembers.some((m) => m.email?.toLowerCase() === trimmed)) {
      setError('This user has already been added');
      setSearchResult(null);
      return;
    }

    setSearching(true);
    setError('');
    setSearchResult(null);

    try {
      const result = await lookupUserByEmail(trimmed);
      if (result) {
        setSearchResult(result);
      } else {
        setError('No Artho account found for this email. The user must sign up first.');
      }
    } catch (err) {
      setError('Failed to lookup user. Please try again.');
      console.error('Lookup error:', err);
    } finally {
      setSearching(false);
    }
  }, [email, lookupUserByEmail, existingMembers, memberDetails, addedMembers]);

  const handleAdd = useCallback(async () => {
    if (!searchResult) return;

    try {
      await onAddMember({
        uid: searchResult.uid,
        email: searchResult.email,
        fullName: searchResult.fullName,
      });
      setAddedMembers((prev) => [...prev, searchResult]);
      setSearchResult(null);
      setEmail('');
    } catch (err) {
      setError('Failed to add member. Please try again.');
      console.error('Add member error:', err);
    }
  }, [searchResult, onAddMember]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResult) {
        handleAdd();
      } else {
        handleSearch();
      }
    }
  };

  if (!isOpen) return null;

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

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Add Members
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Invite Artho users by email address
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

        <div className="px-5 pb-5 space-y-4">
          {/* Email Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSearchResult(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. rahul@gmail.com"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none border transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: error ? 'rgba(255,77,106,0.4)' : 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={searching || !email.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: email.trim() ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: email.trim() ? '#000' : 'var(--text-muted)',
                  opacity: searching ? 0.6 : 1,
                }}
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>
            {error && (
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--red)' }}>
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* Search Result */}
          {searchResult && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{
                background: 'rgba(0,212,170,0.04)',
                borderColor: 'rgba(0,212,170,0.2)',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              <MemberAvatar name={searchResult.fullName} size={36} fontSize={12} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {searchResult.fullName}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {searchResult.email}
                </p>
              </div>
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#000',
                }}
              >
                Add
              </button>
            </div>
          )}

          {/* Added Members This Session */}
          {addedMembers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                Added in this session ({addedMembers.length})
              </p>
              <div className="space-y-1.5">
                {addedMembers.map((member) => (
                  <div
                    key={member.uid}
                    className="flex items-center gap-3 p-2.5 rounded-xl border"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)' }}
                  >
                    <MemberAvatar name={member.fullName || member.email} size={28} fontSize={9} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {member.fullName}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {member.email}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(16,208,120,0.1)', color: 'var(--green)' }}
                    >
                      ✓ Added
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Members */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Current Members ({existingMembers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {existingMembers.map((uid) => {
                const info = memberDetails[uid] || {};
                return (
                  <div
                    key={uid}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-border)' }}
                  >
                    <MemberAvatar name={info.name || info.email || '?'} size={18} fontSize={7} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {info.name || info.email || 'Member'}
                    </span>
                    {info.role === 'owner' && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent-primary)' }}>
                        OWNER
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Done Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all border"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          >
            Done
          </button>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
}
