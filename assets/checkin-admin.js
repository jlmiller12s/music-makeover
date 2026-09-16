(function () {
  const root = document.getElementById('checkin-admin');
  const status = document.getElementById('checkin-admin-status');
  const esc = window.CheckinSnapshot.escape;
  const selected = new Set();
  let deleting = false;
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
    if (loading || deleting) return; loading = true; message('Loading check-ins…');
    try {
      const result = await api(); participants = result.participants; canResetPreview = result.canResetPreview === true; selected.clear();
      root.innerHTML = `<div class="ci-admin-layout"><section class="ci-card"><h3>Participant assessments</h3><p>Anyone with the link can enter an email and begin. No approval or sign-in code is required.</p><p>Emails are self-reported, not verified. Each new start creates a separate assessment; entering the same email never reveals previous responses.</p></section><section class="ci-card"><h3>Share the check-in</h3><p>Share this link with participants. They only need to enter their email to begin.</p><p><a href="/check-in" target="_blank" rel="noopener">${esc(location.origin)}/check-in</a></p><button id="copy-checkin-link" type="button" class="ci-secondary">Copy participant link</button><p class="ci-small">${result.emailReady ? 'Admin notification emails are configured.' : 'Admin notification emails are not configured. Participants can still complete the assessment.'}</p></section></div><div class="ci-admin-toolbar"><label for="checkin-filter">Filter participants</label><select id="checkin-filter"><option value="">Everyone</option><option value="pending">Awaiting review</option><option value="reviewed">Reviewed</option><option value="not-submitted">Not submitted</option></select><button class="ci-secondary" id="refresh-checkins" type="button">Refresh</button></div><div class="ci-admin-toolbar"><span id="selection-count" aria-live="polite">0 selected</span><button id="delete-participants" class="ci-secondary" type="button" disabled>Delete selected</button></div><div id="participant-table" class="ci-admin-table"></div>`;
      root.querySelector('#checkin-filter').value = filter;
      root.querySelector('#checkin-filter').addEventListener('change', e => { filter = e.target.value; selected.clear(); table(); });
      root.querySelector('#refresh-checkins').addEventListener('click', list);
      root.querySelector('#copy-checkin-link').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`${location.origin}/check-in`); message('Participant link copied.'); } catch { message('Copy the link shown above.'); } });
      root.querySelector('#delete-participants').addEventListener('click', deleteSelected);
      table(); message(`${participants.length} participant assessments · ${participants.filter(p => p.submittedAt).length} completed · ${participants.filter(p => p.reviewStatus === 'pending').length} awaiting review`);
    } catch (e) { message(e.message); }
    finally { loading = false; }
  }
  function table() {
    const visible = participants.filter(p => !filter || (filter === 'not-submitted' ? !p.submittedAt : p.reviewStatus === filter));
    root.querySelector('#participant-table').innerHTML = visible.length ? `<table><thead><tr><th><input type="checkbox" id="select-visible-participants" aria-label="Select all participants in the current filter"></th><th>Participant</th><th>Access</th><th>Check-in</th><th>Review</th><th>Actions</th></tr></thead><tbody>${visible.map(p => `<tr><td><input type="checkbox" data-select="${esc(p.id)}" aria-label="Select ${esc(p.email)}" ${selected.has(p.id) ? 'checked' : ''}></td><td>${esc(p.email)}</td><td>${p.active ? 'Active' : 'Revoked'}</td><td>${p.submittedAt ? esc(new Date(p.submittedAt).toLocaleDateString()) : p.started ? 'In progress' : 'Not started'}</td><td>${p.reviewStatus === 'reviewed' ? 'Reviewed' : p.submittedAt ? 'Awaiting review' : '—'}${p.notification === 'failed' ? '<br>Email notification failed' : ''}</td><td>${p.submittedAt ? `<button class="ci-secondary" type="button" data-results="${esc(p.id)}">View Results</button> <button class="ci-secondary" type="button" data-open="${esc(p.id)}">Review</button> ` : ''}<button class="text-button" type="button" data-access="${esc(p.id)}" data-active="${p.active}" ${p.active ? '' : 'disabled'}>${p.active ? 'Revoke session' : 'Session revoked'}</button>${canResetPreview ? ` <button class="text-button" type="button" data-reset="${esc(p.id)}">Reset preview test</button>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p>No participants in this view yet.</p>';
    root.querySelectorAll('[data-select]').forEach(box => box.addEventListener('change', () => {
      if (box.checked) selected.add(box.dataset.select); else selected.delete(box.dataset.select);
      selectionState();
    }));
    root.querySelector('#select-visible-participants')?.addEventListener('change', e => {
      root.querySelectorAll('[data-select]').forEach(box => {
        box.checked = e.target.checked;
        if (box.checked) selected.add(box.dataset.select); else selected.delete(box.dataset.select);
      });
      selectionState();
    });
    selectionState();
    root.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(`Delete the saved preview answers, Snapshot, and notes for ${esc(participants.find(p => p.id === b.dataset.reset)?.email || 'this participant')}? They will be able to start again after signing in. Production records are unaffected.`)) return;
      b.disabled = true;
      try { await api('admin:reset-preview', { email: b.dataset.reset }); await list(); message('Preview test reset. Enter your email to start a fresh assessment.'); }
      catch (e) { message(e.message); b.disabled = false; }
    }));
    root.querySelectorAll('[data-results]').forEach(b => b.addEventListener('click', () => detail(b.dataset.results, true)));
    root.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => detail(b.dataset.open)));
    root.querySelectorAll('[data-access]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try { await api('admin:revoke', { email: b.dataset.access }); await list(); message('Access updated. Revoked participants are signed out immediately; existing submissions remain available to admins.'); }
      catch (e) { message(e.message); b.disabled = false; }
    }));
  }
  function selectionState() {
    const boxes = [...root.querySelectorAll('[data-select]')];
    const all = root.querySelector('#select-visible-participants');
    if (all) {
      all.checked = boxes.length > 0 && boxes.every(box => box.checked);
      all.indeterminate = boxes.some(box => box.checked) && !all.checked;
    }
    root.querySelector('#selection-count').textContent = `${selected.size} selected`;
    const button = root.querySelector('#delete-participants');
    button.disabled = selected.size === 0 || deleting;
    button.textContent = selected.size ? `Delete selected (${selected.size})` : 'Delete selected';
  }
  async function deleteSelected() {
    if (deleting || !selected.size) return;
    const emails = [...selected];
    if (!confirm(`Permanently delete ${emails.length} selected participant(s)?\n\n${emails.map(id => participants.find(p => p.id === id)?.email || id).join('\n')}\n\nThis removes their assessment sessions, saved answers, Snapshots, and private review notes. Their current sessions will end. They can start a new assessment using the shared link. This cannot be undone.`)) return;
    deleting = true;
    root.querySelectorAll('button, input, select, textarea').forEach(control => control.disabled = true);
    try {
      const result = await api('admin:delete', { emails });
      selected.clear(); deleting = false;
      await list(); message(`${result.count} participant(s) deleted, including saved responses and results.`);
    } catch (e) {
      deleting = false;
      root.querySelectorAll('button, input, select, textarea').forEach(control => control.disabled = false);
      selectionState(); message(e.message);
    }
  }
  function quickResults(participant) {
    const s = participant.submission, snap = s.snapshot;
    const summary = window.CheckinAdminSummary.summarize(snap);
    const names = domains => domains.length ? domains.map(d => esc(d.name)).join(' · ') : 'None identified by these scores.';
    return `<section class="ci-quick-results" aria-labelledby="quick-results-title"><h2 id="quick-results-title" tabindex="-1">Results at a glance</h2><p><strong>${esc(participant.email)}</strong> · ${esc(new Date(s.submittedAt).toLocaleDateString())}</p><p><strong>Areas to explore:</strong> ${names(summary.pressure)}</p><p><strong>Supporting areas:</strong> ${names(summary.supporting)}</p><div class="ci-notice"><h3>Possible support needs</h3><p>${esc(summary.feedback)}</p><small>Based on response patterns, for Ashley to discuss and confirm with the participant. These are conversation prompts, not a diagnosis or an evaluation.</small></div><div class="ci-admin-table"><table><caption>Eight domain averages · 1–5 scale · no overall score</caption><thead><tr><th scope="col">Area</th><th scope="col">Average</th><th scope="col">Result</th></tr></thead><tbody>${[...snap.domains].sort((a,b) => a.average-b.average).map(d => `<tr><th scope="row">${esc(d.name)}</th><td>${d.average.toFixed(2)} / 5</td><td>${esc(d.signal)}</td></tr>`).join('')}</tbody></table></div><p><strong>Three-year outlook:</strong> ${esc(snap.outlook.label)} (${snap.outlook.value}/5; separate from domain scores).</p><p><strong>Starting clarity:</strong> ${s.input.baseline}/5.</p>${snap.heaviest || snap.hope ? `<details><summary>Participant’s own words</summary>${snap.heaviest ? `<p><strong>What feels heaviest:</strong></p><p class="ci-quick-reflection">${esc(snap.heaviest)}</p>` : ''}${snap.hope ? `<p><strong>What they hope changes:</strong></p><p class="ci-quick-reflection">${esc(snap.hope)}</p>` : ''}</details>` : ''}</section>`;
  }
  async function detail(address, showResults = false) {
    message('Loading participant…');
    try {
      const { participant } = await api(null, {}, `?admin=1&email=${encodeURIComponent(address)}`);
      const s = participant.submission;
      if (!s) { message('This participant has not submitted yet.'); return; }
      root.innerHTML = `<div class="ci-admin-toolbar"><button class="ci-secondary" type="button" id="back-to-checkins">← All participants</button><strong>${esc(participant.email)}</strong></div>${quickResults(participant)}<section class="ci-feedback-review"><h3>Post-assessment feedback</h3>${s.feedback ? window.CheckinFeedback.map(item => `<details><summary>${esc(item.title)}</summary><p>${esc(item.question)}</p><p class="ci-quick-reflection">${esc(s.feedback.answers[item.id] || 'No response provided.')}</p></details>`).join('') : '<p>No feedback saved yet.</p>'}</section><section class="ci-review"><h3>Private admin review</h3><p>These notes and pattern suggestions are visible only to admins. Review the Snapshot alongside the participant before interpreting possible patterns.</p><form id="review-checkin"><label for="checkin-review-status">Review status</label><select id="checkin-review-status"><option value="pending">Awaiting review</option><option value="reviewed">Reviewed with participant</option></select><label for="checkin-review-notes">Private notes</label><textarea id="checkin-review-notes" maxlength="10000">${esc(s.review.notes)}</textarea><div class="ci-admin-toolbar"><button class="ci-button" type="submit">Save review</button>${s.notification !== 'sent' ? '<button class="ci-secondary" id="retry-notification" type="button">Retry admin notification</button>' : ''}</div></form><details><summary>Patterns to consider · human review required</summary><p>${s.patterns.candidates.length ? s.patterns.candidates.map(esc).join(' · ') : 'No defined pattern detected. Do not force one.'}</p><p>Advocacy items (ability, skill, safety, recommendation): ${s.patterns.advocacyItems.join(', ')}. The skill/safety pattern requires your interpretation. No pattern is automatically shown to the participant.</p></details><details><summary>Original responses and scoring</summary><p>Baseline clarity: ${s.input.baseline}/5. Three-year outlook: ${s.input.outlook}/5 (separate).</p>${participant.questionnaire.domains.map((d, i) => `<h4>${esc(d.name)} · ${s.snapshot.domains[i].average.toFixed(2)} · ${esc(s.snapshot.domains[i].signal)}</h4><ol class="ci-answer-list" start="${i * 4 + 1}">${d.items.map(item => `<li>${esc(item.text)}<strong>${s.input.answers[item.id]} — ${esc(participant.questionnaire.labels[s.input.answers[item.id] - 1])}</strong></li>`).join('')}</ol>`).join('')}</details></section><details class="ci-full-snapshot"><summary>Full participant Snapshot</summary>${window.CheckinSnapshot.render(s.snapshot, s.submittedAt, s.review.status)}</details>`;
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
      if (!showResults) {
        root.querySelector('.ci-review').scrollIntoView({ block: 'start' });
      }
      if (showResults) {
        const snapshot = root.querySelector('.ci-quick-results');
        const heading = snapshot?.querySelector('h2');
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
        snapshot?.scrollIntoView({ block: 'start' });
      }
      message('Participant Snapshot and original responses loaded.');
    } catch (e) { message(e.message); }
  }
  document.querySelector('[data-panel-target="sustainability"]').addEventListener('click', list);
})();
