(function () {
  const root = document.getElementById('checkin-app');
  const errorBox = document.getElementById('checkin-error');
  const saved = document.getElementById('save-status');
  const signOut = document.getElementById('sign-out');
  const esc = window.CheckinSnapshot.escape;
  let q, account, data, dataEmail = '', step = 0, loginEmail = '', timer, saving = Promise.resolve(), busy = false, submitted = false;
  function error(message) { errorBox.textContent = message || ''; errorBox.hidden = !message; }
  async function api(action, payload = {}) {
    const response = await fetch('/api/checkin', action ? { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) } : { credentials: 'same-origin', cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error || 'Unable to connect. Please try again.'), { status: response.status });
    return body;
  }
  function focusTitle() { root.querySelector('h1')?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  async function load() {
    try {
      account = await api(); q = account.questionnaire;
      if (dataEmail !== account.id) data = null;
      dataEmail = account.id;
      signOut.hidden = false;
      if (account.submission) return showSnapshot(account.submission);
      data = data || account.draft || { answers: {}, step: 0, heaviest: '', hope: '', consent: false };
      step = data.step || 0;
      render();
    } catch (e) { renderLogin(); if (e.status !== 401) error(e.message); }
  }
  function renderLogin() {
    signOut.hidden = true; saved.textContent = ''; error('');
    root.innerHTML = `<div class="ci-intro-grid"><section class="ci-intro-copy"><p class="ci-kicker">For the person behind the music</p><h1 class="ci-title" tabindex="-1">Meaningful work.<br><em>A sustainable way<br>to keep doing it.</em></h1><p class="ci-lead">A little space to check in with yourself—and notice what music leadership feels like right now.</p><hr class="ci-rule"><p class="ci-detail">The Music Leader Sustainability Check-In™ is a guided reflection. There is no passing, failing, or perfect answer.</p><div class="ci-facts"><div><strong>32</strong><span>statements</span></div><div><strong>8</strong><span>areas of your work</span></div><div><strong>Your</strong><span>personal Snapshot</span></div></div></section><section class="ci-card"><p class="ci-kicker">An invitation to pause</p><h2>Input email to begin.</h2><p>Enter your email to start your assessment.</p><form id="login-form"><label class="ci-field"><span>Email address</span><input id="login-value" type="email" autocomplete="email" maxlength="254" required value="${esc(loginEmail)}"></label><button class="ci-button ci-wide" type="submit">Begin assessment <span aria-hidden="true">→</span></button></form><hr class="ci-rule"><p class="ci-small">Your email connects this assessment to your responses for Ashley’s review. Your responses and Snapshot are available to you in this browser and to authorized Music Makeover admins. They are not published on the website.</p></section></div>`;
    root.querySelector('#login-form').addEventListener('submit', async e => {
      e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true; error('');
      try {
        loginEmail = root.querySelector('#login-value').value.trim();
        await api('begin', { email: loginEmail }); data = null; submitted = false;
        await load(); focusTitle();
      } catch (e) { error(e.message); button.disabled = false; }
    });
  }
  function choices(name, question, labels, value, number) {
    return `<fieldset class="ci-question"><legend>${number ? `<span class="item-number">${String(number).padStart(2, '0')}</span>` : ''}${esc(question)}</legend><div class="ci-options">${labels.map((label, i) => `<label class="ci-option"><input type="radio" name="${esc(name)}" value="${i + 1}" ${value === i + 1 ? 'checked' : ''} required><span><b>${i + 1}</b>${esc(label)}</span></label>`).join('')}</div></fieldset>`;
  }
  function render() {
    error('');
    if (step === 0) {
      root.innerHTML = `<div class="ci-intro-grid"><section class="ci-intro-copy"><p class="ci-kicker">Music Leader Sustainability Check-In™</p><h1 class="ci-title" tabindex="-1">Begin where<br><em>you actually are.</em></h1><p class="ci-lead">Not where you think you should be. Not what you can push through. Your experience, right now.</p><hr class="ci-rule"><p class="ci-detail">You’ll reflect on eight areas of music leadership, then see a Snapshot of the conditions supporting you and the pressures you may be carrying.</p></section><section class="ci-card"><h2>A few things before we begin.</h2><p>Answer each statement on a 1–5 scale. All 32 statements and both opening reflections are required. You can go back and change answers before submitting.</p><p>This is an exploratory pre-pilot, not an employee evaluation or a clinical assessment. Your responses are saved as you go, so you can return in this browser while your session is active. Starting again with an email creates a new assessment.</p><p>You’ll see your results immediately. Ashley will review them with you later, with room for the context a form cannot fully capture.</p><form id="welcome-form"><label class="ci-consent"><input type="checkbox" id="consent" required ${data.consent ? 'checked' : ''}><span>I understand that my responses will be stored for this pre-pilot and can be reviewed by authorized Music Makeover admins, including Ashley.</span></label><button class="ci-button ci-wide" type="submit">Begin my check-in <span aria-hidden="true">→</span></button></form></section></div>`;
      root.querySelector('#welcome-form').addEventListener('submit', async e => { e.preventDefault(); data.consent = true; await move(1); }); return;
    }
    let title, intro, content;
    if (step === 1) {
      title = 'Before we begin.'; intro = 'Take a moment to name what brought you here. There is no need to have it all figured out.';
      content = choices('baseline', 'How clear are you about what is making your work difficult—or easier—to sustain right now?', ['Not at all clear', 'Slightly clear', 'Somewhat clear', 'Mostly clear', 'Very clear'], data.baseline) + `<label class="ci-field"><span>What feels heaviest right now? <small>Required</small></span><textarea name="heaviest" maxlength="3000" rows="5" required>${esc(data.heaviest)}</textarea><small>We’ll bring your exact words back in your Snapshot. Avoid including names or identifying details about other people.</small></label><label class="ci-field"><span>What do you most hope becomes different? <small>Required</small></span><textarea name="hope" maxlength="3000" rows="5" required>${esc(data.hope)}</textarea></label>`;
    } else if (step <= 9) {
      const domain = q.domains[step - 2]; title = domain.name; intro = 'Answer based on your actual experience right now—not what you think should be true.';
      content = domain.items.map((item, i) => choices(item.id, item.text, q.labels, data.answers[item.id], (step - 2) * 4 + i + 1)).join('');
    } else {
      title = 'Looking a little further ahead.'; intro = 'One final reflection. This is separate from your eight areas and is never included in their averages.';
      content = choices('outlook', q.outlookQuestion, q.outlookLabels, data.outlook) + '<p class="ci-scale-note">Answer based on your current way of working and current conditions—not simply whether you want to remain in music leadership.</p><div class="ci-notice">Your Snapshot will appear as soon as you submit. You can use Back to review your answers first. After submitting, this pre-pilot check-in is saved for your conversation with Ashley.</div>';
    }
    root.innerHTML = `<section class="ci-flow"><div class="ci-progress-top"><span>${step >= 2 && step <= 9 ? `Area ${step - 1} of 8` : step === 1 ? 'Your starting point' : 'Your three-year outlook'}</span><span>Step ${step} of 10</span></div><div class="ci-progress" role="progressbar" aria-label="Check-in progress" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${step}"><span style="width:${step * 10}%"></span></div><p class="ci-kicker">A moment for honest reflection</p><h1 tabindex="-1">${esc(title)}</h1><p class="ci-description">${esc(intro)}</p><form id="step-form">${content}<div class="ci-actions"><button class="ci-secondary" id="back" type="button">← Back</button><button class="ci-button" type="submit">${step === 10 ? 'See my Snapshot' : 'Continue'} <span aria-hidden="true">→</span></button></div></form></section>`;
    const form = root.querySelector('#step-form');
    form.addEventListener('input', () => { capture(); scheduleSave(); });
    root.querySelector('#back').addEventListener('click', async () => { capture(); await move(step - 1); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (busy) return; capture();
      if (step === 1 && (!data.heaviest.trim() || !data.hope.trim())) { error('Please respond to both opening reflections before continuing.'); return; }
      if (step < 10) return move(step + 1);
      busy = true; form.querySelectorAll('button').forEach(b => b.disabled = true); error(''); clearTimeout(timer);
      try { await saving; const result = await api('submit', { input: data }); showSnapshot(result.submission); focusTitle(); }
      catch (e) { error(e.message); if (e.status === 401) offerSignIn(); form.querySelectorAll('button').forEach(b => b.disabled = false); }
      finally { busy = false; }
    });
  }
  function capture() {
    const form = root.querySelector('#step-form'); if (!form) return;
    for (const [name, value] of new FormData(form)) {
      if (name.endsWith('Score')) data.answers[name] = Number(value);
      else if (['baseline', 'outlook'].includes(name)) data[name] = Number(value);
      else data[name] = value;
    }
    data.step = step;
  }
  function scheduleSave() { saved.textContent = 'Saving…'; clearTimeout(timer); timer = setTimeout(() => save().catch(() => {}), 700); }
  function save() {
    clearTimeout(timer); const input = JSON.parse(JSON.stringify(data)); saved.textContent = 'Saving…';
    saving = saving.catch(() => {}).then(() => api('draft', { input })).then(() => { saved.textContent = 'Progress saved securely.'; }, e => { saved.textContent = 'Latest changes have not been saved. Keep this page open and try again.'; error(e.message); if (e.status === 401) offerSignIn(); throw e; });
    return saving;
  }
  function offerSignIn() {
    if (errorBox.querySelector('button')) return;
    const button = document.createElement('button'); button.className = 'text-button'; button.textContent = 'Start a new assessment'; button.addEventListener('click', () => renderLogin()); errorBox.append(' ', button);
  }
  async function move(next) {
    if (busy) return; busy = true; root.querySelectorAll('button').forEach(b => b.disabled = true);
    const previous = step; data.step = next;
    try { await save(); step = next; render(); focusTitle(); }
    catch { data.step = previous; root.querySelectorAll('button').forEach(b => b.disabled = false); }
    finally { busy = false; }
  }
  function showSnapshot(submission) {
    submitted = true;
    clearTimeout(timer); error(''); saved.textContent = '';
    root.innerHTML = window.CheckinSnapshot.render(submission.snapshot, submission.submittedAt, submission.reviewStatus) + '<div class="ci-snapshot-actions"><p class="ci-small">Your Snapshot is saved for Ashley’s review. You can view it in this browser while your session is active, or save a PDF below.</p><button id="print-snapshot" class="ci-secondary" type="button">Save My Snapshot</button></div>';
    root.insertAdjacentHTML('beforeend', `<section class="ci-feedback ci-card" aria-labelledby="post-clarity-title"><h2 id="post-clarity-title">After seeing your Snapshot…</h2><form id="post-clarity-form">${choices('postClarity', 'How clear are you now about what may be making your work difficult—or easier—to sustain?', ['Not at all clear', 'Slightly clear', 'Somewhat clear', 'Mostly clear', 'Very clear'], submission.postClarity?.value)}<button type="submit" class="ci-button">Save clarity response</button><p id="post-clarity-status" role="status" aria-live="polite">${submission.postClarity ? 'Your clarity response is saved.' : ''}</p></form></section>`);
    const clarityForm = root.querySelector('#post-clarity-form');
    clarityForm.addEventListener('change', () => { root.querySelector('#post-clarity-status').textContent = 'Clarity response has unsaved changes.'; });
    clarityForm.addEventListener('submit', async e => {
      e.preventDefault(); const button = clarityForm.querySelector('button'); button.disabled = true;
      const message = root.querySelector('#post-clarity-status'); message.textContent = 'Saving clarity response…';
      try {
        await api('clarity', { value: Number(new FormData(clarityForm).get('postClarity')) });
        message.textContent = 'Your clarity response is saved. Thank you.';
      } catch (e) { message.textContent = e.message || 'Unable to save. Please try again.'; }
      finally { button.disabled = false; }
    });
    const feedback = submission.feedback?.answers || {};
    root.insertAdjacentHTML('beforeend', `<section class="ci-feedback ci-card" aria-labelledby="feedback-title"><h2 id="feedback-title">Before You Move On…</h2><p>Help us strengthen the experience while it’s still fresh.</p><p class="ci-small">Your responses do not affect your Snapshot. As a pre-pilot participant, your feedback is an important part of helping us strengthen this experience before its full release. Your feedback is saved with this assessment for authorized Music Makeover admins.</p><p class="ci-feedback-note"><em>If nothing comes to mind for a question, "Nothing comes to mind" is a perfectly helpful response.</em></p><form id="feedback-form">${window.CheckinFeedback.map((item, i) => `<label class="ci-field ci-feedback-question" for="feedback-${item.id}"><span><strong>${i + 1}. ${esc(item.title)}</strong><br>${esc(item.question)}</span><textarea id="feedback-${item.id}" name="${item.id}" maxlength="3000" rows="4" required>${esc(feedback[item.id] || '')}</textarea></label>`).join('')}<button type="submit" class="ci-button">${submission.feedback ? 'Update feedback' : 'Save feedback'}</button><p id="feedback-status" role="status" aria-live="polite">${submission.feedback ? 'Your feedback is saved. Thank you.' : ''}</p></form></section>`);
    const feedbackForm = root.querySelector('#feedback-form');
    feedbackForm.addEventListener('input', () => { root.querySelector('#feedback-status').textContent = 'Feedback has unsaved changes.'; });
    feedbackForm.addEventListener('submit', async e => {
      e.preventDefault(); const button = feedbackForm.querySelector('button'); button.disabled = true;
      const message = root.querySelector('#feedback-status'); message.textContent = 'Saving feedback…';
      try {
        await api('feedback', { input: Object.fromEntries(new FormData(feedbackForm)) });
        message.textContent = 'Your feedback is saved. Thank you for helping us strengthen the experience.';
        button.textContent = 'Update feedback';
      } catch (e) { message.textContent = e.message || 'Unable to save feedback. Please try again.'; }
      finally { button.disabled = false; }
    });
    root.querySelector('#print-snapshot').addEventListener('click', () => { root.querySelectorAll('details').forEach(d => d.open = true); window.print(); });
  }
  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    try { clearTimeout(timer); if (data && !submitted) { capture(); await save(); } else await saving.catch(() => {}); await api('logout'); data = null; account = null; submitted = false; renderLogin(); }
    catch (e) { error(e.message); } finally { signOut.disabled = false; }
  });
  window.addEventListener('beforeunload', e => { if (root.querySelector('#post-clarity-status')?.textContent === 'Clarity response has unsaved changes.' || root.querySelector('#post-clarity-status')?.textContent === 'Saving clarity response…' || root.querySelector('#feedback-status')?.textContent === 'Feedback has unsaved changes.' || root.querySelector('#feedback-status')?.textContent === 'Saving feedback…' || saved.textContent === 'Saving…' || saved.textContent.startsWith('Latest changes')) { e.preventDefault(); e.returnValue = ''; } });
  load();
})();
