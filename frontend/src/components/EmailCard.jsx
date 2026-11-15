const AVATAR_COLORS = [
  'var(--avatar-1)', 'var(--avatar-2)', 'var(--avatar-3)',
  'var(--avatar-4)', 'var(--avatar-5)', 'var(--avatar-6)', 'var(--avatar-7)',
]

function getInitials(name) {
  if (!name) return '?'
  // Extract name from "Name <email>" format
  const clean = name.replace(/<.*>/, '').trim()
  const parts = clean.split(/[\s.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (clean[0] || '?').toUpperCase()
}

function getColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function extractName(from) {
  const match = from.match(/^([^<]+)/)
  return match ? match[1].trim().replace(/"/g, '') : from
}

export default function EmailCard({ email, selected, onClick }) {
  const name = extractName(email.from)
  const initials = getInitials(email.from)
  const color = getColor(email.from)

  return (
    <div
      className={`email-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-selected={selected}
    >
      <div className="email-avatar" style={{ background: color }}>
        {initials}
      </div>
      <div className="email-card-content">
        <div className="email-card-top">
          <span className="email-sender">{name}</span>
        </div>
        <div className="email-subject">{email.subject || '(No subject)'}</div>
        <div className="email-snippet">{email.snippet}</div>
      </div>
    </div>
  )
}

