const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY ?? ''}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
  }
}

export async function upsertGHLContact(params: {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}): Promise<string> {
  const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      ...(params.phone ? { phone: params.phone } : {}),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GHL contact upsert failed (${res.status}): ${text}`)
  }
  const data = await res.json() as { contact: { id: string } }
  return data.contact.id
}

export async function sendGHLEmail(params: {
  contactId: string
  to: string
  subject: string
  html: string
}): Promise<string> {
  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({
      type: 'Email',
      contactId: params.contactId,
      subject: params.subject,
      html: params.html,
      message: params.subject,
      emailFrom: process.env.RESEND_FROM_EMAIL ?? 'noreply@hr.exchangefour.com',
      emailTo: params.to,
      status: 'pending',
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GHL email send failed (${res.status}): ${text}`)
  }
  const data = await res.json() as { id: string }
  return data.id
}
