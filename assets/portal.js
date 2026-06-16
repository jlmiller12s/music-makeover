(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const response = await fetch('/api/portal-preview');
    const payload = await response.json();
    if (!payload.ok) return;
    const state = payload.state;
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client') || 'client_riverside';
    const client = state.clients.find((item) => item.id === clientId) || state.clients[0];
    renderPortal(state, client);
  }

  function renderPortal(state, client) {
    if (!client) {
      document.getElementById('portal-client-name').textContent = 'Guest Workspace';
      document.getElementById('portal-client-type').textContent = 'No Client Selected';
      document.getElementById('portal-client-email').textContent = 'Please select or add a client in the CRM';
      document.getElementById('portal-client-revenue').textContent = '$0';

      document.getElementById('portal-appointments').innerHTML = '<article class="portal-row"><span>No upcoming appointments.</span></article>';
      document.getElementById('portal-contracts').innerHTML = '<article class="portal-row"><span>No contracts found.</span></article>';
      document.getElementById('portal-invoices').innerHTML = '<article class="portal-row"><span>No invoices found.</span></article>';
      document.getElementById('portal-resources').innerHTML = '<article class="portal-row"><span>No shared resources.</span></article>';
      document.getElementById('portal-notes').innerHTML = '<article class="portal-row"><span>No shared notes.</span></article>';
      document.getElementById('portal-media').innerHTML = '<article class="portal-row"><span>No media release on file.</span></article>';
      return;
    }

    document.getElementById('portal-client-name').textContent = client.name;
    document.getElementById('portal-client-type').textContent = client.clientType;
    document.getElementById('portal-client-email').textContent = client.email;
    document.getElementById('portal-client-revenue').textContent = `$${client.totalRevenue.toLocaleString()}`;

    const appointments = state.appointments.filter((item) => item.clientId === client.id);
    const contracts = state.contracts.filter((item) => item.clientId === client.id);
    const invoices = state.invoices.filter((item) => item.clientId === client.id);
    const resources = state.resources.filter((item) => item.clientId === client.id);
    const notes = state.notes.filter((item) => item.clientId === client.id && item.visibility === 'shared');
    const media = state.mediaReleases.find((item) => item.clientId === client.id);

    renderRows('portal-appointments', appointments, (item) => row(item.type, formatDateTime(item.startAt), item.status));
    renderRows('portal-contracts', contracts, (item) => row(templateName(state, item.templateId), item.status, item.signedAt ? `Signed ${formatDate(item.signedAt)}` : 'Awaiting signature'));
    renderRows('portal-invoices', invoices, (item) => row(`Invoice ${item.id}`, `$${item.amount.toLocaleString()}`, item.status));
    renderRows('portal-resources', resources, (item) => row(item.name, item.type, item.shared ? 'Shared' : 'Internal'));
    renderRows('portal-notes', notes, (item) => row(item.title, item.body, formatDate(item.createdAt)));

    document.getElementById('portal-media').innerHTML = media ? `
      <article class="portal-row">
        <strong>${media.signed ? 'Media release signed' : 'Media release pending'}</strong>
        <span>${escapeHtml(media.restrictions || 'No restrictions listed')}</span>
      </article>
    ` : '<article class="portal-row"><span>No media release on file.</span></article>';
  }

  function row(title, meta, status) {
    return `<article class="portal-row"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(meta)}</span><span class="pill">${escapeHtml(status)}</span></article>`;
  }

  function renderRows(id, rows, renderRow) {
    document.getElementById(id).innerHTML = rows.map(renderRow).join('') || '<article class="portal-row"><span>Nothing has been shared here yet.</span></article>';
  }

  function templateName(state, templateId) {
    const template = [...state.contractTemplates, ...state.proposalTemplates].find((item) => item.id === templateId);
    return template ? template.name : templateId;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
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
