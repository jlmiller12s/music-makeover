// Set only to the approved Stripe Payment Link for the $17.00 product.
// Payment verification and purchase emails are handled by the server webhook.
const PEACE_PROMISE_CHECKOUT_URL = 'https://buy.stripe.com/eVq5kC4Nncdh2gs0JY3Je06';
document.querySelector('[data-peace-buy]')?.addEventListener('click', () => {
  const status = document.getElementById('peace-checkout-status');
  let checkout;
  try { checkout = new URL(PEACE_PROMISE_CHECKOUT_URL); } catch { /* Pending setup. */ }
  if (!checkout || checkout.protocol !== 'https:' || checkout.hostname !== 'buy.stripe.com' || checkout.username || checkout.password) {
    status.textContent = 'Checkout is not connected yet. This preview cannot accept payments.';
    return;
  }
  window.location.assign(checkout.href);
});
