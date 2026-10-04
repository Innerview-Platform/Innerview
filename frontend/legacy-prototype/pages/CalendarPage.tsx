import { useState } from 'react'
import { calendarEvents, interviews } from '../data/mockData'
import type { Page } from '../data/mockData'

interface CalendarPageProps {
  onNavigate: (page: Page) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarPage({ onNavigate }: CalendarPageProps) {
  const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Month')
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 10)) // Aug 2026
  const [selectedEvent, setSelectedEvent] = useState<typeof calendarEvents[0] | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return calendarEvents.filter(e => e.date === dateStr)
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Calendar</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>View and manage your interview schedule.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ padding: '7px 12px' }}><ChevLeftIcon /></button>
          <span style={{ fontSize: 15, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
          <button className="btn-secondary" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ padding: '7px 12px' }}><ChevRightIcon /></button>

          <div style={{ display: 'flex', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 2, marginLeft: 8 }}>
            {(['Month', 'Week', 'Day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: view === v ? 'var(--primary)' : 'transparent',
                color: view === v ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>{v}</button>
            ))}
          </div>

          <button className="btn-primary" onClick={() => onNavigate('find-interview')}>Schedule Interview</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        {/* Calendar grid */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {days.map((day, idx) => {
              const events = day ? getEventsForDay(day) : []
              const today = day && isToday(day)
              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 100, padding: 8,
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: !day ? 'var(--surface)' : 'transparent',
                    cursor: day ? 'pointer' : 'default',
                  }}
                >
                  {day && (
                    <>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: today ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: today ? 700 : 400,
                        color: today ? 'white' : 'var(--text-secondary)',
                        marginBottom: 4,
                      }}>{day}</div>
                      {events.map(ev => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                            background: ev.status === 'Completed' ? 'var(--elevated)' : 'var(--primary)25',
                            color: ev.status === 'Completed' ? 'var(--text-muted)' : 'var(--primary-hover)',
                            borderLeft: `2px solid ${ev.status === 'Completed' ? 'var(--border)' : 'var(--primary)'}`,
                            marginBottom: 3, cursor: 'pointer',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
                          {ev.time} · {ev.type}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel — selected event or upcoming */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedEvent ? (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>Interview Details</h3>
                <button className="btn-ghost" onClick={() => setSelectedEvent(null)} style={{ padding: '2px 6px', fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedEvent.type} Interview</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`badge ${selectedEvent.status === 'Completed' ? 'badge-neutral' : 'badge-primary'}`} style={{ fontSize: 11 }}>● {selectedEvent.status}</span>
                </div>
                <InfoRow label="Partner" value={selectedEvent.partner} />
                <InfoRow label="Date" value={selectedEvent.date} />
                <InfoRow label="Time" value={selectedEvent.time} />

                {selectedEvent.status === 'Scheduled' && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn-primary" onClick={() => onNavigate('live-interview')} style={{ justifyContent: 'center' }}>Join Interview</button>
                    <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 12 }}>Add to Google Calendar</button>
                  </div>
                )}
                {selectedEvent.status === 'Completed' && (
                  <button className="btn-secondary" onClick={() => onNavigate('feedback')} style={{ justifyContent: 'center', marginTop: 8 }}>View Feedback</button>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Click an event to view details</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Select any interview on the calendar to see its details and join options.</p>
            </div>
          )}

          {/* Upcoming events list */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Upcoming</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {calendarEvents.filter(e => e.status === 'Scheduled').map(ev => (
                <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ cursor: 'pointer', padding: '10px', borderRadius: 8, background: 'var(--elevated)', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{ev.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.date} · {ev.time}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>with {ev.partner}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function ChevLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> }
function ChevRightIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg> }
