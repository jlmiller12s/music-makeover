# The Music Makeover

Static public site plus a Phase 1 custom booking/CRM backend for The Music Makeover.

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
