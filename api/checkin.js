const { getCheckinStore } = require('../lib/checkinStore');
const { createCheckinService, fail, SESSION_MS } = require('../lib/checkinService');
const { emailReady, sendEmail } = require('../lib/checkinEmail');
const { loadAuthState } = require('../lib/crmRuntimeStore');
const { verifyAdminSession } = require('../lib/adminAuth');
const COOKIE = 'mm_checkin';

function makeHandler(deps = {}) {
  return async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Vary', 'Cookie, Authorization');
    const respond = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    try {
      if (!['GET', 'POST'].includes(req.method)) return respond(405, { ok: false, error: 'Method not allowed' });
      const token = readCookie(req.headers.cookie);
      const service = deps.service || createCheckinService({ store: getCheckinStore(), emailReady, sendEmail });
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET') {
        if (url.searchParams.get('admin') === '1') {
          await requireAdmin(req, deps);
          return respond(200, { ok: true, ...(url.searchParams.has('email') ? { participant: await service.detail(url.searchParams.get('email')) } : { participants: await service.list(), canResetPreview: process.env.VERCEL_ENV === 'preview', emailReady: (deps.emailReady || emailReady)() }) });
        }
        return respond(200, { ok: true, ...await service.participant(token) });
      }
      checkOrigin(req);
      const payload = await readBody(req);
      const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
      if (['request-code', 'verify-code'].includes(payload.action)) throw fail('Codes are no longer needed. Refresh the page and enter your email to begin.', 410);
      if (payload.action === 'begin') {
        const session = await service.begin(payload.email, ip, await adminEmails());
        res.setHeader('Set-Cookie', cookie(session.token, req, SESSION_MS / 1000));
        return respond(200, { ok: true });
      }
      if (payload.action === 'logout') {
        await service.logout(token);
        res.setHeader('Set-Cookie', cookie('', req, 0));
        return respond(200, { ok: true });
      }
      if (payload.action === 'draft') return respond(200, { ok: true, ...await service.saveDraft(token, payload.input) });
      if (payload.action === 'clarity') return respond(200, { ok: true, postClarity: await service.saveClarity(token, payload.value) });
      if (payload.action === 'feedback') return respond(200, { ok: true, feedback: await service.saveFeedback(token, payload.input) });
      if (payload.action === 'submit') return respond(200, { ok: true, submission: await service.submit(token, payload.input, await adminEmails(deps)) });
      const admin = await requireAdmin(req, deps);
      switch (payload.action) {
        case 'admin:delete': return respond(200, { ok: true, ...await service.deleteParticipants(payload.emails) });
        case 'admin:reset-preview':
          if (process.env.VERCEL_ENV !== 'preview') throw fail('Test resets are available only in preview.', 403);
          await service.resetPreview(payload.email); break;
        case 'admin:allow': return respond(200, { ok: true, ...await service.allow(payload.emails, admin) });
        case 'admin:revoke': await service.revoke(payload.email); break;
        case 'admin:review': await service.review(payload.email, payload.notes, payload.status, admin); break;
        case 'admin:notify': return respond(200, { ok: true, ...await service.notify(payload.email, await adminEmails(deps)) });
        default: throw fail('Unknown request.');
      }
      return respond(200, { ok: true });
    } catch (error) {
      const status = error.status || 503;
      if (!error.status) console.error('Check-in request failed', error.code || error.name);
      return respond(status, { ok: false, error: error.status ? error.message : 'The check-in is temporarily unavailable. Your submission has not been confirmed. Please try again.' });
    }
  };
}
async function requireAdmin(req, deps) {
  const state = await (deps.loadAuthState || loadAuthState)();
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  // Require a real, current stored session for access to participant reflections.
  const session = state.sessions.find(s => s.token === token && new Date(s.expiresAt).getTime() > Date.now());
  const admin = session && verifyAdminSession(state, token, { throwOnInvalid: false });
  if (!admin || admin.role !== 'admin') throw fail('Admin login required.', 401);
  return admin;
}
async function adminEmails(deps) {
  return ['themusicmakeover@gmail.com', 'jlmiller12s@gmail.com'];
}
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || req.headers['sec-fetch-site'] === 'cross-site') throw fail('Please submit from the Music Makeover website.', 403);
  const host = String(req.headers.host || '');
  let parsed;
  try { parsed = new URL(origin); } catch { throw fail('Invalid request origin.', 403); }
  if (parsed.host !== host || !['http:', 'https:'].includes(parsed.protocol)) throw fail('Invalid request origin.', 403);
  if (process.env.VERCEL && parsed.protocol !== 'https:') throw fail('Secure connection required.', 403);
}
async function readBody(req) {
  const type = String(req.headers['content-type'] || '');
  if (!type.startsWith('application/json')) throw fail('JSON required.', 415);
  let raw;
  if (req.body !== undefined) raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  else {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 32768) throw fail('Request too large.', 413);
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.byteLength(raw) > 32768) throw fail('Request too large.', 413);
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch { throw fail('Invalid request.'); }
}
function readCookie(value = '') {
  const match = value.split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) : '';
}
function cookie(token, req, maxAge) {
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/checkin; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
module.exports = makeHandler();
module.exports.makeHandler = makeHandler;
