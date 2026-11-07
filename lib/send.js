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
