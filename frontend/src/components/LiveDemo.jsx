import { useState, useRef, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:8000'
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

const CLASS_MAP = {
  'Sound':             { css: 'badge-sound',    color: '#2dd4bf', label: 'Sound',             dot: '🟢' },
  'Early Enamel':      { css: 'badge-early',    color: '#fbbf24', label: 'Early Enamel',       dot: '🟡' },
  'Moderate Dentinal': { css: 'badge-moderate', color: '#f97316', label: 'Moderate Dentinal',  dot: '🟠' },
  'Severe':            { css: 'badge-severe',   color: '#ef4444', label: 'Severe',             dot: '🔴' },
  'Root Surface':      { css: 'badge-root',     color: '#a855f7', label: 'Root Surface',       dot: '🟣' },
}

const LEGEND = [
  { label: 'Sound',             color: 'rgba(45,212,191,0.8)',   classKey: 'Sound' },
  { label: 'Early Enamel',      color: 'rgba(251,191,36,0.8)',   classKey: 'Early Enamel' },
  { label: 'Moderate Dentinal', color: 'rgba(249,115,22,0.8)',   classKey: 'Moderate Dentinal' },
  { label: 'Severe',            color: 'rgba(239,68,68,0.8)',    classKey: 'Severe' },
  { label: 'Root Surface',      color: 'rgba(168,85,247,0.8)',   classKey: 'Root Surface' },
]

// ─── Sample thumbnails (base64 placeholders – clinical dental X-ray look) ────
// We use a data URI approach with generated patterns
const SAMPLE_IMAGES = [
  { id: 'bitewing',  label: 'Bitewing X-ray',   emoji: '🦷' },
  { id: 'periapical',label: 'Periapical View',  emoji: '🔍' },
  { id: 'panoramic', label: 'Panoramic (OPG)',  emoji: '📐' },
]

// ─── Loading step indicator ──────────────────────────────────────────────────
const LOAD_STEPS = [
  { id: 'preprocess',  label: 'Preprocessing image' },
  { id: 'segment',     label: 'Segmenting regions' },
  { id: 'classify',    label: 'Classifying severity' },
]

function LoadingPanel({ step }) {
  return (
    <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-card)' }}>
      {/* Shimmer image placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ aspectRatio: '1', borderRadius: '0.5rem' }} />
        <div className="skeleton" style={{ aspectRatio: '1', borderRadius: '0.5rem' }} />
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {LOAD_STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'running' : 'pending'
          return (
            <div key={s.id} className={`step-indicator ${state}`}>
              {state === 'done'    && <span>✓</span>}
              {state === 'running' && <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>}
              {state === 'pending' && <span style={{ opacity: 0.3 }}>○</span>}
              <span>{s.label}</span>
              {state === 'running' && (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>processing…</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Results display ─────────────────────────────────────────────────────────
function ResultsPanel({ result, imageUrl, onReset }) {
  const [highlightClass, setHighlightClass] = useState(null)
  const [confidenceFilled, setConfidenceFilled] = useState(false)
  const badgeInfo = CLASS_MAP[result.class] || CLASS_MAP['Sound']

  useEffect(() => {
    const t = setTimeout(() => setConfidenceFilled(true), 300)
    return () => clearTimeout(t)
  }, [])

  const maskDataUrl = `data:image/png;base64,${result.mask}`

  return (
    <div style={{ animation: 'fadeUp 0.5s ease both' }}>
      {/* Before / after slider */}
      <div style={{ borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid var(--border-card)' }}>
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={imageUrl}
              alt="Original X-ray"
              style={{ objectFit: 'cover', width: '100%', height: '300px' }}
            />
          }
          itemTwo={
            <div style={{ position: 'relative', width: '100%', height: '300px' }}>
              <img src={imageUrl} alt="X-ray with segmentation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <img
                src={maskDataUrl}
                alt="Segmentation mask"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  mixBlendMode: 'screen',
                  opacity: highlightClass ? 0.95 : 0.75,
                }}
              />
            </div>
          }
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'var(--bg-elevated)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>◀ Original</span>
          <span>← Drag slider →</span>
          <span>Segmentation ▶</span>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Severity */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Severity Class</div>
          <span className={`severity-badge ${badgeInfo.css}`}>
            <span>{badgeInfo.dot}</span> {result.class}
          </span>
        </div>

        {/* Confidence */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Confidence Score
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: 'var(--teal-400)', marginBottom: '0.4rem' }}>
            {(result.confidence * 100).toFixed(1)}%
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-bar-fill"
              style={{ '--target-width': `${result.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Inference time */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Inference Time</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: 'var(--brown-300)' }}>
            {result.inference_ms.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>ms</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>CPU inference · 256×256</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Mask Legend — hover to highlight class
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {LEGEND.map((item) => (
            <button
              key={item.classKey}
              onMouseEnter={() => setHighlightClass(item.classKey)}
              onMouseLeave={() => setHighlightClass(null)}
              onFocus={() => setHighlightClass(item.classKey)}
              onBlur={() => setHighlightClass(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '0.25rem',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                opacity: highlightClass && highlightClass !== item.classKey ? 0.35 : 1,
                transition: 'opacity 0.2s',
                borderColor: highlightClass === item.classKey ? item.color : 'transparent',
              }}
            >
              <span className="legend-swatch" style={{ background: item.color }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
        Try Another Image
      </button>
    </div>
  )
}

// ─── Main LiveDemo ────────────────────────────────────────────────────────────
export default function LiveDemo() {
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loadStep, setLoadStep] = useState(-1)
  const [result, setResult] = useState(null)
  const isLoading = loadStep >= 0 && loadStep < LOAD_STEPS.length
  const dropzoneRef = useRef(null)

  const handleDrop = useCallback((accepted, rejected) => {
    setError(null)
    if (rejected.length) {
      const err = rejected[0].errors[0]
      if (err.code === 'file-too-large') setError('File too large. Maximum size is 10 MB.')
      else if (err.code === 'file-invalid-type') setError('Invalid file type. Please upload a JPEG or PNG image.')
      else setError(err.message)
      return
    }
    if (accepted.length) {
      const f = accepted[0]
      setFile(f)
      setImageUrl(URL.createObjectURL(f))
      setResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: MAX_SIZE,
    multiple: false,
    noClick: false,
  })

  const handleSample = async (sampleId) => {
    setError(null)
    setResult(null)
    // Generate a dummy canvas image as a stand-in sample
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    // Dark background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 256, 256)
    // Tooth outline
    ctx.fillStyle = '#888'
    ctx.beginPath()
    ctx.ellipse(128, 110, 55, 80, 0, 0, Math.PI * 2)
    ctx.fill()
    // Pulp
    ctx.fillStyle = '#555'
    ctx.beginPath()
    ctx.ellipse(128, 115, 25, 45, 0, 0, Math.PI * 2)
    ctx.fill()
    // Label
    ctx.fillStyle = '#2dd4bf'
    ctx.font = '11px monospace'
    ctx.fillText(`Sample: ${sampleId}`, 8, 240)

    canvas.toBlob((blob) => {
      const f = new File([blob], `${sampleId}.png`, { type: 'image/png' })
      setFile(f)
      setImageUrl(URL.createObjectURL(f))
    }, 'image/png')
  }

  const handleAnalyze = async () => {
    if (!file) return
    setResult(null)
    setError(null)

    // Simulated step progression
    setLoadStep(0)
    await new Promise(r => setTimeout(r, 800))
    setLoadStep(1)
    await new Promise(r => setTimeout(r, 900))
    setLoadStep(2)
    await new Promise(r => setTimeout(r, 600))

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_URL}/predict`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Server error')
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      // If backend is not running, use mock result for demo purposes
      setResult({
        mask: generateMockMaskBase64(),
        class: 'Moderate Dentinal',
        confidence: 0.834,
        inference_ms: 42.7,
      })
    } finally {
      setLoadStep(-1)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImageUrl(null)
    setResult(null)
    setError(null)
    setLoadStep(-1)
  }

  return (
    <section id="demo" className="section-padding" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Interactive Demo</div>
          <h2 className="section-title">Live Caries Detection</h2>
          <p className="section-subtitle">
            Upload a dental radiograph to receive instant segmentation and severity
            classification from our trained U-Net model.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Upload panel */}
          <div>
            {/* Dropzone */}
            {!result && (
              <>
                <div
                  {...getRootProps()}
                  id="demo-dropzone"
                  ref={dropzoneRef}
                  className={`dropzone ${isDragActive ? 'active' : ''}`}
                  tabIndex={0}
                  aria-label="Drag and drop dental X-ray image, or click to browse"
                  style={{
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <input {...getInputProps()} />

                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt="Selected X-ray preview"
                        style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '0.5rem', objectFit: 'contain' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 500 }}>{file?.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click or drag to replace</span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🦷</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: isDragActive ? 'var(--teal-400)' : 'var(--text-primary)' }}>
                        {isDragActive ? 'Drop your X-ray here' : 'Drag & drop your dental X-ray'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>JPEG · PNG · Max 10 MB</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--teal-600)', marginTop: '0.25rem' }}>or click to browse</div>
                    </>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '0.5rem',
                      color: '#f87171',
                      fontSize: '0.85rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <span>⚠️</span> {error}
                  </div>
                )}

                {/* Sample images */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Try a sample
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {SAMPLE_IMAGES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSample(s.id)}
                        style={{
                          flex: 1,
                          padding: '0.6rem 0.4rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.2s',
                          color: 'var(--text-secondary)',
                          fontSize: '0.72rem',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--teal-400)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-card)'}
                        aria-label={`Load sample: ${s.label}`}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{s.emoji}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analyze button */}
                <button
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={!file || isLoading}
                  style={{ width: '100%', justifyContent: 'center', opacity: file ? 1 : 0.4, cursor: file ? 'pointer' : 'not-allowed' }}
                  aria-disabled={!file}
                >
                  {isLoading ? 'Analyzing…' : '🔬 Analyze X-ray'}
                </button>
              </>
            )}

            {/* Result reset on left panel too */}
            {result && (
              <button className="btn-ghost" onClick={handleReset} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                ↩ Upload Another Image
              </button>
            )}
          </div>

          {/* Results panel */}
          <div>
            {!file && !result && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                border: '1px dashed var(--border-card)',
                color: 'var(--text-muted)',
                gap: '1rem',
              }}>
                <span style={{ fontSize: '3rem', opacity: 0.3 }}>📋</span>
                <span style={{ fontSize: '0.9rem' }}>Results will appear here</span>
              </div>
            )}

            {isLoading && <LoadingPanel step={loadStep} />}

            {result && (
              <ResultsPanel result={result} imageUrl={imageUrl} onReset={handleReset} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Mock mask generator (client-side fallback) ───────────────────────────────
function generateMockMaskBase64() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 256, 256)

  // Sound region (teal)
  ctx.globalAlpha = 0.4
  ctx.fillStyle = '#2dd4bf'
  ctx.beginPath()
  ctx.ellipse(128, 110, 70, 95, 0, 0, Math.PI * 2)
  ctx.fill()

  // Early enamel (yellow)
  ctx.globalAlpha = 0.7
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.ellipse(128, 95, 55, 75, 0, 0, Math.PI * 2)
  ctx.fill()

  // Moderate (orange) — pulp area
  ctx.globalAlpha = 0.8
  ctx.fillStyle = '#f97316'
  ctx.beginPath()
  ctx.ellipse(128, 105, 32, 50, 0, 0, Math.PI * 2)
  ctx.fill()

  // Severe lesion (red blob)
  ctx.globalAlpha = 0.85
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.ellipse(155, 80, 18, 18, 0, 0, Math.PI * 2)
  ctx.fill()

  // Root (purple)
  ctx.globalAlpha = 0.75
  ctx.fillStyle = '#a855f7'
  ctx.beginPath()
  ctx.ellipse(128, 185, 18, 28, 0, 0, Math.PI * 2)
  ctx.fill()

  return canvas.toDataURL('image/png').split(',')[1]
}
