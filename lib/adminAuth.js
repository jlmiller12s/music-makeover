const crypto = require('node:crypto');

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const RESET_TTL_MS = 1000 * 60 * 30;
const HASH_ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';
const RESET_MESSAGE = 'If an admin account exists for that email, a password reset link has been sent.';

function createAdmin(authState, payload, options = {}) {
  const state = normalizeAuthState(authState);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');
  const name = String(payload.name || email.split('@')[0] || 'Admin').trim();
  const setupCode = options.setupCode || process.env.ADMIN_SETUP_CODE || 'musicmakeover2026';
  const hasAdminSession = Boolean(payload.adminToken && verifyAdminSession(state, payload.adminToken, { throwOnInvalid: false }));
  const hasSetupCode = payload.setupCode && payload.setupCode === setupCode;

  if (!email) throw new Error('Email is required');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (state.admins.some((admin) => admin.email === email)) throw new Error('An admin with that email already exists');
  if (state.admins.length > 0 && !hasAdminSession && !hasSetupCode) {
    throw new Error('A setup code or active admin session is required to create a new admin');
  }
  if (state.admins.length === 0 && !hasSetupCode) {
    throw new Error('Setup code is required to create the first admin');
  }

  const admin = {
    id: generateId('admin'),
    email,
    name,
    role: 'admin',
    createdAt: nowIso(),
    passwordHash: hashPassword(password),
  };

  const nextState = {
    ...state,
    admins: [...state.admins, admin],
  };

  return { authState: nextState, admin: getPublicAdminProfile(admin) };
}

function authenticateAdmin(authState, emailInput, passwordInput, options = {}) {
  const state = normalizeAuthState(authState);
  const email = normalizeEmail(emailInput);
  const admin = state.admins.find((item) => item.email === email);
  if (!admin || !verifyPassword(String(passwordInput || ''), admin.passwordHash)) {
    throw new Error('Invalid email or password');
  }

  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const sessionId = generateId('sess');
  const session = {
    id: sessionId,
    adminId: admin.id,
    token: createSignedSessionToken(admin, {
      createdAt,
      expiresAt,
      sessionId,
      secret: options.sessionSecret,
    }),
    createdAt,
    expiresAt,
  };

  return {
    authState: {
      ...state,
      sessions: [...state.sessions.filter((item) => item.adminId !== admin.id || new Date(item.expiresAt) > new Date()), session],
    },
    admin: getPublicAdminProfile(admin),
    session,
  };
}

function requestPasswordReset(authState, emailInput, options = {}) {
  const state = normalizeAuthState(authState);
  const email = normalizeEmail(emailInput);
  const admin = state.admins.find((item) => item.email === email);

  if (!admin) {
    return {
      authState: state,
      message: RESET_MESSAGE,
      sent: false,
    };
  }

  const token = generateToken();
  const resetUrl = buildResetUrl(options.origin, token);
  const reset = {
    id: generateId('reset'),
    adminId: admin.id,
    token,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    usedAt: null,
  };
  const emailMessage = {
    id: generateId('email'),
    to: admin.email,
    subject: 'Reset your Music Makeover admin password',
    body: `Use this link to reset your Music Makeover admin password: ${resetUrl}`,
    resetUrl,
    createdAt: nowIso(),
    status: options.emailProviderConnected ? 'queued' : 'dev-outbox',
  };

  return {
    authState: {
      ...state,
      passwordResets: [
        ...state.passwordResets.filter((item) => item.adminId !== admin.id || item.usedAt),
        reset,
      ],
      emailOutbox: [...state.emailOutbox, emailMessage],
    },
    message: RESET_MESSAGE,
    sent: true,
    resetUrl,
  };
}

function resetAdminPassword(authState, token, newPassword) {
  const state = normalizeAuthState(authState);
  const password = String(newPassword || '');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');

  const reset = state.passwordResets.find((item) => item.token === token && !item.usedAt);
  const admin = reset ? state.admins.find((item) => item.id === reset.adminId) : null;
  if (!reset || !admin || new Date(reset.expiresAt) <= new Date()) {
    throw new Error('Password reset link is invalid or expired');
  }

  return {
    authState: {
      ...state,
      admins: state.admins.map((item) => item.id === admin.id ? { ...item, passwordHash: hashPassword(password) } : item),
      sessions: state.sessions.filter((item) => item.adminId !== admin.id),
      passwordResets: state.passwordResets.map((item) => item.id === reset.id ? { ...item, usedAt: nowIso() } : item),
    },
    admin: getPublicAdminProfile(admin),
  };
}

function verifyAdminSession(authState, token, options = {}) {
  const state = normalizeAuthState(authState);
  const session = state.sessions.find((item) => item.token === token);
  const admin = session ? state.admins.find((item) => item.id === session.adminId) : null;
  const valid = Boolean(session && admin && new Date(session.expiresAt) > new Date());

  if (valid) return admin;

  const signedAdmin = verifySignedSessionToken(token, { secret: options.sessionSecret });
  if (signedAdmin) return signedAdmin;

  if (options.throwOnInvalid !== false) {
    throw new Error('Admin login required');
  }

  return null;
}

function getPublicAdminProfile(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
  };
}

function normalizeAuthState(authState = {}) {
  const configuredAdmin = getConfiguredAdmin();
  const admins = Array.isArray(authState.admins) ? authState.admins : [];
  const mergedAdmins = configuredAdmin && !admins.some((admin) => admin.email === configuredAdmin.email)
    ? [configuredAdmin, ...admins]
    : admins;

  return {
    admins: mergedAdmins,
    sessions: Array.isArray(authState.sessions) ? authState.sessions : [],
    passwordResets: Array.isArray(authState.passwordResets) ? authState.passwordResets : [],
    emailOutbox: Array.isArray(authState.emailOutbox) ? authState.emailOutbox : [],
  };
}

function getConfiguredAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || (process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD) : '');
  if (!email || !passwordHash) return null;

  return {
    id: `admin_env_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`,
    email,
    name: String(process.env.ADMIN_NAME || email.split('@')[0] || 'Admin').trim(),
    role: 'admin',
    createdAt: 'configured',
    passwordHash,
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `pbkdf2:${HASH_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, storedHash = '') {
  const [method, iterationsText, salt, hash] = storedHash.split(':');
  if (method !== 'pbkdf2' || !iterationsText || !salt || !hash) return false;
  const iterations = Number(iterationsText);
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function createSignedSessionToken(admin, options = {}) {
  const payload = {
    typ: 'music-makeover-admin-session',
    sid: options.sessionId || generateId('sess'),
    iat: options.createdAt || nowIso(),
    exp: options.expiresAt || new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    admin: getPublicAdminProfile(admin),
  };
  const encodedPayload = base64UrlJson(payload);
  const signature = signSessionPayload(encodedPayload, options.secret);
  return `mmadmin.${encodedPayload}.${signature}`;
}

function verifySignedSessionToken(token, options = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'mmadmin') return null;

  const [, encodedPayload, signature] = parts;
  const expectedSignature = signSessionPayload(encodedPayload, options.secret);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.typ !== 'music-makeover-admin-session') return null;
    if (!payload.admin || !payload.admin.email || !payload.admin.id) return null;
    if (new Date(payload.exp) <= new Date()) return null;
    return getPublicAdminProfile(payload.admin);
  } catch (error) {
    return null;
  }
}

function signSessionPayload(encodedPayload, secret) {
  return crypto
    .createHmac('sha256', getSessionSecret(secret))
    .update(encodedPayload)
    .digest('base64url');
}

function getSessionSecret(secret) {
  return String(
    secret
    || process.env.ADMIN_SESSION_SECRET
    || process.env.AUTH_SECRET
    || process.env.ADMIN_SETUP_CODE
    || 'music-makeover-dev-session-secret',
  );
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function buildResetUrl(origin, token) {
  const base = String(origin || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/reset-password.html?token=${encodeURIComponent(token)}`;
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  authenticateAdmin,
  createAdmin,
  getPublicAdminProfile,
  requestPasswordReset,
  resetAdminPassword,
  verifyAdminSession,
};
