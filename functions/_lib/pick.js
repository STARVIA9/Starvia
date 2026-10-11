// STARVIA Pick-a-Card Service — quota (1/day) + streak (consecutive days) + history
// Storage: STARVIA_KV (key: "pick:{fingerprint}")
// Fingerprint = SHA-256(UA + IP) → 16 hex (same pattern as streak.js)

import { jsonResponse, errorResponse, getClientIp } from './cors.js';
import { verifyHS256, extractBearerToken } from './jwt.js';

const DAILY_QUOTA = 1;
const HISTORY_CAP = 10;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

// ── แพ็กเครดิตหยิบเพิ่ม (PIN แยกจาก PIN สมาชิก ใช้ครั้งเดียวทิ้ง) ──
// credit_3 = โอน 19฿ = +3 หยิบ (ใช้ QR-19 เดิม) · credit_10 = โอน 49฿ = +10 หยิบ (รอ QR-49)
const CREDIT_PACKS = { credit_3: 3, credit_10: 10 };
const PINS_KEY = 'premium:pins';

// ── Auth guard: pick-a-card ต้องเป็นสมาชิกเท่านั้น ──────────────
// ยอมรับ JWT premium ที่ plan เป็น premium_fb (19฿ FB) หรือ premium_199 (เว็บหลัก)
export async function requirePickAuth(context) {
  const { request, env } = context;
  const auth = request.headers.get('authorization') || '';
  const token = extractBearerToken(auth);
  if (!token) return { ok: false, error: 'TOKEN_REQUIRED', message: 'กรุณาเข้าสู่ระบบสมาชิกก่อน', status: 401 };

  const verified = await verifyHS256(token, env.STARVIA_JWT_SECRET);
  if (!verified.valid) return { ok: false, error: 'INVALID_TOKEN', message: 'Token ไม่ถูกต้อง', status: 401 };

  const now = Math.floor(Date.now() / 1000);
  if (Number(verified.payload.exp) <= now) {
    return { ok: false, error: 'TOKEN_EXPIRED', message: 'สิทธิ์หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่', status: 401 };
  }

  const plan = verified.payload.plan || '';
  if (!['premium_fb', 'premium_199'].includes(plan)) {
    return { ok: false, error: 'PLAN_NOT_ALLOWED', message: 'สิทธิ์นี้ใช้หน้าไพ่ประจำวันไม่ได้', status: 403 };
  }

  return { ok: true, plan, payload: verified.payload };
}

// ── Pure helpers ────────────────────────────────

/** Today's key YYYY-MM-DD in Bangkok time (UTC+7) */
export function todayKey(now = new Date()) {
  return new Date(now.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

function yesterdayKey(today) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function emptyState() {
  return { quotaLeft: DAILY_QUOTA, credits: 0, streak: 0, lastPickDate: null, lastStreakDate: null, history: [] };
}

/**
 * Refresh per-day quota. If today differs from lastPickDate → reset quota to 1.
 * Credits persist across days (เติมแล้วอยู่จนกว่าจะใช้หมด).
 * Pure: returns a new state object, never mutates prev.
 */
export function refreshDaily(prev, today) {
  if (!prev) return emptyState();
  const credits = Math.max(0, Number(prev.credits) || 0);
  const isNewDay = prev.lastPickDate !== today;
  if (!isNewDay) return { ...prev, credits };
  return { ...prev, credits, quotaLeft: DAILY_QUOTA, lastPickDate: today };
}

/**
 * Spend 1 quota (โควต้าฟรีรายวันก่อน แล้วค่อยหักเครดิต), update streak, push history.
 * Assumes quota was already refreshed by the caller. Pure.
 */
export function applyDraw(prev, today, entry) {
  const streak =
    prev.lastStreakDate === today ? prev.streak
    : prev.lastStreakDate === yesterdayKey(today) ? prev.streak + 1
    : 1;
  const history = [
    { ...entry, date: new Date().toISOString() },
    ...(prev.history || []),
  ].slice(0, HISTORY_CAP);
  const credits = Math.max(0, Number(prev.credits) || 0);
  const useCredit = (prev.quotaLeft || 0) <= 0 && credits > 0;
  return {
    ...prev,
    quotaLeft: useCredit ? prev.quotaLeft : Math.max(0, (prev.quotaLeft || 0) - 1),
    credits: useCredit ? credits - 1 : credits,
    streak,
    lastPickDate: today,
    lastStreakDate: today,
    history,
  };
}

// ── KV access ───────────────────────────────────

function stateKey(fingerprint) {
  return `pick:${fingerprint}`;
}

async function readState(kv, fingerprint) {
  try {
    const data = await kv.get(stateKey(fingerprint), { type: 'json' });
    if (data && typeof data === 'object') return data;
  } catch (e) {
    // ignore → fresh state
  }
  return emptyState();
}

// ── Fingerprint (same as streak.js) ─────────────

export async function createFingerprint(request) {
  const ua = request.headers.get('user-agent') || '';
  const ip = getClientIp(request);
  const combined = `${ua}:${ip}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
  const arr = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < 8; i++) hex += arr[i].toString(16).padStart(2, '0');
  return hex;
}

// ── HTTP handlers ───────────────────────────────

/** GET /v1/pick/state — returns quota/streak/history for this member */
export async function getPickState(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');

  const auth = await requirePickAuth(context);
  if (!auth.ok) return errorResponse(auth.status, auth.error, auth.message);

  const fingerprint = await createFingerprint(request);
  const today = todayKey();

  const prev = await readState(env.STARVIA_KV, fingerprint);
  const next = refreshDaily(prev, today);
  if (next.lastPickDate !== prev.lastPickDate || prev.lastPickDate === null) {
    await env.STARVIA_KV.put(stateKey(fingerprint), JSON.stringify(next));
  }

  return jsonResponse({ success: true, ...next, today, plan: auth.plan });
}

/** POST /v1/pick/draw { topic, slug, name, emoji } — spend quota, return new state */
export async function drawPick(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');

  const auth = await requirePickAuth(context);
  if (!auth.ok) return errorResponse(auth.status, auth.error, auth.message);

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse(400, 'INVALID_JSON', 'ส่งข้อมูลไม่ถูกต้อง');
  }
  if (!body.slug) return errorResponse(400, 'MISSING_CARD', 'ไม่พบข้อมูลไพ่');

  const fingerprint = await createFingerprint(request);
  const today = todayKey();

  const prev = await readState(env.STARVIA_KV, fingerprint);
  const refreshed = refreshDaily(prev, today);
  if ((refreshed.quotaLeft || 0) <= 0 && (refreshed.credits || 0) <= 0) {
    return errorResponse(429, 'QUOTA_EXCEEDED', 'วันนี้เปิดไพ่ครบแล้ว — เติมเครดิต 19฿ หยิบเพิ่มได้อีก 3 ใบ หรือพรุ่งนี้มาใหม่นะคะ ✨');
  }

  const entry = {
    slug: body.slug,
    name: body.name || body.slug,
    emoji: body.emoji || '🃏',
    topic: body.topic || 'general',
    reading: body.reading || '',
    pos: body.pos != null ? Number(body.pos) : null,
    sub: body.sub || '',
    num: body.num || '',
    color: body.color || '',
    do: body.do || '',
    dont: body.dont || '',
  };
  const next = applyDraw(refreshed, today, entry);
  await env.STARVIA_KV.put(stateKey(fingerprint), JSON.stringify(next));

  return jsonResponse({ success: true, ...next, today });
}

// ── PIN helpers (สำเนา minimal จาก premium.js — pick.js ใช้แค่หา+ตรวจ PIN เครดิต) ──
function normalizePin(pin) {
  return String(pin || '').trim().toUpperCase();
}

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizePin(pin)));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** POST /v1/pick/redeem { pin } — เติมเครดิตหยิบเพิ่มจาก PIN แพ็ก (credit_3/credit_10) */
export async function redeemCredit(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');

  const auth = await requirePickAuth(context);
  if (!auth.ok) return errorResponse(auth.status, auth.error, auth.message);

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse(400, 'INVALID_JSON', 'ส่งข้อมูลไม่ถูกต้อง');
  }
  const pin = normalizePin(body.pin);
  if (!pin) return errorResponse(400, 'MISSING_PIN', 'กรุณากรอก PIN เครดิต');

  let store = { pins: [] };
  try {
    const data = await env.STARVIA_KV.get(PINS_KEY, { type: 'json' });
    if (data && Array.isArray(data.pins)) store = data;
  } catch (e) { /* ignore → invalid pin */ }

  const pinHash = await hashPin(pin);
  const idx = store.pins.findIndex(r => r.pinHash === pinHash);
  if (idx === -1) return errorResponse(401, 'INVALID_PIN', 'PIN เครดิตไม่ถูกต้อง');
  const record = store.pins[idx];
  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) {
    return errorResponse(410, 'PIN_EXPIRED', 'PIN นี้หมดอายุแล้ว');
  }
  if (record.usedAt) {
    return errorResponse(409, 'PIN_USED', 'PIN นี้ถูกใช้ไปแล้ว');
  }
  const added = CREDIT_PACKS[record.plan];
  if (!added) {
    return errorResponse(403, 'NOT_CREDIT_PIN', 'PIN นี้ไม่ใช่ PIN เครดิตหยิบเพิ่ม (ใช้กรอกตรงหน้าสมาชิกนะคะ)');
  }

  // PIN ถูก → ตัดใช้ครั้งเดียวทิ้ง + เติมเครดิต
  store.pins[idx] = { ...record, usedAt: new Date().toISOString() };
  await env.STARVIA_KV.put(PINS_KEY, JSON.stringify(store));

  const fingerprint = await createFingerprint(request);
  const today = todayKey();
  const prev = await readState(env.STARVIA_KV, fingerprint);
  const refreshed = refreshDaily(prev, today);
  const next = { ...refreshed, credits: (Number(refreshed.credits) || 0) + added };
  await env.STARVIA_KV.put(stateKey(fingerprint), JSON.stringify(next));

  return jsonResponse({ success: true, added, ...next, today });
}
