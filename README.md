# The Music Makeover

Static public site plus a Phase 1 custom booking/CRM backend for The Music Makeover.

## Sustainability Check-In

Share the unlisted `/check-in` route. Anyone with the link can enter an email
and begin; no approval, account, password, or email code is required. Email is
self-reported contact information, not proof of identity. Every new start creates
a separate randomly identified assessment and a private browser session. Typing
an existing email never retrieves someone else's saved answers or results.
Existing sessions can resume in the same browser for up to 12 hours. After session
expiry or sign-out, entering an email begins a fresh assessment. Results can be
printed/saved as PDF; admins retain submitted results for review.

The release includes 32 frozen statements across eight domains, baseline clarity,
required paragraph reflections, a separate three-year outlook, and an immediate
Snapshot. Ashley reviews results with the participant later. Patterns remain
admin-only, there is no overall score, and no undefined skill/safety cutoff is
invented. After the Snapshot, participants can save a separate clarity rating and must answer all four feedback questions to submit feedback. These responses remain outside domain scoring. The 4W reflection and 90-day plan are outside this release.

The admin Sustainability Check-Ins section supports filtering, session revocation,
original answers and Snapshot review, private notes, and checkbox bulk deletion.
Select-all applies to the current filter; changing filters clears selection.
Deletion permanently removes selected assessments and invalidates their sessions.
Preview also has a reset control for test assessments. Repeated emails identify
separate assessments and can be managed individually.

### Deployment and privacy

Use the existing `POSTGRES_URL`. Private schemas `music_checkin` (Production) and
`music_checkin_preview` (Preview) keep test data separate. Row-locked transactions
protect writes. The database role needs schema/table creation privileges; do not
expose these schemas through the Supabase Data API. There is no memory fallback.

HttpOnly, Secure hosted, SameSite cookies hold opaque session credentials. Stored
session tokens are hashed. Requests are throttled and same-origin checked; results
are server-scored and responses use no-store. Admin endpoints require current
stored admin sessions. Published development setup/token fallbacks are disabled.

Configure domain-restricted `RESEND_API_KEY` and verified `CHECKIN_EMAIL_FROM` in
Vercel. Started and completed notifications go **only** to
`themusicmakeover@gmail.com` and `jlmiller12s@gmail.com`; stored admin emails and
`ADMIN_EMAIL` do not extend this list. Notifications do not include assessment
answers or results. Failed email delivery does not prevent assessment entry or
submission; completed-notification failures can be retried from admin review.
No sign-in emails are sent. Email configuration is not required to begin.

Build with `node scripts/build-site.js`; only public HTML/assets/media are copied
to `public/`. Server files and secrets are excluded. Vercel deploys `/api` functions.
The participant route remains unlisted and noindex; anyone receiving a forwarded
link can start, while stored participant data and admin review remain restricted.

### Validation and release

Run `node --test`. Tests cover scoring boundaries, input validation, independent
same-email attempts, session isolation, revocation/deletion, concurrent/idempotent
submissions, email failures, cookie/origin controls, and production admin checks.
Concurrency tests use an isolated store, not a hosted load test. Validate the
preview before production release; the ignored local `tmp/` harness never deploys.

## Local Development

```bash
npm run dev
```

Open:

- `http://localhost:3000/booking.html` - public service-lane inquiry form
- `http://localhost:3000/admin-login.html` - admin login and create-admin screen
- `http://localhost:3000/admin.html` - HoneyBook-inspired admin dashboard
- `http://localhost:3000/client-portal.html` - client portal preview

Run tests:

```bash
npm test
```

## Phase 1 CRM Surface

The backend model currently supports:

- Public inquiry submission with automatic category tags
- Lead/client pipeline stages
- Dashboard metrics
- Service and pricing catalog updates
- Consultation-note uploads with attachment metadata
- AI-ready service/package recommendations generated from consultation notes
- Proposal, contract, media release, and email template data
- Client profiles, appointments, invoices, payments, files/resources, notes, testimonials, and media release records

The Vercel API endpoints are:

- `GET /api/crm`
- `POST /api/crm`
- `POST /api/inquiries`
- `GET /api/public-config`
- `POST /api/auth`

`/api/crm` requires an admin bearer token. Create the first local admin from `admin-login.html?mode=create` using `ADMIN_SETUP_CODE`; local development falls back to `musicmakeover2026` when the environment variable is not set.

Password reset requests are backend-driven and do not open a local email app. In local development, reset messages are stored in the in-memory auth email outbox; connect a transactional email provider before production so those reset links are actually delivered.

Inquiry confirmation emails follow the same pattern: when a visitor checks the confirmation box, the system records a confirmation email in the in-memory inquiry email outbox. Connect Gmail API, Resend, SendGrid, or another transactional provider before launch for real delivery.

The AI Recommendations tab currently uses a local recommendation engine that scores consultation notes against the editable service catalog. It is designed as a safe Phase 1 stand-in that can be replaced or enriched with an LLM provider once API keys, privacy rules, and data-retention choices are finalized.

## Production Notes

The current runtime store is in-memory for local/serverless preview. Before collecting real client data, connect durable storage and auth:

- Database: Vercel Postgres, Supabase, Neon, or another managed Postgres
- File storage: Google Drive, Vercel Blob, S3, or equivalent
- Auth: password-protected admin login and secure client portal login
- Payments: Stripe or Square checkout/invoices only, never direct card storage
- Calendar: Google Calendar OAuth and availability sync
- Email: Gmail, Resend, SendGrid, or another transactional provider
- Backups, privacy policy, terms, export/delete client data, and SSL on production

Contract language should be reviewed by an attorney before launch.
