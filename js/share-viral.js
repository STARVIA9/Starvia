// ===== SHARE & VIRAL ENGINE =====
// "ส่งดวงให้เพื่อน" — Viral loop via LINE, Facebook, Copy Link
// Generates personalized share messages with fortune teasers

(function() {
  'use strict';

  var SITE_URL = 'https://starvia.website';
  var SHARE_TEXT_FALLBACK = '✦ STARVIA — ดูดวงไทยโบราณแบบคนยุคใหม่ ✦';
  var ONBOARDING_KEY = 'starvia_onboarding';

  // ===== Share Message Templates =====
  // Short, punchy, creates Information Gap
  var SHARE_MESSAGES = [
    '🔮 ดวงวันนี้ของฉันบอกว่า: "{teaser}" — ดูของเธอบ้างสิ!',
    '✨ วันนี้ดาวบอกฉันว่า "{teaser}" ลองดูดวงตัวเองที่ STARVIA สิ!',
    '🌟 เจอไพ่ "{card}" วันนี้! ความหมายคือ "{teaser}" — ดวงเธอจะเป็นยังไง?',
    '💫 ดวงวันนี้: "{teaser}" 🔮 อยากดูของตัวเองมั้ย?',
    '⭐ สีมงคลวันนี้ของฉันคือ {color}! ของเธอจะเป็นสีอะไร? ลองดูที่ STARVIA สิ!'
  ];

  // ===== Helpers =====
  function getLS() {
    return (typeof localStorage !== 'undefined') ? localStorage : (window && window.localStorage);
  }

  function safeJSON(str) {
    try { return JSON.parse(str); } catch(e) { return null; }
  }

  function getTodayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function seededRandom(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  // ===== Reading context (set when rendering on result page) =====
  var _readingQuote = null;
  var _readingName = null;

  // ===== Generate Share Message =====
  function generateShareMessage() {
    // If we're on the reading result page, use the stored reading data
    if (_readingQuote) {
      var teaser = _readingQuote;
      if (teaser.length > 60) {
        teaser = teaser.substring(0, 57) + '...';
      }
      var seed = _readingName + ':' + getTodayKey();
      var templateIdx = seededRandom(seed) % SHARE_MESSAGES.length;
      var template = SHARE_MESSAGES[templateIdx];
      // For card/color, try daily fortune as fallback (deterministic from birth data)
      var cardName = '', colorName = '';
      try {
        var PF = window.PersonalizedFortune;
        if (PF) {
          var bd = PF.getBirthData();
          var ft = PF.buildPersonalizedFortune(bd);
          cardName = ft.fortuneCard.name;
          colorName = ft.luckyColor.name;
        }
      } catch(e) {}
      return template
        .replace('{teaser}', teaser)
        .replace('{card}', cardName)
        .replace('{color}', colorName);
    }

    var PF = window.PersonalizedFortune;
    if (!PF) return SHARE_TEXT_FALLBACK;

    var birthData = PF.getBirthData();
    var fortune = PF.buildPersonalizedFortune(birthData);

    // Pick template (seeded per day so same user shares same message all day)
    var seed = (birthData && birthData.dob ? birthData.dob : 'anon') + ':' + getTodayKey();
    var templateIdx = seededRandom(seed) % SHARE_MESSAGES.length;
    var template = SHARE_MESSAGES[templateIdx];

    // Create teaser from fortune (short version of the quote)
    var teaser = fortune.quote;
    // Truncate to ~60 chars for share
    if (teaser.length > 60) {
      teaser = teaser.substring(0, 57) + '...';
    }

    var message = template
      .replace('{teaser}', teaser)
      .replace('{card}', fortune.fortuneCard.name)
      .replace('{color}', fortune.luckyColor.name);

    return message;
  }

  // ===== Share Functions =====

  function getShareUrl() {
    var birthData = getBirthDataFromStorage();
    var url = SITE_URL + '/share.html';
    if (birthData && birthData.dob) {
      url += '?dob=' + encodeURIComponent(birthData.dob);
      if (birthData.name) url += '&name=' + encodeURIComponent(birthData.name);
    }
    return url;
  }

  function getBirthDataFromStorage() {
    try {
      var raw = getLS().getItem(ONBOARDING_KEY);
      var data = safeJSON(raw);
      if (data && data.birthData) return data.birthData;
    } catch(e) {}
    return null;
  }

  function shareToLine() {
    var shareUrl = getShareUrl();
    var text = generateShareMessage() + '\n' + shareUrl;
    // LINE direct share (text+link) — works without OG tags
    var url = 'https://line.me/R/msg/text/?' + encodeURIComponent(text);
    window.location.href = url;
    recordShare('line');
  }

  function shareToFacebook() {
    var shareUrl = getShareUrl();
    var url = 'https://www.facebook.com/sharer/sharer.php?u='
      + encodeURIComponent(shareUrl)
      + '&quote=' + encodeURIComponent(generateShareMessage());
    window.location.href = url;
    recordShare('facebook');
  }

  function shareToX() {
    var text = generateShareMessage();
    var shareUrl = getShareUrl();
    var url = 'https://twitter.com/intent/tweet?text='
      + encodeURIComponent(text)
      + '&url=' + encodeURIComponent(shareUrl);
    window.location.href = url;
    recordShare('x');
  }

  function copyShareLink() {
    var shareUrl = getShareUrl();

    // Try clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(function() {
        showCopySuccess();
      }).catch(function() {
        fallbackCopy(shareUrl);
      });
    } else {
      fallbackCopy(shareUrl);
    }
    recordShare('copy');
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopySuccess();
    } catch(e) {
      // silently fail
    }
    document.body.removeChild(ta);
  }

  function showCopySuccess() {
    var btn = document.getElementById('share-copy-btn');
    if (!btn) return;
    var original = btn.innerHTML;
    btn.innerHTML = '✅ คัดลอกแล้ว!';
    btn.classList.add('share-copied');
    setTimeout(function() {
      btn.innerHTML = original;
      btn.classList.remove('share-copied');
    }, 2000);
  }

  // ===== Share Tracking =====
  function recordShare(platform) {
    try {
      var key = 'starvia_shares';
      var raw = getLS().getItem(key);
      var data = safeJSON(raw) || { total: 0, platforms: {} };
      data.total++;
      data.platforms[platform] = (data.platforms[platform] || 0) + 1;
      data.lastShare = new Date().toISOString();
      getLS().setItem(key, JSON.stringify(data));

      // Update gamification points
      if (window.Gamification && window.Gamification.completeChallenge) {
        window.Gamification.completeChallenge('share-result');
      }

      // แชร์แลกโควต้าดูดวงเพิ่ม (สูงสุด +2/วัน)
      try {
        if (typeof grantShareBonus === 'function' && grantShareBonus()
          && typeof updateQuotaMeters === 'function') { updateQuotaMeters(); }
      } catch (e) { /* ignore */ }
    } catch(e) { /* ignore */ }
  }

  // ===== Native Web Share API =====
  function nativeShare() {
    if (!navigator.share) return false;

    var text = generateShareMessage();
    navigator.share({
      title: '✦ STARVIA — ดวงวันนี้ ✦',
      text: text,
      url: SITE_URL
    }).then(function() {
      recordShare('native');
    }).catch(function() {
      // User cancelled — no action needed
    });
    return true;
  }

  // ===== Render Share Section =====
  function renderShareSection() {
    // Clear any stale reading context — this section is on the landing page
    _readingQuote = null;
    _readingName = null;

    var container = document.getElementById('df-share-section');
    if (!container) return;

    var html = '<div class="share-header">'
      + '<span class="share-icon">📤</span>'
      + '<span class="share-title">ส่งดวงให้เพื่อน</span>'
      + '</div>'
      + '<div class="share-buttons">';

    // LINE (most popular in Thailand)
    html += '<button class="share-btn share-btn-line" onclick="ShareViral.shareToLine()" title="ส่งทาง LINE">'
      + '<span class="share-btn-icon">💬</span>'
      + '<span class="share-btn-label">LINE</span>'
      + '</button>';

    // Facebook
    html += '<button class="share-btn share-btn-fb" onclick="ShareViral.shareToFacebook()" title="แชร์บน Facebook">'
      + '<span class="share-btn-icon">📘</span>'
      + '<span class="share-btn-label">Facebook</span>'
      + '</button>';

    // X/Twitter
    html += '<button class="share-btn share-btn-x" onclick="ShareViral.shareToX()" title="แชร์บน X">'
      + '<span class="share-btn-icon">🐦</span>'
      + '<span class="share-btn-label">X</span>'
      + '</button>';

    // Copy Link
    html += '<button class="share-btn share-btn-copy" id="share-copy-btn" onclick="ShareViral.copyShareLink()" title="คัดลอกลิงก์">'
      + '<span class="share-btn-icon">🔗</span>'
      + '<span class="share-btn-label">คัดลอก</span>'
      + '</button>';

    // Native share (mobile)
    if (navigator.share) {
      html += '<button class="share-btn share-btn-native" onclick="ShareViral.nativeShare()" title="แชร์">'
        + '<span class="share-btn-icon">📱</span>'
        + '<span class="share-btn-label">แชร์</span>'
        + '</button>';
    }

    html += '</div>';

    // Subtle hint
    html += '<div class="share-hint">✦ ยิ่งแชร์ ยิ่งเสริมพลังดวง ✦</div>';

    // Preview link
    html += '<div class="share-preview">'
      + '<a class="share-preview-link" href="' + (typeof ShareViral !== 'undefined' && ShareViral.getShareUrl ? ShareViral.getShareUrl() : '/share.html') + '" target="_blank">👁️ ดูตัวอย่างบัตรดวงชะตา</a>'
      + '</div>';

    container.innerHTML = html;
  }

  // ===== Init =====
  function init() {
    renderShareSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== Render Personalized Share Section =====
  function renderPersonalizedShare(containerId, fortuneQuote, userName) {
    // Store reading context so generateShareMessage() can use it
    _readingQuote = fortuneQuote || null;
    _readingName = userName || 'คุณ';

    var container = document.getElementById(containerId);
    if (!container) return;

    // Create teaser from fortune quote
    var teaser = fortuneQuote || 'ดวงวันนี้ของฉันน่าสนใจมาก!';
    if (teaser.length > 80) {
      teaser = teaser.substring(0, 77) + '...';
    }

    var html = '<div class="share-header">'
      + '<span class="share-icon">📤</span>'
      + '<span class="share-title">แชร์ผลดวงของคุณ</span>'
      + '</div>'
      + '<div class="share-teaser">"' + escapeHTML(teaser) + '"</div>'
      + '<div class="share-buttons">';

    // LINE
    html += '<button class="share-btn share-btn-line" onclick="ShareViral.shareToLine()" title="ส่งทาง LINE">'
      + '<span class="share-btn-icon">💬</span>'
      + '<span class="share-btn-label">LINE</span>'
      + '</button>';

    // Facebook
    html += '<button class="share-btn share-btn-fb" onclick="ShareViral.shareToFacebook()" title="แชร์บน Facebook">'
      + '<span class="share-btn-icon">📘</span>'
      + '<span class="share-btn-label">Facebook</span>'
      + '</button>';

    // X
    html += '<button class="share-btn share-btn-x" onclick="ShareViral.shareToX()" title="แชร์บน X">'
      + '<span class="share-btn-icon">🐦</span>'
      + '<span class="share-btn-label">X</span>'
      + '</button>';

    // Copy
    html += '<button class="share-btn share-btn-copy" id="ind-share-copy-btn" onclick="ShareViral.copyShareLink()" title="คัดลอกลิงก์">'
      + '<span class="share-btn-icon">🔗</span>'
      + '<span class="share-btn-label">คัดลอก</span>'
      + '</button>';

    // Native share (mobile)
    if (navigator.share) {
      html += '<button class="share-btn share-btn-native" onclick="ShareViral.nativeShare()" title="แชร์">'
        + '<span class="share-btn-icon">📱</span>'
        + '<span class="share-btn-label">แชร์</span>'
        + '</button>';
    }

    html += '</div>';
    html += '<div class="share-hint">✦ ยิ่งแชร์ ยิ่งเสริมพลังดวง ✦</div>';

    container.innerHTML = html;
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ===== Public API =====
  window.ShareViral = {
    shareToLine: shareToLine,
    shareToFacebook: shareToFacebook,
    shareToX: shareToX,
    copyShareLink: copyShareLink,
    nativeShare: nativeShare,
    generateShareMessage: generateShareMessage,
    recordShare: recordShare,
    getShareUrl: getShareUrl,
    renderPersonalizedShare: renderPersonalizedShare
  };
})();
