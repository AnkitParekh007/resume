import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../src/index.js';
import { buildRawEmail } from '../src/mail.js';
import { CONTACT_TOPICS, HttpError, parseContactBody } from '../src/validate.js';

const ORIGIN = 'https://ankit-parekh.org';
const baseEnv = {
  ALLOWED_ORIGINS: 'https://ankit-parekh.org',
  CONTACT_MAIL: {},
  CONTACT_TO: 'owner@example.com',
  CONTACT_FROM: 'portfolio@ankit-parekh.org',
};
const valid = { name: 'Priya Rao', email: 'priya@acme.io', topic: CONTACT_TOPICS[1], company: 'Acme', message: 'We are hiring a forward deployed engineer and would like to talk.', website: '' };

function post(body, { origin = ORIGIN, raw } = {}) {
  return new Request('https://agent.example/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: raw ?? JSON.stringify(body),
  });
}

function handler() {
  const sent = [];
  const worker = createHandler({ sendMail: async (env, mail) => sent.push({ env, mail }) });
  return { worker, sent };
}

const rejects = (fn, status) => assert.throws(fn, (e) => e instanceof HttpError && e.status === status);

test('contact validation: accepts a complete message and normalises it', () => {
  const out = parseContactBody({ ...valid, name: '  Priya   Rao ', message: '  Hello there, a longer note.\r\nSecond line.  ' });
  assert.equal(out.name, 'Priya Rao');
  assert.equal(out.message, 'Hello there, a longer note.\nSecond line.');
  assert.equal(out.company, 'Acme');
});

test('contact validation: rejects missing or malformed fields', () => {
  rejects(() => parseContactBody(null), 400);
  rejects(() => parseContactBody({ ...valid, name: '  ' }), 400);
  rejects(() => parseContactBody({ ...valid, email: 'not-an-email' }), 400);
  rejects(() => parseContactBody({ ...valid, email: 'a@b.co\r\nBcc: victim@example.com' }), 400);
  rejects(() => parseContactBody({ ...valid, topic: 'Free money' }), 400);
  rejects(() => parseContactBody({ ...valid, message: 'short' }), 400);
  rejects(() => parseContactBody({ ...valid, message: 'x'.repeat(2001) }), 400);
  rejects(() => parseContactBody({ ...valid, company: 'c'.repeat(101) }), 400);
});

test('contact validation: a filled honeypot is flagged', () => {
  assert.deepEqual(parseContactBody({ ...valid, website: 'http://spam.example' }), { honeypot: true });
});

test('email: headers cannot be injected through the name and the body is base64 UTF-8', () => {
  const contact = parseContactBody({ ...valid, name: 'Eve\r\nBcc: victim@example.com' });
  const raw = buildRawEmail({ from: 'portfolio@ankit-parekh.org', to: 'owner@example.com', contact, now: new Date('2026-11-27T00:00:00Z'), id: 'abc' });
  const [headers, body] = raw.split('\r\n\r\n');
  assert.ok(!/^Bcc:/im.test(headers));
  assert.match(headers, /^To: <owner@example\.com>$/m);
  assert.match(headers, /^Reply-To: <priya@acme\.io>$/m);
  assert.match(headers, /^Subject: =\?UTF-8\?B\?/m);
  assert.match(headers, /^Message-ID: <abc@ankit-parekh\.org>$/m);
  const decoded = Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
  assert.match(decoded, /Name: Eve Bcc: victim@example\.com/);
  assert.match(decoded, /We are hiring a forward deployed engineer/);
});

test('email: non-ASCII text survives', () => {
  const contact = parseContactBody({ ...valid, name: 'Zoë Müller', message: 'Grüße aus München, wir möchten sprechen.' });
  const raw = buildRawEmail({ from: 'portfolio@ankit-parekh.org', to: 'owner@example.com', contact });
  const subject = /^Subject: =\?UTF-8\?B\?(.+)\?=$/m.exec(raw)[1];
  assert.match(Buffer.from(subject, 'base64').toString('utf8'), /Zoë Müller/);
  const decoded = Buffer.from(raw.split('\r\n\r\n')[1].replace(/\s+/g, ''), 'base64').toString('utf8');
  assert.match(decoded, /Grüße aus München/);
});

test('contact route: sends one email to the fixed owner address', async () => {
  const { worker, sent } = handler();
  const res = await worker.fetch(post({ ...valid, to: 'attacker@example.com' }), baseEnv);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.match(sent[0].mail.raw, /^To: <owner@example\.com>$/m);
  assert.ok(!sent[0].mail.raw.includes('attacker@example.com'));
});

test('contact route: honeypot answers ok but sends nothing', async () => {
  const { worker, sent } = handler();
  const res = await worker.fetch(post({ ...valid, website: 'http://spam.example' }), baseEnv);
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
});

test('contact route: invalid input is a 400 and nothing is sent', async () => {
  const { worker, sent } = handler();
  const res = await worker.fetch(post({ ...valid, email: 'nope' }), baseEnv);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /email/i);
  assert.equal(sent.length, 0);
});

test('contact route: oversized bodies are refused', async () => {
  const { worker, sent } = handler();
  const res = await worker.fetch(post(null, { raw: JSON.stringify({ ...valid, message: 'x'.repeat(20000) }) }), baseEnv);
  assert.equal(res.status, 413);
  assert.equal(sent.length, 0);
});

test('contact route: a delivery failure is a 502 that points to the email address, without leaking details', async () => {
  const log = console.error;
  console.error = () => {};
  try {
    const worker = createHandler({ sendMail: async () => { throw new Error('smtp secret detail'); } });
    const res = await worker.fetch(post(valid), baseEnv);
    assert.equal(res.status, 502);
    const text = await res.text();
    assert.match(text, /owner@example\.com/);
    assert.ok(!text.includes('smtp secret detail'));
  } finally {
    console.error = log;
  }
});

test('contact route: rate-limited, unconfigured and foreign-origin requests never send', async () => {
  const { worker, sent } = handler();
  const limited = await worker.fetch(post(valid), { ...baseEnv, CONTACT_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal(limited.status, 429);
  const unconfigured = await worker.fetch(post(valid), { ...baseEnv, CONTACT_MAIL: undefined });
  assert.equal(unconfigured.status, 503);
  const foreign = await worker.fetch(post(valid, { origin: 'https://evil.example' }), baseEnv);
  assert.equal(foreign.status, 403);
  assert.equal(sent.length, 0);
});

test('health: reports the contact form separately from the agent', async () => {
  const { worker } = handler();
  const req = () => new Request('https://agent.example/api/health', { headers: { Origin: ORIGIN } });
  const onlyContact = await worker.fetch(req(), baseEnv);
  assert.equal(onlyContact.status, 200);
  assert.deepEqual(await onlyContact.json(), { ok: false, contact: true });
  const neither = await worker.fetch(req(), { ALLOWED_ORIGINS: baseEnv.ALLOWED_ORIGINS });
  assert.equal(neither.status, 503);
});
