import Link from 'next/link'

interface ApplicantHeaderProps {
  application: {
    id: string
    reference: string
    status: string
    isGeneralApplication: boolean
    position: { title: string } | null
    applicant: {
      firstName: string
      lastName: string
      correspondenceEmail: string
    }
    files: { type: string; fileUrl: string }[]
  }
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  CSW_GENERATED: 'CSW Generated',
  SENT_TO_AVI: 'Sent to Avi',
  EXECUTIVE_APPROVED: 'Exec Approved',
  EXECUTIVE_DISAPPROVED: 'Exec Disapproved',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  START_DATE_REQUESTED: 'Start Date Requested',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  FUTURE_PROSPECT: 'Future Prospect',
}

const STATUS_COLORS: Record<string, string> = {
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXECUTIVE_APPROVED: 'bg-green-50 text-green-700',
  EXECUTIVE_DISAPPROVED: 'bg-red-50 text-red-700',
  FUTURE_PROSPECT: 'bg-purple-100 text-purple-800',
}

function getNextAction(status: string): { label: string; href: string } | null {
  switch (status) {
    case 'UNDER_REVIEW': return { label: 'Generate CSW', href: '#review' }
    case 'CSW_GENERATED': return { label: 'Send to Avi', href: '#csw' }
    case 'EXECUTIVE_APPROVED': return { label: 'Final Decision', href: '#approval' }
    case 'INTERVIEW_SCHEDULED': return { label: 'View Interview', href: '#interviews' }
    default: return null
  }
}

export default function ApplicantHeader({ application }: ApplicantHeaderProps) {
  const { applicant } = application
  const photo = application.files.find(f => f.type === 'PHOTO')
  const nextAction = getNextAction(application.status)
  const statusColor = STATUS_COLORS[application.status] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="flex items-start gap-5 mb-8 pb-6 border-b border-gray-200">
      <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0 overflow-hidden">
        {photo ? (
          <img src={photo.fileUrl} alt={`${applicant.firstName} ${applicant.lastName}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
            {applicant.firstName[0]}{applicant.lastName[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {applicant.firstName} {applicant.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{application.reference}</p>
          </div>
          {nextAction && (
            <a
              href={nextAction.href}
              className="shrink-0 text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {nextAction.label}
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
            {STATUS_LABELS[application.status] ?? application.status}
          </span>
          <span className="text-sm text-gray-600">
            {application.isGeneralApplication ? 'General Application' : application.position?.title}
          </span>
          <a href={`mailto:${applicant.correspondenceEmail}`} className="text-sm text-blue-600 hover:underline">
            {applicant.correspondenceEmail}
          </a>
        </div>
      </div>
    </div>
  )
}
