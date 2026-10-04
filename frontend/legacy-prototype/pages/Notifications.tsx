import { useState } from 'react'
import { notifications } from '../data/mockData'
import type { Page } from '../data/mockData'

interface NotificationsProps {
  onNavigate: (page: Page) => void
}

const typeIcons: Record<string, React.ReactNode> = {
  interview_scheduled: <CalIcon />,
  feedback_received: <StarIcon />,
  interview_starting: <BellIcon />,
  submission_accepted: <CheckIcon />,
  interview_completed: <DoneIcon />,
}

export default function Notifications({ onNavigate }: NotificationsProps) {
  const [items, setItems] = useState(notifications)

  const unread = items.filter(n => !n.isRead).length

  const markAll = () => setItems(items.map(n => ({ ...n, isRead: true })))
  const markOne = (id: string) => setItems(items.map(n => n.id === id ? { ...n, isRead: true } : n))

  return (
    <div style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Notifications
            {unread > 0 && <span style={{ marginLeft: 10, background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>{unread}</span>}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <button className="btn-ghost" onClick={markAll} style={{ fontSize: 13 }}>Mark all as read</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(n => (
          <div
            key={n.id}
            onClick={() => markOne(n.id)}
            className="card"
            style={{
              padding: '16px 20px',
              background: n.isRead ? 'var(--surface)' : 'var(--elevated)',
              borderColor: n.isRead ? 'var(--border)' : 'var(--primary)30',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)40'}
            onMouseLeave={e => e.currentTarget.style.borderColor = n.isRead ? 'var(--border)' : 'var(--primary)30'}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: n.isRead ? 'var(--elevated)' : 'var(--primary-muted)',
              color: n.isRead ? 'var(--text-muted)' : 'var(--primary-hover)',
            }}>
              {typeIcons[n.type] || <BellIcon />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: n.isRead ? 'var(--text-secondary)' : 'var(--text)' }}>{n.title}</span>
                {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</p>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
            <BellIcon />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No notifications</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You're all caught up!</p>
        </div>
      )}
    </div>
  )
}

function CalIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> }
function StarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> }
function BellIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg> }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> }
function DoneIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> }
