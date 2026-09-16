const { getPostgresConnectionString, createPostgresPoolOptions } = require('./crmRuntimeStore');
let store;
function getCheckinStore() {
  if (store) return store;
  const connectionString = getPostgresConnectionString();
  if (!connectionString) throw Object.assign(new Error('The check-in is not available yet. Please try again later.'), { status: 503 });
  const { Pool } = require('pg');
  store = createCheckinStore(new Pool({ ...createPostgresPoolOptions(connectionString), max: 3, connectionTimeoutMillis: 10000 }), { schema: process.env.VERCEL_ENV === 'preview' ? 'music_checkin_preview' : 'music_checkin' });
  return store;
}
function createCheckinStore(pool, options = {}) {
  const schema = options.schema || 'music_checkin';
  if (!/^music_checkin(?:_preview|_test)?$/.test(schema)) throw new Error('Invalid check-in schema');
  let ready;
  async function initialize() {
    if (!ready) ready = pool.query(`
      CREATE SCHEMA IF NOT EXISTS ${schema};
      REVOKE ALL ON SCHEMA ${schema} FROM PUBLIC;
      CREATE TABLE IF NOT EXISTS ${schema}.records (
        key text PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      REVOKE ALL ON ${schema}.records FROM PUBLIC;
    `).catch(e => { ready = undefined; throw e; });
    await ready;
  }
  return {
    async get(key) {
      await initialize();
      return (await pool.query(`SELECT value FROM ${schema}.records WHERE key=$1`, [key])).rows[0]?.value || null;
    },
    async listAccounts() {
      await initialize();
      return (await pool.query(`SELECT value FROM ${schema}.records WHERE key LIKE 'account:%' ORDER BY updated_at DESC LIMIT 1000`)).rows.map(r => r.value);
    },
    async mutate(key, change) {
      await initialize();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO ${schema}.records (key,value) VALUES ($1,'{}') ON CONFLICT DO NOTHING`, [key]);
        const current = (await client.query(`SELECT value FROM ${schema}.records WHERE key=$1 FOR UPDATE`, [key])).rows[0].value;
        const result = await change(current);
        await client.query(`UPDATE ${schema}.records SET value=$2::jsonb,updated_at=now() WHERE key=$1`, [key, JSON.stringify(current)]);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
    async cleanup() {
      await initialize();
      await pool.query(`DELETE FROM ${schema}.records WHERE key LIKE 'rate:%' AND updated_at < now() - interval '1 day'`);
    },
    async close() { await pool.end(); },
  };
}
module.exports = { getCheckinStore, createCheckinStore };
