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
    const quizzes = document.querySelectorAll('[data-matchmaker-quiz]');
    if (quizzes.length === 0) return;

    const resultMap = {
      confidence: {
        title: 'The Confidence Builder',
        step: 'Private Music Coaching or Vocal Boost Session',
        body: 'You or your singers may have the potential, but confidence, consistency, or foundational skill-building needs support. A Music Makeover here starts with strengthening the voice, the ear, the mindset, and the musical foundation.',
        cta: 'Book Private Coaching',
        href: 'booking.html?category=private'
      },
      sound: {
        title: 'The Sound Refiner',
        step: 'Choir & Ensemble Coaching',
        body: 'Your group has musical ability, but the sound may need more unity, blend, tone, articulation, musicianship, or performance polish. This makeover focuses on helping the ensemble sound more connected, confident, and prepared.',
        cta: 'Request Choir Coaching',
        href: 'booking.html?category=ensemble'
      },
      team: {
        title: 'The Team Reset',
        step: 'Worship Team Support',
        body: 'Your team may be serving faithfully, but the structure, rehearsal flow, vocal confidence, or team culture needs intentional support. This makeover helps worship teams strengthen both sound and systems.',
        cta: 'Request Worship Support',
        href: 'booking.html?category=worship'
      },
      program: {
        title: 'The Program Rebuilder',
        step: 'Music Makeover Intensive',
        body: 'You are not just dealing with one small issue. Your program may need clearer systems, stronger leadership support, better structure, curriculum direction, or a full growth plan. This makeover helps leaders identify what is working, what needs attention, and what comes next.',
        cta: 'Plan an Intensive',
        href: 'booking.html?category=school'
      },
      purpose: {
        title: 'The Purpose Clarifier',
        step: 'Consultation / Quick Fix Assessment',
        body: 'You know something needs to shift, but you may not be sure where to begin. This path helps clarify your goals, identify the current barriers, and choose the best next step without overcommitting too soon.',
        cta: 'Find My Next Step',
        href: 'booking.html?category=general'
      }
    };

    quizzes.forEach((quiz) => {
      const steps = Array.from(quiz.querySelectorAll('[data-quiz-step]'));
      const answers = {};

      const showStep = (index) => {
        steps.forEach((step) => {
          const stepAttr = step.dataset.quizStep;
          if (stepAttr === String(index)) {
            step.style.display = 'block';
            step.classList.add('active');
          } else {
            step.style.display = 'none';
            step.classList.remove('active');
          }
        });
      };

      // Wire up Take the Quiz button (on the left side)
      const startBtn = quiz.querySelector('[data-quiz-start-btn]');
      if (startBtn) {
        startBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // Clear selections
          optionButtons.forEach((opt) => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-pressed', 'false');
          });
          for (let k in answers) delete answers[k];
          showStep(1);

          // Smooth scroll to the options panel
          const target = quiz.querySelector('#matchmaker-options');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // Wire up option selection
      const optionButtons = quiz.querySelectorAll('.quiz-opt');
      optionButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const stepDiv = btn.closest('[data-quiz-step]');
          const stepNum = parseInt(stepDiv.dataset.quizStep, 10);
          const pointsType = btn.dataset.points;
          
          // Save answer
          answers[stepNum] = pointsType;

          // Highlight selected option
          const siblingOpts = stepDiv.querySelectorAll('.quiz-opt');
          siblingOpts.forEach((opt) => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('selected');
          btn.setAttribute('aria-pressed', 'true');

          // Auto-advance
          if (stepNum < 7) {
            setTimeout(() => {
              showStep(stepNum + 1);
            }, 220);
          } else {
            // Last question answered, calculate and show loading then result
            showStep('loading');
            setTimeout(() => {
              calculateAndShowResult();
            }, 800);
          }
        });
      });

      // Wire up Back buttons
      const prevButtons = quiz.querySelectorAll('[data-quiz-prev]');
      prevButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const stepDiv = btn.closest('[data-quiz-step]');
          const stepNum = parseInt(stepDiv.dataset.quizStep, 10);
          if (stepNum > 1) {
            showStep(stepNum - 1);
          }
        });
      });

      // Wire up Restart buttons
      const restartBtns = quiz.querySelectorAll('[data-quiz-restart]');
      restartBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          // Clear selections
          optionButtons.forEach((opt) => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-pressed', 'false');
          });
          for (let k in answers) delete answers[k];
          showStep(1);
        });
      });

      const calculateAndShowResult = () => {
        const tallies = { confidence: 0, sound: 0, team: 0, program: 0, purpose: 0 };
        for (let stepNum = 1; stepNum <= 7; stepNum++) {
          const ans = answers[stepNum];
          if (ans && tallies[ans] !== undefined) {
            tallies[ans]++;
          }
        }

        // Find highest score
        let winner = 'purpose';
        let maxScore = -1;
        const candidates = [];

        for (let cat in tallies) {
          if (tallies[cat] > maxScore) {
            maxScore = tallies[cat];
            winner = cat;
            candidates.length = 0; // clear tie candidates
            candidates.push(cat);
          } else if (tallies[cat] === maxScore) {
            candidates.push(cat);
          }
        }

        // Tie-breaker logic
        if (candidates.length > 1) {
          const q1Ans = answers[1]; // Q1 response
          if (q1Ans && candidates.includes(q1Ans)) {
            winner = q1Ans;
          } else {
            // Pick fallback order
            const fallbackOrder = ['purpose', 'confidence', 'sound', 'team', 'program'];
            for (let fb of fallbackOrder) {
              if (candidates.includes(fb)) {
                winner = fb;
                break;
              }
            }
          }
        }

        // Render result card
        const result = resultMap[winner] || resultMap.purpose;
        const resTitle = quiz.querySelector('[data-quiz-result-title]');
        const resSummary = quiz.querySelector('[data-quiz-result-summary]');
        const resStep = quiz.querySelector('[data-quiz-result-step]');
        const resCta = quiz.querySelector('[data-quiz-result-cta]');

        if (resTitle) resTitle.textContent = result.title;
        if (resSummary) resSummary.textContent = result.body;
        if (resStep) resStep.textContent = result.step;
        if (resCta) {
          resCta.textContent = result.cta;
          resCta.setAttribute('href', result.href);
        }

        showStep('result');
      };
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
