// Facebook Auto-Post — Daily Horoscope for Starvia
// Generates and posts daily horoscope content to the Starvia Facebook page.
// Targets women aged 20-32 with hook phrases in Thai.
//
// Endpoints:
//   POST /v1/facebook/auto-post → manual trigger (admin auth)
//   GET  /v1/facebook/auto-post → preview today's post (admin auth)
//
// Can also be triggered by Cloudflare cron via onRequestCron or manual POST.
//
// Brand: cosmic purple + gold (#D6AD45, #8E72D8, #09061c)
// Target: women 20-32

import { jsonResponse, errorResponse, handleOptions } from './cors.js';
import { withAdminAuth } from './admin.js';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ═══════════════════════════════════════════════════
// 🎯 Hook Phrases — Thai hooks targeting women 20-32
// ═══════════════════════════════════════════════════
const HOOK_PHRASES = [
  'เขาคนนี้ใช่มั้ย?',
  'วันนี้คุณเป็นยังไง?',
  'พร้อมเช็คดวงหรือยัง?',
  'ดวงคุณวันนี้เป็นยังไงนะ?',
  'เช็คดวงกันเถอะ ✨',
  'วันนี้มีอะไรดีๆ รออยู่มั้ย?',
  'ดวงคุณวันนี้ 🔮',
  'อยากรู้ใช่มั้ย?',
  'ดวงคุณตอนนี้!',
  'แม่นสุดๆ ไปเลย!',
  'วันนี้โชคจะเข้าข้างคุณมั้ย?',
  'เช็คดวงกับ Starvia วันนี้ 🔮✨',
  'ดวงวันนี้จะเปลี่ยนชีวิตคุณมั้ย?',
  'คุณเป็นคนแบบไหน?',
  'สิ่งที่คุณควรรู้วันนี้',
  'ดวงวันนี้จะทำให้คุณยิ้มได้!',
  'พร้อมรับข่าวดีหรือยัง?',
  'มาเช็คดวงกันเถอะ!',
  'ดวงวันนี้มีเซอร์ไพรส์!',
  'คุณคือคนที่ใช่!',
];

// ═══════════════════════════════════════════════════
// ♈ Zodiac Sign Horoscope Snippets
// ═══════════════════════════════════════════════════
const ZODIAC_SNIPPETS = {
  'aries': {
    name: 'ราศีเมษ',
    emoji: '♈',
    love: 'ความรักวันนี้สดใส อาจได้เจอคนใหม่ๆ ที่ทำให้หัวใจเต้นแรง',
    career: 'งานที่ทำอยู่จะได้รับการยอมรับมากขึ้น',
    lucky: 'สีแดง, เลข 9',
  },
  'taurus': {
    name: 'ราศีพฤษภ',
    emoji: '♉',
    love: 'คนที่คุณชอบกำลังมองคุณอยู่ อย่าลังเลที่จะเข้าหา',
    career: 'การเงินจะมีข่าวดีเข้ามา เตรียมตัวรับเลย',
    lucky: 'สีเขียว, เลข 6',
  },
  'gemini': {
    name: 'ราศีเมถุน',
    emoji: '♊',
    love: 'วันนี้คุณมีเสน่ห์มาก ใครๆ ก็อยากอยู่ใกล้',
    career: 'ความคิดสร้างสรรค์จะนำพาคุณไปสู่ความสำเร็จ',
    lucky: 'สีเหลือง, เลข 5',
  },
  'cancer': {
    name: 'ราศีกรกฎ',
    emoji: '♋',
    love: 'ความสัมพันธ์จะลึกซึ้งขึ้น เป็นวันที่ดีสำหรับคนรัก',
    career: 'ความอดทนจะทำให้คุณประสบความสำเร็จ',
    lucky: 'สีเงิน, เลข 2',
  },
  'leo': {
    name: 'ราศีสิงห์',
    emoji: '♌',
    love: 'คุณคือดาวเด่นวันนี้ ใครๆ ก็อยากอยู่ใกล้คุณ',
    career: 'ความมั่นใจจะนำพาคุณไปสู่ตำแหน่งที่ดีขึ้น',
    lucky: 'สีทอง, เลข 1',
  },
  'virgo': {
    name: 'ราศีกันย์',
    emoji: '♍',
    love: 'ความสัมพันธ์จะดีขึ้นเมื่อคุณเปิดใจมากขึ้น',
    career: 'รายละเอียดเล็กๆ จะทำให้คุณได้เปรียบ',
    lucky: 'สีน้ำตาล, เลข 7',
  },
  'libra': {
    name: 'ราศีตุลย์',
    emoji: '♎',
    love: 'ความรักวันนี้จะทำให้คุณมีความสุขมาก',
    career: 'การตัดสินใจที่ดีจะนำพาคุณไปสู่ความสำเร็จ',
    lucky: 'สีชมพู, เลข 8',
  },
  'scorpio': {
    name: 'ราศีพิจิก',
    emoji: '♏',
    love: 'ความหลงใหลวันนี้จะทำให้หัวใจคุณพองโต',
    career: 'ความมุ่งมั่นจะนำพาคุณไปสู่เป้าหมาย',
    lucky: 'สีแดงเข้ม, เลข 4',
  },
  'sagittarius': {
    name: 'ราศีธนู',
    emoji: '♐',
    love: 'การเดินทางจะทำให้คุณได้เจอคนที่ใช่',
    career: 'ความคิดใหม่ๆ จะทำให้คุณก้าวหน้า',
    lucky: 'สีม่วง, เลข 3',
  },
  'capricorn': {
    name: 'ราศีมกร',
    emoji: '♑',
    love: 'ความสัมพันธ์ที่มั่นคงจะทำให้คุณอุ่นใจ',
    career: 'ความมุ่งมั่นจะทำให้คุณบรรลุเป้าหมาย',
    lucky: 'สีดำ, เลข 10',
  },
  'aquarius': {
    name: 'ราศีกุมภ์',
    emoji: '♒',
    love: 'ความเป็นตัวของตัวเองจะทำให้คุณมีเสน่ห์',
    career: 'ความคิดสร้างสรรค์จะทำให้คุณโดดเด่น',
    lucky: 'สีฟ้า, เลข 11',
  },
  'pisces': {
    name: 'ราศีมีน',
    emoji: '♓',
    love: 'ความฝันวันนี้จะเป็นจริง ความรักจะมาหาคุณ',
    career: 'สัญชาตญาณจะนำทางคุณไปสู่ความสำเร็จ',
    lucky: 'สีม่วงอ่อน, เลข 12',
  },
};

// ═══════════════════════════════════════════════════
// 📝 Post Templates — Mix & match hook + zodiac + CTA
// ═══════════════════════════════════════════════════
const CTA_OPTIONS = [
  '📌 อยากได้คำทำนายเต็มชุด? พิมพ์ "สมัคร" รับ PIN เลยค่ะ ✨',
  '💜 อยากมีไพ่ทักทุกเช้า? สมัคร 19฿ พิมพ์ "สมัคร" เลยค่ะ',
  '💫 ไพ่ประจำวันรอคุณอยู่ สมัคร 19฿ ถูกกว่าขนม 1 ชิ้นค่ะ',
  '🔮 อยากรู้ดวงเต็ม 40+ หัวข้อ? พิมพ์ "สมัคร" รับ PIN เลยค่ะ',
  '✨ สมัคร 19฿ มีไพ่ทุกเช้า พิมพ์ "สมัคร" ได้เลยค่ะ',
  '💎 แบบจัดเต็ม 199฿ รายงานเต็ม+เลข 3 ชุด พิมพ์ "สมัคร" ค่ะ',
  '🌙 เธอสมควรได้คำตอบของตัวเอง พิมพ์ "สมัคร" รับ PIN ค่ะ',
  '⭐ ลองเอง 19฿ มีไพ่ทักทุกเช้า พิมพ์ "สมัคร" เลยค่ะ',
];

const DIVIDER = '━━━━━━━━━━━━━━━━━━';

// ═══════════════════════════════════════════════════
// 🎯 Generate Daily Horoscope Post
// ═══════════════════════════════════════════════════

/**
 * Get today's date key (Asia/Bangkok timezone)
 */
function getTodayKey() {
  const now = new Date();
  const bangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  return bangkok.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Simple seeded random for deterministic daily posts
 */
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  // Mulberry32
  return function () {
    h |= 0;
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a daily horoscope post
 * @returns {{ message: string, hook: string, zodiacKey: string, date: string }}
 */
export function generateDailyPost() {
  const date = getTodayKey();
  const rand = seededRandom(date);

  // Pick a random hook phrase (deterministic per day)
  const hookIdx = Math.floor(rand() * HOOK_PHRASES.length);
  const hook = HOOK_PHRASES[hookIdx];

  // Pick a random zodiac sign (deterministic per day)
  const zodiacKeys = Object.keys(ZODIAC_SNIPPETS);
  const zodiacIdx = Math.floor(rand() * zodiacKeys.length);
  const zodiacKey = zodiacKeys[zodiacIdx];
  const zodiac = ZODIAC_SNIPPETS[zodiacKey];

  // Pick a random CTA (deterministic per day)
  const ctaIdx = Math.floor(rand() * CTA_OPTIONS.length);
  const cta = CTA_OPTIONS[ctaIdx];

  // Pick a random template style
  const templateStyle = Math.floor(rand() * 3);

  let message;

  switch (templateStyle) {
    case 0: // Full horoscope
      message = [
        `${hook}`,
        ``,
        `${zodiac.emoji} ดวงวันนี้ - ${zodiac.name}`,
        ``,
        `💕 ความรัก: ${zodiac.love}`,
        `💼 การงาน: ${zodiac.career}`,
        `🍀 เลขนำโชค: ${zodiac.lucky}`,
        ``,
        `${DIVIDER}`,
        ``,
        `${cta}`,
        ``,
        `#Starvia #ดวงวันนี้ #${zodiac.name}`,
      ].join('\n');
      break;

    case 1: // Love focus (targets women 20-32 better)
      message = [
        `${hook}`,
        ``,
        `${zodiac.emoji} ดวงความรักวันนี้ - ${zodiac.name}`,
        ``,
        `💕 ${zodiac.love}`,
        ``,
        `${zodiac.lucky}`,
        ``,
        `${DIVIDER}`,
        ``,
        `${cta}`,
        ``,
        `#Starvia #ดวงความรัก #${zodiac.name}`,
      ].join('\n');
      break;

    case 2: // Quick & punchy
      message = [
        `${hook}`,
        ``,
        `${zodiac.emoji} ${zodiac.name} วันนี้`,
        ``,
        `${zodiac.love}`,
        ``,
        `🍀 ${zodiac.lucky}`,
        ``,
        `${cta}`,
        ``,
        `#Starvia #ดวงวันนี้`,
      ].join('\n');
      break;
  }

  return {
    message,
    hook,
    zodiacKey,
    zodiacName: zodiac.name,
    date,
  };
}

// ═══════════════════════════════════════════════════
// 📤 Post to Facebook via Graph API
// ═══════════════════════════════════════════════════

function getConfig(env) {
  const token = env.FACEBOOK_PAGE_TOKEN;
  const pageId = String(env.FACEBOOK_PAGE_ID || '').trim();
  if (!token) throw new Error('FACEBOOK_PAGE_TOKEN not set in env');
  if (!pageId) throw new Error('FACEBOOK_PAGE_ID not set in env');
  return { token, pageId };
}

/**
 * Post a text message to the Facebook page feed
 * @returns {{ success: boolean, post_id?: string, url?: string, error?: string }}
 */
async function postToFacebook(env, message) {
  const { token, pageId } = getConfig(env);

  const endpoint = `/${pageId}/feed`;
  const payload = {
    message,
    published: 'true',
    access_token: token,
  };

  const formBody = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    formBody.append(k, String(v));
  }

  const fbUrl = `${GRAPH_BASE}${endpoint}`;
  const resp = await fetch(fbUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  });

  const data = await resp.json();

  if (!resp.ok || data.error) {
    return {
      success: false,
      error: data.error?.message || 'Unknown Facebook API error',
      errorCode: data.error?.code,
    };
  }

  // Facebook returns id like "pageid_postid"
  const postId = data.id || data.post_id;
  const postUrl = postId
    ? `https://facebook.com/${postId.includes('_') ? postId.split('_')[0] : pageId}/posts/${postId.includes('_') ? postId.split('_')[1] : postId}`
    : null;

  return {
    success: true,
    post_id: postId,
    url: postUrl,
  };
}

// ═══════════════════════════════════════════════════
// 🎯 Auto-Post Handler
// ═══════════════════════════════════════════════════

/**
 * Main auto-post function — can be triggered manually or by cron.
 * Uses admin auth for manual triggers.
 */
async function handleAutoPost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  try {
    const date = getTodayKey();

    // Dedup: check if we already posted today (via KV)
    const dedupKey = `fb:auto-post:${date}`;
    let alreadyPosted = false;
    try {
      const existing = await env.STARVIA_KV?.get(dedupKey, { type: 'json' });
      if (existing?.success) {
        alreadyPosted = true;
        return jsonResponse({
          success: true,
          alreadyPosted: true,
          message: 'Already posted today',
          date,
          existingPost: existing,
        });
      }
    } catch { /* KV may not be available */ }

    // Generate the post
    const post = generateDailyPost();

    // Post to Facebook
    const fbResult = await postToFacebook(env, post.message);

    if (!fbResult.success) {
      return jsonResponse({
        success: false,
        error: 'FB_POST_FAILED',
        fbError: fbResult.error,
        fbErrorCode: fbResult.errorCode,
        date: post.date,
        hook: post.hook,
        zodiac: post.zodiacName,
      }, 502);
    }

    // Save to KV for dedup
    const result = {
      success: true,
      date: post.date,
      hook: post.hook,
      zodiacKey: post.zodiacKey,
      zodiacName: post.zodiacName,
      post_id: fbResult.post_id,
      url: fbResult.url,
      message: post.message,
      postedAt: new Date().toISOString(),
    };

    try {
      await env.STARVIA_KV?.put(dedupKey, JSON.stringify(result), {
        expirationTtl: 86400 * 2, // 2 days TTL
      });
    } catch { /* non-critical */ }

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

/**
 * Preview handler — shows what would be posted without actually posting.
 */
async function handleAutoPostPreview(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const post = generateDailyPost();

  return jsonResponse({
    success: true,
    preview: true,
    date: post.date,
    hook: post.hook,
    zodiacKey: post.zodiacKey,
    zodiacName: post.zodiacName,
    message: post.message,
    messageLength: post.message.length,
  });
}

// ═══════════════════════════════════════════════════
// 🔐 Auth-wrapped exports
// ═══════════════════════════════════════════════════
export const facebookAutoPostAuth = (context) => withAdminAuth(context, handleAutoPost);
export const facebookAutoPostPreviewAuth = (context) => withAdminAuth(context, handleAutoPostPreview);

// Also export raw handlers for cron (no auth required when called from Cloudflare cron)
export { handleAutoPost as facebookAutoPostCron };
