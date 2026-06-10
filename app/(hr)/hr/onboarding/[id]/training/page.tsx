export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getTrainingPlan } from '@/lib/services/training'
import TrainingRecord from '@/components/hr/TrainingRecord'
import HatPackProgress from '@/components/hr/HatPackProgress'
import CreatePlanForm from '@/components/hr/CreatePlanForm'
import AddTaskForm from '@/components/hr/AddTaskForm'
import Link from 'next/link'

export default async function EmployeeTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'HR') redirect('/login')

  const { id } = await params

  const employee = await db.employee.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!employee) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
        <p style={{ color: '#dc2626' }}>Employee not found.</p>
      </div>
    )
  }

  const plan = await getTrainingPlan(id)

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Back link */}
      <Link
        href="/hr/training"
        style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}
      >
        ← All Training
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0, color: '#111827' }}>
          {employee.firstName} {employee.lastName}
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0' }}>
          Training &amp; Hatting Record
        </p>
      </div>

      {!plan ? (
        /* No plan yet — show creation form */
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px',
            background: '#fafafa',
          }}
        >
          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', fontWeight: 500 }}>
            No training plan yet. Create one to get started.
          </p>
          <CreatePlanForm employeeId={id} />
        </div>
      ) : (
        <>
          {/* Hat pack progress */}
          <section style={{ marginBottom: '32px' }}>
            <HatPackProgress postTitle={plan.postTitle} tasks={plan.tasks} />
          </section>

          {/* Training record */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              Training Tasks
            </h2>
            <TrainingRecord
              planId={plan.id}
              tasks={plan.tasks}
              employeeId={id}
            />
          </section>

          {/* Add function form */}
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              background: '#fafafa',
            }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              Add Function
            </h2>
            <AddTaskForm employeeId={id} />
          </section>

          {/* 8-step model reference */}
          <details style={{ marginTop: '24px' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              8-Step Apprenticing Model
            </summary>
            <ol style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: '1.7' }}>
              <li>Employee reads the function write-up</li>
              <li>Employee reads related policies</li>
              <li>Senior/trainer demonstrates the function</li>
              <li>Employee drills/practices the function</li>
              <li>Employee performs the function</li>
              <li>Senior/trainer quality checks</li>
              <li>Senior/trainer passes or sends back for correction</li>
              <li>Repeat for next function</li>
            </ol>
          </details>
        </>
      )}
    </div>
  )
}
