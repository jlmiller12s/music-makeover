(function () {
  const state = {
    crm: null,
    category: new URLSearchParams(window.location.search).get('category') || 'school',
  };

  const categoryCopy = {
    school: {
      label: 'Programs',
      title: 'Music Makeover Intensive Inquiry',
      summary: 'For schools, churches, organizations, music leaders, worship pastors, choir directors, and developing programs that need stronger systems and clear next steps.',
    },
    ensemble: {
      label: 'Choirs',
      title: 'Choir & Ensemble Coaching Inquiry',
      summary: 'For school choirs, church choirs, community choirs, small ensembles, vocal groups, clinics, blend, musicianship, and performance readiness.',
    },
    worship: {
      label: 'Worship',
      title: 'Worship Team Makeover Inquiry',
      summary: 'For churches, worship leaders, praise teams, vocal teams, volunteer musicians, rehearsal flow, team culture, and service preparation.',
    },
    private: {
      label: 'Private',
      title: 'Private Music Coaching Inquiry',
      summary: 'For students, singers, parents, adult clients, worship leaders, audition prep, beginner musicians, and private lessons.',
    },
    general: {
      label: 'General',
      title: 'General Consultation Form',
      summary: 'For people who are not sure which lane fits yet. Ashley will help route your request.',
    },
  };

  const selectOptions = {
    budgetRange: ['Optional', 'Up to $500', '$500 to $1,000', '$1,000 to $2,500', '$2,500 to $5,000', '$5,000 and above'],
    supportNeeded: ['Private Music Coaching', 'Worship Team Makeover', 'Choir & Ensemble Coaching', 'Music Makeover Intensive', 'Not sure yet'],
    audienceType: ['Child/student', 'Teen singer', 'Adult singer', 'Worship leader', 'Worship team', 'Choir', 'School program', 'Church music ministry', 'Organization'],
    coachingCadence: ['One-time support', 'Ongoing coaching', 'Not sure yet'],
    preferredFormat: ['In-person', 'Virtual', 'Either'],
    experienceLevel: ['Beginner', 'Intermediate', 'Advanced', 'Professional / leader'],
    preferredLessonType: ['Private Music Coaching - 30 minutes', 'Private Music Coaching - 45 minutes', 'Private Music Coaching - 60 minutes', 'Monthly 4-Pack - 45 minutes', 'Monthly 4-Pack - 60 minutes', 'Audition prep', 'Virtual coaching'],
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    wireHeaderMenu();
    wireLaneTabs();
    await loadCrm();
    renderLane();
    renderServices();
    document.getElementById('music-inquiry-form').addEventListener('submit', submitInquiry);
  }

  async function loadCrm() {
    try {
      const response = await fetch('/api/public-config');
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error || 'Unable to load CRM');
      state.crm = payload.state;
    } catch (error) {
      showMessage('error', 'The booking system could not load the service catalog. You can still email themusicmakeover@gmail.com directly.');
    }
  }

  function wireHeaderMenu() {
    const button = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');
    if (!button || !nav) return;
    if (button.dataset.navReady === 'true') return;
    button.dataset.navReady = 'true';
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      button.classList.toggle('active', !open);
      nav.classList.toggle('active', !open);
    });
  }

  function wireLaneTabs() {
    document.querySelectorAll('[data-lane]').forEach((button) => {
      button.addEventListener('click', () => {
        state.category = button.dataset.lane;
        renderLane();
        renderServices();
      });
    });
  }

  function renderLane() {
    document.querySelectorAll('[data-lane]').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset.lane === state.category));
    });

    const copy = categoryCopy[state.category] || categoryCopy.general;
    document.getElementById('lane-title').textContent = copy.title;
    document.getElementById('lane-summary').textContent = copy.summary;
    document.getElementById('category').value = state.category;

    const fields = ((state.crm && state.crm.formFields && state.crm.formFields[state.category]) || []).filter(Boolean);
    document.getElementById('dynamic-fields').innerHTML = fields.map(renderField).join('');
  }

  function renderField(field) {
    const [name, label, type] = field;
    const required = isRequired(name) ? ' required' : '';
    const autocomplete = name === 'email' ? ' autocomplete="email"' : '';

    if (type === 'textarea') {
      return `<div class="crm-field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}"${required}></textarea></div>`;
    }

    if (type === 'select') {
      const options = selectOptions[name] || ['Optional', 'Yes', 'No'];
      return `<div class="crm-field"><label for="${name}">${label}</label><select id="${name}" name="${name}"${required}>${options.map((option) => `<option>${option}</option>`).join('')}</select></div>`;
    }

    return `<div class="crm-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}"${required}${autocomplete}></div>`;
  }

  function isRequired(name) {
    const required = state.crm && state.crm.categories && state.crm.categories[state.category] && state.crm.categories[state.category].required;
    if (!required) return false;
    if (name === 'studentName') return required.includes('name');
    return required.includes(name);
  }

  function renderServices() {
    const services = ((state.crm && state.crm.services) || [])
      .filter((service) => service.category === state.category || (state.category === 'general' && ['school', 'worship', 'private'].includes(service.category)))
      .slice(0, 3);

    document.getElementById('service-strip').innerHTML = services.map((service) => `
      <article class="mini-service">
        <strong>${escapeHtml(service.name)}</strong>
        <span>${escapeHtml(service.priceLabel)}</span>
        <p>${escapeHtml(service.bookable ? 'Consultation or coaching can be booked after review.' : 'Request-first. Ashley approves scope and dates before booking.')}</p>
      </article>
    `).join('');
  }

  async function submitInquiry(event) {
    event.preventDefault();
    showMessage('', '');

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.attachments = Array.from(form.querySelector('[name="attachments"]').files || []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error || 'Inquiry was not submitted');
      const query = new URLSearchParams({
        name: payload.inquiry.name || 'there',
        lane: payload.inquiry.clientType || 'Music Makeover',
        email: payload.inquiry.confirmationEmailRequested ? '1' : '0',
      });
      window.location.href = `thank-you.html?${query.toString()}`;
    } catch (error) {
      showMessage('error', `${error.message}. If this keeps happening, email themusicmakeover@gmail.com and include your service lane and preferred timeline.`);
    } finally {
      button.disabled = false;
      button.textContent = 'Send inquiry';
    }
  }

  function showMessage(type, message) {
    const box = document.getElementById('booking-status');
    box.className = `status-message ${type || ''}${message ? ' is-visible' : ''}`;
    box.textContent = message;
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
