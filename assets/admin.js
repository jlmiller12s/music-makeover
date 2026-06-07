(function () {
  const app = {
    state: null,
    dashboard: null,
    activePanel: 'home',
    selectedService: null,
    selectedConsultationId: null,
  };

  const siteContentSections = [
    {
      key: 'home',
      title: 'Homepage',
      fields: [
        ['heroHeadline', 'Hero headline', 'textarea'],
        ['heroBody', 'Hero supporting copy', 'textarea'],
        ['primaryCtaLabel', 'Primary CTA label', 'text'],
        ['primaryCtaHref', 'Primary CTA link', 'text'],
        ['secondaryCtaLabel', 'Secondary CTA label', 'text'],
        ['secondaryCtaHref', 'Secondary CTA link', 'text'],
        ['servicesHeadline', 'Services section headline', 'textarea'],
        ['servicesBody', 'Services section copy', 'textarea'],
        ['finalCtaHeadline', 'Bottom CTA headline', 'textarea'],
        ['finalCtaBody', 'Bottom CTA copy', 'textarea'],
        ['finalCtaLabel', 'Bottom CTA label', 'text'],
        ['finalCtaHref', 'Bottom CTA link', 'text'],
      ],
    },
    {
      key: 'home',
      title: 'Ticker Banner',
      fields: [
        ['tickerText', 'Ticker text', 'text'],
      ],
    },
    {
      key: 'services',
      title: 'Services Page',
      fields: [
        ['heroEyebrow', 'Hero eyebrow', 'text'],
        ['heroHeadline', 'Hero headline', 'textarea'],
        ['heroBody', 'Hero supporting copy', 'textarea'],
        ['consultationEyebrow', 'Consultation eyebrow', 'text'],
        ['consultationHeadline', 'Consultation headline', 'text'],
        ['consultationBody', 'Consultation copy', 'textarea'],
        ['consultationBestFor', 'Best-for line', 'textarea'],
        ['consultationCtaLabel', 'Consultation CTA label', 'text'],
        ['consultationCtaHref', 'Consultation CTA link', 'text'],
        ['ctaHeadline', 'Bottom CTA headline', 'textarea'],
        ['ctaBody', 'Bottom CTA copy', 'textarea'],
        ['ctaLabel', 'Bottom CTA label', 'text'],
        ['ctaHref', 'Bottom CTA link', 'text'],
      ],
    },
    {
      key: 'about',
      title: 'About Page',
      fields: [
        ['heroEyebrow', 'Hero eyebrow', 'text'],
        ['heroHeadline', 'Hero headline', 'textarea'],
        ['heroBody', 'Hero supporting copy', 'textarea'],
        ['storyHeadline', 'Story headline', 'textarea'],
        ['storyParagraph1', 'Story paragraph 1', 'textarea'],
        ['storyParagraph2', 'Story paragraph 2', 'textarea'],
        ['storyParagraph3', 'Story paragraph 3', 'textarea'],
        ['pullQuote', 'Pull quote', 'textarea'],
        ['meetEyebrow', 'Meet section eyebrow', 'text'],
        ['meetHeadline', 'Meet section headline', 'textarea'],
        ['meetParagraph1', 'Meet paragraph 1', 'textarea'],
        ['meetParagraph2', 'Meet paragraph 2', 'textarea'],
        ['meetParagraph3', 'Meet paragraph 3', 'textarea'],
        ['ctaLabel', 'CTA label', 'text'],
        ['ctaHref', 'CTA link', 'text'],
      ],
    },
    {
      key: 'contact',
      title: 'Contact Page',
      fields: [
        ['heroEyebrow', 'Hero eyebrow', 'text'],
        ['heroHeadline', 'Hero headline', 'textarea'],
        ['heroBody', 'Hero supporting copy', 'textarea'],
        ['heroSupportBody', 'Second hero paragraph', 'textarea'],
        ['primaryCtaLabel', 'Primary CTA label', 'text'],
        ['primaryCtaHref', 'Primary CTA link', 'text'],
        ['responseNote', 'Response note', 'text'],
        ['email', 'Contact email', 'email'],
        ['emailNote', 'Email note', 'textarea'],
        ['location', 'Location', 'text'],
        ['locationNote', 'Location note', 'textarea'],
        ['socialIntro', 'Social intro', 'textarea'],
        ['instagramUrl', 'Instagram URL', 'text'],
        ['facebookUrl', 'Facebook URL', 'text'],
        ['tiktokUrl', 'TikTok URL', 'text'],
        ['linkedinUrl', 'LinkedIn URL', 'text'],
      ],
    },
    {
      key: 'testimonials',
      title: 'Testimonials Page',
      fields: [
        ['heroEyebrow', 'Hero eyebrow', 'text'],
        ['heroHeadline', 'Hero headline', 'text'],
        ['heroBody', 'Hero supporting copy', 'textarea'],
        ['formIntro', 'Form intro copy', 'textarea'],
        ['ctaHeadline', 'Bottom CTA headline', 'textarea'],
        ['ctaBody', 'Bottom CTA copy', 'textarea'],
        ['ctaLabel', 'Bottom CTA label', 'text'],
        ['ctaHref', 'Bottom CTA link', 'text'],
      ],
    },
    {
      key: 'booking',
      title: 'Booking Page',
      fields: [
        ['heroKicker', 'Hero kicker', 'text'],
        ['heroHeadline', 'Hero headline', 'textarea'],
        ['introLine1', 'Intro paragraph 1', 'textarea'],
        ['introLine2', 'Intro paragraph 2', 'textarea'],
        ['nextStepsHeading', 'Next steps heading', 'text'],
        ['nextSteps', 'Next steps list', 'textarea'],
        ['choosePathKicker', 'Choose path kicker', 'text'],
        ['choosePathHeadline', 'Choose path headline', 'textarea'],
        ['inquirySectionLabel', 'Inquiry section label', 'text'],
        ['inquirySectionHelper', 'Inquiry section helper', 'text'],
        ['privacyNote', 'Privacy/payment note', 'textarea'],
        ['submitLabel', 'Submit button label', 'text'],
        ['helpHeading', 'Help box heading', 'text'],
        ['helpBody', 'Help box body', 'textarea'],
      ],
    },
  ];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    if (!getAdminToken()) {
      window.location.href = 'admin-login.html';
      return;
    }
    wireNavigation();
    wireDialogs();
    try {
      await refresh();
    } catch (error) {
      clearAdminToken();
      window.location.href = 'admin-login.html';
    }
  }

  async function refresh() {
    const response = await fetch('/api/crm', {
      headers: authHeaders(),
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || 'Unable to load CRM');
    app.state = payload.state;
    app.dashboard = payload.dashboard;
    render();
  }

  function wireNavigation() {
    document.querySelectorAll('[data-panel-target]').forEach((button) => {
      button.addEventListener('click', () => {
        app.activePanel = button.dataset.panelTarget;
        renderPanels();
      });
    });
  }

  function wireDialogs() {
    document.getElementById('new-inquiry-button').addEventListener('click', () => {
      document.getElementById('inquiry-dialog').showModal();
    });

    document.getElementById('cancel-inquiry').addEventListener('click', () => {
      document.getElementById('inquiry-dialog').close();
    });

    document.getElementById('cancel-service').addEventListener('click', () => {
      document.getElementById('service-dialog').close();
    });

    document.getElementById('new-inquiry-form').addEventListener('submit', submitNewInquiry);
    document.getElementById('service-form').addEventListener('submit', submitServiceUpdate);
    document.getElementById('site-content-form').addEventListener('submit', submitSiteContent);
    document.getElementById('consultation-form').addEventListener('submit', submitConsultationNotes);
    document.getElementById('consult-files').addEventListener('change', updateFileSummary);
    document.getElementById('recommendation-consultation').addEventListener('change', (event) => {
      app.selectedConsultationId = event.currentTarget.value;
    });
    document.getElementById('generate-recommendation').addEventListener('click', generateRecommendation);
  }

  function render() {
    renderPanels();
    renderMetrics();
    renderPipeline();
    renderHomeSidebars();
    renderCalendar();
    renderServices();
    renderSiteContent();
    renderConsultations();
    renderRecommendations();
    renderFiles();
    renderFinance();
    renderContacts();
    renderReports();
    renderSettings();
  }

  function renderPanels() {
    document.querySelectorAll('[data-panel-target]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.panelTarget === app.activePanel);
    });
    document.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== app.activePanel;
    });
  }

  function renderMetrics() {
    const cards = app.dashboard.cards;
    const metrics = [
      ['New inquiries', cards.newInquiries],
      ['Consultations', cards.consultationsScheduled],
      ['Contracts pending', cards.contractsPending],
      ['Invoices unpaid', cards.invoicesUnpaid],
      ['Revenue this month', `$${cards.revenueThisMonth.toLocaleString()}`],
    ];
    document.getElementById('metric-grid').innerHTML = metrics.map(([label, value]) => `
      <article class="metric-card"><span>${label}</span><strong>${value}</strong></article>
    `).join('');
  }

  function renderPipeline() {
    const markup = app.dashboard.pipeline.map((column) => `
      <section class="kanban-column">
        <h3>${column.stage}<span class="pill">${column.count}</span></h3>
        ${column.leads.map(renderLeadCard).join('') || '<p class="muted">No leads here yet.</p>'}
      </section>
    `).join('');
    document.getElementById('pipeline-board').innerHTML = markup;
    document.getElementById('pipeline-board-home').innerHTML = markup;

    document.querySelectorAll('[data-stage-select]').forEach((select) => {
      select.addEventListener('change', async () => {
        await postAction({ action: 'lead:stage', inquiryId: select.dataset.stageSelect, stage: select.value });
      });
    });
  }

  function renderLeadCard(lead) {
    return `
      <article class="lead-card">
        <strong>${escapeHtml(lead.name)}</strong>
        <span>${escapeHtml(lead.clientType)}</span>
        <span>${escapeHtml(lead.organization || lead.supportNeeded || 'No organization listed')}</span>
        <select data-stage-select="${lead.id}" aria-label="Move ${escapeHtml(lead.name)} to stage">
          ${app.state.pipelineStages.map((stage) => `<option${stage === lead.stage ? ' selected' : ''}>${stage}</option>`).join('')}
        </select>
      </article>
    `;
  }

  function renderHomeSidebars() {
    renderRows('follow-up-list', app.dashboard.followUpsDue, (task) => `
      <article class="list-row"><strong>${escapeHtml(task.title)}</strong><span>Due ${formatDate(task.dueAt)} - ${task.priority}</span></article>
    `);
    renderRows('payment-list', app.dashboard.recentPayments, (payment) => `
      <article class="list-row"><strong>${escapeHtml(payment.clientName)}</strong><span>$${payment.amount.toLocaleString()} via ${escapeHtml(payment.provider)}</span></article>
    `);
  }

  function renderCalendar() {
    renderRows('calendar-list', app.dashboard.upcomingAppointments, (appointment) => `
      <article class="list-row"><strong>${escapeHtml(appointment.type)}</strong><span>${escapeHtml(appointment.clientName)} - ${formatDateTime(appointment.startAt)}</span></article>
    `);
  }

  function renderServices() {
    document.getElementById('service-list').innerHTML = app.state.services.map((service) => `
      <article class="service-row">
        <div>
          <strong>${escapeHtml(service.name)}</strong>
          <p>${escapeHtml(service.description)}</p>
          <span class="pill ${service.bookable ? 'teal' : 'gold'}">${service.bookable ? 'Bookable' : 'Inquiry-only'}</span>
          <span class="pill">${escapeHtml(service.duration)}</span>
          ${service.delivery ? `<span class="pill">${escapeHtml(service.delivery)}</span>` : ''}
        </div>
        <div>
          <strong>${escapeHtml(service.priceLabel)}</strong>
          <button class="mm-ghost-button" type="button" data-edit-service="${service.id}">Edit</button>
        </div>
      </article>
    `).join('');

    document.querySelectorAll('[data-edit-service]').forEach((button) => {
      button.addEventListener('click', () => openServiceDialog(button.dataset.editService));
    });
  }

  function renderSiteContent() {
    const content = app.state.siteContent || {};
    document.getElementById('site-content-fields').innerHTML = siteContentSections.map((section) => {
      const sectionContent = content[section.key] || {};
      return `
        <section class="cms-section">
          <div class="panel-header compact-header">
            <div>
              <h3>${escapeHtml(section.title)}</h3>
              <p>${section.fields.length} editable fields</p>
            </div>
          </div>
          <div class="crm-form-grid cms-field-grid">
            ${section.fields.map((field) => renderSiteContentField(section.key, sectionContent, field)).join('')}
          </div>
        </section>
      `;
    }).join('');
  }

  function renderSiteContentField(sectionKey, sectionContent, field) {
    const [fieldKey, label, type] = field;
    const value = sectionContent[fieldKey] || '';
    const common = `data-site-section="${escapeHtml(sectionKey)}" data-site-field="${escapeHtml(fieldKey)}"`;
    if (type === 'textarea') {
      return `
        <div class="crm-field cms-field wide-field">
          <label for="cms-${sectionKey}-${fieldKey}">${escapeHtml(label)}</label>
          <textarea id="cms-${sectionKey}-${fieldKey}" ${common}>${escapeHtml(value)}</textarea>
        </div>
      `;
    }

    return `
      <div class="crm-field cms-field">
        <label for="cms-${sectionKey}-${fieldKey}">${escapeHtml(label)}</label>
        <input id="cms-${sectionKey}-${fieldKey}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${common}>
      </div>
    `;
  }

  function renderConsultations() {
    renderRows('consultation-list', app.state.consultationNotes || [], (consultation) => `
      <article class="list-row consultation-row">
        <strong>${escapeHtml(consultation.clientName)}</strong>
        <span>${escapeHtml(labelForCategory(consultation.category))} - ${formatPlainDate(consultation.sessionDate)}</span>
        <p>${escapeHtml(shortText(consultation.notes, 130))}</p>
        <div class="row-actions">
          <span class="pill">${(consultation.attachments || []).length} uploads</span>
          <button class="mm-ghost-button" type="button" data-note-recommend="${consultation.id}">Recommend</button>
        </div>
      </article>
    `);

    document.querySelectorAll('[data-note-recommend]').forEach((button) => {
      button.addEventListener('click', async () => {
        app.selectedConsultationId = button.dataset.noteRecommend;
        app.activePanel = 'recommendations';
        await generateRecommendation();
      });
    });
  }

  function renderRecommendations() {
    const consultations = app.state.consultationNotes || [];
    const select = document.getElementById('recommendation-consultation');
    if (!app.selectedConsultationId && consultations[0]) app.selectedConsultationId = consultations[0].id;

    select.innerHTML = consultations.map((consultation) => `
      <option value="${consultation.id}"${consultation.id === app.selectedConsultationId ? ' selected' : ''}>
        ${escapeHtml(consultation.clientName)} - ${escapeHtml(labelForCategory(consultation.category))} - ${formatPlainDate(consultation.sessionDate)}
      </option>
    `).join('');

    document.getElementById('generate-recommendation').disabled = consultations.length === 0;

    const latest = (app.state.aiRecommendations || [])[0];
    document.getElementById('recommendation-latest').innerHTML = latest
      ? renderRecommendationResult(latest)
      : '<article class="empty-state"><strong>No recommendations yet.</strong><span>Save consultation notes, then generate a ranked service/package recommendation.</span></article>';

    renderRows('recommendation-history', app.state.aiRecommendations || [], (recommendation) => `
      <article class="list-row">
        <strong>${escapeHtml(recommendation.clientName)}</strong>
        <span>${formatDateTime(recommendation.generatedAt)} - ${recommendation.recommendations.length} service matches</span>
      </article>
    `);
  }

  function renderRecommendationResult(recommendation) {
    return `
      <section class="recommendation-result">
        <div class="recommendation-summary">
          <div>
            <p class="mm-kicker">Latest recommendation</p>
            <h3>${escapeHtml(recommendation.clientName)}</h3>
            <p>${escapeHtml(recommendation.summary)}</p>
          </div>
          <span class="pill teal">${escapeHtml(labelForCategory(recommendation.category))}</span>
        </div>
        <div class="recommendation-grid">
          ${recommendation.recommendations.map(renderRecommendationCard).join('')}
        </div>
      </section>
    `;
  }

  function renderRecommendationCard(item) {
    return `
      <article class="recommendation-card">
        <div class="recommendation-card-header">
          <span class="rank-badge">#${item.rank}</span>
          <span class="pill ${confidenceClass(item.confidence)}">${escapeHtml(item.confidence)} confidence</span>
        </div>
        <h4>${escapeHtml(item.serviceName)}</h4>
        <div class="recommendation-meta">
          <strong>${escapeHtml(item.priceLabel)}</strong>
          <span>${escapeHtml(item.duration)}</span>
          <span>${escapeHtml(item.delivery)}</span>
        </div>
        <ul>
          ${item.rationale.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
        </ul>
        <p class="next-step">${escapeHtml(item.suggestedNextStep)}</p>
      </article>
    `;
  }

  function renderFiles() {
    renderRows('file-list', app.state.resources, (resource) => `
      <tr>
        <td>${escapeHtml(resource.name)}</td>
        <td>${escapeHtml(resource.type)}</td>
        <td>${resource.shared ? '<span class="pill teal">Shared</span>' : '<span class="pill">Internal</span>'}</td>
        <td>${formatDate(resource.uploadedAt)}</td>
      </tr>
    `);
  }

  function renderFinance() {
    renderRows('invoice-list', app.state.invoices, (invoice) => `
      <tr>
        <td>${escapeHtml(invoice.clientName)}</td>
        <td>$${invoice.amount.toLocaleString()}</td>
        <td><span class="pill ${invoice.status === 'paid' ? 'teal' : 'rose'}">${escapeHtml(invoice.status)}</span></td>
        <td>${formatDate(invoice.dueAt)}</td>
      </tr>
    `);
  }

  function renderContacts() {
    renderRows('contact-list', app.state.clients, (client) => `
      <tr>
        <td>${escapeHtml(client.name)}</td>
        <td>${escapeHtml(client.clientType)}</td>
        <td>${escapeHtml(client.email)}</td>
        <td>$${client.totalRevenue.toLocaleString()}</td>
      </tr>
    `);
  }

  function renderReports() {
    const total = Math.max(...Object.values(app.dashboard.leadsByCategory), 1);
    document.getElementById('lead-chart').innerHTML = Object.entries(app.dashboard.leadsByCategory).map(([category, count]) => `
      <div class="chart-bar">
        <strong>${labelForCategory(category)}</strong>
        <div class="chart-track"><span style="width:${(count / total) * 100}%"></span></div>
        <span>${count}</span>
      </div>
    `).join('');
  }

  function renderSettings() {
    renderRows('integration-list', app.state.integrations, (integration) => `
      <article class="list-row"><strong>${escapeHtml(integration.name)}</strong><span>${escapeHtml(integration.status)}</span></article>
    `);
  }

  function renderRows(id, rows, renderRow) {
    document.getElementById(id).innerHTML = rows.map(renderRow).join('') || '<article class="list-row"><span>Nothing needs attention here.</span></article>';
  }

  function openServiceDialog(serviceId) {
    app.selectedService = app.state.services.find((service) => service.id === serviceId);
    if (!app.selectedService) return;
    document.getElementById('service-name').value = app.selectedService.name;
    document.getElementById('service-price').value = app.selectedService.priceLabel;
    document.getElementById('service-duration').value = app.selectedService.duration;
    document.getElementById('service-description').value = app.selectedService.description;
    document.getElementById('service-delivery').value = app.selectedService.delivery || '';
    document.getElementById('service-inclusions').value = (app.selectedService.inclusions || []).join('\n');
    document.getElementById('service-bookable').checked = Boolean(app.selectedService.bookable);
    document.getElementById('service-dialog').showModal();
  }

  async function submitServiceUpdate(event) {
    event.preventDefault();
    const patch = {
      name: document.getElementById('service-name').value,
      priceLabel: document.getElementById('service-price').value,
      duration: document.getElementById('service-duration').value,
      description: document.getElementById('service-description').value,
      delivery: document.getElementById('service-delivery').value,
      inclusions: document.getElementById('service-inclusions').value.split('\n').map((item) => item.trim()).filter(Boolean),
      bookable: document.getElementById('service-bookable').checked,
    };
    await postAction({ action: 'service:update', serviceId: app.selectedService.id, patch });
    document.getElementById('service-dialog').close();
  }

  async function submitSiteContent(event) {
    event.preventDefault();
    const patch = {};
    event.currentTarget.querySelectorAll('[data-site-section][data-site-field]').forEach((input) => {
      if (!patch[input.dataset.siteSection]) patch[input.dataset.siteSection] = {};
      patch[input.dataset.siteSection][input.dataset.siteField] = input.value;
    });

    const status = document.getElementById('site-content-status');
    status.textContent = 'Saving...';
    await postAction({ action: 'content:update', siteContent: patch });
    status.textContent = 'Saved';
  }

  async function submitNewInquiry(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.role = payload.role || 'To be confirmed';
    payload.location = payload.location || 'To be confirmed';
    payload.teamSize = payload.teamSize || '1';
    payload.currentChallenges = payload.currentChallenges || 'Needs review';
    payload.preferredTimeline = payload.preferredTimeline || 'To be confirmed';
    payload.musicGoals = payload.musicGoals || payload.supportNeeded;
    payload.experienceLevel = payload.experienceLevel || 'To be confirmed';
    payload.preferredLessonType = payload.preferredLessonType || 'To be confirmed';
    payload.preferredAvailability = payload.preferredAvailability || 'To be confirmed';
    await postAction({ action: 'inquiry:create', inquiry: payload });
    form.reset();
    document.getElementById('inquiry-dialog').close();
    app.activePanel = 'pipeline';
    renderPanels();
  }

  async function submitConsultationNotes(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.files = getSelectedFileMetadata(document.getElementById('consult-files'));
    const result = await postAction({ action: 'consultation:create', consultation: payload });
    form.reset();
    updateFileSummary();
    app.selectedConsultationId = result.result.id;
    app.activePanel = 'recommendations';
    render();
  }

  async function generateRecommendation() {
    const consultationId = app.selectedConsultationId || document.getElementById('recommendation-consultation').value;
    if (!consultationId) return;
    await postAction({ action: 'recommendation:generate', consultationId });
    app.selectedConsultationId = consultationId;
    app.activePanel = 'recommendations';
    render();
  }

  async function postAction(payload) {
    const response = await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'CRM update failed');
    app.state = result.state;
    app.dashboard = result.dashboard;
    render();
    return result;
  }

  function labelForCategory(category) {
    return {
      school: 'School',
      ensemble: 'Choir / Ensemble',
      worship: 'Worship',
      private: 'Private',
      general: 'General',
    }[category] || category;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  }

  function formatPlainDate(value) {
    if (!value) return 'No date';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    if (!year || !month || !day) return formatDate(value);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  function shortText(value, maxLength) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3).trim()}...`;
  }

  function confidenceClass(confidence) {
    return {
      High: 'teal',
      Medium: 'gold',
      Light: '',
    }[confidence] || '';
  }

  function getSelectedFileMetadata(input) {
    return Array.from(input.files || []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
  }

  function updateFileSummary() {
    const files = getSelectedFileMetadata(document.getElementById('consult-files'));
    document.getElementById('consult-file-summary').textContent = files.length
      ? `${files.length} file${files.length === 1 ? '' : 's'} selected`
      : 'No files selected';
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

  function getAdminToken() {
    return localStorage.getItem('musicMakeoverAdminToken') || sessionStorage.getItem('musicMakeoverAdminToken') || '';
  }

  function clearAdminToken() {
    localStorage.removeItem('musicMakeoverAdminToken');
    sessionStorage.removeItem('musicMakeoverAdminToken');
  }

  function authHeaders() {
    return { Authorization: `Bearer ${getAdminToken()}` };
  }
}());
