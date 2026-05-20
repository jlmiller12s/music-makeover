(function () {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name') || '';
  const lane = params.get('lane') || 'Music Makeover';
  const email = params.get('email') === '1';

  document.addEventListener('DOMContentLoaded', () => {
    if (name) {
      document.getElementById('thank-you-heading').textContent = `Thank you, ${name}.`;
      document.getElementById('thank-you-copy').textContent = 'Your inquiry has been sent to Ashley and routed into the right service lane.';
    }
    document.getElementById('thank-you-lane').textContent = lane;
    document.getElementById('thank-you-email').textContent = email ? 'Requested' : 'Not requested';
  });
}());
