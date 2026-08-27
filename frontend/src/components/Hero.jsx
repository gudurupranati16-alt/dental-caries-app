import { useEffect, useRef } from 'react'

// ─── Animated tooth SVG background ──────────────────────────────────────────
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
      <svg
        viewBox="0 0 800 600"
        width="100%"
        height="100%"
        style={{ opacity: 0.06 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="toothGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#2dd4bf" stopOpacity="0.8" />
            <stop offset="60%"  stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a07840" stopOpacity="0.1" />
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Tooth crown */}
        <path
          d="M280,80 C260,60 220,55 200,90 C180,125 185,165 210,180
             C200,220 195,270 210,310 C225,350 250,370 280,370
             C310,370 335,350 350,310 C365,270 360,220 350,180
             C375,165 380,125 360,90 C340,55 300,60 280,80 Z"
          fill="url(#toothGrad)"
          filter="url(#blur)"
          transform="translate(220, 60) scale(1.4)"
        />

        {/* Root canals */}
        <path
          d="M265,370 C260,410 255,450 250,490"
          stroke="#2dd4bf"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          filter="url(#blur)"
          opacity="0.5"
          transform="translate(220, 60) scale(1.4)"
        />
        <path
          d="M295,370 C298,415 300,455 298,495"
          stroke="#2dd4bf"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          filter="url(#blur)"
          opacity="0.4"
          transform="translate(220, 60) scale(1.4)"
        />

        {/* Decorative lesion blobs */}
        <circle cx="620" cy="120" r="90" fill="#a07840" opacity="0.08" filter="url(#blur)" />
        <circle cx="100" cy="450" r="70" fill="#2dd4bf" opacity="0.06" filter="url(#blur)" />
        <circle cx="700" cy="450" r="55" fill="#14b8a6" opacity="0.07" filter="url(#blur)" />

        {/* Subtle grid dots */}
        {Array.from({ length: 12 }).map((_, i) =>
          Array.from({ length: 8 }).map((_, j) => (
            <circle
              key={`${i}-${j}`}
              cx={i * 70 + 20}
              cy={j * 80 + 20}
              r="1.5"
              fill="#2dd4bf"
              opacity="0.15"
            />
          ))
        )}
      </svg>
    </div>
  )
}

// ─── Main Hero ───────────────────────────────────────────────────────────────
export default function Hero() {
  const dropzoneId = 'demo-dropzone'

  const handleUploadClick = () => {
    const section = document.getElementById('demo')
    section?.scrollIntoView({ behavior: 'smooth' })
    // After scroll, pulse the dropzone
    setTimeout(() => {
      const zone = document.getElementById(dropzoneId)
      if (zone) {
        zone.classList.remove('pulse-focus')
        // Trigger reflow to restart animation
        void zone.offsetWidth
        zone.classList.add('pulse-focus')
        zone.focus()
        setTimeout(() => zone.classList.remove('pulse-focus'), 2100)
      }
    }, 700)
  }

  const handlePipelineClick = () => {
    document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })
  }

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

      {/* Content */}
      <div className="section-container" style={{ position: 'relative', zIndex: 1, paddingTop: '5rem' }}>
        <div style={{ maxWidth: '760px' }}>
          {/* Label */}
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
              <span style={{ fontSize: '0.65rem' }}>●</span>
              Deep Learning in Dental Diagnostics
            </span>
          </div>

          {/* Title */}
          <h1
            className="animate-fade-up delay-100"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginBottom: '1.25rem' }}
          >
            Automated{' '}
            <span className="gradient-text">Dental Caries</span>
            <br />
            Detection & Segmentation
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-up delay-200"
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              lineHeight: 1.7,
              maxWidth: '580px',
            }}
          >
            A multi-model deep learning pipeline combining{' '}
            <strong style={{ color: 'var(--text-primary)' }}>ResNet50</strong>,{' '}
            <strong style={{ color: 'var(--text-primary)' }}>YOLOv8</strong>, and{' '}
            <strong style={{ color: 'var(--text-primary)' }}>U-Net</strong> for automated
            segmentation and severity classification of dental caries from radiographic images.
          </p>

          {/* Team */}
          <div
            className="animate-fade-up delay-300"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '2rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: 'var(--brown-300)' }}>👤</span> Guduru Pranati
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: 'var(--brown-300)' }}>👤</span> Team Member 2
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: 'var(--brown-300)' }}>👤</span> Team Member 3
            </span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>Dept. of Computer Science & Engineering</span>
          </div>

          {/* CTAs */}
          <div
            className="animate-fade-up delay-400"
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
          >
            <button className="btn-primary" onClick={handleUploadClick} aria-label="Upload an X-ray for analysis">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload X-ray for Analysis
            </button>

            <button className="btn-ghost" onClick={handlePipelineClick} aria-label="See how the pipeline works">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 14 14"/>
              </svg>
              See how it works
            </button>
          </div>

          {/* Metrics strip */}
          <div
            className="animate-fade-up delay-500"
            style={{
              display: 'flex',
              gap: '2rem',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { value: '94.2%', label: 'Validation Accuracy' },
              { value: '0.863', label: 'Mean Dice Score' },
              { value: '5', label: 'Severity Classes' },
              { value: '<50ms', label: 'Inference Time' },
            ].map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span
                  style={{
                    fontFamily: 'DM Serif Display, serif',
                    fontSize: '1.6rem',
                    color: 'var(--teal-400)',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="no-reduce-motion"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.35rem',
          animation: 'fadeIn 1s 1s both',
          color: 'var(--text-muted)',
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span>Scroll</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="7" r="2.5" fill="currentColor" style={{ animation: 'fadeUp 1.5s ease-in-out infinite' }} />
        </svg>
      </div>
    </section>
  )
}
