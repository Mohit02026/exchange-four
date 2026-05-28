import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// ── Resend ──────────────────────────────────────────────────────────────────
// All email sends return a fake message ID instead of hitting the real API.
const resendHandlers = [
  http.post('https://api.resend.com/emails', () => {
    return HttpResponse.json({ id: 'test-email-id-' + Date.now() }, { status: 200 })
  }),
]

// ── Slack ───────────────────────────────────────────────────────────────────
// All chat.postMessage calls return ok: true silently.
const slackHandlers = [
  http.post('https://slack.com/api/chat.postMessage', () => {
    return HttpResponse.json({ ok: true })
  }),
]

// ── Google Drive ─────────────────────────────────────────────────────────────
// Intercept googleapis file upload and folder creation endpoints.
const driveHandlers = [
  http.post('https://www.googleapis.com/upload/drive/v3/files', () => {
    return HttpResponse.json({ id: 'test-drive-file-id', name: 'test-file' })
  }),
  http.post('https://www.googleapis.com/drive/v3/files', () => {
    return HttpResponse.json({ id: 'test-drive-folder-id', name: 'test-folder' })
  }),
]

// ── Google OAuth token endpoint ──────────────────────────────────────────────
const googleHandlers = [
  http.post('https://oauth2.googleapis.com/token', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    })
  }),
]

export const server = setupServer(
  ...resendHandlers,
  ...slackHandlers,
  ...driveHandlers,
  ...googleHandlers,
)
