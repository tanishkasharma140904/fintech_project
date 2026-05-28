/**
 * MemberAvatar.jsx
 * Reusable avatar component with initials-based rendering and gradient backgrounds.
 * Supports single display and stacked group display.
 */

const GRADIENT_PALETTE = [
  'linear-gradient(135deg, #00d4aa, #4d9fff)',
  'linear-gradient(135deg, #c084fc, #f472b6)',
  'linear-gradient(135deg, #f5a623, #ff6b6b)',
  'linear-gradient(135deg, #4d9fff, #06b6d4)',
  'linear-gradient(135deg, #10d078, #34d399)',
  'linear-gradient(135deg, #f472b6, #c084fc)',
  'linear-gradient(135deg, #fbbf24, #f97316)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
];

function getGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MemberAvatar({
  name = '',
  size = 32,
  fontSize = 11,
  className = '',
  style = {},
  showTooltip = true,
}) {
  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold select-none ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: gradient,
        color: '#fff',
        fontSize,
        letterSpacing: '-0.02em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        ...style,
      }}
      title={showTooltip ? name : undefined}
    >
      {initials}
    </div>
  );
}

/**
 * Stacked avatar group showing overlapping member avatars.
 */
export function AvatarStack({
  members = [],
  maxShow = 4,
  size = 28,
  fontSize = 9,
}) {
  const visible = members.slice(0, maxShow);
  const remaining = members.length - maxShow;

  return (
    <div className="flex items-center" style={{ marginLeft: '4px' }}>
      {visible.map((member, idx) => (
        <div
          key={member.uid || member.email || idx}
          style={{
            marginLeft: idx === 0 ? 0 : -8,
            zIndex: visible.length - idx,
            position: 'relative',
          }}
        >
          <MemberAvatar
            name={member.name || member.fullName || member.email || '?'}
            size={size}
            fontSize={fontSize}
            style={{
              border: '2px solid var(--bg-surface)',
            }}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center font-bold"
          style={{
            width: size,
            height: size,
            minWidth: size,
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontSize: fontSize - 1,
            border: '2px solid var(--bg-surface)',
            marginLeft: -8,
            zIndex: 0,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
