// Request validation. The browser is untrusted: it may only send user and assistant turns, never system messages.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const LIMITS = {
  maxTurns: 12,
  maxUserChars: 1000,
  maxAssistantChars: 4000,
  maxTotalChars: 12000,
  minJdChars: 80,
  maxJdChars: 6000,
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseChatBody(body) {
  if (!isPlainObject(body)) throw new HttpError(400, 'Send a JSON object.');
  if ('system' in body) throw new HttpError(400, 'System messages are not accepted.');
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) throw new HttpError(400, 'Send at least one message.');
  if (messages.length > LIMITS.maxTurns) throw new HttpError(400, 'The conversation is too long. Start a new chat.');

  let total = 0;
  const clean = messages.map((m, i) => {
    if (!isPlainObject(m)) throw new HttpError(400, 'Each message must be an object.');
    if (m.role === 'system') throw new HttpError(400, 'System messages are not accepted.');
    if (m.role !== 'user' && m.role !== 'assistant') throw new HttpError(400, 'Message roles must be user or assistant.');
    if (m.role !== (i % 2 === 0 ? 'user' : 'assistant')) throw new HttpError(400, 'Messages must alternate, starting with the user.');
    if (typeof m.content !== 'string') throw new HttpError(400, 'Message content must be text.');
    const content = m.content.trim();
    const max = m.role === 'user' ? LIMITS.maxUserChars : LIMITS.maxAssistantChars;
    if (content.length === 0) throw new HttpError(400, 'Messages cannot be empty.');
    if (content.length > max) throw new HttpError(400, `Messages are limited to ${max} characters.`);
    total += content.length;
    return { role: m.role, content };
  });

  if (clean[clean.length - 1].role !== 'user') throw new HttpError(400, 'The last message must come from the user.');
  if (total > LIMITS.maxTotalChars) throw new HttpError(400, 'The conversation is too long. Start a new chat.');
  return { messages: clean };
}

export function parseJdBody(body) {
  if (!isPlainObject(body)) throw new HttpError(400, 'Send a JSON object.');
  if (typeof body.jobDescription !== 'string') throw new HttpError(400, 'Send the job description as text.');
  const jobDescription = body.jobDescription.trim();
  if (jobDescription.length < LIMITS.minJdChars) throw new HttpError(400, 'Paste a longer job description so the match is meaningful.');
  if (jobDescription.length > LIMITS.maxJdChars) throw new HttpError(400, `Job descriptions are limited to ${LIMITS.maxJdChars} characters.`);
  return { jobDescription };
}

const VERDICTS = ['strong', 'partial', 'weak'];
export const EVIDENCE_LABELS = [
  'public repo',
  'live demo',
  'employer work (private)',
  'issuer-verifiable credential',
  'his own statement',
];

function clip(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// The model's structured answer is checked again here, so the page never renders an unexpected shape.
export function sanitizeFit(input) {
  if (!isPlainObject(input)) return null;
  if (input.is_job_description === false) return { notJobDescription: true };
  if (!VERDICTS.includes(input.verdict)) return null;
  const summary = clip(input.summary, 600);
  if (!summary) return null;

  const matches = (Array.isArray(input.matches) ? input.matches : [])
    .slice(0, 12)
    .map((m) => ({
      requirement: clip(m?.requirement, 240),
      evidence: clip(m?.evidence, 400),
      label: EVIDENCE_LABELS.includes(m?.label) ? m.label : 'his own statement',
    }))
    .filter((m) => m.requirement && m.evidence);

  const gaps = (Array.isArray(input.gaps) ? input.gaps : [])
    .slice(0, 10)
    .map((g) => clip(g, 240))
    .filter(Boolean);

  return { verdict: input.verdict, summary, matches, gaps };
}

// Quick message form. The recipient is fixed server-side, so this endpoint can only ever email the site owner.
export const CONTACT_TOPICS = [
  'General inquiry',
  'Role opportunity',
  'Project or consulting',
  'Open-source collaboration',
  'Something else',
];

export const CONTACT_LIMITS = { maxName: 100, maxEmail: 254, maxCompany: 100, minMessage: 10, maxMessage: 2000 };

// Header-safe single line: no control characters or line breaks, collapsed whitespace.
function singleLine(value) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

const EMAIL_PATTERN = /^[^\s@<>()",;:\\]+@[^\s@<>()",;:\\]+\.[^\s@<>()",;:\\]{2,}$/;

export function parseContactBody(body) {
  if (!isPlainObject(body)) throw new HttpError(400, 'Send a JSON object.');
  // Hidden field that real visitors never fill in. Bots that do are told it worked and nothing is sent.
  if (typeof body.website === 'string' && body.website.trim() !== '') return { honeypot: true };

  const name = singleLine(body.name);
  if (!name) throw new HttpError(400, 'Please enter your name.');
  if (name.length > CONTACT_LIMITS.maxName) throw new HttpError(400, 'That name is too long.');

  const email = singleLine(body.email);
  if (!email) throw new HttpError(400, 'Please enter your email so I can reply.');
  if (email.length > CONTACT_LIMITS.maxEmail || !EMAIL_PATTERN.test(email)) throw new HttpError(400, 'That email address does not look right.');

  const topic = typeof body.topic === 'string' ? body.topic : '';
  if (!CONTACT_TOPICS.includes(topic)) throw new HttpError(400, 'Choose what you are reaching out about.');

  const company = singleLine(body.company);
  if (company.length > CONTACT_LIMITS.maxCompany) throw new HttpError(400, 'That company name is too long.');

  if (typeof body.message !== 'string') throw new HttpError(400, 'Please write a message.');
  const message = body.message.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (message.length < CONTACT_LIMITS.minMessage) throw new HttpError(400, 'Please write a little more so I know how to help.');
  if (message.length > CONTACT_LIMITS.maxMessage) throw new HttpError(400, `Messages are limited to ${CONTACT_LIMITS.maxMessage} characters.`);

  return { name, email, topic, company, message };
}
