'use client'

export default function VideoPlayer({ url, label = 'Video' }: { url: string; label?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <video
        src={url}
        controls
        style={{ width: '100%', borderRadius: 6, background: '#000', maxHeight: 320 }}
      />
    </div>
  )
}
