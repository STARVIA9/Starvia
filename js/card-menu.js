// ===== STARVIA Card Menu (จิ้มการ์ดดูทีละหน้า) — 12 ต.ค.69 =====
// แปลงรีพอร์ตยาวๆ เป็นเมนูการ์ด: กด 1 ใบ → ดู 1 เรื่อง → ปุ่มกลับเมนู
// ใช้กับ r0/r1/r2 (เรียก CardMenu.build('r0') ท้าย render แต่ละโหมด)
// ponytail: ไม่แตะ renderer เดิม — ซ่อน/โชว์ด้วย class อย่างเดียว
(function(){
  'use strict';

  // ชื่อเมนูภาษาบ้านๆ (พ่ออนุมัติ 12 ต.ค.69) — จับด้วยคำสำคัญในหัวข้อเดิม
  var TITLE_MAP = [
    {k:'กำลังวันประจำตัว', t:'ดวงประจำวันเกิดคุณ', d:'วันเกิดบอกอะไร ทั้งธาตุ เทวดา สีมงคล'},
    {k:'เสริมดวง', t:'วิธีเสริมดวง', d:'สี เลข ของ และทิศที่หนุนดวงคุณ'},
    {k:'คัมภีร์', t:'แก้ดวง 6 เรื่อง', d:'โชค เงิน สุขภาพ รัก งาน มีวิธีแก้ทีละเรื่อง'},
    {k:'แนวโน้ม', t:'ดวงทั้งปีนี้ของคุณ', d:'ปีนี้เรื่องไหนดี เรื่องไหนต้องระวัง'},
    {k:'ราหู', t:'ดวงทั้งปีนี้ของคุณ', d:'ปีนี้เรื่องไหนดี เรื่องไหนต้องระวัง'},
    {k:'ลาภลอย', t:'เลขนำโชค', d:'เลข ทิศ และช่วงเวลาที่เหมาะเสี่ยงโชค'},
    {k:'หมอทัก', t:'หมอทักเดือนนี้', d:'5 เรื่องต้องรู้ + สิ่งควรระวัง'},
    {k:'พิมพ์เขียว', t:'กราฟชีวิต', d:'ดูจังหวะขึ้นลงของชีวิตตามอายุ'},
    {k:'กราฟ', t:'กราฟชีวิต', d:'ดูจังหวะขึ้นลงของชีวิตตามอายุ'},
    {k:'เข้ากันได้', t:'เนื้อคู่ของคุณ', d:'ธาตุคุณเข้ากับธาตุไหน ใครเหมาะกับคุณ'},
    {k:'Compatibility', t:'เนื้อคู่ของคุณ', d:'ธาตุคุณเข้ากับธาตุไหน ใครเหมาะกับคุณ'},
    {k:'เดือนเกิด', t:'จุดแข็งจุดอ่อน', d:'เกิดเดือนนี้ดีตรงไหน เสียตรงไหน'},
    {k:'ตัวตน', t:'ฉบับเต็ม (พรีเมียม)', d:'เจาะลึกตัวตน งาน เงิน รัก แบบละเอียด', lockName:true},
    {k:'matrix-card', t:'คะแนนคู่ของคุณ', d:'ดูว่าเข้ากันกี่เปอร์เซ็นต์', byClass:true},
    {k:'conversion-cta', t:'เปิดทางความรัก', d:'แผนเฉพาะคู่ + ดวงสมพงษ์', byClass:true},
    {k:'love-destiny-card', t:'จังหวะรักของคุณ', d:'ช่วงที่ดวงเปิดพร้อมกัน + เจอที่ไหน', byClass:true},
    {k:'action-plan-card', t:'พิมพ์เขียวความสัมพันธ์', d:'จุดแข็ง หลุมพราง วิธีดูแลกัน', byClass:true},
    {k:'love-five-card', t:'ดวงคู่ 5 ข้อ', d:'เนื้อคู่ อยู่กันยืด แผลใจ ถูกชะตา', byClass:true},
    {k:'ausp-header', t:'ดวงวันนี้ของคุณ', d:'ภาพรวมตามธาตุประจำตัว', byClass:true},
    {k:'ausp-today', t:'วันนี้เหมาะทำอะไร', d:'คะแนนวัน + สิ่งควรโฟกัส', byClass:true},
    {k:'ausp-week', t:'ปฏิทิน 7 วัน', d:'วันไหนดี วันไหนควรระวัง', byClass:true},
    {k:'ausp-vinai', t:'เหตุเสริม', d:'สร้างเหตุใหม่หนุนดวง', byClass:true},
    {k:'at-card', t:'วันดี-วันระวัง', d:'ตารางวันดีตามวันเกิด', byClass:true},
    {k:'wellness-card', t:'นาฬิกาชีวิต', d:'ช่วงเวลาพลังสูง-พักฟื้นตามธาตุ', byClass:true},
    {k:'cosmic-routine', t:'นาฬิกาชีวิต', d:'ช่วงเวลาพลังสูง-พักฟื้นตามธาตุ', byClass:true},
    {k:'lottery', t:'หวยงวดนี้', d:'ผลหวย + เลขเด่นงวดนี้', byClass:true}
  ];

  function pickTitle(entry){
    var label = entry.label, cls = entry.cls;
    var i, m;
    for (i = 0; i < TITLE_MAP.length; i++){
      m = TITLE_MAP[i];
      if (m.byClass) { if (cls.indexOf(m.k) !== -1) return m; }
      else if (label.indexOf(m.k) !== -1) return m;
    }
    return {t: label.slice(0, 28) || 'เรื่องที่ ' + (entry.idx + 1), d: entry.hint.slice(0, 42)};
  }

  function firstEmoji(s){
    var m = String(s || '').match(/[\u{1F300}-\u{1FAFF}\u2728\u2648-\u2653\u2600-\u27BF\u2B50\uFE0F]/u);
    return m ? m[0] : '🔮';
  }

  function entryLabel(entry, el){
    var t = el.querySelector('.section-toggle-label');
    var h = el.querySelector('.section-toggle-hint');
    entry.label = t ? t.textContent.trim().replace(/^▼/, '').trim() : '';
    entry.hint = h ? h.textContent.trim() : '';
    if (!entry.label){
      var head = el.querySelector('h2,h3,.yt-title,.atc-title,.awc-title,.avc-title,.at-subtitle,.wc-title');
      entry.label = head ? head.textContent.trim().slice(0, 30) : '';
    }
  }

  function isEntry(el){
    if (el.classList.contains('collapsible-section')) return true;
    if (el.id === 'lottery-results-section') return el.textContent.trim().length > 50;
    var c = el.className || '';
    return /matrix-card|conversion-cta|love-destiny-card|action-plan-card|love-five-card|ausp-header-card|ausp-today-card|ausp-week-card|ausp-vinai-card|at-card|wellness-card/.test(c)
      && el.textContent.trim().length > 50;
  }

  function scrollToEl(el){
    if (!el) return;
    try { el.scrollIntoView({behavior:'smooth', block:'start'}); }
    catch(e){ el.scrollIntoView(); }
  }

  function build(rootId){
    var root = document.getElementById(rootId);
    if (!root || root.querySelector('.cm-menu-wrap')) return; // สร้างแล้วไม่สร้างซ้ำ
    var kids = Array.prototype.slice.call(root.children);
    var entries = [];
    kids.forEach(function(el, i){
      if (el.nodeType !== 1) return;
      if (!isEntry(el)) return;
      var en = {el: el, idx: entries.length, cls: el.className || '', label: '', hint: ''};
      entryLabel(en, el);
      // ล็อกพรีเมียม?
      en.locked = !!el.querySelector('.lock-overlay,.is-locked') || el.classList.contains('is-locked');
      entries.push(en);
    });
    if (!entries.length) return;

    // ขยาย section ที่พับไว้ล่วงหน้า (เปิดเป็น doc ทีไรก็พร้อมอ่าน)
    entries.forEach(function(en){
      if (en.el.classList.contains('collapsible-section')) en.el.classList.remove('collapsed');
    });

    // สร้างเมนู
    var menu = document.createElement('div');
    menu.className = 'cm-menu-wrap';
    var html = '<div class="cm-menu-head">ดวงของคุณเปิดแล้ว ✨<span class="cm-menu-sub">จิ้มการ์ดดูทีละเรื่อง</span></div><div class="cm-grid">';
    entries.forEach(function(en, i){
      var named = pickTitle(en);
      var ico = firstEmoji(en.label) === '🔮' && named.t ? firstEmoji(named.t) : firstEmoji(en.label);
      // อิโมจิประจำใบ (กันซ้ำกับ ▼): ใช้ตัวแรกที่เจอในป้ายเดิม
      html += '<button type="button" class="cm-card" data-cm-i="' + i + '">'
        + '<span class="cm-ico" aria-hidden="true">' + ico + '</span>'
        + '<span class="cm-tx"><span class="cm-t">' + escapeCm(named.t) + '</span>'
        + '<span class="cm-d">' + escapeCm(named.d || en.hint) + '</span></span>'
        + (en.locked || named.lockName ? '<span class="cm-lock">🔒</span>' : '<span class="cm-go" aria-hidden="true">→</span>')
        + '</button>';
    });
    html += '</div>';
    menu.innerHTML = html;

    // วางเมนูหลัง easy-summary (ถ้ามี) ไม่งั้นไว้บนสุด
    var easy = root.querySelector('.easy-summary');
    if (easy && easy.nextSibling) root.insertBefore(menu, easy.nextSibling);
    else if (easy) root.appendChild(menu);
    else root.insertBefore(menu, root.firstChild);

    // ปุ่มกลับ 2 อัน (บน+ล่าง) ย้ายไปประกบหน้าที่เปิดอยู่
    var backTop = document.createElement('button');
    backTop.type = 'button'; backTop.className = 'cm-back'; backTop.textContent = '← กลับไปหน้าเมนู';
    var backBottom = backTop.cloneNode(true);
    backTop.addEventListener('click', function(){ goMenu(root); });
    backBottom.addEventListener('click', function(){ goMenu(root); });

    menu.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('.cm-card') : null;
      if (!btn) return;
      openDoc(root, entries[parseInt(btn.getAttribute('data-cm-i'), 10)], backTop, backBottom);
    });

    // ปุ่ม "อ่านแบบละเอียด" ในการ์ดสรุป → เลื่อนมาเมนูแทน (ของเดิมเลื่อนไปหัวข้อที่ซ่อนอยู่)
    var easyBtn = root.querySelector('[data-action="easy-details"]');
    if (easyBtn) easyBtn.addEventListener('click', function(ev){
      if (root.classList.contains('cm-menu')) { ev.stopPropagation(); scrollToEl(menu); }
    }, true);

    root.classList.add('cm-menu');
    window.__cmRoots = window.__cmRoots || {};
    window.__cmRoots[rootId] = {root: root, menu: menu, entries: entries, backTop: backTop, backBottom: backBottom};
  }

  function openDoc(root, en, backTop, backBottom){
    if (!en) return;
    root.classList.remove('cm-menu');
    root.classList.add('cm-doc');
    en.el.classList.add('cm-open');
    if (typeof window !== 'undefined' && window.SocialProof && window.SocialProof.trackRead) {
      window.SocialProof.trackRead(root.id || 'r0');
    }
    root.insertBefore(backTop, en.el);
    if (en.el.nextSibling) root.insertBefore(backBottom, en.el.nextSibling);
    else root.appendChild(backBottom);
    scrollToEl(backTop);
  }

  function goMenu(root){
    root.classList.remove('cm-doc');
    root.classList.add('cm-menu');
    var open = root.querySelector('.cm-open');
    if (open) open.classList.remove('cm-open');
    var menu = root.querySelector('.cm-menu-wrap');
    scrollToEl(menu);
  }

  function escapeCm(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.CardMenu = {build: build, goMenu: goMenu};
})();
