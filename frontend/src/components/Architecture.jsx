import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// ─── Model data ───────────────────────────────────────────────────────────────
const MODELS = [
  {
    id: 'resnet50',
    name: 'ResNet50',
    badge: 'Classifier',
    params: '25.6M',
    flops: '4.1 GFLOPs',
    accuracy: 87.4,
    dice: 0.831,
    iou: 0.712,
    color: '#2dd4bf',
    description:
      'Deep residual network with 50 layers and shortcut connections that mitigate vanishing gradients. Pretrained on ImageNet-1k, fine-tuned as a 5-class caries severity classifier. The global average pooling head replaces the original 1000-class FC layer.',
    role: 'Backbone feature extractor + severity classifier',
  },
  {
    id: 'yolov8',
    name: 'YOLOv8',
    badge: 'Detector',
    params: '11.2M',
    flops: '8.7 GFLOPs',
    accuracy: 84.1,
    dice: 0.802,
    iou: 0.687,
    color: '#fbbf24',
    description:
      'Single-stage anchor-free detector with a decoupled head for classification and regression. Achieves real-time lesion localization with bounding-box regression at 640×640 input. Used for region-of-interest proposals fed downstream to U-Net.',
    role: 'Lesion localization & region proposal',
  },
  {
    id: 'unet',
    name: 'U-Net',
    badge: 'Segmentor',
    params: '31.0M',
    flops: '65.5 GFLOPs',
    accuracy: 93.2,
    dice: 0.889,
    iou: 0.801,
    color: '#a855f7',
    description:
      'Encoder-decoder with symmetric skip connections that bridge fine spatial details from contracting path to expanding path. ResNet50 encoder backbone. Output: 5-class 256×256 segmentation mask. Primary production model.',
    role: 'Pixel-level segmentation (primary model)',
  },
  {
    id: 'unetpp',
    name: 'U-Net++',
    badge: 'Segmentor',
    params: '36.6M',
    flops: '83.0 GFLOPs',
    accuracy: 94.1,
    dice: 0.901,
    iou: 0.823,
    color: '#f97316',
    description:
      'Nested U-Net architecture with dense skip connections between encoder and decoder nodes at each resolution. Re-designed skip pathways reduce the semantic gap, improving small-lesion detection. Marginally higher accuracy vs U-Net at higher compute cost.',
    role: 'High-accuracy segmentation (research variant)',
  },
  {
    id: 'resunet',
    name: 'ResUNet',
    badge: 'Hybrid',
    params: '28.3M',
    flops: '58.2 GFLOPs',
    accuracy: 91.7,
    dice: 0.874,
    iou: 0.779,
    color: '#ec4899',
    description:
      'Hybrid combining residual blocks within a U-Net encoder-decoder. Residual connections in both encoder and decoder stages mitigate gradient flow issues during deep supervision. Achieves strong performance with fewer parameters than U-Net++.',
    role: 'Efficient hybrid segmentation',
  },
]

// ─── Flip card ────────────────────────────────────────────────────────────────
function ModelCard({ model, selected, onSelect, onFlip, isFlipped }) {
  return (
    <div
      className={`flip-card ${isFlipped ? 'flipped' : ''} ${selected ? 'selected' : ''}`}
      style={{ position: 'relative' }}
    >
      <div className="flip-card-inner">
        {/* FRONT */}
        <div className="flip-card-front" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Select checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '1rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: `${model.color}22`,
                  color: model.color,
                  border: `1px solid ${model.color}44`,
                  marginBottom: '0.35rem',
                }}
              >
                {model.badge}
              </span>
              <div style={{ fontSize: '1.1rem', fontFamily: 'DM Serif Display, serif', color: 'var(--text-primary)' }}>{model.name}</div>
            </div>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={onSelect}
                style={{ accentColor: 'var(--teal-400)', width: '14px', height: '14px' }}
              />
              Compare
            </label>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', flex: 1 }}>
            {[
              { label: 'Accuracy', value: `${model.accuracy}%` },
              { label: 'Dice',     value: model.dice.toFixed(3) },
              { label: 'IoU',      value: model.iou.toFixed(3) },
              { label: 'Params',   value: model.params },
              { label: 'FLOPs',    value: model.flops, full: true },
            ].map(({ label, value, full }) => (
              <div
                key={label}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '0.375rem',
                  padding: '0.4rem 0.6rem',
                  gridColumn: full ? '1 / -1' : 'auto',
                }}
              >
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: model.color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Flip button */}
          <button
            onClick={onFlip}
            style={{
              marginTop: '0.75rem',
              background: 'none',
              border: '1px solid var(--border-card)',
              borderRadius: '0.375rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--teal-400)'; e.currentTarget.style.color = 'var(--teal-400)' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            aria-label={`View details for ${model.name}`}
          >
            Details →
          </button>
        </div>

        {/* BACK */}
        <div className="flip-card-back" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: model.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{model.badge}</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{model.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{model.role}</div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65, flex: 1 }}>
            {model.description}
          </p>
          <button
            onClick={onFlip}
            style={{
              background: 'none',
              border: '1px solid var(--border-card)',
              borderRadius: '0.375rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Compare chart ────────────────────────────────────────────────────────────
function CompareChart({ selectedModels }) {
  const data = selectedModels.map(m => ({
    name: m.name,
    Accuracy: m.accuracy,
    Dice: +(m.dice * 100).toFixed(1),
    IoU:  +(m.iou  * 100).toFixed(1),
    color: m.color,
  }))

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginTop: '1.5rem',
      animation: 'fadeUp 0.4s ease both',
    }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Model Comparison — {selectedModels.map(m => m.name).join(' vs ')}
      </h3>
      <div style={{ height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <YAxis domain={[60, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-card)', borderRadius: '0.5rem' }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(v, name) => [`${v}%`, name]}
            />
            <Bar dataKey="Accuracy" name="Accuracy" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
            </Bar>
            <Bar dataKey="Dice" name="Dice ×100" fill="#a07840" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Bar dataKey="IoU"  name="IoU ×100"  fill="#4a5568" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main Architecture section ────────────────────────────────────────────────
export default function Architecture() {
  const [flipped, setFlipped] = useState({})
  const [selected, setSelected] = useState(new Set())

  const toggleFlip = (id) => setFlipped(f => ({ ...f, [id]: !f[id] }))

  const toggleSelect = (id) => {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  const selectedModels = MODELS.filter(m => selected.has(m.id))

  return (
    <section id="architecture" className="section-padding" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Model Architecture</div>
          <h2 className="section-title">Architecture Comparison</h2>
          <p className="section-subtitle">
            Five deep learning architectures evaluated for dental caries segmentation.
            Flip each card for architectural details. Select up to 3 to compare.
          </p>
          {selected.size > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selected.size}/3 models selected for comparison
            </div>
          )}
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.25rem' }}>
          {MODELS.map(model => (
            <ModelCard
              key={model.id}
              model={model}
              selected={selected.has(model.id)}
              isFlipped={!!flipped[model.id]}
              onSelect={() => toggleSelect(model.id)}
              onFlip={() => toggleFlip(model.id)}
            />
          ))}
        </div>

        {/* Compare chart */}
        {selectedModels.length >= 2 && <CompareChart selectedModels={selectedModels} />}

        {selectedModels.length === 1 && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(45,212,191,0.07)', borderRadius: '0.5rem', fontSize: '0.82rem', color: 'var(--teal-400)', border: '1px solid rgba(45,212,191,0.2)' }}>
            Select one more model to enable the comparison chart (up to 3).
          </div>
        )}
      </div>
    </section>
  )
}
