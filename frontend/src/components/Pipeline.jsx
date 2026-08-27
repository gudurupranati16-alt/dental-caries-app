import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Pipeline stage data ─────────────────────────────────────────────────────
const STAGES = [
  {
    id: 0,
    icon: '📷',
    label: 'Image Acquisition',
    shortLabel: 'Acquisition',
    technique: 'Intraoral Radiography',
    description:
      'Digital periapical and bitewing radiographs are captured using CMOS/PSP sensors at standardized angulations. DICOM metadata is preserved for clinical traceability. Image resolution targets ≥ 800×600 px at 8-bit depth.',
    parameters: 'Format: DICOM / PNG · Bit depth: 8-bit · Resolution: ≥ 800×600px · kVp: 60–70 · Exposure: 0.06–0.1 s',
    before: null,
    after: null,
    beforeLabel: 'Raw DICOM',
    afterLabel: 'Standardized PNG',
  },
  {
    id: 1,
    icon: '🔬',
    label: 'Preprocessing',
    shortLabel: 'Preprocessing',
    technique: 'CLAHE + Gaussian Denoising',
    description:
      'Contrast Limited Adaptive Histogram Equalization (CLAHE) enhances local contrast in regions with varying illumination — critical for detecting subtle early enamel lesions. A Gaussian kernel then suppresses sensor noise while preserving structural edges.',
    parameters: 'CLAHE clip limit: 2.0 · Tile grid: 8×8 · Gaussian σ: 1.0 · Resize: 256×256 · Normalize: μ=[0.485,0.456,0.406], σ=[0.229,0.224,0.225]',
    beforeLabel: 'Raw X-ray',
    afterLabel: 'CLAHE Enhanced',
  },
  {
    id: 2,
    icon: '🔄',
    label: 'Augmentation',
    shortLabel: 'Augmentation',
    technique: 'Geometric & Intensity Augmentation',
    description:
      'To address class imbalance and improve model generalization, training images undergo stochastic augmentation. Geometric transforms (horizontal flip, ±15° rotation, random crop) mimic realistic anatomical variation. Intensity jitter simulates acquisition variability.',
    parameters: 'Horizontal flip p=0.5 · Rotation ±15° · Random crop (224×224) · Brightness jitter ±20% · Gaussian noise σ∈[0,0.05] · Elastic deformation α=34',
    beforeLabel: 'Original',
    afterLabel: 'Augmented',
  },
  {
    id: 3,
    icon: '🧠',
    label: 'Model Training',
    shortLabel: 'Training',
    technique: 'ResNet50 + YOLOv8 + U-Net Ensemble',
    description:
      'Three architectures are trained in parallel. ResNet50 (ImageNet pretrained) serves as the backbone classifier. YOLOv8 performs lesion localization with bounding-box regression. U-Net with skip connections generates pixel-level segmentation masks. Ensemble voting combines predictions.',
    parameters: 'Optimizer: AdamW · LR: 1e-4 (cosine decay) · Epochs: 50 · Batch: 16 · Loss: Dice + BCE (λ=0.5) · GPU: NVIDIA T4 · Pretrain: ImageNet',
    beforeLabel: 'Untrained',
    afterLabel: 'Converged (50 epochs)',
  },
  {
    id: 4,
    icon: '📊',
    label: 'Output & Classification',
    shortLabel: 'Output',
    technique: 'Segmentation Mask + Severity Classification',
    description:
      'The U-Net decoder produces a 5-class semantic segmentation mask (Sound / Early Enamel / Moderate Dentinal / Severe / Root Surface). Class confidence scores are derived from softmax probabilities. Inference runs in < 50 ms on CPU for the 256×256 input.',
    parameters: 'Classes: 5 · Output: 256×256 RGBA mask · Confidence: softmax probability · Inference: ~35–50 ms CPU · API format: base64 PNG + JSON metadata',
    beforeLabel: 'X-ray Input',
    afterLabel: 'Segmentation Mask',
  },
]

// ─── SVG connector between nodes ─────────────────────────────────────────────
function Connector({ active }) {
  return (
    <svg
      height="4"
      style={{ flex: 1, overflow: 'visible', marginTop: '-1.5rem' }}
      preserveAspectRatio="none"
    >
      <line x1="0" y1="2" x2="100%" y2="2" stroke="var(--bg-elevated)" strokeWidth="2" />
      <line
        x1="0" y1="2" x2="100%" y2="2"
        stroke="var(--teal-400)"
        strokeWidth="2"
        strokeDasharray="200"
        strokeDashoffset={active ? 0 : 200}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Single pipeline node ─────────────────────────────────────────────────────
function PipelineNode({ stage, state, onClick }) {
  return (
    <button
      className={`pipeline-node ${state}`}
      onClick={onClick}
      aria-pressed={state === 'active'}
      aria-label={`Stage: ${stage.label}`}
      style={{ background: 'none', border: 'none' }}
    >
      <div className="node-circle">
        <span role="img" aria-hidden="true">{stage.icon}</span>
        {state === 'completed' && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'var(--teal-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: 'white',
            }}
          >
            ✓
          </span>
        )}
      </div>
      <span className="node-label">{stage.shortLabel}</span>
    </button>
  )
}

// ─── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ stage }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(45,212,191,0.2)',
        borderRadius: '1rem',
        padding: '1.75rem',
        animation: 'fadeUp 0.35s ease both',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--teal-400)', marginBottom: '0.25rem' }}>
            Stage {stage.id + 1} of 5
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{stage.label}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--brown-300)', fontWeight: 500 }}>{stage.technique}</span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
        {stage.description}
      </p>

      {/* Parameters */}
      <div
        style={{
          background: 'var(--bg-deep)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontFamily: 'monospace',
          fontSize: '0.78rem',
          color: 'var(--teal-400)',
          lineHeight: 1.8,
          borderLeft: '3px solid var(--teal-600)',
        }}
      >
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Parameters</div>
        {stage.parameters}
      </div>

      {/* Before / after labels */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {[stage.beforeLabel, stage.afterLabel].map((label, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{i === 0 ? '◻️' : '✅'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mobile vertical accordion ───────────────────────────────────────────────
function MobileAccordion() {
  const [open, setOpen] = useState(null)
  return (
    <div className="pipeline-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {STAGES.map((stage) => (
        <div key={stage.id} style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
          <button
            onClick={() => setOpen(open === stage.id ? null : stage.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              background: open === stage.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{stage.icon}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{stage.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: open === stage.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className={`accordion-content ${open === stage.id ? 'open' : ''}`}>
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '0.75rem' }}>{stage.description}</p>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-deep)', borderRadius: '0.375rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--teal-400)', borderLeft: '3px solid var(--teal-600)' }}>
                {stage.parameters}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────
export default function Pipeline() {
  const [activeStage, setActiveStage] = useState(0)
  const [completedStages, setCompletedStages] = useState(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)
  const progressRef = useRef(null)

  const advance = useCallback(() => {
    setActiveStage((prev) => {
      const next = (prev + 1) % STAGES.length
      setCompletedStages((c) => new Set([...c, prev]))
      if (next === 0) setCompletedStages(new Set())
      return next
    })
    setProgress(0)
  }, [])

  useEffect(() => {
    if (isPlaying) {
      // Progress bar within each 2.5s step
      let elapsed = 0
      progressRef.current = setInterval(() => {
        elapsed += 50
        setProgress(Math.min((elapsed / 2500) * 100, 100))
      }, 50)
      intervalRef.current = setInterval(advance, 2500)
    } else {
      clearInterval(intervalRef.current)
      clearInterval(progressRef.current)
      setProgress(0)
    }
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(progressRef.current)
    }
  }, [isPlaying, advance])

  const handleNodeClick = (id) => {
    setIsPlaying(false)
    setActiveStage(id)
    setCompletedStages(new Set(STAGES.slice(0, id).map((s) => s.id)))
  }

  const getState = (id) => {
    if (id === activeStage) return 'active'
    if (completedStages.has(id)) return 'completed'
    return 'dimmed'
  }

  return (
    <section id="pipeline" className="section-padding" style={{ background: 'var(--bg-deep)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Methodology</div>
          <h2 className="section-title">Detection Pipeline</h2>
          <p className="section-subtitle">
            An end-to-end deep learning workflow from raw radiographic input to
            pixel-level segmentation and severity classification.
          </p>
        </div>

        {/* Horizontal stepper — desktop */}
        <div className="pipeline-horizontal">
          {/* Play button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={isPlaying ? 'btn-ghost' : 'btn-primary'}
              style={{ gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
            >
              {isPlaying ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  Pause Pipeline
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Play Pipeline
                </>
              )}
            </button>
          </div>

          {/* Nodes row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
            {STAGES.map((stage, i) => (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <PipelineNode
                  stage={stage}
                  state={getState(stage.id)}
                  onClick={() => handleNodeClick(stage.id)}
                />
                {i < STAGES.length - 1 && (
                  <div style={{ flex: 1, height: '2px', position: 'relative', marginTop: '-1.5rem' }}>
                    <div style={{ height: '2px', background: 'var(--bg-elevated)', width: '100%' }} />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '2px',
                        background: 'var(--teal-400)',
                        width: completedStages.has(stage.id) ? '100%' : '0%',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar under active node */}
          {isPlaying && (
            <div style={{ marginTop: '0.5rem', height: '2px', background: 'var(--bg-elevated)', borderRadius: '1px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--teal-500), var(--teal-400))',
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          )}

          {/* Detail panel */}
          <DetailPanel stage={STAGES[activeStage]} />
        </div>

        {/* Mobile vertical accordion */}
        <MobileAccordion />
      </div>
    </section>
  )
}
