import { useState } from 'react'
import { InnerViewLogo } from '../components/Sidebar'
import type { Page } from '../data/mockData'

interface AuthProps {
  mode: 'login' | 'register'
  onNavigate: (page: Page) => void
}

export default function Auth({ mode, onNavigate }: AuthProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (mode === 'register') onNavigate('onboarding')
      else onNavigate('dashboard')
    }, 800)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.4,
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
            <InnerViewLogo size={32} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>InnerView</span>
          </div>

          <blockquote style={{ maxWidth: 360 }}>
            <p style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 20 }}>
              "The mock interviews on InnerView felt exactly like the real thing. It changed how I prepare."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>OM</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Omar Khalil</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Senior Engineer · 67 interviews</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StarRating rating={5} size={12} />
              </div>
            </div>
          </blockquote>

          {/* Decorative stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 60 }}>
            {[{ val: '10K+', label: 'Interviews' }, { val: '4.8★', label: 'Rating' }, { val: '95%', label: 'Completion' }].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary-hover)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 80px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
            {mode === 'login' ? "Sign in to continue your interview preparation." : 'Join thousands of developers practicing real interviews.'}
          </p>

          {/* Google OAuth */}
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 20, gap: 10 }}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <hr className="divider" style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or continue with email</span>
            <hr className="divider" style={{ flex: 1 }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <FormField label="Full Name">
                <input
                  type="text" placeholder="Ahmed Mohamed" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </FormField>
            )}
            <FormField label="Email">
              <input
                type="email" placeholder="ahmed@example.com" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </FormField>
            <FormField label="Password">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: '100%', padding: '10px 40px 10px 12px' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <EyeIcon />
                </button>
              </div>
            </FormField>
            {mode === 'register' && (
              <FormField label="Confirm Password">
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" required value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </FormField>
            )}

            {mode === 'login' && (
              <div style={{ textAlign: 'right' }}>
                <button type="button" style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Forgot password?</button>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => onNavigate(mode === 'login' ? 'register' : 'login')}
              style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function Onboarding({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    experienceLevel: '',
    preferredRole: '',
    languages: [] as string[],
    bio: '',
  })

  const steps = ['Experience Level', 'Preferred Role', 'Programming Languages', 'Bio']
  const allLanguages = ['C++', 'Python', 'Java', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Kotlin', 'Swift', 'C#', 'Ruby', 'PHP', 'SQL', 'Spring Boot']

  const handleFinish = () => {
    setTimeout(() => onNavigate('dashboard'), 300)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48, justifyContent: 'center' }}>
          <InnerViewLogo size={28} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>InnerView</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{steps[step]}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step + 1} of {steps.length}</span>
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((step + 1) / steps.length) * 100}%`, background: 'var(--primary)', borderRadius: 999, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Step content */}
        <div className="card" style={{ padding: 32 }}>
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>What is your experience level?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>This helps us match you with compatible interview partners.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Student', 'Fresh Graduate', 'Junior', 'Mid Level', 'Senior'].map(level => (
                  <button
                    key={level}
                    onClick={() => setData({ ...data, experienceLevel: level })}
                    style={{
                      padding: '14px 16px', borderRadius: 8, border: `1px solid ${data.experienceLevel === level ? 'var(--primary)' : 'var(--border)'}`,
                      background: data.experienceLevel === level ? 'var(--primary-muted)' : 'var(--elevated)',
                      color: data.experienceLevel === level ? 'var(--primary-hover)' : 'var(--text)',
                      textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    {level}
                    {data.experienceLevel === level && <CheckIcon />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>What is your preferred role?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>You can always change this later from your profile settings.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { role: 'Interviewer', desc: 'Practice asking technical questions and evaluating candidates.' },
                  { role: 'Interviewee', desc: 'Practice answering questions and solving problems under pressure.' },
                  { role: 'Both', desc: 'Switch between roles to get a complete interview perspective.' },
                ].map(item => (
                  <button
                    key={item.role}
                    onClick={() => setData({ ...data, preferredRole: item.role })}
                    style={{
                      padding: '14px 16px', borderRadius: 8, border: `1px solid ${data.preferredRole === item.role ? 'var(--primary)' : 'var(--border)'}`,
                      background: data.preferredRole === item.role ? 'var(--primary-muted)' : 'var(--elevated)',
                      color: 'var(--text)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: data.preferredRole === item.role ? 'var(--primary-hover)' : 'var(--text)', marginBottom: 2 }}>{item.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Select your programming languages</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Select all languages you are comfortable working with in interviews.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allLanguages.map(lang => {
                  const selected = data.languages.includes(lang)
                  return (
                    <button
                      key={lang}
                      onClick={() => setData({ ...data, languages: selected ? data.languages.filter(l => l !== lang) : [...data.languages, lang] })}
                      style={{
                        padding: '7px 14px', borderRadius: 8, border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        background: selected ? 'var(--primary-muted)' : 'var(--elevated)',
                        color: selected ? 'var(--primary-hover)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Add a short bio</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Help your interview partners understand your background and goals.</p>
              <textarea
                value={data.bio}
                onChange={e => setData({ ...data, bio: e.target.value })}
                placeholder="e.g. Backend engineer focused on distributed systems. Targeting senior-level roles at FAANG companies. Strong in C++ and Python."
                rows={5}
                style={{ width: '100%', padding: '12px', resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{data.bio.length} / 280 characters</div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            <button className="btn-secondary" onClick={() => step > 0 ? setStep(step - 1) : onNavigate('register')} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              Back
            </button>
            <button
              className="btn-primary"
              onClick={() => step < steps.length - 1 ? setStep(step + 1) : handleFinish()}
              style={{ padding: '10px 24px' }}
            >
              {step === steps.length - 1 ? 'Create My Profile' : 'Continue'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          You can update your profile at any time from Settings.
        </p>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
