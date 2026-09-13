// Main API Router — handles all /v1/* requests
// Dispatches to specialized service modules in _lib/

import { handleLotteryResults, setLotteryResults } from '../_lib/lottery.js';
import { createStreakReward, verifyStreakReward, getStreakStats } from '../_lib/streak.js';
import { verifyPremiumPin, checkPremiumStatus } from '../_lib/premium.js';
import {
  adminLogin,
  getAdminStats,
  listPins,
  issuePins,
  expirePin,
  deletePin,
  revokePin,
  withAdminAuth,
} from '../_lib/admin.js';
import { createPayment, paymentWebhook, verifyPayment, paymentStatus } from '../_lib/payment.js';
import { handleChat, chatInfo } from '../_lib/chat.js';
import { handleAgentRequest } from '../_lib/agent-card.js';
import { getPickState, drawPick, redeemCredit } from '../_lib/pick.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const url = new URL(request.url);
  // params.path is the [[path]] catch-all (relative path under /v1/)
  // e.g. /v1/lottery/results → params.path = "lottery/results" or ["lottery","results"]
  // CF Pages may pass either — handle both
  const rawPath = context.params.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '');
  const segments = path.split('/').filter(Boolean);

  try {
    // ── Lottery ──
    if (segments[0] === 'lottery') {
      if (segments[1] === 'results' && request.method === 'GET') {
        return handleLotteryResults(context);
      }
      if (segments[1] === 'manual' && request.method === 'POST') {
        // Admin-only — wrap with auth
        return withAdminAuth(context, async (ctx) => {
          const body = await request.clone().json();
          return setLotteryResults(ctx, body);
        });
      }
    }

    // ── Streak ──
    if (segments[0] === 'streak') {
      if (segments[1] === 'reward' && request.method === 'POST') return createStreakReward(context);
      if (segments[1] === 'verify' && request.method === 'POST') return verifyStreakReward(context);
      if (segments[1] === 'stats' && request.method === 'GET') return getStreakStats(context);
    }

    // ── Premium ──
    if (segments[0] === 'premium') {
      if (segments[1] === 'verify' && request.method === 'POST') return verifyPremiumPin(context);
      if (segments[1] === 'status' && request.method === 'GET') return checkPremiumStatus(context);
      if (segments[1] === 'health' && request.method === 'GET') {
        return json({ ok: true, service: 'starvia-premium-api' });
      }
    }

    // ── Admin ──
    if (segments[0] === 'admin') {
      if (segments[1] === 'login' && request.method === 'POST') return adminLogin(context);
      if (segments[1] === 'health' && request.method === 'GET') {
        return json({ ok: true, service: 'starvia-admin-api' });
      }
      // All other admin routes require auth
      if (segments[1] === 'stats' && request.method === 'GET') {
        return withAdminAuth(context, getAdminStats);
      }
      if (segments[1] === 'pins') {
        if (segments.length === 2 && request.method === 'GET') {
          return withAdminAuth(context, listPins);
        }
        if (segments[2] === 'issue' && request.method === 'POST') {
          return withAdminAuth(context, issuePins);
        }
        if (segments[2] === 'expire' && request.method === 'POST') {
          return withAdminAuth(context, expirePin);
        }
        if (segments[2] === 'delete' && request.method === 'POST') {
          return withAdminAuth(context, deletePin);
        }
        if (segments[2] === 'revoke' && request.method === 'POST') {
          return withAdminAuth(context, revokePin);
        }
      }
    }

    // ── Payment ──
    if (segments[0] === 'payment') {
      if (segments[1] === 'create' && request.method === 'POST') return createPayment(context);
      if (segments[1] === 'webhook' && request.method === 'POST') return paymentWebhook(context);
      if (segments[1] === 'verify' && request.method === 'POST') return verifyPayment(context);
      if (segments[1] === 'status' && request.method === 'GET') return paymentStatus(context);
    }

    // ── Chat (Workers AI — "Dara" persona) ──
    if (segments[0] === 'chat') {
      if (request.method === 'POST') return handleChat(context);
      if (request.method === 'GET') return chatInfo();
    }

    // ── A2A Agent Card tasks ──
    if (segments[0] === 'agent' && (segments[1] === 'tasks' || path.startsWith('agent/'))) {
      return handleAgentRequest({
        ...context,
        params: { path: segments.slice(1).join('/') },
      });
    }

    // ── Pick-a-Card (quota + streak) ──
    if (segments[0] === 'pick') {
      if (segments[1] === 'state' && request.method === 'GET') return getPickState(context);
      if (segments[1] === 'draw' && request.method === 'POST') return drawPick(context);
      if (segments[1] === 'redeem' && request.method === 'POST') return redeemCredit(context);
    }

    return json({ success: false, error: 'NOT_FOUND', path: path }, 404);
  } catch (err) {
    return json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    }, 500);
  }
}
