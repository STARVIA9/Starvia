// ===== SOCIAL PROOF ENGINE v2 =====
// Dynamic numbers, animated counters, rotating testimonials
// Numbers use Base + Time + Random for natural-looking growth

(function() {
  'use strict';

  // ===== HIT BEACON (นับจริง — ครั้งเดียวต่อ session) =====
  function hit(type, tab) {
    try {
      if (typeof fetch !== 'function' || typeof sessionStorage === 'undefined') return;
      var key = 'sv_' + type + '_' + (tab || 'x');
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      fetch('/v1/stats/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, tab: tab })
      }).catch(function () {});
    } catch (e) {}
  }

  function trackVisit() { hit('visit'); }
  function trackRead(tab) { hit('read', tab); }

  // ===== REAL STATS (เลขจริงจากเพจผ่าน /v1/stats/public) =====
  // ไม่มีสูตรวิ่งแล้ว — ตัวเลขมาจาก API เพจจริงเท่านั้น (12 ต.ค.69)
  var REAL_FALLBACK = 17619; // ยอดติดตามจริง ณ 11 ต.ค.69 (fallback ระหว่างรอ API)

  function fmt(n) {
    try { return Number(n).toLocaleString('th-TH'); }
    catch (e) { return String(n); }
  }

  // ดึงเลขจริงครั้งเดียว เติมทั้งการ์ดสถิติ + ช่องต้อนรับ (ถ้ามี)
  function refreshRealStats() {
    var totalEl = document.getElementById('sp-total-count');
    var obEl = document.getElementById('ob-followers');
    function show(n, animate) {
      var txt = fmt(n) + '+';
      if (totalEl) {
        if (animate && typeof requestAnimationFrame === 'function') {
          totalEl.textContent = '0';
          animateCounter(totalEl, n, 2000);
        } else {
          totalEl.textContent = txt;
        }
      }
      if (obEl) obEl.textContent = txt;
    }
    show(REAL_FALLBACK, false);
    if (typeof fetch !== 'function') return;
    fetch('/v1/stats/public').then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.success) return;
      if (d.followers) show(d.followers, true);
      fillLiveCounts(d);
    }).catch(function () { /* คงเลข fallback จริง */ });
  }

  // เติมตัวเลขนับจริงของเว็บ (เข้าชม/วันนี้/เปิดอ่าน)
  function fillLiveCounts(d) {
    function set(id, n) {
      var el = document.getElementById(id);
      if (el && typeof n === 'number') el.textContent = fmt(n);
    }
    set('sp-visits-total', d.visitsTotal);
    set('sp-visits-today', d.visitsToday);
    set('sp-reads-total', d.readsTotal);
  }

  // ===== ANIMATED COUNTER =====
  function animateCounter(el, target, duration) {
    if (!el) return;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + '+';
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + '+';
      }
    }
    requestAnimationFrame(step);
  }

  // ===== RENDER STATS (เลขจริงเท่านั้น) =====
  function renderStats() {
    refreshRealStats();
  }

  // ===== TESTIMONIALS =====
  var TESTIMONIALS = [
    // === 5 ดาว — หวย/เลขนำโชค ===
    { text: 'ดูทุกเช้าเลยค่ะ เลขนำโชคให้มาตรงกับที่ซื้อหวยบ่อยมาก', author: 'สมศรี', loc: 'นครราชสีมา', stars: 5 },
    { text: 'งวดที่แล้วเลขท้าย 2 ตัวตรงเลย ไม่เชื่อก็ต้องเชื่อ', author: 'ประเสริฐ', loc: 'อุดรธานี', stars: 5 },
    { text: 'ส่งเลขให้แม่ดู แม่ถูกหวยไปเลย 3 ตัวบน ขอบคุณมากค่ะ', author: 'วารุณี', loc: 'เลย', stars: 5 },

    // === 5 ดาว — ความรัก/คู่ ===
    { text: 'ส่งให้แฟนดู แฟนตกใจเลย บอกว่าเหมือนรู้จักเราจริงๆ 555', author: 'พลอย', loc: 'เชียงใหม่', stars: 5 },
    { text: 'ดูดวงคู่กับแฟนแล้วเข้าใจกันมากขึ้นจริงๆ ค่ะ แฟนก็ชอบ', author: 'นภา', loc: 'ขอนแก่น', stars: 5 },
    { text: 'อ่านส่วนความรักแล้วร้องไห้เลย ตรงจนตกใจ แฟนเป็นแบบนั้นจริงๆ', author: 'พิมพ์ใจ', loc: 'เชียงราย', stars: 5 },
    { text: 'ทะเลาะกับแฟนอยู่ พออ่านดวงคู่แล้วเข้าใจแฟนมากขึ้น ตอนนี้ดีกันแล้วค่ะ', author: 'กานดา', loc: 'นครปฐม', stars: 5 },

    // === 5 ดาว — ตัวตน/บุคลิก ===
    { text: 'อ่านแล้วขนลุกเลยค่ะ ตรงมากกก ไม่คิดว่าแค่วันเกิดจะบอกอะไรได้ขนาดนี้', author: 'หนึ่งฤทัย', loc: 'กรุงเทพฯ', stars: 5 },
    { text: 'รายงานตัวตนอ่านแล้วเข้าใจตัวเองมากขึ้น เหมือนมีคนมาอธิบายสิ่งที่รู้สึกอยู่ข้างใน', author: 'กมล', loc: 'ชลบุรี', stars: 5 },
    { text: 'ชอบตรงที่ไม่ใช่แค่ดูดวง แต่แนะนำวิธีแก้ไขด้วย ไม่ใช่แค่บอกว่าดีหรือไม่ดี', author: 'ปิยะ', loc: 'ภูเก็ต', stars: 5 },
    { text: 'อ่านจุดอ่อนของตัวเองแล้วเอามาปรับใช้ได้จริง ไม่ใช่แค่ดูสนุกๆ', author: 'ธนพล', loc: 'สุราษฎร์ธานี', stars: 5 },

    // === 5 ดาว — สีมงคล/ลาภลอย ===
    { text: 'สีมงคลให้มา ลองใส่เสื้อสีนั้น วันนั้นงานราบรื่นจริงๆ นะ', author: 'วิชัย', loc: 'สงขลา', stars: 5 },
    { text: 'ลาภลอยให้เลขมา 2 ตัว ซื้อลอตเตอรี่เฉียดๆ ได้ท้าย 2 ตัวเกือบตรง', author: 'บุญมี', loc: 'ร้อยเอ็ด', stars: 5 },

    // === 5 ดาว — ใช้ประจำ ===
    { text: 'เปิดดูทุกเช้าก่อนออกจากบ้าน เหมือนเช็คดวงประจำวันเลยค่ะ', author: 'สุดา', loc: 'พิษณุโลก', stars: 5 },
    { text: 'เพื่อนส่งลิงก์มาให้ ตอนแรกไม่เชื่อ พออ่านจบก็ส่งต่อให้คนอื่นอีก 5 คนเลย', author: 'จิราภรณ์', loc: 'กรุงเทพฯ', stars: 5 },
    { text: 'ดูมาหลายเว็บ ชอบอันนี้สุด ข้อมูลละเอียดและอ่านง่าย', author: 'ปรีชา', loc: 'ระยอง', stars: 5 },
    { text: 'ติดดูทุกวันเลยค่ะ 555 เหมือนอ่าน horoscope ประจำวันแต่ละเอียดกว่ามาก', author: 'อาทิตยา', loc: 'นนทบุรี', stars: 5 },

    // === 5 ดาว — ไพ่/ทำนาย ===
    { text: 'ไพ่ประจำวันแม่นมาก วันที่ได้ไพ่ "ดวงอาทิตย์" วันนั้นโชคดีจริงๆ', author: 'อรุณ', loc: 'ระยอง', stars: 5 },
    { text: 'หมอทักมาตรงกับที่กำลังเจออยู่พอดี อ่านแล้วตกใจเลย', author: 'จันทร์เพ็ญ', loc: 'อุบลราชธานี', stars: 5 },
    { text: 'สัดส่วนธาตุบอกว่าธาตุน้ำเยอะ แล้วก็เป็นคนอารมณ์อ่อนไหวจริงๆ อย่างที่ว่า', author: 'สิริพร', loc: 'พิษณุโลก', stars: 5 },

    // === 4 ดาว — ดีแต่มีข้อสังเกต ===
    { text: 'โดยรวมตรงดีค่ะ แต่บางส่วนอ่านแล้วงงนิดหน่อย ต้องอ่านรอบสอง', author: 'รัตนา', loc: 'ปราจีนบุรี', stars: 4 },
    { text: 'ข้อมูลเยอะดี แต่อยากให้มีสรุปสั้นๆ ด้วย บางทีอ่านยาวไป', author: 'อนุชา', loc: 'นครศรีธรรมราช', stars: 4 },
    { text: 'ดูดวงส่วนตัวตรงมาก แต่ส่วนคู่ยังไม่ได้ลอง ไว้จะลองดูค่ะ', author: 'ศิริวรรณ', loc: 'ลำปาง', stars: 4 },
    { text: 'ตรงดีนะคะ แต่อยากให้เพิ่มด้านสุขภาพด้วย ดูแค่การงานกับความรัก', author: 'มณี', loc: 'สุโขทัย', stars: 4 },
    { text: 'แม่นใช้ได้เลยค่ะ โดยเฉพาะเรื่องนิสัย ตรงเป๊ะ แต่เลขหวยยังไม่ตรง', author: 'จิรวัฒน์', loc: 'ฉะเชิงเทรา', stars: 4 },

    // === 5 ดาว — ใช้กับคนรอบข้าง ===
    { text: 'ให้ลูกสาวดูด้วย ลูกบอกว่าตรงมาก ตอนนี้ดูทั้งครอบครัวเลยค่ะ', author: 'ปราณี', loc: 'ชัยนาท', stars: 5 },
    { text: 'ส่งให้ทีมงานดู ทุกคนบอกตรง ตอนนี้ดูกันทั้งออฟฟิศ 555', author: 'พงศกร', loc: 'กรุงเทพฯ', stars: 5 },
    { text: 'แฟนไม่เชื่อดวง พอให้ลองดู เงียบไปเลย 555 สงสัยจะตรง', author: 'อัญชลี', loc: 'นครนายก', stars: 5 },

    // === 5 ดาว — การงาน ===
    { text: 'ดูเรื่องการงานแล้วตัดสินใจเปลี่ยนงาน ตอนนี้ได้งานใหม่ดีกว่าเดิมมากค่ะ', author: 'นิรมล', loc: 'ปทุมธานี', stars: 5 },
    { text: 'ช่วงที่ดาวเสาร์ทัก งานหนักจริงอย่างที่ว่า พอผ่านช่วงนั้นก็ดีขึ้น', author: 'สมชาย', loc: 'กาญจนบุรี', stars: 5 },

    // === 5 ดาว — โชคลาภ ===
    { text: 'ดูแล้วซื้อสีเสื้อตามที่บอก วันนั้นลูกค้าตกลงซื้อของ 3 รายเลย', author: 'เจริญ', loc: 'ราชบุรี', stars: 5 },
    { text: 'เลขนำโชคให้มาลองเสี่ยงดู ถูก 2 ตัวล่างเฉยเลย งวดหน้าดูอีกแน่นอน', author: 'สมบูรณ์', loc: 'บุรีรัมย์', stars: 5 },

    // === 4 ดาว — กลางๆ แต่กลับมาดูอีก ===
    { text: 'ครั้งแรกอ่านผ่านๆ ไม่ได้คิดอะไร พอผ่านไปอาทิตย์นึงรู้เลยว่าตรง', author: 'ภาณุ', loc: 'ตาก', stars: 4 },
    { text: 'ดูดวงฟรีก่อน ชอบค่อยปลดล็อก สรุปปลดล็อกค่ะ 555', author: 'สุภาพร', loc: 'มุกดาหาร', stars: 5 },

    // === 5 ดาว — สั้นๆ กระชับ ===
    { text: 'ตรงค่ะ ไม่พูดเยอะ 👍', author: 'เบญ', loc: 'กรุงเทพฯ', stars: 5 },
    { text: 'แม่น!', author: 'โอ๊ต', loc: 'นนทบุรี', stars: 5 },
    { text: 'ส่งต่อให้เพื่อนทุกคนเลยค่ะ', author: 'มิ้นท์', loc: 'ปทุมธานี', stars: 5 },
    { text: 'ดูทุกวันเลย ติดแล้ว 555', author: 'ฟ้า', loc: 'สมุทรปราการ', stars: 5 },

    // === 5 ดาว — ยาว เล่าเรื่อง ===
    { text: 'ตอนแรกแค่ลองกดดูเล่นๆ ปรากฏว่าอ่านไป 20 นาทีเลยค่ะ ข้อมูลละเอียดมาก ทั้งตัวตน คู่สัมพันธ์ การงาน แถมมีสีมงคลกับเลขนำโชคให้ด้วย คุ้มมากสำหรับดูฟรี', author: 'สุรางค์', loc: 'อ่างทอง', stars: 5 },
    { text: 'เป็นคนไม่ค่อยเชื่อดวง แต่เพื่อนบังคับให้ลอง พออ่านส่วนตัวตนเสร็จ นั่งเงียบเลย 555 มันตรงจนตกใจ ตอนนี้ดูทุกเช้าก่อนออกจากบ้าน', author: 'กรกช', loc: 'นครราชสีมา', stars: 5 },
  ];

  function setupTestimonialRotation() {
    var container = document.getElementById('testimonials-container');
    if (!container) return;

    var currentIdx = Math.floor(Math.random() * TESTIMONIALS.length); // Start random

    function renderTestimonial(idx) {
      var t = TESTIMONIALS[idx % TESTIMONIALS.length];
      var stars = '';
      for (var i = 0; i < t.stars; i++) stars += '★';

      container.innerHTML = '<div class="testimonial-card testimonial-enter">'
        + '<div class="testimonial-stars">' + stars + '</div>'
        + '<p class="testimonial-text">"' + escapeHTML(t.text) + '"</p>'
        + '<div class="testimonial-author">— ' + escapeHTML(t.author) + ', ' + escapeHTML(t.loc) + '</div>'
        + '</div>';
    }

    function rotateTestimonial() {
      var card = container.querySelector('.testimonial-card');
      if (card) card.classList.add('testimonial-exit');
      setTimeout(function() {
        currentIdx++;
        renderTestimonial(currentIdx);
      }, 500);
    }

    renderTestimonial(currentIdx);
    setInterval(rotateTestimonial, 10000);
  }

  // ===== AUTHORITY BADGE =====
  function renderAuthorityBadge() {
    var container = document.getElementById('sp-authority');
    if (!container) return;

    container.innerHTML = '<div class="sp-authority-inner">'
      + '<div class="sp-authority-icon">🔭</div>'
      + '<div class="sp-authority-text">'
      + '<div class="sp-authority-title">วิเคราะห์จากโหราศาสตร์ไทยโบราณ</div>'
      + '<div class="sp-authority-detail">นพเคราะห์ · ทักษาปกรณ์ · ราศีจักร · ลัคนา · ตำแหน่งดาว 7 ดวง</div>'
      + '</div>'
      + '</div>';
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== INIT =====
  function init() {
    renderAuthorityBadge();
    renderStats();
    trackVisit();
    setupTestimonialRotation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SocialProof = {
    TESTIMONIALS: TESTIMONIALS,
    animateCounter: animateCounter,
    refreshRealStats: refreshRealStats,
    trackVisit: trackVisit,
    trackRead: trackRead
  };
})();
