function emailReady() { return Boolean(process.env.RESEND_API_KEY && process.env.CHECKIN_EMAIL_FROM); }
async function sendEmail({ to, subject, text, idempotencyKey }) {
  if (!emailReady()) throw Object.assign(new Error('Email delivery is not configured.'), { status: 503 });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: process.env.CHECKIN_EMAIL_FROM, to: Array.isArray(to) ? to : [to], subject, text }),
  });
  if (!response.ok) throw Object.assign(new Error('Email could not be sent. Please try again shortly.'), { status: 503 });
}
module.exports = { sendEmail, emailReady };
