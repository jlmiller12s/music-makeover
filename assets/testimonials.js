(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireTestimonialForm);
  } else {
    wireTestimonialForm();
  }

  function wireTestimonialForm() {
    const form = document.getElementById('testimonial-form');
    if (!form) return;
    if (form.dataset.testimonialReady === 'true') return;
    form.dataset.testimonialReady = 'true';
    form.addEventListener('submit', submitTestimonial);
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

  function showStatus(element, type, message) {
    if (!element) return;
    element.className = `status-message ${type || ''}${message ? ' is-visible' : ''}`;
    element.textContent = message;
  }
}());
