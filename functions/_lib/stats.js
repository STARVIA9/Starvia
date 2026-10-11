// STARVIA Public Stats — เลขจริงจากเพจ (KV-cache 6 ชม.)
// Token อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามเรียก Graph API จากเบราว์เซอร์ตรงๆ

const CACHE_KEY = 'stats:fb';
const CACHE_TTL = 6 * 3600; // 6 ชั่วโมง
const PAGE_ID_FALLBACK = '1071926269337612';

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

  // 1. แคชก่อน (เร็ว + ไม่เปลืองโควตา FB)
  if (kv) {
    try {
      const cached = await kv.get(CACHE_KEY, { type: 'json' });
      if (cached && cached.followers) {
        return json({ success: true, followers: cached.followers, updatedAt: cached.updatedAt, cached: true });
      }
    } catch (e) {
      // ตกไปดึงสด
    }
  }

  // 2. ดึงสดจากเพจ
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
    return json({ success: true, followers: payload.followers, updatedAt: payload.updatedAt, cached: false });
  } catch (e) {
    return json({ success: false, error: 'FB_FETCH_FAILED' }, 502);
  }
}
