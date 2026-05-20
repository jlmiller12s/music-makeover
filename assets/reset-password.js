(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (!token) {
      showMessage('error', 'This password reset link is missing a token. Request a new reset link from the login screen.');
      document.getElementById('reset-password-form').hidden = true;
      return;
    }

    document.getElementById('reset-password-form').addEventListener('submit', submitReset);
  }

  async function submitReset(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = new FormData(form).get('password');
    const button = form.querySelector('button[type="submit"]');
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Resetting...';

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          token,
          password,
        }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Unable to reset password');
      showMessage('success', 'Password reset. You can now sign in with your new password.');
      form.hidden = true;
      window.setTimeout(() => {
        window.location.href = 'admin-login.html';
      }, 1200);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function showMessage(type, message) {
    const box = document.getElementById('reset-status');
    box.className = `status-message ${type || ''}${message ? ' is-visible' : ''}`;
    box.textContent = message;
  }
}());
