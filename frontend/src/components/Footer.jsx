import { useState } from 'react'

const FUTURE_SCOPE = [
  {
    title: 'Add a second-stage classifier',
    content: 'If the dataset is expanded with a separate classification task, a ResNet-50 crop classifier can be added after detection.',
  },
  {
    title: 'Improve data audits',
    content: 'Add richer dataset checks, class balance summaries, and split verification before every training run.',
  },
  {
    title: 'Deploy safer inference',
    content: 'Package the trained detector with explicit model versioning, evaluation metadata, and a clear config check before serving.',
  },
]

function AccordionItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: `1px solid ${open ? 'rgba(45,212,191,0.25)' : 'var(--border-card)'}`, background: 'var(--bg-card)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: open ? 'var(--bg-elevated)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          textAlign: 'left',
        }}
        aria-expanded={open}
        aria-controls={`scope-${index}`}
      >
        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: open ? 'rgba(45,212,191,0.15)' : 'var(--bg-surface)', border: `1px solid ${open ? 'var(--teal-400)' : 'var(--border-card)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: open ? 'var(--teal-400)' : 'var(--text-muted)', flexShrink: 0 }}>
          {index + 1}
        </span>
        <span style={{ flex: 1, fontWeight: 500, fontSize: '0.95rem' }}>{item.title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', color: open ? 'var(--teal-400)' : 'var(--text-muted)', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div id={`scope-${index}`} className={`accordion-content ${open ? 'open' : ''}`} role="region" aria-label={item.title}>
        <p style={{ padding: '0.5rem 1.25rem 1.25rem 3.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75 }}>
          {item.content}
        </p>
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer id="team" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="section-container section-padding">
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-label">Future Work</div>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>What Could Be Added Later</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FUTURE_SCOPE.map((item, i) => (
              <AccordionItem key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>

        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          DENTEX detection prototype. Research and educational use only. Not a clinical diagnostic device.
        </div>
      </div>
    </footer>
  )
}

