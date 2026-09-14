import { useState } from 'react'
import { InnerViewLogo } from '../components/Sidebar'
import type { Page } from '../data/mockData'

interface LandingProps {
  onNavigate: (page: Page) => void
}

export default function Landing({ onNavigate }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,9,13,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InnerViewLogo size={28} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>InnerView</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {['Features', 'How It Works', 'Interview Types'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {item}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => onNavigate('login')} style={{ fontSize: 13, padding: '6px 14px' }}>Sign In</button>
          <button className="btn-primary" onClick={() => onNavigate('register')} style={{ fontSize: 13, padding: '6px 14px' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '100px 32px 80px', maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        {/* subtle grid background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary-muted)', border: '1px solid #6366F130', borderRadius: 999, padding: '4px 12px', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: 'var(--primary-hover)', fontWeight: 500 }}>Peer-to-peer mock interview platform</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.08,
            letterSpacing: '-0.04em', marginBottom: 24, color: 'var(--text)',
          }}>
            Practice Interviews.<br />
            <span className="gradient-text">Build Confidence.</span><br />
            Get Hired.
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Realistic peer-to-peer mock interviews with collaborative coding, system design, structured feedback, and AI-powered interviewer assistance.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onNavigate('register')} style={{ fontSize: 15, padding: '12px 28px', borderRadius: 10 }}>
              Start Practicing
              <ArrowRightIcon />
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('login')} style={{ fontSize: 15, padding: '12px 28px', borderRadius: 10 }}>
              Explore Interviews
            </button>
          </div>
        </div>

        {/* Hero App Preview */}
        <div style={{ marginTop: 64, position: 'relative' }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--border)',
          }}>
            {/* Window chrome */}
            <div style={{ background: 'var(--elevated)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <InnerViewLogo size={16} />
                  <span style={{ fontWeight: 600 }}>Problem Solving Interview</span>
                  <span className="badge badge-success" style={{ fontSize: 10 }}>● ACTIVE</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--primary-hover)' }}>42:18</div>
            </div>

            {/* Workspace preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 240px', height: 420, gap: 0 }}>
              {/* Problem panel */}
              <div style={{ borderRight: '1px solid var(--border)', padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Two Sum</span>
                  <span className="badge badge-success" style={{ fontSize: 10 }}>Easy</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['Array', 'Hash Table'].map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: 10 }}>{t}</span>)}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
                </p>
                <div style={{ background: 'var(--elevated)', borderRadius: 8, padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Example 1:</div>
                  <div>Input: <span style={{ color: 'var(--primary-hover)' }}>[2,7,11,15], 9</span></div>
                  <div>Output: <span style={{ color: '#22C55E' }}>[0,1]</span></div>
                </div>
              </div>

              {/* Code editor */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: 'var(--elevated)', padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>C++</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>solution.cpp</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }}>Run</button>
                    <button className="btn-primary" style={{ fontSize: 11, padding: '3px 10px' }}>Submit</button>
                  </div>
                </div>
                <div style={{ flex: 1, padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, overflow: 'hidden' }}>
                  <CodeLine num={1} color="var(--secondary)">{'class Solution {'}</CodeLine>
                  <CodeLine num={2} color="var(--text)">{'public:'}</CodeLine>
                  <CodeLine num={3} color="var(--text)">{'  vector<int> twoSum('}</CodeLine>
                  <CodeLine num={4} color="var(--text-secondary)">{'    vector<int>& nums, int target) {'}</CodeLine>
                  <CodeLine num={5} color="var(--primary-hover)">{'    unordered_map<int,int> seen;'}</CodeLine>
                  <CodeLine num={6} color="var(--text)">{'    for (int i = 0; i < nums.size(); i++) {'}</CodeLine>
                  <CodeLine num={7} color="var(--accent)">{'      int comp = target - nums[i];'}</CodeLine>
                  <CodeLine num={8} color="var(--text)">{'      if (seen.count(comp))'}</CodeLine>
                  <CodeLine num={9} color="#22C55E">{'        return {seen[comp], i};'}</CodeLine>
                  <CodeLine num={10} color="var(--text)">{'      seen[nums[i]] = i;'}</CodeLine>
                  <CodeLine num={11} color="var(--text)">{'    }'}</CodeLine>
                  <CodeLine num={12} color="var(--text)">{'    return {};'}</CodeLine>
                  <CodeLine num={13} color="var(--text)">{'  }'}</CodeLine>
                  <CodeLine num={14} color="var(--secondary)">{'};'}</CodeLine>
                </div>

                {/* Test results strip */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px', background: 'var(--elevated)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <TestResult passed={true} label="Test 1" />
                  <TestResult passed={true} label="Test 2" />
                  <TestResult passed={false} label="Test 3" />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Execution: 42ms</span>
                </div>
              </div>

              {/* Right panel — video + AI */}
              <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                {/* Video tiles */}
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border)' }}>
                  <VideoTile name="Ahmed Mohamed" role="Interviewer" active />
                  <VideoTile name="Hazem Barakat" role="Interviewee" />
                </div>
                {/* AI Copilot preview */}
                <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AiIcon />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>AI Copilot</span>
                    <span style={{ fontSize: 10, color: '#22C55E', marginLeft: 'auto' }}>● Listening</span>
                  </div>
                  <CopilotCard
                    type="Suggested Follow-up"
                    text="Can you explain the time complexity of your approach?"
                  />
                  <CopilotCard
                    type="Candidate Progress"
                    text="Identified a hash-map based approach."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div style={{
            position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
            width: '60%', height: 120,
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { value: '10K+', label: 'Mock Interviews' },
            { value: '5K+', label: 'Developers' },
            { value: '95%', label: 'Session Completion' },
            { value: '4.8/5', label: 'Average Rating' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--surface)', padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          label="How It Works"
          title="From profile to feedback in four steps"
          subtitle="A complete interview preparation workflow designed for serious candidates."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 48 }}>
          {[
            { num: '01', title: 'Create Your Profile', desc: 'Add your experience level, preferred role, and programming languages to get matched with compatible partners.' },
            { num: '02', title: 'Find an Interview Partner', desc: 'Discover compatible users and interview opportunities filtered by skill, level, and availability.' },
            { num: '03', title: 'Practice in a Real Interview', desc: 'Use video, collaborative coding, or system-design canvas tools in a realistic mock interview environment.' },
            { num: '04', title: 'Get Feedback', desc: 'Receive structured ratings and written comments from your interview partner after each session.' },
          ].map(step => (
            <div key={step.num} style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>{step.num}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{step.desc}</p>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 40, background: 'var(--primary)', borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </section>

      {/* Interview Types */}
      <section id="interview-types" style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          label="Interview Types"
          title="Practice every type of interview"
          subtitle="From algorithm challenges to behavioral questions — InnerView covers your complete interview preparation."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 48 }}>
          {[
            {
              icon: <TerminalIcon />,
              title: 'Problem Solving',
              desc: 'Practice algorithm and coding interviews with real problems, a collaborative editor, and test case execution.',
              tags: ['Arrays', 'Trees', 'DP', 'Graphs'],
              color: '#6366F1',
            },
            {
              icon: <NetworkIcon />,
              title: 'System Design',
              desc: 'Design scalable architectures collaboratively using an infinite canvas with system components and arrows.',
              tags: ['Scalability', 'Databases', 'Caching', 'Load Balancing'],
              color: '#8B5CF6',
            },
            {
              icon: <CpuIcon />,
              title: 'Technical Knowledge',
              desc: 'Practice computer science fundamentals and technical knowledge with structured question sets.',
              tags: ['OS', 'Networking', 'Data Structures', 'Concurrency'],
              color: '#A78BFA',
            },
            {
              icon: <MessageIcon />,
              title: 'HR / Behavioral',
              desc: 'Master behavioral questions using the STAR method in a comfortable conversational interview format.',
              tags: ['STAR Method', 'Leadership', 'Problem Solving', 'Teamwork'],
              color: '#818CF8',
            },
          ].map(type => (
            <div key={type.title} className="card" style={{ padding: 28, display: 'flex', gap: 20, transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = type.color + '60'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: type.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: type.color, flexShrink: 0 }}>
                {type.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{type.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{type.desc}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {type.tags.map(tag => <span key={tag} className="badge badge-neutral" style={{ fontSize: 11 }}>{tag}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader
          label="Features"
          title="Everything you need to ace your interviews"
          subtitle="A purpose-built platform combining the tools professionals use with the structure interviews require."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48 }}>
          {[
            { icon: <CodeIcon2 />, title: 'Collaborative Coding', desc: 'Real-time shared code editor with syntax highlighting and live execution.' },
            { icon: <UsersIcon />, title: 'Smart Matching', desc: 'Find compatible interview partners based on your skills, level, and availability.' },
            { icon: <VideoIcon />, title: 'Live Video', desc: 'Real-time one-to-one video communication built into the interview workspace.' },
            { icon: <CanvasIcon />, title: 'System Design Canvas', desc: 'Collaboratively draw architecture diagrams on an infinite canvas.' },
            { icon: <BotIcon />, title: 'AI Interview Copilot', desc: 'Context-aware suggestions to help interviewers ask better questions — invisible to candidates.' },
            { icon: <ClipboardIcon />, title: 'Structured Feedback', desc: 'Review interview performance with ratings and written feedback after every session.' },
          ].map(feat => (
            <div key={feat.title} style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)40'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-hover)', marginBottom: 12 }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{feat.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary)15, var(--secondary)10)', border: '1px solid var(--primary)30', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>Ready to practice?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>Join thousands of developers preparing for their next interview.</p>
          <button className="btn-primary" onClick={() => onNavigate('register')} style={{ fontSize: 15, padding: '12px 32px', borderRadius: 10 }}>
            Start for Free <ArrowRightIcon />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InnerViewLogo size={20} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>InnerView</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2026 InnerView. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Contact'].map(link => (
            <a key={link} href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12 }}>{label}</div>
      <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--text)' }}>{title}</h2>
      <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>{subtitle}</p>
    </div>
  )
}

function CodeLine({ num, children, color }: { num: number; children: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <span style={{ color: 'var(--text-muted)', userSelect: 'none', minWidth: 16, textAlign: 'right', fontSize: 11 }}>{num}</span>
      <span style={{ color, fontSize: 11 }}>{children}</span>
    </div>
  )
}

function TestResult({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ color: passed ? '#22C55E' : '#EF4444', fontWeight: 600 }}>{passed ? '✓' : '✕'}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{label} {passed ? 'Passed' : 'Failed'}</span>
    </div>
  )
}

function VideoTile({ name, role, active }: { name: string; role: string; active?: boolean }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  return (
    <div style={{ background: 'var(--elevated)', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, border: active ? '1px solid var(--primary)40' : '1px solid var(--border)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{initials}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{role}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
      </div>
    </div>
  )
}

function CopilotCard({ type, text }: { type: string; text: string }) {
  return (
    <div style={{ background: 'var(--elevated)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{type}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{text}</div>
    </div>
  )
}

function AiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
      <path d="M9 14h6M9 10h6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function TerminalIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
}
function NetworkIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4M8 17l-2-4M16 17l2-4M10 13H5M14 13h5" /></svg>
}
function CpuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="6" height="6" /><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></svg>
}
function MessageIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}
function CodeIcon2() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function VideoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
}
function CanvasIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
}
function BotIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 15h.01M16 15h.01" /></svg>
}
function ClipboardIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
}
