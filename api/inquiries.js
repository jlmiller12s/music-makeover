const { loadState, saveState } = require('../lib/crmRuntimeStore');
const { recordInquiry } = require('../lib/musicMakeoverCrm');

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
    const result = recordInquiry(state, payload);
    await saveState(result.state);
    return sendJson(res, 201, {
      ok: true,
      inquiry: result.inquiry,
      nextSteps: [
        'Your inquiry has been tagged and added to the Music Makeover pipeline.',
        'Ashley will review it and respond within 1-2 business days.',
        'If this becomes a booked service, your client portal will show contracts, invoices, files, and session notes.',
      ],
    });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message || 'Unable to submit inquiry' });
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
