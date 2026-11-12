// Shared helper for the form endpoints. Sends an email through Resend
// (https://resend.com). Set these in Cloudflare Pages → Settings → Variables:
//   RESEND_API_KEY  – your Resend API key
//   TO_EMAIL        – where submissions should arrive, e.g. hello@yourdomain.com
//   FROM_EMAIL      – a sender on a domain you verified in Resend, e.g. site@yourdomain.com
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || '');

export async function handleForm({ request, env }, { subject, required, fields }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Bad request' }, 400); }
  if (data.company_website) return json({ ok: true }); // honeypot: pretend success
  for (const k of required) if (!String(data[k] || '').trim()) return json({ ok: false, error: `Missing ${k}` }, 422);
  if (!isEmail(data.email)) return json({ ok: false, error: 'Invalid email' }, 422);
  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) return json({ ok: false, error: 'Email is not configured yet' }, 503);

  const rows = fields.map(([k, label]) => `<tr><td style="padding:6px 12px 6px 0;color:#666">${label}</td><td style="padding:6px 0">${esc(data[k] || '—')}</td></tr>`).join('');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: env.TO_EMAIL, reply_to: data.email, subject, html: `<table style="font:14px system-ui">${rows}</table>` }),
  });
  if (!res.ok) return json({ ok: false, error: 'Could not send' }, 502);
  return json({ ok: true });
}

// Free reel review: multipart upload with the video attached to the email.
// Resend allows about 40 MB per email after encoding, so videos are capped at 25 MB.
const MAX_BYTES = 25 * 1024 * 1024;
function toBase64(buf) {
  const bytes = new Uint8Array(buf); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
export async function handleReview({ request, env }) {
  let fd;
  try { fd = await request.formData(); } catch { return json({ ok: false, error: 'Bad request' }, 400); }
  if (fd.get('company_website')) return json({ ok: true });
  const email = String(fd.get('email') || '').trim();
  const file = fd.get('reel');
  if (!isEmail(email)) return json({ ok: false, error: 'Invalid email' }, 422);
  if (!file || typeof file === 'string' || !file.size) return json({ ok: false, error: 'Missing video' }, 422);
  if (file.size > MAX_BYTES) return json({ ok: false, error: 'Video is larger than 25 MB' }, 413);
  if (!/^video\//.test(file.type) && !/\.(mp4|mov|webm)$/i.test(file.name)) return json({ ok: false, error: 'Not a video file' }, 415);
  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) return json({ ok: false, error: 'Email is not configured yet' }, 503);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.FROM_EMAIL, to: env.TO_EMAIL, reply_to: email,
      subject: 'New free reel review request',
      html: `<p style="font:14px system-ui">Reel from <b>${esc(email)}</b> (${(file.size / 1048576).toFixed(1)} MB). The video is attached.</p>`,
      attachments: [{ filename: file.name || 'reel.mp4', content: toBase64(await file.arrayBuffer()) }],
    }),
  });
  if (!res.ok) return json({ ok: false, error: 'Could not send' }, 502);
  return json({ ok: true });
}
