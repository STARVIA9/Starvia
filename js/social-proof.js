// ===== SOCIAL PROOF — เลขจริง 100% =====
// ดึงจาก /v1/stats/public (นับใน KV + FB Graph) — ไม่มีตัวเลขสุ่ม/แต่งอีกต่อไป
// หลักการ: API ล้ม = โชว์ "—" หรือซ่อนบล็อก ไม่โชว์เลขมั่ว
// โหวต "ตรงไหม" เก็บจริง 1 คน/โหมด/เบราว์เซอร์ (+ กันซ้ำฝั่งเซิร์ฟเวอร์ 1 IP/วัน)

(function() {
  'use strict';

  var API = '/v1/stats/public';
  var VOTE_API = '/v1/stats/vote';
  var EVENT_API = '/v1/stats/event';
  var MIN_VOTES_LABEL = 3;

  function $(id) { return document.getElementById(id); }

  function fmt(n) {
    n = Number(n) || 0;
    return n.toLocaleString('th-TH');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== ANIMATED COUNTER (ของเดิม — เอาไว้ เฉพาะเลขนับจริง) =====
  function animateCounter(el, target, duration) {
    if (!el) return;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = fmt(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = fmt(target);
      }
    }
    requestAnimationFrame(step);
  }

  function animateWhenVisible(el, target) {
    if (!el || !('IntersectionObserver' in window)) {
      if (el) el.textContent = fmt(target);
      return;
    }
    el.textContent = '0';
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(el, target, 2000);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(el.parentElement || el);
  }

  // ===== RENDER STATS (เลขจริง) =====
  function renderStats(s) {
    var totalEl = $('sp-total-count');
    if (totalEl) animateWhenVisible(totalEl, s.reportsTotal || 0);

    var todayEl = $('sp-today-count');
    if (todayEl) todayEl.textContent = fmt(s.reportsToday);

    var drawsEl = $('sp-draws-count');
    if (drawsEl) drawsEl.textContent = fmt(s.drawsTotal);

    var pctEl = $('sp-vote-pct');
    if (pctEl) {
      pctEl.textContent = (s.ratingPct == null) ? 'รอคะแนน' : (s.ratingPct + '%');
    }
    var vcEl = $('sp-vote-count');
    if (vcEl) vcEl.textContent = fmt(s.votesTotal);

    var fbEl = $('sp-fb-count');
    if (fbEl) {
      if (s.fbFollowers == null) {
        var card = fbEl.closest('.sp-stat-card');
        if (card) card.style.display = 'none';
      } else {
        fbEl.textContent = fmt(s.fbFollowers) + '+';
      }
    }
  }

  // ===== REAL FB COMMENTS (แทนรีวิวแต่ง) =====
  var commentIdx = 0;
  var commentTimer = null;

  function renderComment(container, c) {
    var d = '';
    if (c.time) {
      try {
        d = new Date(c.time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      } catch (e) { d = ''; }
    }
    container.innerHTML = '<div class="testimonial-card testimonial-enter">'
      + '<div class="testimonial-stars">💬 ความเห็นจากเพจ</div>'
      + '<p class="testimonial-text">"' + escapeHTML(c.text) + '"</p>'
      + '<div class="testimonial-author">— ' + escapeHTML(c.name) + (d ? ', ' + d : '') + '</div>'
      + '</div>';
  }

  function setupComments(comments) {
    var container = $('testimonials-container');
    if (!container) return;
    if (!comments || !comments.length) {
      container.style.display = 'none';
      return;
    }
    commentIdx = Math.floor(Math.random() * comments.length);
    renderComment(container, comments[commentIdx]);
    if (commentTimer) clearInterval(commentTimer);
    if (comments.length > 1) {
      commentTimer = setInterval(function() {
        var card = container.querySelector('.testimonial-card');
        if (card) card.classList.add('testimonial-exit');
        setTimeout(function() {
          commentIdx = (commentIdx + 1) % comments.length;
          renderComment(container, comments[commentIdx]);
        }, 500);
      }, 10000);
    }
  }

  // ===== AUTHORITY BADGE (ของเดิม — เป็นข้อความอธิบาย ไม่ใช่สถิติ) =====
  function renderAuthorityBadge() {
    var container = $('sp-authority');
    if (!container) return;
    container.innerHTML = '<div class="sp-authority-inner">'
      + '<div class="sp-authority-icon">🔭</div>'
      + '<div class="sp-authority-text">'
      + '<div class="sp-authority-title">วิเคราะห์จากโหราศาสตร์ไทยโบราณ</div>'
      + '<div class="sp-authority-detail">นพเคราะห์ · ทักษาปกรณ์ · ราศีจักร · ลัคนา · ตำแหน่งดาว 7 ดวง</div>'
      + '</div>'
      + '</div>';
  }

  // ===== INIT =====
  function init() {
    renderAuthorityBadge();
    fetch(API, { headers: { 'Accept': 'application/json' } })
      .then(function(res) { return res.json(); })
      .then(function(s) {
        if (!s || s.success === false) throw new Error('stats api failed');
        renderStats(s);
        setupComments(s.comments);
      })
      .catch(function() {
        // API ล้ม → ใส่ขีด ไม่โชว์เลขมั่ว
        ['sp-total-count', 'sp-today-count', 'sp-draws-count', 'sp-vote-count'].forEach(function(id) {
          var el = $(id);
          if (el) el.textContent = '—';
        });
        var pctEl = $('sp-vote-pct');
        if (pctEl) pctEl.textContent = '—';
        var box = $('testimonials-container');
        if (box) box.style.display = 'none';
      });
  }

  // ===== PING: เปิดรายงานสำเร็จ → นับ 1 (ยิงครั้งเดียว/รายงาน) =====
  var pinged = {};
  function pingReport(mode) {
    mode = mode || 'm0';
    if (pinged[mode]) return;
    pinged[mode] = true;
    try {
      fetch(EVENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report' }),
      }).catch(function() {});
    } catch (e) {}
  }

  // ===== VOTE WIDGET: "อ่านจบแล้ว ตรงไหม?" (แปะท้ายรายงาน) =====
  function mountVote(el, mode) {
    if (!el || el.querySelector('.vote-box')) return;
    mode = mode || 'm0';
    var votedKey = 'starvia_voted_' + mode;
    var box = document.createElement('div');
    box.className = 'vote-box';
    box.setAttribute('style', 'margin:18px auto 6px;max-width:560px;text-align:center;padding:16px;border:1px solid rgba(214,173,69,.25);border-radius:16px;background:rgba(255,255,255,.03)');
    function already() {
      try { return localStorage.getItem(votedKey) === '1'; } catch (e) { return false; }
    }
    function paintThank(pct, total) {
      var extra = (pct == null) ? ' (รอครบ 3 คะแนนถึงโชว์ %)' : ' — ตอนนี้ ' + pct + '% บอกว่าตรง (' + fmt(total) + ' คน)';
      box.innerHTML = '<div style="font-size:15px;color:#efe8d6">🙏 ขอบคุณที่โหวตค่ะ' + escapeHTML(extra) + '</div>';
    }
    if (already()) {
      fetch(API).then(function(r) { return r.json(); }).then(function(s) {
        paintThank(s.ratingPct != null ? s.ratingPct : null, s.votesTotal || 0);
      }).catch(function() {
        box.innerHTML = '<div style="font-size:15px;color:#efe8d6">🙏 โหวตแล้ว ขอบคุณค่ะ</div>';
      });
    } else {
      box.innerHTML = '<div style="font-size:15px;font-weight:700;color:#ffd86b;margin-bottom:10px">อ่านจบแล้ว — ตรงกับชีวิตไหมคะ?</div>'
        + '<div style="display:flex;gap:10px;justify-content:center">'
        + '<button class="vote-up" style="flex:1;max-width:200px;padding:12px;border-radius:12px;border:1px solid #D6AD45;background:#D6AD45;color:#09061c;font-weight:700;font-size:15px;cursor:pointer">👍 ตรง</button>'
        + '<button class="vote-down" style="flex:1;max-width:200px;padding:12px;border-radius:12px;border:1px solid #8E72D8;background:rgba(255,255,255,.06);color:#efe8d6;font-weight:700;font-size:15px;cursor:pointer">👎 ไม่ค่อยตรง</button>'
        + '</div><div class="vote-msg" style="margin-top:8px;font-size:13px;color:#b4a1ea"></div>';
      box.querySelector('.vote-up').addEventListener('click', function() { submitVote('up'); });
      box.querySelector('.vote-down').addEventListener('click', function() { submitVote('down'); });
    }
    function submitVote(v) {
      var msg = box.querySelector('.vote-msg');
      if (msg) msg.textContent = 'กำลังส่ง...';
      fetch(VOTE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: v }),
      }).then(function(r) { return r.json(); }).then(function(s) {
        try { localStorage.setItem(votedKey, '1'); } catch (e) {}
        paintThank(s.ratingPct != null ? s.ratingPct : null, s.votesTotal || 0);
      }).catch(function() {
        if (msg) msg.textContent = 'ส่งไม่สำเร็จ ลองใหม่นะคะ';
      });
    }
    el.appendChild(box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.StarviaStats = {
    pingReport: pingReport,
    mountVote: mountVote,
  };
})();
