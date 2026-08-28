const STAGES = [
  {
    id: 0,
    icon: '1',
    label: 'Dataset inspection',
    description: 'Inspect the local DENTEX extract, count images and annotations, and confirm whether the files are COCO-like, JSON-based, or directory-based.',
  },
  {
    id: 1,
    icon: '2',
    label: 'Dataset preparation',
    description: 'Convert the verified DENTEX annotations into a YOLO dataset with images/, labels/, and data.yaml in an ignored output directory.',
  },
  {
    id: 2,
    icon: '3',
    label: 'YOLO training',
    description: 'Fine-tune a pretrained YOLO checkpoint on the prepared detection dataset with reproducible settings and a CPU fallback when CUDA is unavailable.',
  },
  {
    id: 3,
    icon: '4',
    label: 'Evaluation and inference',
    description: 'Evaluate the trained checkpoint on a held-out split, save real metrics, and serve honest detection results through the backend.',
  },
]

function StageCard({ stage }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '220px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(45,212,191,0.12)', color: 'var(--teal-400)', border: '1px solid rgba(45,212,191,0.2)', fontWeight: 700 }}>
        {stage.icon}
      </div>
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{stage.label}</h3>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{stage.description}</p>
    </div>
  )
}

export default function Pipeline() {
  return (
    <section id="pipeline" className="section-padding" style={{ background: 'var(--bg-deep)' }}>
      <div className="section-container">
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="section-label">Methodology</div>
          <h2 className="section-title">Reproducible DENTEX Pipeline</h2>
          <p className="section-subtitle">
            The production path is a real detection workflow: inspect the dataset, convert verified annotations, train YOLO, and serve real inference from a saved checkpoint.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {STAGES.map((stage) => (
            <StageCard key={stage.id} stage={stage} />
          ))}
        </div>
      </div>
    </section>
  )
}

