// ===== STARVIA Member Hub (13 ต.ค.69) — โซนสมาชิกรายเดือน =====
// ก. ซองดวงรายเดือน (กาชา) + สมุดสะสมเทพ 12 ราศี
// ข. คืนจันทร์เต็มดวง: คำทำนายพิเศษเฉพาะสมาชิก (อ่านจาก GENERATED_EVENTS)
// ค. เช็กอินรายวัน: มา 20+ วัน/เดือน → ไพ่ทอง + โควต้าเพิ่ม
// Static-only: deterministic จาก seed รายคน+เดือน, เก็บใน localStorage
var MemberHub = (function() {
  'use strict';

  function $(id){ return (typeof document !== 'undefined') ? document.getElementById(id) : null; }
  function lsGet(k){ try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function pad(n){ return String(n).padStart(2, '0'); }
  function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function monthISO(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }

  function hash(str){
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }

  function userSeed(){
    try {
      var id = localStorage.getItem('starvia_user_id');
      if (id) return 'u' + id;
      var fs = localStorage.getItem('starvia_form_state_v1');
      if (fs) { var s = JSON.parse(fs); if (s && (s.d0 || s.d1a)) return 'b' + (s.d0 || s.d1a); }
    } catch (e) {}
    return 'guest';
  }

  function isMember(){
    try {
      if (localStorage.getItem('starvia_premium') === 'true') return true;
      // สดจาก session นี้: เพิ่งจ่าย PIN สำเร็จแต่ยังไม่ reload
      if (typeof window !== 'undefined' && window.isPremiumUnlockedFlag === true) return true;
      if (typeof premiumIsUnlocked === 'function' && premiumIsUnlocked()) return true;
      if (typeof isPremiumUnlocked === 'function' && isPremiumUnlocked()) return true;
      if (typeof StreakReward !== 'undefined' && StreakReward.isPremiumUnlocked && StreakReward.isPremiumUnlocked()) return true;
    } catch (e) {}
    return false;
  }

  // ─── ก. ซองดวงรายเดือน ───
  var GODS = [
    { z: 'เมษ', e: '♈', img: '01-aries', g: 'เทพแห่งไฟนักรบ', b: 'เดือนนี้ลุยก่อนได้เปรียบ อย่ารอพร้อม',
      fx: ['💼 งาน: เสนอตัวก่อนได้งานก่อน ความกล้าคือใบเบิกทาง', '💰 เงิน: รายได้เสริมจากการลงมือไว ระวังใช้ตามอารมณ์', '💕 รัก: รุกก่อนมีลุ้น แต่อย่ารุกจนเขาอึดอัด'] },
    { z: 'พฤษภ', e: '♉', img: '02-taurus', g: 'เทพแห่งผืนดิน', b: 'ช้าแต่มั่นคง เงินที่รอจะมาตามนัด',
      fx: ['💼 งาน: งานประจำมั่นคง ผู้ใหญ่เห็นความสม่ำเสมอ', '💰 เงิน: เงินก้อนเล็กทยอยเข้า เหมาะเริ่มออมจริงจัง', '💕 รัก: รักนิ่งๆ แต่ลึก ใครอยู่ด้วยนานคือคนใช่'] },
    { z: 'มิถุน', e: '♊', img: '03-gemini', g: 'เทพแห่งลมข่าวสาร', b: 'คำพูดคือโชค พูดดีได้ดีเกินคาด',
      fx: ['💼 งาน: งานเจรจา พรีเซนต์ ขายของ เข้าทางหมด', '💰 เงิน: โชคจากคำแนะนำคนอื่น ฟังเยอะๆ แล้วจะเจอช่อง', '💕 รัก: คุยเก่งมีเสน่ห์ คนโสดมีคนทักเพราะคำพูด'] },
    { z: 'กรกฎ', e: '♋', img: '04-cancer', g: 'เทพแห่งจันทรา', b: 'ดูแลใจคนใกล้ตัว แล้วดวงจะดูแลคุณ',
      fx: ['💼 งาน: งานเบื้องหลัง งานครอบครัว งานบ้านราบรื่น', '💰 เงิน: เงินจากคนใกล้ชิดหรือของเก่าในบ้าน', '💕 รัก: ง้อได้ง้อ เดือนนี้ใจอ่อนให้กันง่าย'] },
    { z: 'สิงห์', e: '♌', img: '05-leo', g: 'เทพแห่งตะวัน', b: 'เฉิดฉายได้เลย เดือนนี้เวทีเป็นของคุณ',
      fx: ['💼 งาน: ได้เป็นหน้าเป็นตา ขึ้นเวทีเมื่อไหร่ปังเมื่อนั้น', '💰 เงิน: รายได้จากชื่อเสียงและผลงานที่โชว์', '💕 รัก: เสน่ห์พุ่ง มีคนแอบมองหลายคน เลือกดีๆ'] },
    { z: 'กันย์', e: '♍', img: '06-virgo', g: 'เทพแห่งระเบียบ', b: 'จัดโต๊ะจัดใจ โชคเข้าทางความเป็นระเบียบ',
      fx: ['💼 งาน: งานเอกสาร ตรวจงาน วางระบบ ทำแล้วเด่น', '💰 เงิน: เงินรั่วจากของจุกจิก จดรายจ่ายแล้วจะเหลือ', '💕 รัก: อย่าจับผิดเยอะ รักจะดีถ้าปล่อยบ้าง'] },
    { z: 'ตุล', e: '♎', img: '07-libra', g: 'เทพแห่งตาชั่ง', b: 'ดีลที่ค้างจะลงตัวด้วยความยุติธรรม',
      fx: ['💼 งาน: งานที่ต้องไกล่เกลี่ยจะจบสวยเพราะคุณ', '💰 เงิน: หนี้สินมีทางผ่อนคลาย คุยตรงๆ แล้วเบา', '💕 รัก: คู่ที่งอนกันจะคืนดีด้วยความเข้าใจ'] },
    { z: 'พิจิก', e: '♏', img: '08-scorpio', g: 'เทพแห่งน้ำลึก', b: 'สัญชาตญาณแม่นเป็นพิเศษ เชื่อเซนส์ตัวเอง',
      fx: ['💼 งาน: อ่านเกมคนออก อย่าเปิดไพ่ในมือเร็ว', '💰 เงิน: อย่าให้ใครยืมเดือนนี้ เซนส์เตือนแล้ว', '💕 รัก: รักลึกซึ้ง แต่ระวังหึงจนอึดอัด'] },
    { z: 'ธนู', e: '♐', img: '09-sagittarius', g: 'เทพแห่งลูกธนู', b: 'เล็งไกลเข้าไว้ เป้าหมายใหญ่มีลุ้น',
      fx: ['💼 งาน: งานต่างถิ่น เดินทาง เรียนต่อ เปิดรับหมด', '💰 เงิน: ลงทุนระยะยาวดีกว่าระยะสั้น', '💕 รัก: รักทางไกลมีลุ้น คนใกล้ตัวอาจรู้สึกห่าง'] },
    { z: 'มกร', e: '♑', img: '10-capricorn', g: 'เทพแห่งภูผา', b: 'อดทนอีกนิด ยอดเขาอยู่แค่เอื้อม',
      fx: ['💼 งาน: ความอึดคืออาวุธ ทำต่อเนื่องแล้วมีคนเห็น', '💰 เงิน: เงินเก็บโตช้าแต่มั่น อย่าถอนกลางทาง', '💕 รัก: รักมั่นคงแต่จืดไปหน่อย เติมหวานบ้าง'] },
    { z: 'กุมภ์', e: '♒', img: '11-aquarius', g: 'เทพแห่งคลื่นใหม่', b: 'ไอเดียแปลกๆ เดือนนี้คือทอง',
      fx: ['💼 งาน: ไอเดียนอกกรอบจะได้รับการยอมรับ กล้าเสนอ', '💰 เงิน: รายได้จากของใหม่ เทคโนโลยี งานออนไลน์', '💕 รัก: เจอคนแปลกแต่น่าสนใจ เปิดใจหน่อย'] },
    { z: 'มีน', e: '♓', img: '12-pisces', g: 'เทพแห่งมหาสมุทร', b: 'ใจดีกับตัวเองบ้าง ดวงจะไหลลื่น',
      fx: ['💼 งาน: งานศิลป์ งานช่วยคน งานเบื้องหลังเด่น', '💰 เงิน: มีลาภลอยเล็กๆ น้อยๆ พอชื่นใจ', '💕 รัก: โรแมนติกพุ่ง บอกรักตอนนี้มีลุ้นสุด'] }
  ];
  var MONTH_MSG = [
    'เดือนนี้ดาวเข้าข้างคนกล้าตัดสินใจ — เรื่องที่ลังเลมานาน ได้เวลาตอบตัวเอง',
    'พลังเดือนนี้อยู่ที่ "คน" — ปรึกษาให้ถูกคน งานยากจะกลายเป็นงานง่าย',
    'เดือนแห่งการเก็บเกี่ยว — สิ่งที่หว่านไว้กำลังจะงอก จงรดน้ำต่ออย่าหยุด',
    'ดาวบอกให้ช้าลงนิด — เดือนนี้คนพักเป็นจะไปได้ไกลกว่าคนรีบ',
    'ประตูบานใหม่กำลังจะเปิด สังเกตสัญญาณเล็กๆ รอบตัวให้ดี',
    'เดือนนี้โชคซ่อนอยู่ในเรื่องเดิมๆ ที่เคยมองข้าม ลองหยิบมาปัดฝุ่น'
  ];
  var LEGEND_MANTRA = [
    'นะโมพุทธายะ — ท่อง 3 จบก่อนออกจากบ้าน 7 วันติด',
    'อิติปิโสภะคะวา — ท่องก่อนนอน 9 จบ ใจนิ่งโชควิ่งเข้า',
    'พุทโธ — สั้นแต่แรง ท่องตอนใจสั่นแล้วตัดสินใจ'
  ];

  function rollPack(ym, seed){
    var h = hash(seed + '|' + ym);
    var r = (h % 1000) / 1000;
    var rarity = r < 0.05 ? 'legendary' : (r < 0.30 ? 'rare' : 'common');
    var mi = parseInt(ym.split('-')[1], 10) - 1;
    var god = GODS[((h >> 3) % 12 + 12) % 12];
    var out = { ym: ym, rarity: rarity, god: god.z, gicon: god.e, godImg: god.img, godName: god.g, godBless: god.b, monthIndex: mi };
    if (rarity === 'rare') {
      out.lucky = [pad(h % 90 + 10), pad((h >> 5) % 90 + 10)];
    } else if (rarity === 'legendary') {
      out.mantra = LEGEND_MANTRA[h % LEGEND_MANTRA.length];
      out.goldDay = (h % 28) + 1;
    } else {
      out.msg = MONTH_MSG[(h + mi) % MONTH_MSG.length];
    }
    return out;
  }

  function packKey(ym){ return 'starvia_pack_' + ym; }
  function getClaim(ym){ return lsGet(packKey(ym)); }
  function getAlbum(){ var a = lsGet('starvia_pack_album'); return Array.isArray(a) ? a : []; }

  function claimPack(){
    var ym = monthISO();
    if (getClaim(ym)) return getClaim(ym);
    var pack = rollPack(ym, userSeed());
    pack.claimedAt = new Date().toISOString();
    lsSet(packKey(ym), pack);
    var album = getAlbum();
    if (album.filter(function (e) { return e.ym === ym; }).length === 0) {
      album.push({ ym: ym, god: pack.god, gicon: pack.gicon, rarity: pack.rarity });
      lsSet('starvia_pack_album', album);
    }
    if (window.Gamification && window.Gamification.completeChallenge) {
      try { window.Gamification.completeChallenge('monthly-pack'); } catch (e) {}
    }
    render();
    return pack;
  }

  // ─── อวดไพ่: รวมรูป+ข้อความเป็นการ์ดเดียวแล้วแชร์/โหลด ───
  function sharePack(){
    var ym = monthISO();
    var claim = getClaim(ym);
    if (!claim) return;
    var W = 768, H = 1150;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#120a2d'); g.addColorStop(1, '#070413');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    function drawText(){
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D6AD45';
      ctx.font = '700 44px Sarabun, sans-serif';
      ctx.fillText('✦ STARVIA ✦', W / 2, 70);
      ctx.fillStyle = '#F4D987';
      ctx.font = '700 40px Sarabun, sans-serif';
      ctx.fillText(RAR_EMO[claim.rarity] + ' ' + claim.god + ' · ' + claim.godName, W / 2, H - 210);
      ctx.fillStyle = '#C9BDDF';
      ctx.font = '32px Sarabun, sans-serif';
      ctx.fillText('"' + claim.godBless + '"', W / 2, H - 160);
      ctx.fillStyle = '#8E72D8';
      ctx.font = '28px Sarabun, sans-serif';
      ctx.fillText('เปิดซองดวงทุกวันที่ 1 · starvia.website', W / 2, H - 100);
    }
    function finish(){
      drawText();
      var done = function (blob) {
        if (!blob) return;
        var file = new File([blob], 'starvia-pack-' + ym + '.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'ไพ่เทพประจำเดือนของฉัน' }).catch(function () {});
        } else {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = file.name;
          document.body.appendChild(a); a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        }
        try { if (typeof announce === 'function') announce('บันทึกรูปไพ่แล้ว'); } catch (e2) {}
      };
      if (cv.toBlob) cv.toBlob(done, 'image/png');
    }
    var img = new Image();
    var settled = false;
    var go = function () { if (!settled) { settled = true; finish(); } };
    img.onload = function () {
      try {
        var iw = 560, ih = 560 * img.height / img.width;
        ctx.drawImage(img, (W - iw) / 2, 110, iw, Math.min(ih, 720));
      } catch (e) {}
      go();
    };
    img.onerror = go;
    img.src = 'assets/pack-cards/' + godImgFor(claim) + '.jpg';
    setTimeout(go, 4000);
  }

  // ─── ข. คืนจันทร์เต็มดวง ───
  var MOON_MSG = [
    'คืนนี้จันทร์เต็มดวง — เรื่องที่ค้างคาให้เขียนใส่กระดาษแล้วฉีกทิ้ง เป็นการปล่อยวางตามจันทรคติ',
    'พลังจันทร์เต็มดวงหนุนเรื่องเงิน — คืนนี้เหมาะทบทวนบัญชีและตั้งเป้าเดือนหน้า',
    'จันทร์เต็มดวงเปิดใจคน — คืนนี้คุยเรื่องค้างคาใจกับคนรักจะลงตัวง่ายกว่าปกติ',
    'อาบแสงจันทร์ 5 นาที (แค่ยืนรับลมก็พอ) แล้วตั้งจิตอธิษฐาน 1 ข้อที่อยากได้เดือนนี้'
  ];

  function moonState(){
    var today = todayISO();
    var evs = (typeof GENERATED_EVENTS !== 'undefined') ? GENERATED_EVENTS : [];
    var active = null, next = null;
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (e.phase !== 'full') continue;
      var s = e.start, en = e.end || e.start;
      if (today >= s && today <= en) { active = e; break; }
      if (!next && s > today) next = e;
    }
    var msg = MOON_MSG[hash(today) % MOON_MSG.length];
    return { active: active, next: next, msg: msg };
  }

  // ─── ค. เช็กอินรายเดือน ───
  var CHECK_KEY = 'starvia_month_checkin';
  var CHECK_GOAL = 20;
  function checkin(){
    var m = monthISO();
    var d = todayISO().slice(8, 10);
    var c = lsGet(CHECK_KEY);
    if (!c || c.m !== m) c = { m: m, days: [], rewarded: false };
    if (c.days.indexOf(d) === -1) c.days.push(d);
    // รางวัลไพ่ทอง: มา 20+ วัน → โควต้าเพิ่ม (ผ่านเพดานแชร์) + การ์ดทองในอัลบั้ม
    if (c.days.length >= CHECK_GOAL && !c.rewarded) {
      c.rewarded = true;
      try { if (typeof grantShareBonus === 'function') { grantShareBonus(); grantShareBonus(); } } catch (e) {}
      var album = getAlbum();
      album.push({ ym: m, god: 'ไพ่ทอง', gicon: '👑', rarity: 'gold' });
      lsSet('starvia_pack_album', album);
      if (window.Gamification && window.Gamification.completeChallenge) {
        try { window.Gamification.completeChallenge('month-gold'); } catch (e2) {}
      }
    }
    lsSet(CHECK_KEY, c);
    return c;
  }
  function checkinProgress(){
    var c = lsGet(CHECK_KEY);
    if (!c || c.m !== monthISO()) return { days: 0, goal: CHECK_GOAL, rewarded: false };
    return { days: c.days.length, goal: CHECK_GOAL, rewarded: !!c.rewarded };
  }

  // ─── Render ───
  var RAR_TXT = { common: 'ธรรมดา', rare: 'หายาก', legendary: 'ตำนาน', gold: 'ทอง' };
  var RAR_EMO = { common: '✉️', rare: '💎', legendary: '🌟', gold: '👑' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ใบเก่าที่เคลมก่อนมีรูป (ไม่มี godImg) → เทียบจากชื่อราศี
  function godImgFor(claim){
    if (claim.godImg) return claim.godImg;
    for (var i = 0; i < GODS.length; i++) if (GODS[i].z === claim.god) return GODS[i].img;
    return '06-virgo';
  }

  function albumHtml(){
    var album = getAlbum();
    var has = {};
    album.forEach(function (e) { has[e.god] = e; });
    var cells = GODS.map(function (g) {
      var got = has[g.z];
      var face = got ? '<img src="assets/pack-cards/' + g.img + '.jpg" alt="เทพ' + g.z + '" loading="lazy">' : '<span>' + g.e + '</span>';
      return '<div class="album-cell' + (got ? ' got rar-' + got.rarity : '') + '">'
        + face + '<small>' + g.z + '</small></div>';
    }).join('');
    var gold = has['ไพ่ทอง'] ? '<div class="album-cell got rar-gold"><span>👑</span><small>ไพ่ทอง</small></div>' : '';
    return '<div class="album-grid">' + cells + gold + '</div>'
      + '<div class="album-count">สะสมแล้ว ' + album.length + ' ใบ</div>';
  }

  function render(){
    var hub = $('member-hub');
    if (!hub) return;
    var ym = monthISO();
    var member = isMember();
    var html = '<div class="section-pill">🎁 โซนสมาชิก</div>'
      + '<h2 class="section-title">ทุกเดือนมีให้ลุ้น</h2>';

    // ก. ซองดวงรายเดือน
    var claim = getClaim(ym);
    html += '<div class="pack-card">';
    if (!member) {
      html += '<div class="pack-lock">🔒 ซองดวงประจำเดือนนี้รอเจ้าของอยู่<br><small>สมาชิกเท่านั้นที่เปิดได้</small></div>'
        + '<button class="rbtn rbtn-clear" data-action="open-payment">✦ เป็นสมาชิก 199/เดือน</button>';
    } else if (!claim) {
      html += '<div class="pack-sealed">✉️ ซองดวงเดือนนี้ยังไม่เปิด<br><small>กดเลย ดวงระดับไหนอยู่ในนี้…</small></div>'
        + '<button class="rbtn rbtn-clear" data-action="pack-open">✉️ เปิดซองดวงเดือนนี้</button>';
    } else {
      var godFx = (function(){ for (var gi = 0; gi < GODS.length; gi++) if (GODS[gi].z === claim.god) return GODS[gi].fx || []; return []; })();
      var fxHtml = godFx.length ? '<div class="pack-fx">' + godFx.map(function (f) { return '<div>' + esc(f) + '</div>'; }).join('') + '</div>' : '';
      html += '<div class="pack-open rar-' + claim.rarity + '">'
        + '<img class="pack-god-img" src="assets/pack-cards/' + godImgFor(claim) + '.jpg" alt="ไพ่เทพ' + esc(claim.god) + '" loading="lazy">'
        + '<div class="pack-rar">' + RAR_EMO[claim.rarity] + ' ระดับ' + RAR_TXT[claim.rarity] + '</div>'
        + '<div class="pack-god">' + claim.gicon + ' ' + esc(claim.god) + ' · ' + esc(claim.godName) + '</div>'
        + '<p class="pack-bless">"' + esc(claim.godBless) + '"</p>' + fxHtml;
      if (claim.rarity === 'rare') html += '<div class="pack-lucky">🔢 เลขลับของคุณ: <b>' + claim.lucky.join(' · ') + '</b></div>';
      if (claim.rarity === 'legendary') html += '<div class="pack-lucky">📿 คาถา: <b>' + esc(claim.mantra) + '</b><br>🌟 ฤกษ์ทองของคุณ: วันที่ ' + claim.goldDay + '</div>';
      if (claim.rarity === 'common') html += '<p class="pack-bless">"' + esc(claim.msg) + '"</p>';
      html += '<div style="margin-top:12px"><button class="rbtn" data-action="pack-share">📤 อวดไพ่ใบนี้ให้เพื่อนดู</button></div>';
      html += '</div>' + albumHtml();
    }
    html += '</div>';

    // ข. จันทร์เต็มดวง
    var moon = moonState();
    html += '<div class="moon-card">';
    if (moon.active) {
      html += '<div class="moon-live">🌕 คืนนี้จันทร์เต็มดวง' + (moon.active.zodiac ? 'ในราศี' + esc(moon.active.zodiac) : '') + '</div>';
      if (member) html += '<p class="pack-bless">"' + esc(moon.msg) + '"</p>';
      else html += '<p class="pack-bless">🔒 สมาชิกอ่านคำทำนายคืนจันทร์เต็มดวงได้ <button class="rbtn" data-action="open-payment">ปลดล็อก 199/เดือน</button></p>';
    } else if (moon.next) {
      html += '<div class="moon-next">🌖 จันทร์เต็มดวงครั้งหน้า: ' + esc(moon.next.start) + ' — ' + esc(moon.next.title) + '</div>';
    }
    html += '</div>';

    // ค. เช็กอิน
    var pr = checkinProgress();
    html += '<div class="check-card">📅 เช็กอินเดือนนี้ <b>' + pr.days + '/' + pr.goal + '</b> วัน'
      + (pr.rewarded ? ' — รับไพ่ทองแล้ว 👑' : ' — ครบ ' + pr.goal + ' รับไพ่ทอง 👑')
      + '<div class="sb"><div class="sbr" style="width:' + Math.min(100, Math.round(pr.days / pr.goal * 100)) + '%"></div></div></div>';

    hub.innerHTML = html;
  }

  function init(){
    try { checkin(); } catch (e) {}
    try {
      // เป็นสมาชิกแล้ว ไม่ต้องเห็นป้ายโฆษณา
      if (isMember()) { var p = $('promo-pack'); if (p) p.style.display = 'none'; }
    } catch (e2) {}
    render();
  }

  var api = {
    init: init, render: render, renderHub: render,
    isMember: isMember, rollPack: rollPack, claimPack: claimPack, getClaim: getClaim, getAlbum: getAlbum,
    sharePack: sharePack,
    moonState: moonState, checkin: checkin, checkinProgress: checkinProgress,
    monthISO: monthISO, GODS: GODS
  };
  if (typeof window !== 'undefined') window.MemberHub = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  return api;
})();
