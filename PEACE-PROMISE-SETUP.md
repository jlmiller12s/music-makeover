# The Peace Promise purchase delivery

The landing page is live at `/the-peace-promise`. Checkout uses the approved Stripe Payment Link. Purchase delivery is implemented locally but requires hosted configuration and an end-to-end test before it is operational.

## Product files

Purchasers receive one confirmation email with two attachments:
- The Peace Promise - Editable Workbook.docx
- The Peace Promise - Printable.pdf

The originals supplied on November 8, 2026 are packaged as AES-256-GCM encrypted files under `lib/peace-promise-products`. They are not copied to the public website. Vercel bundles the encrypted files only with the purchase webhook function. The server decrypts them in memory before sending base64 attachments to Resend.

`PEACE_WORKBOOK_KEY` is generated in ignored `.env.local`. Preserve that file securely and add its value to Vercel through its environment settings; never commit it. Without the matching key, fulfillment fails and Stripe can retry. To replace the product files, run:

```
node scripts/package-peace-workbooks.js "path/to/editable.docx" "path/to/printable.pdf"
```

The script retains the existing local key. If the local key is missing, it generates a new one; update the hosted key together with the encrypted files.

## Hosted setup still required

1. Configure the values listed in `.env.example`, including the existing PostgreSQL connection, Resend sending key, Stripe API key, Payment Link ID, Price ID, webhook signing secret, and workbook encryption key. Keep test and live configurations separate.
2. Use `Ashley Miller <ashley@rootedwomencollective.com>` as `PEACE_EMAIL_FROM` and `ashley@rootedwomencollective.com` as `PEACE_SUPPORT_EMAIL`. The domain was verified in Resend on November 8, 2026.
3. Register `https://www.themusicmakeover.com/api/peace-promise-webhook` in the correct Stripe account for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Match the actual Payment Link and Price IDs behind the approved checkout URL. Set `PEACE_STRIPE_LIVE=true` only in the live configuration.
4. Deploy the backend with its encrypted files, then test a confirmed payment, inspect Stripe webhook and Resend delivery status, and open both received attachments. Local tests mock external services and do not prove inbox delivery.

The endpoint verifies the Stripe signature, retrieves the current checkout session, and checks paid status, product identity, and environment before sending. PostgreSQL locks orders and records delivery; Resend receives a stable idempotency key. Failures return 503 for Stripe retries. If the send succeeds but recording it fails, Resend's deduplication window provides temporary protection. Review provider logs before replaying an old ambiguous failure outside that window.

This sends one transactional confirmation with product attachments and next steps. It does not enroll buyers in marketing. The Rooted Letter newsletter integration remains separate and unconfigured. Local-only social icon changes have not been deployed.

## Checks

`node --test test/peace-promise.test.js` checks payment filtering, signatures, duplicate events, retries, email contents, attachment payloads and missing-file failures. `node scripts/build-site.js` builds only public assets. The encrypted bundle was decrypted locally and compared byte-for-byte with both supplied originals.

## Post-payment thank-you page

The local `/peace-promise-next-steps` page matches Ashley's cream/plum thank-you reference. Stripe's Payment Link must redirect after successful payment to:

`https://www.themusicmakeover.com/peace-promise-next-steps?session_id={CHECKOUT_SESSION_ID}`

The page removes the session ID from the visible address and sends it in a POST to `/api/peace-promise-download`. That endpoint retrieves the Stripe session and checks payment status, live/test mode, Payment Link and price before decrypting either requested attachment. No raw workbook is published in static assets. Treat checkout-session links as private access links. Neither the redirect configuration nor this page/download handler has been deployed yet. Email copy says files will also be sent; it does not claim completed delivery.

Purchase delivery now requires PEACE_RESEND_API_KEY, a dedicated Resend sending key for rootedwomencollective.com. Leave the existing RESEND_API_KEY used by Music Makeover check-in emails unchanged.

## Approved production checkout (November 9, 2026)

Sale price: $17.00, regular reference price $37.99. Approved link: https://buy.stripe.com/eVq5kC4Nncdh2gs0JY3Je06
Verified live Payment Link ID: plink_1UZlEsAtTrpfqejCCGXHR7Uw
Verified live Price ID: price_1UZkfHAtTrpfqejCHzy6jexq (1700 USD cents).
