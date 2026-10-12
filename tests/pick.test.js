// Pick-a-Card API — quota + streak (real, KV-backed)
import { describe, expect, it } from 'vitest';
import { todayKey, refreshDaily, applyDraw, getPickState, drawPick } from '../functions/_lib/pick.js';
import { signHS256 } from '../functions/_lib/jwt.js';

const TEST_JWT_SECRET = 'test-secret-with-enough-length-for-pick';

// B (2026-09-24): pick API requires member JWT (premium_fb / premium_199)
// since PIN-credit feature. Tests must send a valid Bearer token.
async function makeMemberToken(plan = 'premium_199') {
  const now = Math.floor(Date.now() / 1000);
  return signHS256({ sub: 'test-user', plan, iat: now, exp: now + 3600 }, TEST_JWT_SECRET);
}

// ── Mock KV (implements the small subset pick.js uses) ──
function makeKV() {
  const map = new Map();
  return {
    async get(key, opts) {
      const raw = map.get(key);
      if (raw === undefined) return null;
      if (opts?.type === 'json') return JSON.parse(raw);
      return raw;
    },
    async put(key, value) {
      map.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    },
    _map: map,
  };
}

function makeContext({ method = 'GET', body = null, kv, ip = '1.2.3.4', ua = 'vitest/1.0', token = null } = {}) {
  const headers = { 'content-type': 'application/json', 'user-agent': ua };
  if (token) headers.authorization = `Bearer ${token}`;
  const init = { method, headers };
  if (body !== null) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request('https://test.local/v1/pick/state', init);
  // inject cf-connecting-ip
  Object.defineProperty(request.headers, 'get', {
    value: function (name) {
      if (name === 'cf-connecting-ip') return ip;
      return Headers.prototype.get.call(this, name);
    },
    configurable: true,
  });
  return { request, env: { STARVIA_KV: kv, STARVIA_JWT_SECRET: TEST_JWT_SECRET } };
}

// ── Pure logic ──
describe('todayKey', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('refreshDaily (quota reset per day)', () => {
  it('keeps quota when same day', () => {
    const prev = { quotaLeft: 0, streak: 2, lastPickDate: '2026-08-01', lastStreakDate: '2026-08-01', history: [] };
    const next = refreshDaily(prev, '2026-08-01');
    expect(next.quotaLeft).toBe(0);
  });

  it('resets quota to 1 on a new day', () => {
    const prev = { quotaLeft: 0, streak: 2, lastPickDate: '2026-08-01', lastStreakDate: '2026-08-01', history: [] };
    const next = refreshDaily(prev, '2026-08-02');
    expect(next.quotaLeft).toBe(1);
    expect(next.lastPickDate).toBe('2026-08-02');
  });

  it('seeds fresh state for a new user (quota 1, streak 0)', () => {
    const next = refreshDaily(null, '2026-08-01');
    expect(next.quotaLeft).toBe(1);
    expect(next.streak).toBe(0);
    expect(next.history).toEqual([]);
  });
});

describe('applyDraw (quota spend + streak + history)', () => {
  const entry = { slug: 'the_sun', name: 'The Sun', emoji: '☀️', topic: 'love' };

  it('spends 1 quota and records the card', () => {
    const prev = { quotaLeft: 1, streak: 3, lastPickDate: '2026-08-01', lastStreakDate: '2026-08-01', history: [] };
    const next = applyDraw(prev, '2026-08-02', entry);
    expect(next.quotaLeft).toBe(0);
    expect(next.history.length).toBe(1);
    expect(next.history[0].slug).toBe('the_sun');
  });

  it('increments streak when previous pick was yesterday', () => {
    const prev = { quotaLeft: 1, streak: 3, lastPickDate: '2026-08-01', lastStreakDate: '2026-08-01', history: [] };
    const next = applyDraw(prev, '2026-08-02', entry);
    expect(next.streak).toBe(4);
  });

  it('keeps streak when picking again the same day', () => {
    const prev = { quotaLeft: 1, streak: 3, lastPickDate: '2026-08-01', lastStreakDate: '2026-08-01', history: [] };
    const next = applyDraw(prev, '2026-08-01', entry);
    expect(next.streak).toBe(3);
  });

  it('resets streak to 1 after a gap of more than a day', () => {
    const prev = { quotaLeft: 1, streak: 5, lastPickDate: '2026-07-30', lastStreakDate: '2026-07-30', history: [] };
    const next = applyDraw(prev, '2026-08-01', entry);
    expect(next.streak).toBe(1);
  });

  it('caps history at 10 entries (newest first)', () => {
    const old = Array.from({ length: 10 }, (_, i) => ({ slug: `card_${i}` }));
    const prev = { quotaLeft: 1, streak: 1, lastPickDate: '2026-08-01', lastStreakDate: '2026-08-01', history: old };
    const next = applyDraw(prev, '2026-08-02', entry);
    expect(next.history.length).toBe(10);
    expect(next.history[0].slug).toBe('the_sun');
    expect(next.history[9].slug).toBe('card_8');
  });
});

// ── HTTP handlers (member JWT required) ──
describe('GET /v1/pick/state', () => {
  it('returns fresh state for a first-time user', async () => {
    const token = await makeMemberToken();
    const resp = await getPickState(makeContext({ kv: makeKV(), token }));
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.quotaLeft).toBe(1);
    expect(body.streak).toBe(0);
    expect(body.history).toEqual([]);
    expect(body.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns 401 without member token', async () => {
    const resp = await getPickState(makeContext({ kv: makeKV() }));
    expect(resp.status).toBe(401);
    expect((await resp.json()).error).toBe('TOKEN_REQUIRED');
  });

  it('keeps existing quota when queried again the same day', async () => {
    const kv = makeKV();
    const token = await makeMemberToken();
    await getPickState(makeContext({ kv, token }));
    const resp1 = await drawPick(makeContext({ method: 'POST', body: { slug: 'the_fool', name: 'The Fool', emoji: '🃏', topic: 'career' }, kv, token }));
    expect((await resp1.json()).quotaLeft).toBe(0);
    const resp2 = await getPickState(makeContext({ kv, token }));
    expect((await resp2.json()).quotaLeft).toBe(0);
  });

  it('returns 500 when KV is not bound', async () => {
    const token = await makeMemberToken();
    const resp = await getPickState(makeContext({ kv: null, token }));
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.error).toBe('KV_NOT_BOUND');
  });
});

describe('POST /v1/pick/draw', () => {
  it('draws a card and spends quota', async () => {
    const kv = makeKV();
    const token = await makeMemberToken();
    const resp = await drawPick(makeContext({
      method: 'POST',
      body: { slug: 'the_moon', name: 'The Moon', emoji: '🌙', topic: 'love' },
      kv, token,
    }));
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.quotaLeft).toBe(0);
    expect(body.streak).toBe(1);
    expect(body.history[0].slug).toBe('the_moon');
  });

  it('rejects a second draw the same day with 429 QUOTA_EXCEEDED', async () => {
    const kv = makeKV();
    const token = await makeMemberToken();
    await drawPick(makeContext({ method: 'POST', body: { slug: 'the_sun' }, kv, token }));
    const resp = await drawPick(makeContext({ method: 'POST', body: { slug: 'the_moon' }, kv, token }));
    expect(resp.status).toBe(429);
    const body = await resp.json();
    expect(body.error).toBe('QUOTA_EXCEEDED');
  });

  it('rejects a draw without slug with 400 MISSING_CARD', async () => {
    const kv = makeKV();
    const token = await makeMemberToken();
    const resp = await drawPick(makeContext({ method: 'POST', body: { topic: 'love' }, kv, token }));
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.error).toBe('MISSING_CARD');
  });

  it('different fingerprints get independent quota', async () => {
    const kv = makeKV();
    const token = await makeMemberToken();
    await drawPick(makeContext({ method: 'POST', body: { slug: 'the_sun' }, kv, ip: '1.2.3.4', token }));
    const resp = await drawPick(makeContext({ method: 'POST', body: { slug: 'the_moon' }, kv, ip: '5.6.7.8', token }));
    expect(resp.status).toBe(200);
    expect((await resp.json()).quotaLeft).toBe(0);
  });
});
