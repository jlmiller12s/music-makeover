# The Peace Promise preview and launch setup

The standalone landing page is `/the-peace-promise`. The Music Makeover homepage and navigation are unchanged. This is an unlisted, noindex preview with disabled purchasing and clearly marked placeholders, not a private authenticated page. No live checkout or emails have been enabled.

## Content still needed

Approved cover and portrait, final workbook, confirmed printable/fillable formats, price, product-specific refund policy, support address and Ashley-brand privacy/terms. The six featured tools are shown alongside the journey as a proposed presentation; confirm their chapter placement against the final workbook. Do not publish placeholders. Add canonical/social metadata for the final domain at launch.

## Stripe and purchase email

1. Create a one-time Stripe product/price and Payment Link. Set its redirect to the eventual site origin plus `/peace-promise-next-steps`. Require purchaser email. Keep test and live settings separate.
2. Configure the variables in `.env.example` in the hosting environment, including the existing `POSTGRES_URL` and `RESEND_API_KEY`. Use a verified Resend sending domain and approved support mailbox. `PEACE_STRIPE_LIVE` defaults to false; only set true for approved live checkout.
3. Set `PEACE_WORKBOOK_ACCESS_URL` to the approved HTTPS customer access page. This integration does not implement protected file hosting or customer authentication. Set up access-controlled delivery before launch; never put the paid PDF in the public build folders. The email link must point to that finished delivery system.
4. Register `/api/peace-promise-webhook` with Stripe for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Use its signing secret, the exact Payment Link ID and Price ID.
5. The endpoint verifies the raw request signature, retrieves current payment details, checks paid status and product identity, and sends an access/next-step email through Resend. The email includes access instructions, starting with the Peace Inventory, a small next step, and a reply-to support address. It does not subscribe anyone to marketing.
6. PostgreSQL stores a delivery marker per environment/session and locks simultaneous attempts. Resend receives a stable idempotency key. Failed sends return 503 for Stripe retries. If email succeeds but the database commit fails, Resend's deduplication window provides temporary protection; reconcile provider logs before manually replaying an old ambiguous failure beyond that window. Successful API acceptance is not proof of inbox delivery; monitor Resend bounces and Stripe failures operationally.
7. Test valid/invalid signatures, successful payments, delayed payments, duplicate notifications, failed email retries, and actual workbook access on desktop/mobile. Then replace the disabled purchase button with the approved Payment Link, replace preview copy, and remove noindex only after launch approval.

The current automation sends one transactional welcome/next-steps email per confirmed purchase. A multi-day follow-up campaign is not enabled. The Rooted Letter signup is an explicit placeholder: connect an approved native MailerLite form with consent and privacy links separately. Never add buyers to marketing without opt-in.

## Local preview and checks

Run `npm run dev` and open `http://localhost:3000/the-peace-promise`. Run `node --test test/peace-promise.test.js` for payment/email unit tests and `node scripts/build-site.js` to include both HTML pages and styling in the public build. These tests mock Stripe retrieval, the order store and email delivery; a hosted end-to-end test is still required before sales open.
