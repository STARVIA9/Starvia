// Facebook Page API Router
// Endpoints:
//   GET  /v1/facebook/health              → liveness check (public)
//   POST /v1/facebook/post                → post to page (admin auth)
//   DELETE /v1/facebook/post?id=…         → delete a post (admin auth)

import {
  facebookHealth,
  facebookPostAuth,
  facebookDeleteAuth,
  facebookExchangeNoAuth,
  facebookInboxAuth,
  facebookSendAuth,
  facebookSubscriberCheck,
} from '../../_lib/facebook.js';
import {
  facebookAutoPostAuth,
  facebookAutoPostPreviewAuth,
} from '../../_lib/auto-post.js';
// DISABLED 20 ก.ค.69 (Option A): keyword auto-reply เลิกใช้
// ระบบหลัก = ~/.hermes/scripts/starvia-autoreply-llm.py (cron 2f1b6bfd4c21)
// ไฟล์เก่าอยู่ที่ functions/_lib/_disabled/auto-reply.js — ยังไม่ deploy ปิด production

// ── Inline Facebook Webhook Handler ──
// ตรวจ X-Hub-Signature-256 (HMAC-SHA256 ของ raw body ด้วย FACEBOOK_APP_SECRET) ก่อนเชื่อ payload
async function verifyFbSignature(request, rawBody, secret) {
  const header = request.headers.get('x-hub-signature-256') || '';
  if (!header.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = 'sha256=' + [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== header.length) return false;
  // เทียบแบบ constant-time (กัน timing side-channel)
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

async function handleFacebookWebhook(context) {
  const { request, env } = context;
  const SUBSCRIBERS_KEY = 'premium:subscribers';

  // GET: Facebook Verification
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === env.FB_WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // OPTIONS: CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });
  }

  // POST: Event Notification — ต้องมีลายเซ็น Facebook ที่ถูกต้องเท่านั้น
  try {
    const rawBody = await request.text();
    if (!env.FACEBOOK_APP_SECRET) {
      console.error('[fb-webhook] FACEBOOK_APP_SECRET not set — refusing unsigned webhook');
      return new Response('App secret not configured', { status: 500 });
    }
    if (!(await verifyFbSignature(request, rawBody, env.FACEBOOK_APP_SECRET))) {
      console.warn('[fb-webhook] rejected: invalid X-Hub-Signature-256');
      return new Response('Forbidden', { status: 403 });
    }

    let body;
    try { body = JSON.parse(rawBody); } catch { return new Response('OK', { status: 200 }); }

    const userIds = new Set();
    if (body.object === 'page') {
      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          if (event.sender?.id) userIds.add(String(event.sender.id));
        }
        for (const change of entry.changes || []) {
          if (change.value?.from?.id) userIds.add(String(change.value.from.id));
          if (change.value?.sender_id) userIds.add(String(change.value.sender_id));
        }
      }
    }
    if (userIds.size > 0) {
      let subscribers = [];
      try {
        const raw = await env.STARVIA_KV.get(SUBSCRIBERS_KEY, { type: 'json' });
        if (Array.isArray(raw)) subscribers = raw;
      } catch {}
      const existing = new Set(subscribers.map(s => s.id));
      let added = 0;
      for (const uid of userIds) {
        if (!existing.has(uid)) {
          subscribers.push({ id: uid, at: new Date().toISOString(), src: 'webhook' });
          added++;
        }
      }
      if (added > 0) {
        if (subscribers.length > 10000) subscribers = subscribers.slice(-10000);
        await env.STARVIA_KV.put(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
      }
    }
  } catch {}
  return new Response('OK', { status: 200 });
}


export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/v1\/facebook\/?/, '').replace(/\/$/, '');

  try {
    // GET /v1/facebook/health (or just /v1/facebook/)
    if (path === '' || path === 'health') {
      if (request.method === 'GET') return facebookHealth(context);
      return new Response(JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /v1/facebook/post
    if (path === 'post' && request.method === 'POST') {
      return facebookPostAuth(context);
    }

    // DELETE /v1/facebook/post?id=…
    if (path === 'post' && request.method === 'DELETE') {
      return facebookDeleteAuth(context);
    }

    // POST /v1/facebook/exchange (App Secret in env IS the auth barrier)
    if (path === 'exchange' && request.method === 'POST') {
      return facebookExchangeNoAuth(context);
    }

    // GET /v1/facebook/inbox (reads conversations)
    if (path === 'inbox' && request.method === 'GET') {
      return facebookInboxAuth(context);
    }

    // POST /v1/facebook/send (sends message)
    if (path === 'send' && request.method === 'POST') {
      return facebookSendAuth(context);
    }

    // POST /v1/facebook/auto-pin — DISABLED 5 ก.ย.69 (พ่อสั่งปิดทั้งระบบ)
    // เคยแจก PIN อัตโนมัติจาก inbox + แจ้ง Telegram — เลิกใช้แล้ว
    if (path === 'auto-pin' && request.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DISABLED',
          message: 'Auto-PIN ปิดใช้งานแล้ว (5 ก.ย.69)',
        }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST /v1/facebook/subscriber-check (FB Login — ตรวจว่าเป็นสมาชิกเพจหรือไม่)
    // GET/POST /v1/facebook/webhook (Facebook Page Webhook — verification + events)
    if (path === "webhook") {
      return handleFacebookWebhook(context);
    }

    if (path === 'subscriber-check' && request.method === 'POST') {
      return facebookSubscriberCheck(context);
    }

    // POST /v1/facebook/auto-post (daily horoscope auto-post)
    if (path === 'auto-post' && request.method === 'POST') {
      return facebookAutoPostAuth(context);
    }

    // GET /v1/facebook/auto-post (preview today's post without posting)
    if (path === 'auto-post' && request.method === 'GET') {
      return facebookAutoPostPreviewAuth(context);
    }

    // POST /v1/facebook/auto-reply — DISABLED 20 ก.ค.69
    // ระบบหลัก = starvia-autoreply-llm.py เท่านั้น (ห้ามเปิด keyword endpoint ซ้ำ)
    if (path === 'auto-reply' || path === 'auto-reply/test') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DISABLED',
          message: 'Keyword auto-reply เลิกใช้แล้ว — ใช้ Python LLM (cron) แทน',
        }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'NOT_FOUND', path }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'INTERNAL_ERROR', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
