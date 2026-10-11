// STARVIA Public Stats — เลขจริงจากเพจ (KV-cache 6 ชม.)
// Token อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามเรียก Graph API จากเบราว์เซอร์ตรงๆ

const CACHE_KEY = 'stats:fb';
const VISITS_KEY = 'stats:visits';
const READS_KEY = 'stats:reads';
const CACHE_TTL = 6 * 3600; // 6 ชั่วโมง
const PAGE_ID_FALLBACK = '1071926269337612';

// วันที่แบบไทย (Asia/Bangkok) — YYYY-MM-DD
function bkkDate() {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return parts; // YYYY-MM-DD
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

// GET /v1/stats/public — ไม่ต้อง auth
export async function getPublicStats(context) {
  const { env } = context;
  const kv = env.STARVIA_KV;

  // 1. แคชก่อน (เร็ว + ไม่เปลืองโควตา FB) — เช็กอายุเองด้วย กันคีย์เก่าค้างไม่มี TTL
  var fb = null;
  if (kv) {
    try {
      const cached = await kv.get(CACHE_KEY, { type: 'json' });
      if (cached && cached.followers) {
        const ageMs = Date.now() - Date.parse(cached.updatedAt || 0);
        if (ageMs >= 0 && ageMs < CACHE_TTL * 1000) {
          fb = { followers: cached.followers, updatedAt: cached.updatedAt, cached: true };
        }
      }
    } catch (e) {
      // ตกไปดึงสด
    }
  }

  // 2. ดึงสดจากเพจ (ถ้าแคชหมดอายุ)
  if (!fb) {
    const token = env.FACEBOOK_PAGE_TOKEN;
    const pageId = String(env.FACEBOOK_PAGE_ID || PAGE_ID_FALLBACK).trim();
    if (!token) return json({ success: false, error: 'NOT_CONFIGURED' }, 503);
    try {
      const r = await fetch(
        'https://graph.facebook.com/v24.0/' + pageId + '?fields=fan_count,followers_count&access_token=' + encodeURIComponent(token)
      );
      if (!r.ok) throw new Error('FB_' + r.status);
      const d = await r.json();
      const followers = d.followers_count || d.fan_count || 0;
      if (!followers) throw new Error('FB_EMPTY');
      const payload = { followers: followers, updatedAt: new Date().toISOString() };
      if (kv) {
        try {
          await kv.put(CACHE_KEY, JSON.stringify(payload), { expirationTtl: CACHE_TTL });
        } catch (e) {
          // แคชพังก็ยังตอบเลขสดได้
        }
      }
      fb = { followers: payload.followers, updatedAt: payload.updatedAt, cached: false };
    } catch (e) {
      return json({ success: false, error: 'FB_FETCH_FAILED' }, 502);
    }
  }

  // 3. ตัวเลขนับจริงของเว็บเอง
  const visits = await readCounter(kv, VISITS_KEY);
  const reads = await readCounter(kv, READS_KEY);
  return json({
    success: true,
    followers: fb.followers,
    followersUpdatedAt: fb.updatedAt,
    visitsTotal: visits.total,
    visitsToday: visits.today,
    readsTotal: reads.total,
    readsToday: reads.today,
    readsByTab: reads.tabs,
  });

// POST /v1/stats/hit — นับจริง (ไม่เก็บข้อมูลส่วนตัว มีแค่ตัวเลขรวม)
// body: { type: 'visit' | 'read', tab?: 'r0'|'r1'|'r2' }
export async function recordHit(context) {
  const { request, env } = context;
  const kv = env.STARVIA_KV;
  if (!kv) return json({ success: false, error: 'NO_KV' }, 503);
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return json({ success: false, error: 'BAD_BODY' }, 400);
  }
  const type = body.type === 'read' ? 'read' : 'visit';
  const key = type === 'read' ? READS_KEY : VISITS_KEY;
  const today = bkkDate();
  let store = { total: 0, days: {}, tabs: {} };
  try {
    const cur = await kv.get(key, { type: 'json' });
    if (cur && typeof cur.total === 'number') store = cur;
  } catch (e) {}
  store.total = (store.total || 0) + 1;
  store.days = store.days || {};
  store.days[today] = (store.days[today] || 0) + 1;
  if (type === 'read') {
    const tab = ['r0', 'r1', 'r2'].includes(body.tab) ? body.tab : 'r0';
    store.tabs = store.tabs || {};
    store.tabs[tab] = (store.tabs[tab] || 0) + 1;
  }
  // ตัดวันเก่าเกิน 60 วัน (กัน KV บวม)
  const keys = Object.keys(store.days).sort();
  while (keys.length > 60) delete store.days[keys.shift()];
  try {
    await kv.put(key, JSON.stringify(store));
  } catch (e) {
    return json({ success: false, error: 'KV_WRITE_FAILED' }, 502);
  }
  return json({ success: true, type: type, total: store.total });
}

// อ่านตัวเลขนับจริง (ไม่พังถ้า KV ว่าง)
async function readCounter(kv, key) {
  const out = { total: 0, today: 0, tabs: {} };
  if (!kv) return out;
  try {
    const cur = await kv.get(key, { type: 'json' });
    if (!cur) return out;
    out.total = cur.total || 0;
    out.today = (cur.days && cur.days[bkkDate()]) || 0;
    out.tabs = cur.tabs || {};
  } catch (e) {}
  return out;
}
