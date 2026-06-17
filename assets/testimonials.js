(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    wireTestimonialForms();
    loadAndRenderApprovedTestimonials();
  }

  function wireTestimonialForms() {
    const form = document.getElementById('testimonial-form');
    if (form && form.dataset.testimonialReady !== 'true') {
      form.dataset.testimonialReady = 'true';
      form.addEventListener('submit', submitTestimonial);
    }

    const guestForm = document.getElementById('guest-testimonial-form');
    if (guestForm && guestForm.dataset.testimonialReady !== 'true') {
      guestForm.dataset.testimonialReady = 'true';
      guestForm.addEventListener('submit', submitGuestTestimonial);
    }
  }

  async function submitTestimonial(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = document.getElementById('testimonial-status');
    const button = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    showStatus(status, '', '');
    button.disabled = true;
    button.textContent = 'Submitting...';

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || 'Your testimonial was not submitted');
      }

      form.reset();
      showStatus(
        status,
        'success',
        `Thank you, ${payload.testimonial.clientName}. Your testimonial was sent to The Music Makeover for review.`,
      );
    } catch (error) {
      showStatus(
        status,
        'error',
        `${error.message}. If this keeps happening, email themusicmakeover@gmail.com with your testimonial.`,
      );
    } finally {
      button.disabled = false;
      button.textContent = 'Submit Testimonial';
    }
  }

  async function submitGuestTestimonial(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = document.getElementById('guest-testimonial-status');
    const button = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    showStatus(status, '', '');
    button.disabled = true;
    button.textContent = 'Submitting...';

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      data.source = 'guest-testimonial-form';

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error || 'Your testimonial was not submitted');
      }

      form.reset();
      showStatus(
        status,
        'success',
        'Thank you. Your testimonial was sent to The Music Makeover for review.',
      );
    } catch (error) {
      showStatus(
        status,
        'error',
        `${error.message}. If this keeps happening, email themusicmakeover@gmail.com with your testimonial.`,
      );
    } finally {
      button.disabled = false;
      button.textContent = 'Submit as Guest';
    }
  }

  function showStatus(element, type, message) {
    if (!element) return;
    element.className = `status-message ${type || ''}${message ? ' is-visible' : ''}`;
    element.textContent = message;
  }

  async function loadAndRenderApprovedTestimonials() {
    const grid = document.getElementById('dynamic-testimonials-grid');
    if (!grid) return;

    try {
      const response = await fetch('/api/public-config');
      const payload = await response.json();
      if (!payload.ok || !payload.state || !Array.isArray(payload.state.testimonials)) return;

      const testimonials = payload.state.testimonials;
      if (testimonials.length === 0) return;

      const cardsHtml = testimonials.map((t) => {
        const formattedName = formatTestimonialName(t.clientName, t.nameDisplay);
        const avatarLetter = (formattedName[0] || 'W').toUpperCase();
        const quote = t.shortQuote || (t.responses && t.responses.considerationQuote) || '';
        
        return `
          <article class="testimonial-card">
            <blockquote>"${escapeHtml(quote)}"</blockquote>
            <div class="testimonial-author">
              <div class="author-avatar">${escapeHtml(avatarLetter)}</div>
              <div class="author-info">
                <div class="author-name">${escapeHtml(formattedName)}</div>
                <div class="author-role">${escapeHtml(t.serviceType || 'Other')}</div>
              </div>
            </div>
          </article>
        `;
      }).join('');

      grid.insertAdjacentHTML('beforeend', cardsHtml);
    } catch (error) {
      console.error('Failed to load dynamic testimonials:', error);
    }
  }

  function formatTestimonialName(clientName, nameDisplay) {
    if (!clientName) return 'Anonymous';
    const display = String(nameDisplay || '').toLowerCase();
    if (display === 'anonymous') return 'Anonymous';
    if (display === 'first name only') {
      return clientName.split(/\s+/)[0] || 'Anonymous';
    }
    if (display === 'initials only') {
      return clientName.split(/\s+/).map((p) => p[0]).filter(Boolean).join('.').toUpperCase();
    }
    return clientName;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]));
  }
}());

