import NewProspectForm from './NewProspectForm'

export default function NewProspectPage() {
  return (
    <div style={{ padding: '36px 44px', maxWidth: 640 }}>
      <h1
        style={{
          margin: '0 0 6px',
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        Add Prospect
      </h1>
      <p style={{ margin: '0 0 32px', fontSize: 13, color: '#475569' }}>
        Track someone you want to bring into the pipeline.
      </p>
      <NewProspectForm />
    </div>
  )
}
