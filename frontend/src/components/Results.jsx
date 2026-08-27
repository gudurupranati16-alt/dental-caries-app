import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Brush, Legend as RechartsLegend,
} from 'recharts'

const API_URL = 'http://localhost:8000'

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-card)',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '0.82rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Epoch {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </div>
      ))}
    </div>
  )
}

// ─── Training curves ──────────────────────────────────────────────────────────
function TrainingCurves({ data }) {
  const [view, setView] = useState('accuracy')

  const chartData = useMemo(() =>
    data.history.epochs.map((ep, i) => ({
      epoch: ep,
      'Train Acc':  data.history.train_acc[i],
      'Val Acc':    data.history.val_acc[i],
      'Train Loss': data.history.train_loss[i],
      'Val Loss':   data.history.val_loss[i],
    })), [data])

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['accuracy', 'loss'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '0.4rem 1.1rem',
              borderRadius: '0.375rem',
              border: '1px solid',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              borderColor: view === v ? 'var(--teal-400)' : 'var(--border-card)',
              background: view === v ? 'rgba(45,212,191,0.1)' : 'var(--bg-card)',
              color: view === v ? 'var(--teal-400)' : 'var(--text-secondary)',
            }}
          >
            {v === 'accuracy' ? '📈 Accuracy' : '📉 Loss'}
          </button>
        ))}
      </div>

      <div style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={view === 'accuracy' ? [0.5, 1] : [0, 1.6]} />
            <Tooltip content={<CustomTooltip />} />
            <RechartsLegend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
            <Brush dataKey="epoch" height={20} stroke="var(--border-card)" fill="var(--bg-card)" travellerWidth={6} />

            {view === 'accuracy' ? (
              <>
                <Line type="monotone" dataKey="Train Acc" stroke="#2dd4bf" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Val Acc"   stroke="#a07840" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4 }} />
              </>
            ) : (
              <>
                <Line type="monotone" dataKey="Train Loss" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Val Loss"   stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4 }} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Confusion matrix ─────────────────────────────────────────────────────────
function ConfusionMatrix({ data }) {
  const [highlighted, setHighlighted] = useState(null) // {row, col}
  const { labels, matrix } = data.confusion_matrix
  const n = labels.length

  const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0))

  const maxVal = Math.max(...matrix.flat())

  const cellColor = (val, row, col) => {
    const intensity = val / maxVal
    if (row === col) {
      // Diagonal: teal (correct)
      return `rgba(45,212,191,${0.1 + intensity * 0.7})`
    }
    return `rgba(239,68,68,${0.05 + intensity * 0.5})`
  }

  const isHighlighted = (row, col) => {
    if (!highlighted) return false
    return highlighted.row === row || highlighted.col === col
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '360px' }}>
        {/* Column headers */}
        <div style={{ display: 'flex', marginLeft: '90px', marginBottom: '4px' }}>
          {labels.map((l, j) => (
            <div
              key={j}
              style={{
                width: '64px',
                textAlign: 'center',
                fontSize: '0.65rem',
                color: highlighted?.col === j ? 'var(--teal-400)' : 'var(--text-muted)',
                fontWeight: highlighted?.col === j ? 700 : 400,
                transition: 'color 0.2s',
                lineHeight: 1.2,
                padding: '0 2px',
              }}
            >
              {l}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '90px', marginBottom: '6px', textAlign: 'center', width: `${n * 64}px` }}>
          Predicted →
        </div>

        {/* Rows */}
        {matrix.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            {/* Row label */}
            <div
              style={{
                width: '88px',
                textAlign: 'right',
                paddingRight: '8px',
                fontSize: '0.65rem',
                lineHeight: 1.2,
                color: highlighted?.row === i ? 'var(--teal-400)' : 'var(--text-muted)',
                fontWeight: highlighted?.row === i ? 700 : 400,
                transition: 'color 0.2s',
              }}
            >
              {labels[i]}
            </div>

            {/* Cells */}
            {row.map((val, j) => {
              const pct = ((val / rowTotals[i]) * 100).toFixed(1)
              return (
                <div
                  key={j}
                  className={`cm-cell ${isHighlighted(i, j) ? 'highlight' : ''}`}
                  style={{ background: cellColor(val, i, j) }}
                  onMouseEnter={() => setHighlighted({ row: i, col: j })}
                  onMouseLeave={() => setHighlighted(null)}
                  onClick={() => setHighlighted(highlighted?.row === i && highlighted?.col === j ? null : { row: i, col: j })}
                  title={`Actual: ${labels[i]} | Predicted: ${labels[j]}\nCount: ${val} | Row %: ${pct}%`}
                  role="gridcell"
                  aria-label={`Actual ${labels[i]}, Predicted ${labels[j]}: ${val} (${pct}%)`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setHighlighted({ row: i, col: j })}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{val}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>{pct}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '90px', marginTop: '4px', writingMode: 'unset' }}>
          ↑ Actual
        </div>
      </div>

      {highlighted && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--teal-400)' }}>Selected cell:</strong>{' '}
          Actual <strong>{labels[highlighted.row]}</strong> → Predicted <strong>{labels[highlighted.col]}</strong>:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{matrix[highlighted.row][highlighted.col]}</strong> samples
          ({((matrix[highlighted.row][highlighted.col] / rowTotals[highlighted.row]) * 100).toFixed(1)}% of row)
        </div>
      )}
    </div>
  )
}

// ─── IoU / Dice sortable table ────────────────────────────────────────────────
function MetricsTable({ data }) {
  const [sortKey, setSortKey] = useState('iou')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = useMemo(() => {
    return [...data.per_class_metrics].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === 'asc' ? diff : -diff
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const cols = [
    { key: 'class',     label: 'Class' },
    { key: 'iou',       label: 'IoU' },
    { key: 'dice',      label: 'Dice' },
    { key: 'precision', label: 'Precision' },
    { key: 'recall',    label: 'Recall' },
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
            {cols.map(c => (
              <th
                key={c.key}
                className={`sortable-th ${sortKey === c.key ? 'sorted' : ''}`}
                onClick={() => handleSort(c.key)}
                style={{ padding: '0.6rem 0.75rem', textAlign: c.key === 'class' ? 'left' : 'right', color: 'var(--text-secondary)' }}
                aria-sort={sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {c.label} {sortKey === c.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.class}
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
            >
              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>{row.class}</td>
              {['iou', 'dice', 'precision', 'recall'].map(k => (
                <td key={k} style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ width: '50px', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row[k] * 100}%`, background: 'var(--teal-500)', borderRadius: '2px' }} />
                    </div>
                    <span style={{ color: row[k] > 0.8 ? 'var(--teal-400)' : row[k] > 0.7 ? 'var(--brown-300)' : 'var(--color-moderate)' }}>
                      {row[k].toFixed(3)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Results section ─────────────────────────────────────────────────────
export default function Results() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {
        // Fallback: fetch from bundled JSON (put results.json in /public)
        fetch('/results.json')
          .then(r => r.json())
          .then(setData)
          .catch(() => setError('Could not load metrics data.'))
      })
  }, [])

  return (
    <section id="results" className="section-padding" style={{ background: 'var(--bg-deep)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Evaluation</div>
          <h2 className="section-title">Training Results & Performance</h2>
          <p className="section-subtitle">
            50-epoch training on the DENTEX + custom augmented dataset. All metrics evaluated
            on a held-out 20% test split with class-balanced sampling.
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {!data && !error && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '1rem' }} />)}
          </div>
        )}

        {data && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Training curves */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Training Curves</h3>
              <TrainingCurves data={data} />
            </div>

            {/* Confusion matrix + metrics table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Confusion Matrix</h3>
                <ConfusionMatrix data={data} />
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                  Per-Class Metrics
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>click headers to sort</span>
                </h3>
                <MetricsTable data={data} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
