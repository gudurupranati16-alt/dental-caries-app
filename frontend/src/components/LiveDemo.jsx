import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const API_URL = 'http://localhost:8000'
const MAX_SIZE = 10 * 1024 * 1024

const SAMPLE_IMAGES = [
  { id: 'bitewing', label: 'Bitewing', emoji: '🦷' },
  { id: 'periapical', label: 'Periapical', emoji: '🔍' },
  { id: 'panoramic', label: 'Panoramic', emoji: '📐' },
]

function LoadingPanel({ step }) {
  const steps = ['Uploading image', 'Running detection', 'Preparing response']
  return (
    <div className="card" style={{ display: 'grid', gap: '0.75rem' }}>
      <div className="skeleton" style={{ height: '280px' }} />
      {steps.map((label, index) => (
        <div key={label} className={`step-indicator ${index < step ? 'done' : index === step ? 'running' : 'pending'}`}>
          <span>{index < step ? '✓' : index === step ? '…' : '○'}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function DetectionOverlay({ imageUrl, result, imageSize, onImageLoad }) {
  const { width, height } = imageSize
  return (
    <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={imageUrl}
          alt="Uploaded dental X-ray"
          style={{ width: '100%', display: 'block' }}
          onLoad={onImageLoad}
        />
        {result.detections.length > 0 && width > 0 && height > 0 && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {result.detections.map((det, index) => {
              const [x1, y1, x2, y2] = det.bbox
              return (
                <div
                  key={`${det.class_id}-${index}`}
                  style={{
                    position: 'absolute',
                    left: `${(x1 / width) * 100}%`,
                    top: `${(y1 / height) * 100}%`,
                    width: `${((x2 - x1) / width) * 100}%`,
                    height: `${((y2 - y1) / height) * 100}%`,
                    border: '2px solid #2dd4bf',
                    borderRadius: '0.35rem',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.25) inset',
                    background: 'rgba(45,212,191,0.08)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '-1.6rem',
                      left: 0,
                      background: 'rgba(10,14,20,0.92)',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.35rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {det.class_name} {Math.round(det.confidence * 100)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.65rem 0.85rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.78rem', flexWrap: 'wrap' }}>
        <span>Original image</span>
        <span>Detection overlay</span>
        <span>{result.detections.length} detection(s)</span>
      </div>
    </div>
  )
}

function ResultPanel({ result, imageUrl, imageSize, onReset, onImageLoad }) {
  const topLabel = result.top_class || 'No detection above threshold'
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <DetectionOverlay imageUrl={imageUrl} result={result} imageSize={imageSize} onImageLoad={onImageLoad} />
      <div className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '0.35rem' }}>Backend Output</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{topLabel}</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The backend returned real detections from the configured checkpoint. If you do not have a checkpoint installed yet, the API will return a clear configuration error instead of a fake prediction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confidence</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--teal-400)' }}>
              {(result.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inference Time</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--brown-300)' }}>
              {result.inference_ms.toFixed(1)} ms
            </div>
          </div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detections</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              {result.detections.length}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Detection list
          </div>
          {result.detections.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No detections above the configured threshold.</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {result.detections.map((det, index) => (
                <div key={`${det.class_id}-${index}`} className="card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{det.class_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Box: [{det.bbox.map((v) => v.toFixed(1)).join(', ')}]
                    </div>
                  </div>
                  <div style={{ color: 'var(--teal-400)', fontWeight: 700 }}>{Math.round(det.confidence * 100)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center' }}>
          Try Another Image
        </button>
      </div>
    </div>
  )
}

export default function LiveDemo() {
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loadStep, setLoadStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const isLoading = loadStep >= 0

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const reset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null)
    setImageUrl(null)
    setResult(null)
    setError(null)
    setLoadStep(-1)
    setImageSize({ width: 0, height: 0 })
  }, [imageUrl])

  const handleDrop = useCallback((accepted, rejected) => {
    setError(null)
    if (rejected.length) {
      const err = rejected[0].errors[0]
      setError(err.code === 'file-too-large' ? 'File too large. Maximum size is 10 MB.' : 'Please upload a JPEG, PNG, or WEBP image.')
      return
    }
    if (accepted.length > 0) {
      const nextFile = accepted[0]
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      setFile(nextFile)
      setImageUrl(URL.createObjectURL(nextFile))
      setImageSize({ width: 0, height: 0 })
      setResult(null)
    }
  }, [imageUrl])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: MAX_SIZE,
    multiple: false,
  })

  const handleSample = useCallback((sampleId) => {
    setError(null)
    setResult(null)
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1b1f28'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#8a9ab5'
    ctx.beginPath()
    ctx.ellipse(220, 120, 90, 120, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#5f6b7c'
    ctx.beginPath()
    ctx.ellipse(220, 122, 38, 70, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2dd4bf'
    ctx.font = '16px monospace'
    ctx.fillText(`Sample: ${sampleId}`, 16, 240)
    canvas.toBlob((blob) => {
      const nextFile = new File([blob], `${sampleId}.png`, { type: 'image/png' })
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      setFile(nextFile)
      setImageUrl(URL.createObjectURL(nextFile))
      setImageSize({ width: 0, height: 0 })
    }, 'image/png')
  }, [imageUrl])

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setError(null)
    setResult(null)
    setLoadStep(0)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setLoadStep(1)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLoadStep(2)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_URL}/predict`, { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Inference failed')
      setResult(payload)
    } catch (err) {
      setError(err.message || 'Could not contact the backend.')
    } finally {
      setLoadStep(-1)
    }
  }, [file])

  const canAnalyze = useMemo(() => !!file && !isLoading, [file, isLoading])

  return (
    <section id="demo" className="section-padding" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Interactive Demo</div>
          <h2 className="section-title">Live Detection Demo</h2>
          <p className="section-subtitle">
            Upload a panoramic or bitewing radiograph. The backend will return real detections from a configured checkpoint or a clear error if the model is not installed.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          <div>
            {!result && (
              <>
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? 'active' : ''}`}
                  id="demo-dropzone"
                  tabIndex={0}
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
                        alt="Selected upload preview"
                        style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '0.5rem', objectFit: 'contain' }}
                        onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 500 }}>{file?.name}</span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2.5rem' }}>🦷</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: isDragActive ? 'var(--teal-400)' : 'var(--text-primary)' }}>
                        {isDragActive ? 'Drop the image here' : 'Drag and drop a dental X-ray'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>JPEG, PNG, or WEBP. Max 10 MB.</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--teal-600)' }}>or click to browse</div>
                    </>
                  )}
                </div>

                {error && (
                  <div role="alert" style={{ padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Try a sample image
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {SAMPLE_IMAGES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSample(sample.id)}
                        style={{
                          flex: '1 1 120px',
                          padding: '0.7rem 0.5rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <div style={{ fontSize: '1.2rem' }}>{sample.emoji}</div>
                        <div style={{ fontSize: '0.75rem' }}>{sample.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn-primary" onClick={handleAnalyze} disabled={!canAnalyze} style={{ width: '100%', justifyContent: 'center', opacity: canAnalyze ? 1 : 0.4, cursor: canAnalyze ? 'pointer' : 'not-allowed' }}>
                  {isLoading ? 'Analyzing...' : 'Run Detection'}
                </button>
              </>
            )}

            {result && (
              <button className="btn-ghost" onClick={reset} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                Upload Another Image
              </button>
            )}
          </div>

          <div>
            {!file && !result && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px dashed var(--border-card)', color: 'var(--text-muted)', gap: '1rem' }}>
                <span style={{ fontSize: '3rem', opacity: 0.3 }}>📋</span>
                <span style={{ fontSize: '0.9rem' }}>Results will appear here</span>
              </div>
            )}

            {isLoading && <LoadingPanel step={loadStep} />}

            {result && imageUrl && (
              <ResultPanel
                result={result}
                imageUrl={imageUrl}
                imageSize={imageSize}
                onReset={reset}
                onImageLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
