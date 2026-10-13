// UI actions extracted from app.js
function saveImage(targetClass, fileName, evt) {
  var target = document.querySelector('.' + targetClass);
  if(!target) return;

  var btn = evt && evt.currentTarget ? evt.currentTarget : null;
  if(!btn) return;
  var originalText = btn.innerHTML;
  btn.innerHTML = '⏳ กำลังสร้างรูปภาพ...';
  btn.style.opacity = '0.7';

  // แอบเปิดลายน้ำ Starvia ตอนกำลังถ่ายรูป
  var wm = target.querySelector('.watermark');
  if(!wm) {
    wm = document.createElement('div');
    wm.className = 'watermark';
    wm.innerHTML = '<div class="wm-brand">STARVIA</div><div class="wm-link">เช็กดวงของคุณได้ที่ www.starvia.app</div>';
    target.appendChild(wm);
  }
  wm.style.display = 'block';

  // ปรับแต่งสีพื้นหลังเล็กน้อยก่อนถ่ายรูป
  target.style.background = 'linear-gradient(180deg, #1A1035, #0d0828)';

  // ถ่ายรูป
  html2canvas(target, {
    scale: 2, // รูปชัดระดับ HD (Retina)
    backgroundColor: '#0d0828',
    useCORS: true
  }).then(function(canvas) {
    // ซ่อนลายน้ำและคืนสีพื้นหลังเดิมหลังถ่ายเสร็จ
    wm.style.display = 'none';
    target.style.background = '';

    // คืนปุ่มเดิม
    btn.innerHTML = originalText;
    btn.style.opacity = '1';

    // ดาวน์โหลดรูปภาพ
    var link = document.createElement('a');
    link.download = fileName + '_Starvia.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(function() {
    btn.innerHTML = '❌ เกิดข้อผิดพลาด';
    setTimeout(function(){ btn.innerHTML = originalText; btn.style.opacity = '1'; }, 2000);
  });
}

// ===== DAILY STAR MANTRA =====
function initDailyMantra() {
  // ข้อความฮีลใจ 7 วัน 7 สไตล์ (เปลี่ยนตามวันในสัปดาห์อัตโนมัติ)
  var mantras = [
    "อนุญาตให้ตัวเองเติบโตในจังหวะของตัวเอง เหมือนพระจันทร์ที่ไม่เคยรีบเร่งเต็มดวง ☽", // อาทิตย์
    "ดวงดาวไม่ได้กำหนดทางเดินให้คุณ แต่ช่วยส่องสว่างให้คุณเห็นทางชัดขึ้น ✦", // จันทร์
    "ความเข้มแข็งที่แท้จริง คือการกล้าโอบกอดความอ่อนแอของตัวเอง 🤍", // อังคาร
    "พายุไม่ได้มาเพื่อทำลายเสมอไป บางครั้งมันมาเพื่อชำระล้างเส้นทางใหม่ 🌧️", // พุธ
    "คุณมีพลังของจักรวาลซ่อนอยู่ในตัว จงเชื่อมั่นในสัญชาตญาณของตัวเอง ✨", // พฤหัสบดี
    "แม้ในคืนที่มืดมิดที่สุด ดาวดวงเล็กๆ ก็ยังสามารถนำทางคุณได้ 🌟", // ศุกร์
    "ทุกการเริ่มต้นใหม่ ต้องการการปล่อยวางจากสิ่งเดิมเสมอ 🍃" // เสาร์
  ];

  var today = new Date().getDay(); // หาว่าวันนี้คือวันอะไร (0-6)
  var mantra = mantras[today];

  // ถ้าเป็นภาษาอังกฤษ ให้สลับข้อความนิดหน่อย
  if (typeof CL !== 'undefined' && CL === 'en') {
    mantra = "Allow yourself to grow at your own pace, like the moon that never rushes to be full. ☽";
  }

  var html = '<div class="daily-mantra">'
           + '<div class="dm-lbl">✦ กำลังใจประจำวัน ✦</div>'
           + '<div class="dm-txt">"' + mantra + '"</div>'
           + '</div>';

  // นำไปแทรกไว้ใต้ Header (ส่วนหัวของเว็บ) ก่อนถึงปุ่มเลือกโหมด
  var hd = document.querySelector('.hd');
  if(hd) {
    hd.insertAdjacentHTML('afterend', html);
  }
}

// เรียกใช้งานฟังก์ชันทันทีที่หน้าเว็บโหลดเสร็จ
initDailyMantra();

// ===== FREEMIUM UNLOCK SYSTEM (ปลดล็อกเนื้อหาบนเว็บ) =====

// ===== PREMIUM STATE ABSTRACTION =====
// ใช้ isPremiumUnlocked() แทนการเช็ค window.isPremiumUnlocked โดยตรง
// เมื่อย้ายไป backend จริง ให้เปลี่ยนแค่ฟังก์ชันนี้
var PREMIUM_TOKEN_STORAGE_KEY = 'starviaPremiumToken';
var _premiumState = { unlocked: false, token: null };

function isPremiumUnlocked() {
  return _premiumState.unlocked;
}

function setPremiumUnlocked(unlocked, token) {
  _premiumState.unlocked = !!unlocked;
  _premiumState.token = token || null;
  // sync backward-compat global flag without replacing the isPremiumUnlocked() function
  window.isPremiumUnlockedFlag = _premiumState.unlocked;
}

function persistPremiumToken(token) {
  if (!token) return;
  var storage = getPremiumStorage();
  if (storage) storage.setItem(PREMIUM_TOKEN_STORAGE_KEY, token);
}

function clearPremiumToken() {
  var storage = getPremiumStorage();
  if (storage) storage.removeItem(PREMIUM_TOKEN_STORAGE_KEY);
}

function getSavedPremiumToken() {
  var storage = getPremiumStorage();
  return storage ? storage.getItem(PREMIUM_TOKEN_STORAGE_KEY) : null;
}

function getPremiumStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
    if (window && window.localStorage) return window.localStorage;
  } catch (error) {
    return null;
  }
  return null;
}

// Fallback: check the 7-day streak reward localStorage flag set by
// StreakReward.activateCode() / StreakReward.claimReward(). The streak
// unlock is a 24h window stored locally — no backend round-trip, no JWT
// token. We use it as a fallback when the JWT path is absent (user never
// paid) or fails (network down, token expired/cleared) so a user who
// legitimately completed the 7-day trial still sees unlocked content.
function checkStreakUnlock() {
  try {
    var storage = getPremiumStorage();
    if (!storage) return { active: false, mode: 'none' };
    var raw = storage.getItem('starvia_streak_premium');
    if (raw) {
      var data = JSON.parse(raw);
      if (data && data.unlocked && data.expiresAt > Date.now()) {
        setPremiumUnlocked(true);
        return { active: true, mode: 'streak', expiresAt: data.expiresAt };
      }
    }
  } catch (e) { /* fall through to locked state */ }
  setPremiumUnlocked(false);
  return { active: false, mode: 'none' };
}

function restorePremiumStatus() {
  var cfg = getStarviaConfig();
  var token = getSavedPremiumToken();
  if (!token) {
    // No JWT — try the 7-day streak unlock so trial-completed users
    // don't get locked out after a reload.
    return Promise.resolve(checkStreakUnlock());
  }

  return fetch(cfg.apiBaseUrl + '/premium/status', {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.active) {
      setPremiumUnlocked(true, token);
      return data;
    }
    clearPremiumToken();
    setPremiumUnlocked(false);
    // JWT path failed (expired/invalid) — check streak unlock before
    // giving up entirely.
    return checkStreakUnlock();
  })
  .catch(function() {
    // Network error — try streak unlock as a best-effort fallback so
    // offline users with an active streak unlock still see premium.
    return checkStreakUnlock();
  });
}

// DEPRECATED: use isPremiumUnlocked(); legacy boolean mirror lives at window.isPremiumUnlockedFlag.
window.isPremiumUnlockedFlag = false;

function getStarviaConfig() {
  var cfg = (window && window.STARVIA_CONFIG) ? window.STARVIA_CONFIG : {};
  return {
    apiBaseUrl: (cfg.apiBaseUrl || '').replace(/\/$/, '')
  };
}

restorePremiumStatus();

function callPremiumVerifyApi(pin, cfg) {
  return fetch(cfg.apiBaseUrl + '/premium/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: pin })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.success) {
      onPremiumVerified(data.token || null);
    } else {
      onPremiumFailed();
    }
    return data;
  })
  .catch(function() {
    onPremiumFailed();
    return { success: false, error: 'NETWORK_ERROR' };
  });
}

// 1. เปิดป๊อปอัปชำระเงิน — รองรับ Omise auto-payment + fallback สลิปแมนนวล
var _omisePollTimer = null;
var _omiseChargeId = null;

function openPayment() {
  var overlay = document.getElementById('payment-modal');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'payment-modal';
    overlay.className = 'modal-overlay';

    // โครงสร้างหน้าต่างป๊อปอัป — Omise auto + fallback
    overlay.innerHTML = buildPaymentModalHtml();
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
  _omiseChargeId = null;

  // ลองสร้าง Omise payment อัตโนมัติ
  tryCreateOmisePayment();
}

// ── Build payment modal HTML ──
function buildPaymentModalHtml() {
  // Get user's name from storage if available
  var userName = '';
  try { userName = localStorage.getItem('starvia_display_name') || ''; } catch(e) {}

  var greeting = userName
    ? '<div style="font-size:11px;color:#7a6a9a;margin-bottom:8px;">สวัสดีคุณ ' + escapeHtml(userName) + '</div>'
    : '';

  return '<div class="modal-content" style="position:relative; max-height: 90vh; overflow-y: auto;">'
    + '<button class="modal-close" data-action="close-payment">✕</button>'

    // Hero section
    + '<div style="text-align:center; padding:5px 0 12px;">'
    + greeting
    + '<div style="color:#C9A227; font-size:13px; font-weight:600; letter-spacing:.06em; margin-bottom:2px;">✦ STARVIA PREMIUM ✦</div>'
    + '<div style="color:#fff; font-size:17px; font-weight:700; line-height:1.4; margin-bottom:4px;">ปลดล็อกดวงชะตาฉบับเต็ม</div>'
    + '<div style="color:#b8a8d8; font-size:11px; line-height:1.5;">เจาะลึกทุกมิติชีวิต — ตัวตน · ความรัก · การงาน · การเงิน<br>พร้อมคัมภีร์แก้ดวง 6 ด้าน และเครื่องมือเสริมดวงรายเดือน</div>'
    + '</div>'

    // Price card with anchoring and urgency
    + '<div style="background:rgba(201,162,39,0.08); border:1px solid rgba(201,162,39,0.25); border-radius:12px; padding:14px; margin-bottom:16px; text-align:center;">'
    + '<div style="font-size:10px; color:#888; letter-spacing:.04em; margin-bottom:4px;">ราคาปกติ</div>'
    + '<div style="font-size:20px; color:#8B6914; text-decoration:line-through; margin-bottom:2px;">590 THB</div>'
    + '<div style="font-size:30px; font-weight:700; color:#fff; line-height:1.1;">199 THB</div>'
    + '<div style="font-size:11px; color:#4CAF50; font-weight:600; margin-top:4px;">🔥 ลด 66% — Early Access ราคานี้เท่านั้น</div>'
    + '<div style="font-size:9px; color:#7a6a9a; margin-top:3px;">ชำระทุกเดือน · ไม่มีข้อผูกมัด ยกเลิกเมื่อไหร่ก็ได้</div>'
    + '</div>'

    // Benefits checklist
    + '<div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:12px; margin-bottom:15px;">'
    + '<div style="font-size:11px; color:#C9A227; font-weight:600; margin-bottom:8px;">✦ สิ่งที่คุณจะได้รับ:</div>'
    + '<div style="display:flex; flex-direction:column; gap:6px;">'
    + '<div style="display:flex; gap:8px; align-items:flex-start; font-size:10.5px; color:var(--tx2); line-height:1.4;"><span style="color:#4CAF50; font-size:12px;">✓</span> รายงานตัวตน + จุดอ่อนที่ซ่อนอยู่ 5 ด้าน</div>'
    + '<div style="display:flex; gap:8px; align-items:flex-start; font-size:10.5px; color:var(--tx2); line-height:1.4;"><span style="color:#4CAF50; font-size:12px;">✓</span> ดวงความรัก วิเคราะห์คู่แท้ + จังหวะเปิดหัวใจ</div>'
    + '<div style="display:flex; gap:8px; align-items:flex-start; font-size:10.5px; color:var(--tx2); line-height:1.4;"><span style="color:#4CAF50; font-size:12px;">✓</span> การงาน/การเงิน — ดาวเด่น ดาวเตือน + วิธีแก้</div>'
    + '<div style="display:flex; gap:8px; align-items:flex-start; font-size:10.5px; color:var(--tx2); line-height:1.4;"><span style="color:#4CAF50; font-size:12px;">✓</span> ภารกิจแก้ดวง 6 ด้าน พร้อมฤกษ์เปิดทางรายเดือน</div>'
    + '<div style="display:flex; gap:8px; align-items:flex-start; font-size:10.5px; color:var(--tx2); line-height:1.4;"><span style="color:#4CAF50; font-size:12px;">✓</span> คะแนนย่อย 4 ด้านในหน้าดูดวงคู่</div>'
    + '</div>'
    + '</div>'

    // QR area — dynamic (Omise) or static (fallback)
    + '<div id="payment-qr-area">'
    + '<div class="qr-box" style="margin: 0 auto 10px;"><img src="assets/qr-payment.jpg" style="max-width:100%; max-height:100%; object-fit:contain;" alt="QR Code"></div>'
    + '</div>'

    // Payment status (hidden by default, shown when Omise active)
    + '<div id="payment-status" style="display:none; text-align:center; padding:10px; margin-bottom:10px;"></div>'

    // Auto-pay button (shown when Omise available)
    + '<div id="omise-actions" style="display:none;">'
    + '<div style="background:rgba(76,175,80,0.1); border:1px solid rgba(76,175,80,0.3); border-radius:8px; padding:12px; margin-bottom:15px; text-align:center;">'
    + '<div style="font-size:12px; color:#4CAF50; font-weight:600;">⚡ ชำระอัตโนมัติ — ปลดล็อกทันทีหลังจ่าย</div>'
    + '<div id="omise-countdown" style="font-size:11px; color:#888; margin-top:4px;"></div>'
    + '</div>'
    + '</div>'

    // Manual slip flow — cleaner, less friction
    + '<div id="manual-payment" style="margin-top:5px;">'
    + '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:15px;">'

    // Step 1: Scan + Send
    + '<div style="display:flex; gap:10px; margin-bottom:12px;">'
    + '<div style="background:linear-gradient(135deg,#C9A227,#b08040); color:#1a0a2e; min-width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; margin-top:1px;">1</div>'
    + '<div style="flex:1;">'
    + '<div style="font-size:11px; color:#C9A227; font-weight:600; margin-bottom:2px;">สแกน QR — ชำระผ่าน Mobile Banking</div>'
    + '<div style="font-size:10px; color:#888; line-height:1.4;">ทุกธนาคาร · PromptPay</div>'
    + '</div></div>'

    + '<a href="https://m.me/61573341702581" target="_blank" class="pdf-btn" style="display:flex; align-items:center; justify-content:center; gap:6px; text-decoration:none; background:linear-gradient(90deg, #2196F3, #1565C0); color:#fff; font-size:13px; padding:11px; margin-bottom:10px; box-shadow:0 4px 12px rgba(33,150,243,0.25); animation:none;">💬 แนบสลิปส่งทาง Messenger</a>'

    // Step 2: Enter PIN
    + '<div style="display:flex; gap:10px; margin-bottom:10px;">'
    + '<div style="background:rgba(201,162,39,0.3); color:#C9A227; min-width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; margin-top:1px;">2</div>'
    + '<div style="flex:1;">'
    + '<div style="font-size:11px; color:#C9A227; font-weight:600; margin-bottom:2px;">กรอกรหัสปลดล็อก (แอดมินจะส่งให้ทาง Inbox)</div>'
    + '<input type="text" id="pdf-pin" class="pin-input" placeholder="รหัส 6 หลัก" style="margin-bottom:0; margin-top:4px;">'
    + '</div></div>'

    + '<button id="confirm-pay-btn" class="pdf-btn" style="width:100%; font-size:13px; padding:11px; margin-top:2px;" data-action="verify-pin">🔓 ยืนยัน — ปลดล็อก Premium</button>'
    + '</div>'

    // PIN error
    + '<div id="pin-error" style="color:#F44336; font-size:12px; display:none; margin-top:-5px; margin-bottom:10px;">❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</div>'
    + '</div>'

    // Trust signals: reviews + guarantee
    + '<div style="margin-top:12px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">'
    // Testimonials in a cleaner format
    + '<div style="display:flex; flex-direction:column; gap:8px;">'
    + '<div style="background:rgba(0,0,0,0.2); padding:10px 12px; border-radius:8px; border-left:2px solid #C9A227;">'
    + '<div style="font-size:10.5px; color:#d0c8a0; font-style:italic; line-height:1.5;">"ดูดวงมาเยอะ แต่ STARVIA คือเจอตรงจุดอ่อนเราเป๊ะ อ่านแล้วเอาไปปรับใช้ได้จริง ไม่ใช่แค่คำทำนายลอยๆ"</div>'
    + '<div style="font-size:9px; color:#7a6a9a; margin-top:5px; text-align:right;">— จุฑารัตน์, กรุงเทพฯ (ปลดล็อกแล้ว)</div>'
    + '</div>'
    + '<div style="background:rgba(0,0,0,0.2); padding:10px 12px; border-radius:8px; border-left:2px solid rgba(201,162,39,0.5);">'
    + '<div style="font-size:10.5px; color:#d0c8a0; font-style:italic; line-height:1.5;">"ส่วนการงานนี่ตรงมาก ช่วงนี้เจอปัญหาพอดี คำแนะนำช่วยให้ตัดสินใจได้ชัดขึ้น"</div>'
    + '<div style="font-size:9px; color:#7a6a9a; margin-top:5px; text-align:right;">— วิโรจน์, เชียงใหม่ (ปลดล็อกแล้ว)</div>'
    + '</div>'
    + '</div>'

    // Guarantee
    + '<div style="text-align:center; font-size:9px; color:#5a4a7a; margin-top:10px; letter-spacing:.04em;">📅 199 THB/เดือน · ยกเลิกเมื่อไหร่ก็ได้ · ยิ่งอ่านยิ่งคุ้ม</div>'
    + '</div>'

    + '</div>';
}

// ── Try to create Omise payment ──
function tryCreateOmisePayment() {
  var cfg = getStarviaConfig();

  fetch(cfg.apiBaseUrl + '/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: localStorage.getItem('starvia_email') || '',
      returnUrl: window.location.origin + '/payment-success'
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.success && data.qrUrl) {
      showOmiseQr(data);
    }
    // If Omise not configured, keep static QR (fallback)
  })
  .catch(function() {
    // Omise not available — keep static QR fallback
  });
}

// ── Show Omise QR code ──
function showOmiseQr(paymentData) {
  _omiseChargeId = paymentData.chargeId;

  var qrArea = document.getElementById('payment-qr-area');
  var omiseActions = document.getElementById('omise-actions');
  var statusEl = document.getElementById('payment-status');

  if (qrArea) {
    qrArea.innerHTML = '<div class="qr-box" style="margin: 0 auto 10px;">'
      + '<img src="' + paymentData.qrUrl + '" style="max-width:100%; max-height:100%; object-fit:contain;" alt="PromptPay QR">'
      + '</div>'
      + '<div style="text-align:center; font-size:11px; color:#888; margin-top:5px;">สแกนด้วย Mobile Banking ทุกธนาคาร</div>';
  }

  if (omiseActions) {
    omiseActions.style.display = 'block';
  }

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = '⏳ รอการชำระเงิน...';
    statusEl.style.color = '#FFC107';
  }

  // Start polling for payment status
  startPaymentPolling(paymentData.chargeId);
}

// ── Poll payment status ──
function startPaymentPolling(chargeId) {
  stopPaymentPolling();

  var cfg = getStarviaConfig();
  var attempts = 0;
  var maxAttempts = 60; // 5 minutes (5s interval)
  var startTime = Date.now();

  _omisePollTimer = setInterval(function() {
    attempts++;

    // Update countdown
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var remaining = Math.max(0, 300 - elapsed); // 5 min
    var countdownEl = document.getElementById('omise-countdown');
    if (countdownEl) {
      var min = Math.floor(remaining / 60);
      var sec = remaining % 60;
      countdownEl.textContent = 'QR หมดอายุใน ' + min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    if (attempts >= maxAttempts || remaining <= 0) {
      stopPaymentPolling();
      var statusEl = document.getElementById('payment-status');
      if (statusEl) {
        statusEl.innerHTML = '⏰ QR หมดอายุ — กรุณาปิดแล้วลองใหม่';
        statusEl.style.color = '#F44336';
      }
      return;
    }

    fetch(cfg.apiBaseUrl + '/payment/status/' + chargeId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.status === 'paid') {
          stopPaymentPolling();
          onPaymentSuccess(data);
        }
      })
      .catch(function() {});
  }, 5000);
}

function stopPaymentPolling() {
  if (_omisePollTimer) {
    clearInterval(_omisePollTimer);
    _omisePollTimer = null;
  }
}

// ── Payment success callback ──
function onPaymentSuccess(data) {
  var statusEl = document.getElementById('payment-status');
  if (statusEl) {
    statusEl.innerHTML = '✅ ชำระเงินสำเร็จ! กำลังปลดล็อก...';
    statusEl.style.color = '#4CAF50';
  }

  // If PIN returned, auto-verify
  if (data.pin) {
    var cfg = getStarviaConfig();
    callPremiumVerifyApi(data.pin, cfg);
  } else {
    // Direct unlock
    onPremiumVerified(null);
  }
}

function closePayment() {
  stopPaymentPolling();
  document.getElementById('payment-modal').style.display = 'none';
}

// 2. ระบบตรวจรหัสผ่านจาก backend/admin-generated code เท่านั้น
function verifyPin() {
  var pin = document.getElementById('pdf-pin').value.trim().toUpperCase();
  var cfg = getStarviaConfig();

  return callPremiumVerifyApi(pin, cfg);
}

function onPremiumVerified(token) {
  if (token) persistPremiumToken(token);

  var btn = document.getElementById('confirm-pay-btn');
  var err = document.getElementById('pin-error');

  err.style.display = 'none';
  btn.innerHTML = '✅ ปลดล็อกสำเร็จ!';
  btn.style.background = '#4CAF50';
  btn.style.color = '#fff';
  btn.disabled = true;

  setTimeout(function() {
    setPremiumUnlocked(true, token);
    // แฟล็กถาวรให้ทุกส่วนเห็นตรงกัน (โซนสมาชิก/ป้าย/โควต้า) + รีเฟรชโซนสมาชิกทันที
    try { localStorage.setItem('starvia_premium', 'true'); } catch (e) {}
    try {
      if (typeof MemberHub !== 'undefined' && MemberHub.render) { MemberHub.render(); }
      var promo = document.getElementById('promo-pack');
      if (promo) promo.style.display = 'none';
    } catch (e2) {}

    document.querySelectorAll('.is-locked').forEach(function(el) {
      el.classList.remove('is-locked');
      var overlay = el.querySelector('.lock-overlay');
      if(overlay) overlay.remove();
    });

    // วาดรายงานที่เปิดอยู่ใหม่เป็นฉบับเต็มทันที (สมาชิกไม่ตัดโควต้า)
    try {
      var modes = [['r0', 'go0'], ['r1', 'go1'], ['r2', 'go2']];
      for (var i = 0; i < modes.length; i++) {
        var wrap = document.getElementById(modes[i][0]);
        var fn = window[modes[i][1]];
        if (wrap && wrap.innerHTML.trim().length > 100 && typeof fn === 'function') { fn(); break; }
      }
    } catch (e3) {}

    closePayment();
    window.scrollBy({ top: 150, behavior: 'smooth' });
  }, 800);
}

// ===== COLLAPSIBLE SECTIONS =====
function initCollapsibleSections() {
  document.querySelectorAll('.collapsible-section').forEach(function(section) {
    var body = section.querySelector('.section-body');
    var toggle = section.querySelector('.section-toggle');
    if (!body || !toggle) return;

    // Make sure aria-expanded matches the actual collapsed state on init
    if (toggle.hasAttribute('aria-expanded')) {
      toggle.setAttribute('aria-expanded', section.classList.contains('collapsed') ? 'false' : 'true');
    }

    // Measure and set the actual content height
    function measureHeight() {
      // Temporarily remove max-height to measure real content
      body.style.setProperty('--section-h', 'none');
      var h = body.scrollHeight;
      body.style.setProperty('--section-h', h + 'px');
    }

    // Initial measurement (for non-collapsed sections)
    if (!section.classList.contains('collapsed')) {
      requestAnimationFrame(measureHeight);
    }

    function activate() {
      var willCollapse = !section.classList.contains('collapsed');
      if (willCollapse) {
        // About to collapse: set explicit height first, then animate to 0
        var h = body.scrollHeight;
        body.style.setProperty('--section-h', h + 'px');
        // Force reflow so the browser registers the starting height
        body.offsetHeight;
        section.classList.add('collapsed');
      } else {
        // About to expand: measure target height, set it, remove collapsed
        section.classList.remove('collapsed');
        requestAnimationFrame(measureHeight);
      }
      // Sync aria-expanded with new state
      if (toggle.hasAttribute('aria-expanded')) {
        toggle.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
      }
      // Announce state change for screen readers
      if (typeof announce === 'function') {
        announce(willCollapse ? 'ปิดหัวข้อ' : 'ขยายหัวข้อ');
      }
    }

    toggle.addEventListener('click', activate);

    // Keyboard activation: Enter or Space toggles the section
    toggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        activate();
      }
    });
  });
}

function onPremiumFailed() {
  var btn = document.getElementById('confirm-pay-btn');
  var err = document.getElementById('pin-error');

  err.style.display = 'block';
  btn.innerHTML = '❌ กรอกรหัสใหม่อีกครั้ง';
  btn.style.background = '#F44336';
  btn.style.color = '#fff';

  setTimeout(function() {
    btn.innerHTML = '🔓 ยืนยันรหัสปลดล็อก';
    btn.style.background = '';
    btn.style.color = '';
  }, 2000);
}

