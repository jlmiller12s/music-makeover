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
