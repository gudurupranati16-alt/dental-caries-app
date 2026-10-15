const STAGES = [
  {
    id: 0,
    icon: '1',
    label: 'Dataset inspection',
    description: 'Inspect the curated dental radiograph dataset, count images and caries annotations, and verify image resolutions and lesion coordinates.',
  },
  {
    id: 1,
    icon: '2',
    label: 'Dataset preparation',
    description: 'Convert verified caries bounding-box annotations into normalized YOLO format with images/, labels/, and data.yaml configuration.',
  },
  {
    id: 2,
    icon: '3',
    label: 'YOLO11n training',
    description: 'Fine-tune a pretrained YOLO11n checkpoint on dental caries annotations with CLAHE enhancement, cosine annealing, and mosaic augmentation.',
  },
  {
    id: 3,
    icon: '4',
    label: 'Evaluation and inference',
    description: 'Evaluate the trained YOLO11n checkpoint on a held-out split, log real metrics, and serve high-throughput chairside inference through FastAPI.',
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
          <h2 className="section-title">Reproducible Caries Detection Pipeline</h2>
          <p className="section-subtitle">
            The production workflow: inspect the radiograph dataset, prepare caries annotations, train YOLO11n with anchor-free decoupled heads, and serve real-time chairside inference.
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

