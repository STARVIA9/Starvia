// STARVIA Auto-PIN Cron Worker
// Runs every 5 minutes — calls /v1/facebook/auto-pin on STARVIA Pages
// Zero dependency on local WSL/Hermes — runs entirely on Cloudflare edge

export default {
  // Health check — respond to HTTP requests
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        ok: true,
        service: 'starvia-cron-pin',
        schedule: '*/5 * * * *',
        autoPinEndpoint: 'https://starvia.website/v1/facebook/auto-pin',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('STARVIA Cron Worker — see /health', { status: 200 });
  },

  // Cron trigger — DISABLED 5 ก.ย.69 (พ่อสั่งปิดทั้งระบบ Auto-PIN)
  async scheduled(event, env, ctx) {
    console.log('[auto-pin] DISABLED — skipped');
    return;
    try {
      // Generate admin JWT token
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        role: 'admin',
        iat: now,
        exp: now + 300, // 5 min TTL
      };

      // Sign HS256 token manually (no jwt library needed)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      const encPayload = btoa(JSON.stringify(payload))
        .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      const msg = new TextEncoder().encode(header + '.' + encPayload);
      
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(env.STARVIA_ADMIN_JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, msg);
      const encSig = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      
      const token = header + '.' + encPayload + '.' + encSig;

      // Call auto-pin endpoint
      const resp = await fetch('https://starvia.website/v1/facebook/auto-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
      });

      const data = await resp.json();
      
      // Log result
      console.log('[auto-pin]', new Date().toISOString(),
        'result:', data.result,
        'issued:', data.issued || 0,
        'failed:', data.failed || 0,
        'checked:', data.checked || 0
      );

      // If PINs were issued, send Telegram notification
      if (data.issued > 0 && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        for (const r of (data.results || [])) {
          if (r.status === 'SUCCESS') {
            const notifyMsg = `💳 แจ้งเตือน Auto-PIN\n━━━━━━━━━━━━\n👤 ลูกค้า: ${r.customerName}\n🔑 PIN: ${r.pin}\n💬 ตอบกลับ Facebook: ${r.replySent ? '✅' : '❌'}\n⏰ ${new Date().toLocaleString('th-TH')}`;
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: notifyMsg,
                parse_mode: 'Markdown',
              }),
            });
          }
        }
      }

    } catch (err) {
      console.error('[auto-pin error]', err.message);
    }
  },
};
