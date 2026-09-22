import { useState } from 'react'
import { Avatar } from '../components/Sidebar'
import { currentUser, interviews, feedbackList } from '../data/mockData'
import type { Page } from '../data/mockData'

interface DashboardProps {
  onNavigate: (page: Page) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const upcoming = interviews.filter(i => i.status === 'Scheduled')[0]
  const [chartHover, setChartHover] = useState<number | null>(null)

  const chartData = [
    { month: 'Mar', interviews: 2, rating: 4.2 },
    { month: 'Apr', interviews: 4, rating: 4.4 },
    { month: 'May', interviews: 3, rating: 4.3 },
    { month: 'Jun', interviews: 6, rating: 4.6 },
    { month: 'Jul', interviews: 5, rating: 4.7 },
    { month: 'Aug', interviews: 3, rating: 4.8 },
  ]
  const maxInterviews = Math.max(...chartData.map(d => d.interviews))

  const stats = [
    { label: 'Interviews Completed', value: '23', icon: <CheckCircleIcon />, color: '#22C55E', delta: '+4 this month' },
    { label: 'Average Rating', value: '4.7', icon: <StarIcon />, color: '#F59E0B', delta: '↑ 0.2 from last month' },
    { label: 'Problems Solved', value: '47', icon: <CodeIcon />, color: '#6366F1', delta: '+12 this month' },
    { label: 'This Month', value: '3', icon: <CalendarIcon />, color: '#8B5CF6', delta: '2 upcoming scheduled' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Good morning, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ready for your next interview?</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('find-interview')} style={{ padding: '10px 20px' }}>
          <PlusIcon />
          Find an Interview
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: stat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upcoming interview */}
          {upcoming ? (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Upcoming Interview</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your next scheduled session</p>
                </div>
                <span className="badge badge-primary">{upcoming.type}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={upcoming.partner.name} size={40} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{upcoming.partner.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your role: <span style={{ color: 'var(--primary-hover)' }}>{upcoming.role}</span></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <MetaRow icon={<ClockIcon />} label={upcoming.startTime} />
                    <MetaRow icon={<TimerIcon />} label={`${upcoming.duration} min`} />
                    <MetaRow icon={<DotIcon color="#22C55E" />} label={upcoming.status} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn-primary" onClick={() => onNavigate('live-interview')} style={{ justifyContent: 'center', padding: '11px' }}>
                    Join Interview
                  </button>
                  <button className="btn-secondary" style={{ justifyContent: 'center', padding: '9px' }}>
                    View Details
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    Room: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{upcoming.roomId}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyUpcoming onNavigate={onNavigate} />
          )}

          {/* Performance chart */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Interview Activity</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completed interviews over the last 6 months</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontSize: 11 }}>Last 6 months</span>
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, paddingBottom: 8 }}>
              {chartData.map((d, i) => (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  onMouseEnter={() => setChartHover(i)}
                  onMouseLeave={() => setChartHover(null)}>
                  <div style={{ fontSize: 11, color: chartHover === i ? 'var(--text)' : 'transparent', fontWeight: 600, transition: 'color 0.15s' }}>{d.interviews}</div>
                  <div style={{
                    width: '100%', height: `${(d.interviews / maxInterviews) * 90}px`,
                    background: chartHover === i ? 'var(--primary)' : 'var(--primary)60',
                    borderRadius: '4px 4px 0 0',
                    transition: 'background 0.15s, height 0.3s',
                    minHeight: 4,
                  }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.month}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent submissions */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent Submissions</h2>
              <button className="btn-ghost" onClick={() => onNavigate('problems')} style={{ fontSize: 12 }}>View all</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { problem: 'Two Sum', lang: 'C++', status: 'Accepted', time: '42ms', score: 100, when: '2 min ago' },
                { problem: 'Longest Substring', lang: 'Python', status: 'Wrong Answer', time: '89ms', score: 60, when: '1 day ago' },
                { problem: 'Valid Parentheses', lang: 'TypeScript', status: 'Accepted', time: '31ms', score: 100, when: '3 days ago' },
              ].map((sub, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <StatusDot status={sub.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{sub.problem}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{sub.lang} · {sub.time}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: sub.status === 'Accepted' ? '#22C55E' : '#EF4444' }}>{sub.status}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recent feedback */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent Feedback</h2>
              <button className="btn-ghost" onClick={() => onNavigate('feedback')} style={{ fontSize: 12 }}>See all</button>
            </div>
            {feedbackList.slice(0, 2).map(f => (
              <div key={f.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar name={f.reviewer.name} size={28} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{f.reviewer.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.interviewType} · {f.date}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <StarRatingDisplay rating={f.rating} />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{f.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* Quick find */}
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--primary)10, var(--secondary)08)', borderColor: 'var(--primary)30' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Auto Match Me</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Find an interview partner based on your profile, role, skills, and availability.
            </p>
            <button className="btn-primary" onClick={() => onNavigate('find-interview')} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              <BoltIcon />
              Auto Match Me
            </button>
          </div>

          {/* Upcoming interviews list */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Scheduled</h2>
              <button className="btn-ghost" onClick={() => onNavigate('my-interviews')} style={{ fontSize: 12 }}>All</button>
            </div>
            {interviews.filter(i => i.status === 'Scheduled').map(iv => (
              <div key={iv.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <CalendarIcon2 />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{iv.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{iv.startTime} · {iv.duration}min</div>
                </div>
                <span className="badge badge-success" style={{ alignSelf: 'center', fontSize: 10 }}>Scheduled</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'Accepted' ? '#22C55E' : status === 'Wrong Answer' ? '#EF4444' : '#F59E0B'
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>{rating}</span>
    </div>
  )
}

function EmptyUpcoming({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
        <CalendarIcon2 />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No Upcoming Interviews</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Your calendar is clear. Find an interview partner and start practicing.</p>
      <button className="btn-primary" onClick={() => onNavigate('find-interview')}>Find an Interview</button>
    </div>
  )
}

function CheckCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}
function StarIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}
function CodeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
}
function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function TimerIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function DotIcon({ color }: { color: string }) {
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
}
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
}
function BoltIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
}
function CalendarIcon2() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
}
