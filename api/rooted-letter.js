const newsletter = require('../lib/rootedLetter');
function makeHandler(deps = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    const reply = (status, message) => { res.statusCode = status; res.end(JSON.stringify({message})); };
    if (req.method !== 'POST') { res.setHeader('Allow','POST'); return reply(405,'Method not allowed'); }
    const env = deps.env || process.env;
    try {
      const {origin} = newsletter.settings(env);
      if (req.headers.origin !== origin) return reply(403,'Please use the signup form on our website.');
      let body = req.body;
      if (!body) { let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw)>4096) return reply(413,'Request too large'); } body = JSON.parse(raw); }
      if (typeof body === 'string') body = JSON.parse(body);
      if (!body || typeof body !== 'object' || JSON.stringify(body).length>4096) return reply(400,'Invalid request');
      if (body.action === 'confirm') {
        await (deps.confirm || newsletter.confirm)(body.token,env);
        return reply(200,"You're subscribed! Welcome to The Rooted Letter. Watch your inbox for Ashley's next letter.");
      }
      const ip = env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim() : req.socket?.remoteAddress || 'local';
      await (deps.subscribe || newsletter.subscribe)(body,ip,env);
      return reply(200,'Check your inbox for a confirmation email. Click its link to finish joining The Rooted Letter.');
    } catch (error) {
      if (error instanceof SyntaxError) return reply(400,'Invalid request');
      if (error.status === 429) res.setHeader('Retry-After','3600');
      return reply(error.status || 503,error.status ? error.message : 'Signup is temporarily unavailable. Please try again later.');
    }
  };
}
module.exports = makeHandler(); module.exports.makeHandler = makeHandler;
module.exports.config = {api:{bodyParser:false}};
