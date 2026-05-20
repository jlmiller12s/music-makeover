(function () {
  const storageKey = 'musicMakeoverAdminToken';
  const params = new URLSearchParams(window.location.search);
  let mode = params.get('mode') === 'create' ? 'create' : 'login';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.authMode));
    });

    document.getElementById('admin-login-form').addEventListener('submit', submitLogin);
    document.getElementById('admin-create-form').addEventListener('submit', submitCreate);
    document.getElementById('forgot-password-button').addEventListener('click', requestReset);
    setMode(mode);
  }

  function setMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset.authMode === mode));
    });
    document.getElementById('admin-login-form').hidden = mode !== 'login';
    document.getElementById('admin-create-form').hidden = mode !== 'create';
    showMessage('', '');
  }

  async function submitLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    await authenticate({
      action: 'login',
      email: payload.email,
      password: payload.password,
    }, document.getElementById('remember-admin').checked);
  }

  async function submitCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    await authenticate({
      action: 'create-admin',
      name: payload.name,
      email: payload.email,
      password: payload.password,
      setupCode: payload.setupCode,
    }, true);
  }

  async function authenticate(payload, remember) {
    showMessage('', '');
    const button = document.querySelector(`#admin-${payload.action === 'login' ? 'login' : 'create'}-form button[type="submit"]`);
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = payload.action === 'login' ? 'Logging in...' : 'Creating...';

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Admin authentication failed');
      saveToken(result.token, remember);
      showMessage('success', 'Success. Opening the admin dashboard...');
      window.setTimeout(() => {
        window.location.href = 'admin.html';
      }, 450);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  async function requestReset() {
    showMessage('', '');
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
      showMessage('error', 'Enter your admin email address first, then request a password reset.');
      document.getElementById('login-email').focus();
      return;
    }

    const button = document.getElementById('forgot-password-button');
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-password-reset',
          email,
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Unable to request password reset');
      showMessage('success', result.message);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function saveToken(token, remember) {
    sessionStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey);
    (remember ? localStorage : sessionStorage).setItem(storageKey, token);
  }

  function showMessage(type, message) {
    const box = document.getElementById('auth-status');
    box.className = `status-message ${type || ''}${message ? ' is-visible' : ''}`;
    box.textContent = message;
  }
}());
