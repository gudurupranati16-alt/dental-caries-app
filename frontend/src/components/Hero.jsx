function ToothBackground() {
  return (
    <div
      className="animate-drift no-reduce-motion"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg viewBox="0 0 800 600" width="100%" height="100%" style={{ opacity: 0.06 }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="toothGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a07840" stopOpacity="0.1" />
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d="M280,80 C260,60 220,55 200,90 C180,125 185,165 210,180 C200,220 195,270 210,310 C225,350 250,370 280,370 C310,370 335,350 350,310 C365,270 360,220 350,180 C375,165 380,125 360,90 C340,55 300,60 280,80 Z"
          fill="url(#toothGrad)"
          filter="url(#blur)"
          transform="translate(220, 60) scale(1.4)"
        />
        <path d="M265,370 C260,410 255,450 250,490" stroke="#2dd4bf" strokeWidth="16" strokeLinecap="round" fill="none" filter="url(#blur)" opacity="0.5" transform="translate(220, 60) scale(1.4)" />
        <path d="M295,370 C298,415 300,455 298,495" stroke="#2dd4bf" strokeWidth="12" strokeLinecap="round" fill="none" filter="url(#blur)" opacity="0.4" transform="translate(220, 60) scale(1.4)" />
        <circle cx="620" cy="120" r="90" fill="#a07840" opacity="0.08" filter="url(#blur)" />
        <circle cx="100" cy="450" r="70" fill="#2dd4bf" opacity="0.06" filter="url(#blur)" />
        <circle cx="700" cy="450" r="55" fill="#14b8a6" opacity="0.07" filter="url(#blur)" />
      </svg>
    </div>
  )
}

export default function Hero() {
  const handleDemoClick = () => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  const handlePipelineClick = () => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0a0e14 0%, #0d1520 50%, #0a0e14 100%)',
      }}
    >
      <ToothBackground />
      <div className="section-container" style={{ position: 'relative', zIndex: 1, paddingTop: '5rem' }}>
        <div style={{ maxWidth: '760px' }}>
          <div className="animate-fade-up" style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 1rem',
                background: 'rgba(45,212,191,0.1)',
                border: '1px solid rgba(45,212,191,0.25)',
                borderRadius: '2rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--teal-400)',
              }}
            >
              DENTEX Challenge 2023
            </span>
          </div>

          <h1 className="animate-fade-up delay-100" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginBottom: '1.25rem' }}>
            Abnormal Tooth <span className="gradient-text">Detection</span>
            <br />
            for Panoramic X-rays
          </h1>

          <p
            className="animate-fade-up delay-200"
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: 1.7,
              maxWidth: '620px',
            }}
          >
            This repository now focuses on a reproducible object-detection baseline for the
            official DENTEX benchmark. The production path is bounding boxes with FDI-style
            labels, not a fabricated segmentation mask.
          </p>

          <div className="animate-fade-up delay-300" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { label: 'Task', value: 'Abnormal tooth detection' },
              { label: 'Output', value: 'Bounding boxes + class labels' },
              { label: 'Model', value: 'YOLO baseline' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '0.75rem',
                  minWidth: '180px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {item.label}
                </div>
                <div style={{ marginTop: '0.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="animate-fade-up delay-400" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn-primary" onClick={handleDemoClick} aria-label="Go to the live demo">
              Open Demo
            </button>
            <button className="btn-ghost" onClick={handlePipelineClick} aria-label="See the training pipeline">
              See Pipeline
            </button>
          </div>
        </div>
      </div>
      <div
        className="no-reduce-motion"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--text-muted)',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          animation: 'fadeIn 1s 1s both',
        }}
      >
        Scroll
      </div>
    </section>
  )
}

