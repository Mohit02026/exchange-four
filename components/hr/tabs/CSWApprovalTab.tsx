interface CSWApprovalTabProps {
  csw: {
    status: string
    content: string
    sourceFields: unknown
    missingFields: unknown
    approvedAt: string | null
    driveFileId: string | null
  } | null
  approvalRequest: {
    sentAt: string
    tokenUsed: boolean
    decision: {
      decision: string
      reason: string | null
      notes: string | null
      decidedAt: string
    } | null
  } | null
}

export default function CSWApprovalTab({ csw, approvalRequest }: CSWApprovalTabProps) {
  if (!csw) {
    return <p className="text-sm text-gray-500">No CSW generated yet.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          csw.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          csw.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          CSW {csw.status}
        </span>
        {csw.approvedAt && (
          <span className="text-xs text-gray-500">Approved {new Date(csw.approvedAt).toLocaleDateString()}</span>
        )}
        {csw.driveFileId && (
          <span className="text-xs text-gray-500">Stored</span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">CSW Content</h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
          {csw.content}
        </div>
      </div>

      {approvalRequest && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Avi Decision</h3>
          {approvalRequest.decision ? (
            <div className={`p-4 rounded-lg border ${
              approvalRequest.decision.decision === 'APPROVED'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-semibold ${
                  approvalRequest.decision.decision === 'APPROVED' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {approvalRequest.decision.decision}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(approvalRequest.decision.decidedAt).toLocaleDateString()}
                </span>
              </div>
              {approvalRequest.decision.reason && (
                <p className="text-sm text-gray-700 mb-1"><strong>Reason:</strong> {approvalRequest.decision.reason}</p>
              )}
              {approvalRequest.decision.notes && (
                <p className="text-sm text-gray-700"><strong>Notes:</strong> {approvalRequest.decision.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Sent to Avi on {new Date(approvalRequest.sentAt).toLocaleDateString()}.{' '}
              {approvalRequest.tokenUsed ? 'Token used.' : 'Awaiting decision.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
