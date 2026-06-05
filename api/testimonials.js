const { loadState, saveState } = require('../lib/crmRuntimeStore');
const { recordTestimonial } = require('../lib/musicMakeoverCrm');

module.exports = async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const payload = await readBody(req);
    const state = await loadState();
    const result = recordTestimonial(state, payload);
    await saveState(result.state);
    return sendJson(res, 201, {
      ok: true,
      testimonial: result.testimonial,
      message: 'Thank you. Your testimonial has been sent to The Music Makeover for review.',
    });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message || 'Unable to submit testimonial' });
  }
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}
