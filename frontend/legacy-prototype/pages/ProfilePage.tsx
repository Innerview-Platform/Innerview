import { Avatar } from '../components/Sidebar'
import { currentUser, interviews, feedbackList } from '../data/mockData'

export default function ProfilePage() {
  const historyInterviews = interviews.filter(i => i.status === 'Completed' || i.status === 'Scheduled')

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>Profile</h1>

      {/* Header card */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={currentUser.name} size={80} />
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#22C55E', border: '2px solid var(--surface)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>{currentUser.name}</h2>
              <span className="badge badge-primary" style={{ fontSize: 12 }}>{currentUser.profile.experienceLevel}</span>
              <span className="badge badge-neutral" style={{ fontSize: 12 }}>{currentUser.profile.preferredRole}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{currentUser.rating}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>avg rating</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{currentUser.interviewCount}</span> interviews
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{feedbackList.length}</span> feedback received
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 500 }}>
              {currentUser.profile.bio}
            </p>
          </div>
          <button className="btn-secondary" style={{ flexShrink: 0 }}>
            <EditIcon /> Edit Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Interview History */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Interview History</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {historyInterviews.map((iv, i) => (
                <div key={iv.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < historyInterviews.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
                    <TypeIcon type={iv.type} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{iv.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      with {iv.partner.name} · {iv.startTime} · as {iv.role}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: iv.status === 'Completed' ? 'var(--text-secondary)' : 'var(--primary)',
                    }}>
                      {iv.status}
                    </span>
                    {'rating' in iv && iv.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', marginTop: 2 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <span style={{ fontSize: 11, color: '#F59E0B' }}>{iv.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Programming Languages */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Programming Languages</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {currentUser.languages.map(lang => (
                <span key={lang} style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'var(--primary-muted)', color: 'var(--primary-hover)',
                  border: '1px solid var(--primary)30', fontFamily: 'var(--font-mono)',
                }}>{lang}</span>
              ))}
            </div>
          </div>

          {/* Interview Preferences */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Interview Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PrefRow label="Preferred Role" value={currentUser.profile.preferredRole} />
              <PrefRow label="Experience Level" value={currentUser.profile.experienceLevel} />
              <PrefRow label="Status" value="Online" dot="#22C55E" />
            </div>
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <StatCard label="Completed" value="21" sub="interviews" />
              <StatCard label="Rating" value="4.7" sub="average" color="#F59E0B" />
              <StatCard label="As Interviewer" value="9" sub="sessions" />
              <StatCard label="As Interviewee" value="14" sub="sessions" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrefRow({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {dot && <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />}
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{value}</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div style={{ background: 'var(--elevated)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || 'var(--text)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'Problem Solving') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
  if (type === 'System Design') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /></svg>
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}

function EditIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> }
