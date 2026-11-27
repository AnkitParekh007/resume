// Builds and sends the notification email for the Quick message form.

function base64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function wrap76(b64) {
  return b64.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

// RFC 2047 encoded-word, so non-ASCII names in the subject survive. Input is already single-line.
function encodeHeader(text) {
  return `=?UTF-8?B?${base64Utf8(text)}?=`;
}

export function buildRawEmail({ from, to, fromName = 'Portfolio contact form', contact, now = new Date(), id = crypto.randomUUID() }) {
  const domain = from.split('@')[1];
  const subject = `[Portfolio] ${contact.topic} from ${contact.name}`.slice(0, 200);
  const body = [
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Topic: ${contact.topic}`,
    `Company: ${contact.company || '(not given)'}`,
    '',
    contact.message,
    '',
    '--',
    'Sent from the quick message form on ankit-parekh.org. Reply to this email to answer the sender.',
  ].join('\r\n');

  return [
    `From: ${encodeHeader(fromName)} <${from}>`,
    `To: <${to}>`,
    `Reply-To: <${contact.email}>`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(base64Utf8(body)),
    '',
  ].join('\r\n');
}

// Production sender: Cloudflare Email Routing's send_email binding. Imported lazily because the
// "cloudflare:email" module only exists inside the Workers runtime.
export async function sendWithBinding(env, { raw }) {
  const { EmailMessage } = await import('cloudflare:email');
  await env.CONTACT_MAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
}
