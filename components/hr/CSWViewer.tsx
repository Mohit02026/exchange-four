'use client'

export default function CSWViewer({ content }: { content: string }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '28px 32px',
      fontSize: 14,
      lineHeight: 1.8,
      color: '#111',
      whiteSpace: 'pre-wrap',
      fontFamily: 'Georgia, serif',
    }}>
      {content}
    </div>
  )
}
