import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:8000'

function MetricCard({ label, value }) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ marginTop: '0.35rem', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700 }}>
        {value}
      </div>
    </div>
  )
}

export default function Results() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(async (response) => {
        if (!response.ok) throw new Error('No evaluation artifact found yet.')
        return response.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section id="results" className="section-padding" style={{ background: 'var(--bg-deep)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Evaluation</div>
          <h2 className="section-title">Real Metrics Only</h2>
          <p className="section-subtitle">
            This section stays empty until you train a checkpoint and run the evaluation script. No fabricated curves or scores are shown.
          </p>
        </div>

        {error && (
          <div className="card" style={{ padding: '1rem', borderColor: 'rgba(45,212,191,0.25)' }}>
            <strong style={{ color: 'var(--teal-400)' }}>Evaluation unavailable.</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>{error}</span>
          </div>
        )}

        {!data && !error && (
          <div className="card" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
            Loading evaluation status...
          </div>
        )}

        {data && data.summary && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Evaluation Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <MetricCard label="Precision" value={data.summary.precision != null ? data.summary.precision.toFixed(4) : 'n/a'} />
                <MetricCard label="Recall" value={data.summary.recall != null ? data.summary.recall.toFixed(4) : 'n/a'} />
                <MetricCard label="mAP@0.50" value={data.summary.map50 != null ? data.summary.map50.toFixed(4) : 'n/a'} />
                <MetricCard label="mAP@0.50:0.95" value={data.summary.map50_95 != null ? data.summary.map50_95.toFixed(4) : 'n/a'} />
              </div>
            </div>

            {Array.isArray(data.per_class) && data.per_class.length > 0 && (
              <div className="card" style={{ padding: '1rem' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Per-Class mAP</h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {data.per_class.map((row) => (
                    <div key={`${row.class_id}-${row.class_name}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{row.class_name}</span>
                      <span style={{ color: 'var(--teal-400)', fontWeight: 700 }}>{row.map != null ? row.map.toFixed(4) : 'n/a'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {data && !data.summary && (
          <div className="card" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
            {data.message || 'Evaluation artifact is present, but no summary metrics have been generated yet.'}
          </div>
        )}
      </div>
    </section>
  )
}
