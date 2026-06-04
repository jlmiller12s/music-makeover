const test = require('node:test');
const assert = require('node:assert/strict');

const {
  authenticateAdmin,
  createAdmin,
  getPublicAdminProfile,
  requestPasswordReset,
  resetAdminPassword,
  verifyAdminSession,
} = require('../lib/adminAuth');

test('creates the first admin with an access code and hides the password hash from public profile', () => {
  const authState = { admins: [], sessions: [] };
  const result = createAdmin(authState, {
    email: 'ashley@example.com',
    password: 'super-secret-123',
    name: 'Ashley Miller',
    setupCode: 'musicmakeover2026',
  }, { setupCode: 'musicmakeover2026' });

  assert.equal(result.admin.email, 'ashley@example.com');
  assert.equal(result.authState.admins.length, 1);
  assert.ok(result.authState.admins[0].passwordHash);
  assert.equal(getPublicAdminProfile(result.admin).passwordHash, undefined);
});

test('rejects creating a later admin without a setup code or active admin token', () => {
  const first = createAdmin({ admins: [], sessions: [] }, {
    email: 'ashley@example.com',
    password: 'super-secret-123',
    setupCode: 'musicmakeover2026',
  }, { setupCode: 'musicmakeover2026' });

  assert.throws(
    () => createAdmin(first.authState, {
      email: 'helper@example.com',
      password: 'another-secret-123',
    }, { setupCode: 'musicmakeover2026' }),
    /setup code or active admin session/i,
  );
});

test('authenticates with the right password and verifies the issued session token', () => {
  const created = createAdmin({ admins: [], sessions: [] }, {
    email: 'ashley@example.com',
    password: 'super-secret-123',
    setupCode: 'musicmakeover2026',
  }, { setupCode: 'musicmakeover2026' });

  assert.throws(
    () => authenticateAdmin(created.authState, 'ashley@example.com', 'wrong-password'),
    /invalid email or password/i,
  );

  const signedIn = authenticateAdmin(created.authState, 'ashley@example.com', 'super-secret-123');
  const verified = verifyAdminSession(signedIn.authState, signedIn.session.token);

  assert.equal(verified.email, 'ashley@example.com');
  assert.equal(getPublicAdminProfile(verified).email, 'ashley@example.com');
});

test('verifies an issued session token without shared in-memory sessions', () => {
  const created = createAdmin({ admins: [], sessions: [] }, {
    email: 'ashley@example.com',
    password: 'super-secret-123',
    name: 'Ashley Miller',
    setupCode: 'musicmakeover2026',
  }, { setupCode: 'musicmakeover2026' });

  const signedIn = authenticateAdmin(created.authState, 'ashley@example.com', 'super-secret-123', {
    sessionSecret: 'shared-vercel-secret',
  });
  const verified = verifyAdminSession({ admins: [], sessions: [] }, signedIn.session.token, {
    sessionSecret: 'shared-vercel-secret',
  });

  assert.equal(verified.email, 'ashley@example.com');
  assert.equal(verified.name, 'Ashley Miller');
});

test('authenticates an environment-backed admin after a cold start', () => {
  const previousEmail = process.env.ADMIN_EMAIL;
  const previousPassword = process.env.ADMIN_PASSWORD;
  const previousPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const previousName = process.env.ADMIN_NAME;

  process.env.ADMIN_EMAIL = 'ashley@example.com';
  process.env.ADMIN_PASSWORD = 'env-secret-123';
  delete process.env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_NAME = 'Ashley Env';

  try {
    const signedIn = authenticateAdmin({ admins: [], sessions: [] }, 'ashley@example.com', 'env-secret-123', {
      sessionSecret: 'shared-vercel-secret',
    });
    const verified = verifyAdminSession({ admins: [], sessions: [] }, signedIn.session.token, {
      sessionSecret: 'shared-vercel-secret',
    });

    assert.equal(signedIn.admin.email, 'ashley@example.com');
    assert.equal(signedIn.admin.name, 'Ashley Env');
    assert.equal(verified.email, 'ashley@example.com');
  } finally {
    restoreEnv('ADMIN_EMAIL', previousEmail);
    restoreEnv('ADMIN_PASSWORD', previousPassword);
    restoreEnv('ADMIN_PASSWORD_HASH', previousPasswordHash);
    restoreEnv('ADMIN_NAME', previousName);
  }
});

test('creates a password reset email without revealing whether the address exists', () => {
  const created = createAdmin({ admins: [], sessions: [] }, {
    email: 'ashley@example.com',
    password: 'super-secret-123',
    setupCode: 'musicmakeover2026',
  }, { setupCode: 'musicmakeover2026' });

  const requested = requestPasswordReset(created.authState, 'ashley@example.com', {
    origin: 'https://themusicmakeover.com',
  });
  const unknown = requestPasswordReset(requested.authState, 'unknown@example.com', {
    origin: 'https://themusicmakeover.com',
  });

  assert.equal(requested.message, 'If an admin account exists for that email, a password reset link has been sent.');
  assert.equal(requested.authState.passwordResets.length, 1);
  assert.equal(requested.authState.emailOutbox.length, 1);
  assert.match(requested.authState.emailOutbox[0].body, /reset-password.html\?token=/);
  assert.equal(unknown.message, requested.message);
  assert.equal(unknown.authState.passwordResets.length, 1);
});

test('resets an admin password with a valid reset token', () => {
  const created = createAdmin({ admins: [], sessions: [] }, {
    email: 'ashley@example.com',
    password: 'old-secret-123',
    setupCode: 'musicmakeover2026',
  }, { setupCode: 'musicmakeover2026' });
  const requested = requestPasswordReset(created.authState, 'ashley@example.com', {
    origin: 'https://themusicmakeover.com',
  });
  const token = requested.authState.passwordResets[0].token;
  const reset = resetAdminPassword(requested.authState, token, 'new-secret-123');

  assert.throws(
    () => authenticateAdmin(reset.authState, 'ashley@example.com', 'old-secret-123'),
    /invalid email or password/i,
  );
  const signedIn = authenticateAdmin(reset.authState, 'ashley@example.com', 'new-secret-123');
  assert.equal(signedIn.admin.email, 'ashley@example.com');
});

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
