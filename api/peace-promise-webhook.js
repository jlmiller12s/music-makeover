const Stripe = require('stripe');
const { fulfill } = require('../lib/peacePromise');
function makeHandler(deps = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const respond = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return respond(405, { error: 'Method not allowed' }); }
    const env = deps.env || process.env;
    if (!env.PEACE_STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return respond(503, { error: 'Checkout is not configured' });
    let event;
    try {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += Buffer.byteLength(chunk); if (size > 1048576) return respond(413, { error: 'Request too large' }); chunks.push(Buffer.from(chunk)); }
      const stripe = deps.stripe || new Stripe(env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(Buffer.concat(chunks), req.headers['stripe-signature'], env.PEACE_STRIPE_WEBHOOK_SECRET);
    } catch { return respond(400, { error: 'Invalid webhook signature or body' }); }
    try {
      await (deps.fulfill || fulfill)(event, { env });
      return respond(200, { received: true });
    } catch {
      console.error('Peace Promise fulfillment failed; Stripe should retry.');
      return respond(503, { error: 'Fulfillment pending; retry required' });
    }
  };
}
module.exports = makeHandler();
module.exports.makeHandler = makeHandler;
module.exports.config = { api: { bodyParser: false } };
