const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const Stripe = require('stripe');
const { fulfill, welcomeEmail, sendWelcome } = require('../lib/peacePromise');
const { makeHandler } = require('../api/peace-promise-webhook');
const env = { STRIPE_SECRET_KEY: 'sk_test_example', PEACE_STRIPE_WEBHOOK_SECRET: 'whsec_test', PEACE_STRIPE_PAYMENT_LINK_ID: 'plink_peace', PEACE_STRIPE_PRICE_ID: 'price_peace', PEACE_RESEND_API_KEY: 'test', PEACE_EMAIL_FROM: 'Ashley <test@example.com>', PEACE_SUPPORT_EMAIL: 'help@example.com', PEACE_WORKBOOK_KEY: Buffer.alloc(32, 1).toString('base64') };
const event = () => ({ type: 'checkout.session.completed', livemode: false, data: { object: { id: 'cs_test_123', payment_link: 'plink_peace' } } });
function fixture(overrides = {}) {
  const sent = []; const done = new Set();
  const session = { id: 'cs_test_123', mode: 'payment', payment_status: 'paid', payment_link: 'plink_peace', line_items: { data: [{ price: { id: 'price_peace' } }] }, customer_details: { email: 'buyer@example.com' }, ...overrides };
  return { sent, deps: { env, stripe: { checkout: { sessions: { retrieve: async () => session } } }, withOrderLock: async (key, send) => { if (!done.has(key)) { await send(); done.add(key); } }, sendWelcome: async message => { sent.push(message); return 'email_1'; } } };
}
test('paid purchase and repeated notification produce one next-step email', async () => {
  const { deps, sent } = fixture();
  await fulfill(event(), deps); await fulfill(event(), deps);
  assert.equal(sent.length, 1); assert.equal(sent[0].to, 'buyer@example.com');
});
test('unpaid, unrelated price, unrelated link, and wrong environment do not send', async () => {
  for (const changes of [{ payment_status: 'unpaid' }, { line_items: { data: [{ price: { id: 'other' } }] } }, { payment_link: 'other' }]) {
    const { deps, sent } = fixture(changes); assert.equal(await fulfill(event(), deps), 'ignored'); assert.equal(sent.length, 0);
  }
  const { deps, sent } = fixture(); await fulfill({ ...event(), livemode: true }, deps); assert.equal(sent.length, 0);
});
test('delayed successful payment delivers and failures remain retryable', async () => {
  const { deps, sent } = fixture(); const send = deps.sendWelcome;
  deps.sendWelcome = async () => { throw new Error('provider down'); };
  await assert.rejects(fulfill(event(), deps));
  deps.sendWelcome = send;
  await fulfill({ ...event(), type: 'checkout.session.async_payment_succeeded' }, deps); assert.equal(sent.length, 1);
});
test('missing setup and missing purchaser email fail closed', async () => {
  const { deps } = fixture({ customer_details: null }); await assert.rejects(fulfill(event(), deps));
  await assert.rejects(fulfill(event(), { ...deps, env: {} }));
});
test('welcome confirms payment and explains both attachments, support, and no marketing enrollment', () => {
  const email = welcomeEmail(env.PEACE_SUPPORT_EMAIL);
  assert.match(email.text, /payment is confirmed/);
  assert.match(email.text, /Editable Workbook.docx/);
  assert.match(email.text, /Printable.pdf/);
  assert.match(email.text, /Peace Inventory/); assert.match(email.text, /help@example.com/); assert.match(email.text, /does not subscribe/);
});

test('Resend receives both attachments and a stable idempotency key', async () => {
  const attachments = [{ filename: 'workbook.docx', content: 'UEs=' }, { filename: 'workbook.pdf', content: 'JVBERi0=' }];
  let request;
  const result = await sendWelcome({ to: 'buyer@example.com', sessionId: 'cs_test_123', env }, {
    workbookAttachments: async () => attachments,
    fetch: async (url, options) => { request = options; return { ok: true, json: async () => ({ id: 'email_1' }) }; },
  });
  assert.equal(result, 'email_1');
  const body = JSON.parse(request.body);
  assert.deepEqual(body.attachments, attachments);
  assert.deepEqual(body.to, ['buyer@example.com']);
  assert.equal(body.from, env.PEACE_EMAIL_FROM);
  assert.equal(request.headers['Idempotency-Key'], 'peace-welcome-cs_test_123');
});

test('unavailable workbooks prevent sending an incomplete purchase email', async () => {
  let called = false;
  await assert.rejects(sendWelcome({ to: 'buyer@example.com', sessionId: 'cs_test_123', env }, {
    workbookAttachments: async () => { throw new Error('Missing workbook'); },
    fetch: async () => { called = true; },
  }));
  assert.equal(called, false);
});
test('webhook verifies raw signatures before fulfillment and returns retryable errors', async () => {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY); const payload = JSON.stringify(event()); let calls = 0;
  async function run(signature, fail = false) {
    const req = Readable.from([Buffer.from(payload)]); req.method = 'POST'; req.headers = { 'stripe-signature': signature };
    const res = { setHeader() {}, end(body) { this.body = body; } };
    await makeHandler({ env, stripe, fulfill: async () => { calls++; if (fail) throw new Error('retry'); } })(req, res);
    return res.statusCode;
  }
  assert.equal(await run('invalid'), 400); assert.equal(calls, 0);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: env.PEACE_STRIPE_WEBHOOK_SECRET });
  assert.equal(await run(signature), 200); assert.equal(calls, 1);
  assert.equal(await run(signature, true), 503);
});
