import { useState, useEffect } from 'react'
import { Avatar } from '../components/Sidebar'
import { problems, currentUser } from '../data/mockData'
import type { Page } from '../data/mockData'

interface LiveInterviewProps {
  onNavigate: (page: Page) => void
}

const STARTER_CODE = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your solution here

    }
};`

export default function LiveInterview({ onNavigate }: LiveInterviewProps) {
  const [timer, setTimer] = useState(42 * 60 + 18)
  const [running, setRunning] = useState(true)
  const [activeTab, setActiveTab] = useState('Sample Tests')
  const [code, setCode] = useState(STARTER_CODE)
  const [language, setLanguage] = useState('C++')
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [copilotExpanded, setCopilotExpanded] = useState(true)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const problem = problems[0]

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [running])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleRun = () => {
    setRunState('running')
    setTimeout(() => setRunState('done'), 1500)
  }

  const handleSubmit = () => {
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 2000)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        height: 52, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InnerViewMark />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>InnerView</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Problem Solving Interview</span>
          <span className="badge badge-success" style={{ fontSize: 10 }}>● ACTIVE</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--elevated)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 8 }}>
          <ClockIcon />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: timer < 300 ? '#EF4444' : 'var(--text)', letterSpacing: '0.05em' }}>
            {formatTime(timer)}
          </span>
          <button onClick={() => setRunning(!running)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 4 }}>
            {running ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }}><GearIcon /></button>
          <button
            className="btn-danger"
            onClick={() => setShowEndConfirm(true)}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 260px', overflow: 'hidden' }}>
        {/* Problem panel */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{problem.title}</span>
            <span style={{ padding: '2px 7px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#22C55E', background: '#22C55E20' }}>{problem.difficulty}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {problem.tags.map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: 11 }}>{t}</span>)}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 16 }}>{problem.statement}</p>

            {problem.examples.map((ex, i) => (
              <div key={i} style={{ marginBottom: 12, background: 'var(--elevated)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Example {i + 1}:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Input: </span><span style={{ color: 'var(--primary-hover)' }}>{ex.input}</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Output: </span><span style={{ color: '#22C55E' }}>{ex.output}</span></div>
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Constraints</div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {problem.constraints.map((c, i) => (
                  <li key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.6 }}>{c}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '10px 12px', background: 'var(--elevated)', borderRadius: 8 }}>
              <span>Time: {problem.timeLimit}ms</span>
              <span>Memory: {problem.memoryLimit}MB</span>
            </div>
          </div>
        </div>

        {/* Code editor */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor toolbar */}
          <div style={{ background: 'var(--elevated)', borderBottom: '1px solid var(--border)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '5px 8px', fontSize: 12, fontFamily: 'var(--font-mono)', borderRadius: 6, minWidth: 100 }}>
              {['C++', 'Python', 'Java', 'TypeScript', 'Go'].map(l => <option key={l}>{l}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>solution.{language === 'Python' ? 'py' : language === 'Java' ? 'java' : language === 'TypeScript' ? 'ts' : language === 'Go' ? 'go' : 'cpp'}</span>
            <div style={{ flex: 1 }} />
            <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setCode(STARTER_CODE)}>Reset</button>
            <button
              className="btn-secondary"
              onClick={handleRun}
              disabled={runState === 'running'}
              style={{ fontSize: 13, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {runState === 'running' ? '...' : <><RunIcon /> Run</>}
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting || submitted}
              style={{ fontSize: 13, padding: '5px 14px', opacity: submitting ? 0.7 : 1 }}
            >
              {submitted ? '✓ Submitted' : submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          {/* Code area */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
              {/* Line numbers */}
              <div style={{ background: 'var(--elevated)', padding: '16px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)', userSelect: 'none', minWidth: 40, textAlign: 'right', borderRight: '1px solid var(--border)' }}>
                {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{
                  flex: 1, padding: '16px', background: 'var(--bg)', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, color: 'var(--text)',
                  resize: 'none', overflowY: 'auto', tabSize: 2,
                }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Bottom panel */}
          <div style={{ height: 180, borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 0 }}>
              {['Sample Tests', 'Test Cases', 'Output', 'Submission History'].map(tab => (
                <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)} style={{ fontSize: 12 }}>{tab}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {activeTab === 'Sample Tests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {problem.testCases.filter(tc => tc.isSample).map((tc, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--elevated)', borderRadius: 6, padding: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Input</div>
                        <code style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{tc.input}</code>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Expected</div>
                        <code style={{ fontSize: 12, color: '#22C55E', fontFamily: 'var(--font-mono)' }}>{tc.expectedOutput}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'Output' && runState !== 'idle' && (
                <div>
                  {runState === 'running' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                      Running test cases...
                    </div>
                  )}
                  {runState === 'done' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <TestResult passed label="Test 1" time="12ms" input="[2,7,11,15], 9" expected="[0,1]" actual="[0,1]" />
                      <TestResult passed label="Test 2" time="8ms" input="[3,2,4], 6" expected="[1,2]" actual="[1,2]" />
                      <TestResult label="Test 3" time="9ms" input="[3,3], 6" expected="[0,1]" actual="[1,0]" />
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>2 / 3 test cases passed · Avg execution: 9ms</div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'Submission History' && submitted && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ color: '#22C55E', fontWeight: 600 }}>✓ Accepted</span>
                    <span style={{ color: 'var(--text-muted)' }}>Two Sum</span>
                    <span style={{ color: 'var(--text-muted)' }}>{language}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Score: 100</span>
                    <span style={{ color: 'var(--text-muted)' }}>42ms</span>
                    <span style={{ color: 'var(--text-muted)' }}>just now</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — video + AI Copilot */}
        <div style={{ borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Video participants */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <VideoTile name="Ahmed Mohamed" role="Interviewer" isActive speaking />
            <VideoTile name={currentUser.name} role="Interviewee" micMuted={micMuted} camOff={camOff} isSelf />
          </div>

          {/* Controls */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
            <ControlBtn icon={micMuted ? <MicOffIcon /> : <MicIcon />} active={!micMuted} onClick={() => setMicMuted(!micMuted)} label={micMuted ? 'Unmute' : 'Mute'} />
            <ControlBtn icon={camOff ? <CamOffIcon /> : <CamIcon />} active={!camOff} onClick={() => setCamOff(!camOff)} label={camOff ? 'Camera On' : 'Camera Off'} />
            <ControlBtn icon={<FullscreenIcon />} label="Fullscreen" />
          </div>

          {/* AI Copilot — interviewer only */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setCopilotExpanded(!copilotExpanded)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AiSparkIcon />
                <span style={{ fontSize: 13, fontWeight: 600 }}>AI Copilot</span>
                <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 500 }}>● Listening</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{copilotExpanded ? '−' : '+'}</span>
            </div>

            {copilotExpanded && (
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CopilotItem
                  type="Candidate Progress"
                  text="Candidate has identified a hash-map based approach. Approaching an optimal O(n) solution."
                />
                <CopilotItem
                  type="Suggested Follow-up"
                  text="Can you explain the time complexity of your approach?"
                  hasActions
                />
                <CopilotItem
                  type="Hint"
                  text="Consider asking the candidate about memory trade-offs between the brute-force and hash-map solutions."
                />
                <CopilotItem
                  type="Evaluation"
                  text="Candidate is progressing well. Strong problem decomposition skills evident."
                  color="success"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End interview modal */}
      {showEndConfirm && (
        <div className="modal-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="card" style={{ padding: 28, maxWidth: 380, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>End Interview?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              This will end the interview session for all participants. You can still view submissions and provide feedback afterward.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setShowEndConfirm(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button className="btn-danger" onClick={() => onNavigate('my-interviews')} style={{ flex: 1, justifyContent: 'center', background: '#EF4444', color: 'white', border: 'none' }}>End Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoTile({ name, role, isActive, speaking, micMuted, camOff, isSelf }: {
  name: string; role: string; isActive?: boolean; speaking?: boolean; micMuted?: boolean; camOff?: boolean; isSelf?: boolean
}) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
  return (
    <div style={{
      background: 'var(--elevated)', borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${speaking ? '#22C55E40' : 'var(--border)'}`,
      transition: 'border-color 0.3s',
    }}>
      {/* "Video" area */}
      <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #0f1018, #1a1d2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {camOff ? (
          <CamOffIcon />
        ) : (
          <Avatar name={name} size={36} />
        )}
        {speaking && (
          <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
            {[4, 8, 6, 10, 5].map((h, i) => (
              <div key={i} style={{ width: 2, height: h, background: '#22C55E', borderRadius: 1, animation: 'pulse 0.6s ease infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{isSelf ? `${name} (You)` : name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{role}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {micMuted && <span style={{ color: '#EF4444' }}><MicOffIcon /></span>}
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />
        </div>
      </div>
    </div>
  )
}

function CopilotItem({ type, text, hasActions, color }: { type: string; text: string; hasActions?: boolean; color?: string }) {
  const typeColors: Record<string, string> = {
    'Candidate Progress': 'var(--primary)',
    'Suggested Follow-up': '#F59E0B',
    'Hint': 'var(--secondary)',
    'Evaluation': '#22C55E',
  }
  return (
    <div style={{ background: 'var(--elevated)', borderRadius: 8, padding: 10, border: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: typeColors[type] || 'var(--primary)', marginBottom: 6 }}>{type}</div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{text}</p>
      {hasActions && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn-primary" style={{ fontSize: 11, padding: '3px 10px' }}>Use Suggestion</button>
          <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: 'var(--text-muted)' }}>Dismiss</button>
        </div>
      )}
    </div>
  )
}

function ControlBtn({ icon, active, onClick, label }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active === false ? '#EF444420' : 'var(--elevated)',
        border: `1px solid ${active === false ? '#EF444440' : 'var(--border)'}`,
        color: active === false ? '#EF4444' : 'var(--text-secondary)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {icon}
    </button>
  )
}

function TestResult({ passed, label, time, input, expected, actual }: { passed?: boolean; label: string; time: string; input: string; expected: string; actual: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ color: passed ? '#22C55E' : '#EF4444', fontWeight: 700, fontSize: 13, minWidth: 12 }}>{passed ? '✓' : '✕'}</span>
      <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        <div style={{ color: passed ? '#22C55E' : '#EF4444', fontWeight: 600, marginBottom: 2 }}>{label} {passed ? 'Passed' : 'Failed'} · {time}</div>
        <div style={{ color: 'var(--text-muted)' }}>Input: <span style={{ color: 'var(--text-secondary)' }}>{input}</span></div>
        {!passed && <div style={{ color: 'var(--text-muted)' }}>Expected: <span style={{ color: '#22C55E' }}>{expected}</span> · Got: <span style={{ color: '#EF4444' }}>{actual}</span></div>}
      </div>
    </div>
  )
}

function InnerViewMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill="#6366F1" />
      <circle cx="12" cy="16" r="4" fill="white" fillOpacity="0.9" />
      <circle cx="20" cy="16" r="4" fill="white" fillOpacity="0.4" />
    </svg>
  )
}
function ClockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> }
function PauseIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> }
function PlayIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg> }
function GearIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> }
function RunIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg> }
function MicIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" /></svg> }
function MicOffIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" /></svg> }
function CamIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg> }
function CamOffIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></svg> }
function FullscreenIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg> }
function AiSparkIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg> }
