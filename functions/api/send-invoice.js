const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtml(value) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    return json({
      error: 'Email is not configured yet. Add RESEND_API_KEY and FROM_EMAIL in Cloudflare Pages environment variables.',
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: 'Invalid JSON request.' }, 400);
  }

  const to = String(body.to || '').trim();
  const replyTo = String(body.replyTo || '').trim();
  const businessName = String(body.businessName || 'Andras user').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const fileName = String(body.fileName || `Invoice-${body.invoiceNumber || 'draft'}.pdf`).replace(/[^\w.-]/g, '-');
  const pdfBase64 = String(body.pdfBase64 || '').trim();

  if (!validEmail(to)) return json({ error: 'Client email is invalid.' }, 400);
  if (!validEmail(replyTo)) return json({ error: 'Business reply-to email is invalid.' }, 400);
  if (!subject || !message || !pdfBase64) return json({ error: 'Subject, message and PDF are required.' }, 400);
  if (pdfBase64.length > 8_000_000) return json({ error: 'PDF attachment is too large for this MVP sender.' }, 413);

  const resendPayload = {
    from: env.FROM_EMAIL,
    to: [to],
    reply_to: replyTo,
    subject,
    text: message,
    html: textToHtml(message),
    attachments: [
      {
        filename: fileName,
        content: pdfBase64,
      },
    ],
    tags: [
      { name: 'product', value: 'andras' },
      { name: 'type', value: 'invoice' },
    ],
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resendPayload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: result.message || result.error || 'Email provider rejected the message.' }, response.status);
  }

  return json({
    ok: true,
    id: result.id,
    to,
    replyTo,
    businessName,
  });
}
