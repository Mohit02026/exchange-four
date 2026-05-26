import { db } from '@/lib/db'

type Block = Record<string, unknown>

function getConfig() {
  const token = process.env.SLACK_BOT_TOKEN
  const channel = process.env.SLACK_CHANNEL_ID
  if (!token || !channel) return null
  return { token, channel }
}

async function post(blocks: Block[], text: string): Promise<string | null> {
  const cfg = getConfig()
  if (!cfg) return null

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
    },
    body: JSON.stringify({ channel: cfg.channel, text, blocks }),
  })

  const data = (await res.json()) as { ok: boolean; ts?: string; error?: string }
  if (!data.ok) {
    console.error('[Slack] post error:', data.error)
    return null
  }
  return data.ts ?? null
}

async function logEvent(type: string, messageId: string | null, payload: unknown, employeeId?: string) {
  const cfg = getConfig()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const safePayload = JSON.parse(JSON.stringify(payload ?? {}))
  await db.slackEvent.create({
    data: {
      type,
      channel: cfg?.channel ?? null,
      messageId,
      payload: safePayload,
      employeeId: employeeId ?? null,
    },
  }).catch((err: unknown) => console.error('[Slack] log error:', err))
}

// ─── Notification functions ────────────────────────────────────────────────

export async function notifyApplicationSubmitted(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
}) {
  try {
    const role = params.positionTitle ? `*${params.positionTitle}*` : 'General Application'
    const ts = await post(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *New application received*\n*Applicant:* ${params.applicantName}\n*Reference:* ${params.reference}\n*Role:* ${role}`,
          },
        },
      ],
      `New application from ${params.applicantName} (${params.reference})`
    )
    await logEvent('APPLICATION_SUBMITTED', ts, params)
  } catch (err) {
    console.error('[Slack] notifyApplicationSubmitted:', err)
  }
}

export async function notifyCSWSentToAvi(params: {
  applicantName: string
  reference: string
  positionTitle: string | null
}) {
  try {
    const role = params.positionTitle ? `*${params.positionTitle}*` : 'General Application'
    const ts = await post(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📤 *CSW sent to Avi*\n*Applicant:* ${params.applicantName}\n*Reference:* ${params.reference}\n*Role:* ${role}`,
          },
        },
      ],
      `CSW sent to Avi for ${params.applicantName} (${params.reference})`
    )
    await logEvent('CSW_SENT_TO_AVI', ts, params)
  } catch (err) {
    console.error('[Slack] notifyCSWSentToAvi:', err)
  }
}

export async function notifyAviDecision(params: {
  applicantName: string
  reference: string
  decision: string
  reason?: string | null
}) {
  try {
    const icon = params.decision === 'APPROVED' ? '✅' : '❌'
    const label = params.decision === 'APPROVED' ? 'Approved by Avi' : 'Disapproved by Avi'
    const lines = [
      `${icon} *${label}*`,
      `*Applicant:* ${params.applicantName}`,
      `*Reference:* ${params.reference}`,
    ]
    if (params.reason) lines.push(`*Reason:* ${params.reason}`)

    const ts = await post(
      [{ type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } }],
      `${label}: ${params.applicantName} (${params.reference})`
    )
    await logEvent('AVI_DECISION', ts, params)
  } catch (err) {
    console.error('[Slack] notifyAviDecision:', err)
  }
}

export async function notifyFinalDecision(params: {
  applicantName: string
  reference: string
  decision: string
}) {
  try {
    const icon = params.decision === 'approved' ? '🎉' : params.decision === 'rejected' ? '🚫' : '🔄'
    const label =
      params.decision === 'approved'
        ? 'Final: Approved for interview'
        : params.decision === 'rejected'
          ? 'Final: Rejected'
          : 'Kept warm'

    const ts = await post(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${icon} *${label}*\n*Applicant:* ${params.applicantName}\n*Reference:* ${params.reference}`,
          },
        },
      ],
      `${label}: ${params.applicantName} (${params.reference})`
    )
    await logEvent('FINAL_DECISION', ts, params)
  } catch (err) {
    console.error('[Slack] notifyFinalDecision:', err)
  }
}

export async function notifyInterviewScheduled(params: {
  applicantName: string
  reference: string
  scheduledAt: Date
}) {
  try {
    const formatted = params.scheduledAt.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const ts = await post(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📅 *Interview scheduled*\n*Applicant:* ${params.applicantName}\n*Reference:* ${params.reference}\n*When:* ${formatted}`,
          },
        },
      ],
      `Interview scheduled for ${params.applicantName} — ${formatted}`
    )
    await logEvent('INTERVIEW_SCHEDULED', ts, params)
  } catch (err) {
    console.error('[Slack] notifyInterviewScheduled:', err)
  }
}

export async function notifyEmployeeHired(params: {
  name: string
  reference: string
  positionTitle: string | null
  employeeId: string
}) {
  try {
    const role = params.positionTitle ? `*${params.positionTitle}*` : 'General hire'
    const ts = await post(
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎊 *New hire created*\n*Name:* ${params.name}\n*Reference:* ${params.reference}\n*Role:* ${role}`,
          },
        },
      ],
      `New hire: ${params.name} (${params.reference})`
    )
    await logEvent('EMPLOYEE_HIRED', ts, params, params.employeeId)
  } catch (err) {
    console.error('[Slack] notifyEmployeeHired:', err)
  }
}
