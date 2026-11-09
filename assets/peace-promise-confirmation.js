const status = document.querySelector('.status');
const buttons = [...document.querySelectorAll('[data-format]')];
const sessionId = new URLSearchParams(location.search).get('session_id');
history.replaceState(null,'',location.pathname);
async function request(format) {
  return fetch('/api/peace-promise-download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,format})});
}
(async()=>{
  if(!sessionId){status.textContent='Your downloads unlock after checkout. Open the confirmation link provided by Stripe.';return;}
  try{const response=await request();const result=await response.json();status.textContent=result.message;if(response.ok)buttons.forEach(button=>button.disabled=false);}
  catch{status.textContent='Unable to check your purchase. Please reopen your checkout confirmation link and try again.';}
})();
buttons.forEach(button=>button.addEventListener('click',async()=>{
  buttons.forEach(b=>b.disabled=true);status.textContent='Preparing your workbook…';
  try{const response=await request(button.dataset.format);if(!response.ok){status.textContent=(await response.json()).message;return;}
    const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=button.dataset.format==='pdf'?'The Peace Promise - Printable.pdf':'The Peace Promise - Editable Workbook.docx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Your download is ready. You can download the other edition below.';
  }catch{status.textContent='The download could not finish. Please try again.';}finally{buttons.forEach(b=>b.disabled=false);}
}));
