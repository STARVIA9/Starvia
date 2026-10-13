/**
 * Cosmic Events Banner — STARVIA
 * Shows current/upcoming astrological events as a subtle banner above the mode nav.
 * No Buddhist terminology — pure celestial/cosmic language.
 * Self-contained module, no dependencies on app.js or ui-actions.js.
 * 
 * Architecture:
 * - Pre-computed notable events for 2026–2027 (new/full moons, solstices, retrogrades)
 * - On DOMContentLoaded: check today's event → render banner if any
 * - Banner auto-refreshes at midnight (only re-renders if event changed)
 */

var CosmicEvents = (function() {
  'use strict';

  // ─── Event Database ───────────────────────────────────────────
  // Auto-generated from astronomy-engine (Moon phases, planetary ingresses, seasons)
  // To regenerate: node scripts/generate-cosmic-events.mjs
  
  var EVENTS = typeof GENERATED_EVENTS !== 'undefined' ? GENERATED_EVENTS : [
    // Fallback: hardcoded events if generated data not loaded
    { start: '2026-06-14', end: '2026-06-15', emoji: '💛', title: 'Venus เข้าราศีสิงห์', subtitle: 'พลังความรักเร่าร้อน — ดูดวงความรักวันนี้', cta: '♡ เช็กดวงคู่' },
  ];

  // ─── Core Logic ───────────────────────────────────────────────

  /** Get today's date as YYYY-MM-DD */
  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /** Find the first event covering today */
  function getCurrentEvent() {
    var today = todayISO();
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      var start = e.start;
      var end = e.end || e.start;  // single-day event if no end
      if (today >= start && today <= end) {
        return e;
      }
    }
    return null;
  }

  /** Get the next upcoming event (for "coming soon" state) */
  function getNextEvent() {
    var today = todayISO();
    for (var i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].start > today) {
        return EVENTS[i];
      }
    }
    return EVENTS[0];  // wrap to next year's first event
  }

  // ─── Rendering ─────────────────────────────────────────────────

  function renderBanner() {
    var event = getCurrentEvent();
    if (!event) {
      // No event today — try "upcoming" style
      renderNextUpcoming();
      return;
    }

    var banner = createBannerElement(event.emoji, event.title, event.subtitle, event.cta, false, event.zodiac, impactFor(event));
    insertBanner(banner);
  }

  function renderNextUpcoming() {
    var next = getNextEvent();
    if (!next) return;
    var banner = createBannerElement(
      next.emoji,
      'Coming Soon: ' + next.title,
      next.subtitle,
      null,
      true,  // subtle mode
      next.zodiac,
      impactFor(next)
    );
    insertBanner(banner);
  }

  // ─── Zodiac SVG Icon Helper ──────────────────────────────────
  // Map Thai zodiac names to index (matching RASI_EN_NAMES in reading-helpers.js)
  var ZODIAC_TH_TO_IDX = {
    'เมษ': 0, 'พฤษภ': 1, 'มิถุน': 2, 'กรกฎ': 3,
    'สิงห์': 4, 'กันย์': 5, 'ตุล': 6, 'ตุลย์': 6,
    'พิจิก': 7, 'ธนู': 8, 'มกร': 9, 'กุมภ์': 10, 'มีน': 11
  };
  var ZODIAC_EN = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];

  /** Get SVG icon HTML for a zodiac sign */
  function zodiacIconHtml(thaiName, size) {
    var idx = ZODIAC_TH_TO_IDX[thaiName];
    if (idx === undefined) return '';
    size = size || 24;
    var num = String(idx + 1).padStart(2, '0');
    return '<img class="ceb-zodiac-icon" src="assets/zodiac/' + num + '-' + ZODIAC_EN[idx] + '.svg?v=2" width="' + size + '" height="' + size + '" alt="ราศี' + thaiName + '">';
  }

  // เปลี่ยนปุ๊บกระทบอะไร — ภาษาบ้านๆ ต่อท้ายแถบ (12 ต.ค.69)
  function impactFor(e) {
    if (!e) return '';
    if (e.type === 'moon_phase') {
      if (/Full/i.test(e.title || '')) return 'อารมณ์ ความสัมพันธ์ เรื่องที่สุกงอม';
      return 'การเริ่มต้น สิ่งใหม่ ตั้งเป้าหมาย';
    }
    if (e.type === 'season') return 'จังหวะชีวิต เปลี่ยนฤดูกาล วางแผนใหม่';
    if (e.type === 'ingress') {
      var p = e.planet || '';
      if (p === 'Venus') return 'ความรัก การเงิน ความสุข';
      if (p === 'Mars') return 'งาน พลัง การแข่งขัน';
      if (p === 'Jupiter') return 'โชค ผู้ใหญ่ การเรียน';
      if (p === 'Mercury') return 'สื่อสาร เดินทาง เอกสาร';
      if (p === 'Saturn') return 'งานหนัก ภาระ ความอดทน';
      return 'จังหวะชีวิตโดยรวม';
    }
    return '';
  }

  function createBannerElement(emoji, title, subtitle, cta, subtle, zodiacName, impact) {
    var div = document.createElement('div');
    div.className = 'cosmic-event-banner' + (subtle ? ' is-upcoming' : '');

    // Use SVG zodiac icon if zodiac name provided, otherwise use emoji
    var iconHtml = zodiacName ? zodiacIconHtml(zodiacName, 28) : '<span class="ceb-emoji">' + emoji + '</span>';
    var inner = iconHtml;
    inner += '<span class="ceb-text">';
    inner += '<span class="ceb-title">' + escapeHTML(title) + '</span>';
    if (subtitle) {
      inner += '<span class="ceb-subtitle">' + escapeHTML(subtitle) + '</span>';
    }
    if (impact) {
      inner += '<span class="ceb-impact">👉 กระทบ: ' + escapeHTML(impact) + '</span>';
    }
    inner += '</span>';

    if (cta) {
      var ctaLink = '#fc0';
      if (cta.indexOf('♡') !== -1) ctaLink = '#fc1';  // couple mode
      inner += '<a class="ceb-cta" href="' + ctaLink + '">' + escapeHTML(cta) + '</a>';
    } else if (/Full/i.test(title || '')) {
      // จันทร์เต็มดวง: ปุ่มพาไปโซนสมาชิกรับคำทำนาย (แถบทำหน้าที่"รู้" ส่วน hub ทำหน้าที่"ได้") (13 ต.ค.69)
      inner += '<a class="ceb-cta" href="#member-hub">🌕 รับคำทำนาย</a>';
    }

    div.innerHTML = inner;
    return div;
  }

  function insertBanner(bannerEl) {
    // Insert after .hd (hero), before .modenav
    var hero = document.querySelector('.hd');
    var modeNav = document.querySelector('.modenav');
    
    if (hero && modeNav) {
      hero.parentNode.insertBefore(bannerEl, modeNav);
    } else if (hero) {
      hero.parentNode.insertBefore(bannerEl, hero.nextSibling);
    } else {
      // Fallback: prepend to body
      document.body.insertBefore(bannerEl, document.body.firstChild);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Midnight Auto-Update ──────────────────────────────────────

  var _currentEventKey = null;  // track displayed event to avoid no-op re-renders

  /** Remove existing banner element from DOM */
  function removeBanner() {
    var old = document.querySelector('.cosmic-event-banner');
    if (old) old.parentNode.removeChild(old);
  }

  /** ms until next local midnight */
  function msUntilMidnight() {
    var now = new Date();
    var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return midnight - now;
  }

  /** Check if event changed since last render; if so, re-render banner */
  function midnightCheck() {
    var ev = getCurrentEvent();
    var key = ev ? ev.start + '|' + ev.end : 'none';
    if (key !== _currentEventKey) {
      removeBanner();
      renderBanner();
    }
    scheduleMidnight();  // re-schedule for next midnight
  }

  /** Schedule next midnight refresh */
  function scheduleMidnight() {
    setTimeout(midnightCheck, msUntilMidnight() + 500);  // +500ms buffer
  }

  // ─── Init ──────────────────────────────────────────────────────

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        renderBanner();
        _currentEventKey = (function() {
          var ev = getCurrentEvent();
          return ev ? ev.start + '|' + ev.end : 'none';
        })();
        scheduleMidnight();
      });
    } else {
      renderBanner();
      _currentEventKey = (function() {
        var ev = getCurrentEvent();
        return ev ? ev.start + '|' + ev.end : 'none';
      })();
      scheduleMidnight();
    }
  }

  // Expose for debugging/testing
  CosmicEvents = {
    getCurrentEvent: getCurrentEvent,
    getNextEvent: getNextEvent,
    renderBanner: renderBanner,
  };

  init();
  return CosmicEvents;
})();
