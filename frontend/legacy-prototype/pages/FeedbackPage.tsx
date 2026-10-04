import { Avatar } from '../components/Sidebar'
import { feedbackList } from '../data/mockData'
import type { Page } from '../data/mockData'

interface FeedbackPageProps {
  onNavigate: (page: Page) => void
}

export default function FeedbackPage({ onNavigate }: FeedbackPageProps) {
  const avg = feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Interview Feedback</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Review what your interview partners said about your performance.</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="card" style={{ padding: 28, marginBottom: 20, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', color: '#F59E0B', lineHeight: 1 }}>{avg.toFixed(1)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>/ 5.0 average</div>
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 8 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.round(avg) ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = feedbackList.filter(f => Math.round(f.rating) === star).length
            const pct = feedbackList.length > 0 ? (count / feedbackList.length) * 100 : 0
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 8 }}>{star}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <div style={{ flex: 1, height: 6, background: 'var(--elevated)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#F59E0B', borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 16 }}>{count}</span>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 140, borderLeft: '1px solid var(--border)', paddingLeft: 32 }}>
          <StatItem label="Total Feedback" value={feedbackList.length} />
          <StatItem label="Interviews" value={23} />
          <StatItem label="As Interviewee" value={14} />
          <StatItem label="As Interviewer" value={9} />
        </div>
      </div>

      {/* Individual feedback cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {feedbackList.map(f => (
          <div key={f.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <Avatar name={f.reviewer.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{f.reviewer.name}</span>
                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>{f.interviewType}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.date}</div>
              </div>
              <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{f.rating}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 5</span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < f.rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            <hr className="divider" style={{ marginBottom: 16 }} />

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
              "{f.comment}"
            </p>

            {/* Qualitative sections from comment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#22C55E10', border: '1px solid #22C55E20', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strengths</div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {f.interviewType === 'Problem Solving' ? (
                    <>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Clear problem decomposition</li>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Good optimization instincts</li>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Communicates approach well</li>
                    </>
                  ) : (
                    <>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Effective use of STAR method</li>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Concrete, relevant examples</li>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Composed under pressure</li>
                    </>
                  )}
                </ul>
              </div>
              <div style={{ background: '#F59E0B10', border: '1px solid #F59E0B20', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Areas to Improve</div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {f.interviewType === 'Problem Solving' ? (
                    <>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Edge case handling</li>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Testing coverage</li>
                    </>
                  ) : (
                    <>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>More quantified outcomes</li>
                      <li style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sharper follow-up handling</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {feedbackList.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
            <StarIcon />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No Feedback Yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Complete an interview to receive structured feedback.</p>
          <button className="btn-primary" onClick={() => onNavigate('find-interview')}>Find an Interview</button>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function StarIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> }
