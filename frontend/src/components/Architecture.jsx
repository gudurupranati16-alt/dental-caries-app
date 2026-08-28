const CARDS = [
  {
    title: 'Implemented baseline',
    body: 'YOLO-style object detection on the fully annotated DENTEX subset. This is the only production model path at the moment.',
  },
  {
    title: 'Optional extension',
    body: 'A second-stage classifier such as ResNet-50 can be added later on detected crops if a separate labeled classification task is desired.',
  },
  {
    title: 'Not in production',
    body: 'U-Net segmentation is not part of the current inference path because DENTEX exposes bounding-box supervision, not pixel masks.',
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

