const { loadAuthState, saveAuthState } = require('../lib/crmRuntimeStore');
const {
  authenticateAdmin,
  createAdmin,
  getPublicAdminProfile,
  requestPasswordReset,
  resetAdminPassword,
  verifyAdminSession,
} = require('../lib/adminAuth');

module.exports = async function handler(req, res) {
  setHeaders(res);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    const authState = await loadAuthState();

    if (req.method === 'GET') {
      const admin = verifyAdminSession(authState, readBearerToken(req), { throwOnInvalid: false });
      return sendJson(res, 200, {
        ok: true,
        authenticated: Boolean(admin),
        admin: getPublicAdminProfile(admin),
        hasAdmins: authState.admins.length > 0,
      });
    }

    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    }

    const payload = await readBody(req);

    if (payload.action === 'login') {
      const result = authenticateAdmin(authState, payload.email, payload.password);
      await saveAuthState(result.authState);
      return sendJson(res, 200, {
        ok: true,
        admin: result.admin,
        token: result.session.token,
        expiresAt: result.session.expiresAt,
      });
    }

    if (payload.action === 'create-admin') {
      const result = createAdmin(authState, {
        email: payload.email,
        password: payload.password,
        name: payload.name,
        setupCode: payload.setupCode,
        adminToken: readBearerToken(req) || payload.adminToken,
      });
      const login = authenticateAdmin(result.authState, payload.email, payload.password);
      await saveAuthState(login.authState);
      return sendJson(res, 201, {
        ok: true,
        admin: login.admin,
        token: login.session.token,
        expiresAt: login.session.expiresAt,
      });
    }

    if (payload.action === 'request-password-reset') {
      const result = requestPasswordReset(authState, payload.email, {
        origin: getOrigin(req),
      });
      await saveAuthState(result.authState);
      return sendJson(res, 200, {
        ok: true,
        message: result.message,
      });
    }

    if (payload.action === 'reset-password') {
      const result = resetAdminPassword(authState, payload.token, payload.password);
      await saveAuthState(result.authState);
      return sendJson(res, 200, {
        ok: true,
        admin: result.admin,
      });
    }

    return sendJson(res, 400, { ok: false, error: `Unknown auth action: ${payload.action}` });
  } catch (error) {
    return sendJson(res, 401, { ok: false, error: error.message || 'Authentication failed' });
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

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function getOrigin(req) {
  if (req.headers.origin) return req.headers.origin;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}
