(function () {
  document.addEventListener('DOMContentLoaded', () => {
    wireNavigation();
    markCurrentNav();
    wireMatchmakerQuiz();
    wireGsapAnimations();
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

  function wireMatchmakerQuiz() {
    const quiz = document.querySelector('[data-matchmaker-quiz]');
    if (!quiz) return;

    const resultMap = {
      sound: {
        stage: 'Strengthening',
        meter: 'strengthening',
        title: 'The Sound Refiner',
        body: 'Your group has a foundation, but the sound needs more polish, unity, and intentional development. You may be noticing issues with tone, blend, articulation, dynamics, or overall confidence.',
        step: 'Choir & Ensemble Coaching',
        href: 'booking.html?category=ensemble',
        cta: 'Request Choir Coaching',
      },
      team: {
        stage: 'Developing',
        meter: 'developing',
        title: 'The Team Reset',
        body: 'Your team has heart, but may need clearer structure, stronger preparation, and more unified sound. This is common for volunteer-based worship teams carrying a lot with limited rehearsal time.',
        step: 'Worship Team Makeover',
        href: 'booking.html?category=worship',
        cta: 'Request Worship Support',
      },
      program: {
        stage: 'Unclear',
        meter: 'unclear',
        title: 'The Program Rebuilder',
        body: 'Your needs go beyond one workshop. You may need systems, leadership support, curriculum direction, rehearsal structure, and a customized growth plan.',
        step: 'Music Makeover Intensive',
        href: 'booking.html?category=school',
        cta: 'Plan an Intensive',
      },
      private: {
        stage: 'Flourishing',
        meter: 'flourishing',
        title: 'The Confidence Builder',
        body: 'You are ready for personal guidance that strengthens your voice, musicianship, confidence, and consistency with practical coaching you can keep using.',
        step: 'Private Coaching',
        href: 'booking.html?category=private',
        cta: 'Book Private Coaching',
      },
    };

    const buttons = Array.from(quiz.querySelectorAll('[data-matchmaker-option]'));
    const stage = quiz.querySelector('[data-result-stage]');
    const title = quiz.querySelector('[data-result-title]');
    const body = quiz.querySelector('[data-result-body]');
    const step = quiz.querySelector('[data-result-step]');
    const link = quiz.querySelector('[data-result-link]');
    const meterStages = Array.from(quiz.querySelectorAll('[data-meter-stage]'));

    const renderResult = (key) => {
      const result = resultMap[key] || resultMap.sound;
      if (stage) stage.textContent = result.stage;
      if (title) title.textContent = result.title;
      if (body) body.textContent = result.body;
      if (step) step.textContent = result.step;
      if (link) {
        link.textContent = result.cta;
        link.setAttribute('href', result.href);
      }
      buttons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.matchmakerOption === key));
      });
      meterStages.forEach((item) => {
        item.classList.toggle('is-active', item.dataset.meterStage === result.meter);
      });
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => renderResult(button.dataset.matchmakerOption));
    });
  }

  function wireGsapAnimations() {
    const reduceMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !window.gsap || typeof window.gsap.fromTo !== 'function') return;

    const revealGroup = (targets, options = {}) => {
      const elements = Array.from(targets).filter((element) => (
        element && element.nodeType === 1 && element.dataset.gsapAnimated !== 'true'
      ));
      if (!elements.length) return;

      // Set initial styles immediately to prevent flashing/glitchiness on scroll
      if (!options.immediate) {
        elements.forEach((element) => {
          element.style.opacity = '0';
          const yVal = options.y ?? 22;
          element.style.transform = `translate3d(0, ${yVal}px, 0)`;
        });
      }

      elements.forEach((element) => {
        element.dataset.gsapAnimated = 'true';
      });

      const play = () => {
        window.gsap.fromTo(elements, {
          opacity: 0,
          y: options.y ?? 22,
        }, {
          opacity: 1,
          y: 0,
          delay: options.delay ?? 0,
          duration: options.duration ?? 0.95,
          ease: 'power2.out',
          stagger: options.stagger ?? 0.08,
          clearProps: 'transform',
        });
      };

      if (options.immediate || !('IntersectionObserver' in window)) {
        play();
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          play();
          observer.disconnect();
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

      observer.observe(options.anchor || elements[0]);
    };

    revealGroup(document.querySelectorAll('[data-gsap="hero"] > *'), {
      delay: 0.12,
      duration: 0.95,
      immediate: true,
      stagger: 0.1,
      y: 18,
    });

    document.querySelectorAll('[data-gsap-section]').forEach((section) => {
      revealGroup([section], { anchor: section, stagger: 0, y: 26 });
    });

    document.querySelectorAll('[data-gsap-stagger]').forEach((group) => {
      revealGroup(group.children, { anchor: group, stagger: 0.08, y: 22 });
    });
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
