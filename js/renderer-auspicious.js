// Auspicious reading renderer v2 (Mode 2)
// Redesigned: "ฤกษ์ยามวันดี" → personalized by birth element × today element
// Replaced: generic คาถา → "เหตุเสริม" จากพลังงานจักรวาล 5 ระดับ
// Added: แบบฝึก 7 วัน — practical life exercises

function go2(){
  var ds=document.getElementById('d2').value; if(!ds)return;
  // โควต้ารายวัน (พรีเมียมไม่จำกัด)
  if (!premiumIsUnlocked()) {
    if (!canReadFree()) { renderQuotaLock(document.getElementById('r2')); return; }
    incrementDailyReadCount();
  }
  var u=U(), PL2=getPL();
  var nm=document.getElementById('n2').value||(u.pdef||'บุคคลนี้');
  var pw=new Date(ds).getDay(), p=PL2[pw];

  // ✨ Smooth transition: fade out form first
  var formCard = document.getElementById('fc2');
  formCard.style.transition = 'opacity .3s ease, transform .3s ease';
  formCard.style.opacity = '0';
  formCard.style.transform = 'translateY(-10px)';

  setTimeout(function(){
    formCard.style.display='none';
    formCard.style.opacity = '';
    formCard.style.transform = '';

    // Show skeleton with fade-in
    var loadEl = document.getElementById('load');
    loadEl.style.opacity = '0';
    loadEl.style.transition = 'opacity .4s ease';
    showLoad();
    requestAnimationFrame(function(){
      loadEl.style.opacity = '1';
    });

    if (document.body && document.body.classList) document.body.classList.add('has-report');
    setTimeout(function(){
      // ✨ Smooth transition: fade out skeleton
      loadEl.style.opacity = '0';
      setTimeout(function(){
        hideLoad();
        loadEl.style.opacity = '';
        loadEl.style.transition = '';

        renderAusp(nm,p,pw,u);
        var r2 = document.getElementById('r2');
        if(r2) {
          var targetY = r2.getBoundingClientRect().top + window.scrollY - 20;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          if (window.StarviaStats) { window.StarviaStats.pingReport('m2'); window.StarviaStats.mountVote(r2, 'm2'); }
        }
      }, 400);
    }, 700);
  }, 300);
}

function renderAusp(nm,p,pw,u){
  var wrap=document.getElementById('r2');
  nm = escapeHTML(nm);
  var premiumUnlocked = premiumIsUnlocked();
  var elementEmoji = p.el === 'ไฟ' ? '🔥' : p.el === 'ดิน' ? '🪨' : p.el === 'ลม' ? '💨' : '💧';
  var now = new Date();
  var DN=u.dn;
  var DS=['☉','☽','♂','☿','♃','♀','♄'];
  var DC=['#FFB84D','#C8DCF0','#E8534A','#6EC89A','#F5A623','#E8A0CF','#9B8AB8'];

  // ===== 1. Header Card =====
  var headerHtml = '<div class="ausp-header-card">'
    + '<div class="ahp-planet" style="color:' + p.c + '">' + p.s + '</div>'
    + '<div class="ahp-info">'
    + '<div class="ahp-name">' + nm + ' — ธาตุ' + p.el + ' ' + elementEmoji + '</div>'
    + '<div class="ahp-connection">พลังงานจากดาว' + p.n + ' (' + p.el + ') เสริมจังหวะชีวิตของคุณ</div>'
    + '</div></div>';

  // ===== 2. วันไหนเหมาะทำอะไร (Personalized by element) =====
  // Each day has a "day element" that interacts with the user's birth element
  var DAY_ELEMENTS = ['ไฟ','น้ำ','ไฟ','ลม','ดิน','น้ำ','ดิน']; // Sun=0..Sat=6

  // Interaction ratings: birthElement × dayElement → score
  var ELEMENT_SCORE = {
    'ไฟ':  { 'ไฟ': 90, 'น้ำ': 70, 'ลม': 85, 'ดิน': 80 },
    'น้ำ': { 'ไฟ': 75, 'น้ำ': 85, 'ลม': 80, 'ดิน': 90 },
    'ลม':  { 'ไฟ': 90, 'น้ำ': 80, 'ลม': 75, 'ดิน': 85 },
    'ดิน': { 'ไฟ': 80, 'น้ำ': 90, 'ลม': 75, 'ดิน': 85 }
  };

  // What each day element is best for
  var DAY_GOOD_AT = {
    'ไฟ': { main: 'เริ่มต้นสิ่งใหม่, ตัดสินใจ, แสดงภาวะผู้นำ', sub: 'จุดไฟพลังงาน — วันแห่งการลงมือทำ' },
    'น้ำ': { main: 'ดูแลความสัมพันธ์, รับฟัง, รักษาตัวเอง', sub: 'หล่อเลี้ยงใจ — วันแห่งการเชื่อมโยง' },
    'ลม': { main: 'สื่อสาร, เจรจา, วางแผน, เรียนรู้', sub: 'เปิดรับไอเดีย — วันแห่งความคิดสร้างสรรค์' },
    'ดิน': { main: 'ลงมือทำ, จัดระบบ, ดูแลสุขภาพ', sub: 'สร้างรากฐาน — วันแห่งความมั่นคง' }
  };

  // Cross-element advice
  var CROSS_ADVICE = {
    'ไฟ-น้ำ': 'อารมณ์จะลึก — ใช้ความรู้สึกนำทาง แต่อย่าตัดสินด้วยอารมณ์ชั่ววูบ',
    'ไฟ-ลม': 'ความคิดแล่นเร็ว — จดไว้ก่อนจะลืม แล้วเลือกทำ 1 อย่าง',
    'ไฟ-ดิน': 'พลังนิ่งและมั่นคง — ลงมือทำวันนี้ ผลลัพธ์จะยั่งยืน',
    'น้ำ-ไฟ': 'ความมั่นใจจะมาพร้อมอารมณ์ — ใช้ให้เป็นพลัง',
    'น้ำ-ลม': 'ความคิดจะลึกซึ้ง — เหมาะกับเขียนบันทึกหรือคุยเรื่องสำคัญ',
    'น้ำ-ดิน': 'จิตใจจะสงบ — เหมาะกับจัดการเรื่องที่ค้างคา',
    'ลม-ไฟ': 'แรงบันดาลใจพุ่ง — ลงมือทำทันทีก่อนจะหมดไฟ',
    'ลม-น้ำ': 'ความเห็นอกเห็นใจเพิ่มขึ้น — วันนี้เหมาะรับฟัง',
    'ลม-ดิน': 'ความคิดเป็นระบบ — เหมาะวางแผนและจัดระเบียบ',
    'ดิน-ไฟ': 'ความมุ่งมั่นแข็งแกร่ง — ลุยงานที่ท้าทาย',
    'ดิน-น้ำ': 'ความอ่อนโยนเสริมความมั่นคง — ดูแลคนรอบข้าง',
    'ดิน-ลม': 'การสื่อสารชัดเจน — เจรจาต่อรองจะสำเร็จ'
  };

  // Build personalized day-by-day cards
  var todayIdx = new Date().getDay();
  var todayEl = DAY_ELEMENTS[todayIdx];
  var score = ELEMENT_SCORE[p.el] ? ELEMENT_SCORE[p.el][todayEl] : 80;
  var crossKey = p.el + '-' + todayEl;
  var advice = CROSS_ADVICE[crossKey] || 'วันนี้พลังธาตุสมดุล — ทำตามแผนที่วางไว้ได้เลย';
  var goodAt = DAY_GOOD_AT[todayEl] || DAY_GOOD_AT['ไฟ'];

  var dayCardHtml = '<div class="ausp-today-card">'
    + '<div class="atc-header">'
    + '<div class="atc-title">✦ วันนี้เหมาะทำอะไร ✦</div>'
    + '<div class="atc-subtitle">ธาตุ' + p.el + ' (คุณ) × ธาตุ' + todayEl + ' (วันนี้)</div>'
    + '</div>'
    + '<div class="atc-score">'
    + '<div class="atc-score-bar"><div class="atc-score-fill" style="width:' + score + '%"></div></div>'
    + '<div class="atc-score-text">' + score + '/100 — ' + (score >= 85 ? '✦ วันดีมาก' : score >= 70 ? '◇ วันดี' : '△ วันต้องระวัง') + '</div>'
    + '</div>'
    + '<div class="atc-good-at"><strong>เหมาะกับ:</strong> ' + goodAt.main + '</div>'
    + '<div class="atc-advice">' + advice + '</div>'
    + '<div class="atc-element-tag">' + goodAt.sub + '</div>'
    + '</div>';

  // ===== 3. จังหวะดาวรายสัปดาห์ (Personalized) =====
  var weekHtml = '<div class="ausp-week-card' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="awc-title">📅 ปฏิทินวันมงคล · จังหวะดาวรายสัปดาห์</div>'
    + '<div class="awc-subtitle">วันไหนเหมาะทำอะไร — เฉพาะธาตุ' + p.el + 'ของคุณ</div>';

  if (premiumUnlocked) {
    weekHtml += '<div class="awc-grid">';
    for (var i = 0; i < 7; i++) {
      var dEl = DAY_ELEMENTS[i];
      var dScore = ELEMENT_SCORE[p.el] ? ELEMENT_SCORE[p.el][dEl] : 80;
      var dGood = DAY_GOOD_AT[dEl];
      var lv = dScore >= 85 ? 'good' : dScore >= 70 ? 'mid' : 'bad';
      var lvLabel = lv === 'good' ? '✦ ดีมาก' : lv === 'mid' ? '◇ ดี' : '△ ระวัง';
      var isToday = i === todayIdx;
      weekHtml += '<div class="awc-day' + (isToday ? ' awc-today' : '') + '">'
        + '<div class="awc-day-name">' + DN[i] + '</div>'
        + '<div class="awc-day-symbol" style="color:' + DC[i] + '">' + DS[i] + '</div>'
        + '<div class="awc-day-element">' + dEl + '</div>'
        + '<div class="awc-day-score awc-' + lv + '">' + lvLabel + '</div>'
        + '<div class="awc-day-focus">' + dGood.main.split(',')[0] + '</div>'
        + (isToday ? '<div class="awc-today-badge">วันนี้</div>' : '')
        + '</div>';
    }
    weekHtml += '</div>';
  } else {
    weekHtml += '<div class="awc-preview">'
      + '<div class="awc-day"><div class="awc-day-name">' + DN[todayIdx] + '</div><div class="awc-day-symbol" style="color:' + DC[todayIdx] + '">' + DS[todayIdx] + '</div><div class="awc-day-element">' + todayEl + '</div><div class="awc-day-score awc-' + (score >= 85 ? 'good' : score >= 70 ? 'mid' : 'bad') + '">' + (score >= 85 ? '✦ ดีมาก' : score >= 70 ? '◇ ดี' : '△ ระวัง') + '</div></div>'
      + '<div class="awc-locked-hint">ปลดล็อก Premium เพื่อดูจังหวะดาวครบทั้ง 7 วัน</div>'
      + '</div>';
    weekHtml += buildPremiumLockOverlay('ปลดล็อกจังหวะดาวรายสัปดาห์', 'ดูวันไหนเหมาะทำอะไรครบทั้ง 7 วัน เฉพาะธาตุของคุณ');
  }
  weekHtml += '</div>';

  // ===== 4. เหตุเสริมจากพลังงานจักรวาล (Dharma Gift — ฟรี) =====
  // Uses shared buildVinaiSection() from renderer-shared.js (Single Source of Truth)
  var vinaiHtml = buildVinaiSection(p, now);

  // ===== 5. วันมงคลสี (Keep existing but personalized) =====
  var TODAY_COLORS = [
    { d: 'อาทิตย์', luck: '#4CAF50', luckN: 'เขียว (รับทรัพย์)', work: '#9C27B0', workN: 'ม่วง (ผู้ใหญ่เอ็นดู)', bad: '#2196F3', badN: 'ฟ้า/น้ำเงิน (เลี่ยง)' },
    { d: 'จันทร์', luck: '#9C27B0', luckN: 'ม่วง (รับทรัพย์)', work: '#FF9800', workN: 'ส้ม (ผู้ใหญ่เอ็นดู)', bad: '#F44336', badN: 'แดง (เลี่ยง)' },
    { d: 'อังคาร', luck: '#FF9800', luckN: 'ส้ม (รับทรัพย์)', work: '#424242', workN: 'เทา/ดำ (ผู้ใหญ่เอ็นดู)', bad: '#FFFFFF', badN: 'ขาว/เหลือง (เลี่ยง)' },
    { d: 'พุธ', luck: '#424242', luckN: 'เทา/ดำ (รับทรัพย์)', work: '#2196F3', workN: 'ฟ้า/น้ำเงิน (ผู้ใหญ่เอ็นดู)', bad: '#E91E63', badN: 'ชมพู (เลี่ยง)' },
    { d: 'พฤหัสบดี', luck: '#F44336', luckN: 'แดง (รับทรัพย์)', work: '#FFFFFF', workN: 'ขาว/ครีม (ผู้ใหญ่เอ็นดู)', bad: '#9C27B0', badN: 'ม่วง (เลี่ยง)' },
    { d: 'ศุกร์', luck: '#E91E63', luckN: 'ชมพู (รับทรัพย์)', work: '#4CAF50', workN: 'เขียว (ผู้ใหญ่เอ็นดู)', bad: '#424242', badN: 'เทา/ดำ (เลี่ยง)' },
    { d: 'เสาร์', luck: '#2196F3', luckN: 'ฟ้า/น้ำเงิน (รับทรัพย์)', work: '#F44336', workN: 'แดง (ผู้ใหญ่เอ็นดู)', bad: '#4CAF50', badN: 'เขียว (เลี่ยง)' }
  ];
  var tc = TODAY_COLORS[todayIdx];
  var colorHtml = '';
  if (premiumUnlocked) {
    colorHtml = '<div class="wellness-card">'
      + '<div class="wc-title"><span style="font-size:16px;">✨</span> พลังงานสีประจำวันนี้ (วัน' + tc.d + ')</div>'
      + '<div class="color-day">'
      + '<div class="cd-row">'
      + '<div class="cd-item"><div class="cd-dot" style="background:' + tc.luck + ';"></div><div class="cd-lbl" style="color:var(--g);">' + tc.luckN + '</div></div>'
      + '<div class="cd-item"><div class="cd-dot" style="background:' + tc.work + ';"></div><div class="cd-lbl" style="color:var(--g);">' + tc.workN + '</div></div>'
      + '<div class="cd-item"><div class="cd-dot" style="background:' + tc.bad + '; border-color:rgba(255,0,0,0.4);"></div><div class="cd-lbl" style="color:#c06080">' + tc.badN + '</div></div>'
      + '</div>'
      + '</div></div>';
  }

  // ===== 6. Cosmic Routine (keep existing) =====
  var routines = {
    'ไฟ': [
      { t: '06:00 - 08:00', d: '<strong>Ignite (ปลุกพลัง):</strong> ออกกำลังกายเรียกเหงื่อ หรือตั้งเป้าหมาย 3 อย่างที่ต้องทำให้สำเร็จในวันนี้' },
      { t: '09:00 - 14:00', d: '<strong>Blaze (ลุยงาน):</strong> ช่วงพลังสูงสุด! จัดการงานที่ยากที่สุดหรือต้องใช้ความกล้าหาญ' },
      { t: '15:00 - 17:00', d: '<strong>Radiate (กระจายแสง):</strong> ประชุมทีม สื่อสารสร้างเครือข่าย หรือให้ความช่วยเหลือคนรอบข้าง' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Ember (พักฟื้น):</strong> ลดการใช้หน้าจอ อาบน้ำอุ่น ปล่อยให้ความใจร้อนค่อยๆ สงบลง' }
    ],
    'ดิน': [
      { t: '06:00 - 08:00', d: '<strong>Ground (ตั้งหลัก):</strong> ยืดเหยียดร่างกาย ดื่มน้ำเปล่า จัดลำดับงานอย่างช้าๆ' },
      { t: '09:00 - 15:00', d: '<strong>Build (สร้างสรรค์):</strong> ช่วง Deep Work ทำงานที่ต้องใช้สมาธิและความละเอียดรอบคอบสูง' },
      { t: '16:00 - 18:00', d: '<strong>Organize (จัดระเบียบ):</strong> สะสางอีเมล จัดโต๊ะทำงาน หรือวางแผนสำหรับวันพรุ่งนี้' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Settle (สงบใจ):</strong> ทานอาหารมื้ออร่อย อยู่กับคนที่รัก คลายกล้ามเนื้อที่ตึงเครียด' }
    ],
    'ลม': [
      { t: '06:00 - 08:00', d: '<strong>Breathe (เปิดรับ):</strong> อ่านบทความ ฟังพอดแคสต์ หรือเขียน Journal ระบายความคิด' },
      { t: '09:00 - 12:00', d: '<strong>Flow (ลื่นไหล):</strong> ระดมสมอง คิดงานครีเอทีฟ หรือเริ่มเรียนรู้สิ่งใหม่' },
      { t: '13:00 - 16:00', d: '<strong>Connect (เชื่อมโยง):</strong> นัดหมายลูกค้า นำเสนองาน หรือแลกเปลี่ยนไอเดีย' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Still (หยุดนิ่ง):</strong> งดรับข้อมูล ฝึกสมาธิ ทำกิจกรรมที่ต้องโฟกัสสิ่งเดียว' }
    ],
    'น้ำ': [
      { t: '06:00 - 08:00', d: '<strong>Reflect (สะท้อนใจ):</strong> นั่งสมาธิ ฟังเพลงบรรเลง เช็กความรู้สึกก่อนเริ่มวัน' },
      { t: '09:00 - 12:00', d: '<strong>Nurture (ดูแล):</strong> ทำงานที่ต้องใช้ความเห็นอกเห็นใจ ดูแลลูกค้า หรือซัพพอร์ตทีม' },
      { t: '13:00 - 16:00', d: '<strong>Create (สร้างผลงาน):</strong> ใช้สัญชาตญาณและอารมณ์ศิลป์สร้างสรรค์ผลงาน' },
      { t: '19:00 เป็นต้นไป', d: '<strong>Cleanse (ชำระล้าง):</strong> แช่น้ำอุ่น เขียนบันทึกขอบคุณ ปล่อยวางความรู้สึกที่แบกรับมา' }
    ]
  };
  var myRoutine = routines[p.el];
  var routineHtml = '<div class="wellness-card cosmic-routine-card' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="wc-title"><span style="font-size:16px;">⏳</span> นาฬิกาชีวิตธาตุ' + p.el + ' (Cosmic Routine)</div>'
    + '<div style="font-size:11.5px; color:var(--tx2); margin-bottom:16px; text-align:center; line-height:1.6;">ตารางเวลาที่สอดคล้องกับพลังงานดวงดาวของคุณ</div>';
  if (premiumUnlocked) {
    myRoutine.forEach(function(rt){
      routineHtml += '<div class="time-block act-time-window"><div class="tb-time">⏰ ' + rt.t + '</div><div class="tb-desc">' + rt.d + '</div></div>';
    });
  } else {
    routineHtml += '<div class="time-block"><div class="tb-time">Premium</div><div class="tb-desc">ปลดล็อกเพื่อดูตารางนาฬิกาชีวิตรายช่วงเวลา</div></div>'
      + buildPremiumLockOverlay('ปลดล็อก Cosmic Routine', 'ดูตารางชีวิตตามธาตุ ช่วงเวลาพลังสูง และช่วงเวลาพักฟื้น');
  }
  routineHtml += '</div>';

  // ===== 7. Opening Mantra (rewritten) =====
  var mantraHtml = '<div class="mc"><div class="mc-l">✦ คำนำทาง ✦</div>'
    + '<div class="mc-t" style="font-size:13px; line-height:1.9; font-weight:normal;">'
    + '"ชีวิตดีขึ้นได้ด้วยการสร้างเหตุใหม่ที่ตรงข้ามกับทุกข์ — เริ่มจากทานที่มีใจดี ศีลที่ทำให้ชีวิตปลอดภัย เมตตาที่ทำให้ใจเย็น และปัญญาที่เห็นความไม่เที่ยงของทุกสิ่ง"'
    + '<div style="font-size:10px;color:#7a6a9a;margin-top:6px;letter-spacing:.04em;">— พลังงานแห่งจักรวาล</div>'
    + '</div></div>';

  // ===== Render all =====
  wrap.innerHTML = headerHtml
    + dayCardHtml
    + weekHtml
    + vinaiHtml
    + colorHtml
    + buildAuspiciousTimingHtml(pw)
    + routineHtml
    + mantraHtml
    + '<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="2">' + u.r2 + '</button> <button class="rbtn rbtn-clear" data-action="clear-mode" data-mode="2">🗑 ล้างข้อมูลดูใหม่</button></div>';
  // ✨ Scroll-triggered reveal — all report cards float up when scrolled into view
  (function(){
    var cards = wrap.querySelectorAll(':scope > .card, :scope > .mc, :scope > .collapsible-section');
    for(var ci = 0; ci < cards.length; ci++){
      cards[ci].classList.add('reveal');
      cards[ci].style.transitionDelay = (ci * 0.06) + 's';
    }
    // Re-observe new elements with IntersectionObserver
    if(typeof window._revealObserver !== 'undefined') {
      cards.forEach(function(el){ window._revealObserver.observe(el); });
    }
  })();
  // Card Menu จิ้มการ์ดดูทีละหน้า (12 ต.ค.69)
  if (typeof CardMenu !== 'undefined' && CardMenu.build) CardMenu.build('r2');
}

// Max date
['d0','d1a','d1b','d2'].forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.max=new Date().toISOString().split('T')[0];
});

function buildAuspiciousTimingHtml(dayOfWeek) {
  if (typeof AUSPICIOUS_TIMING === 'undefined') return '';
  var DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
  var dayName = DAY_NAMES[dayOfWeek] || 'อาทิตย์';
  var at = AUSPICIOUS_TIMING;
  // Option A: ฟรีดูแค่ชื่อฤกษ์, คำแนะนำล็อค Premium
  var premiumUnlocked = (typeof premiumIsUnlocked === 'function') && premiumIsUnlocked();
  
  var html = '<div class="at-card">';
  
  // Day table (good/bad days for this day)
  if (at.dayTable && at.dayTable[dayName]) {
    var dt = at.dayTable[dayName];
    html += '<div class="at-section"><div class="at-subtitle">📅 วันดี/วันระวังสำหรับคนเกิดวัน' + dayName + '</div>';
    html += '<table class="at-table"><thead><tr><th>วัน</th><th>Rating</th><th>เหมาะทำ</th></tr></thead><tbody>';
    for (var key in dt) {
      if (dt.hasOwnProperty(key)) {
        var dayInfo = dt[key];
        var ratingClass = dayInfo.rating === 'ดีที่สุด' ? 'at-best' : dayInfo.rating === 'ดี' ? 'at-good' : dayInfo.rating === 'ระวัง' ? 'at-bad' : 'at-mid';
        html += '<tr><td>' + escapeHTML(key) + '</td><td class="' + ratingClass + '">' + escapeHTML(dayInfo.rating) + '</td><td>' + (premiumUnlocked ? escapeHTML(dayInfo.suitable) : '<span style="color:#7a6a9a;">🔒 Premium</span>') + '</td></tr>';
      }
    }
    html += '</tbody></table></div>';
  }
  
  // Rusik (9 ฤกษ์)
  if (at.rusik && at.rusik.length) {
    html += '<div class="at-section"><div class="at-subtitle">🕐 ฤกษ์ 9 ฤกษ์</div>';
    if (premiumUnlocked) {
      html += '<table class="at-table"><thead><tr><th>ฤกษ์</th><th>เลข</th><th>ความหมาย</th><th>เหมาะทำ</th></tr></thead><tbody>';
      at.rusik.forEach(function(r) {
        html += '<tr><td>' + escapeHTML(r.name) + '</td><td>' + escapeHTML(r.numbers) + '</td><td>' + escapeHTML(r.meaning) + '</td><td>' + escapeHTML(r.bestFor) + '</td></tr>';
      });
      html += '</tbody></table>';
    } else {
      // ฟรีดูแค่ชื่อฤกษ์
      html += '<div class="at-rusik-free">';
      at.rusik.forEach(function(r) {
        html += '<span class="at-rusik-chip">' + escapeHTML(r.name) + '</span> ';
      });
      html += '</div>';
      html += '<div style="text-align:center;margin-top:10px;font-size:12px;color:#7a6a9a;">🔒 ปลดล็อก Premium เพื่อดูเลข ความหมาย และสิ่งที่ฤกษ์นี้เหมาะทำ</div>';
    }
    html += '</div>';
  }
  
  // Yam (8 ยาม)
  if (at.yam && at.yam.length) {
    html += '<div class="at-section"><div class="at-subtitle">⏰ ยาม 8 ยาม</div>';
    if (premiumUnlocked) {
      html += '<table class="at-table"><thead><tr><th>ยาม</th><th>เวลา</th><th>ดาว</th><th>เหมาะทำ</th></tr></thead><tbody>';
      at.yam.forEach(function(y) {
        html += '<tr><td>ยาม ' + y.number + '</td><td>' + escapeHTML(y.time) + '</td><td>' + escapeHTML(y.planet) + '</td><td>' + escapeHTML(y.bestFor) + '</td></tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;padding:12px;font-size:12px;color:#7a6a9a;">🔒 ปลดล็อก Premium เพื่อดูตารางยามทั้ง 8 ช่วงเวลา</div>';
    }
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}
