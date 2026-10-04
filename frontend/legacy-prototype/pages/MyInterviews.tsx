import { useState } from 'react'
import { Avatar } from '../components/Sidebar'
import { interviews } from '../data/mockData'
import type { Page } from '../data/mockData'

interface MyInterviewsProps {
  onNavigate: (page: Page) => void
}

const statusColor: Record<string, string> = {
  Scheduled: '#6366F1',
  Started: '#F59E0B',
  Active: '#22C55E',
  Completed: '#A1A1AA',
  Cancelled: '#EF4444',
}

const typeBadgeClass: Record<string, string> = {
  'Problem Solving': 'badge-primary',
  'System Design': 'badge-primary',
  'Technical': 'badge-neutral',
  'HR': 'badge-neutral',
}

export default function MyInterviews({ onNavigate }: MyInterviewsProps) {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming')

  const upcomingStatuses = ['Scheduled', 'Started', 'Active']
  const filtered = interviews.filter(i => {
    if (activeTab === 'Upcoming') return upcomingStatuses.includes(i.status)
    if (activeTab === 'Completed') return i.status === 'Completed'
    if (activeTab === 'Cancelled') return i.status === 'Cancelled'
    return false
  })

  const counts = {
    Upcoming: interviews.filter(i => upcomingStatuses.includes(i.status)).length,
    Completed: interviews.filter(i => i.status === 'Completed').length,
    Cancelled: interviews.filter(i => i.status === 'Cancelled').length,
  }

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>My Interviews</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Track and manage all your interview sessions.</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('find-interview')}>
          <PlusIcon />
          Schedule Interview
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {(['Upcoming', 'Completed', 'Cancelled'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span style={{ marginLeft: 6, background: activeTab === tab ? 'var(--primary)30' : 'var(--elevated)', color: activeTab === tab ? 'var(--primary-hover)' : 'var(--text-muted)', padding: '1px 6px', borderRadius: 999, fontSize: 11 }}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Interview cards */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} onNavigate={onNavigate} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(iv => (
            <InterviewCard key={iv.id} interview={iv} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

function InterviewCard({ interview: iv, onNavigate }: { interview: typeof interviews[0]; onNavigate: (p: Page) => void }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Type icon */}
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
          <TypeIcon type={iv.type} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{iv.type} Interview</span>
            <span className={`badge ${typeBadgeClass[iv.type] || 'badge-neutral'}`} style={{ fontSize: 10 }}>{iv.type}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: statusColor[iv.status] || 'var(--text-muted)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[iv.status] || 'var(--text-muted)', display: 'inline-block' }} />
              {iv.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={iv.partner.name} size={24} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{iv.partner.name}</span>
            </div>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>Your role: {iv.role}</span>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <MetaChip icon={<ClockIcon />} text={iv.startTime} />
            <MetaChip icon={<TimerIcon />} text={`${iv.duration} min`} />
            <MetaChip icon={<KeyIcon />} text={`Room: ${iv.roomId}`} mono />
            {'rating' in iv && iv.rating && (
              <MetaChip icon={<StarIcon />} text={`${iv.rating} / 5`} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
          {iv.status === 'Scheduled' && (
            <>
              <button className="btn-primary" onClick={() => onNavigate('live-interview')} style={{ fontSize: 13, padding: '7px 14px' }}>Join Interview</button>
              <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}>Reschedule</button>
              <button className="btn-danger" style={{ fontSize: 12, padding: '5px 12px' }}>Cancel</button>
            </>
          )}
          {iv.status === 'Completed' && (
            <>
              <button className="btn-secondary" onClick={() => onNavigate('feedback')} style={{ fontSize: 13, padding: '7px 14px' }}>View Feedback</button>
              <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>View Details</button>
            </>
          )}
          {iv.status === 'Cancelled' && (
            <button className="btn-secondary" onClick={() => onNavigate('find-interview')} style={{ fontSize: 12, padding: '7px 14px' }}>Reschedule</button>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaChip({ icon, text, mono }: { icon: React.ReactNode; text: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
      <span>{icon}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text-secondary)' }}>{text}</span>
    </div>
  )
}

function EmptyState({ tab, onNavigate }: { tab: string; onNavigate: (p: Page) => void }) {
  const msg = tab === 'Upcoming'
    ? { title: 'No Upcoming Interviews', desc: 'Find an interview partner and start practicing.', cta: 'Find an Interview', action: 'find-interview' as Page }
    : tab === 'Completed'
    ? { title: 'No Completed Interviews', desc: 'Complete your first interview to see it here.', cta: 'Find an Interview', action: 'find-interview' as Page }
    : { title: 'No Cancelled Interviews', desc: 'You have no cancelled interviews.', cta: null, action: null }

  return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
        <CalendarIcon />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{msg.title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{msg.desc}</p>
      {msg.cta && msg.action && (
        <button className="btn-primary" onClick={() => onNavigate(msg.action!)}>{msg.cta}</button>
      )}
    </div>
  )
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'Problem Solving') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
  if (type === 'System Design') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4M8 17l-2-4M16 17l2-4" /></svg>
  if (type === 'HR') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="6" height="6" /><rect x="2" y="2" width="20" height="20" rx="2" /></svg>
}

function PlusIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg> }
function ClockIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> }
function TimerIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> }
function KeyIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg> }
function StarIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> }
function CalendarIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> }
