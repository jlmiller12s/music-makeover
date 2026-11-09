const { randomBytes, createHash } = require('node:crypto');
const { getPostgresConnectionString, createPostgresPoolOptions } = require('./crmRuntimeStore');
const digest = value => createHash('sha256').update(value).digest('hex');
let pool, ready;
function settings(env) {
  for (const key of ['ROOTED_RESEND_API_KEY', 'ROOTED_SEGMENT_ID', 'ROOTED_SITE_URL']) {
    if (!env[key]) throw new Error('Newsletter configuration missing');
  }
  const url = new URL(env.ROOTED_SITE_URL);
  if (url.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && url.hostname === 'localhost')) throw new Error('Invalid newsletter origin');
  return { origin: url.origin, from: 'Ashley Miller <ashley@rootedwomencollective.com>' };
}
async function database() {
  if (!pool) {
    const connection = getPostgresConnectionString();
    if (!connection) throw new Error('Newsletter storage unavailable');
    pool = new (require('pg').Pool)({ ...createPostgresPoolOptions(connection), max: 3, connectionTimeoutMillis: 10000 });
  }
  if (!ready) ready = pool.query(`CREATE SCHEMA IF NOT EXISTS rooted_letter;
    REVOKE ALL ON SCHEMA rooted_letter FROM PUBLIC;
    CREATE TABLE IF NOT EXISTS rooted_letter.signups (
      token_hash text PRIMARY KEY, email text NOT NULL, first_name text NOT NULL,
      consent_version text NOT NULL DEFAULT 'rooted-letter-v1', created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours', confirmed_at timestamptz);
    CREATE TABLE IF NOT EXISTS rooted_letter.limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
    REVOKE ALL ON ALL TABLES IN SCHEMA rooted_letter FROM PUBLIC;`).catch(e => { ready = undefined; throw e; });
  await ready;
  return pool;
}
async function rateLimit(db, key, maximum, hours = 1) {
  const result = await db.query(`INSERT INTO rooted_letter.limits (key,count,expires_at) VALUES ($1,1,now()+($2 * interval '1 hour'))
    ON CONFLICT (key) DO UPDATE SET count=CASE WHEN rooted_letter.limits.expires_at<now() THEN 1 ELSE rooted_letter.limits.count+1 END,
    expires_at=CASE WHEN rooted_letter.limits.expires_at<now() THEN now()+($2 * interval '1 hour') ELSE rooted_letter.limits.expires_at END RETURNING count`, [digest(key), hours]);
  if (result.rows[0].count > maximum) throw Object.assign(new Error('Please wait before trying again.'), { status: 429 });
}
async function resend(env, route, method, body, fetcher = fetch, idempotency) {
  const response = await fetcher('https://api.resend.com' + route, {
    method, signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${env.ROOTED_RESEND_API_KEY}`, 'Content-Type': 'application/json', ...(idempotency ? {'Idempotency-Key': idempotency} : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 404 && method === 'GET') return null;
  if (!response.ok) throw new Error('Newsletter provider unavailable');
  return response.json();
}
async function subscribe(body, ip, env = process.env, deps = {}) {
  const config = settings(env);
  if (body.website) return;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !firstName || firstName.length > 80 || /[\r\n]/.test(firstName) || body.consent !== true) {
    throw Object.assign(new Error('Enter your name, a valid email, and check the consent box.'), { status: 400 });
  }
  const db = deps.db || await database();
  await rateLimit(db, 'ip:' + ip, 10);
  await rateLimit(db, 'email:' + email, 3);
  await rateLimit(db, 'daily-budget:' + new Date().toISOString().slice(0,10), 80, 24);
  await db.query("DELETE FROM rooted_letter.signups WHERE expires_at < now() AND confirmed_at IS NULL");
  await db.query("DELETE FROM rooted_letter.limits WHERE expires_at < now()-interval '1 day'");
  const token = randomBytes(32).toString('hex');
  await db.query('INSERT INTO rooted_letter.signups (token_hash,email,first_name) VALUES ($1,$2,$3)', [digest(token), email, firstName]);
  await resend(env, '/emails', 'POST', {
    from: config.from, to: [email], reply_to: 'ashley@rootedwomencollective.com', subject: 'Confirm your subscription to The Rooted Letter',
    text: `Hi ${firstName},\n\nPlease confirm that you want to receive The Rooted Letter from Ashley Miller:\n\n${config.origin}/rooted-letter-confirm#${token}\n\nThis link expires in 24 hours. After confirming, you will receive reflections, encouragement, and updates from Ashley. You can unsubscribe using the link in any newsletter.\n\nIf you did not request this, ignore this email and you will not be subscribed.\n\nWith love,\nAshley`,
  }, deps.fetch, 'rooted-confirm-' + digest(token));
}
async function confirm(token, env = process.env, deps = {}) {
  settings(env);
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw Object.assign(new Error('This link is invalid. Please sign up again.'), {status:400});
  const db = deps.db || await database();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const row = (await client.query('SELECT * FROM rooted_letter.signups WHERE token_hash=$1 FOR UPDATE', [digest(token)])).rows[0];
    if (!row) throw Object.assign(new Error('This link has expired. Please sign up again.'), {status:400});
    if (!row.confirmed_at) {
      if (new Date(row.expires_at).getTime() < Date.now()) throw Object.assign(new Error('This link has expired. Please sign up again.'), {status:400});
      const route = '/contacts/' + encodeURIComponent(row.email);
      const existing = await resend(env, route, 'GET', null, deps.fetch);
      // Do not undo a global unsubscribe from another newsletter in this account.
      if (existing?.unsubscribed) throw Object.assign(new Error('This address previously unsubscribed. Email ashley@rootedwomencollective.com for help rejoining.'), {status:409});
      if (!existing) {
        await resend(env, '/contacts', 'POST', {email:row.email, first_name:row.first_name, unsubscribed:false, segments:[{id:env.ROOTED_SEGMENT_ID}]}, deps.fetch);
      } else {
        await resend(env, route + '/segments/' + encodeURIComponent(env.ROOTED_SEGMENT_ID), 'POST', {}, deps.fetch);
      }
      await client.query('UPDATE rooted_letter.signups SET confirmed_at=now() WHERE token_hash=$1', [digest(token)]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { subscribe, confirm, settings };
