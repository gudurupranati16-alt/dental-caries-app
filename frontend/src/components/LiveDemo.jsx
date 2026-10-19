import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts'

const API_URL = 'http://localhost:8000'
const MAX_SIZE = 10 * 1024 * 1024

const CLASS_COLORS = {
  0: '#2dd4bf',
  1: '#38bdf8',
  2: '#f59e0b',
  3: '#ef4444',
}

const CLASS_NAMES = {
  0: 'Impacted',
  1: 'Caries',
  2: 'Periapical Lesion',
  3: 'Deep Caries',
}

const SAMPLE_PRESETS = [
  {
    id: 'case1',
    label: 'Sample Radiograph 1',
    type: 'Dental Radiograph',
    emoji: '🦷',
    src: '/samples/case1_panoramic.png',
  },
  {
    id: 'case2',
    label: 'Sample Radiograph 2',
    type: 'Dental Radiograph',
    emoji: '🔍',
    src: '/samples/case2_periapical.png',
  },
  {
    id: 'case3',
    label: 'Sample Radiograph 3',
    type: 'Dental Radiograph',
    emoji: '📐',
    src: '/samples/case3_bitewing.png',
  },
]

function LoadingPanel({ step, model }) {
  const steps = ['Uploading radiograph', `Running ${model} model`, 'Preparing model visualization']
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

function DetectionOverlay({ imageUrl, result, imageSize, onImageLoad, activeIndex, setActiveIndex }) {
  const { width, height } = imageSize
  const detections = result.detections || []
  const isSegmentation = result.model === 'DeepLabv3+'
  return (
    <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border-card)', background: '#0a0e14' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={imageUrl}
          alt={isSegmentation ? 'Dental radiograph with caries segmentation overlay' : 'Dental radiograph with caries detection overlay'}
          style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'contain' }}
          onLoad={onImageLoad}
        />
        {result.segmentation_mask && (
          <img
            src={`data:image/png;base64,${result.segmentation_mask}`}
            alt="DeepLabv3+ caries segmentation mask"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
          />
        )}
        {!isSegmentation && detections.length > 0 && width > 0 && height > 0 && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {detections.map((det, index) => {
              const [x1, y1, x2, y2] = det.bbox
              const isSelected = activeIndex === index
              const color = CLASS_COLORS[det.class_id] || '#2dd4bf'
              const displayName = CLASS_NAMES[det.class_id] || det.class_name
              return (
                <div
                  key={`${det.class_id}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    position: 'absolute',
                    left: `${(x1 / width) * 100}%`,
                    top: `${(y1 / height) * 100}%`,
                    width: `${((x2 - x1) / width) * 100}%`,
                    height: `${((y2 - y1) / height) * 100}%`,
                    border: `2px solid ${color}`,
                    borderRadius: '0.35rem',
                    boxShadow: isSelected
                      ? `0 0 18px ${color}, inset 0 0 12px ${color}40`
                      : '0 0 0 1px rgba(0,0,0,0.3) inset',
                    background: isSelected ? `${color}25` : `${color}10`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    zIndex: isSelected ? 10 : 2,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '-1.65rem',
                      left: 0,
                      background: 'rgba(10,14,20,0.92)',
                      color: isSelected ? '#ffffff' : color,
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.35rem',
                      whiteSpace: 'nowrap',
                      border: `1px solid ${color}60`,
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    }}
                  >
                    #{index + 1} {displayName} {Math.round(det.confidence * 100)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.65rem 0.85rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.78rem', flexWrap: 'wrap' }}>
        <span>Dental Radiograph</span>
        <span style={{ color: 'var(--teal-400)', fontWeight: 500 }}>
          {isSegmentation
            ? 'DeepLabv3+ semantic segmentation overlay'
            : detections.length > 0
              ? 'Click a bounding box or chart bar to inspect'
              : 'No detections found above threshold'}
        </span>
        {!isSegmentation && <span>{detections.length} Detection(s) Returned</span>}
      </div>
      {isSegmentation && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.65rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          {Object.entries(CLASS_NAMES).map(([classId, name]) => (
            <span key={classId} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '0.7rem', height: '0.7rem', borderRadius: '2px', background: CLASS_COLORS[classId] }} />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function GraphTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div
      style={{
        background: 'rgba(17, 24, 32, 0.95)',
        border: '1px solid var(--border-card)',
        borderRadius: '0.5rem',
        padding: '0.6rem 0.85rem',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontWeight: 600, color: data.color || 'var(--teal-400)', marginBottom: '0.2rem' }}>
        {data.name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Confidence:</span>
        <span style={{ fontWeight: 700 }}>{(data.confidence * 100).toFixed(1)}%</span>
      </div>
    </div>
  )
}

function ConfidenceControl({ value, onChange, disabled }) {
  const presets = [
    { label: '5% (All Detections)', val: 0.05 },
    { label: '15% (Sensitive)', val: 0.15 },
    { label: '25% (Standard)', val: 0.25 },
    { label: '50% (High Confidence)', val: 0.50 },
  ]

  const pct = Math.round(value * 100)

  return (
    <div style={{ marginBottom: '1.15rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Confidence Threshold
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Adjust the minimum confidence score for visible model output.
          </div>
        </div>
        <div style={{
          padding: '0.2rem 0.55rem',
          borderRadius: '0.375rem',
          background: 'rgba(45, 212, 191, 0.12)',
          border: '1px solid var(--teal-500)',
          color: 'var(--teal-300)',
          fontWeight: 700,
          fontSize: '0.85rem',
          fontFamily: 'monospace'
        }}>
          {pct}%
        </div>
      </div>

      <input
        type="range"
        min="0.05"
        max="0.95"
        step="0.05"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="conf-slider"
        style={{ '--conf-percent': `${pct}%`, margin: '0.4rem 0 0.6rem 0' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {presets.map((p) => (
          <button
            key={p.val}
            type="button"
            disabled={disabled}
            className={`conf-preset-btn ${Math.abs(value - p.val) < 0.01 ? 'active' : ''}`}
            onClick={() => onChange(p.val)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultPanel({ result, imageUrl, imageSize, onReset, onImageLoad, confThreshold }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const detections = result.detections || []
  const isSegmentation = result.model === 'DeepLabv3+'
  const currentThreshold = result.conf_threshold ?? confThreshold ?? 0.25
  const topLabel = result.top_class ? `${result.top_class} Detected` : 'No trained classes detected'

  const chartData = detections.map((det, index) => {
    const displayName = CLASS_NAMES[det.class_id] || det.class_name
    return {
      index,
      name: `#${index + 1} ${displayName}`,
      confidence: det.confidence,
      color: CLASS_COLORS[det.class_id] || '#2dd4bf',
    }
  })

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* 1. X-Ray Image with Interactive Overlay */}
      <DetectionOverlay
        imageUrl={imageUrl}
        result={result}
        imageSize={imageSize}
        onImageLoad={onImageLoad}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Model</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.45rem', color: 'var(--teal-400)', marginTop: '0.2rem' }}>
            {result.model}
          </div>
        </div>
        {!isSegmentation && <div className="card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detection Confidence</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.45rem', color: '#38bdf8', marginTop: '0.2rem' }}>
            {(result.confidence * 100).toFixed(1)}%
          </div>
        </div>}
        <div className="card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inference Latency</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.45rem', color: 'var(--brown-300)', marginTop: '0.2rem' }}>
            {result.inference_ms.toFixed(1)} ms
          </div>
        </div>
        {!isSegmentation && <div className="card" style={{ padding: '0.85rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detections</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.45rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {detections.length}
          </div>
        </div>}
      </div>

      {/* 3. Interactive Caries Detection Graph */}
      {!isSegmentation && <>
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--teal-400)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Diagnostic Chart
            </div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0.2rem 0' }}>
              {detections.length > 0 ? 'Detection Confidence by Class' : 'No Detections Above Threshold'}
            </h4>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Detection Threshold: <span style={{ color: 'var(--teal-400)', fontWeight: 600 }}>{Math.round(currentThreshold * 100)}%</span>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div style={{ width: '100%', height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined && detections.length > 0) {
                  setActiveIndex(state.activeTooltipIndex)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-primary)', fontSize: 10.5 }} width={125} />
              <Tooltip content={<GraphTooltip />} />
              <ReferenceLine x={currentThreshold} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `${Math.round(currentThreshold * 100)}% Cutoff`, fill: '#ef4444', fontSize: 9, position: 'top' }} />
              <ReferenceLine x={0.80} stroke="var(--teal-400)" strokeDasharray="3 3" label={{ value: '80% High Cert.', fill: 'var(--teal-400)', fontSize: 9, position: 'top' }} />
              <Bar dataKey="confidence" radius={[0, 4, 4, 0]} cursor="pointer">
                {chartData.map((entry, index) => {
                  const isSelected = activeIndex === index
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      opacity={activeIndex === null || isSelected ? 1 : 0.45}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
          {detections.length > 0
            ? 'Click any bar in the graph to highlight the corresponding detection on the radiograph above.'
            : 'No detections were returned by the selected model above the confidence threshold.'}
        </div>
      </div>

      {/* 4. Model Findings */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Model Findings
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600 }}>{topLabel}</span>
        </div>

        {detections.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, padding: '0.5rem 0' }}>
            No trained classes were detected above the {Math.round(currentThreshold * 100)}% confidence threshold.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {detections.map((det, index) => {
              const isSelected = activeIndex === index
              const color = CLASS_COLORS[det.class_id] || '#2dd4bf'
              const displayName = CLASS_NAMES[det.class_id] || det.class_name
              return (
                <div
                  key={`${det.class_id}-${index}`}
                  onClick={() => setActiveIndex(isSelected ? null : index)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    background: isSelected ? 'rgba(45, 212, 191, 0.08)' : 'var(--bg-deep)',
                    border: `1px solid ${isSelected ? color : 'var(--border-card)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        #{index + 1} {displayName}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color, fontSize: '0.95rem' }}>
                      {Math.round(det.confidence * 100)}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>Bounding Box: [{det.bbox.map((v) => Math.round(v)).join(', ')}]</span>
                    <span style={{ color: isSelected ? 'var(--teal-400)' : 'inherit' }}>
                      {isSelected ? '✓ Highlighted on radiograph' : 'Click to highlight'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem' }}>
          Analyze Another Dental Radiograph
        </button>
      </div>
      </>}
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
  const [confThreshold, setConfThreshold] = useState(0.25)
  const [selectedModel, setSelectedModel] = useState('YOLO11n')

  const isLoading = loadStep >= 0

  useEffect(() => {
    return () => {
      if (imageUrl && !imageUrl.startsWith('/samples')) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const reset = useCallback(() => {
    if (imageUrl && !imageUrl.startsWith('/samples')) URL.revokeObjectURL(imageUrl)
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
      setError(err.code === 'file-too-large' ? 'File too large. Maximum size is 10 MB.' : 'Please upload a JPEG, PNG, or WEBP dental radiograph.')
      return
    }
    if (accepted.length > 0) {
      const nextFile = accepted[0]
      if (imageUrl && !imageUrl.startsWith('/samples')) URL.revokeObjectURL(imageUrl)
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

  const handleSelectPreset = useCallback(async (preset) => {
    setError(null)
    setResult(null)
    if (imageUrl && !imageUrl.startsWith('/samples')) URL.revokeObjectURL(imageUrl)
    setImageUrl(preset.src)
    setImageSize({ width: 0, height: 0 })

    try {
      const response = await fetch(preset.src)
      const blob = await response.blob()
      const sampleFile = new File([blob], `${preset.id}.png`, { type: 'image/png' })
      setFile(sampleFile)
    } catch (err) {
      setError(`Could not load sample image: ${err.message}`)
    }
  }, [imageUrl])

  const handleAnalyze = useCallback(async () => {
    if (!file && !imageUrl) return
    setError(null)
    setResult(null)
    setLoadStep(1)

    try {
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('model', selectedModel)
        const response = await fetch(`${API_URL}/predict?conf=${confThreshold}`, { method: 'POST', body: formData })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.detail || 'Inference failed')
        setResult(payload)
      } else {
        throw new Error('No radiograph selected.')
      }
    } catch (err) {
      setError(err.message || 'Could not contact the backend inference service.')
    } finally {
      setLoadStep(-1)
    }
  }, [file, imageUrl, confThreshold, selectedModel])

  const canAnalyze = useMemo(() => (!!file || !!imageUrl) && !isLoading, [file, imageUrl, isLoading])

  return (
    <section id="demo" className="section-padding" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Interactive Chairside Demo</div>
          <h2 className="section-title">Dental Radiograph Analysis</h2>
          <p className="section-subtitle">
            Upload a dental radiograph, choose YOLO11n detection or DeepLabv3+ segmentation, and inspect the model output.
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
                      <span style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 500 }}>{file?.name || 'Sample Radiograph'}</span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2.5rem' }}>🦷</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: isDragActive ? 'var(--teal-400)' : 'var(--text-primary)' }}>
                        {isDragActive ? 'Drop the dental radiograph here' : 'Drag and drop a dental X-ray'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>JPEG, PNG, or WEBP bitewing or panoramic scan. Max 10 MB.</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--teal-600)' }}>or click to browse local files</div>
                    </>
                  )}
                </div>

                {error && (
                  <div role="alert" style={{ padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                {/* Sample Presets */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Or analyze a sample radiograph
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {SAMPLE_PRESETS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectPreset(sample)}
                        style={{
                          padding: '0.75rem 0.5rem',
                          background: imageUrl === sample.src ? 'rgba(45, 212, 191, 0.12)' : 'var(--bg-card)',
                          border: `1px solid ${imageUrl === sample.src ? 'var(--teal-500)' : 'var(--border-card)'}`,
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: imageUrl === sample.src ? 'var(--teal-400)' : 'var(--text-secondary)',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{sample.emoji}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{sample.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sample.type}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidence Threshold Slider Control */}
                <ConfidenceControl
                  value={confThreshold}
                  onChange={setConfThreshold}
                  disabled={isLoading}
                />

                <button className="btn-primary" onClick={handleAnalyze} disabled={!canAnalyze} style={{ width: '100%', justifyContent: 'center', opacity: canAnalyze ? 1 : 0.4, cursor: canAnalyze ? 'pointer' : 'not-allowed' }}>
                  {isLoading ? `Analyzing with ${selectedModel}...` : `Run ${selectedModel} (${Math.round(confThreshold * 100)}% Cutoff)`}
                </button>
              </>
            )}

            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <label htmlFor="model-choice" style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Choose among the following models
              </label>
              <select
                id="model-choice"
                value={selectedModel}
                onChange={(event) => {
                  setSelectedModel(event.target.value)
                  setResult(null)
                  setError(null)
                }}
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--border-card)' }}
              >
                <option value="YOLO11n">YOLO11n</option>
                <option value="DeepLabv3+">DeepLabv3+</option>
              </select>
            </div>

            {result && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <img
                      src={imageUrl}
                      alt="Selected preview thumbnail"
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid var(--border-card)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {file?.name || 'Sample Radiograph'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--teal-400)' }}>
                        Active Scan Loaded
                      </div>
                    </div>
                  </div>

                  {/* Confidence Control */}
                  <ConfidenceControl
                    value={confThreshold}
                    onChange={setConfThreshold}
                    disabled={isLoading}
                  />

                  <button
                    className="btn-primary"
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
                  >
                    {isLoading ? 'Re-running Analysis...' : `Re-run Detection (${Math.round(confThreshold * 100)}% Cutoff)`}
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={reset}
                    disabled={isLoading}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Upload Another Dental Radiograph
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            {!file && !imageUrl && !result && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px dashed var(--border-card)', color: 'var(--text-muted)', gap: '1rem' }}>
                <span style={{ fontSize: '3rem', opacity: 0.3 }}>🦷</span>
                <span style={{ fontSize: '0.9rem' }}>Upload a dental radiograph or pick a caries sample to plot detection graphs</span>
              </div>
            )}

            {isLoading && <LoadingPanel step={loadStep} model={selectedModel} />}

            {result && imageUrl && (
              <ResultPanel
                result={result}
                imageUrl={imageUrl}
                imageSize={imageSize}
                onReset={reset}
                confThreshold={confThreshold}
                onImageLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
