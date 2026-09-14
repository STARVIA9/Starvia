// STARVIA Real Stats — เลขจริงทั้งหมด (นับใน STARVIA_KV + ดึง FB Graph)
// แทนที่ตัวเลขสุ่มใน social-proof.js (totalBase/todayVariance/satisfaction ฯลฯ)
//
// Counters (KV):
//   stats:reports:total          — เปิดรายงานดูดวงสะสม (frontend ping ครั้งเดียวตอนรายงานขึ้น)
//   stats:reports:YYYY-MM-DD     — เปิดรายงานรายวัน
//   stats:draws:total            — หยิบไพ่สะสม (นับใน drawPick สำเร็จ)
//   stats:premium:total          — ปลดล็อกพรีเมียมสะสม (นับใน verify/redeem สำเร็จ)
//   stats:votes:up / :down       — โหวต "ตรงไหม" สะสม
//   stats:voted:{day}:{iphash}   — กันโหวตซ้ำ (1 IP = 1 โหวต/วัน)
//   stats:fb                     — แคช {followers, comments[], updatedAt} อายุ 24 ชม.

import { jsonResponse, errorResponse, getClientIp } from './cors.js';

const GRAPH_VERSION = 'v22.0';
const FB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_VOTES_FOR_PCT = 3; // โหวตน้อยกว่า 3 → ไม่โชว์ % (ฐานน้อยไป)

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function getNum(kv, key) {
  const v = await kv.get(key);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function incr(kv, key) {
  const n = (await getNum(kv, key)) + 1;
  await kv.put(key, String(n));
  return n;
}

// hash IP แบบง่าย (ไม่เก็บ IP ดิบใน KV)
function hashIp(ip, salt) {
  const s = `${salt}:${ip}`;
  let h1 = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h1 ^= s.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return h1.toString(36);
}

export async function incrCounter(env, name, amount = 1) {
  if (!env.STARVIA_KV) return null;
  const key = `stats:${name}`;
  const n = (await getNum(env.STARVIA_KV, key)) + amount;
  await env.STARVIA_KV.put(key, String(n));
  return n;
}

// ── POST /v1/stats/event {type:'report'} ──
// frontend ยิงครั้งเดียวตอนรายงานแสดงผลสำเร็จ (กันยิงซ้ำฝั่ง frontend ด้วย flag)
export async function recordEvent(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse(400, 'BAD_JSON', 'ส่ง {type:"report"} มาด้วย');
  }
  if (body.type !== 'report') {
    return errorResponse(400, 'BAD_TYPE', 'type ที่นับได้ตอนนี้: report');
  }
  const total = await incr(env.STARVIA_KV, 'stats:reports:total');
  const today = await incr(env.STARVIA_KV, `stats:reports:${dayKey()}`);
  return jsonResponse({ success: true, total, today });
}

// ── POST /v1/stats/vote {vote:'up'|'down'} ──
// 1 IP = 1 โหวต/วัน (กันปั๊มคะแนน)
export async function recordVote(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse(400, 'BAD_JSON', 'ส่ง {vote:"up"|"down"} มาด้วย');
  }
  if (body.vote !== 'up' && body.vote !== 'down') {
    return errorResponse(400, 'BAD_VOTE', 'vote ต้องเป็น up หรือ down');
  }
  const ip = getClientIp(request);
  const salt = env.STARVIA_JWT_SECRET || env.STARVIA_ADMIN_JWT_SECRET || 'starvia-stats';
  const day = dayKey();
  const seenKey = `stats:voted:${day}:${hashIp(ip, salt)}`;
  if (await env.STARVIA_KV.get(seenKey)) {
    const s = await readPublicCounters(env);
    return jsonResponse({ success: false, error: 'ALREADY_VOTED', message: 'โหวตวันนี้แล้ว ขอบคุณค่ะ', ...s });
  }
  await incr(env.STARVIA_KV, body.vote === 'up' ? 'stats:votes:up' : 'stats:votes:down');
  await env.STARVIA_KV.put(seenKey, '1', { expirationTtl: 2 * 24 * 60 * 60 });
  const s = await readPublicCounters(env);
  return jsonResponse({ success: true, message: 'ขอบคุณสำหรับคะแนนค่ะ', ...s });
}

async function readPublicCounters(env) {
  const kv = env.STARVIA_KV;
  const [reportsTotal, reportsToday, drawsTotal, premiumTotal, votesUp, votesDown] = await Promise.all([
    getNum(kv, 'stats:reports:total'),
    getNum(kv, `stats:reports:${dayKey()}`),
    getNum(kv, 'stats:draws:total'),
    getNum(kv, 'stats:premium:total'),
    getNum(kv, 'stats:votes:up'),
    getNum(kv, 'stats:votes:down'),
  ]);
  const votesTotal = votesUp + votesDown;
  const ratingPct =
    votesTotal >= MIN_VOTES_FOR_PCT ? Math.round((votesUp / votesTotal) * 1000) / 10 : null;
  return { reportsTotal, reportsToday, drawsTotal, premiumTotal, votesUp, votesDown, votesTotal, ratingPct };
}

// ── Facebook: ยอดผู้ติดตาม + คอมเมนต์ล่าสุด (แคช 24 ชม) ──
async function fetchFbData(env) {
  const token = env.FACEBOOK_PAGE_TOKEN;
  const pageId = String(env.FACEBOOK_PAGE_ID || '').trim();
  if (!token || !pageId) return { followers: null, comments: [], fbError: 'FB_NOT_CONFIGURED' };
  try {
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const pageResp = await fetch(
      `${base}/${pageId}?fields=followers_count,fan_count&access_token=${encodeURIComponent(token)}`
    );
    const page = await pageResp.json();
    const followers = pageResp.ok ? page.followers_count ?? page.fan_count ?? null : null;

    const comments = [];
    try {
      const postsResp = await fetch(
        `${base}/${pageId}/posts?fields=created_time,comments.limit(20){message,from{name},created_time}&limit=6&access_token=${encodeURIComponent(token)}`
      );
      const posts = await postsResp.json();
      if (postsResp.ok && Array.isArray(posts.data)) {
        for (const p of posts.data) {
          const list = p.comments?.data || [];
          for (const c of list) {
            const text = String(c.message || '').trim();
            if (text.length < 2) continue;
            comments.push({
              name: c.from?.name || 'ผู้ติดตาม',
              text: text.slice(0, 300),
              time: c.created_time || null,
            });
          }
        }
        comments.sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
      }
    } catch (e) {
      // อ่านคอมเมนต์ไม่ได้ → คืนเฉพาะยอดผู้ติดตาม
    }
    return { followers, comments: comments.slice(0, 8), updatedAt: new Date().toISOString() };
  } catch (e) {
    return { followers: null, comments: [], fbError: String(e.message || e).slice(0, 120) };
  }
}

async function getFbCached(env) {
  const kv = env.STARVIA_KV;
  let cached = null;
  try {
    cached = await kv.get('stats:fb', { type: 'json' });
  } catch (e) {
    cached = null;
  }
  const stale =
    !cached || !cached.updatedAt || Date.now() - new Date(cached.updatedAt).getTime() > FB_CACHE_TTL_MS;
  if (!stale) return cached;
  const fresh = await fetchFbData(env);
  // กันแคชเสียทับของดี: ถ้าดึงล้มเหลวและเคยมีของเก่า → ใช้ของเก่าต่อ
  if ((fresh.followers == null && fresh.comments.length === 0) && cached) return cached;
  try {
    await kv.put('stats:fb', JSON.stringify(fresh));
  } catch (e) {
    // แคชไม่ได้ก็คืนข้อมูลสดไป
  }
  return fresh;
}

// ── GET /v1/stats/public ──
export async function getPublicStats(context) {
  const { env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');
  const counters = await readPublicCounters(env);
  const fb = await getFbCached(env);
  return jsonResponse({
    success: true,
    ...counters,
    fbFollowers: fb.followers ?? null,
    fbUpdatedAt: fb.updatedAt || null,
    comments: fb.comments || [],
  });
}
