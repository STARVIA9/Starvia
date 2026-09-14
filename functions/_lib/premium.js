// STARVIA Premium Service — Cloudflare Pages Functions + KV
// Replaces api/premium-service.mjs
// Storage: STARVIA_KV (key: "premium:pins" — JSON array)
// Auth: HS256 JWT (env.STARVIA_JWT_SECRET)

import { signHS256, verifyHS256, extractBearerToken } from './jwt.js';

const PINS_KEY = 'premium:pins';
const DEFAULT_TTL = 24 * 60 * 60; // 24h
const DEFAULT_PLAN = 'premium_199';
const PIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function readPinStore(kv) {
  try {
    const data = await kv.get(PINS_KEY, { type: 'json' });
    if (data && Array.isArray(data.pins)) return data;
  } catch (e) {
    // ignore
  }
  return { pins: [] };
}

async function writePinStore(kv, store) {
  await kv.put(PINS_KEY, JSON.stringify(store));
}

function normalizePin(pin) {
  return String(pin || '').trim().toUpperCase();
}

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizePin(pin)));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generatePin() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let pin = 'STAR-';
  for (let i = 0; i < 8; i++) {
    pin += PIN_ALPHABET[bytes[i] % PIN_ALPHABET.length];
  }
  return pin;
}

async function findPinByHash(store, pin) {
  const pinHash = await hashPin(pin);
  return store.pins.findIndex(r => r.pinHash === pinHash);
}

// POST /v1/premium/verify { pin: "STAR-XXXX-XXXX" }
export async function verifyPremiumPin(context) {
  const { request, env } = context;

  if (!env.STARVIA_JWT_SECRET) {
    return json({ success: false, error: 'PREMIUM_NOT_CONFIGURED', message: 'ระบบ Premium ยังไม่พร้อมใช้งาน' }, 503);
  }
  if (!env.STARVIA_KV) {
    return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON', message: 'รูปแบบคำขอไม่ถูกต้อง' }, 400);
  }

  const pin = normalizePin(body.pin);
  if (!pin) {
    return json({ success: false, error: 'INVALID_PIN', message: 'รหัสผ่านไม่ถูกต้อง' }, 400);
  }

  const store = await readPinStore(env.STARVIA_KV);
  const idx = await findPinByHash(store, pin);

  if (idx === -1) {
    return json({ success: false, error: 'INVALID_PIN', message: 'รหัสผ่านไม่ถูกต้อง' }, 401);
  }

  const record = store.pins[idx];

  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) {
    return json({ success: false, error: 'PIN_EXPIRED', message: 'รหัสนี้หมดอายุแล้ว' }, 410);
  }

  // If PIN already used, re-issue token (allows re-entry on new devices/browsers)
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = Number(env.STARVIA_TOKEN_TTL_SECONDS || DEFAULT_TTL);
  const expiresAt = issuedAt + expiresIn;
  const plan = record.plan || env.STARVIA_PREMIUM_PLAN || DEFAULT_PLAN;

  // Mark as used (update usedAt if first use, keep existing if re-issue)
  if (!record.usedAt) {
    store.pins[idx] = {
      ...record,
      plan,
      usedAt: new Date(issuedAt * 1000).toISOString(),
    };
    await writePinStore(env.STARVIA_KV, store);
  }

  const token = await signHS256(
    {
      sub: `pin_${(await hashPin(pin)).slice(0, 16)}`,
      plan,
      iat: issuedAt,
      exp: expiresAt,
    },
    env.STARVIA_JWT_SECRET
  );

  try {
    const { incrCounter } = await import('./stats.js');
    await incrCounter(context.env, 'premium:total');
  } catch (e) { /* นับสถิติพลาดต้องไม่ทำให้ปลดล็อกพรีเมียมล้ม */ }
  return json({
    success: true,
    token,
    expiresIn,
    plan,
  });
}

// GET /v1/premium/status — Authorization: Bearer <token>
export async function checkPremiumStatus(context) {
  const { request, env } = context;
  if (!env.STARVIA_JWT_SECRET) {
    return json({ active: false, error: 'PREMIUM_NOT_CONFIGURED' }, 503);
  }
  const auth = request.headers.get('authorization') || '';
  const token = extractBearerToken(auth);
  if (!token) {
    return json({ active: false, error: 'TOKEN_REQUIRED', message: 'กรุณาเข้าสู่ระบบ Premium อีกครั้ง' }, 401);
  }
  const verified = await verifyHS256(token, env.STARVIA_JWT_SECRET);
  if (!verified.valid) {
    return json({ active: false, error: verified.error, message: 'Token Premium ไม่ถูกต้อง' }, 401);
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(verified.payload.exp) <= now) {
    return json({ active: false, error: 'TOKEN_EXPIRED', message: 'สิทธิ์ Premium หมดอายุแล้ว' }, 401);
  }
  return json({
    active: true,
    plan: verified.payload.plan || env.STARVIA_PREMIUM_PLAN || DEFAULT_PLAN,
    expiresAt: new Date(Number(verified.payload.exp) * 1000).toISOString(),
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
