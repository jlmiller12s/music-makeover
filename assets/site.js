(function () {
  document.addEventListener('DOMContentLoaded', () => {
    wireNavigation();
    markCurrentNav();
    hydratePublicContent();
  });

  function wireNavigation() {
    document.querySelectorAll('.hamburger').forEach((button) => {
      if (button.dataset.navReady === 'true') return;
      const header = button.closest('.header');
      const nav = header && header.querySelector('.nav');
      if (!nav) return;

      button.dataset.navReady = 'true';
      button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        setMenuState(button, nav, !isOpen);
      });

      nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuState(button, nav, false));
      });
    });
  }

  function setMenuState(button, nav, isOpen) {
    button.setAttribute('aria-expanded', String(isOpen));
    button.classList.toggle('active', isOpen);
    nav.classList.toggle('active', isOpen);
  }

  function markCurrentNav() {
    const currentPath = normalizePath(window.location.pathname);
    document.querySelectorAll('.nav a').forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.href).pathname);
      const isCurrent = linkPath === currentPath || (currentPath === '/' && linkPath === '/index.html');
      if (isCurrent && !link.hash) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-current');
      }
    });
  }

  function normalizePath(path) {
    if (!path || path === '/') return '/index.html';
    return path.endsWith('/') ? `${path}index.html` : path;
  }

  async function hydratePublicContent() {
    if (!document.querySelector('[data-content], [data-content-href], [data-content-lines], [data-service-detail-grid], [data-service-pricing-table], [data-service-summary-price], [data-contact-email]')) {
      return;
    }

    try {
      const response = await fetch('/api/public-config');
      const payload = await response.json();
      if (!payload.ok || !payload.state) return;

      const siteContent = payload.state.siteContent || {};
      applyTextContent(siteContent);
      applyHrefContent(siteContent);
      applyLineContent(siteContent);
      applyContactEmail(siteContent);
      applyServiceCatalog(payload.state.services || []);
    } catch (error) {
      // Static HTML remains the fallback when public config is unavailable.
    }
  }

  function applyTextContent(siteContent) {
    document.querySelectorAll('[data-content]').forEach((element) => {
      const value = valueAtPath(siteContent, element.dataset.content);
      if (hasValue(value)) element.innerHTML = formatCmsText(value);
    });
  }

  function applyHrefContent(siteContent) {
    document.querySelectorAll('[data-content-href]').forEach((element) => {
      const value = valueAtPath(siteContent, element.dataset.contentHref);
      if (hasValue(value)) element.setAttribute('href', value);
    });
  }

  function applyLineContent(siteContent) {
    document.querySelectorAll('[data-content-lines]').forEach((element) => {
      const value = valueAtPath(siteContent, element.dataset.contentLines);
      const lines = splitLines(value);
      if (!lines.length) return;
      element.innerHTML = lines.map((line) => `<li>${formatCmsText(line)}</li>`).join('');
    });
  }

  function applyContactEmail(siteContent) {
    const email = valueAtPath(siteContent, 'contact.email');
    if (!hasValue(email)) return;

    document.querySelectorAll('[data-contact-email]').forEach((element) => {
      if (element === document.body) return;
      element.textContent = email;
      if (element.tagName === 'A') element.setAttribute('href', `mailto:${email}`);
    });
    document.documentElement.dataset.contactRecipient = email;
  }

  function applyServiceCatalog(services) {
    if (!Array.isArray(services) || !services.length) return;
    renderServiceDetailGrid(services);
    renderServicePricingTable(services);
    applyServiceSummaryPrices(services);
  }

  function renderServiceDetailGrid(services) {
    const grid = document.querySelector('[data-service-detail-grid]');
    if (!grid) return;

    grid.innerHTML = services.map((service) => `
      <article class="service-detail-card">
        <span>${escapeHtml(labelForCategory(service.category))}</span>
        <h2>${escapeHtml(service.name)}</h2>
        <p>${escapeHtml(service.description)}</p>
        ${service.delivery ? `<p>${escapeHtml(service.delivery)}</p>` : ''}
        <ul>
          <li>${escapeHtml(service.priceLabel)}</li>
          <li>${escapeHtml(service.duration)}</li>
          ${(service.inclusions || []).slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
        <a href="${escapeHtml(bookingHrefForCategory(service.category))}">${service.bookable ? 'Start Booking' : 'Request Details'}</a>
      </article>
    `).join('');
  }

  function renderServicePricingTable(services) {
    const table = document.querySelector('[data-service-pricing-table]');
    if (!table) return;

    table.innerHTML = `
      <div class="pricing-row pricing-head" role="row">
        <span role="columnheader">Service</span>
        <span role="columnheader">Investment</span>
        <span role="columnheader">Best for</span>
      </div>
      ${services.map((service) => `
        <div class="pricing-row" role="row">
          <span role="cell">${escapeHtml(service.name)}</span>
          <span role="cell">${escapeHtml(service.priceLabel)}</span>
          <span role="cell">${escapeHtml(service.delivery || labelForCategory(service.category))}</span>
        </div>
      `).join('')}
    `;
  }

  function applyServiceSummaryPrices(services) {
    const primaryServices = {
      private: 'svc_private_30',
      worship: 'svc_worship_makeover',
      ensemble: 'svc_ensemble_boost',
      school: 'svc_intensive',
    };

    document.querySelectorAll('[data-service-summary-price]').forEach((element) => {
      const serviceId = primaryServices[element.dataset.serviceSummaryPrice];
      const service = services.find((item) => item.id === serviceId);
      if (service && service.priceLabel) element.textContent = `Starting at ${service.priceLabel}`;
    });
  }

  function valueAtPath(source, path) {
    return String(path || '').split('.').reduce((value, key) => (
      value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined
    ), source);
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  function splitLines(value) {
    if (!hasValue(value)) return [];
    return String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function labelForCategory(category) {
    return {
      school: 'Leaders and Programs',
      ensemble: 'Choirs and Ensembles',
      worship: 'Churches and Worship Teams',
      private: 'Private Coaching',
      general: 'General Consultation',
    }[category] || 'Music Makeover Service';
  }

  function bookingHrefForCategory(category) {
    return `booking.html?category=${category || 'general'}`;
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

  function formatCmsText(value) {
    return escapeHtml(value)
      .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
      .replace(/&amp;nbsp;/gi, '&nbsp;');
  }
}());
