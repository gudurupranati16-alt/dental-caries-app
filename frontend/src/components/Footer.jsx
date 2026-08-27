import { useState } from 'react'

const TEAM = [
  { name: 'Guduru Pranati',  role: 'ML Engineer',        initials: 'GP' },
  { name: 'Team Member 2',   role: 'Data Scientist',      initials: 'TM' },
  { name: 'Team Member 3',   role: 'Full-stack Dev',      initials: 'TM' },
  { name: 'Dr. Guide Name',  role: 'Project Supervisor',  initials: 'DG' },
]

const FUTURE_SCOPE = [
  {
    title: '3D CBCT Volume Segmentation',
    content:
      'Extend from 2D periapical radiographs to Cone Beam CT (CBCT) volumetric scans using 3D U-Net variants (V-Net, nnU-Net), enabling spatial lesion depth quantification across all tooth surfaces simultaneously.',
  },
  {
    title: 'Longitudinal Caries Progression Tracking',
    content:
      'Register sequential radiographs from the same patient over time to track lesion growth rate, arrest, or remineralization — enabling evidence-based treatment planning and automated recall scheduling.',
  },
  {
    title: 'Federated Learning Across Clinics',
    content:
      'Train the model across multiple hospital networks without sharing patient data (federated learning with differential privacy), increasing dataset diversity without breaching HIPAA/GDPR constraints.',
  },
  {
    title: 'Multi-pathology Detection',
    content:
      'Extend the segmentation head to simultaneously detect periapical abscesses, alveolar bone loss, root fractures, and calculus deposits — moving toward a comprehensive AI-powered dental diagnostic assistant.',
  },
  {
    title: 'Explainability via GradCAM & SHAP',
    content:
      'Integrate GradCAM saliency maps and SHAP explanations into the clinical UI, allowing radiologists to understand which image features drive each classification decision and improve trust in AI recommendations.',
  },
  {
    title: 'Edge Deployment (Mobile & Intraoral Camera)',
    content:
      'Quantize and prune the U-Net model for TensorFlow Lite / ONNX runtime deployment on handheld intraoral cameras (e.g., iTero), enabling chairside real-time caries screening without cloud connectivity.',
  },
]

function AccordionItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: `1px solid ${open ? 'rgba(45,212,191,0.25)' : 'var(--border-card)'}`,
        transition: 'border-color 0.3s',
        background: 'var(--bg-card)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: open ? 'var(--bg-elevated)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          textAlign: 'left',
          transition: 'background 0.2s',
        }}
        aria-expanded={open}
        aria-controls={`scope-${index}`}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: open ? 'rgba(45,212,191,0.15)' : 'var(--bg-surface)',
            border: `1px solid ${open ? 'var(--teal-400)' : 'var(--border-card)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: open ? 'var(--teal-400)' : 'var(--text-muted)',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {index + 1}
        </span>
        <span style={{ flex: 1, fontWeight: 500, fontSize: '0.95rem' }}>{item.title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s',
            color: open ? 'var(--teal-400)' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        id={`scope-${index}`}
        className={`accordion-content ${open ? 'open' : ''}`}
        role="region"
        aria-label={item.title}
      >
        <p style={{ padding: '0.5rem 1.25rem 1.25rem 3.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75 }}>
          {item.content}
        </p>
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer id="team" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="section-container section-padding">
        {/* Future Scope */}
        <div style={{ marginBottom: '4rem' }}>
          <div className="section-label">What's Next</div>
          <h2 className="section-title" style={{ marginBottom: '2rem' }}>Future Scope</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FUTURE_SCOPE.map((item, i) => (
              <AccordionItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* Team */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-label">The Team</div>
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Built By</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {TEAM.map((member) => (
              <div key={member.name} className="avatar-chip">
                <div className="avatar">{member.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{member.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Department of Computer Science & Engineering · Academic Year 2025–26
          </p>
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            🦷 Dental Caries Detection · Deep Learning Project · 2025–26
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Hero', 'Problem', 'Pipeline', 'Demo', 'Results', 'Architecture'].map(section => (
              <button
                key={section}
                onClick={() => document.getElementById(section.toLowerCase() === 'demo' ? 'demo' : section.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--teal-400)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
