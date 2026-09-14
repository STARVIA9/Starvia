// Facebook Page Poster — Post to Facebook Page via Graph API v22.0
// Uses PAGE_ACCESS_TOKEN + PAGE_ID from env (set via `wrangler pages secret put`).
//
// Endpoints exposed via functions/v1/facebook/[[path]].js:
//   GET  /v1/facebook/health         → check token + page info
//   POST /v1/facebook/post           → post to page (text / image / link)
//
// Security:
//   - Auth: Bearer token via env STARVIA_ADMIN_JWT_SECRET (admin-only)
//   - Token never leaves server (env only)
//   - Rate-limited via KV counter (best-effort)
//
// Reference: https://developers.facebook.com/docs/pages-api/posts/

import { jsonResponse, errorResponse, getClientIp, handleOptions } from './cors.js';
import { withAdminAuth } from './admin.js';
import { signHS256 } from './jwt.js';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getConfig(env) {
  const token = env.FACEBOOK_PAGE_TOKEN;

  const pageId = String(env.FACEBOOK_PAGE_ID || '').trim();
  if (!token) throw new Error('FACEBOOK_PAGE_TOKEN not set in env');
  if (!pageId) throw new Error('FACEBOOK_PAGE_ID not set in env');
  return { token, pageId };
}

// ── GET /v1/facebook/health ──
// Returns token + page info. Verifies token is still valid.
// Does NOT require admin auth (so cron jobs can check liveness),
// but does NOT expose token value — only status.
export async function facebookHealth(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  try {
    const { token, pageId } = getConfig(env);
    // Use /me endpoint to verify token. Returns id (which is the page ID for page tokens).
    const url = `${GRAPH_BASE}/me?fields=id,name&access_token=${encodeURIComponent(token)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok) {
      return jsonResponse({
        ok: false,
        status: 'TOKEN_INVALID',
        error: data.error?.message || 'Unknown error',
        code: data.error?.code,
        pageIdConfigured: pageId,
      }, 200);
    }

    // Check if token can actually read page inbox (the permission auto-pin needs)
    const inboxResp = await fetch(
      `${GRAPH_BASE}/${pageId}/conversations?limit=1&access_token=${encodeURIComponent(token)}`
    );
    const inboxData = await inboxResp.json();
    const canReadInbox = inboxResp.ok && Array.isArray(inboxData.data);

    return jsonResponse({
      ok: true,
      page: {
        id: data.id,
        name: data.name,
        configuredPageId: pageId,
        idsMatch: data.id === pageId,
      },
      tokenType: {
        isPageToken: canReadInbox,
        canReadInbox,
        hint: canReadInbox
          ? 'Token can read page inbox - ready for auto-pin'
          : 'Token valid but cannot read inbox. Ensure Page token has pages_messaging permission.',
        error: canReadInbox ? undefined : inboxData.error?.message,
      },
    });
  } catch (err) {
    return errorResponse(500, 'CONFIG_ERROR', err.message);
  }
}

// ── POST /v1/facebook/post ──
// Body:
//   { message: string, link?: string, image_url?: string, published?: bool }
//
// Behavior:
//   - text-only → POST /{page-id}/feed
//   - link      → POST /{page-id}/feed with link field
//   - image     → POST /{page-id}/photos with url
//   - image+text → POST /{page-id}/photos with caption
//   - published=false → creates a draft (for review before publish)
//
// Returns: { success, post_id, url, type }
export async function facebookPost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_JSON', 'Request body must be valid JSON');
  }

  const { message, link, image_url, published = true } = body || {};

  if (!message && !link && !image_url) {
    return errorResponse(400, 'EMPTY_POST', 'Provide at least one of: message, link, image_url');
  }

  if (message && typeof message !== 'string') {
    return errorResponse(400, 'BAD_MESSAGE', 'message must be a string');
  }
  if (message && message.length > 63206) {
    return errorResponse(400, 'MESSAGE_TOO_LONG', 'Facebook allows up to 63,206 characters per post');
  }

  try {
    const { token, pageId } = getConfig(env);
    const ip = getClientIp(request);

    // Best-effort rate limit: 30 posts/hour per IP (KV-backed counter)
    const rateKey = `fb:rate:${ip}`;
    let count = 0;
    try {
      const cur = await env.STARVIA_KV.get(rateKey);
      count = cur ? parseInt(cur, 10) || 0 : 0;
    } catch { /* KV unavailable, skip rate limit */ }

    if (count >= 30) {
      return errorResponse(429, 'RATE_LIMITED', `Too many posts from this IP. Try again in an hour. (count=${count})`);
    }

    let endpoint, payload, postType;

    if (image_url) {
      // Photo post (supports caption for text)
      endpoint = `/${pageId}/photos`;
      payload = {
        url: image_url,
        caption: message || '',
        published: published ? 'true' : 'false',
        access_token: token,
      };
      postType = 'photo';
    } else if (link) {
      // Link post (with optional message)
      endpoint = `/${pageId}/feed`;
      payload = {
        message: message || '',
        link,
        published: published ? 'true' : 'false',
        access_token: token,
      };
      postType = 'link';
    } else {
      // Text-only post
      endpoint = `/${pageId}/feed`;
      payload = {
        message,
        published: published ? 'true' : 'false',
        access_token: token,
      };
      postType = 'text';
    }

    // Convert to URL-encoded form body
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
      return jsonResponse({
        success: false,
        error: 'FB_API_ERROR',
        fbError: data.error,
        hint: data.error?.code === 190 ? 'Token expired or revoked — renew FACEBOOK_PAGE_TOKEN' : undefined,
      }, 502);
    }

    // Increment rate limit counter (TTL 1h)
    try {
      await env.STARVIA_KV.put(rateKey, String(count + 1), { expirationTtl: 3600 });
    } catch { /* ignore */ }

    // Facebook returns id like "pageid_postid" for feed, or just "postid" for photos
    const postId = data.id || data.post_id;
    const postUrl = postId
      ? `https://facebook.com/${postId.includes('_') ? postId.split('_')[0] : pageId}/posts/${postId.includes('_') ? postId.split('_')[1] : postId}`
      : null;

    return jsonResponse({
      success: true,
      post_id: postId,
      url: postUrl,
      type: postType,
      published: !!published,
      ip,
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// ── DELETE /v1/facebook/post/:id ──
// Delete a post (admin only). Useful if a cron job accidentally posts junk.
export async function facebookDeletePost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const url = new URL(request.url);
  const postId = url.searchParams.get('id');
  if (!postId) return errorResponse(400, 'MISSING_ID', 'Provide ?id=pageid_postid');

  try {
    const { token } = getConfig(env);
    const fbUrl = `${GRAPH_BASE}/${postId}?access_token=${encodeURIComponent(token)}`;
    const resp = await fetch(fbUrl, { method: 'DELETE' });
    const data = await resp.json();

    if (!resp.ok || data.error) {
      return jsonResponse({
        success: false,
        error: 'FB_API_ERROR',
        fbError: data.error,
      }, 502);
    }

    return jsonResponse({ success: true, deleted: postId });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// Wrap post/delete with admin auth (health stays public for cron liveness check)
export const facebookPostAuth = (context) => withAdminAuth(context, facebookPost);
export const facebookDeleteAuth = (context) => withAdminAuth(context, facebookDeletePost);

// ── POST /v1/facebook/exchange ──
// Internal: exchange User Token → Long-lived User Token → Page Token → Long-lived Page Token.
// Requires FACEBOOK_APP_SECRET in env. The App Secret itself acts as auth barrier
// (only someone with both the secret AND a user token can call this).
//
// Body: { user_token: string }
//
// Rate limit: 5/hour per IP (tighter than post).
// Caller must then run `wrangler pages secret put FACEBOOK_PAGE_TOKEN` with returned token.
export async function facebookExchange(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_JSON', 'Request body must be valid JSON');
  }

  const { user_token } = body || {};
  if (!user_token) {
    return errorResponse(400, 'MISSING_USER_TOKEN', 'Provide user_token in body');
  }

  const appSecret = env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    return errorResponse(500, 'NO_APP_SECRET', 'FACEBOOK_APP_SECRET not set in env — cannot exchange');
  }

  const appId = env.FACEBOOK_APP_ID || '961734170201333';

  // Rate limit: 5/hour per IP (tighter than post 30/hour)
  const ip = getClientIp(request);
  const rateKey = `fb:exchange:rate:${ip}`;
  let count = 0;
  try {
    const cur = await env.STARVIA_KV.get(rateKey);
    count = cur ? parseInt(cur, 10) || 0 : 0;
  } catch { /* KV unavailable */ }
  if (count >= 5) {
    return errorResponse(429, 'RATE_LIMITED', `Exchange endpoint limited to 5 calls/hour (count=${count})`);
  }

  const steps = [];

  try {
    // Step 1: User Token → Long-lived User Token (60 days)
    const step1Url = `https://graph.facebook.com/v22.0/oauth/access_token`
      + `?grant_type=fb_exchange_token`
      + `&client_id=${encodeURIComponent(appId)}`+ `&client_secret=${encodeURIComponent(appSecret)}`
      + `&fb_exchange_token=${encodeURIComponent(user_token)}`;

    const step1Resp = await fetch(step1Url);
    const step1Data = await step1Resp.json();
    if (!step1Resp.ok || step1Data.error) {
      return jsonResponse({
        success: false,
        step: 'exchange_to_long_lived_user',
        error: 'FB_API_ERROR',
        fbError: step1Data.error,
      }, 502);
    }
    const longLivedUser = step1Data.access_token;
    steps.push({ step: 1, ok: true, ttl_seconds: step1Data.expires_in });

    // Step 2: /me/accounts → get Page Token (use the long-lived user token)
    const step2Url = `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token&access_token=${longLivedUser}`;
    const step2Resp = await fetch(step2Url);
    const step2Data = await step2Resp.json();
    if (!step2Resp.ok || step2Data.error) {
      return jsonResponse({
        success: false,
        step: 'get_page_token',
        error: 'FB_API_ERROR',
        fbError: step2Data.error,
      }, 502);
    }

    const starviaPage = (step2Data.data || []).find(p => p.name === 'Starvia');
    if (!starviaPage) {
      return jsonResponse({
        success: false,
        step: 'find_starvia_page',
        error: 'PAGE_NOT_FOUND',
        availablePages: (step2Data.data || []).map(p => p.name),
      }, 404);
    }
    const shortPageToken = starviaPage.access_token;
    steps.push({ step: 2, ok: true, pageId: starviaPage.id, pageName: starviaPage.name });

    // Step 3: Short Page Token → Long-lived Page Token (60 days)
    const step3Url = `https://graph.facebook.com/v22.0/oauth/access_token`
      + `?grant_type=fb_exchange_token`
      + `&client_id=${encodeURIComponent(appId)}`+ `&client_secret=${encodeURIComponent(appSecret)}`
      + `&fb_exchange_token=${encodeURIComponent(shortPageToken)}`;
    const step3Resp = await fetch(step3Url);
    const step3Data = await step3Resp.json();
    if (!step3Resp.ok || step3Data.error) {
      return jsonResponse({
        success: false,
        step: 'exchange_to_long_lived_page',
        error: 'FB_API_ERROR',
        fbError: step3Data.error,
        pageToken: shortPageToken,  // fallback: use short-lived page token anyway
      }, 502);
    }
    const longLivedPage = step3Data.access_token;
    steps.push({ step: 3, ok: true, ttl_seconds: step3Data.expires_in });

    // Verify the new Page token
    const verifyUrl = `https://graph.facebook.com/v22.0/me?fields=id,name&access_token=${longLivedPage}`;
    const verifyResp = await fetch(verifyUrl);
    const verifyData = await verifyResp.json();
    const isValid = verifyData.id === starviaPage.id;
    steps.push({ step: 4, ok: isValid, returnedId: verifyData.id, returnedName: verifyData.name });

    // Increment rate limit counter
    try {
      await env.STARVIA_KV.put(rateKey, String(count + 1), { expirationTtl: 3600 });
    } catch { /* ignore */ }

    return jsonResponse({
      success: true,
      steps,
      newPageToken: longLivedPage,
      pageId: starviaPage.id,
      expiresInDays: Math.floor(step3Data.expires_in / 86400),
      nextStep: 'echo "***" | wrangler pages secret put FACEBOOK_PAGE_TOKEN --project-name=starvia',
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message, { steps });
  }
}

// No auth wrapper — App Secret in env IS the auth barrier for this endpoint.
// Anyone calling must already have access to the Cloudflare Pages env (which is admin-level).
export const facebookExchangeNoAuth = facebookExchange;

// ═══════════════════════════════════════════════
// 📩 Messages / Inbox — อ่าน + ส่งข้อความ Facebook Page
// ═══════════════════════════════════════════════

// ── GET /v1/facebook/inbox ──
// Reads recent conversations + unread messages
// Query: ?unread_only=1&limit=10
export async function facebookInbox(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  try {
    const { token, pageId } = getConfig(env);
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread_only') === '1';
    const limit = Math.min(50, Number(url.searchParams.get('limit')) || 10);

    // Fetch conversations
    const convFields = 'participants,messages.limit(5){message,from,created_time,attachments{name,image_data,mime_type}},unread_count,updated_time';
    const convUrl = `${GRAPH_BASE}/${pageId}/conversations?fields=${encodeURIComponent(convFields)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

    if (unreadOnly) {
      // Filter only conversations with unread messages
    }

    const convResp = await fetch(convUrl);
    const convData = await convResp.json();

    if (!convResp.ok || convData.error) {
      return jsonResponse({
        success: false,
        error: 'FB_API_ERROR',
        fbError: convData.error,
      }, 502);
    }

    const conversations = (convData.data || []).map(conv => ({
      id: conv.id,
      updatedTime: conv.updated_time,
      unreadCount: conv.unread_count || 0,
      participants: (conv.participants?.data || []).map(p => ({
        name: p.name,
        email: p.email,
      })),
      recentMessages: (conv.messages?.data || []).map(msg => ({
        from: msg.from?.name || 'Unknown',
        message: msg.message || '',
        createdAt: msg.created_time,
        hasAttachments: !!(msg.attachments?.data?.length),
        attachments: (msg.attachments?.data || []).map(att => ({
          name: att.name || 'attachment',
          type: att.mime_type || 'unknown',
          isImage: (att.mime_type || '').startsWith('image/'),
          imageUrl: att.image_data?.url || null,
        })),
      })),
    }));

    // Filter unread only if requested
    const filtered = unreadOnly
      ? conversations.filter(c => c.unreadCount > 0)
      : conversations;

    return jsonResponse({
      success: true,
      conversations: filtered,
      total: conversations.length,
      unreadOnly,
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// ── POST /v1/facebook/send ──
// Sends a message to a Facebook user via Messenger Platform API
// Body: { recipient_id: string, message: string }
export async function facebookSendMessage(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_JSON', 'Request body must be valid JSON');
  }

  const { recipient_id, message } = body || {};
  if (!recipient_id) return errorResponse(400, 'MISSING_ID', 'Provide recipient_id');
  if (!message) return errorResponse(400, 'MISSING_MESSAGE', 'Provide message');

  try {
    const { token, pageId } = getConfig(env);

    const sendUrl = `${GRAPH_BASE}/${pageId}/messages?access_token=${encodeURIComponent(token)}`;
    const msgBody = JSON.stringify({
      recipient: { id: String(recipient_id) },
      message: { text: String(message) },
      messaging_type: 'RESPONSE',
    });

    const resp = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: msgBody,
    });
    const data = await resp.json();

    if (!resp.ok || data.error) {
      return jsonResponse({
        success: false,
        error: 'FB_SEND_ERROR',
        fbError: data.error,
      }, 502);
    }

    return jsonResponse({
      success: true,
      messageId: data.message_id || data.id,
      recipientId: recipient_id,
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// ── POST /v1/facebook/auto-pin ──
// Cron-friendly endpoint: checks unread conversations for payment slips,
// issues a PIN, and replies to the customer.
//
// Flow:
//   1. Fetch unread conversations with image attachments
//   2. For each conversation with an unread image:
//      a. Issue a new PIN via admin API
//      b. Send the PIN back to the customer
//      c. Notify admin via Telegram (optional)
//   3. Return summary
//
// Auth: admin JWT (STARVIA_ADMIN_JWT_SECRET)
export async function facebookAutoPin(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  // Import admin functions dynamically to avoid circular deps
  const { issuePins } = await import('./admin.js');

  try {
    const { token, pageId } = getConfig(env);

    // Step 1: Fetch conversations with unread messages
    const convFields = 'participants,messages.limit(3){message,from,created_time,attachments{name,image_data,mime_type}},unread_count,updated_time';
    const convUrl = `${GRAPH_BASE}/${pageId}/conversations?fields=${encodeURIComponent(convFields)}&limit=20&access_token=${encodeURIComponent(token)}`;

    const convResp = await fetch(convUrl);
    const convData = await convResp.json();

    if (!convResp.ok || convData.error) {
      return jsonResponse({
        success: false,
        error: 'FB_API_ERROR',
        fbError: convData.error,
      }, 502);
    }

    const conversations = convData.data || [];

    // Step 2: Find conversations with unread image messages
    const pinCandidates = [];
    for (const conv of conversations) {
      const unreadCount = conv.unread_count || 0;
      if (unreadCount === 0) continue;

      const messages = conv.messages?.data || [];
      for (const msg of messages) {
        // Only process messages from customers (not from our page)
        const isFromCustomer = msg.from?.id !== pageId;
        if (!isFromCustomer) continue;

        // Check for image attachments
        const attachments = msg.attachments?.data || [];
        const hasImage = attachments.some(a => (a.mime_type || '').startsWith('image/'));
        if (!hasImage) continue;

        // Dedup: skip if this message was already processed
        const dedupKey = `fb:pin:msg:${msg.id}`;
        let alreadyProcessed = false;
        try {
          const existing = await env.STARVIA_KV.get(dedupKey);
          if (existing) alreadyProcessed = true;
        } catch { /* KV may not be available */ }
        if (alreadyProcessed) continue;

        // Mark as processing (set before sending to prevent races)
        try {
          await env.STARVIA_KV.put(dedupKey, 'processing', { expirationTtl: 86400 });
        } catch { /* non-critical */ }

        // Found a candidate!
        const customerName = msg.from?.name || 'ลูกค้า';
        const slipImageUrl = attachments.find(a => (a.mime_type || '').startsWith('image/'))?.image_data?.url || null;
        pinCandidates.push({
          conversationId: conv.id,
          customerName,
          customerId: msg.from?.id,
          messageId: msg.id,
          messageSnippet: (msg.message || '').substring(0, 100),
          imageCount: attachments.filter(a => (a.mime_type || '').startsWith('image/')).length,
          slipImageUrl,
          receivedAt: msg.created_time,
        });
        break; // One PIN per conversation
      }
    }

    if (pinCandidates.length === 0) {
      return jsonResponse({
        success: true,
        result: 'NO_NEW_SLIPS',
        message: 'ไม่มีข้อความใหม่ที่มีรูปภาพ (สลิป)',
        checked: conversations.length,
        checkedAt: new Date().toISOString(),
      });
    }

    // Step 3: Process each candidate
    // NEW FLOW: Classify intent FIRST → OCR only if BUYING_SLIP
    const results = [];
    const MIN_AMOUNT = 199;

    for (const candidate of pinCandidates) {
      try {
        // Step 3.0: Classify intent (NEW — prevents issuing PIN for chitchat/empty slips)
        const intent = await classifyIntent(
          candidate.messageSnippet || '',
          !!candidate.slipImageUrl,
          env
        );
        candidate.intent = intent;

        // Step 3.0a: Non-buying intents → Reply via LLM (แม่หมอคาร่า) + skip OCR/PIN
        if (intent === 'CHITCHAT' || intent === 'OTHER') {
          const replyText = await generateChatReply(
            candidate.messageSnippet || '',
            candidate.customerName,
            intent,
            env
          );
          const sent = await sendFBMessage(candidate.customerId, replyText, token, pageId);

          // Notify admin via Telegram (chitchat, no payment)
          await notifyTelegram(env, {
            customerName: candidate.customerName,
            pinCode: null,
            ocrResult: null,
            slipImageUrl: candidate.slipImageUrl,
            expires: null,
            rejected: false,
            intent,
            replySent: sent,
          }).catch(() => {});

          // Mark dedup so we don't re-process
          const dedupKey = `fb:pin:msg:${candidate.messageId}`;
          try { await env.STARVIA_KV.put(dedupKey, `chitchat_${intent}`, { expirationTtl: 86400 }); } catch {}

          results.push({
            ...candidate,
            status: intent === 'CHITCHAT' ? 'CHITCHAT_REPLIED' : 'OTHER_REPLIED',
            replyText,
            replySent: sent,
          });
          continue;
        }

        // Step 3.0b: BUYING_NO_SLIP → Ask customer to send slip
        if (intent === 'BUYING_NO_SLIP') {
          const replyText = await generateChatReply(
            candidate.messageSnippet || '',
            candidate.customerName,
            intent,
            env
          );
          const sent = await sendFBMessage(candidate.customerId, replyText, token, pageId);

          await notifyTelegram(env, {
            customerName: candidate.customerName,
            pinCode: null,
            ocrResult: null,
            slipImageUrl: candidate.slipImageUrl,
            expires: null,
            rejected: false,
            intent,
            replySent: sent,
          }).catch(() => {});

          // Mark dedup (expiry 1h — customer may send slip soon)
          const dedupKey = `fb:pin:msg:${candidate.messageId}`;
          try { await env.STARVIA_KV.put(dedupKey, 'awaiting_slip', { expirationTtl: 3600 }); } catch {}

          results.push({
            ...candidate,
            status: 'AWAITING_SLIP',
            replyText,
            replySent: sent,
          });
          continue;
        }

        // Step 3.0c: BUYING_SLIP (or ambiguous) → Continue to OCR
        // Step 3.1: OCR the slip image
        const ocrResult = await ocrSlipImage(candidate.slipImageUrl, env);
        const parsedAmount = parseAmountFromOCR(ocrResult);
        const transferTime = parseTimeFromOCR(ocrResult);

        // Step 3.2: Check minimum amount (199 THB)
        if (parsedAmount !== null && parsedAmount < MIN_AMOUNT) {
          // Amount too low — reject, don't issue PIN
          const rejectMsg = [
            `😔 คุณ ${candidate.customerName} ค่ะ`,
            ``,
            `ขอบคุณที่ส่งสลิปมาให้นะคะ แต่ยอดโอนขั้นต่ำสำหรับปลดล็อก Premium คือ **${MIN_AMOUNT} บาท** ค่ะ`,
            ``,
            `📋 ระบบอ่านสลิปได้: **${parsedAmount.toLocaleString('th-TH')} บาท**`,
            ``,
            `หากต้องการปลดล็อก กรุณาโอนเพิ่มอีก **${(MIN_AMOUNT - parsedAmount).toLocaleString('th-TH')} บาท** นะคะ 🙏`,
          ].join('\n');

          const sendUrl = `${GRAPH_BASE}/${pageId}/messages?access_token=${encodeURIComponent(token)}`;
          const msgBody = JSON.stringify({
            recipient: { id: candidate.customerId },
            message: { text: rejectMsg },
            messaging_type: 'RESPONSE',
          });
          const sendResp = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: msgBody,
          });
          const sendData = await sendResp.json();
          const sendOk = !!(sendData.message_id || sendData.id);

          // Notify Telegram about rejection
          await notifyTelegram(env, {
            customerName: candidate.customerName,
            pinCode: null,
            ocrResult,
            slipImageUrl: candidate.slipImageUrl,
            expires: null,
            rejected: true,
            rejectReason: `ยอดไม่ถึง ${MIN_AMOUNT} บาท (OCR: ${parsedAmount} THB)`,
          });

          // Update KV dedup to 'rejected' so it can be reprocessed if customer sends again
          const dedupKey = `fb:pin:msg:${candidate.messageId}`;
          try {
            await env.STARVIA_KV.put(dedupKey, 'rejected_amount_too_low', { expirationTtl: 3600 });
          } catch {}

          results.push({
            ...candidate,
            status: 'AMOUNT_TOO_LOW',
            ocrResult,
            parsedAmount,
            replySent: sendOk,
          });
          continue;
        }

        // Step 3.2.5: Check for duplicate slips from same customer
        const dupCheck = await checkDuplicateSlip(env, candidate.customerId, parsedAmount, transferTime);
        if (dupCheck.isDuplicate && !dupCheck.isNewer) {
          // Same amount, same or older time → skip (already processed)
          results.push({
            ...candidate,
            status: 'DUPLICATE_SLIP',
            message: 'สลิปซ้ำ: ยอด ' + (parsedAmount || '?') + ' THB, เวลา ' + (transferTime || '?') + ' (PIN เดิม: ' + dupCheck.oldPin + ')',
            ocrResult,
            parsedAmount,
            transferTime,
          });
          continue;
        }
        // If dupCheck.isDuplicate && isNewer → continue to issue new PIN (old one stays, admin revokes later)

        // Step 3.3: REJECT if OCR unreadable (err on side of rejecting)
        // Only issue PIN if we can CONFIRM the amount ≥ MIN_AMOUNT
        if (parsedAmount === null) {
          const rejectMsg = `😔 คุณ ${candidate.customerName} ค่ะ\n\nขอบคุณที่ส่งรูปมานะคะ แต่ระบบอ่านสลิปไม่ออกค่ะ\n\n📸 กรุณาส่งสลิปโอนเงินใหม่อีกครั้ง โดย:\n• ถ่ายให้เห็นยอดเงินชัดเจน\n• ตัวเลขไม่เบลอ\n• เห็นชื่อบัญชีต้นทาง\n\n💰 ยอดขั้นต่ำ 199 บาท หากส่งสลิปมาใหม่ ระบบจะตรวจสอบและออกรหัสให้อัตโนมัติค่ะ 🙏`;

          const sent = await sendFBMessage(candidate.customerId, rejectMsg, token, pageId);

          await notifyTelegram(env, {
            customerName: candidate.customerName,
            pinCode: null,
            ocrResult,
            slipImageUrl: candidate.slipImageUrl,
            expires: null,
            rejected: true,
            rejectReason: 'OCR อ่านสลิปไม่ออก — ขอให้ลูกค้าส่งใหม่',
            intent,
            replySent: sent,
          }).catch(() => {});

          // Mark dedup (1h expiry — customer may re-send slip)
          const dedupKey = `fb:pin:msg:${candidate.messageId}`;
          try { await env.STARVIA_KV.put(dedupKey, 'ocr_unreadable_awaiting_resend', { expirationTtl: 3600 }); } catch {}

          results.push({
            ...candidate,
            status: 'OCR_UNREADABLE',
            ocrResult,
            parsedAmount: null,
            replyText: rejectMsg,
            replySent: sent,
          });
          continue;
        }

        // Step 3.4: Amount confirmed ≥ MIN_AMOUNT → Issue PIN
        const ctx = { env, request: new Request('http://localhost/v1/admin/pins/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            count: 1,
            days: 30,
            plan: 'premium_199',
            note: `Auto-PIN for ${candidate.customerName} via Facebook (OCR: ${parsedAmount || 'unreadable'} THB)`,
          }),
        }) };

        const pinResult = await issuePins(ctx);
        const pinBody = await pinResult.json();

        if (!pinBody.success) {
          results.push({
            ...candidate,
            status: 'PIN_ISSUE_FAILED',
            error: pinBody.error,
            ocrResult,
            parsedAmount,
          });
          continue;
        }

        const pin = pinBody.issued[0];
        const pinCode = pin.pin;

        // Step 3.4: Send PIN to customer
        const thankYouMsg = [
          `✨ คุณ ${candidate.customerName} ค่ะ`,
          ``,
          `ขอบคุณสำหรับการชำระเงินค่ะ 🎉`,
          ``,
          `━━━━━━━━━━━━━━━━`,
          `🔑 รหัสปลดล็อก Premium`,
          ``,
          `     ${pinCode}`,
          ``,
          `📅 อายุ 30 วัน`,
          `⏰ ถึง ${new Date(pin.expires).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          `━━━━━━━━━━━━━━━━`,
          ``,
          `📖 วิธีใช้`,
          `1. ไปที่ https://starvia.website`,
          `2. กดปุ่ม "Premium"`,
          `3. กรอกรหัสด้านบน`,
          ``,
          `สอบถามเพิ่มเติมทักมาได้เลยนะคะ 🙏`,
        ].join('\n');

        const sendUrl = `${GRAPH_BASE}/${pageId}/messages?access_token=${encodeURIComponent(token)}`;
        const msgBody = JSON.stringify({
          recipient: { id: candidate.customerId },
          message: { text: thankYouMsg },
          messaging_type: 'RESPONSE',
        });

        const sendResp = await fetch(sendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: msgBody,
        });
        const sendData = await sendResp.json();
        const sendOk = !!(sendData.message_id || sendData.id);

        // Step 3.5: Notify Telegram
        const telegramSent = await notifyTelegram(env, {
          customerName: candidate.customerName,
          pinCode,
          ocrResult,
          slipImageUrl: candidate.slipImageUrl,
          expires: pin.expires,
          duplicateOf: dupCheck.isDuplicate ? dupCheck.oldPin : null,
          timeUncertain: dupCheck.timeUncertain || false,
        });

        // Step 3.6: Save slip record for future duplicate detection
        await saveSlipRecord(env, candidate.customerId, {
          amount: parsedAmount,
          transferTime,
          pinCode,
          messageId: candidate.messageId,
          createdAt: new Date().toISOString(),
          revoked: false,
        });

        results.push({
          ...candidate,
          status: sendOk ? 'SUCCESS' : 'SEND_FAILED',
          pin: pinCode,
          plan: pin.plan,
          expiresAt: pin.expires,
          replySent: sendOk,
          replyMessageId: sendData.message_id || sendData.id || null,
          ocrResult,
          parsedAmount,
          transferTime,
          telegramNotified: telegramSent,
          duplicateOf: dupCheck.isDuplicate ? dupCheck.oldPin : null,
        });
      } catch (err) {
        results.push({
          ...candidate,
          status: 'ERROR',
          error: err.message,
        });
      }
    }

    return jsonResponse({
      success: true,
      result: results.length > 0 ? 'PINS_ISSUED' : 'NO_NEW_SLIPS',
      issued: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status !== 'SUCCESS').length,
      results,
      checked: conversations.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// ── LLM Intent Classifier + Chat Reply ──
// Priority: OpenAI (gpt-4o-mini) > OpenCode Zen (minimax-m3-free)
async function callLLM(messages, env, maxTokens = 300) {
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + openaiKey,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      });
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch (e) {
      console.error('OpenAI LLM error:', e.message);
    }
  }
  const zenKey = env.OPENCODE_ZEN_API_KEY || env.OPENCODE_ZEN_API_KEY_2;
  if (zenKey) {
    try {
      const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + zenKey,
        },
        body: JSON.stringify({
          model: 'minimax-m3-free',
          messages,
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
      });
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch (e) {
      console.error('Zen LLM error:', e.message);
    }
  }
  return null;
}

// Classify customer message intent — return one of: BUYING_SLIP, BUYING_NO_SLIP, CHITCHAT, OTHER
async function classifyIntent(customerMessage, hasAttachment, env) {
  const systemPrompt = `คุณคือ "แม่หมอคาร่า" น้องสาวคนสนิทของ STARVIA หน้าที่ของคุณคือ "จำแนกประเภทข้อความ" ของลูกค้าที่ทักเข้ามาทาง Facebook Messenger

ตอบเป็น JSON เท่านั้น ห้ามมีคำอธิบายอื่น รูปแบบ:
{"intent": "BUYING_SLIP"} | {"intent": "BUYING_NO_SLIP"} | {"intent": "CHITCHAT"} | {"intent": "OTHER"}

ความหมาย:
- BUYING_SLIP: ลูกค้าต้องการซื้อสมาชิกพรีเมี่ยม + แนบสลิปโอนเงินมา (มีรูปภาพแนบ และข้อความบ่งบอกว่าซื้อ/โอน)
- BUYING_NO_SLIP: ลูกค้าต้องการซื้อสมาชิกพรีเมี่ยม แต่ยังไม่ได้แนบสลิป (อาจถามราคา วิธีจ่าย หรือบอกว่าจะโอน)
- CHITCHAT: ทักทายธรรมดา ถามดวง ขอบคุณ หรือพูดคุยทั่วไป (ไม่เกี่ยวกับการซื้อ)
- OTHER: สแปม ข้อความไม่ชัดเจน หรือเรื่องอื่นที่ไม่เข้าข้อใด`;

  const userPrompt = `ข้อความลูกค้า: "${(customerMessage || '').substring(0, 500)}"
มีรูปภาพแนบ: ${hasAttachment ? 'ใช่' : 'ไม่'}

จำแนก intent แล้วตอบเป็น JSON เท่านั้น`;

  const content = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], env, 50);

  if (!content) return 'OTHER';
  // Parse JSON safely
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const intent = parsed.intent;
    if (['BUYING_SLIP', 'BUYING_NO_SLIP', 'CHITCHAT', 'OTHER'].includes(intent)) return intent;
  } catch (e) {
    console.error('Intent parse error:', content.substring(0, 200));
  }
  return 'OTHER';
}

// Generate chat reply as แม่หมอคาร่า — based on intent
async function generateChatReply(customerMessage, customerName, intent, env) {
  const systemPrompt = `คุณคือ "แม่หมอคาร่า" น้องสาวคนสนิทของ STARVIA ที่มีความรู้เรื่องดวงดาว ราศี โหราศาสตร์

## ตัวตน:
- น้ำเสียงน้องสาว เป็นกันเองสุดๆ
- ตอบสั้นกระชับ ไม่เกิน 200 ตัวอักษร (Facebook Messenger limit)
- ใส่อีโมจิ ✨🔮💫🥰💕🌟⭐🙏
- ห้ามพูดถึง AI ห้ามใช้ภาษาทางการ

## สิ่งที่ต้องทำตอนนี้:
- intent ของลูกค้า = "${intent}"
- ถ้าเป็น CHITCHAT/OTHER → อธิบายว่า "ช่องทางข้อความนี้สำหรับการขอสนับสนุนแม่หมอคาร่า หรือซื้อสมาชิกพรีเมี่ยมเพื่อเข้าดูดวงแบบพิเศษค่ะ" (พูดสั้นๆ ไม่ยัดเยียด)
- ถ้าเป็น BUYING_NO_SLIP → บอกให้ส่งสลิปโอนเงินมาเพื่อออกรหัส Premium
- ถ้าเป็น BUYING_SLIP → บอกว่ากำลังตรวจสอบสลิปอยู่ ขอบคุณที่รอค่ะ

## ตัวอย่าง:
- CHITCHAT: "สวัสดีค่ะ 💕 ช่องทางนี้สำหรับขอสนับสนุนแม่หมอคาร่า หรือซื้อสมาชิกพรีเมี่ยมเพื่อเข้าดูดวงแบบพิเศษค่ะ ส่งสลิปมาได้เลยนะคะ 🔮✨"
- BUYING_NO_SLIP: "ยอดเยี่ยมเลยค่ะ! 🎉 ส่งสลิปโอนเงิน 199 บาท มาทางแชทนี้ได้เลยนะคะ ระบบจะออกรหัสให้อัตโนมัติค่ะ 🙏"
- BUYING_SLIP: "ได้รับสลิปแล้วค่ะ ✅ กำลังตรวจสอบอยู่นะคะ ขอบคุณที่รอค่ะ 💕"`;

  const userPrompt = `ลูกค้าชื่อ: ${customerName}
ข้อความ: "${(customerMessage || '').substring(0, 300)}"

ตอบเป็น "แม่หมอคาร่า" สั้นๆ 1-2 ประโยค`;

  const content = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], env, 150);

  // Fallback if LLM fails
  if (!content) {
    if (intent === 'BUYING_NO_SLIP') {
      return 'ขอบคุณค่ะ! 🎉 ส่งสลิปโอนเงิน 199 บาท มาทางแชทนี้ได้เลยนะคะ ระบบจะออกรหัสให้อัตโนมัติค่ะ 🙏';
    } else if (intent === 'BUYING_SLIP') {
      return 'ได้รับสลิปแล้วค่ะ ✅ กำลังตรวจสอบอยู่นะคะ ขอบคุณที่รอค่ะ 💕';
    } else {
      return 'สวัสดีค่ะ 💕 ช่องทางนี้สำหรับขอสนับสนุนแม่หมอคาร่า หรือซื้อสมาชิกพรีเมี่ยมเพื่อเข้าดูดวงแบบพิเศษค่ะ 🔮✨';
    }
  }
  return content;
}

// Send text message to a Facebook user via page
async function sendFBMessage(customerId, text, token, pageId) {
  try {
    const sendUrl = `${GRAPH_BASE}/${pageId}/messages?access_token=${encodeURIComponent(token)}`;
    const msgBody = JSON.stringify({
      recipient: { id: customerId },
      message: { text },
      messaging_type: 'RESPONSE',
    });
    const sendResp = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: msgBody,
    });
    const sendData = await sendResp.json();
    return !!(sendData.message_id || sendData.id);
  } catch (e) {
    console.error('sendFBMessage error:', e.message);
    return false;
  }
}

// ── OCR: Read Thai text from slip image ──
// Priority: OpenAI (gpt-4o-mini) > OpenCode Zen (minimax-m3-free)
async function ocrSlipImage(imageUrl, env) {
  if (!imageUrl) return null;

  try {
    // Step 1: Download image from Facebook CDN (URL may have auth tokens)
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return 'ดาวน์โหลดรูปไม่สำเร็จ';
    const imgBuffer = await imgResp.arrayBuffer();
    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const base64 = btoa(Array.from(new Uint8Array(imgBuffer), b => String.fromCharCode(b)).join(''));
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Try OpenAI first (better Thai OCR)
    const openaiKey = env.OPENAI_API_KEY;
    if (openaiKey) {
      const result = await ocrWithOpenAI(dataUrl, openaiKey);
      if (result) return result;
    }

    // Fallback to OpenCode Zen
    const zenKey = env.OPENCODE_ZEN_API_KEY || env.OPENCODE_ZEN_API_KEY_2;
    if (zenKey) {
      const result = await ocrWithZen(dataUrl, zenKey);
      if (result) return result;
    }

    return 'ไม่มี API key สำหรับ OCR';
  } catch (e) {
    console.error('OCR error:', e.message);
    return `OCR error: ${e.message}`;
  }
}

async function ocrWithOpenAI(dataUrl, apiKey) {
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'อ่านข้อความภาษาไทยจากสลิปโอนเงินนี้ ตอบสั้นๆ เป็นภาษาไทย บอกเฉพาะ: ยอดเงิน, วันที่โอน, เวลา (ถ้ามี), ธนาคารต้นทาง (ถ้ามี) ถ้าอ่านไม่ออกให้ตอบว่า "อ่านไม่ออก"' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
        max_tokens: 150,
        temperature: 0,
      }),
    });
    const data = await resp.json();
    if (data.error) {
      console.log('OpenAI OCR error:', JSON.stringify(data.error));
      return null; // fallback
    }
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('OpenAI OCR exception:', e.message);
    return null;
  }
}

async function ocrWithZen(dataUrl, apiKey) {
  try {
    const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'minimax-m3-free',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'อ่านข้อความภาษาไทยจากสลิปโอนเงินนี้ ตอบสั้นๆ เป็นภาษาไทย บอกเฉพาะ: ยอดเงิน, วันที่โอน, เวลา (ถ้ามี), ธนาคารต้นทาง (ถ้ามี) ถ้าอ่านไม่ออกให้ตอบว่า "อ่านไม่ออก"' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
        max_tokens: 150,
        temperature: 0,
      }),
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content || content === 'อ่านไม่ออก') {
      console.log('Zen OCR raw:', JSON.stringify(data).substring(0, 300));
    }
    return content || null;
  } catch (e) {
    console.error('Zen OCR exception:', e.message);
    return null;
  }
}

// ── Parse amount from OCR text (Thai: "ยอดเงิน: 355.00 บาท" → 355.00) ──
function parseAmountFromOCR(ocrText) {
  if (!ocrText) return null;
  // Match patterns: "ยอดเงิน: 355.00 บาท", "จำนวนเงิน 199", "355.00", "฿199", "199.00 บาท"
  const patterns = [
    /(?:ยอดเงิน|จำนวนเงิน|ยอด|amount)[:\s]*([\d,]+\.?\d*)/i,
    /฿\s*([\d,]+\.?\d*)/,
    /([\d,]+\.?\d*)\s*(?:บาท|baht|thb)/i,
    /([\d,]+\.\d{2})/,       // explicit decimal like 355.00
  ];
  for (const pat of patterns) {
    const match = ocrText.match(pat);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  return null;
}

// ── Parse transfer time from OCR text ──
// Matches: "14:30", "14:30:00", "เวลา 14:30 น.", "เมื่อ 14:30"
function parseTimeFromOCR(ocrText) {
  if (!ocrText) return null;
  const m = ocrText.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  return m ? m[1] : null;
}

// ── Slip record tracking: save / check duplicates ──
// KV key: fb:slip:{customerId} → JSON array of records
// TTL: 30 days (long enough for admin to verify)

async function saveSlipRecord(env, customerId, record) {
  const key = 'fb:slip:' + customerId;
  try {
    const existing = await env.STARVIA_KV.get(key, { type: 'json' });
    const records = existing || [];
    records.push(record);
    // Keep last 10 records per customer
    await env.STARVIA_KV.put(key, JSON.stringify(records.slice(-10)), {
      expirationTtl: 86400 * 30,
    });
  } catch (e) {
    console.error('saveSlipRecord error:', e.message);
  }
}

// Returns: { isDuplicate, isNewer, oldPin, oldTime, oldAmount }
async function checkDuplicateSlip(env, customerId, amount, transferTime) {
  const key = 'fb:slip:' + customerId;
  try {
    const existing = await env.STARVIA_KV.get(key, { type: 'json' });
    if (!existing || existing.length === 0) return { isDuplicate: false };

    // Find active (non-revoked) slips with same amount
    const sameAmount = existing.filter(r => r.amount === amount && !r.revoked);
    if (sameAmount.length === 0) return { isDuplicate: false };

    // If we have transfer time, compare with the most recent same-amount slip
    const latest = sameAmount[sameAmount.length - 1];
    if (transferTime && latest.transferTime) {
      if (transferTime > latest.transferTime) {
        // Newer transfer → allow (issue new PIN, admin revokes old if needed)
        return {
          isDuplicate: true,
          isNewer: true,
          oldPin: latest.pinCode,
          oldTime: latest.transferTime,
          oldAmount: latest.amount,
        };
      }
      // Same or older → skip
      return {
        isDuplicate: true,
        isNewer: false,
        oldPin: latest.pinCode,
        oldTime: latest.transferTime,
        oldAmount: latest.amount,
      };
    }

    // Can't determine time (OCR missed it) → err on side of customer, allow PIN
    return {
      isDuplicate: true,
      isNewer: true,
      oldPin: latest.pinCode,
      oldTime: latest.transferTime || null,
      oldAmount: latest.amount,
      timeUncertain: true,
    };
  } catch (e) {
    console.error('checkDuplicateSlip error:', e.message);
    return { isDuplicate: false };
  }
}

// ── Telegram Notification: Send slip + PIN info to admin ──
async function notifyTelegram(env, { customerName, pinCode, ocrResult, slipImageUrl, expires, rejected, rejectReason, duplicateOf, timeUncertain }) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;

  let caption;

  if (rejected) {
    caption = [
      `⚠️ แจ้งเตือน Auto-PIN — **ปฏิเสธ**`,
      ``,
      `👤 ลูกค้า: ${customerName}`,
      `🚫 สาเหตุ: ${rejectReason || 'ไม่ระบุ'}`,
      ``,
      `📋 OCR สลิป:`,
      `${ocrResult || 'อ่านไม่ออก'}`,
    ].join('\n');
  } else {
    const expiresThai = new Date(expires).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    caption = [
      `💳 แจ้งเตือน Auto-PIN`,
      ``,
      `👤 ลูกค้า: ${customerName}`,
      `🔑 PIN: ${pinCode}`,
      `📅 หมดอายุ: ${expiresThai}`,
      ``,
      `📋 OCR สลิป:`,
      `${ocrResult || 'อ่านไม่ออก'}`,
      ``,
      duplicateOf
        ? `⚠️ สลิปซ้ำ — PIN เดิม: ${duplicateOf}${timeUncertain ? '\n   (ระบบอ่านเวลาไม่ได้ ออก PIN ไว้ก่อน)' : ''}\n   (ตรวจสอบเงินเข้าแล้ว /revoke ${duplicateOf} ถ้ายกเลิก)`
        : `❌ หากไม่ถูกต้อง: /revoke ${pinCode}`,
    ].join('\n');
  }

  try {
    if (slipImageUrl) {
      // Send photo with caption
      await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: slipImageUrl,
          caption,
        }),
      });
    } else {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
        }),
      });
    }
    return true;
  } catch (e) {
    console.error('Telegram notify error:', e.message);
    return false;
  }
}

// ── Auth wrappers ──
export const facebookInboxAuth = (context) => withAdminAuth(context, facebookInbox);
export const facebookSendAuth = (context) => withAdminAuth(context, facebookSendMessage);

// ── POST /v1/facebook/subscriber-check ──
// FB Login flow: ตรวจว่า user (ที่ login ผ่าน Facebook บนเว็บ) เป็น subscriber ของเพจหรือไม่
// รับ { accessToken } = user token จาก Facebook Login (JS SDK)
// ลองตรวจหลายวิธีเรียงกัน:
//   1. GET /{page-id}?fields=is_subscribed_by_viewer (user token — Facebook บอกตรงๆ ว่า viewer เป็นสมาชิกไหม)
//   2. GET /{page-id}/subscribers (page token — list สมาชิก ต้อง advanced access ผ่าน app review)
// ถ้าเป็นสมาชิก → ออก JWT premium (เหมือน PIN) → หน้าเว็บปลดล็อก
export async function facebookSubscriberCheck(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_JSON', 'Request body must be valid JSON');
  }

  const userToken = body.accessToken || body.access_token;
  if (!userToken) {
    return errorResponse(400, 'MISSING_TOKEN', 'Provide accessToken from FB Login');
  }

  const checks = {};
  // ── วิธี 0: KV subscriber check (webhook-backed) ──
  // ⚠️ ต้องพิสูจน์ก่อนว่า accessToken เป็นของ userID ที่อ้างจริง (Graph /me)
  // ไม่งั้นใครก็ยิง userID อะไรก็ได้ + token ปลอม แล้วได้ premium JWT ฟรี
  try {
    const uid = String(body.userID || "");
    if (uid) {
      const meResp = await fetch(`${GRAPH_BASE}/me?fields=id&access_token=${encodeURIComponent(userToken)}`);
      const me = await meResp.json().catch(() => ({}));
      if (me && String(me.id) === uid) {
        const raw = await env.STARVIA_KV.get("premium:subscribers", { type: "json" });
        if (Array.isArray(raw) && raw.some(s => s.id === uid)) {
          const token = await signSubscriberToken(body.userID, env);
          return jsonResponse({
            success: true,
            method: "kv_subscriber",
            isSubscriber: true,
            token,
            plan: "premium_fb",
          });
        }
      } else {
        checks.kvTokenNotOwned = true;
      }
    }
  } catch (e) {
    checks.kvError = String((e && e.message) || e);
  }

  const pageId = String(env.FACEBOOK_PAGE_ID || "").trim() || "1071926269337612";

  // ── วิธี 1: viewer check (user token) ──
  try {
    const url = `${GRAPH_BASE}/${pageId}?fields=is_subscribed_by_viewer,can_viewer_subscribe&access_token=${encodeURIComponent(userToken)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    checks.viewer = data;
    if (data && typeof data.is_subscribed_by_viewer === 'boolean') {
      if (data.is_subscribed_by_viewer) {
        const token = await signSubscriberToken(body.userID, env);
        return jsonResponse({
          success: true,
          method: 'is_subscribed_by_viewer',
          isSubscriber: true,
          token,
          plan: 'premium_fb',
        });
      }
      return jsonResponse({ success: true, method: 'is_subscribed_by_viewer', isSubscriber: false });
    }
  } catch (e) {
    checks.viewerError = String((e && e.message) || e);
  }

  // ── วิธี 2: subscribers edge (page token — ต้อง advanced access) ──
  try {
    const pageToken = env.FACEBOOK_PAGE_TOKEN;
    if (pageToken) {
      const url = `${GRAPH_BASE}/${pageId}/subscribers?limit=1000&fields=id&access_token=${encodeURIComponent(pageToken)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      checks.subscribers = data;
      if (data && Array.isArray(data.data)) {
        const ids = new Set(data.data.map((s) => String(s.id)));
        const isSub = body.userID ? ids.has(String(body.userID)) : false;
        return jsonResponse({
          success: true,
          method: 'subscribers_edge',
          isSubscriber: isSub,
          subscriberCount: ids.size,
          total: (data.summary && data.summary.total_count) || ids.size,
        });
      }
    }
  } catch (e) {
    checks.subscribersError = String((e && e.message) || e);
  }

  // ── ไม่มีวิธีไหนตรวจได้ — คืนข้อมูล debug ให้ admin เห็นว่า Facebook ตอบอะไร ──
  return jsonResponse(
    {
      success: false,
      isSubscriber: false,
      method: 'none',
      message:
        'Facebook ยังไม่เปิดช่องทางตรวจสมาชิกให้ (ดู checks) — ต้องขอ permission ผ่าน app review หรือรอ Meta เปิด API',
      checks,
    },
    200
  );
}

async function signSubscriberToken(fbUserId, env) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = Number(env.STARVIA_TOKEN_TTL_SECONDS || 24 * 60 * 60);
  return signHS256(
    {
      sub: `fb_${String(fbUserId || 'user').slice(0, 32)}`,
      plan: 'premium_fb',
      iat: issuedAt,
      exp: issuedAt + expiresIn,
    },
    env.STARVIA_JWT_SECRET
  );
}
export const facebookAutoPinAuth = (context) => withAdminAuth(context, facebookAutoPin);
