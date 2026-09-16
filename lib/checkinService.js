const crypto = require('node:crypto');
const { score, validateInput, detectPatterns, questionnaire } = require('./checkinScoring');
const SESSION_MS = 12 * 60 * 60 * 1000;
const CODE_MS = 10 * 60 * 1000;
const MESSAGE = 'If this email is approved for the pre-pilot, a sign-in code is on its way. Check your inbox and spam folder.';
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
function email(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw fail('Enter a valid email address.');
  return normalized;
}
function fail(message, status = 400) { return Object.assign(new Error(message), { status }); }
function createCheckinService({ store, sendEmail, emailReady, now = Date.now }) {
  async function limit(key, max, windowMs = 15 * 60 * 1000) {
    const allowed = await store.mutate(`rate:${hash(key)}`, state => {
      if (!state.until || state.until <= now()) { state.until = now() + windowMs; state.count = 0; }
      state.count++;
      return state.count <= max;
    });
    if (!allowed) throw fail('Too many attempts. Please wait 15 minutes and try again.', 429);
  }
  async function requestCode(address, ip) {
    const normalized = email(address);
    if (!emailReady()) throw fail('Sign-in email is not available yet. Please try again later.', 503);
    await limit(`request-ip:${ip}`, 30);
    await limit(`request-email:${normalized}`, 4);
    const code = String(crypto.randomInt(10000000, 100000000));
    const nonce = crypto.randomBytes(24).toString('hex');
    const account = await store.get(`account:${normalized}`);
    if (!account?.active) return { message: MESSAGE };
    const issued = await store.mutate(`account:${normalized}`, a => {
      if (!a.active || (a.code && a.code.createdAt > now() - 60000)) return false;
      a.code = { nonce, hash: hash(`${nonce}:${code}`), expiresAt: now() + CODE_MS, createdAt: now(), attempts: 0 };
      return true;
    });
    if (issued) {
      try {
        await sendEmail({ to: normalized, subject: 'Your Music Makeover sign-in code', text: `Your Music Leader Sustainability Check-In sign-in code is:\n\n${code}\n\nIt expires in 10 minutes and can be used once. Do not share this code. If you did not request it, you can ignore this email.`, idempotencyKey: `checkin-code-${nonce}` });
      } catch (error) {
        await store.mutate(`account:${normalized}`, a => { if (a.code?.nonce === nonce) a.code = null; });
        // Keep account eligibility private, including provider failures.
        console.error('Check-in sign-in email delivery failed');
      }
    }
    return { message: MESSAGE };
  }
  async function verifyCode(address, code, ip) {
    const normalized = email(address);
    await limit(`verify-ip:${ip}`, 50);
    if (typeof code !== 'string' || !/^\d{8}$/.test(code)) throw fail('Enter the eight-digit code from your email.');
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = now() + SESSION_MS;
    const valid = await store.mutate(`account:${normalized}`, a => {
      if (!a.active || !a.code || a.code.expiresAt <= now() || a.code.attempts >= 5) return false;
      a.code.attempts++;
      const expected = Buffer.from(a.code.hash, 'hex');
      const supplied = Buffer.from(hash(`${a.code.nonce}:${code}`), 'hex');
      if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return false;
      a.code = null;
      a.sessions = [...(a.sessions || []).filter(s => s.expiresAt > now()).slice(-3), { hash: hash(token), expiresAt }];
      return true;
    });
    if (!valid) throw fail('That code is invalid or expired. Request a new code and try again.', 401);
    return { token: `${Buffer.from(normalized).toString('base64url')}.${token}`, expiresAt };
  }
  function sessionParts(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 2 || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) throw fail('Please sign in to continue.', 401);
    return { address: email(Buffer.from(parts[0], 'base64url').toString('utf8')), digest: hash(parts[1]) };
  }
  function authorized(account, digest) { return account?.active && account.sessions?.some(s => s.hash === digest && s.expiresAt > now()); }
  async function participant(token) {
    const { address, digest } = sessionParts(token);
    const account = await store.get(`account:${address}`);
    if (!authorized(account, digest)) throw fail('Please sign in to continue.', 401);
    return { email: address, name: account.name || '', questionnaire: questionnaire(), draft: account.draft || null, submission: publicSubmission(account.submission) };
  }
  async function logout(token) {
    try {
      const { address, digest } = sessionParts(token);
      await store.mutate(`account:${address}`, a => { a.sessions = (a.sessions || []).filter(s => s.hash !== digest); });
    } catch (e) { if (e.status !== 401 && e.status !== 400) throw e; }
  }
  async function saveDraft(token, input) {
    const clean = validateInput(input, false);
    const { address, digest } = sessionParts(token);
    await store.mutate(`account:${address}`, a => {
      if (!authorized(a, digest)) throw fail('Please sign in to continue.', 401);
      if (a.submission) throw fail('This check-in has already been submitted.', 409);
      a.draft = clean;
      a.draftSavedAt = new Date(now()).toISOString();
    });
    return { savedAt: new Date(now()).toISOString() };
  }
  async function submit(token, input, adminEmails) {
    const clean = validateInput(input);
    const snapshot = score(clean);
    const { address, digest } = sessionParts(token);
    const result = await store.mutate(`account:${address}`, a => {
      if (!authorized(a, digest)) throw fail('Please sign in to continue.', 401);
      if (a.submission) return { submission: a.submission, created: false };
      a.submission = { id: crypto.randomUUID(), submittedAt: new Date(now()).toISOString(), input: clean, snapshot, patterns: detectPatterns(snapshot, clean.answers), review: { status: 'pending', notes: '' }, notification: 'pending' };
      a.draft = null;
      return { submission: a.submission, created: true };
    });
    if (result.created) await notify(address, adminEmails);
    return publicSubmission(result.submission);
  }
  async function notify(address, adminEmails) {
    const a = await store.get(`account:${address}`);
    if (!a?.submission) throw fail('Submission not found.', 404);
    if (a.submission.notification === 'sent') return { sent: true };
    const recipients = [...new Set(adminEmails.map(email))];
    let sent = false;
    try {
      if (!recipients.length) throw new Error('No admin notification recipients');
      await sendEmail({ to: recipients, subject: 'A Sustainability Check-In is ready for review', text: 'A participant has completed the Music Leader Sustainability Check-In. Sign in to the Music Makeover admin portal and open Sustainability Check-Ins to review it. Responses and results are kept in the protected portal, not in this email.', idempotencyKey: `checkin-submission-${a.submission.id}` });
      sent = true;
    } catch { console.error('Check-in admin notification delivery failed'); }
    await store.mutate(`account:${address}`, current => { current.submission.notification = sent ? 'sent' : 'failed'; });
    return { sent };
  }
  async function allow(addresses, admin) {
    if (!Array.isArray(addresses) || !addresses.length || addresses.length > 100) throw fail('Enter between 1 and 100 email addresses.');
    const unique = [...new Set(addresses.map(email))];
    for (const address of unique) await store.mutate(`account:${address}`, a => {
      a.email = address;
      a.active = true;
      a.approvedAt = a.approvedAt || new Date(now()).toISOString();
      a.approvedBy = admin.id;
    });
    await store.cleanup();
    return { count: unique.length };
  }
  async function revoke(address) {
    await store.mutate(`account:${email(address)}`, a => { a.active = false; a.sessions = []; a.code = null; });
  }
  async function resetPreview(address) {
    await store.mutate(`account:${email(address)}`, a => {
      if (!a.email) throw fail('Participant not found.', 404);
      a.submission = null;
      a.draft = null;
      a.draftSavedAt = null;
      a.sessions = [];
      a.code = null;
    });
  }
  async function list() {
    return (await store.listAccounts()).filter(a => a.email).map(a => ({ email: a.email, active: a.active, approvedAt: a.approvedAt, started: Boolean(a.draft), submittedAt: a.submission?.submittedAt || null, reviewStatus: a.submission?.review?.status || null, notification: a.submission?.notification || null }));
  }
  async function detail(address) {
    const a = await store.get(`account:${email(address)}`);
    if (!a?.email) throw fail('Participant not found.', 404);
    return { email: a.email, active: a.active, submission: a.submission || null, questionnaire: questionnaire() };
  }
  async function review(address, notes, status, admin) {
    if (typeof notes !== 'string' || notes.length > 10000 || !['pending', 'reviewed'].includes(status)) throw fail('Check the review status and notes (10,000 characters maximum).');
    await store.mutate(`account:${email(address)}`, a => {
      if (!a.submission) throw fail('Submission not found.', 404);
      a.submission.review = { notes, status, updatedAt: new Date(now()).toISOString(), updatedBy: admin.email };
    });
  }
  return { requestCode, verifyCode, participant, logout, saveDraft, submit, allow, revoke, resetPreview, list, detail, review, notify };
}
function publicSubmission(submission) {
  if (!submission) return null;
  return { id: submission.id, submittedAt: submission.submittedAt, reviewStatus: submission.review.status, snapshot: submission.snapshot };
}
module.exports = { createCheckinService, email, hash, fail, SESSION_MS };
