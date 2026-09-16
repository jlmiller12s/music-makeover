(function () {
  const root = document.getElementById('checkin-admin');
  const status = document.getElementById('checkin-admin-status');
  const esc = window.CheckinSnapshot.escape;
  let participants = [], filter = '', loading = false, canResetPreview = false;
  async function api(action, data = {}, query = '') {
    const token = localStorage.getItem('musicMakeoverAdminToken') || sessionStorage.getItem('musicMakeoverAdminToken');
    const response = await fetch(`/api/checkin${query || (action ? '' : '?admin=1')}`, { method: action ? 'POST' : 'GET', cache: 'no-store', headers: { Authorization: `Bearer ${token || ''}`, ...(action ? { 'Content-Type': 'application/json' } : {}) }, ...(action ? { body: JSON.stringify({ action, ...data }) } : {}) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to load check-ins.');
    return body;
  }
  function message(text) { status.textContent = text; }
  async function list() {
    if (loading) return; loading = true; message('Loading check-ins…');
    try {
      const result = await api(); participants = result.participants; canResetPreview = result.canResetPreview === true;
      root.innerHTML = `<div class="ci-admin-layout"><section class="ci-card"><h3>Approve participant emails</h3><p>Add up to 100 addresses, separated by commas or new lines. Approval lets them request their own sign-in code; this does not send an invitation.</p><form id="approve-emails"><label for="approved-emails">Email addresses</label><textarea id="approved-emails" rows="4" required maxlength="25500" placeholder="participant@example.com"></textarea><div class="ci-admin-toolbar"><button class="ci-button" type="submit">Approve access</button></div></form></section><section class="ci-card"><h3>Share the private check-in</h3><p>Send this link directly to approved participants. They must verify their approved email before entering.</p><p><a href="/check-in" target="_blank" rel="noopener">${esc(location.origin)}/check-in</a></p><button id="copy-checkin-link" type="button" class="ci-secondary">Copy participant link</button><p class="ci-small">${result.emailReady ? 'Email delivery is configured. Verify a real sign-in email before inviting the pilot.' : 'Email delivery is not configured. Add the Resend API key and verified sender in Vercel before inviting participants.'}</p></section></div><div class="ci-admin-toolbar"><label for="checkin-filter">Filter participants</label><select id="checkin-filter"><option value="">Everyone</option><option value="pending">Awaiting review</option><option value="reviewed">Reviewed</option><option value="not-submitted">Not submitted</option></select><button class="ci-secondary" id="refresh-checkins" type="button">Refresh</button></div><div id="participant-table" class="ci-admin-table"></div>`;
      root.querySelector('#checkin-filter').value = filter;
      root.querySelector('#checkin-filter').addEventListener('change', e => { filter = e.target.value; table(); });
      root.querySelector('#refresh-checkins').addEventListener('click', list);
      root.querySelector('#copy-checkin-link').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`${location.origin}/check-in`); message('Participant link copied.'); } catch { message('Copy the link shown above.'); } });
      root.querySelector('#approve-emails').addEventListener('submit', async e => {
        e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true;
        try { const result = await api('admin:allow', { emails: root.querySelector('#approved-emails').value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) }); await list(); message(`${result.count} email address(es) approved. You can now share the private link.`); }
        catch (e) { message(e.message); button.disabled = false; }
      });
      table(); message(`${participants.length} approved or previously approved participants · ${participants.filter(p => p.submittedAt).length} completed · ${participants.filter(p => p.reviewStatus === 'pending').length} awaiting review`);
    } catch (e) { message(e.message); }
    finally { loading = false; }
  }
  function table() {
    const visible = participants.filter(p => !filter || (filter === 'not-submitted' ? !p.submittedAt : p.reviewStatus === filter));
    root.querySelector('#participant-table').innerHTML = visible.length ? `<table><thead><tr><th>Participant</th><th>Access</th><th>Check-in</th><th>Review</th><th>Actions</th></tr></thead><tbody>${visible.map(p => `<tr><td>${esc(p.email)}</td><td>${p.active ? 'Approved' : 'Revoked'}</td><td>${p.submittedAt ? esc(new Date(p.submittedAt).toLocaleDateString()) : p.started ? 'In progress' : 'Not started'}</td><td>${p.reviewStatus === 'reviewed' ? 'Reviewed' : p.submittedAt ? 'Awaiting review' : '—'}${p.notification === 'failed' ? '<br>Email notification failed' : ''}</td><td>${p.submittedAt ? `<button class="ci-secondary" type="button" data-open="${esc(p.email)}">Review</button> ` : ''}<button class="text-button" type="button" data-access="${esc(p.email)}" data-active="${p.active}">${p.active ? 'Revoke access' : 'Restore access'}</button>${canResetPreview ? ` <button class="text-button" type="button" data-reset="${esc(p.email)}">Reset preview test</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p>No participants in this view yet.</p>';
    root.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(`Delete the saved preview answers, Snapshot, and notes for ${b.dataset.reset}? They will be able to start again after signing in. Production records are unaffected.`)) return;
      b.disabled = true;
      try { await api('admin:reset-preview', { email: b.dataset.reset }); await list(); message('Preview test reset. Sign in again to start a fresh assessment.'); }
      catch (e) { message(e.message); b.disabled = false; }
    }));
    root.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => detail(b.dataset.open)));
    root.querySelectorAll('[data-access]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { await api(b.dataset.active === 'true' ? 'admin:revoke' : 'admin:allow', { email: b.dataset.access, emails: [b.dataset.access] }); await list(); message('Access updated. Revoked participants are signed out immediately; existing submissions remain available to admins.'); }
      catch (e) { message(e.message); b.disabled = false; }
    }));
  }
  async function detail(address) {
    message('Loading participant…');
    try {
      const { participant } = await api(null, {}, `?admin=1&email=${encodeURIComponent(address)}`);
      const s = participant.submission;
      if (!s) { message('This participant has not submitted yet.'); return; }
      root.innerHTML = `<div class="ci-admin-toolbar"><button class="ci-secondary" type="button" id="back-to-checkins">← All participants</button><strong>${esc(address)}</strong></div><section class="ci-review"><h3>Private admin review</h3><p>These notes and pattern suggestions are visible only to admins. Review the Snapshot alongside the participant before interpreting possible patterns.</p><form id="review-checkin"><label for="checkin-review-status">Review status</label><select id="checkin-review-status"><option value="pending">Awaiting review</option><option value="reviewed">Reviewed with participant</option></select><label for="checkin-review-notes">Private notes</label><textarea id="checkin-review-notes" maxlength="10000">${esc(s.review.notes)}</textarea><div class="ci-admin-toolbar"><button class="ci-button" type="submit">Save review</button>${s.notification !== 'sent' ? '<button class="ci-secondary" id="retry-notification" type="button">Retry admin notification</button>' : ''}</div></form><details><summary>Patterns to consider · human review required</summary><p>${s.patterns.candidates.length ? s.patterns.candidates.map(esc).join(' · ') : 'No defined pattern detected. Do not force one.'}</p><p>Advocacy items (ability, skill, safety, recommendation): ${s.patterns.advocacyItems.join(', ')}. The skill/safety pattern requires your interpretation. No pattern is automatically shown to the participant.</p></details><details><summary>Original responses and scoring</summary><p>Baseline clarity: ${s.input.baseline}/5. Three-year outlook: ${s.input.outlook}/5 (separate).</p>${participant.questionnaire.domains.map((d, i) => `<h4>${esc(d.name)} · ${s.snapshot.domains[i].average.toFixed(2)} · ${esc(s.snapshot.domains[i].signal)}</h4><ol class="ci-answer-list" start="${i * 4 + 1}">${d.items.map(item => `<li>${esc(item.text)}<strong>${s.input.answers[item.id]} — ${esc(participant.questionnaire.labels[s.input.answers[item.id] - 1])}</strong></li>`).join('')}</ol>`).join('')}</details></section>${window.CheckinSnapshot.render(s.snapshot, s.submittedAt, s.review.status)}`;
      root.querySelector('#checkin-review-status').value = s.review.status;
      root.querySelector('#back-to-checkins').addEventListener('click', list);
      root.querySelector('#review-checkin').addEventListener('submit', async e => {
        e.preventDefault(); const b = e.target.querySelector('[type="submit"]'); b.disabled = true;
        try { await api('admin:review', { email: address, notes: root.querySelector('#checkin-review-notes').value, status: root.querySelector('#checkin-review-status').value }); message('Private review saved.'); }
        catch (e) { message(e.message); } finally { b.disabled = false; }
      });
      root.querySelector('#retry-notification')?.addEventListener('click', async e => {
        e.target.disabled = true;
        try { const result = await api('admin:notify', { email: address }); message(result.sent ? 'Admin notification sent.' : 'Notification failed. Check the email configuration.'); }
        catch (e) { message(e.message); } finally { e.target.disabled = false; }
      });
      message('Participant Snapshot and original responses loaded.');
    } catch (e) { message(e.message); }
  }
  document.querySelector('[data-panel-target="sustainability"]').addEventListener('click', list);
})();
