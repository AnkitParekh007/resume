import { CHAT_SYSTEM, JD_SYSTEM, FIT_TOOL } from './prompts.js';
import { HttpError, parseChatBody, parseContactBody, parseJdBody, sanitizeFit } from './validate.js';
import { buildRawEmail, sendWithBinding } from './mail.js';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const CHAT_MAX_TOKENS = 700;
const JD_MAX_TOKENS = 1500;
const UPSTREAM_TIMEOUT_MS = 45000;

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes(origin)) return origin;
  if (env.ALLOW_LOCALHOST === 'true' && LOCAL_ORIGIN.test(origin)) return origin;
  return null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

const MAX_BODY_BYTES = 65536;

async function readJson(request, maxBytes = MAX_BODY_BYTES) {
  const declared = Number(request.headers.get('Content-Length'));
  if (declared > maxBytes) throw new HttpError(413, 'That request is too large.');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'That request is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Send valid JSON.');
  }
}

async function callAnthropic(env, payload) {
  const base = env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL;
  let res;
  try {
    res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    console.error('anthropic request failed', err?.name);
    throw new HttpError(502, 'The agent is unavailable right now. Please try again shortly.');
  }
  if (!res.ok) {
    // Log only Anthropic's error type and message (never the question or the response body).
    const detail = await res.json().then((j) => j?.error, () => null);
    console.error('anthropic returned', res.status, detail?.type, String(detail?.message || '').slice(0, 200));
    throw new HttpError(502, 'The agent is unavailable right now. Please try again shortly.');
  }
  return res;
}

function systemBlock(text) {
  // The profile is long and identical on every call, so it is cached upstream.
  return [{ type: 'text', text, cache_control: { type: 'ephemeral' } }];
}

// Anthropic streams server-sent events. The browser only needs the text, so forward just the text deltas.
function textFromEventStream() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  function handleEvent(raw, controller) {
    const data = raw
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('');
    if (!data) return;
    let event;
    try {
      event = JSON.parse(data);
    } catch {
      return;
    }
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      controller.enqueue(encoder.encode(event.delta.text));
    } else if (event.type === 'error') {
      console.error('anthropic stream error', event.error?.type);
      controller.enqueue(encoder.encode('\n\nThe agent stopped unexpectedly. Please try again.'));
      controller.terminate();
    }
  }

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true }).replace(/\r\n/g, '\n');
      let index;
      while ((index = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        handleEvent(raw, controller);
      }
    },
    flush(controller) {
      if (buffer.trim()) handleEvent(buffer, controller);
    },
  });
}

async function handleChat(request, env, origin) {
  const { messages } = parseChatBody(await readJson(request));
  const upstream = await callAnthropic(env, {
    model: env.ANTHROPIC_CHAT_MODEL,
    max_tokens: CHAT_MAX_TOKENS,
    stream: true,
    system: systemBlock(CHAT_SYSTEM),
    messages,
  });
  return new Response(upstream.body.pipeThrough(textFromEventStream()), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(origin),
    },
  });
}

async function handleJdMatch(request, env, origin) {
  const { jobDescription } = parseJdBody(await readJson(request));
  // A pasted job description must not be able to close the tag it is wrapped in.
  const safe = jobDescription.replace(/<\/?\s*job_description\s*>/gi, '');
  const upstream = await callAnthropic(env, {
    model: env.ANTHROPIC_JD_MODEL,
    max_tokens: JD_MAX_TOKENS,
    system: systemBlock(JD_SYSTEM),
    tools: [FIT_TOOL],
    tool_choice: { type: 'tool', name: FIT_TOOL.name },
    messages: [{ role: 'user', content: `<job_description>\n${safe}\n</job_description>` }],
  });
  const data = await upstream.json();
  const block = Array.isArray(data.content) ? data.content.find((b) => b.type === 'tool_use') : null;
  const fit = sanitizeFit(block?.input);
  if (!fit) throw new HttpError(502, 'The agent could not produce a usable answer. Please try again.');
  if (fit.notJobDescription) throw new HttpError(422, 'That does not look like a job description. Paste the role text and try again.');
  return json(fit, 200, origin);
}

async function handleContact(request, env, origin, sendMail) {
  const contact = parseContactBody(await readJson(request, 16384));
  if (contact.honeypot) return json({ ok: true }, 200, origin);
  const raw = buildRawEmail({ from: env.CONTACT_FROM, to: env.CONTACT_TO, contact });
  try {
    await sendMail(env, { raw });
  } catch (err) {
    // Never log what the visitor wrote: only the error type and the mail system's own error text.
    console.error('contact email failed', err?.name, String(err?.message || '').slice(0, 200));
    throw new HttpError(502, `Your message could not be sent right now. Please email ${env.CONTACT_TO} directly.`);
  }
  return json({ ok: true }, 200, origin);
}

function contactReady(env) {
  return Boolean(env.CONTACT_MAIL && env.CONTACT_TO && env.CONTACT_FROM);
}

export function createHandler({ sendMail }) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const origin = allowedOrigin(request, env);

      if (request.method === 'OPTIONS') {
        return origin ? new Response(null, { status: 204, headers: corsHeaders(origin) }) : new Response(null, { status: 403 });
      }
      if (!origin) return json({ error: 'This origin is not allowed.' }, 403, null);

      try {
        if (url.pathname === '/api/health' && request.method === 'GET') {
          // The agent and the quick message form are separate features; the page shows each only when it is ready.
          const agent = Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_CHAT_MODEL && env.ANTHROPIC_JD_MODEL);
          const contact = contactReady(env);
          return json({ ok: agent, contact }, agent || contact ? 200 : 503, origin);
        }

        const routes = ['/api/chat', '/api/jd-match', '/api/contact'];
        if (request.method !== 'POST' || !routes.includes(url.pathname)) throw new HttpError(404, 'Not found.');

        if (url.pathname === '/api/contact') {
          if (!contactReady(env)) throw new HttpError(503, 'The message form is not configured.');
          if (env.CONTACT_LIMITER) {
            const key = request.headers.get('CF-Connecting-IP') || 'unknown';
            const { success } = await env.CONTACT_LIMITER.limit({ key });
            if (!success) throw new HttpError(429, 'Too many messages in a short time. Please wait a minute and try again.');
          }
          return await handleContact(request, env, origin, sendMail);
        }

        if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, 'The agent is not configured.');
        if (env.RATE_LIMITER) {
          const key = request.headers.get('CF-Connecting-IP') || 'unknown';
          const { success } = await env.RATE_LIMITER.limit({ key });
          if (!success) throw new HttpError(429, 'Too many questions in a short time. Please wait a minute and try again.');
        }
        return url.pathname === '/api/chat' ? await handleChat(request, env, origin) : await handleJdMatch(request, env, origin);
      } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status, origin);
        console.error('unhandled error', err?.name);
        return json({ error: 'Something went wrong. Please try again.' }, 500, origin);
      }
    },
  };
}

export default createHandler({ sendMail: sendWithBinding });
