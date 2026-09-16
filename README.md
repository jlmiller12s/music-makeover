# The Music Makeover

Static public site plus a Phase 1 custom booking/CRM backend for The Music Makeover.

## Private Sustainability Check-In

The unlisted participant route is `/check-in`. It requires an approved email address
and a single-use eight-digit email code. Questions, saved drafts, and results are
served only after authorization; the public page is just the sign-in shell.

In the existing admin portal, open **Sustainability Check-Ins** to:

- Approve up to 100 email addresses at a time and copy the participant link.
- Revoke access immediately (including existing participant sessions).
- Review completed Snapshots, original answers, internal pattern suggestions, and
  private notes; mark the participant conversation reviewed.
- Retry failed admin email notifications. Notification emails contain no answers.

The first release includes the frozen 32 statements, baseline clarity and optional
written reflections, the separate three-year outlook, and immediate personalized
Snapshots. Ashley reviews results with participants afterward. Pattern detection
is internal only; the advocacy skill/safety clause has no specified numeric cutoff
and is deliberately left for human interpretation. There is no overall score.
The 4W reflection, 90-day plan, feedback forms, and retakes are outside this release.

### Deployment configuration

Use the existing `POSTGRES_URL` (or another connection variable supported by
`lib/crmRuntimeStore.js`). Configure `RESEND_API_KEY` and `CHECKIN_EMAIL_FROM` in
Vercel for Production and Preview. The sender must belong to a verified Resend
domain. Use a sending-only, domain-restricted key. No secret belongs in Git or
browser JavaScript. Admin notifications go to configured/stored admin accounts.

Check-in records use a private PostgreSQL schema, `music_checkin`, with account
updates inside row-locked transactions. Vercel Preview uses
`music_checkin_preview`, so preview test participants and submissions do not enter
the real pilot. These schemas are created lazily by the server connection; its
database role must have schema/table creation permission. Do not expose these
schemas through the Supabase Data API. Backups follow the existing database plan.

There is intentionally no production memory fallback or email-code bypass.
Codes expire after 10 minutes, permit five verification attempts, and are stored
as salted hashes. Sessions expire after 12 hours and use HttpOnly, Secure (hosted),
SameSite cookies. Persistent request throttles, same-origin write checks, payload
limits, no-store responses and server-side scoring protect the form endpoints.
Hosted admin creation requires a configured setup code for the first account;
subsequent accounts require an existing admin session. Published development
credentials and stateless admin-token fallback are disabled on Vercel.

The build (`node scripts/build-site.js`) copies only public HTML, assets and media
to `public/`. Server source, tests, reference documents and environment files are
excluded from static hosting. Vercel still deploys `/api` as server functions.

### Pilot operations

1. Confirm the verified sender and successful real code delivery on Preview.
2. Sign into the Preview admin portal and approve a test email; complete the form
   and verify the Snapshot, persisted record and admin notification.
3. Review the preview before promoting to Production.
4. Approve actual pilot emails in Production, then share `/check-in` directly.
   Approval itself does not send invitations.
5. Review submissions under the new admin section. Notes stay private to admins.

The core tests cover all workbook scoring cases, invalid/missing answers, code
reuse/expiry/attempt limits, revocation, session isolation, duplicate submissions,
100 concurrent service-level submissions, email failures, HTTP cookie/origin
protections, production admin fallback behavior, and transaction boundaries.
Service concurrency tests use an isolated test store; they are not a hosted load
test. The local QA harness under ignored `tmp/` is never deployed.

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
