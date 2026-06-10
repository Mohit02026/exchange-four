interface ApplicationTabProps {
  application: {
    bio: string | null
    skills: string | null
    hobbies: string | null
    careerGoals: string | null
    whyExchangeFour: string | null
    performiaStatus: string | null
    isGeneralApplication: boolean
    position: { title: string } | null
    applicant: {
      firstName: string
      lastName: string
      correspondenceEmail: string
      phone: string | null
      location: string | null
    }
    videos: { id: string; url: string; type: string }[]
  }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{value}</dd>
    </div>
  )
}

export default function ApplicationTab({ application }: ApplicationTabProps) {
  const { applicant } = application

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4">
        <Field label="Full Name" value={`${applicant.firstName} ${applicant.lastName}`} />
        <Field label="Email" value={applicant.correspondenceEmail} />
        <Field label="Phone" value={applicant.phone} />
        <Field label="Location" value={applicant.location} />
        <Field label="Position" value={application.isGeneralApplication ? 'General Application' : application.position?.title} />
        <Field label="Performia" value={application.performiaStatus} />
      </dl>

      <hr />

      <dl className="space-y-4">
        <Field label="Bio / About" value={application.bio} />
        <Field label="Skills" value={application.skills} />
        <Field label="Hobbies" value={application.hobbies} />
        <Field label="Career Goals" value={application.careerGoals} />
        <Field label="Why Exchange Four" value={application.whyExchangeFour} />
      </dl>

      {application.videos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Videos</h3>
          <ul className="space-y-1">
            {application.videos.map(v => (
              <li key={v.id}>
                <a href={v.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  {v.type} video ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
