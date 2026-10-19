import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API_URL = 'http://localhost:8000'
const MODELS = ['YOLO11n', 'DeepLabv3+']
const COLORS = ['#38bdf8', '#2dd4bf', '#a78bfa', '#f59e0b', '#fb7185', '#34d399', '#f97316', '#c084fc']
const DEFAULT_SELECTION = {
  YOLO11n: ['metrics/mAP50(B)'],
  'DeepLabv3+': ['val_dice'],
}

function GraphTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.3rem' }}>
        Epoch {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(5)}
        </div>
      ))}
    </div>
  )
}

function bestValue(metric) {
  const bestPoint = metric.points.find((point) => point.epoch === metric.best_epoch)
  return bestPoint?.value
}

function bestEpochDescription(metric) {
  const value = bestValue(metric)
  const marker = metric.goal === 'final' ? 'Final' : 'Best'
  return `${marker} epoch ${metric.best_epoch}${value === undefined ? '' : ` · ${value.toFixed(5)}`}`
}

function BestEpochDot(metric, color) {
  return (point) => (
    point.payload?.epoch === metric.best_epoch
      ? <circle cx={point.cx} cy={point.cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
      : null
  )
}

function GraphCard({ title, subtitle, children }) {
  return (
    <article className="card" style={{ minWidth: 0, padding: '1.25rem' }}>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>{title}</h3>
      {subtitle && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.7rem' }}>{subtitle}</p>
      )}
      <div style={{ width: '100%', height: 270 }}>{children}</div>
    </article>
  )
}

function MetricDropdown({ model, options, selected, onChange }) {
  const [open, setOpen] = useState(false)

  function toggleMetric(metricId) {
    onChange(
      selected.includes(metricId)
        ? selected.filter((id) => id !== metricId)
        : [...selected, metricId],
    )
  }

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>{model}</div>
      <button
        type="button"
        className="btn-ghost"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{ width: '100%', justifyContent: 'space-between', minHeight: '2.75rem' }}
      >
        {selected.length ? `${selected.length} metric${selected.length === 1 ? '' : 's'} selected` : 'Choose metrics'}
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '18rem',
            overflowY: 'auto',
            marginTop: '0.35rem',
            padding: '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-card)',
            borderRadius: '0.5rem',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          }}
        >
          {options.map((metric) => (
            <label
              key={metric.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.45rem',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(metric.id)}
                onChange={() => toggleMetric(metric.id)}
              />
              <span>{metric.label}</span>
            </label>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setOpen(false)}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.35rem' }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

function MetricChart({ model, metric, color }) {
  const points = metric.points
  return (
    <GraphCard title={`${model} · ${metric.label}`} subtitle={bestEpochDescription(metric)}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 12, right: 18, bottom: 8, left: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="epoch" type="number" domain={['dataMin', 'dataMax']} stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip content={<GraphTooltip />} />
          <ReferenceLine
            x={metric.best_epoch}
            stroke={color}
            strokeDasharray="4 4"
            label={{ value: `Epoch ${metric.best_epoch}`, fill: color, fontSize: 10, position: 'insideTopRight' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={metric.label}
            stroke={color}
            strokeWidth={2}
            dot={BestEpochDot(metric, color)}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </GraphCard>
  )
}

export default function Results() {
  const [models, setModels] = useState(null)
  const [error, setError] = useState(null)
  const [selection, setSelection] = useState(DEFAULT_SELECTION)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/training-metrics`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.detail || 'Training metrics are unavailable.')
        return payload
      })
      .then((payload) => {
        if (!MODELS.every((model) => Array.isArray(payload[model]?.metrics))) {
          throw new Error('Training metric data is missing for one or both models.')
        }
        setModels(payload)
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message)
      })
    return () => controller.abort()
  }, [])

  const selectedSeries = useMemo(() => {
    if (!models) return []
    return MODELS.flatMap((model) => (
      models[model].metrics
        .filter((metric) => selection[model].includes(metric.id))
        .map((metric) => ({ model, metric }))
    ))
  }, [models, selection])

  const comparisonData = useMemo(() => {
    if (!selectedSeries.length) return []
    const maxEpoch = Math.max(...selectedSeries.flatMap(({ metric }) => metric.points.map(({ epoch }) => epoch)))
    const pointsBySeries = selectedSeries.map(({ model, metric }, index) => ({
      key: `${model}:${metric.id}`,
      model,
      metric,
      color: COLORS[index % COLORS.length],
      points: new Map(metric.points.map((point) => [point.epoch, point.value])),
    }))
    return {
      rows: Array.from({ length: maxEpoch }, (_, index) => {
        const epoch = index + 1
        return Object.assign(
          { epoch },
          ...pointsBySeries.map(({ key, points }) => (
            points.has(epoch) ? { [key]: points.get(epoch) } : {}
          )),
        )
      }),
      series: pointsBySeries,
    }
  }, [selectedSeries])

  const bestEpochs = useMemo(() => {
    const epochs = new Map()
    for (const series of comparisonData.series || []) {
      const epoch = series.metric.best_epoch
      if (!epochs.has(epoch)) epochs.set(epoch, series)
    }
    return [...epochs.entries()]
  }, [comparisonData])

  return (
    <section id="results" className="section-padding" style={{ background: 'var(--bg-deep)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-label">Graphs</div>
          <h2 className="section-title">Training Metrics &amp; Model Comparison</h2>
          <p className="section-subtitle">
            Choose metrics from either or both models to compare them. Each individual graph marks that metric&apos;s best or final epoch.
          </p>
        </div>

        {error && (
          <div role="alert" className="card" style={{ marginBottom: '1rem', padding: '1rem', color: '#f87171' }}>
            Could not load training graphs: {error}
          </div>
        )}
        {!models && !error && (
          <div className="card" role="status" style={{ marginBottom: '1rem', padding: '1rem', color: 'var(--text-secondary)' }}>
            Loading training summaries…
          </div>
        )}

        {models && (
          <>
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                Combined comparison
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Select one or more metrics in either menu. Epochs run independently for each model; dashed markers show the best/final epoch of each selected series.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                {MODELS.map((model) => (
                  <MetricDropdown
                    key={model}
                    model={model}
                    options={models[model].metrics}
                    selected={selection[model]}
                    onChange={(nextSelection) => setSelection((current) => ({ ...current, [model]: nextSelection }))}
                  />
                ))}
              </div>

              {selectedSeries.length > 0 ? (
                <>
                  <div style={{ width: '100%', height: 380, marginTop: '1.25rem' }}>
                    <ResponsiveContainer>
                      <LineChart data={comparisonData.rows} margin={{ top: 18, right: 24, bottom: 16, left: 8 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="epoch" type="number" domain={[1, 'dataMax']} stroke="var(--text-muted)">
                          <Label value="Epoch" offset={-6} position="insideBottom" fill="var(--text-muted)" />
                        </XAxis>
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip content={<GraphTooltip />} />
                        <Legend />
                        {bestEpochs.map(([epoch, series]) => (
                          <ReferenceLine
                            key={epoch}
                            x={epoch}
                            stroke={series.color}
                            strokeDasharray="4 4"
                            label={{ value: `E${epoch}`, fill: series.color, fontSize: 10, position: 'insideTopRight' }}
                          />
                        ))}
                        {comparisonData.series.map(({ key, model, metric, color }) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={`${model} · ${metric.label}`}
                            stroke={color}
                            strokeWidth={2}
                            connectNulls={false}
                            dot={BestEpochDot(metric, color)}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.5rem' }}>
                    {comparisonData.series.map(({ key, model, metric, color }) => (
                      <span
                        key={key}
                        style={{
                          padding: '0.3rem 0.55rem',
                          borderRadius: '0.35rem',
                          background: 'var(--bg-elevated)',
                          color,
                          fontSize: '0.72rem',
                        }}
                      >
                        {model} · {metric.label}: {bestEpochDescription(metric)}
                      </span>
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.7rem' }}>
                    Metrics retain their original values and scales. For the selected series, compare epochs over the full 1–100 range; each model&apos;s line ends at its last recorded epoch.
                  </p>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Select at least one metric to display the combined graph.
                </p>
              )}
            </div>

            {MODELS.map((model) => (
              <div key={model} style={{ marginTop: '2rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.35rem', marginBottom: '1rem' }}>
                  {model} — Individual Metrics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '1rem' }}>
                  {models[model].metrics.map((metric, index) => (
                    <MetricChart
                      key={metric.id}
                      model={model}
                      metric={metric}
                      color={COLORS[index % COLORS.length]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
