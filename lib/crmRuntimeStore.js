const { createDefaultState, normalizeCrmState } = require('./musicMakeoverCrm');

const STATE_KEY = '__musicMakeoverCrmState';
const AUTH_STATE_KEY = '__musicMakeoverAdminAuthState';
const STORE_KEY = '__musicMakeoverRuntimeStore';
const POSTGRES_POOL_KEY = '__musicMakeoverPostgresPool';
const DEFAULT_TABLE_NAME = 'music_makeover_app_state';

async function loadState() {
  return getRuntimeStore().load('crm', createDefaultState, normalizeCrmState);
}

async function saveState(state) {
  return getRuntimeStore().save('crm', normalizeCrmState(state));
}

async function loadAuthState() {
  return getRuntimeStore().load('auth', createDefaultAuthState, normalizeAuthState);
}

async function saveAuthState(authState) {
  return getRuntimeStore().save('auth', normalizeAuthState(authState));
}

function getRuntimeStore() {
  if (!globalThis[STORE_KEY]) {
    const connectionString = getPostgresConnectionString(process.env);
    globalThis[STORE_KEY] = connectionString
      ? createPostgresJsonStateStore(getPostgresPool(connectionString), { tableName: DEFAULT_TABLE_NAME })
      : createMemoryJsonStateStore();
  }
  return globalThis[STORE_KEY];
}

function createMemoryJsonStateStore() {
  return {
    async load(key, defaultFactory, normalize = (value) => value) {
      const storageKey = key === 'auth' ? AUTH_STATE_KEY : STATE_KEY;
      if (!globalThis[storageKey]) {
        globalThis[storageKey] = defaultFactory();
      }
      return normalize(globalThis[storageKey]);
    },
    async save(key, value) {
      const storageKey = key === 'auth' ? AUTH_STATE_KEY : STATE_KEY;
      globalThis[storageKey] = value;
      return value;
    },
  };
}

function createPostgresJsonStateStore(pool, options = {}) {
  const tableName = sanitizeIdentifier(options.tableName || DEFAULT_TABLE_NAME);
  let initialized = false;

  async function ensureTable() {
    if (initialized) return;
    await pool.query(`
      create table if not exists ${tableName} (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    initialized = true;
  }

  return {
    async load(key, defaultFactory, normalize = (value) => value) {
      await ensureTable();
      const result = await pool.query(`select value from ${tableName} where key = $1`, [key]);
      const rowValue = result.rows[0] && result.rows[0].value;
      const value = rowValue === undefined ? defaultFactory() : parseJsonValue(rowValue);
      return normalize(value);
    },
    async save(key, value) {
      await ensureTable();
      await pool.query(`
        insert into ${tableName} (key, value, updated_at)
        values ($1, $2::jsonb, now())
        on conflict (key) do update
          set value = excluded.value,
              updated_at = now()
      `, [key, JSON.stringify(value)]);
      return value;
    },
  };
}

function getPostgresPool(connectionString) {
  if (!globalThis[POSTGRES_POOL_KEY]) {
    const { Pool } = require('pg');
    const poolOptions = { connectionString };
    if (requiresExplicitSsl(connectionString)) {
      poolOptions.ssl = { rejectUnauthorized: false };
    }
    globalThis[POSTGRES_POOL_KEY] = new Pool(poolOptions);
  }
  return globalThis[POSTGRES_POOL_KEY];
}

function getPostgresConnectionString(env = process.env) {
  return env.POSTGRES_URL
    || env.DATABASE_URL
    || env.POSTGRES_PRISMA_URL
    || env.POSTGRES_URL_NON_POOLING
    || env.SUPABASE_DB_URL
    || env.SUPABASE_POSTGRES_URL
    || env.STORAGE_POSTGRES_URL
    || '';
}

function requiresExplicitSsl(connectionString) {
  return !/localhost|127\.0\.0\.1/i.test(connectionString) && !/sslmode=/i.test(connectionString);
}

function sanitizeIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid database identifier: ${value}`);
  }
  return value;
}

function parseJsonValue(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function createDefaultAuthState() {
  return {
    admins: [],
    sessions: [],
    passwordResets: [],
    emailOutbox: [],
  };
}

function normalizeAuthState(authState = {}) {
  return {
    admins: Array.isArray(authState.admins) ? authState.admins : [],
    sessions: Array.isArray(authState.sessions) ? authState.sessions : [],
    passwordResets: Array.isArray(authState.passwordResets) ? authState.passwordResets : [],
    emailOutbox: Array.isArray(authState.emailOutbox) ? authState.emailOutbox : [],
  };
}

module.exports = {
  createPostgresJsonStateStore,
  getPostgresConnectionString,
  loadAuthState,
  loadState,
  saveAuthState,
  saveState,
};
