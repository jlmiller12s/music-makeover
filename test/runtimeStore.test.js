const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPostgresPoolOptions,
  createPostgresJsonStateStore,
  getPostgresConnectionString,
} = require('../lib/crmRuntimeStore');

test('resolves Supabase/Vercel Postgres connection string from environment', () => {
  assert.equal(getPostgresConnectionString({ POSTGRES_URL: 'postgres://primary' }), 'postgres://primary');
  assert.equal(getPostgresConnectionString({ DATABASE_URL: 'postgres://fallback' }), 'postgres://fallback');
  assert.equal(getPostgresConnectionString({}), '');
});

test('remote Postgres pool options allow hosted self-signed certificates', () => {
  assert.deepEqual(
    createPostgresPoolOptions('postgres://user:pass@example.supabase.co:5432/postgres?sslmode=require'),
    {
      connectionString: 'postgres://user:pass@example.supabase.co:5432/postgres?sslmode=require',
      ssl: { rejectUnauthorized: false },
    },
  );
  assert.deepEqual(createPostgresPoolOptions('postgres://localhost:5432/postgres'), {
    connectionString: 'postgres://localhost:5432/postgres',
  });
});

test('Postgres JSON state store initializes table and falls back to defaults when empty', async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (/select value/i.test(sql)) return { rows: [] };
      return { rows: [] };
    },
  };
  const store = createPostgresJsonStateStore(pool, { tableName: 'music_makeover_app_state' });

  const value = await store.load('crm', () => ({ version: 1 }), (state) => ({ ...state, normalized: true }));
  await store.save('crm', { version: 2 });

  assert.deepEqual(value, { version: 1, normalized: true });
  assert.match(calls[0].sql, /create table if not exists music_makeover_app_state/i);
  assert.match(calls[1].sql, /select value/i);
  assert.deepEqual(calls[1].params, ['crm']);
  assert.match(calls[2].sql, /insert into music_makeover_app_state/i);
  assert.deepEqual(calls[2].params, ['crm', '{"version":2}']);
});

test('Postgres JSON state store normalizes persisted rows', async () => {
  const pool = {
    async query(sql) {
      if (/select value/i.test(sql)) return { rows: [{ value: { version: 3 } }] };
      return { rows: [] };
    },
  };
  const store = createPostgresJsonStateStore(pool, { tableName: 'music_makeover_app_state' });

  const value = await store.load('crm', () => ({ version: 1 }), (state) => ({ ...state, normalized: true }));

  assert.deepEqual(value, { version: 3, normalized: true });
});
