import { useState } from 'react'
import { problems } from '../data/mockData'

const diffColor = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444' }
const diffBg = { Easy: '#22C55E20', Medium: '#F59E0B20', Hard: '#EF444420' }

export default function Problems() {
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState('All')
  const [selectedProblem, setSelectedProblem] = useState<typeof problems[0] | null>(null)

  const filtered = problems.filter(p =>
    (search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) &&
    (diffFilter === 'All' || p.difficulty === diffFilter)
  )

  if (selectedProblem) {
    return <ProblemDetail problem={selectedProblem} onBack={() => setSelectedProblem(null)} />
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Problem Library</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Browse algorithm and coding problems for your interviews.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon />
          </div>
          <input
            type="text" placeholder="Search problems..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Easy', 'Medium', 'Hard'].map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${diffFilter === d ? (d === 'All' ? 'var(--primary)' : (diffColor as Record<string, string>)[d] || 'var(--primary)') : 'var(--border)'}`,
                background: diffFilter === d ? (d === 'All' ? 'var(--primary-muted)' : ((diffBg as Record<string, string>)[d] || 'var(--primary-muted)')) : 'var(--elevated)',
                color: diffFilter === d ? (d === 'All' ? 'var(--primary-hover)' : ((diffColor as Record<string, string>)[d] || 'var(--primary-hover)')) : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              }}
            >{d}</button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
        {[
          { label: 'Total', value: problems.length, color: 'var(--text)' },
          { label: 'Easy', value: problems.filter(p => p.difficulty === 'Easy').length, color: '#22C55E' },
          { label: 'Medium', value: problems.filter(p => p.difficulty === 'Medium').length, color: '#F59E0B' },
          { label: 'Hard', value: problems.filter(p => p.difficulty === 'Hard').length, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} results</div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['#', 'Problem', 'Difficulty', 'Tags', 'Limits', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr
                key={p.id}
                style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => setSelectedProblem(p)}
              >
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    color: (diffColor as Record<string, string>)[p.difficulty],
                    background: (diffBg as Record<string, string>)[p.difficulty],
                  }}>{p.difficulty}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.tags.slice(0, 2).map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: 10 }}>{t}</span>)}
                    {p.tags.length > 2 && <span className="badge badge-neutral" style={{ fontSize: 10 }}>+{p.tags.length - 2}</span>}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {p.timeLimit}ms · {p.memoryLimit}MB
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                    ● {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={e => { e.stopPropagation(); setSelectedProblem(p) }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProblemDetail({ problem: p, onBack }: { problem: typeof problems[0]; onBack: () => void }) {
  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 20, gap: 6 }}>
        <BackIcon /> Back to Problems
      </button>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{p.title}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: (diffColor as Record<string, string>)[p.difficulty], background: (diffBg as Record<string, string>)[p.difficulty] }}>{p.difficulty}</span>
              {p.tags.map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: 12 }}>{t}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <div>Time: {p.timeLimit}ms</div>
              <div>Memory: {p.memoryLimit}MB</div>
            </div>
          </div>
        </div>

        <hr className="divider" style={{ marginBottom: 20 }} />

        <Section title="Problem Statement">
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{p.statement}</p>
        </Section>

        {p.examples.length > 0 && (
          <Section title="Examples">
            {p.examples.map((ex, i) => (
              <div key={i} style={{ background: 'var(--elevated)', borderRadius: 8, padding: 16, marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                <div style={{ marginBottom: 6, color: 'var(--text-muted)', fontSize: 12 }}>Example {i + 1}:</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Input: </span><span style={{ color: 'var(--primary-hover)' }}>{ex.input}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Output: </span><span style={{ color: '#22C55E' }}>{ex.output}</span></div>
                {ex.explanation && <div style={{ marginTop: 4 }}><span style={{ color: 'var(--text-muted)' }}>Explanation: </span><span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{ex.explanation}</span></div>}
              </div>
            ))}
          </Section>
        )}

        {p.constraints.length > 0 && (
          <Section title="Constraints">
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {p.constraints.map((c, i) => (
                <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4, fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>{c}</li>
              ))}
            </ul>
          </Section>
        )}

        {p.testCases.length > 0 && (
          <Section title="Sample Test Cases">
            {p.testCases.filter(tc => tc.isSample).map((tc, i) => (
              <div key={i} style={{ background: 'var(--elevated)', borderRadius: 8, padding: 14, marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>Input:</div><div style={{ color: 'var(--text-secondary)' }}>{tc.input}</div></div>
                  <div><div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>Expected Output:</div><div style={{ color: '#22C55E' }}>{tc.expectedOutput}</div></div>
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      {children}
    </div>
  )
}

function SearchIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg> }
function BackIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg> }
