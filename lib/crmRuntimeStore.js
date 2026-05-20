const { createDefaultState } = require('./musicMakeoverCrm');

const STATE_KEY = '__musicMakeoverCrmState';
const AUTH_STATE_KEY = '__musicMakeoverAdminAuthState';

async function loadState() {
  if (!globalThis[STATE_KEY]) {
    globalThis[STATE_KEY] = createDefaultState();
  }
  return globalThis[STATE_KEY];
}

async function saveState(state) {
  globalThis[STATE_KEY] = state;
  return state;
}

async function loadAuthState() {
  if (!globalThis[AUTH_STATE_KEY]) {
    globalThis[AUTH_STATE_KEY] = {
      admins: [],
      sessions: [],
      passwordResets: [],
      emailOutbox: [],
    };
  }
  return globalThis[AUTH_STATE_KEY];
}

async function saveAuthState(authState) {
  globalThis[AUTH_STATE_KEY] = authState;
  return authState;
}

module.exports = {
  loadAuthState,
  loadState,
  saveAuthState,
  saveState,
};
