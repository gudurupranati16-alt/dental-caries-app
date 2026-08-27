import { useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useCountUp } from '../hooks/useCountUp'

// ─── Animated stat card ──────────────────────────────────────────────────────
function StatCard({ value, suffix, prefix, label, source, decimals = 0, color }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 })
  const count = useCountUp(value, { duration: 2200, decimals, enabled: inView })

  return (
    <div className="stat-card tooltip-wrapper" ref={ref} tabIndex={0} role="figure" aria-label={`${label}: ${value}${suffix}`}>
      <div className="tooltip-text">{source}</div>

      {/* Glow accent */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: color || 'var(--teal-500)',
          opacity: 0.06,
          filter: 'blur(20px)',
        }}
      />

      <div className="stat-number" style={{ color: color || 'var(--teal-400)' }}>
        {prefix && <span style={{ fontSize: '1.8rem' }}>{prefix}</span>}
        {count}
        {suffix && <span className="stat-suffix" style={{ color: 'var(--brown-300)', fontSize: '2rem' }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}

// ─── Manual vs AI toggle ─────────────────────────────────────────────────────
const MANUAL_DATA = [
  { metric: 'Avg. Exam Time',         manual: '45 min',  ai: '< 1 min',   icon: '⏱️' },
  { metric: 'Inter-examiner Variability', manual: 'High (±23%)', ai: 'Deterministic', icon: '📊' },
  { metric: 'Sensitivity (lesion detection)', manual: '66%', ai: '94%',  icon: '🎯' },
  { metric: 'Reproducibility',        manual: 'Moderate', ai: 'Consistent', icon: '🔁' },
  { metric: 'Early caries detection', manual: '52%',     ai: '89%',       icon: '🔬' },
]

function ComparisonToggle() {
  const [isAI, setIsAI] = useState(false)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: '1rem',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: isAI ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            Manual Examination
          </span>
          <label className="toggle-switch" role="switch" aria-checked={isAI} tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsAI(!isAI)}>
            <input type="checkbox" checked={isAI} onChange={() => setIsAI(!isAI)} />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: isAI ? 'var(--teal-400)' : 'var(--text-muted)' }}>
            AI-Assisted
          </span>
        </div>

        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: isAI ? 'rgba(45,212,191,0.15)' : 'rgba(160,120,64,0.15)',
            color: isAI ? 'var(--teal-400)' : 'var(--brown-300)',
          }}
        >
          {isAI ? '🤖 AI-Assisted Mode' : '👨‍⚕️ Manual Mode'}
        </span>
      </div>

      {/* Column headers */}
      <div className="compare-row" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Metric</span>
        <span style={{ fontSize: '0.78rem', color: isAI ? 'var(--text-muted)' : 'var(--brown-300)', fontWeight: 600, textAlign: 'center' }}>
          {isAI ? '—' : 'Manual'}
        </span>
        <span style={{ fontSize: '0.78rem', color: isAI ? 'var(--teal-400)' : 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
          {isAI ? 'AI-Assisted' : '—'}
        </span>
      </div>

      {/* Rows */}
      {MANUAL_DATA.map((row, i) => (
        <div key={i} className="compare-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{row.icon}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{row.metric}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: isAI ? 'var(--text-muted)' : 'var(--brown-300)', transition: 'color 0.3s' }}>
            {row.manual}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: isAI ? 'var(--teal-400)' : 'var(--text-muted)', transition: 'color 0.3s' }}>
            {row.ai}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Problem section ────────────────────────────────────────────────────
export default function Problem() {
  const { ref: titleRef, inView: titleInView } = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section id="problem" className="section-padding" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-container">
        <div ref={titleRef} style={{ opacity: titleInView ? 1 : 0, transform: titleInView ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
          <div className="section-label">The Clinical Challenge</div>
          <h2 className="section-title">Dental Caries Remains a<br /><em>Global Health Crisis</em></h2>
          <p className="section-subtitle" style={{ marginBottom: '3rem' }}>
            Affecting over 3.5 billion people worldwide, dental caries is the most prevalent
            chronic disease — yet current diagnostic methods rely heavily on subjective clinical
            judgement, leading to inconsistent outcomes.
          </p>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '3.5rem',
          }}
        >
          <StatCard
            value={92}
            suffix="%"
            label="Global Caries Prevalence (adults)"
            source="Source: WHO Global Oral Health Report 2022"
            color="var(--teal-400)"
          />
          <StatCard
            value={34}
            suffix="%"
            label="Avg. Missed-Lesion Rate (manual)"
            source="Lussi et al., Caries Research — radiographic false-negative rate"
            color="var(--color-moderate)"
          />
          <StatCard
            value={45}
            label="Min — Avg. Manual Radiograph Exam Time"
            source="Including positioning, exposure, and interpretation per quadrant"
            color="var(--brown-300)"
          />
          <StatCard
            value={3.5}
            suffix="B"
            decimals={1}
            label="People Affected Globally"
            source="WHO 2022: Most prevalent NCDs globally"
            color="var(--color-root)"
          />
        </div>

        {/* Comparison toggle */}
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Manual Examination vs. AI-Assisted Detection
          </h3>
          <ComparisonToggle />
        </div>
      </div>
    </section>
  )
}
