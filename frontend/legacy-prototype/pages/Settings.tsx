import { useState } from 'react'
import { currentUser } from '../data/mockData'

export default function Settings() {
  const [section, setSection] = useState('Account')
  const [theme, setTheme] = useState('Dark')
  const [notifs, setNotifs] = useState({ reminders: true, feedback: true, matches: true })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = ['Account', 'Security', 'Interview Preferences', 'Notifications', 'Appearance']

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Manage your account, preferences, and notifications.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Section nav */}
        <div className="card" style={{ padding: 8 }}>
          {sections.map(s => (
            <button
              key={s}
              className={`nav-item${section === s ? ' active' : ''}`}
              onClick={() => setSection(s)}
              style={{ marginBottom: 2 }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="card" style={{ padding: 28 }}>
          {section === 'Account' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Account</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <SettingRow label="Full Name" description="Your display name across the platform.">
                  <input defaultValue={currentUser.name} style={{ width: '100%', padding: '8px 12px' }} />
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Email" description="Used for notifications and account access.">
                  <input type="email" defaultValue={currentUser.email} style={{ width: '100%', padding: '8px 12px' }} />
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Bio" description="Short description visible on your public profile.">
                  <textarea defaultValue={currentUser.profile.bio} rows={3} style={{ width: '100%', padding: '8px 12px', resize: 'vertical', lineHeight: 1.6 }} />
                </SettingRow>
              </div>
            </div>
          )}

          {section === 'Security' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Security</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <SettingRow label="Password" description="Change your account password.">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="password" placeholder="Current password" style={{ width: '100%', padding: '8px 12px' }} />
                    <input type="password" placeholder="New password" style={{ width: '100%', padding: '8px 12px' }} />
                    <input type="password" placeholder="Confirm new password" style={{ width: '100%', padding: '8px 12px' }} />
                  </div>
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Authentication Provider" description="Your account was created via email.">
                  <div className="badge badge-neutral" style={{ fontSize: 12 }}>Email / Password</div>
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Active Sessions" description="Manage where you're logged in.">
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--elevated)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 500 }}>Current session</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chrome · Linux · Just now</div>
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {section === 'Interview Preferences' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Interview Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <SettingRow label="Preferred Role" description="Your default role in mock interviews.">
                  <select defaultValue={currentUser.profile.preferredRole} style={{ padding: '8px 10px', fontSize: 13, width: 200 }}>
                    {['Interviewer', 'Interviewee', 'Both'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Experience Level" description="Your current professional experience level.">
                  <select defaultValue={currentUser.profile.experienceLevel} style={{ padding: '8px 10px', fontSize: 13, width: 200 }}>
                    {['Student', 'Fresh Graduate', 'Junior', 'Mid Level', 'Senior'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Preferred Interview Types" description="Interview types you want to practice.">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Problem Solving', 'System Design', 'Technical', 'HR'].map(t => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, padding: '6px 12px', background: 'var(--elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                        {t}
                      </label>
                    ))}
                  </div>
                </SettingRow>
                <hr className="divider" />
                <SettingRow label="Programming Languages" description="Languages you can use in interviews.">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {currentUser.languages.map(lang => (
                      <span key={lang} style={{ padding: '4px 10px', background: 'var(--primary-muted)', color: 'var(--primary-hover)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)', border: '1px solid var(--primary)30' }}>{lang}</span>
                    ))}
                    <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}>+ Add</button>
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {section === 'Notifications' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <ToggleRow label="Interview Reminders" description="Get notified 15 minutes before your interviews." value={notifs.reminders} onChange={v => setNotifs({ ...notifs, reminders: v })} />
                <hr className="divider" />
                <ToggleRow label="Feedback Notifications" description="Get notified when you receive new interview feedback." value={notifs.feedback} onChange={v => setNotifs({ ...notifs, feedback: v })} />
                <hr className="divider" />
                <ToggleRow label="Match Notifications" description="Get notified when new compatible partners are available." value={notifs.matches} onChange={v => setNotifs({ ...notifs, matches: v })} />
              </div>
            </div>
          )}

          {section === 'Appearance' && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Appearance</h2>
              <SettingRow label="Theme" description="Choose your preferred color theme. Violet Blue identity is maintained across all themes.">
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Dark', 'Light', 'System'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{
                        padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: `1px solid ${theme === t ? 'var(--primary)' : 'var(--border)'}`,
                        background: theme === t ? 'var(--primary-muted)' : 'var(--elevated)',
                        color: theme === t ? 'var(--primary-hover)' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t === 'Dark' ? '🌙' : t === 'Light' ? '☀️' : '🖥'} {t}
                    </button>
                  ))}
                </div>
              </SettingRow>
            </div>
          )}

          <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={handleSave} style={{ padding: '9px 24px' }}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
            <button className="btn-secondary" style={{ padding: '9px 16px' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: value ? 'var(--primary)' : 'var(--elevated)',
          transition: 'background 0.2s', position: 'relative', flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3, left: value ? 23 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}
