import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { id: 'problem',      label: 'Problem' },
  { id: 'pipeline',     label: 'Pipeline' },
  { id: 'demo',         label: 'Live Demo' },
  { id: 'results',      label: 'Results' },
  { id: 'architecture', label: 'Architecture' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)

      // Active section detection
      const sections = NAV_LINKS.map(l => document.getElementById(l.id)).filter(Boolean)
      const current = sections.find(s => {
        const rect = s.getBoundingClientRect()
        return rect.top <= 80 && rect.bottom > 80
      })
      if (current) setActive(current.id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav
      className="nav-bar"
      style={{
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
        transition: 'box-shadow 0.3s',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="section-container" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.95rem',
            fontFamily: 'DM Serif Display, serif',
            marginRight: 'auto',
          }}
          aria-label="Scroll to top"
        >
          <span style={{ fontSize: '1.2rem' }}>🦷</span>
          <span className="gradient-text">DentalAI</span>
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} className="desktop-nav" role="list">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              role="listitem"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.82rem',
                fontWeight: active === id ? 600 : 400,
                color: active === id ? 'var(--teal-400)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = active === id ? 'var(--teal-400)' : 'var(--text-secondary)'}
            >
              {label}
              {active === id && (
                <span style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '2px',
                  background: 'var(--teal-400)',
                  borderRadius: '1px',
                }} />
              )}
            </button>
          ))}

          <button
            className="btn-primary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', marginLeft: '0.5rem' }}
            onClick={() => scrollTo('demo')}
          >
            Try Demo
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid var(--border-card)',
            borderRadius: '0.375rem',
            padding: '0.4rem',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle mobile menu"
          aria-expanded={menuOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-card)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.375rem',
                textAlign: 'left',
                color: active === id ? 'var(--teal-400)' : 'var(--text-secondary)',
                fontWeight: active === id ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
