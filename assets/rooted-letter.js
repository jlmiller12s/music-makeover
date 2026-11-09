const signup = document.querySelector('[data-rooted-signup]');
const confirmation = document.querySelector('[data-rooted-confirm]');
async function submitRooted(form, payload) {
  const button = form.querySelector('button');
  const status = form.querySelector('[role="status"]');
  button.disabled = true; status.textContent = 'Please wait…';
  try {
    const response = await fetch('/api/rooted-letter', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const result = await response.json();
    status.textContent = result.message;
    if (response.ok) { form.reset(); if (form === confirmation) { button.hidden = true; history.replaceState(null,'',location.pathname); } }
  } catch { status.textContent = 'We could not connect. Please try again.'; }
  finally { button.disabled = false; }
}
signup?.addEventListener('submit', event => {
  event.preventDefault();
  submitRooted(signup,{firstName:signup.elements.firstName.value,email:signup.elements.email.value,consent:signup.elements.consent.checked,website:signup.elements.website.value});
});
if (confirmation) {
  const token = location.hash.slice(1);
  history.replaceState(null,'',location.pathname);
  confirmation.addEventListener('submit',event=> {event.preventDefault(); submitRooted(confirmation,{action:'confirm',token});});
}
