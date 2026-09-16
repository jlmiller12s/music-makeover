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
    async deleteAccounts(addresses) { let count = 0; for (const address of addresses) if (records.delete(`account:${address}`)) count++; return count; },
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

test('any email can begin without approval or email delivery, with independent private attempts', async () => {
  const f = setup();
  const open = createCheckinService({ store: f.store, emailReady: () => false, sendEmail: async () => { throw new Error('No email should be sent to begin'); } });
  const first = await open.begin('new@example.com', 'ip');
  await open.saveDraft(first.token, input());
  const second = await open.begin('new@example.com', 'ip');
  const a = await open.participant(first.token); const b = await open.participant(second.token);
  assert.notEqual(a.id, b.id); assert.equal(b.draft, null); assert.equal(b.submission, null);
  assert.ok(a.draft); assert.equal(b.email, 'new@example.com');
  await assert.rejects(open.participant(`${first.token.split('.')[0]}.${second.token.split('.')[1]}`), e => e.status === 401);
  await open.deleteParticipants([a.id]);
  await assert.rejects(open.participant(first.token), e => e.status === 401);
  assert.equal((await open.participant(second.token)).id, b.id);
  await open.submit(second.token, input(3), ['admin@example.com']);
  await open.review(b.id, 'Private note for this attempt', 'reviewed', f.admin);
  assert.equal((await open.detail(b.id)).submission.review.notes, 'Private note for this attempt');
  assert.equal((await open.participant(second.token)).submission.reviewStatus, 'reviewed');
  await assert.rejects(open.begin('not-an-email', 'ip'), /valid email/);
});

test('started and completed API notifications use only the two requested recipients', async () => {
  const f = setup(); let startedRecipients, completedRecipients;
  const handler = makeHandler({ service: { ...f.service,
    begin: async (_email, _ip, recipients) => { startedRecipients = recipients; return { token: 'test-token' }; },
    submit: async (_token, _input, recipients) => { completedRecipients = recipients; return {}; }
  }, loadAuthState: async () => { throw new Error('Recipient list must not come from stored admins'); } });
  const headers = { origin: 'http://localhost:3000', 'content-type': 'application/json' };
  assert.equal((await request(handler, { method: 'POST', headers, body: { action: 'begin', email: 'new@example.com' } })).status, 200);
  assert.equal((await request(handler, { method: 'POST', headers, body: { action: 'submit', input: input() } })).status, 200);
  assert.deepEqual(startedRecipients, ['themusicmakeover@gmail.com', 'jlmiller12s@gmail.com']);
  assert.deepEqual(completedRecipients, startedRecipients);
});

test('begin sends a started notification and tolerates failed delivery', async () => {
  const f = setup(); const recipients = ['themusicmakeover@gmail.com', 'jlmiller12s@gmail.com'];
  await f.service.begin('new@example.com', 'ip', recipients);
  assert.deepEqual(f.outbox[0].to, recipients); assert.match(f.outbox[0].subject, /started/);
  const broken = createCheckinService({ store: f.store, sendEmail: async () => { throw new Error('provider unavailable'); } });
  const session = await broken.begin('other@example.com', 'ip', recipients);
  assert.equal((await broken.participant(session.token)).email, 'other@example.com');
});

test('email entry never reveals an existing completed legacy assessment', async () => {
  const f = setup(); const legacy = await f.login();
  await f.service.submit(legacy.token, input(), ['admin@example.com']);
  const fresh = await f.service.begin('one@example.com', 'ip');
  assert.equal((await f.service.participant(fresh.token)).submission, null);
  assert.ok((await f.service.participant(legacy.token)).submission);
});

test('bulk deletion removes selected records and sessions without touching others', async () => {
  const f = setup(); const first = await f.login(); const second = await f.login('two@example.com', 'ip2'); const kept = await f.login('keep@example.com', 'ip3');
  await f.service.submit(first.token, input(), ['admin@example.com']);
  await f.service.saveDraft(second.token, input());
  await assert.rejects(f.service.deleteParticipants(['one@example.com', 'invalid']), /valid email/);
  assert.ok((await f.service.participant(first.token)).submission);
  assert.deepEqual(await f.service.deleteParticipants(['ONE@example.com', 'two@example.com', 'one@example.com']), { count: 2 });
  await assert.rejects(f.service.participant(first.token), e => e.status === 401);
  await assert.rejects(f.service.participant(second.token), e => e.status === 401);
  await assert.rejects(f.service.detail('one@example.com'), e => e.status === 404);
  assert.equal((await f.service.participant(kept.token)).email, 'keep@example.com');
  assert.deepEqual((await f.service.list()).map(p => p.email), ['keep@example.com']);
  const count = f.outbox.length; await f.service.requestCode('one@example.com', 'new-ip'); assert.equal(f.outbox.length, count);
  await assert.rejects(f.service.deleteParticipants([]), /Select between/);
});

test('bulk deletion API permits admins only', async () => {
  const f = setup(); let deleted;
  const auth = { admins: [{ ...f.admin, role: 'admin' }], sessions: [{ token: 'delete-test-session', adminId: f.admin.id, expiresAt: new Date(Date.now() + 60000).toISOString() }] };
  const handler = makeHandler({ service: { ...f.service, deleteParticipants: async emails => { deleted = emails; return { count: emails.length }; } }, loadAuthState: async () => auth });
  const headers = { origin: 'http://localhost:3000', 'content-type': 'application/json' };
  const body = { action: 'admin:delete', emails: ['one@example.com'] };
  assert.equal((await request(handler, { method: 'POST', headers, body })).status, 401);
  assert.equal(deleted, undefined);
  headers.authorization = 'Bearer delete-test-session';
  assert.equal((await request(handler, { method: 'POST', headers, body })).body.count, 1);
  assert.deepEqual(deleted, body.emails);
});

test('preview reset clears only the selected test and requires fresh sign-in', async () => {
  const f = setup(); const first = await f.login(); const other = await f.login('two@example.com', 'ip2');
  await f.service.submit(first.token, input(), ['admin@example.com']);
  await f.service.submit(other.token, input(5), ['admin@example.com']);
  await f.service.resetPreview('one@example.com');
  await assert.rejects(f.service.participant(first.token), e => e.status === 401);
  assert.ok((await f.service.participant(other.token)).submission);
  const fresh = await f.login();
  const result = await f.service.participant(fresh.token);
  assert.equal(result.submission, null); assert.equal(result.draft, null);
  assert.ok((await f.service.submit(fresh.token, input(3), ['admin@example.com'])).snapshot);
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
test('email entry sets HttpOnly scoped cookie and never returns session token in JSON', async () => {
  const f = setup(); await f.service.allow(['one@example.com'], f.admin); await f.service.requestCode('one@example.com','ip1');
  const code = f.outbox.at(-1).text.match(/\b\d{8}\b/)[0];
  const handler = makeHandler({ service: f.service });
  const result = await request(handler, { method: 'POST', headers: { origin: 'https://localhost:3000', 'content-type': 'application/json', 'x-forwarded-proto': 'https' }, body: { action: 'begin', email: 'one@example.com' } });
  assert.equal(result.status, 200); assert.equal(result.body.token, undefined);
  assert.match(result.headers['Set-Cookie'], /HttpOnly; SameSite=Strict; Path=\/api\/checkin; Max-Age=43200; Secure/);
  assert.equal(result.headers['Cache-Control'], 'private, no-store');
});

test('preview reset endpoint requires an admin and rejects production', async () => {
  const f = setup(); let resets = 0;
  const auth = { admins: [{ ...f.admin, role: 'admin' }], sessions: [{ token: 'admin-test-session', adminId: f.admin.id, expiresAt: new Date(Date.now() + 60000).toISOString() }] };
  const handler = makeHandler({ service: { ...f.service, resetPreview: async () => { resets++; } }, loadAuthState: async () => auth });
  const headers = { origin: 'http://localhost:3000', 'content-type': 'application/json' };
  const body = { action: 'admin:reset-preview', email: 'one@example.com' };
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = 'preview';
    assert.equal((await request(handler, { method: 'POST', headers, body })).status, 401);
    headers.authorization = 'Bearer admin-test-session';
    process.env.VERCEL_ENV = 'production';
    assert.equal((await request(handler, { method: 'POST', headers, body })).status, 403);
    assert.equal(resets, 0);
    process.env.VERCEL_ENV = 'preview';
    assert.equal((await request(handler, { method: 'POST', headers, body })).status, 200);
    assert.equal(resets, 1);
  } finally { if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous; }
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

test('post-assessment feedback is isolated, validated and leaves scored answers unchanged', async () => {
  const {service, admin, outbox}=setup();
  const first=await service.begin('feedback@example.com','feedback-ip');
  await assert.rejects(service.saveFeedback(first.token,{feltTrue:'Too early'}),{status:409});
  const original=await service.submit(first.token,input(),['admin@example.com']);
  const count=outbox.length;
  const answers={feltTrue:'Accurate <script>literal</script>',missing:'Resources',unclear:'',clearer:'Workload'};
  await service.saveFeedback(first.token,answers);
  const own=await service.participant(first.token);
  assert.deepEqual(own.submission.feedback.answers,answers);
  assert.deepEqual(own.submission.snapshot,original.snapshot);
  assert.deepEqual((await service.detail(own.id)).submission.feedback.answers,answers);
  const other=await service.begin('feedback@example.com','feedback-ip-2');
  assert.equal((await service.participant(other.token)).submission,null);
  await assert.rejects(service.saveFeedback(other.token,answers),{status:409});
  await assert.rejects(service.saveFeedback(first.token,{feltTrue:'a'.repeat(3001)}),{status:400});
  await assert.rejects(service.saveFeedback(first.token,{missing:42}),{status:400});
  await service.saveFeedback(first.token,{feltTrue:'Updated'});
  assert.equal((await service.participant(first.token)).submission.feedback.answers.feltTrue,'Updated');
  assert.equal(outbox.length,count);
  await service.revoke(own.id,admin);
  await assert.rejects(service.saveFeedback(first.token,answers),{status:401});
});

test('post-Snapshot clarity requires a completed authorized assessment and does not change scoring or feedback', async () => {
  const {service,admin}=setup();
  const session=await service.begin('clarity@example.com','clarity-ip');
  await assert.rejects(service.saveClarity(session.token,4),{status:409});
  const original=await service.submit(session.token,input(),[]);
  await service.saveFeedback(session.token,{feltTrue:'Keep this feedback'});
  for (const value of [0,6,2.5,'4',null]) await assert.rejects(service.saveClarity(session.token,value),{status:400});
  await service.saveClarity(session.token,4);
  const own=await service.participant(session.token);
  assert.equal(own.submission.postClarity.value,4);
  assert.deepEqual(own.submission.snapshot,original.snapshot);
  assert.equal(own.submission.feedback.answers.feltTrue,'Keep this feedback');
  assert.equal((await service.detail(own.id)).submission.postClarity.value,4);
  await service.saveClarity(session.token,5);
  await service.saveFeedback(session.token,{feltTrue:'Updated feedback'});
  assert.equal((await service.participant(session.token)).submission.postClarity.value,5);
  await service.revoke(own.id,admin);
  await assert.rejects(service.saveClarity(session.token,4),{status:401});
});
