export const dynamic = 'force-dynamic'

import { getOnboardingList } from '@/lib/services/onboarding'
import OnboardingDashboard from '@/components/hr/OnboardingDashboard'

export default async function HROnboardingPage() {
  const employees = await getOnboardingList()

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Onboarding</h1>
        <p className="text-sm text-gray-400 mt-1">{employees.length} employee{employees.length !== 1 ? 's' : ''} in onboarding</p>
      </div>
      <OnboardingDashboard employees={employees as Parameters<typeof OnboardingDashboard>[0]['employees']} />
    </div>
  )
}
