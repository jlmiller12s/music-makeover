const Stripe = require('stripe');
const { workbookAttachments } = require('./peacePromiseAttachments');
const { getPostgresConnectionString, createPostgresPoolOptions } = require('./crmRuntimeStore');
let pool;
let initialized;
function configuration(env = process.env) {
  const required = ['STRIPE_SECRET_KEY', 'PEACE_STRIPE_WEBHOOK_SECRET', 'PEACE_STRIPE_PAYMENT_LINK_ID', 'PEACE_STRIPE_PRICE_ID', 'PEACE_RESEND_API_KEY', 'PEACE_EMAIL_FROM', 'PEACE_SUPPORT_EMAIL', 'PEACE_WORKBOOK_KEY'];
  if (required.some(key => !env[key])) throw new Error('Peace Promise fulfillment is not configured');
  if (Buffer.from(env.PEACE_WORKBOOK_KEY, 'base64').length !== 32) throw new Error('Workbook encryption key is not configured');
  return env;
}
function welcomeEmail(supportEmail) {
  return {
    subject: 'The Peace Promise — your workbook and next steps',
    text: `Thank you for purchasing The Peace Promise.\n\nYour payment is confirmed. Both workbook editions are attached to this email:\n\n- The Peace Promise - Editable Workbook.docx\n- The Peace Promise - Printable.pdf\n\nA few simple next steps:\n\n1. Save both attachments. Open the editable workbook in Microsoft Word, or open and print the PDF.\n2. Begin with the Peace Inventory. Give yourself space to name what you are carrying.\n3. Choose one small pattern to reflect on, then return to the six-part journey at a pace that works for you.\n\nYou do not need to have everything figured out before you begin.\n\nFor help with your purchase or workbook access, reply to this email or contact ${supportEmail}.\n\nAshley Miller\nThe Peace Promise\n\nThis is a purchase-related email. Your purchase does not subscribe you to The Rooted Letter.`,
  };
}
async function sendWelcome({ to, sessionId, env }, deps = {}) {
  const attachments = await (deps.workbookAttachments || workbookAttachments)(env);
  const response = await (deps.fetch || fetch)('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${env.PEACE_RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `peace-welcome-${sessionId}` },
    body: JSON.stringify({ from: env.PEACE_EMAIL_FROM, to: [to], reply_to: env.PEACE_SUPPORT_EMAIL, ...welcomeEmail(env.PEACE_SUPPORT_EMAIL), attachments }),
  });
  if (!response.ok) throw new Error('Purchase email delivery failed');
  const result = await response.json();
  if (!result.id) throw new Error('Missing email delivery identifier');
  return result.id;
}
async function withOrderLock(key, send) {
  if (!pool) {
    const connection = getPostgresConnectionString();
    if (!connection) throw new Error('Purchase email storage is not configured');
    pool = new (require('pg').Pool)({ ...createPostgresPoolOptions(connection), max: 3, connectionTimeoutMillis: 10000 });
  }
  if (!initialized) initialized = pool.query(`CREATE SCHEMA IF NOT EXISTS peace_promise;
    REVOKE ALL ON SCHEMA peace_promise FROM PUBLIC;
    CREATE TABLE IF NOT EXISTS peace_promise.delivery (order_key text PRIMARY KEY, email_id text, sent_at timestamptz);
    REVOKE ALL ON peace_promise.delivery FROM PUBLIC;`).catch(error => { initialized = undefined; throw error; });
  await initialized;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO peace_promise.delivery (order_key) VALUES ($1) ON CONFLICT DO NOTHING', [key]);
    const row = (await client.query('SELECT email_id FROM peace_promise.delivery WHERE order_key=$1 FOR UPDATE', [key])).rows[0];
    if (!row.email_id) {
      const id = await send();
      await client.query('UPDATE peace_promise.delivery SET email_id=$2, sent_at=now() WHERE order_key=$1', [key, id]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
async function fulfill(event, deps = {}) {
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return 'ignored';
  const env = configuration(deps.env);
  if (event.livemode !== (env.PEACE_STRIPE_LIVE === 'true')) return 'ignored';
  if (event.data.object.payment_link !== env.PEACE_STRIPE_PAYMENT_LINK_ID) return 'ignored';
  const stripe = deps.stripe || new Stripe(env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ['line_items'] });
  if (session.payment_link !== env.PEACE_STRIPE_PAYMENT_LINK_ID || session.mode !== 'payment' || session.payment_status !== 'paid') return 'ignored';
  if (!session.line_items?.data.some(item => item.price?.id === env.PEACE_STRIPE_PRICE_ID)) return 'ignored';
  const to = session.customer_details?.email || session.customer_email;
  if (!to) throw new Error('Purchaser email missing');
  const key = `${env.VERCEL_ENV || 'local'}:${event.livemode ? 'live' : 'test'}:${session.id}`;
  await (deps.withOrderLock || withOrderLock)(key, () => (deps.sendWelcome || sendWelcome)({ to, sessionId: session.id, env }));
  return 'fulfilled';
}
module.exports = { configuration, welcomeEmail, fulfill, sendWelcome };
