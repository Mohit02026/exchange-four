# Exchange Four HR App

A Director of Personnel command system for Exchange Four. Covers the full applicant-to-hire-to-offboard workflow.

## What it does

**Applicant pipeline**
- Public positions board and application portal (with video upload)
- Nicola (HR) review dashboard with CSW generation
- Avi (Executive) approval portal — token-gated, no login required
- Reference checks and background check tracking
- Calendly-style interview booking via GHL calendar embed
- Post-interview survey

**Employee lifecycle**
- Hire transition — creates MinIO folder, onboarding plan, offer letter
- Onboarding portal for new hires (tasks, daily check-ins, document acknowledgment)
- PDF generation for NDA, contract, and policies
- 30/60/90-day performance reviews
- Training and hatting tracking
- Statistics tracking with trend analysis
- New hire surveys (weekly / bi-weekly)

**HR operations**
- Org board (grid + tree view) with department and manager assignment
- Staff profiles with full audit trail
- Ethics reports (access-controlled)
- Corrections and disciplinary actions (with executive approval flow)
- Offboarding with CEO approval
- Weekly executive report
- Global audit log with filters
- Profile completeness tracking (12-field weighted score)

**Integrations**
- Email: Resend (with optional GHL routing)
- Storage: MinIO (S3-compatible)
- Calendar: GHL booking widget
- Messaging: Slack notifications
- GHL: contact upsert, email provider toggle

## Stack

- **Next.js 16** App Router (Turbopack dev, webpack stable)
- **PostgreSQL 16** via Docker (`inboxd_postgres`, port 5433)
- **Prisma 7** with `@prisma/adapter-pg`
- **NextAuth v5** — JWT, 3 roles (APPLICANT / HR / EXECUTIVE)
- **Resend** for email
- **MinIO** for file storage
- **GHL** for calendar and optional email routing

## Roles

| Role | Entry point |
|---|---|
| Applicant | `/positions`, `/apply`, `/status` |
| HR (Nicola) | `/hr/*` — requires login |
| Executive (Avi) | `/approve/*` — token-gated, no login |
| New hire | `/onboarding/*` — requires login |

## Running locally

```bash
# Prerequisites: Docker running with inboxd_postgres on port 5433
docker start inboxd_postgres

# Development
npm run dev          # http://localhost:3001

# Production build
rm -rf .next && npm run build && npm start -- --port 3001
```

## Environment variables

See `.env.example` for required variables. Key ones:

```
DATABASE_URL=postgresql://ef_user:ef_secure_2026@localhost:5433/exchange_four
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3001
RESEND_API_KEY=
RESEND_FROM_EMAIL=
GHL_API_KEY=
GHL_LOCATION_ID=
GHL_CALENDAR_SLUG=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=
```

## Deploy

Railway watches the `deploy` branch. The app auto-migrates on start via `railway.toml`.
