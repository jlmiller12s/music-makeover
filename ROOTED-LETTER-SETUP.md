# The Rooted Letter signup

Implemented locally; not deployed or verified against live Resend/PostgreSQL yet.

## Private setup

Create a dedicated Resend Full access key (contact management needs more than Sending access). Save it as ROOTED_RESEND_API_KEY in ignored .env.local and, when deploying, as a secret in Vercel. Do not paste it in chat or commit it. Keep the existing workbook encryption key in that file.

The Rooted Letter segment is already created: d044762b-def8-4d52-874e-39f3835b1685.

Required configuration:
- ROOTED_RESEND_API_KEY
- ROOTED_SEGMENT_ID (above)
- ROOTED_SITE_URL (http://localhost:3000 locally; actual HTTPS deployment origin in Preview; https://www.themusicmakeover.com in Production)
- POSTGRES_URL or another PostgreSQL variable supported by lib/crmRuntimeStore.js. Use separate development/preview storage where possible.

Restart npm run dev after changing .env.local. The local server loads it automatically. No settings or credentials are sent to the browser.

## Behavior

The form validates name, email and affirmative consent. It sends a confirmation email from Ashley Miller <ashley@rootedwomencollective.com>. The random confirmation token expires after 24 hours and only its hash is stored. The confirmation page requires an explicit button press; email scanners following links cannot subscribe someone. Tokens stay in the URL fragment, are removed on page load, and are submitted in the POST body.

Only after confirmation is the contact added to The Rooted Letter segment. Existing global unsubscribes are preserved and shown a rejoining support message. Repeated clicks cannot add the subscriber again. Signup includes a honeypot, durable per-IP/email limits and a daily email budget. Expired pending signups and old rate records are cleaned during subsequent signups. Confirmed consent records remain for operational consent tracking.

Send newsletters through Resend Broadcasts targeting ONLY The Rooted Letter segment, with Resend's unsubscribe link. This flow sends the confirmation email and shows an on-page welcome after confirmation; it does not send a separate marketing welcome campaign or paid workbook files. No bulk emails or subscriber imports were performed.

## Before deployment

1. Configure private credentials and the correct origin.
2. Test signup with an inbox the user authorizes, confirm receipt, click the confirmation button, and verify the Resend segment membership.
3. Check invalid/expired links and duplicates, and verify a Broadcast draft includes unsubscribe handling before sending any newsletters.
4. Deploy only the authorized newsletter changes. The working tree also includes earlier purchase-attachment and local-only social changes; do not accidentally publish those as part of this task.

Tests: node --test test/rooted-letter.test.js
