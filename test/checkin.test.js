const test = require('node:test');
const assert = require('node:assert/strict');
const { score, signal, questionnaire, validateInput } = require('../lib/checkinScoring');
const { createCheckinService } = require('../lib/checkinService');
const { makeHandler } = require('../api/checkin');
const { createAdmin, authenticateAdmin, verifyAdminSession } = require('../lib/adminAuth');
const { createCheckinStore } = require('../lib/checkinStore');

function input(value = 4) {
  return { answers: Object.fromEntries(questionnaire().domains.flatMap(d => d.items.map(i => [i.id, value]))), baseline: 3, outlook: 2, consent: true, heaviest: '<script>alert(1)</script> Exact words\nNew line', hope: 'More room to recover.' };
}
function memoryStore() {
  const records = new Map(); let queue = Promise.resolve();
  return {
    records,
    async get(key) { return structuredClone(records.get(key) || null); },
    async listAccounts() { return [...records].filter(([k]) => k.startsWith('account:')).map(([, v]) => structuredClone(v)); },
    mutate(key, callback) {
      const operation = queue.then(async () => {
        const state = structuredClone(records.get(key) || {});
        const result = await callback(state);
        records.set(key, structuredClone(state));
        return structuredClone(result);
      });
      queue = operation.catch(() => {}); return operation;
    },
    async cleanup() {},
  };
}
function setup() {
  let time = 1800000000000; const store = memoryStore(); const outbox = [];
  const service = createCheckinService({ store, now: () => time, emailReady: () => true, sendEmail: async message => { outbox.push(message); } });
  const admin = { id: 'admin-1', email: 'admin@example.com' };
  async function login(address = 'one@example.com', ip = 'ip1') {
    await service.allow([address], admin); await service.requestCode(address, ip);
    const code = outbox.findLast(m => m.to === address).text.match(/\b\d{8}\b/)[0];
    const session = await service.verifyCode(address, code, ip);
    return { ...session, code };
  }
  return { service, store, outbox, admin, login, advance: ms => time += ms };
}
test('all eight workbook QA cases produce the exact average and band', () => {
  const cases = [[[1,1,1,1],1,'Under Strain'],[[1,1,1,5],2,'Under Strain'],[[2,2,3,3],2.5,'Needs Attention'],[[3,3,3,4],3.25,'Needs Attention'],[[3,3,4,4],3.5,'Stable'],[[5,4,3,4],4,'Stable'],[[4,4,4,5],4.25,'Strong'],[[5,5,5,5],5,'Strong']];
  for (const [values, average, band] of cases) for (const domain of questionnaire().domains) {
    const payload = input(); domain.items.forEach((item, i) => payload.answers[item.id] = values[i]);
    const result = score(payload).domains.find(d => d.id === domain.id);
    assert.equal(result.average, average); assert.equal(result.signal, band); assert.ok(result.meaning && result.reflection && result.pathway);
  }
});
test('changed answers replace prior values; outlook never affects domain scores', () => {
  const payload = input(1); payload.answers.ConnectionQ4Score = 5;
  assert.equal(score(payload).domains[0].average, 2);
  payload.answers.ConnectionQ4Score = 1; payload.outlook = 5;
  assert.equal(score(payload).domains[0].average, 1);
  assert.equal(score(payload).overall, undefined);
});
test('no fabricated pressures for strong profiles; incomplete and invalid values rejected', () => {
  assert.deepEqual(score(input(5)).pressure, []);
  assert.deepEqual(score(input(1)).supporting, []);
  for (const value of [undefined, null, '4', 0, 6, 1.5, NaN]) {
    const payload = input(); payload.answers.ConnectionQ1Score = value;
    assert.throws(() => score(payload));
  }
  assert.throws(() => score({ ...input(), consent: false }));
  assert.throws(() => score({ ...input(), heaviest: 'x'.repeat(3001) }));
  assert.throws(() => signal(NaN));
  assert.deepEqual(validateInput({ answers: {} }, false).answers, {});
});
test('unapproved email receives generic response and no code', async () => {
  const f = setup(); await f.service.allow(['one@example.com'], f.admin);
  const approved = await f.service.requestCode('one@example.com', 'ip1');
  const unknown = await f.service.requestCode('unknown@example.com', 'ip2');
  assert.deepEqual(approved, unknown); assert.equal(f.outbox.length, 1);
  await assert.rejects(f.service.verifyCode('unknown@example.com', '12345678', 'ip2'), /invalid or expired/);
});
test('code is one-time, expires, and locks after five failed attempts', async () => {
  const f = setup(); const logged = await f.login();
  await assert.rejects(f.service.verifyCode('one@example.com', logged.code, 'ip1'), /invalid or expired/);
  f.advance(61000); await f.service.requestCode('one@example.com', 'ip1');
  const code = f.outbox.at(-1).text.match(/\b\d{8}\b/)[0];
  const wrong = code === '11111111' ? '22222222' : '11111111';
  for (let i = 0; i < 5; i++) await assert.rejects(f.service.verifyCode('one@example.com', wrong, 'ip1'));
  await assert.rejects(f.service.verifyCode('one@example.com', code, 'ip1'));
  f.advance(61000); await f.service.requestCode('one@example.com', 'ip1');
  const fresh = f.outbox.at(-1).text.match(/\b\d{8}\b/)[0]; f.advance(600001);
  await assert.rejects(f.service.verifyCode('one@example.com', fresh, 'ip1'));
});
test('participant cannot alter token identity; revocation and logout invalidate sessions', async () => {
  const f = setup(); const one = await f.login(); await f.login('two@example.com','ip2');
  const forged = `${Buffer.from('two@example.com').toString('base64url')}.${one.token.split('.')[1]}`;
  await assert.rejects(f.service.participant(forged), /sign in/);
  await f.service.revoke('one@example.com'); await assert.rejects(f.service.participant(one.token));
  const renewed = await f.login(); await f.service.logout(renewed.token); await assert.rejects(f.service.participant(renewed.token));
});
test('session expires after 12 hours', async () => {
  const f = setup(); const session = await f.login(); f.advance(12*3600000+1); await assert.rejects(f.service.participant(session.token));
});
test('draft persists and duplicate concurrent submissions create one result and notification', async () => {
  const f = setup(); const { token } = await f.login();
  await f.service.saveDraft(token, { ...input(1), step: 5 });
  assert.equal((await f.service.participant(token)).draft.step, 5);
  const submissions = await Promise.all(Array.from({ length: 20 }, () => f.service.submit(token, input(), ['admin@example.com'])));
  assert.equal(new Set(submissions.map(s => s.id)).size, 1);
  assert.equal(f.outbox.filter(m => m.subject.includes('ready for review')).length, 1);
  await f.service.review('one@example.com', 'Private reviewer note', 'reviewed', f.admin);
  const participant = await f.service.participant(token);
  assert.equal(participant.submission.review, undefined); assert.equal(participant.submission.patterns, undefined);
  assert.equal(participant.submission.snapshot.heaviest, input().heaviest);
  assert.equal(participant.draft, null);
  assert.equal((await f.service.detail('one@example.com')).submission.review.notes, 'Private reviewer note');
  await assert.rejects(f.service.saveDraft(token, input()), /already been submitted/);
});
test('100 participants remain separate under concurrent submissions', async () => {
  const f = setup();
  const sessions = await Promise.all(Array.from({ length: 100 }, (_, i) => f.login(`person${i}@example.com`, `ip${i}`)));
  const results = await Promise.all(sessions.map(s => f.service.submit(s.token, input(), ['admin@example.com'])));
  assert.equal(new Set(results.map(r => r.id)).size, 100);
  assert.equal((await f.service.list()).filter(a => a.submittedAt).length, 100);
});
test('email failure keeps saved submission and exposes retry status only to admin', async () => {
  const f = setup(); const { token } = await f.login();
  const broken = createCheckinService({ store: f.store, now: () => 1800000000000, emailReady: () => true, sendEmail: async () => { throw new Error('provider unavailable'); } });
  const result = await broken.submit(token, input(), ['admin@example.com']);
  assert.ok(result.snapshot); assert.equal(result.notification, undefined);
  assert.equal((await broken.detail('one@example.com')).submission.notification, 'failed');
});
test('persistent throttling limits code requests', async () => {
  const f = setup();
  for (let i = 0; i < 4; i++) await f.service.requestCode('unknown@example.com','ip1');
  await assert.rejects(f.service.requestCode('unknown@example.com','ip1'), e => e.status === 429);
});
async function request(handler, { method = 'GET', body, headers = {}, url = '/api/checkin' } = {}) {
  let parsed; const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, end(text) { parsed = JSON.parse(text); } };
  await handler({ method, body, url, headers: { host: 'localhost:3000', ...headers }, socket: { remoteAddress: '127.0.0.1' } }, res);
  return { status: res.statusCode, headers: res.headers, body: parsed };
}
test('HTTP API rejects unauthenticated access, cross-origin writes and oversized payloads', async () => {
  const f = setup(); const handler = makeHandler({ service: f.service, loadAuthState: async () => ({ admins: [], sessions: [] }) });
  assert.equal((await request(handler)).status, 401);
  assert.equal((await request(handler, { url: '/api/checkin?admin=1' })).status, 401);
  const headers = { origin: 'https://evil.example', 'content-type': 'application/json' };
  assert.equal((await request(handler, { method: 'POST', body: { action: 'request-code', email: 'one@example.com' }, headers })).status, 403);
  headers.origin = 'http://localhost:3000';
  assert.equal((await request(handler, { method: 'POST', body: { data: 'x'.repeat(33000) }, headers })).status, 413);
});
test('HTTP login sets HttpOnly scoped cookie and never returns session token in JSON', async () => {
  const f = setup(); await f.service.allow(['one@example.com'], f.admin); await f.service.requestCode('one@example.com','ip1');
  const code = f.outbox.at(-1).text.match(/\b\d{8}\b/)[0];
  const handler = makeHandler({ service: f.service });
  const result = await request(handler, { method: 'POST', headers: { origin: 'https://localhost:3000', 'content-type': 'application/json', 'x-forwarded-proto': 'https' }, body: { action: 'verify-code', email: 'one@example.com', code } });
  assert.equal(result.status, 200); assert.equal(result.body.token, undefined);
  assert.match(result.headers['Set-Cookie'], /HttpOnly; SameSite=Strict; Path=\/api\/checkin; Max-Age=43200; Secure/);
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
});
test('production disables published setup code and unsigned/stateless admin fallback', () => {
  const previous = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => createAdmin({}, { email: 'x@example.com', password: 'abcdefgh', setupCode: 'musicmakeover2026' }));
    const created = createAdmin({}, { email: 'x@example.com', password: 'abcdefgh', setupCode: 'private-setup' }, { setupCode: 'private-setup' });
    const login = authenticateAdmin(created.authState, 'x@example.com', 'abcdefgh');
    assert.equal(verifyAdminSession({}, login.session.token, { throwOnInvalid: false }), null);
    assert.ok(verifyAdminSession(login.authState, login.session.token));
    assert.throws(() => createAdmin(created.authState, { email: 'y@example.com', password: 'abcdefgh', setupCode: 'private-setup' }, { setupCode: 'private-setup' }), /active admin session/);
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
test('Postgres mutation takes a row lock, commits changes and rolls back failed writes', async () => {
  const calls = []; const client = { async query(sql, values) { calls.push({ sql, values }); return { rows: sql.includes('FOR UPDATE') ? [{ value: { active: true } }] : [] }; }, release() { calls.push({ sql: 'RELEASE' }); } };
  const pool = { async query(sql) { calls.push({ sql }); return { rows: [] }; }, async connect() { return client; } };
  const store = createCheckinStore(pool, { schema: 'music_checkin_test' });
  await store.mutate('account:a@example.com', a => { a.active = false; });
  assert.ok(calls.some(c => c.sql.includes('FOR UPDATE'))); assert.ok(calls.some(c => c.sql === 'COMMIT'));
  assert.equal(JSON.parse(calls.find(c => c.sql.startsWith('UPDATE')).values[1]).active, false);
  await assert.rejects(store.mutate('account:a@example.com', () => { throw new Error('fail'); }));
  assert.ok(calls.some(c => c.sql === 'ROLLBACK'));
});
