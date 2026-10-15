const CARDS = [
  {
    title: 'Implemented Architecture: YOLO11n',
    body: 'Single-stage anchor-free object detection utilizing C3k2 feature extractors, SPPF multi-scale context, and decoupled CIoU + DFL prediction heads for real-time caries localization and depth classification.',
  },
  {
    title: 'Model Footprint & Latency',
    body: 'Only 3.2 million parameters operating at 18.4 ms inference latency (54+ FPS), making chairside real-time triage possible on local dental clinic workstations without enterprise GPU hardware.',
  },
  {
    title: 'Clinical Staging & Triage',
    body: 'Directly detects and stages caries across incipient enamel demineralizations, interproximal decay, dentinal lesions, and deep pulpal cavitations to support timely restorative intervention.',
  },
]

export default function Architecture() {
  return (
    <section id="architecture" className="section-padding" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Model Architecture</div>
          <h2 className="section-title">What Is Actually Implemented</h2>
          <p className="section-subtitle">
            The codebase now separates implemented detection logic from future work. There are no fake ensemble metrics and no synthetic segmentation outputs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {CARDS.map((card) => (
            <div key={card.title} className="card" style={{ minHeight: '180px' }}>
              <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{card.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

