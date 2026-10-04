import { useState } from 'react'
import { Avatar } from '../components/Sidebar'
import { users } from '../data/mockData'
import type { Page } from '../data/mockData'

interface FindInterviewProps {
  onNavigate: (page: Page) => void
}

export default function FindInterview({ onNavigate }: FindInterviewProps) {
  const [filters, setFilters] = useState({
    type: 'All',
    level: 'All',
    role: 'All',
    language: 'All',
  })
  const [autoMatchLoading, setAutoMatchLoading] = useState(false)
  const [autoMatched, setAutoMatched] = useState(false)

  const handleAutoMatch = () => {
    setAutoMatchLoading(true)
    setTimeout(() => {
      setAutoMatchLoading(false)
      setAutoMatched(true)
    }, 1500)
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Find Your Next Interview</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Connect with developers and practice together.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Filters sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Auto Match CTA */}
          <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, var(--primary)15, var(--secondary)10)', borderColor: 'var(--primary)40' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BoltIcon />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Auto Match Me</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Find a partner based on your profile, role, skills, and availability.
            </p>
            <button
              className="btn-primary"
              onClick={handleAutoMatch}
              disabled={autoMatchLoading}
              style={{ width: '100%', justifyContent: 'center', opacity: autoMatchLoading ? 0.7 : 1 }}
            >
              {autoMatchLoading ? 'Matching...' : autoMatched ? '✓ Matched!' : 'Auto Match Me'}
            </button>
          </div>

          {/* Filters */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</h3>

            <FilterGroup label="Interview Type" value={filters.type} options={['All', 'Problem Solving', 'System Design', 'Technical', 'HR']} onChange={v => setFilters({ ...filters, type: v })} />
            <FilterGroup label="Experience Level" value={filters.level} options={['All', 'Student', 'Fresh Graduate', 'Junior', 'Mid Level', 'Senior']} onChange={v => setFilters({ ...filters, level: v })} />
            <FilterGroup label="Preferred Role" value={filters.role} options={['All', 'Interviewer', 'Interviewee', 'Both']} onChange={v => setFilters({ ...filters, role: v })} />
            <FilterGroup label="Language" value={filters.language} options={['All', 'C++', 'Python', 'Java', 'TypeScript', 'Go']} onChange={v => setFilters({ ...filters, language: v })} />

            <button
              className="btn-ghost"
              onClick={() => setFilters({ type: 'All', level: 'All', role: 'All', language: 'All' })}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* User cards grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{users.length} developers available</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }}>Sort: Match %</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {users.map(user => (
              <UserMatchCard key={user.id} user={user} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserMatchCard({ user, onNavigate }: { user: typeof users[0]; onNavigate: (p: Page) => void }) {
  const [hovering, setHovering] = useState(false)

  return (
    <div
      className="card"
      style={{ padding: 20, transition: 'border-color 0.2s, transform 0.15s', transform: hovering ? 'translateY(-1px)' : 'none', borderColor: hovering ? 'var(--primary)40' : 'var(--border)' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Avatar + status */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={user.name} size={48} />
          {user.isOnline && (
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22C55E', border: '2px solid var(--surface)' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{user.name}</span>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>{user.profile.experienceLevel}</span>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>{user.profile.preferredRole}</span>
            {user.isOnline && <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 500 }}>● Online</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>{user.rating}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.interviewCount} interviews</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Available: {user.availability}</span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {user.profile.bio}
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {user.languages.map(lang => (
              <span key={lang} className="badge badge-neutral" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{lang}</span>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
          {/* Match % */}
          <div style={{ textAlign: 'center' }}>
            <MatchCircle percent={user.matchPercent} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
              Invite
            </button>
            <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchCircle({ percent }: { percent: number }) {
  const size = 60
  const strokeWidth = 4
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--primary)" strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-hover)', lineHeight: 1 }}>{percent}%</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1, marginTop: 1 }}>match</div>
      </div>
    </div>
  )
}

function FilterGroup({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function BoltIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
}
