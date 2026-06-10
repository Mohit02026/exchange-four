interface ReviewSection {
  id: string
  section: string
  rating: string | null
  notes: string | null
}

interface Note {
  id: string
  content: string
  authorId: string
  createdAt: string
}

interface ReviewNotesTabProps {
  review: {
    status: string
    notesForAvi: string | null
    privateNotes: string | null
    sections: ReviewSection[]
    notes: Note[]
  } | null
}

const RATING_COLORS: Record<string, string> = {
  STRONG: 'bg-green-100 text-green-800',
  GOOD: 'bg-blue-100 text-blue-800',
  AVERAGE: 'bg-yellow-100 text-yellow-800',
  WEAK: 'bg-red-100 text-red-800',
  CONCERN: 'bg-red-100 text-red-800',
}

export default function ReviewNotesTab({ review }: ReviewNotesTabProps) {
  if (!review) {
    return <p className="text-sm text-gray-500">No review started yet.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          review.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {review.status}
        </span>
      </div>

      {review.sections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Review Sections</h3>
          <div className="space-y-3">
            {review.sections.map(s => (
              <div key={s.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{s.section}</span>
                  {s.rating && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RATING_COLORS[s.rating] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.rating}
                    </span>
                  )}
                </div>
                {s.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {review.notesForAvi && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes for Avi</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 p-3 rounded">{review.notesForAvi}</p>
        </div>
      )}

      {review.privateNotes && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Private Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded">{review.privateNotes}</p>
        </div>
      )}

      {review.notes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Thread Notes</h3>
          <ul className="space-y-2">
            {review.notes.map(n => (
              <li key={n.id} className="text-sm border-l-2 border-gray-200 pl-3">
                <p className="text-gray-700">{n.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
