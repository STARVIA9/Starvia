// Individual reading renderer (Mode 0)
// Provides: buildDailyBrief, renderInd, go0, life timeline helpers
// Renderers extracted from app.js
// Shared helpers (rasiIconHtml, escapeHTML) are loaded from js/reading-helpers.js.

function buildDailyBrief(p, dayOfWeek, personalColor) {
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var db = content && content.dailyBrief ? content.dailyBrief : null;
  if (!db) {
    db = {
      weekdayLabel: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
      weekdayDeity: ['-', '-', '-', '-', '-', '-', '-'],
      weekdayElement: ['-', '-', '-', '-', '-', '-', '-'],
      weekdayEnergy: ['พลังงานวันนี้: มีพลังงานดีสำหรับการเริ่มต้นใหม่'],
      weekdayFocus: ['โฟกัส: สิ่งที่สำคัญที่สุดวันนี้'],
      weekdayWarning: ['ระวัง: อย่ารีบตัดสินใจ'],
      weekdayAction: ['สิ่งที่ควรทำวันนี้: หยุดพักสักครู่']
    };
  }
  var label = db.weekdayLabel[dayOfWeek] || db.weekdayLabel[0];
  var deity = db.weekdayDeity[dayOfWeek] || db.weekdayDeity[0];
  var elName = db.weekdayElement[dayOfWeek] || db.weekdayElement[0];
  var energy = db.weekdayEnergy[dayOfWeek] || db.weekdayEnergy[0];
  var focus = db.weekdayFocus[dayOfWeek] || db.weekdayFocus[0];
  var warning = db.weekdayWarning[dayOfWeek] || db.weekdayWarning[0];
  var action = db.weekdayAction[dayOfWeek] || db.weekdayAction[0];
  var colorName = personalColor ? personalColor.name : '';
  var colorHex = personalColor ? personalColor.hex : '#C9A227';
  return { label: label, deity: deity, element: elName, energy: energy, colorName: colorName, colorHex: colorHex, focus: focus, warning: warning, action: action };
}



// ═══ Conversion CTA Builder (ระบบชิมก่อนซื้อ) ═══
function buildPremiumPriceAnchor(compact){
  return '<div class="premium-price-anchor" aria-label="ราคา Premium">'
    + '<div class="ppa-kicker">EARLY ACCESS PREMIUM</div>'
    + '<div class="ppa-price-row"><span class="ppa-old">590 บาท</span><strong>199 บาท/เดือน</strong></div>'
    + '<div class="ppa-save">ประหยัด 391 บาทในช่วงเปิดตัว · ตกวันละประมาณ 7 บาท</div>'
    + (compact ? '' : '<div class="ppa-value"><span>รายงานเต็ม</span><span>เลขลาภลอย</span><span>หมอทักรายเดือน</span><span>คำแนะนำแก้ดวงครบ 6 ด้าน</span></div>')
    + '</div>';
}

function buildConversionCta(hook, desc, proof, buttonLabel) {
  var label = buttonLabel || '✦ ปลดล็อกรายงานเต็ม ✦';
  return '<div class="conversion-cta">'
    + '<div class="cta-hook">' + hook + '</div>'
    + '<div class="cta-desc">' + desc + '</div>'
    + (proof ? '<div class="cta-proof">' + proof + '</div>' : '')
    + buildPremiumPriceAnchor(true)
    + '<button class="cta-btn" data-action="unlock-premium">' + label + '</button>'
    + '<div class="cta-price">Early Access 199 บาท/เดือน · ถูกกว่าดูดวงส่วนตัว 1 ครั้ง</div>'
    + '</div>';
}

function buildDailyFortuneCta(){
  return '<div class="daily-fortune-cta">'
    + '<div class="dfc-kicker">อ่านต่อจากดวงวันนี้</div>'
    + '<div class="dfc-title">วันนี้คือ “สัญญาณแรก” — รายงานเต็มจะบอกว่าควรระวังและแก้ตรงไหน</div>'
    + '<div class="dfc-desc">ถ้าดวงวันนี้สะกิดใจ ให้เปิดหมอทักรายเดือน + เลขลาภลอย + วิธีแก้ดวงเฉพาะตัว เพื่อใช้วางแผนวันนี้ให้แม่นขึ้น</div>'
    + '<button class="dfc-btn" data-action="unlock-premium">ดูคำเตือนและวิธีแก้เฉพาะตัว</button>'
    + '</div>';
}

function buildPremiumPreviewSummary(){
  return '<div class="premium-preview-summary">'
    + '<div class="pps-kicker">ใน Premium จะได้อ่านต่อ</div>'
    + '<div class="pps-title">สิ่งที่ถูกล็อกไว้ไม่ใช่แค่ “คำทำนาย” แต่คือแผนใช้งานจริง</div>'
    + '<div class="pps-grid">'
    + '<div class="pps-item"><strong>เลขลาภลอยครบ</strong><span>เลข 3 ชุด + วิธีใช้แบบไม่เสี่ยงเกินตัว</span></div>'
    + '<div class="pps-item"><strong>หมอทักรายเดือน</strong><span>5 ด้านชีวิต · สัญญาณเตือน · วิธีแก้</span></div>'
    + '<div class="pps-item"><strong>คัมภีร์ 6 ด้าน</strong><span>โชค เงิน สุขภาพ ความรัก งาน บริวาร</span></div>'
    + '<div class="pps-item"><strong>วันดี/วันต้องระวัง</strong><span>ใช้วางแผนก่อนตัดสินใจเรื่องสำคัญ</span></div>'
    + '</div>'
    + '<div class="pps-trust">ใช้เป็นแผนที่สะท้อนจังหวะชีวิต ไม่ใช่การฟันธงแทนการตัดสินใจของคุณ</div>'
    + '</div>';
}

function buildWarningTeaser(text) {
  return '<div class="warning-teaser">'
    + '<span class="wt-icon">⚠️</span>'
    + '<span class="wt-text">' + text + '</span>'
    + '</div>';
}

function buildTeaserReveal(label, text) {
  return '<div class="teaser-reveal">'
    + '<div class="teaser-label">' + label + '</div>'
    + '<div class="teaser-text">' + text + '</div>'
    + '</div>';
}

function maskWindfallNumber(number, index){
  var text = String(number || '00');
  if (index % 2 === 0) return text.charAt(0) + '●';
  return '●' + text.charAt(1);
}

function buildWindfallNumberHtml(number, index, premiumUnlocked){
  var fullNumber = escapeHTML(number);
  if (premiumUnlocked) return '<strong class="wfl-full-number">' + fullNumber + '</strong>';
  return '<strong class="wfl-mask-number">' + escapeHTML(maskWindfallNumber(number, index)) + '</strong>'
    + '<strong class="wfl-full-number" aria-hidden="true">' + fullNumber + '</strong>';
}

function maskWindfallText(text, luckyNumbers){
  var maskedText = String(text || '');
  luckyNumbers.forEach(function(number, index){
    maskedText = maskedText.split(number).join(maskWindfallNumber(number, index));
  });
  return maskedText;
}

function buildWindfallDetailHtml(guide, premiumUnlocked){
  var fullStepsHtml = guide.ritualSteps.map(function(step){ return '<li>' + escapeHTML(step) + '</li>'; }).join('');
  if (premiumUnlocked) return '<ol>' + fullStepsHtml + '</ol>';
  var maskedStepsHtml = guide.ritualSteps.map(function(step){
    return '<li>' + escapeHTML(maskWindfallText(step, guide.luckyNumbers)) + '</li>';
  }).join('');
  return '<ol class="wfl-mask-detail">' + maskedStepsHtml + '</ol>'
    + '<ol class="wfl-full-detail" aria-hidden="true">' + fullStepsHtml + '</ol>';
}

// Helper: คำนวณหวยงวดถัดไป (ออกทุกวันที่ 1 และ 16)
// ถ้าวันนี้เป็นวันหวยออก ยังถือว่างวดนี้ขายได้จนถึง 16:00 น.
function getNextLotteryDraw(){
  var now = new Date();
  var day = now.getDate();
  var hour = now.getHours();
  var nextDraw;
  
  // หวยออกวันที่ 1 หรือ 16 — ถ้ายังไม่เลย 16:00 น. ยังขายได้
  if (day === 1 && hour < 16) {
    // งวดวันที่ 1 ยังไม่ออก → แสดงงวดนี้
    nextDraw = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (day === 16 && hour < 16) {
    // งวดวันที่ 16 ยังไม่ออก → แสดงงวดนี้
    nextDraw = new Date(now.getFullYear(), now.getMonth(), 16);
  } else if (day < 16) {
    nextDraw = new Date(now.getFullYear(), now.getMonth(), 16);
  } else {
    nextDraw = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  
  var diff = Math.ceil((nextDraw - now) / (1000 * 60 * 60 * 24));
  var monthNames = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  var label = nextDraw.getDate() + ' ' + monthNames[nextDraw.getMonth()] + ' ' + (nextDraw.getFullYear() + 543);
  
  // ถ้าวันนี้หวยออก ให้แสดง "วันนี้!" แทนจำนวนวัน
  if (diff <= 0 || (day === nextDraw.getDate() && now.getMonth() === nextDraw.getMonth())) {
    return { daysLeft: 0, label: label, isToday: true };
  }
  return { daysLeft: diff, label: label, isToday: false };
}

function buildWindfallLuckHtml(guide, premiumUnlocked){
  // === FREE ZONE: แสดงชัดเจนเสมอ ===
  var html = '<div class="windfall-luck' + (premiumUnlocked ? '' : ' windfall-luck-freemium') + '">'
    + '<div class="wfl-kicker">หวย · ลอตเตอรี่ · ลาภลอย</div>'
    + '<div class="wfl-title">✦ ' + escapeHTML(guide.title) + ' ✦</div>'
    + '<div class="wfl-desc">' + escapeHTML(guide.subtitle) + '</div>'
    + '<div class="wfl-numbers"><span>เลขที่ควรลอง</span>'
    + guide.luckyNumbers.map(function(number, index){ return buildWindfallNumberHtml(number, index, premiumUnlocked); }).join('')
    + '</div>'
    + '<div class="wfl-grid">'
    + '<div class="wfl-box"><small>จังหวะเฮง</small><b>' + escapeHTML(guide.sacredTime) + '</b></div>'
    + '<div class="wfl-box"><small>ทิศเปิดโชค</small><b>' + escapeHTML(guide.direction) + '</b></div>'
    + '</div>'
    + '<div class="wfl-line"><strong>หวย / ลอตเตอรี่:</strong> ' + escapeHTML(guide.lotteryFocus) + '</div>'
    + '<div class="wfl-line"><strong>สัญญาณเลข:</strong> ' + escapeHTML(guide.omen) + '</div>';

  // === LOCKED ZONE: เบลอเฉพาะส่วนนี้ ===
  if (!premiumUnlocked) {
    // นับถอยหลังหวยงวดถัดไป
    var nextLottery = getNextLotteryDraw();
    var countdownText = nextLottery.isToday
      ? '🔥 หวยงวดนี้ออก <strong>วันนี้!</strong> รีบดูก่อนหวยออก'
      : '📅 หวยงวดถัดไป: <strong>' + nextLottery.label + '</strong> (อีก <span class="wfl-countdown-num">' + nextLottery.daysLeft + '</span> วัน)';
    html += '<div class="wfl-countdown">' + countdownText + '</div>';
    
    // Social proof
    html += '<div class="wfl-social-proof">'
      + '💬 <em>"เลขวันเกิดตัวเอง ตรงกับที่ฝันเลย งวดที่แล้วถูก 2 ตัวบน"</em> — ผู้ใช้ STARVIA'
      + '</div>';
    
    // Locked content (blurred)
    html += '<div class="wfl-locked-zone">'
      + '<div class="wfl-section"><strong>พิธีเปิดทางโชค</strong>'
      + buildWindfallDetailHtml(guide, false)
      + '</div>'
      + '<div class="wfl-mantra"><span>คาถาเรียกโชค</span>"' + escapeHTML(guide.mantra) + '"</div>'
      + '<div class="wfl-avoid"><strong>กันโชครั่ว:</strong> ' + escapeHTML(guide.avoid) + '</div>'
      + '</div>';
    
    // Teaser + CTA
    html += buildTeaserReveal('✦ ทิศเปิดโชคของคุณวันนี้ ✦',
      'ทิศ <span class="teaser-highlight">' + escapeHTML(guide.direction) + '</span> · จังหวะเฮง <span class="teaser-highlight">' + escapeHTML(guide.sacredTime) + '</span>')
    + buildWarningTeaser('เลขตัวที่ 2 ถูกซ่อนไว้ — เปิดดูครบทุกตัวก่อนหวยออก')
    + buildConversionCta(
      '🔮 เปิดเลขตัวที่ 2 ก่อนหวยออก · ปลดล็อก 199 บาท',
      'เลขนำโชคครบทุกตัว + พิธีเปิดทาง + คาถาเรียกโชค + กันโชครั่ว',
      '94% ของคนที่ดูเลขตัวเอง บอกว่า "ตรงจนตกใจ"',
      'เปิดเลขตัวที่ 2 ก่อนหวยออก'
    );
  } else {
    // Premium unlocked — แสดงทั้งหมด
    html += '<div class="wfl-section"><strong>พิธีเปิดทางโชค</strong>'
      + buildWindfallDetailHtml(guide, true)
      + '</div>'
      + '<div class="wfl-mantra"><span>คาถาเรียกโชค</span>"' + escapeHTML(guide.mantra) + '"</div>'
      + '<div class="wfl-avoid"><strong>กันโชครั่ว:</strong> ' + escapeHTML(guide.avoid) + '</div>';
  }
  html += '</div>';
  return html;
}

// Helper: สร้าง domain card สำหรับคัมภีร์ 6 ด้าน
function buildDomainCardV2(domain, isLocked){
  var remedy = domain.dhammaRemedy || {
    cause: domain.warning,
    fix: domain.remedy,
    boost: domain.currentPhase ? domain.currentPhase.text : domain.remedy,
    practice: 'ภารกิจ 7 วัน: เลือก 1 เรื่องที่ควบคุมได้ แล้วทำให้ต่อเนื่อง'
  };
  var practiceText = String(remedy.practice || '').replace(/^ภารกิจ 7 วัน:\s*/, '');
  
  var html = '<div class="domain-card domain-' + escapeHTML(domain.key) + (isLocked ? ' domain-card-locked' : '') + '">'
    + '<div class="domain-head-v2">'
    + '<span class="domain-icon-v2">' + escapeHTML(domain.icon) + '</span>'
    + '<div class="domain-head-info">'
    + '<div class="domain-label-v2">' + escapeHTML(domain.label) + '</div>'
    + '</div>'
    + '<div class="domain-score-badge" style="background:' + escapeHTML(domain.levelColor) + '20;color:' + escapeHTML(domain.levelColor) + ';border:1px solid ' + escapeHTML(domain.levelColor) + '40">'
    + '<span>' + escapeHTML(domain.levelIcon) + '</span>'
    + '<span>' + escapeHTML(domain.level) + '</span>'
    + '</div>'
    + '</div>';
  
  if (isLocked) {
    html += '<div class="domain-compact-body">'
      + '<div class="domain-compact-line domain-now" style="opacity:.4"><b>🌙</b><span>ปลดล็อกเพื่อดูรายละเอียด</span></div>'
      + '</div>';
  } else {
    html += '<div class="domain-compact-body">'
      + '<div class="domain-compact-line domain-now"><b>🌙 สถานะตอนนี้</b><span>' + escapeHTML(domain.current) + '</span></div>'
      + '<div class="domain-compact-line domain-caution"><b>⚡ ระวัง</b><span>' + escapeHTML(domain.warning) + '</span></div>'
      + '<div class="domain-compact-line domain-cause"><b>🔮 แก้เหตุ</b><span>' + escapeHTML(remedy.fix) + '</span></div>'
      + '<div class="domain-compact-line domain-boost"><b>✨ เสริมให้ปัง</b><span>' + escapeHTML(remedy.boost) + '</span></div>'
      + '<div class="domain-compact-line domain-practice"><b>ภารกิจ 7 วัน</b><span>' + escapeHTML(practiceText) + '</span></div>'
      + '</div>'
      + '<details class="domain-age-details">'
      + '<summary>ดูจังหวะ 15 ปีข้างหน้า</summary>'
      + '<div class="domain-ages">';
    domain.opportunities.forEach(function(opp){
      html += '<div class="domain-age-v2">'
        + '<span class="domain-age-chip" style="background:' + escapeHTML(opp.level === 'ปีทอง' ? '#FFD700' : opp.level === 'ปีดี' ? '#4CAF50' : opp.level === 'ปานกลาง' ? '#FFC107' : '#9E9E9E') + '20">' + escapeHTML(opp.ageRange) + '</span>'
        + '<p>' + escapeHTML(opp.text) + '</p>';
      if (opp.preparation) {
        html += '<p class="domain-age-prep">' + escapeHTML(opp.preparation) + '</p>';
      }
      html += '</div>';
    });
    html += '</div></details>';
  }
  html += '</div>';
  return html;
}

// Helper: สร้าง domain card สำหรับหมอทัก (ใช้ร่วมกันระหว่าง free/locked)
function buildSingleDomainCard(domain, isLocked){
  var phaseClass = domain.phase === 'ขาขึ้น' ? 'mlm-phase-up' : domain.phase === 'ทรงตัว' ? 'mlm-phase-stable' : 'mlm-phase-warn';
  var phaseEmoji = domain.phase === 'ขาขึ้น' ? '📈' : domain.phase === 'ทรงตัว' ? '⚖️' : '⚠️';
  
  var html = '<div class="mlm-domain mlm-domain-moo' + (isLocked ? ' mlm-domain-locked' : '') + '">'
    + '<div class="mlm-domain-head">'
    + '<span class="mlm-domain-icon">' + escapeHTML(domain.icon) + '</span>'
    + '<span class="mlm-domain-label">' + escapeHTML(domain.label) + '</span>'
    + (domain.phase ? '<span class="mlm-phase ' + phaseClass + '">' + phaseEmoji + ' ' + escapeHTML(domain.phase) + '</span>' : '')
    + (domain.luckyDay ? '<span class="mlm-lucky-day">🌙 วันที่ ' + escapeHTML(String(domain.luckyDay)) + '</span>' : '')
    + '</div>'
    + '<div class="mlm-score-row"><span>จังหวะเดือนนี้</span>'
    + '<strong>' + escapeHTML(domain.phase || 'ทรงตัว') + '</strong>'
    + '</div>'
    + '<div class="mlm-score-bar"><i style="width:' + escapeHTML(String(domain.score || 0)) + '%"></i></div>';

  if (isLocked) {
    // แสดงแค่ teaser สั้นๆ
    html += '<div class="mlm-moo-forecast">'
      + '<p class="mlm-moo-text" style="opacity:.5">' + escapeHTML(domain.teaser || 'ปลดล็อกเพื่อดูรายละเอียด') + '</p>'
      + '</div>';
  } else {
    // แสดงเต็ม
    if (domain.key === 'career') {
      html += '<div class="mlm-moo-forecast">'
        + '<p class="mlm-moo-text">' + escapeHTML(domain.forecast) + '</p>'
        + '</div>'
        + '<div class="mlm-action"><span class="mlm-action-icon">🎯</span><strong>สิ่งที่ควรทำ:</strong> ' + escapeHTML(domain.action || '') + '</div>';
    } else if (domain.key === 'money') {
      var moneyItems = domain.forecast.split(' — ');
      html += '<div class="mlm-moo-forecast">'
        + '<ul class="mlm-money-list">';
      moneyItems.forEach(function(item, i){
        if (item && i < 3) html += '<li>💰 ' + escapeHTML(item) + '</li>';
      });
      html += '</ul>'
        + '</div>'
        + '<div class="mlm-action"><span class="mlm-action-icon">💎</span><strong>เคล็ดลับ:</strong> ' + escapeHTML(domain.action || '') + '</div>';
    } else if (domain.key === 'windfall') {
      html += '<div class="mlm-moo-forecast mll-windfall">'
        + '<p class="mlm-moo-text">' + escapeHTML(domain.forecast) + '</p>'
        + '</div>';
      if (domain.luckyDay) {
        html += '<div class="mlm-lucky-hint"><span class="mlm-lucky-icon">🎰</span><strong>เลขนำโชค:</strong> ลองดูวันที่ ' + escapeHTML(String(domain.luckyDay)) + '</div>';
      }
      html += '<div class="mlm-action"><span class="mlm-action-icon">🌟</span><strong>สิ่งที่ควรทำ:</strong> ' + escapeHTML(domain.action || '') + '</div>';
    } else if (domain.key === 'relationship') {
      html += '<div class="mlm-moo-forecast">'
        + '<p class="mlm-moo-text">' + escapeHTML(domain.forecast) + '</p>'
        + '</div>';
    } else if (domain.key === 'health') {
      html += '<div class="mlm-moo-forecast">'
        + '<p class="mlm-moo-text">' + escapeHTML(domain.forecast) + '</p>'
        + '</div>'
        + '<div class="mlm-action"><span class="mlm-action-icon">🏥</span><strong>สัญญาณร่างกาย:</strong> ' + escapeHTML(domain.action || '') + '</div>';
    } else {
      html += '<div class="mlm-moo-forecast">'
        + '<p class="mlm-moo-text">' + escapeHTML(domain.forecast) + '</p>'
        + '</div>'
        + '<div class="mlm-action"><span class="mlm-action-icon">✨</span><strong>ควรทำ:</strong> ' + escapeHTML(domain.action || '') + '</div>';
    }
    if (domain.omen) {
      html += '<div class="mlm-omen"><span class="mlm-omen-icon">👁️</span><em>' + escapeHTML(domain.omen) + '</em></div>';
    }
  }
  html += '</div>';
  return html;
}

function buildMonthlyLifeMapHtml(model, premiumUnlocked){
  var html = '<div class="monthly-life-map' + (premiumUnlocked ? '' : ' monthly-life-map-freemium') + '">'
    + '<div class="mlm-kicker">✦ หมอทักประจำเดือน ✦</div>'
    + '<div class="mlm-title">🔮 ' + escapeHTML(model.title) + '</div>'
    + '<div class="mlm-mystic-intro">'
    + '<p class="mlm-mystic-quote">"ดาวกำลังบอกบางสิ่งกับคุณในเดือนนี้ — ฟังให้ดีแล้วจะเห็นทาง"</p>'
    + '<p class="mlm-mystic-sub">ทักษาปกรณ์ · นพเคราะห์ · ธาตุเจ้าชะตา</p>'
    + '</div>'
    + '<div class="mlm-summary"><strong>🌟 พลังงานหลักของเดือนนี้:</strong> ' + escapeHTML(model.elementFocus) + '</div>'
    + '<div class="mlm-grid">'
    + '<div class="mlm-pill mlm-pill-warn"><span>⚡ วันที่ควรระวัง</span>' + escapeHTML(model.elementWarning) + '</div>'
    + '<div class="mlm-pill mlm-pill-action"><span>✨ สิ่งที่ควรทำ</span>' + escapeHTML(model.elementAction) + '</div>'
    + '</div>';

  html += '<div class="mlm-section-title">✦ 5 ด้านชีวิตที่ดาวจับตา ✦</div>';
  
  // หาด้านที่คะแนนสูงสุดสำหรับ free preview
  var topDomain = null;
  if (!premiumUnlocked) {
    topDomain = model.domains.reduce(function(max, d){ return (d.score || 0) > (max.score || 0) ? d : max; }, model.domains[0]);
  }
  
  // === Free preview: top domain แสดงชัดเจน, ด้านอื่นๆ อยู่ใน locked zone ===
  if (!premiumUnlocked && topDomain) {
    // แสดง top domain เต็มก่อน (นอก locked zone)
    html += '<div class="mlm-domains mlm-domains-free">';
    html += buildSingleDomainCard(topDomain, false);
    html += '</div>';
    // แสดงด้านอื่นๆ ใน locked zone
    html += '<div class="mlm-domains-locked">';
    html += '<div class="mlm-domains">';
    model.domains.forEach(function(domain){
      if (domain.key !== topDomain.key) {
        html += buildSingleDomainCard(domain, true);
      }
    });
    html += '</div>';
    html += '</div>';
  } else {
    // Premium unlocked — แสดงทั้งหมด
    html += '<div class="mlm-domains">';
    model.domains.forEach(function(domain){
      html += buildSingleDomainCard(domain, false);
    });
    html += '</div>';
  }


  if (premiumUnlocked) {
    html += '<div class="mlm-section-title">📅 ปฏิทินวันดีรายเดือน</div><div class="mlm-calendar">';
    model.calendarDays.forEach(function(day){
      html += '<div class="mlm-cal-day mlm-' + escapeHTML(day.tone) + '"><strong>' + day.day + '</strong><span>' + escapeHTML(day.label) + '</span></div>';
    });
    html += '</div>';

    html += '<div class="mlm-section-title">✦ สรุปรายสัปดาห์ 4 สัปดาห์ ✦</div><div class="mlm-weeks">';
    model.weeklyBriefs.forEach(function(week){
      html += '<div class="mlm-week"><strong>' + escapeHTML(week.title) + '</strong><p>' + escapeHTML(week.brief) + '</p><span>' + escapeHTML(week.action) + '</span></div>';
    });
    html += '</div>';

    html += '<div class="mlm-section-title">✦ ภารกิจเสริมดวง 7 วัน ✦</div><div class="mlm-rituals">';
    model.rituals.forEach(function(ritual, index){
      html += '<div class="mlm-ritual"><span class="mlm-ritual-day">Day ' + (index + 1) + '</span>' + escapeHTML(ritual) + '</div>';
    });
    html += '</div>';
  } else {
    // แสดง teaser: พลังงานหลัก + ด้านที่เด่นสุด (แสดงเต็มแล้วด้านบน) + สัญญาณเตือน
    var topDomainName = topDomain ? topDomain.label : '';
    var lockedDomainNames = model.domains.filter(function(d){ return !topDomain || d.key !== topDomain.key; }).map(function(d){ return d.label; }).join(' · ');
    html += buildWarningTeaser('ด้านอื่นๆ ที่ยังไม่ได้ดู: ' + lockedDomainNames)
    + buildConversionCta(
      '🔮 ดูหมอทักครบทุกด้าน · ปลดล็อก 199 บาท',
      'ดู ' + lockedDomainNames + ' + ปฏิทินวันดี + สรุปรายสัปดาห์ + ภารกิจเสริมดวง 7 วัน',
      'รู้ก่อน แก้ก่อน — ไม่ต้องรอให้ปัญหาเกิด',
      'ดูคำเตือนรายเดือนของฉัน'
    );
  }

  html += '</div>';
  return html;
}

// ===== MODE 0: Individual =====
function go0(){
  var ds=document.getElementById('d0').value; if(!ds)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var nm=document.getElementById('n0').value||(u.pdef||'บุคคลนี้');
  var gd=document.getElementById('g0').value;
  var ts=document.getElementById('t0').value||'';
  var bday = new Date(ds);
  var birthDay = bday.getDate();
  var birthMonth = bday.getMonth() + 1;
  var birthYearBE = bday.getFullYear() + 543;
  var p=PL2[new Date(ds).getDay()];
  var ri=getRasi(ds), li=ts ? getLagna(ds,ts) : ri;
  var r=RA2[ri], l=RA2[li];

  // ✨ Smooth transition: fade out form first
  var formCard = document.getElementById('fc0');
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

    // 💡 กลยุทธ์ Illusion of Labor (เปลี่ยนข้อความบิ้วด์อารมณ์)
    var loadTxt = document.getElementById('load-txt');
    loadTxt.innerHTML = '✨ กำลังคำนวณตำแหน่งดวงดาว...';
    setTimeout(function(){ loadTxt.innerHTML = '🔮 กำลังถอดรหัสราศีและลัคนา...'; }, 1000);
    setTimeout(function(){ loadTxt.innerHTML = '📜 กำลังสร้างพิมพ์เขียวชีวิตของคุณ...'; }, 2000);

    // ยืดเวลาโหลดเป็น 3 วินาทีเพื่อให้ลูกค้ารู้สึกว่าระบบทำงานลึกซึ้งจริงๆ
    setTimeout(function(){
      // ✨ Smooth transition: fade out skeleton
      loadEl.style.opacity = '0';
      setTimeout(function(){
        hideLoad();
        loadEl.style.opacity = '';
        loadEl.style.transition = '';

        // Render report
        renderInd(nm,gd,ds,ts,p,r,l,ri,li,u, birthDay, birthMonth, birthYearBE);

        // Auto-scroll to report with smooth animation
        var reportEl = document.getElementById('r0');
        if(reportEl) {
          var targetY = reportEl.getBoundingClientRect().top + window.scrollY - 20;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          // นับเปิดรายงานจริง + แปะกล่องโหวต "ตรงไหม"
          if (window.StarviaStats) { window.StarviaStats.pingReport('m0'); window.StarviaStats.mountVote(reportEl, 'm0'); }
        }
      }, 400);
    }, 3200);
  }, 300);
}

// ===== PERSONALIZED LIFE GRAPH =====
// คำนวณกราฟชีวิตเฉพาะบุคคลจาก ดาวเจ้าชะตา + ธาตุ + อายุ
// แทนที่ LIFE_BANDS แบบเดิมที่เหมือนกันทุกคน
var PLANET_PIVOT_AGES = {
  'อาทิตย์': [21, 28, 35, 42, 56],
  'จันทร์':  [18, 25, 33, 40, 52],
  'อังคาร':  [20, 27, 32, 38, 45],
  'พุธ':    [17, 23, 30, 37, 44],
  'พฤหัสบดี':[24, 32, 40, 48, 60],
  'ศุกร์':  [22, 29, 36, 43, 55],
  'เสาร์':  [27, 35, 42, 49, 58],
  'ราหู':   [19, 26, 34, 41, 50],
  'เกตุ':   [19, 26, 34, 41, 50],
  'พระจันทร์': [18, 25, 33, 40, 52]
};

var LIFE_PHASE_LABELS = ['รากฐาน', 'ค้นหาตัวเอง', 'ทดสอบโลก', 'ตั้งหลัก', 'สร้างตัว', 'ส่งต่อ'];

function buildPersonalLifeGraph(p, ageY) {
  var pivotAges = PLANET_PIVOT_AGES[p.n] || PLANET_PIVOT_AGES['อาทิตย์'];
  var el = p.el || 'ดิน';

  // Build phases from pivot ages
  var phases = [];
  var prevAge = 0;
  for (var i = 0; i < pivotAges.length; i++) {
    phases.push({ from: prevAge, to: pivotAges[i], label: LIFE_PHASE_LABELS[i] || ('ช่วงที่ ' + (i+1)) });
    prevAge = pivotAges[i];
  }
  // Final phase
  phases.push({ from: prevAge, to: 99, label: LIFE_PHASE_LABELS[LIFE_PHASE_LABELS.length - 1] || 'ส่งต่อ' });

  // Element-based energy curve
  var energyCurves = {
    'ไฟ': [35, 70, 85, 65, 90, 75],
    'ดิน': [30, 45, 55, 65, 75, 85],
    'ลม': [40, 60, 50, 70, 55, 80],
    'น้ำ': [30, 55, 60, 75, 70, 90]
  };
  var curve = energyCurves[el] || energyCurves['ดิน'];

  // Assign energy to each phase
  for (var j = 0; j < phases.length; j++) {
    phases[j].energy = curve[j] || 50;
    phases[j].color = getEnergyColor(phases[j].energy);
  }

  // Find current phase
  var currentPhase = 0;
  for (var k = 0; k < phases.length; k++) {
    if (ageY >= phases[k].from && ageY < phases[k].to) {
      currentPhase = k;
      break;
    }
  }

  // Calculate progress within current phase (0-100%)
  var cp = phases[currentPhase];
  var phaseSpan = cp.to - cp.from;
  var progress = phaseSpan > 0 ? Math.min(100, Math.round(((ageY - cp.from) / phaseSpan) * 100)) : 50;

  // Element-specific current insight
  var elementInsights = {
    'ไฟ': ['พลังนำ — ใช้ความกล้าเปิดทาง แต่อย่าลืมฟังคนรอบตัว', 'จังหวะลุย — ถึงเวลาลงมือ แต่วางแผนก่อนพุ่ง', 'ช่วงพัก — ใช้เวลาฟื้นพลังก่อนลุยต่อ', 'หัวเลี้ยว — ตัดสินใจใหญ่รออยู่ ใจเย็น ๆ'],
    'ดิน': ['สร้างฐาน — มั่นคงทีละก้อน ไม่ต้องรีบ', 'ช่วงผลิดอก — สิ่งที่อดทนไว้กำลังผลิผล', 'ปรับดิน — ถึงเวลาเปลี่ยนวิธี ไม่ใช่เป้าหมาย', 'เก็บเกี่ยว — รับผลจากความเพียรที่ผ่านมา'],
    'ลม': ['เปิดรับ — ไอเดียใหม่กำลังมา เลือกให้ดี', 'สื่อสาร — คำพูดมีพลังกว่าที่คิด', 'โฟกัส — รวมพลังไปที่เรื่องเดียวให้จบ', 'กระจาย — ถึงเวลาต่อยอดสิ่งที่ทำสำเร็จ'],
    'น้ำ': ['ฟังใจ — สัญชาตญาณกำลังบอกอะไรบางอย่าง', 'ไหลตาม — อย่าฝืนธรรมชาติของจังหวะชีวิต', 'ลึกขึ้น — เข้าใจตัวเองในระดับที่ลึกกว่าเดิม', 'รวมพลัง — อารมณ์และเหตุผลประสานกัน']
  };
  var insights = elementInsights[el] || elementInsights['ดิน'];
  var insightIdx = currentPhase >= insights.length ? insights.length - 1 : currentPhase;
  var insight = insights[insightIdx];

  return {
    phases: phases,
    currentPhase: currentPhase,
    currentAge: ageY,
    progress: progress,
    element: el,
    planetName: p.n,
    planetSymbol: p.s,
    planetColor: p.c,
    insight: insight,
    phaseLabel: cp.label
  };
}

function getEnergyColor(energy) {
  if (energy >= 80) return '#4CAF50';
  if (energy >= 65) return '#8BC34A';
  if (energy >= 50) return '#FFC107';
  if (energy >= 35) return '#FF9800';
  return '#F44336';
}

function buildLifeGraphHtml(graph) {
  var html = '<div class="life-graph-card">'
    + '<div class="lg-header">'
    + '<span class="lg-planet" style="color:' + graph.planetColor + '">' + graph.planetSymbol + '</span>'
    + '<div><div class="lg-title">✦ กราฟชีวิตเฉพาะบุคคล ✦</div>'
    + '<div class="lg-subtitle">จุดเปลี่ยนชีวิตคำนวณจากดาว' + graph.planetName + ' · ธาตุ' + graph.element + '</div></div>'
    + '</div>';

  // Phase labels above bars
  html += '<div class="lg-phase-labels">';
  for (var i = 0; i < graph.phases.length; i++) {
    var ph = graph.phases[i];
    var isCurrent = (i === graph.currentPhase);
    var labelClass = isCurrent ? ' lg-phase-current' : '';
    html += '<span class="lg-phase-label' + labelClass + '">' + ph.label + '<small>' + ph.from + '</small></span>';
  }
  html += '</div>';

  // Timeline bar
  html += '<div class="lg-timeline">';
  for (var i2 = 0; i2 < graph.phases.length; i2++) {
    var ph2 = graph.phases[i2];
    var isCurrent2 = (i2 === graph.currentPhase);
    var barClass2 = isCurrent2 ? ' lg-bar-current' : '';
    var barStyle2 = 'background:' + ph2.color + ';height:' + (20 + ph2.energy * 0.3) + 'px';
    html += '<div class="lg-bar' + barClass2 + '" style="' + barStyle2 + '">';
    if (isCurrent2) {
      var nextPivot2 = (i2 + 1 < graph.phases.length) ? graph.phases[i2 + 1].from : 99;
      var yearsLeft2 = nextPivot2 - graph.currentAge;
      html += '<span class="lg-marker">▼ ' + graph.currentAge + ' ปี</span>';
    }
    html += '</div>';
  }
  html += '</div>';

  // Age labels below
  html += '<div class="lg-ages">';
  for (var j = 0; j < graph.phases.length; j++) {
    html += '<span>' + graph.phases[j].from + '</span>';
  }
  html += '<span>' + (graph.phases[graph.phases.length-1].to || 99) + '</span>';
  html += '</div>';

  // Current phase card
  var cp = graph.phases[graph.currentPhase];
  var nextPivotForDisplay = (graph.currentPhase + 1 < graph.phases.length) ? graph.phases[graph.currentPhase + 1].from : 99;
  var yearsToNext = nextPivotForDisplay - graph.currentAge;
  html += '<div class="lg-current">'
    + '<div class="lg-current-badge" style="background:' + cp.color + '">● ' + cp.label + ' · ' + cp.from + '–' + cp.to + ' ปี</div>'
    + '<div class="lg-current-age">ตอนนี้ ' + graph.currentAge + ' ปี → จุดเปลี่ยนถัดไปที่ ' + nextPivotForDisplay + ' ปี (อีก ' + yearsToNext + ' ปี)</div>'
    + '<div class="lg-insight">' + graph.insight + '</div>'
    + '</div>';

  // Element guide (1 line)
  html += '<div class="lg-element-tip">'
    + '<span style="color:' + graph.planetColor + '">✦</span> '
    + 'พลังธาตุ' + graph.element + 'ช่วงนี้: ' + getElementPhaseTip(graph.element, graph.currentPhase)
    + '</div>';

  html += '</div>';
  return html;
}

function getElementPhaseTip(element, phase) {
  var tips = {
    'ไฟ': ['เริ่มต้นด้วยความกล้า — แต่อย่าลืมตั้งหลักก่อนกระโดด', 'ไฟแรงไปถูกทาง — เลือกโฟกัสหนึ่งเรื่องแล้วลุย', 'เปลวไฟต้องพัก — ถอยก่อนเพื่อก้าวไกลกว่า'],
    'ดิน': ['ค่อยเป็นค่อยไป — ทีละก้อนสร้างฐานให้แข็งแรง', 'รากฐานเริ่มมั่น — ถึงเวลาขยายผลอย่างมั่นคง', 'เก็บเกี่ยวผลจากความอดทน — สิ่งที่ผ่านมาทั้งหมดกำลังออกดอก'],
    'ลม': ['เปิดรับทุกทิศทาง — แต่อย่ากระจัดกระจาย', 'จับทิศทางได้แล้ว — โฟกัสลมให้เป็นพลังเดียว', 'ใช้สายลมที่สะสม — พัดพาสิ่งที่สร้างไว้ให้กว้างไกล'],
    'น้ำ': ['เรียนรู้ที่จะไหล — อย่าฝืนธรรมชาติของตัวเอง', 'น้ำขึ้น — พลังอารมณ์และเหตุผลกำลังสมดุล', 'น้ำลึก — ความเข้าใจที่สะสมมาจะนำทางคุณ']
  };
  var elTips = tips[element] || tips['ดิน'];
  var idx = phase >= 3 ? 2 : (phase >= 2 ? 1 : 0);
  return elTips[idx];
}

// ===== OLD LIFE BANDS (เก็บไว้ให้ buildLifeTimeline ยังทำงานได้) =====
var LIFE_BANDS = [
  {from:0,to:7,key:'root',title:'รากฐานความปลอดภัย',life:'วัยนี้ชีวิตผูกกับบ้าน ความอบอุ่น และการอ่านอารมณ์ของคนรอบตัว',survive:'ผ่านมาได้ด้วยการสังเกต เรียนรู้จากผู้ใหญ่ และหาจุดที่ตัวเองรู้สึกปลอดภัย',unlock:'ถ้ายังไม่ค่อยมั่นคงทางใจ ให้ฝึกบอกความต้องการของตัวเองและสร้างพื้นที่สงบ',prep:'ฝึกพักใจ ไม่แบกอารมณ์คนอื่น และเชื่อว่าคุณสมควรได้รับความรักแบบปลอดภัย'},
  {from:8,to:14,key:'learn',title:'เริ่มรู้จักตัวเอง',life:'เริ่มเปรียบเทียบตัวเองกับคนอื่น และเริ่มถามว่า “ฉันเป็นใคร”',survive:'ผ่านมาได้ด้วยการเรียนรู้เร็ว มีครู เพื่อน หรือหนังสือเป็นตัวช่วย',unlock:'ถ้ายังไม่มั่นใจในคุณค่า ให้ลดการเปรียบเทียบและจดสิ่งที่ทำได้จริง',prep:'ฝึกพื้นฐานวินัยและทักษะที่ใช้ได้จริง เพื่อให้ความมั่นใจมาจากผลงาน'},
  {from:15,to:21,key:'identity',title:'ทดสอบตัวตน',life:'วัยนี้เต็มไปด้วยการทดลองเส้นทาง ความรักแรก และแรงกดดันเรื่องอนาคต',survive:'ผ่านมาได้ด้วยความกล้าเริ่มใหม่และยอมรับว่าตัวเองยังไม่ต้องรู้ทุกอย่าง',unlock:'ถ้ายังติดความกลัวผิด ให้ฝึกตัดสินใจจากข้อมูลจริงมากกว่าความรู้สึกชั่ววูบ',prep:'หาความถนัดให้เจอจากการลองหลายแบบ แล้วเริ่มเลือกทางที่ใช่'},
  {from:22,to:28,key:'launch',title:'ตั้งหลักชีวิต',life:'เป็นช่วงตั้งหลักเรื่องงาน เงิน และสถานะในชีวิต',survive:'ผ่านมาได้ด้วยการลงมือทำให้เป็นรูปธรรม และหาคนช่วยงานที่ไว้ใจได้',unlock:'ถ้ายังสวิงง่าย ให้ฝึกวางแผนและจัดลำดับความสำคัญ',prep:'เตรียมรับความรับผิดชอบที่ใหญ่ขึ้น ทั้งหน้าที่การงานและความสัมพันธ์จริงจัง'},
  {from:29,to:35,key:'build',title:'สร้างฐานมั่นคง',life:'เป็นช่วงสร้างฐานให้แน่น งาน เงิน บ้าน และขอบเขตชีวิตเริ่มชัด',survive:'ผ่านมาได้ด้วยความสม่ำเสมอและความอดทนต่อแรงกดดัน',unlock:'ถ้ายังเหนื่อยกับการแบกทุกอย่าง ให้ฝึกขอความช่วยเหลือและแบ่งงาน',prep:'เตรียมเจอการตัดสินใจใหญ่เกี่ยวกับทรัพย์สิน ครอบครัว และทิศทางชีวิต'},
  {from:36,to:42,key:'lead',title:'รับบทผู้นำ',life:'ชีวิตเริ่มให้คุณรับบทผู้นำ ดูแลคนอื่น และตัดสินใจแทนหลายอย่าง',survive:'ผ่านมาได้ด้วยการยอมเป็นเจ้าของผลลัพธ์ ไม่หนีปัญหา',unlock:'ถ้ายังเผลอใช้แต่พลังตัวเอง ให้ฝึกไว้ใจคนอื่นและมอบหมายงาน',prep:'เตรียมรับบทที่ต้องมีวุฒิภาวะสูงขึ้น ทั้งในงานและบ้าน'},
  {from:43,to:50,key:'expand',title:'ขยายอิทธิพล',life:'เป็นช่วงขยายอิทธิพล ผลงาน และฐานะ ให้สิ่งที่ทำเริ่มออกผลกว้าง',survive:'ผ่านมาได้ด้วยการมองภาพใหญ่และเลือกสิ่งที่คุ้มค่าจริงๆ',unlock:'ถ้ายังไหลไปตามแรงกระเพื่อมภายนอก ให้ฝึกโฟกัสเรื่องหลักเพียงไม่กี่เรื่อง',prep:'เตรียมเจอความรับผิดชอบที่มากขึ้น พร้อมโอกาสเลื่อนขั้นหรือขยายกิจการ'},
  {from:51,to:60,key:'mentor',title:'ส่งต่อประสบการณ์',life:'ช่วงนี้คุณเริ่มเป็นคนส่งต่อประสบการณ์มากกว่าไล่ล่าพิสูจน์ตัวเอง',survive:'ผ่านมาได้ด้วยความนิ่ง ความเชื่อมั่น และการแบ่งปันความรู้',unlock:'ถ้ายังไม่ยอมปล่อยมือ ให้ฝึกเป็นโค้ชแทนการคุมทุกอย่าง',prep:'เตรียมวางระบบให้สิ่งที่สร้างไว้ทำงานต่อได้เอง'},
  {from:61,to:120,key:'legacy',title:'วางมรดกชีวิต',life:'ช่วงชีวิตเน้นคุณภาพใจ ความสงบ และการส่งต่อสิ่งสำคัญ',survive:'ผ่านมาได้ด้วยการยอมรับสิ่งที่เปลี่ยนไม่ได้ และรักษาสิ่งที่มีคุณค่า',unlock:'ถ้ายังยึดติดกับบทเดิม ให้ฝึกปล่อยวางและใช้ชีวิตให้เบาขึ้น',prep:'เตรียมจัดการมรดกชีวิต ทั้งความรู้ ทรัพย์สิน และเรื่องที่อยากส่งต่อ'}
];

var LIFE_ELEMENT_GUIDE = {
  'ไฟ': {root:'รอดด้วยความกล้า แต่ต้องฝึกหยุดก่อนตัดสินใจ', learn:'อย่าปล่อยให้ไฟในหัวเผาใจตัวเอง', identity:'ใช้พลังเริ่มต้นสิ่งใหม่อย่างมีสติ', launch:'วางแผนก่อนพุ่ง', build:'คุมอีโก้และแบ่งหน้าที่ให้เป็น', lead:'ใช้บารมีสร้างทีม ไม่ใช่คุมทุกอย่าง', expand:'พลังของคุณจะพาไปไกลเมื่อโฟกัสเป็น', mentor:'ส่งต่อไฟให้คนอื่นโดยไม่เผาตัวเอง', legacy:'ปล่อยให้แสงของคุณเป็นแรงบันดาลใจ'},
  'ดิน': {root:'รอดด้วยความอดทนและการมีฐานที่มั่นคง', learn:'เชื่อในผลงานเล็กๆ ที่ทำซ้ำได้', identity:'ยอมให้ชีวิตไม่ต้องเป๊ะเสมอ', launch:'สร้างระบบก่อนค่อยขยาย', build:'ความมั่นคงมาเมื่อคุณยืดหยุ่น', lead:'เป็นเสาหลัก แต่ไม่ต้องแบกคนเดียว', expand:'เลือกทางที่คุ้มค่าจริงๆ', mentor:'สอนคนอื่นด้วยวิธีที่ทำได้จริง', legacy:'เก็บรักษาคุณค่าที่สร้างไว้ให้ดี'},
  'ลม': {root:'รอดด้วยไหวพริบและการสื่อสาร', learn:'หาคำตอบจากการเรียนรู้และลงมือเขียนลงแผน', identity:'ลองหลายทางได้ แต่ต้องฟังเสียงตัวเอง', launch:'ปิดจบสิ่งสำคัญให้เป็น', build:'โฟกัสลึกกว่าเดิม แล้วผลจะมา', lead:'ใช้คำพูดสร้างแรงบันดาลใจ', expand:'ความคิดจะกลายเป็นเงินเมื่อคุณเลือกเรื่องหลัก', mentor:'ส่งต่อความรู้แบบเป็นระบบ', legacy:'ทิ้งระบบความคิดที่ชัดเจนไว้ให้คนรุ่นหลัง'},
  'น้ำ': {root:'รอดด้วยความรู้สึกไวและการอ่านบรรยากาศ', learn:'ฟังหัวใจตัวเองก่อนจะฟังคนอื่นมากเกินไป', identity:'อย่าให้ความกลัวถูกปฏิเสธคุมชีวิต', launch:'ตั้งขอบเขตเวลาทำงานและความสัมพันธ์', build:'แยกอารมณ์ออกจากภาระ', lead:'เป็นผู้นำที่ปลอดภัย ไม่ใช่ผู้แบกรับทุกอย่าง', expand:'ความเมตตาเป็นพลัง เมื่อคุณไม่ทิ้งตัวเอง', mentor:'สอนคนอื่นเรื่องการดูแลใจ', legacy:'ทิ้งความอบอุ่นและความเข้าใจไว้เป็นมรดก'}
};

function fmtAgeRange(b){
  return b.to >= 120 ? (b.from + ' ปีขึ้นไป') : (b.from + '–' + b.to + ' ปี');
}

function getLifeBandIndex(ageY){
  for (var i = 0; i < LIFE_BANDS.length; i++) {
    if (ageY >= LIFE_BANDS[i].from && ageY <= LIFE_BANDS[i].to) return i;
  }
  return LIFE_BANDS.length - 1;
}

function buildLifeTimeline(kind, p, ageY, ageM){
  var idx = getLifeBandIndex(ageY);
  var bands;
  var heading;
  var lead;

  if (kind === 'past') {
    bands = LIFE_BANDS.slice(Math.max(0, idx - 2), idx);
    if (!bands.length) bands = [LIFE_BANDS[0]];
    heading = 'อดีต · สิ่งที่หล่อหลอมคุณ';
    lead = 'ช่วงวัยก่อนหน้าที่อธิบายว่าคุณผ่านชีวิตมาได้อย่างไร และอะไรกลายเป็นรากนิสัยในวันนี้';
  } else if (kind === 'present') {
    bands = [LIFE_BANDS[idx]];
    heading = 'ปัจจุบัน · สิ่งที่ชีวิตกำลังทดสอบ';
    lead = 'ช่วงวัยที่กำลังบอกว่าตอนนี้ชีวิตต้องการให้คุณปรับอะไร เพื่อไม่ให้วนกลับไปเจอปัญหาเดิม';
  } else {
    bands = LIFE_BANDS.slice(idx + 1, idx + 3);
    if (!bands.length) bands = [LIFE_BANDS[LIFE_BANDS.length - 1]];
    heading = 'อนาคต · สิ่งที่ควรเตรียมรับมือ';
    lead = 'ช่วงวัยถัดไปที่กำลังรอคุณอยู่ พร้อมสิ่งที่ควรฝึกไว้ล่วงหน้าเพื่อให้รับมือได้มั่นคงกว่าเดิม';
  }

  var elGuide = LIFE_ELEMENT_GUIDE[p.el] || LIFE_ELEMENT_GUIDE['ไฟ'];
  var html = '<div style="font-size:14px; line-height:1.9; color:var(--tx); margin-bottom:12px;">'
    + '<strong class="hl-gold">✦ ' + heading + ' ✦</strong><br>' + lead + '<br>'
    + '<span style="color:var(--tx2); font-size:12px;">อายุปัจจุบัน: ' + ageY + ' ปี ' + ageM + ' เดือน · ธาตุ' + p.el + '</span>'
    + '</div>';

  bands.forEach(function(b){
    html += '<div style="margin-bottom:14px; padding:14px 15px; border-radius:14px; border:1px solid rgba(201,162,39,.16); border-left:4px solid ' + p.c + '; background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));">'
      + '<div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px;">'
      + '<div style="font-size:12px; letter-spacing:.08em; color:#C9A227; font-weight:700;">' + fmtAgeRange(b) + '</div>'
      + '<div style="font-size:13px; color:#fff; font-weight:700;">' + b.title + '</div>'
      + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx); margin-bottom:8px;"><strong class="hl-gold">ชีวิตช่วงนี้:</strong> ' + b.life + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx); margin-bottom:8px;"><strong class="hl-gold">ผ่านมาได้ด้วย:</strong> ' + b.survive + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx); margin-bottom:8px;"><strong class="hl-gold">ถ้ายังไม่ปลดล็อก:</strong> ' + b.unlock + '</div>'
      + '<div style="font-size:13px; line-height:1.85; color:var(--tx);"><strong class="hl-gold">เตรียมตัว:</strong> ' + b.prep + '</div>'
      + '<div style="margin-top:10px; padding:10px 12px; border-radius:10px; background:rgba(0,0,0,.18); color:var(--tx2); font-size:12px; line-height:1.7;"><strong style="color:#C9A227;">กุญแจของธาตุ' + p.el + ':</strong> ' + elGuide[b.key] + '</div>'
      + '</div>';
  });

  return html;
}

var __collapsibleIdCounter = 0;
// ===== Easy summary (สรุปเข้าใจง่าย vs แบบละเอียด) — 11 ต.ค.69 =====
// การ์ดสั้น 3 ข้อสำหรับผู้สูงอายุ + ปุ่มฟังเสียง ไม่แตะ logic เดิม
function buildEasySummary(briefData, topDomains){
  var esc = (typeof escapeHTML === 'function') ? escapeHTML : function(s){ return String(s == null ? '' : s); };
  var topLine = '';
  if (topDomains && topDomains.length) {
    var names = topDomains.slice(0, 2).map(function(d){ return d.label + ' ' + d.score + '/100'; }).join(' · ');
    topLine = '<li><span class="easy-ico">🌟</span><span><strong>ช่วงนี้เด่นเรื่อง:</strong> ' + esc(names) + '</span></li>';
  }
  var html = '<div class="easy-summary" id="easy-summary">'
    + '<span class="easy-kicker">✦ สรุปเข้าใจง่ายใน 30 วินาที ✦</span>'
    + '<div class="easy-title">วันนี้ควรทำอะไร สรุปสั้นๆ</div>'
    + '<ul class="easy-list">'
    + '<li><span class="easy-ico">🎯</span><span><strong>ควรทำ:</strong> ' + esc(briefData.focus) + '</span></li>'
    + '<li><span class="easy-ico">⚠️</span><span><strong>ระวัง:</strong> ' + esc(briefData.warning) + '</span></li>'
    + '<li><span class="easy-ico">🙏</span><span><strong>ทำเลย:</strong> ' + esc(briefData.action) + '</span></li>'
    + topLine
    + '</ul>'
    + '<div class="easy-btn-row">'
    + '<button class="easy-btn ghost" data-action="easy-details">📖 อ่านแบบละเอียด</button>'
    + '<button class="easy-btn" data-action="easy-speak">🔊 ฟังเสียงสรุป</button>'
    + '</div>'
    + '</div>';
  return html;
}

function speakEasySummary(){
  try {
    var el = document.getElementById('easy-summary');
    var text = el ? el.innerText.replace(/📖.*$/s, '').trim() : 'สรุปดวงวันนี้';
    var synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'th-TH';
    utter.rate = 0.9;
    synth.speak(utter);
  } catch (e) {}
}

if (typeof document !== 'undefined' && document.addEventListener) {
document.addEventListener('click', function(ev){
  var btn = ev.target && ev.target.closest ? ev.target.closest('[data-action="easy-details"],[data-action="easy-speak"]') : null;
  if (!btn) return;
  if (btn.getAttribute('data-action') === 'easy-speak') { speakEasySummary(); return; }
  var first = document.querySelector('.collapsible-section .section-toggle');
  if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
}

function wrapCollapsible(label, hint, content, startCollapsed) {
  var collapsedClass = startCollapsed ? ' collapsed' : '';
  var sectionId = 'colsec-' + (++__collapsibleIdCounter);
  var bodyId = sectionId + '-body';
  var ariaExpanded = startCollapsed ? 'false' : 'true';
  return '<div class="collapsible-section' + collapsedClass + '" id="' + sectionId + '">'
    + '<div class="section-toggle" role="button" tabindex="0" aria-expanded="' + ariaExpanded + '" aria-controls="' + bodyId + '">'
    + '<span class="section-toggle-arrow" aria-hidden="true">▼</span>'
    + '<div class="section-toggle-main">'
    + '<span class="section-toggle-label">' + label + '</span>'
    + '<span class="section-toggle-hint">' + hint + '</span>'
    + '</div>'
    + '<span class="section-toggle-cta" aria-hidden="true">ดูเพิ่มเติม →</span>'
    + '</div>'
    + '<div class="section-body" id="' + bodyId + '">' + content + '</div>'
    + '</div>';
}

// ===== ARIA LIVE ANNOUNCER =====
// Announce a message to screen readers via the polite live region.
function announce(message) {
  var announcer = document.getElementById('aria-live-announcer');
  if (announcer) {
    // Clear and set to ensure screen readers pick up changes
    announcer.textContent = '';
    setTimeout(function() { announcer.textContent = message; }, 50);
  }
}
window.announce = announce;

function renderInd(nm,gd,ds,ts,p,r,l,ri,li,u, birthDay, birthMonth, birthYearBE){
  // Fallback for tests that don't pass birth data
  if (birthDay === undefined) {
    var _bday = new Date(ds);
    birthDay = _bday.getDate();
    birthMonth = _bday.getMonth() + 1;
    birthYearBE = _bday.getFullYear() + 543;
  }
  var wrap=document.getElementById('r0');
  if (document.body && document.body.classList) document.body.classList.add('has-report');
  nm = escapeHTML(nm);
  gd = escapeHTML(gd);
  ts = escapeHTML(ts);
  var td=escapeHTML(fmtDate(ds));
  var tDisp = ts ? (escapeHTML(u.ti)+' '+ts+escapeHTML(u.tu)) : '';
  var dayOfWeek = new Date(ds).getDay();

  // คำนวณอายุ (ปี และ เดือน)
  var today = new Date();
  var bday = new Date(ds);
  var ageY = today.getFullYear() - bday.getFullYear();
  var ageM = today.getMonth() - bday.getMonth();
  if (ageM < 0 || (ageM === 0 && today.getDate() < bday.getDate())) { ageY--; ageM += 12; }
  if (today.getDate() < bday.getDate()) { ageM--; if (ageM < 0) ageM = 11; }
  var ageTxt = (CL === 'th') ? ('อายุ ' + ageY + ' ปี ' + ageM + ' เดือน') : ('Age ' + ageY + ' yrs ' + ageM + ' mos');
  var premiumUnlocked = premiumIsUnlocked();


  // 1. ทักษาปกรณ์
  var THAKSA = [
    { sri: 'ทักษะการสื่อสาร การใช้สติปัญญา และการเจรจาต่อรอง (พลังของดาวพุธ)', kala: 'การรักความสบายจนเกินพอดี หรือการยึดติดในวัตถุ (พลังเงาของดาวศุกร์)' }, // 0
    { sri: 'ความอดทน การมีวินัย และการวางแผนระยะยาวที่รอบคอบ (พลังของดาวเสาร์)', kala: 'อีโก้ ความใจร้อน และการอยากเป็นศูนย์กลาง (พลังเงาของดาวอาทิตย์)' }, // 1
    { sri: 'สติปัญญา ความเมตตา และการมองการณ์ไกล (พลังของดาวพฤหัสบดี)', kala: 'ความอ่อนไหวทางอารมณ์ และการจมอยู่กับอดีต (พลังเงาของดาวจันทร์)' }, // 2
    { sri: 'การพลิกแพลงสถานการณ์ การคิดนอกกรอบ และความกล้าเสี่ยง (พลังของราหู)', kala: 'ความโกรธที่ควบคุมไม่ได้ และการใช้อารมณ์ตัดสินปัญหา (พลังเงาของดาวอังคาร)' }, // 3
    { sri: 'ศิลปะ การสร้างความสัมพันธ์ และรสนิยมที่โดดเด่น (พลังของดาวศุกร์)', kala: 'ความวิตกกังวล การมองโลกในแง่ร้าย และการกดดันตัวเอง (พลังเงาของดาวเสาร์)' }, // 4
    { sri: 'สัญชาตญาณ ความเห็นอกเห็นใจ และการดูแลผู้อื่น (พลังของดาวจันทร์)', kala: 'ความลุ่มหลง ความเชื่อที่ผิด หรือการหลอกตัวเอง (พลังเงาของราหู)' }, // 5
    { sri: 'ความมุ่งมั่น พลังงานที่ล้นเหลือ และการกล้าลงมือทำ (พลังของดาวอังคาร)', kala: 'คำพูดที่ทำร้ายผู้อื่นโดยไม่ตั้งใจ และการคิดไวทำไวเกินไป (พลังเงาของดาวพุธ)' } // 6
  ];
  var tk = THAKSA[dayOfWeek];
  var thaksaHtml = '<strong class="hl-gold">✦ พรสวรรค์หนุนดวง :</strong><br>'
    + 'จุดแข็งที่จะเป็นแม่เหล็กดึงดูดความสำเร็จและสิริมงคลเข้ามาในชีวิตคุณคือ <span class="hl-purple">' + tk.sri + '</span> ยิ่งคุณใช้สิ่งนี้มากเท่าไหร่ เส้นทางของคุณจะยิ่งราบรื่นขึ้น<br><br>'
    + '<strong class="hl-gold">✦ เงาในใจที่ต้องก้าวข้าม :</strong><br>'
    + 'อุปสรรคที่แท้จริงไม่ได้มาจากภายนอก แต่มาจาก <span class="hl-purple">' + tk.kala + '</span> หากคุณรู้เท่าทันและปรับสมดุลจุดนี้ได้ ชีวิตคุณจะก้าวกระโดดอย่างมหาศาล';

  // 2. พิมพ์เขียวปรับฐานชีวิต (Action Plan)
  var elementInsight = ''; var elementAction = '';
  if (p.ei === 0) {
    elementInsight = 'พลังแห่งไฟ <span style="font-size:14px">🔥</span> ทำให้คุณมีแรงขับเคลื่อนมหาศาล แต่มักเผาผลาญพลังงานไปกับความใจร้อน — โทสะคือไฟที่เผาทั้งตัวเองและคนรอบข้าง';
    elementAction = 'นั่งนิ่งกำหนดลมหายใจ <strong class="hl-gold">5 นาทีทุกเช้า</strong> <span style="font-size:14px">🧘</span> — การนั่งนิ่งช่วยดับไฟในใจ จักรวาลสอนว่า "ผู้ชนะที่แท้จริงคือผู้ชนะใจตัวเอง"';
  } else if (p.ei === 1) {
    elementInsight = 'พลังแห่งดิน <span style="font-size:14px">🌱</span> ทำให้คุณมั่นคงและรอบคอบ แต่ความกลัวความผิดพลาดมักทำให้ยึดติด — ทุกสิ่งในจักรวาลเปลี่ยนแปลงเสมอ แม้แต่ความกลัว';
    elementAction = 'เดินช้าๆ <strong class="hl-gold">10 นาที/วัน</strong> <span style="font-size:14px">🚶</span> — การเดินอย่างมีสติช่วยให้ดินยืดหยุ่นขึ้น รู้สึกเท้าแตะพื้น หายใจเข้า-ออก ปล่อยวางความคิด';
  } else if (p.ei === 2) {
    elementInsight = 'พลังแห่งลม <span style="font-size:14px">💨</span> ทำให้ความคิดแล่นไว แต่มักกระจัดกระจาย — จิตที่ไม่ตั้งมั่นเหมือนลมที่พัดไปเรื่อยไม่มีทิศทาง';
    elementAction = 'นั่งนิ่ง <strong class="hl-gold">3 นาที ดูลมหายใจ</strong> <span style="font-size:14px">🎯</span> — ไม่ต้องคิดอะไร แค่รู้ตัวว่าหายใจเข้า-ออก จิตฟุ้งก็แค่กลับมา ลมนิ่ง = จิตนิ่ง';
  } else {
    elementInsight = 'พลังแห่งน้ำ <span style="font-size:14px">🌊</span> ทำให้ลึกซึ้งและเข้าถึงจิตใจคน แต่ขอบเขตอารมณ์ที่พร่ามัวมักทำให้รับเอาความรู้สึกคนอื่นมาแบก — เริ่มรักตัวเองก่อน';
    elementAction = 'ส่งพลังงานดีให้ตัวเอง <strong class="hl-gold">3 นาทีก่อนนอน</strong> <span style="font-size:14px">💛</span> — หลับตา หายใจลึกๆ แล้วพูดกับตัวเองว่า "ฉันมีความสุข ฉันปลอดภัย" เติมน้ำในถังก่อนให้คนอื่น';
  }
  var wkFull = '<div style="font-size:14px; line-height:1.9; color:var(--tx); margin-bottom:15px;">'
    + 'สิ่งที่คุณมองว่าเป็นจุดอ่อน แท้จริงแล้วคือพลังงานแห่งดาว' + p.n + ' ที่ถูกใช้ผิดทิศทาง — <span class="hl-purple">' + tk.kala + '</span><br><br>'
    + elementInsight
    + '</div>'
    + '<div class="action-plan-card">'
    + '<div class="ap-title">✦ พิมพ์เขียวเพื่อปรับฐานชีวิต ✦</div>'
    + '<div style="text-align:center; font-size:11px; color:#7a6a9a; margin-bottom:20px; letter-spacing:0.05em;"></div>'
    + '<div class="ap-step"><div class="ap-num">1</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">👁️</span> สติรับรู้</h4><p>เมื่อไหร่ก็ตามที่คุณเริ่มรู้สึกว่า <strong class="hl-purple">"' + tk.kala + '"</strong> กำลังก่อตัวขึ้น ให้ถือว่านั่นคือสัญญาณเตือน — หยุด 3 ลมหายใจ รับรู้ว่าความรู้สึกนี้ไม่เที่ยง ทุกอย่างในจักรวาลเปลี่ยนแปลงเสมอ อย่ากล่าวโทษตัวเอง</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">2</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">🧭</span> ลงมือปรับจูน </h4><p><span class="hl-gold">✧</span> ' + p.wkfix + '<br><br><span class="hl-gold">✧</span> กุญแจสำคัญของคนธาตุ' + p.el + 'คือ <strong>' + elementAction + '</strong> <span style="font-size:13px">⏳</span> เริ่มต้นทำสิ่งนี้ให้เป็นนิสัยใน 21 วันข้างหน้า</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">3</div><div class="ap-content"><h4><span style="font-size:15px; margin-right:4px;">🧘</span> เหตุเสริมจากพลังงานจักรวาล </h4><p>นั่งนิ่งกำหนดลมหายใจ <span class="hl-gold">3 นาที</span> ทุกวัน — การนั่งนิ่งช่วยสงบจิต เมื่อจิตสงบแล้ว พลังงานแห่ง <strong class="hl-gold">✨ ' + tk.sri + '</strong> จะถูกปลดล็อกเอง ผู้คน โอกาส และโชคลาภจะเข้ามาหาคุณอย่างเป็นธรรมชาติ</p></div></div>'
    + '<div class="ap-quote">"จุดอ่อนที่ถูกเยียวยา จะกลายเป็นจุดแข็งที่แข็งแกร่งที่สุดของคุณ <span style="font-style:normal">🤍</span>"</div>'
    + '</div>';

  // 7-day practice from ELEMENT_PRACTICES
  var ep = (typeof ELEMENT_PRACTICES !== 'undefined' && ELEMENT_PRACTICES[p.el]) ? ELEMENT_PRACTICES[p.el] : null;
  if (ep && ep.dailyPractices) {
    var practiceRows = ep.dailyPractices.map(function(d, i) {
      return '<div class="ep-day"><span class="ep-num">' + (i+1) + '</span><div><strong>' + escapeHTML(d.practice) + '</strong><br><span style="color:var(--tx2)">' + escapeHTML(d.focus) + '</span></div></div>';
    }).join('');
    wkFull += '<div class="ep-section"><div class="ep-title">✦ แบบฝึกหัด 7 วันสำหรับธาตุ' + p.el + ' ✦</div>' + practiceRows + '</div>';
  }

  // 3. พลังแห่งราศี
  var zi = (typeof ZODIAC_IDENTITIES !== 'undefined' && ZODIAC_IDENTITIES[r.n]) ? ZODIAC_IDENTITIES[r.n] : null;
  if (zi) {
    var replaceRows = (zi.replaceTable || []).map(function(t) {
      return '<tr><td>' + escapeHTML(t.old) + '</td><td>' + escapeHTML(t.new) + '</td></tr>';
    }).join('');
    var rasiHtml = '<div class="rasi-header">' + rasiIconHtml(ri, r.n, 36) + ' <strong class="hl-gold">✦ ' + zi.identity + ' — ' + r.n + '</strong></div>'
      + '<p style="margin:8px 0">' + escapeHTML(zi.description) + '</p>'
      + '<div class="zi-section"><strong class="hl-gold">จุดแข็ง:</strong> ' + escapeHTML(zi.strengths) + '</div>'
      + '<div class="zi-section"><strong class="hl-gold">จุดที่ควรปรับ:</strong> ' + escapeHTML(zi.growthEdge) + '</div>'
      + (replaceRows ? '<table class="zi-table"><thead><tr><th>พฤติกรรมเดิม</th><th>ลองปรับ</th></tr></thead><tbody>' + replaceRows + '</tbody></table>' : '')
      + '<blockquote class="zi-wisdom">' + escapeHTML(zi.wisdom) + '</blockquote>'
      + '<div class="zi-action"><strong class="hl-gold">สิ่งที่ควรทำวันนี้:</strong> ' + escapeHTML(zi.dailyAction) + '</div>';
  } else {
    // fallback to old brief version
    var rasiHtml = '<div class="rasi-header">' + rasiIconHtml(ri, r.n, 36) + ' <strong class="hl-gold">✦ พลังแห่งราศี' + r.n + ' :</strong></div>'
      + 'จักรราศีมอบ <span class="hl-purple">"' + (r.trait || 'พลังประจำตัว') + '"</span> ให้เป็นอาวุธประจำตัวของคุณ...'
      + '<span style="font-size:12px; color:var(--tx2);">' + (r.add || '') + '</span>';
  }

  // 4. พลังงานเสริมดวง (Standalone Card)
  var POWER_ELEMENTS = [
    { num: '1·4·5', c1: '#4CAF50', c1n: 'เขียว', c2: '#9C27B0', c2n: 'ม่วง' }, // 0
    { num: '2·4·6', c1: '#9C27B0', c1n: 'ม่วง', c2: '#FF9800', c2n: 'ส้ม' }, // 1
    { num: '3·5·8', c1: '#FF9800', c1n: 'ส้ม', c2: '#424242', c2n: 'ดำ/เทา' }, // 2
    { num: '2·4·5', c1: '#424242', c1n: 'ดำ/เทา', c2: '#2196F3', c2n: 'ฟ้า' }, // 3
    { num: '1·5·9', c1: '#F44336', c1n: 'แดง', c2: '#FFFFFF', c2n: 'ขาว' }, // 4
    { num: '2·3·6', c1: '#E91E63', c1n: 'ชมพู', c2: '#4CAF50', c2n: 'เขียว' }, // 5
    { num: '3·7·8', c1: '#2196F3', c1n: 'ฟ้า', c2: '#F44336', c2n: 'แดง' }  // 6
  ];
  var pe = POWER_ELEMENTS[dayOfWeek];
  var powerTip = premiumUnlocked
    ? '<div class="pc-desc"><span class="hl-gold">เคล็ดลับ:</span> ใช้เลข <strong>' + pe.num + '</strong> ต่อท้ายชื่อไลน์/รหัสผ่าน และใช้สี <strong>' + pe.c1n + '/' + pe.c2n + '</strong> เป็นภาพพื้นหลังมือถือในวันสำคัญ เพื่อปรับคลื่นพลังงานดึงดูดความสำเร็จ</div>'
    : '<div class="pc-desc"><span class="hl-gold">ฟรี:</span> เลขและสีมงคลสำหรับแชร์หรือใช้เป็นแรงบันดาลใจประจำวัน · ปลดล็อกพรีเมียม เพื่อดูวิธีใช้เชิงลึก</div>';
  var powerCardHtml = '<div class="power-card">'
    + '<div class="pc-header"><span style="font-size:16px;">✨</span> พลังงานเสริมดวง</div>'
    + '<div class="pc-grid">'
    + '<div class="pc-item"><div class="pc-title">🔢 เลขขับเคลื่อนชีวิต</div><div class="pc-value">' + (premiumUnlocked ? pe.num : '●-●-●') + '</div></div>'
    + '<div class="pc-item"><div class="pc-title">🎨 สีเสริมออร่า</div>'
    + '<div class="pc-colors">'
    + (premiumUnlocked
      ? '<div class="pc-color-wrap"><div class="pc-color-dot" style="background:' + pe.c1 + ';"></div><div class="pc-color-name">' + pe.c1n + '</div></div>'
        + '<div class="pc-color-wrap"><div class="pc-color-dot" style="background:' + pe.c2 + ';"></div><div class="pc-color-name">' + pe.c2n + '</div></div>'
      : '<div style="text-align:center;font-size:12px;color:#7a6a9a;padding:4px 0;">🔒 ปลดล็อกเพื่อดูสีและเลขเสริมดวง</div>')
    + '</div></div>'
    + '</div>'
    + powerTip
    + '</div>' // ปิด power-card
    // ปุ่มเซฟรูปภาพถูกเอาออกตามคำขอผู้ใช้

  var karma = buildKarmaMirror(p, dayOfWeek);
  var karmaFull = '<div class="karma-card' + (premiumUnlocked ? '' : ' is-locked') + '">'
    + '<div class="karma-kicker">พิมพ์เขียวชีวิตไทย</div>'
    + '<div class="karma-title">✦ ' + escapeHTML(karma.title) + ' ✦</div>'
    + '<div class="karma-desc">' + escapeHTML(karma.intro) + '</div>'
    + '<div class="karma-grid">'
    + '<div class="karma-item"><strong>รูปแบบที่มักวนซ้ำ</strong><br>' + escapeHTML(karma.pattern) + '</div>'
    + '<div class="karma-item"><strong>บทเรียนของดาว</strong><br>' + escapeHTML(karma.lesson) + '</div>'
    + '<div class="karma-item"><strong>เงาจากวันเกิด</strong><br>' + escapeHTML(karma.weekdayShadow) + '</div>'
    + '<div class="karma-item"><strong>สิ่งที่ควรทำเดือนนี้</strong><br>' + escapeHTML(karma.action) + '</div>'
    + '</div>'
    + '<div class="karma-ritual"><span>พิธีเล็ก ๆ 7 วัน:</span> ' + escapeHTML(karma.ritual) + '</div>'
    + '</div>';
  var karmaHtml = karmaFull;
  if (!premiumUnlocked) {
    // แสดง teaser: ชื่อ + บทเรียน แต่ล็อกรายละเอียด
    karmaHtml = '<div class="karma-card">'
      + '<div class="karma-kicker">พิมพ์เขียวชีวิตไทย</div>'
      + '<div class="karma-title">✦ ' + escapeHTML(karma.title) + ' ✦</div>'
      + '<div class="karma-desc">' + escapeHTML(karma.intro) + '</div>'
      + buildTeaserReveal('✦ บทเรียนของดาว ✦', escapeHTML(karma.lesson))
      + buildWarningTeaser('คุณมีรูปแบบชีวิตที่วนซ้ำอยู่ — รูปแบบนี้เกิดจากอะไร และจะแก้ยังไง?')
      + buildConversionCta(
        '🪞 ดูกระจกกรรมของคุณ · ปลดล็อก 199 บาท',
        'รูปแบบที่วนซ้ำ + เงาจากวันเกิด + สิ่งที่ควรทำเดือนนี้ + พิธีเล็กๆ 7 วัน',
        'เข้าใจอดีต เปลี่ยนอนาคต — เริ่มจากวันนี้',
        'เปิดรูปแบบชีวิตที่วนซ้ำของฉัน'
      )
      + '</div>';
  }

  // ═══ Life Graph V2 — คำนวณก่อน ใช้ร่วมกับ Domain ═══
  var lifeGraph = buildPersonalLifeGraphV2(birthDay, birthMonth, birthYearBE, ageY, p);
  var lifeGraphHtml = buildLifeGraphHtmlV2(lifeGraph);

  // ═══ Life Domain Forecast V2 — เฉพาะบุคคล เชื่อม Life Graph ═══
  var domainMatrix = buildLifeDomainForecastV2(birthDay, birthMonth, birthYearBE, ageY, p, lifeGraph);
  var domainIntro = premiumUnlocked
    ? domainMatrix.intro
    : 'ด้านที่เด่นที่สุด 2 อันดับแรกแสดงให้ดูฟรี — ปลดล็อกเพื่อดูครบทั้ง 6 ด้าน';
  var domainHtml = '<div class="domain-matrix">'
    + '<div class="domain-kicker">วิเคราะห์เฉพาะบุคคล</div>'
    + '<div class="domain-title">✦ ' + escapeHTML(domainMatrix.title) + ' ✦</div>'
    + '<div class="domain-desc">' + escapeHTML(domainIntro) + '</div>'
    + '<div class="domain-element-tone">' + escapeHTML(domainMatrix.elementSummary) + '</div>'
    + '<div class="domain-current-chip">🎯 วัยปัจุบัน: ' + escapeHTML(domainMatrix.currentAgeRange) + '</div>';
  
  // เรียง domain ตาม score แล้วแสดงเฉพาะ top 2 สำหรับ free reader
  var sortedDomains = domainMatrix.domains.slice().sort(function(a, b){ return b.score - a.score; });
  var top2Keys = sortedDomains.slice(0, 2).map(function(d){ return d.key; });
  
  // === Top 2 domains: แสดงชัดเจน (นอก locked zone) ===
  domainHtml += '<div class="domain-grid">';
  domainMatrix.domains.forEach(function(domain){
    if (premiumUnlocked || top2Keys.indexOf(domain.key) >= 0) {
      domainHtml += buildDomainCardV2(domain, false);
    }
  });
  domainHtml += '</div>';
  
  // === ด้านอื่นๆ: อยู่ใน locked zone ===
  if (!premiumUnlocked) {
    domainHtml += '<div class="domain-locked-zone">';
    domainHtml += '<div class="domain-grid">';
    domainMatrix.domains.forEach(function(domain){
      if (top2Keys.indexOf(domain.key) < 0) {
        domainHtml += buildDomainCardV2(domain, true);
      }
    });
    domainHtml += '</div>';
    domainHtml += '</div>';
    
    // teaser + CTA
    var lowestDomain = domainMatrix.domains.reduce(function(min, d){ return d.score < min.score ? d : min; }, domainMatrix.domains[0]);
    domainHtml += buildTeaserReveal('✦ ด้านที่ต้องระวังที่สุด ✦',
      escapeHTML(lowestDomain.icon) + ' <span class="teaser-highlight">' + escapeHTML(lowestDomain.label) + '</span> จังหวะ' + escapeHTML(lowestDomain.level || 'ควรดูแล') + ' — "' + escapeHTML(lowestDomain.current) + '"')
    + buildWarningTeaser('คุณมีจุดอ่อนซ่อนอยู่ใน ' + escapeHTML(lowestDomain.label) + ' — รู้ก่อน แก้ก่อน')
    + buildConversionCta(
      '📖 ดูคัมภีร์แก้ดวง 6 ด้าน · ปลดล็อก 199 บาท',
      'โชค · การเงิน · สุขภาพ · ความรัก · การงาน · บริวาร — วิเคราะห์เฉพาะบุคคล',
      '94% บอกว่า "ตรงจนตกใจ"',
      'เปิดวิธีแก้ดวงเฉพาะตัวครบ 6 ด้าน'
    );
  }
  domainHtml += '</div></div>';
  var lifeGraphSectionHtml = '<div class="life-graph-section">' + lifeGraphHtml + '</div>';
  lifeGraphSectionHtml += '<div class="cross-section-link" onclick="document.querySelector(\'.collapsible-toggle[data-section=\\\'domain\\\'\\]\')?.click(); window.scrollTo({top: document.querySelector(\'.collapsible-toggle[data-section=\\\'domain\\\'\\]\')?.offsetTop - 60, behavior: "smooth"})">🎯 ดูวิธีแก้ดวง 6 ด้าน →</div>';

  var monthlyLifeMap = buildMonthlyLifeMap(p, r, l, ds);
  var monthlyLifeMapHtml = buildMonthlyLifeMapHtml(monthlyLifeMap, premiumUnlocked);
  var windfallLuckGuide = buildWindfallLuckGuide(p, ds, dayOfWeek);
  var windfallLuckHtml = buildWindfallLuckHtml(windfallLuckGuide, premiumUnlocked);

  var briefData = buildDailyBrief(p, dayOfWeek, { name: pe.c1n, hex: pe.c1 });
  // กำลังวันประจำตัว — compact identity card
  var elementColors = { 'ไฟ': '#E8534A', 'น้ำ': '#5B9BD5', 'ลม': '#B8A8D8', 'ดิน': '#A0A060' };
  var ec = elementColors[briefData.element] || 'var(--g)';
  var cosmicBriefHtml = '<div class="weekday-power-card">'
    // Header badge — day + deity + element
    + '<div class="wpc-badge-row">'
    + '<div class="wpc-badge wpc-badge-day"><span class="wpc-badge-label">วันเกิด</span><span class="wpc-badge-value">' + briefData.label + '</span></div>'
    + '<div class="wpc-badge wpc-badge-deity"><span class="wpc-badge-label">เทวดาประจำวัน</span><span class="wpc-badge-value">' + briefData.deity + '</span></div>'
    + '<div class="wpc-badge wpc-badge-element" style="border-color:' + ec + '"><span class="wpc-badge-label">ธาตุ</span><span class="wpc-badge-value" style="color:' + ec + '">' + briefData.element + '</span></div>'
    + '</div>'
    // Title
    + '<div class="wpc-title">✦ กำลังวันประจำตัว ✦</div>'
    // Energy line — prominent
    + '<div class="wpc-energy">⚡ ' + briefData.energy + '</div>'
    // Color hint
    + '<div class="wpc-color-hint">🎨 สีมงคล: <strong style="color:' + briefData.colorHex + '">' + briefData.colorName + '</strong></div>'
    // Three action items in a compact row
    + '<div class="wpc-actions">'
    + '<div class="wpc-action"><span class="wpc-action-icon">🎯</span><span class="wpc-action-label">โฟกัส</span><p>' + briefData.focus + '</p></div>'
    + '<div class="wpc-action"><span class="wpc-action-icon">⚠️</span><span class="wpc-action-label">ระวัง</span><p>' + briefData.warning + '</p></div>'
    + '<div class="wpc-action"><span class="wpc-action-icon">🙏</span><span class="wpc-action-label">ปฏิบัติ</span><p>' + briefData.action + '</p></div>'
    + '</div>'
  + '</div>';

  // 5. ประกอบร่างการแสดงผล (Info + Power Elements + Radar)
  // Blueprint Header Card
  var blueprintCardHtml = '<div class="blueprint-card">'
    + '<div class="bp-kicker">✦ พิมพ์เขียวชีวิตไทย ✦</div>'
    + '<div class="bp-hero">'
    + '<div class="bp-planet-main">'
    + '<span class="bp-planet-symbol" style="color:' + p.c + ';text-shadow:0 0 20px ' + p.c + '80">' + p.s + '</span>'
    + '<div><div class="bp-label">ดาวเจ้าชะตา</div><div class="bp-title">' + p.n + ' · ธาตุ' + p.el + '</div></div>'
    + '</div>'
    + '<div class="bp-age-meta"><span>เจ้าของดวง</span><strong>✦ ' + nm + ' ✦</strong><small>' + ageTxt + '</small></div>'
    + '</div>'
    + '<div class="bp-axis-grid">'
    + '<div class="bp-axis-card"><span class="bp-axis-label">ตัวตนภายนอก</span><div class="bp-axis-symbol rasi-symbol">' + rasiIconHtml(ri, r.n, 52) + '</div><strong style="color:' + r.c + '">' + r.n + '</strong><small>' + (r.trait || 'โทนบุคลิกและแรงขับหลัก') + '</small><p class="bp-axis-desc">' + (r.apply || '') + '</p></div>'
    + '<div class="bp-axis-card"><span class="bp-axis-label">วิธีที่โลกมองเห็น</span><div class="bp-axis-symbol rasi-symbol">' + rasiIconHtml(li, l.n, 52) + '</div><strong style="color:' + l.c + '">' + l.n + '</strong><small>' + (l.trait || 'ภาพแรกที่คนอื่นสัมผัสได้') + '</small>' + (ts ? '<p class="bp-axis-desc">' + (l.apply || '') + '</p>' : '<p class="bp-axis-hint">⚠️ ใส่เวลาเกิดเพื่อดูลัคนาที่แม่นยำ</p>') + '</div>'
    + '</div>'
    + '<div class="bp-summary">พิมพ์เขียวนี้สรุปแรงขับเดิมของคุณก่อนอ่านดวงรายเดือน — อายุเป็นเพียงบริบทเสริม ไม่ใช่ตัวตัดสินดวงทั้งหมด</div>'
    + '</div>';


  var detailTabsShellHtml = '<div class="detail-tabs-card">'
    + '<div class="tabs-w"><div class="tabs" id="tt0"></div></div><div id="ts0"></div>'
    + '</div>';

  var badgesHtml = '';
  if (typeof Gamification !== 'undefined') {
    var gState = Gamification.getState();
    var streak = Gamification.getStreak();
    if (gState.badges.length > 0 || streak > 0) {
      badgesHtml = '<div class="report-badges">'
        + '<div class="rb-title">🏆 ผลงานของคุณ</div>'
        + (streak > 0 ? Gamification.renderStreakBadge(streak) : '')
        + Gamification.renderBadges(gState.badges)
        + (gState.points > 0 ? Gamification.renderProgressBar(gState.points) : '')
        + '</div>';
    }
  }

  wrap.innerHTML = blueprintCardHtml
    + buildEasySummary(briefData, sortedDomains.slice(0, 2))
    + '<div class="streak-progress-anchor"></div>'
    + '<div class="streak-discount-anchor"></div>'
    + badgesHtml
    // ── LAYER 1: Identity + Quick Win (เปิดไว้ให้เห็นเลย) ──
    + wrapCollapsible("✦ กำลังวันประจำตัว ✦", "วันเกิด · เทวดา · ธาตุ · สีมงคล", cosmicBriefHtml)
    + wrapCollapsible("✨ เสริมดวงของคุณ", "สีมงคล · เลขมงคล · ของมงคล · ทิศมงคล", powerCardHtml + buildYearlyEnhancementHtml(dayOfWeek))
    // ── LAYER 2: Core Reading — 6 ด้านชีวิต (หัวใจของรายงาน) ──
    + wrapCollapsible("✦ คัมภีร์แก้ดวง 6 ด้าน ✦", "โชค · การเงิน · สุขภาพ · ความรัก · การงาน · บริวาร · วิเคราะห์เฉพาะบุคคล", domainHtml, true)
    // ── LAYER 3: Yearly Forecast — จังหวะดาวทั้งปี ──
    + wrapCollapsible("🌑 แนวโน้มชีวิตปีนี้ — ราหูเกตุ + จังหวะดาว", "ราหูย้าย · เกตุ · 5 ด้าน · วิธีรับมือ", buildRahuKetuHtml(dayOfWeek) + buildYearlyTransitHtml(dayOfWeek), true)
    // ── LAYER 4: Curiosity — ลาภลอย + หมอทัก ──
    + wrapCollapsible("✦ สูตรเปิดดวงลาภลอย ✦", "เลขเด็ด · หวย · ทิศ · คาถา สายมู", windfallLuckHtml, true)
    + '<div id="lottery-results-section" style="margin-bottom:14px;"></div>'
    + wrapCollapsible("🔮 หมอทักประจำเดือน", "5 ด้านชีวิต · สัญญาณเตือน · วิธีแก้", monthlyLifeMapHtml, true)
    // ── LAYER 5: Deep Dive — กราฟชีวิต ──
    + wrapCollapsible("📊 พิมพ์เขียวชีวิต — กราฟ + ช่วงชีวิต", "กราฟชีวิต · 7 ช่วงชีวิต · จุดเด่น · จุดอ่อน", lifeGraphSectionHtml + buildLifePeriodsHtml(dayOfWeek, ageY), true)
    // ── LAYER 6: Bonus Tools ──
    + wrapCollapsible("💘 ตารางความเข้ากันได้ของธาตุ", "4×4 matrix · ดูว่าธาตุไหนเข้ากัน", buildCoupleCompatibilityHtml(p.el), true)
    + wrapCollapsible("🪐 กำลังวันประจำเดือนเกิด", "จุดแข็ง · จุดอ่อน · ดาวกำกับ · คำแนะนำ", buildPlanetaryStrengthHtml(birthMonth), true)
    // ── LAYER 7: Detail / CTA ──
    + wrapCollapsible("📋 ตัวตน · ความสัมพันธ์ · การงาน · เงิน", "ดูจุดอ่อนที่ซ่อนอยู่ + วิธีแก้", detailTabsShellHtml, true);

  // ✨ Focus management: move keyboard focus to the report after it renders
  // (helps screen reader and keyboard users know the new content is ready)
  setTimeout(function() {
    if (!wrap) return;
    var firstHeading = wrap.querySelector('h1, h2, .blueprint-card');
    if (firstHeading) {
      if (!firstHeading.hasAttribute('tabindex')) {
        firstHeading.setAttribute('tabindex', '-1');
      }
      try { firstHeading.focus({ preventScroll: true }); } catch (e) { firstHeading.focus(); }
      announce('รายงานดวงชะตาของคุณพร้อมแล้ว');
    }
  }, 500);

  // 6. อ้างอิงและเนื้อหาใน Tabs
  var refDesc = {
    p_r_l: 'วิเคราะห์จาก <span class="hl-purple">ดาวเจ้าชะตา ('+p.n+')</span> ที่บอกแก่นแท้ ผสมผสานกับ <span class="hl-purple">ราศี ('+r.n+')</span> ที่บอกวิธีแสดงออก และ <span class="hl-purple">ลัคนา ('+l.n+')</span> ที่บอกตัวตนเบื้องลึก',
    thaksa: 'วิเคราะห์จาก <span class="hl-purple">หลักทักษาปกรณ์</span> ศาสตร์โบราณที่ถอดรหัสวันเกิด เพื่อหา "ศรี" (พลังงานที่เสริมมงคล) และ "กาลกิณี" (พลังงานเงาที่คอยฉุดรั้ง)',
    wk: 'วิเคราะห์จากมุมตั้งฉากและเรือนอริ/มรณะ ของ <span class="hl-purple">ดาว'+p.n+'</span> ซึ่งสะท้อนจุดเปราะบางที่ซ่อนอยู่ในจิตใต้สำนึก',
    lv: 'วิเคราะห์จากเรือนปัตนิ (คู่ครอง) ผสมผสานกับลักษณะธาตุ'+p.el+' ซึ่งควบคุมวิธีที่คุณมอบและรับความรัก',
    ca: 'วิเคราะห์จากเรือนกัมมะ (การงาน) ของ <span class="hl-purple">ดาว'+p.n+'</span> และ <span class="hl-purple">ลัคนา'+l.n+'</span> ซึ่งกำหนดพื้นที่ที่คุณจะเปล่งประกายได้ดีที่สุด',
    mn: 'วิเคราะห์จากเรือนกดุมภะ (การเงิน) และลักษณะการใช้ทรัพยากรของคนธาตุ'+p.el,
    past: 'วิเคราะห์จากไทม์ไลน์ช่วงอายุที่ผ่านมา เพื่อดูว่าช่วงไหนชีวิตสร้างนิสัยนี้ขึ้นมา และอะไรพาคุณรอดมาได้',
    pres: 'วิเคราะห์จากช่วงอายุปัจจุบัน เพื่ออ่านว่าชีวิตกำลังทดสอบอะไร และควรปรับอะไรทันที',
    fut: 'วิเคราะห์จากช่วงอายุถัดไปและแนวโน้มชีวิต เพื่อเตรียมตัวก่อนเหตุการณ์สำคัญจะเข้ามา'
  };

  var TB=[
    {lb:'ตัวตน', secs:[
      {t:u.s0[0], c:p.p, rf:refDesc.p_r_l},
      {t:'สไตล์การแสดงออก (ราศีเกิด)', c:rasiHtml, rf:'วิเคราะห์จากราศีเกิด ('+r.n+') ซึ่งเป็นรูปแบบพลังงานที่คุณใช้ขับเคลื่อนตัวเองบนโลกใบนี้'},
      {t:'รหัสผ่านชีวิต (ทักษาปกรณ์)', c:thaksaHtml, rf:refDesc.thaksa},
      {t:u.s0[1], c:p.str, rf:'วิเคราะห์จากพลังงานธาตุ'+p.el+' และลักษณะเด่นของดาว'+p.n},
      {t:u.s0[2], c:wkFull, rf:'วิเคราะห์จากมุมตั้งฉากและเรือนอริ/มรณะ ของ <span class="hl-purple">ดาว'+p.n+'</span> ซึ่งสะท้อนจุดเปราะบางที่ซ่อนอยู่ในจิตใต้สำนึก'}
    ]},
    {lb:'คู่สัมพันธ์', secs:[{t:'ความสัมพันธ์', c:p.lv, rf:refDesc.lv}]},
    {lb:'การงาน', secs:[{t:u.s0[4], c:p.ca, rf:refDesc.ca}]},
    {lb:'การเงิน', secs:[{t:u.s0[5], c:p.mn, rf:refDesc.mn}]}
  ];

  buildTabs('tt0','ts0','s0_',TB,p,u);

  // 7. กล่องนัดหมายส่วนตัว (ลิงก์ Inbox ของคุณ)
  var consultHtml = '<div class="private-consult-card">'
    + '<div class="pcc-subtitle">การอ่านส่วนตัวแบบเจาะลึก</div>'
    + '<div class="pcc-title">✦ ปลดล็อกดวงชะตาแบบเจาะลึก ✦</div>'
    + '<div class="pcc-desc">ผลทำนายที่คุณเพิ่งอ่านเป็นเพียงเศษเสี้ยวของจักรวาลในตัวคุณ หากคุณกำลังเผชิญทางแยกของชีวิต หรือต้องการคำแนะนำแบบเจาะลึกเพื่อก้าวข้ามอุปสรรค... ให้ดวงดาวและเราช่วยนำทาง</div>'
    + '<a href="https://m.me/61573341702581" target="_blank" class="pcc-btn">จองคิวปรึกษาส่วนตัว</a>'
    + '</div>';

  if (typeof initCollapsibleSections === 'function') initCollapsibleSections();
  // ✨ Scroll-triggered reveal — all report cards float up when scrolled into view
  (function(){
    var cards = wrap.querySelectorAll(':scope > .card, :scope > .mc, :scope > .blueprint-card, :scope > .detail-tabs-card, :scope > .collapsible-section, :scope > .life-graph-card');
    for(var ci = 0; ci < cards.length; ci++){
      cards[ci].classList.add('reveal');
      cards[ci].style.transitionDelay = (ci * 0.06) + 's';
    }
    // Re-observe new elements with IntersectionObserver
    if(typeof window._revealObserver !== 'undefined') {
      cards.forEach(function(el){ window._revealObserver.observe(el); });
    }
  })();
  // Load lottery results after report renders
  if (typeof loadLotteryResults === 'function') setTimeout(loadLotteryResults, 400);
  
  // Insert content AFTER the tabs section (not inside tabs)
  var tabsCard = document.querySelector('.detail-tabs-card');
  if (tabsCard) {
    tabsCard.insertAdjacentHTML('afterend',
      '<div class="mc"><div class="mc-l">✦ '+u.mn+' · '+nm+' ✦</div>'
      +'<div class="mc-t">"'+p.man+'"</div></div>'
      + '<div id="ind-share-section" class="ind-share-section"></div>'
      + consultHtml
      +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="0">'+u.r0+'</button></div>'
    );
  }

  // Render personalized share buttons
  if (typeof ShareViral !== 'undefined' && ShareViral.renderPersonalizedShare) {
    ShareViral.renderPersonalizedShare('ind-share-section', p.man, nm);
  }

  // Card Menu จิ้มการ์ดดูทีละหน้า (12 ต.ค.69)
  if (typeof CardMenu !== 'undefined' && CardMenu.build) CardMenu.build('r0');
}

// ===== NEW CONTENT RENDERERS (Phase 2) =====

function buildYearlyTransitHtml(dayOfWeek) {
  if (typeof YEARLY_TRANSIT === 'undefined') return '<p style="color:var(--tx2)">ข้อมูลอยู่ระหว่างโหลด</p>';
  var DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
  var dayName = DAY_NAMES[dayOfWeek] || 'อาทิตย์';
  var yt = YEARLY_TRANSIT[dayName];
  if (!yt) return '';
  var domains = [
    {key:'career',icon:'💼',label:'การงาน'},
    {key:'money',icon:'💰',label:'การเงิน'},
    {key:'love',icon:'💕',label:'ความรัก'},
    {key:'health',icon:'🏃',label:'สุขภาพ'},
    {key:'luck',icon:'🍀',label:'โชคลาภ'}
  ];
  var trendIcon = {'ขึ้น':'📈','ลง':'📉','คงที่':'➡️'};
  var html = '<div class="yt-card">';
  html += '<div class="yt-title">✦ แนวโน้มชีวิตปีนี้ — คนเกิดวัน' + dayName + ' ✦</div>';
  if (yt.highlight) html += '<div class="yt-highlight">' + escapeHTML(yt.highlight) + '</div>';
  domains.forEach(function(d) {
    var item = yt[d.key];
    if (!item) return;
    var trend = trendIcon[item.trend] || '➡️';
    html += '<div class="yt-domain">';
    html += '<div class="yt-domain-header"><span>' + d.icon + ' ' + d.label + '</span><span>' + trend + ' ' + escapeHTML(item.trend) + '</span></div>';
    html += '<div class="yt-detail">' + escapeHTML(item.detail) + '</div>';
    if (item.action) html += '<div class="yt-action"><strong>สิ่งที่ควรทำ:</strong> ' + escapeHTML(item.action) + '</div>';
    html += '</div>';
  });
  if (yt.advice) html += '<div class="yt-advice">✨ ' + escapeHTML(yt.advice) + '</div>';
  html += '</div>';
  return html;
}

function buildRahuKetuHtml(dayOfWeek) {
  if (typeof RAHU_KETU === 'undefined') return '';
  var DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
  var dayName = DAY_NAMES[dayOfWeek] || 'อาทิตย์';
  var rk = RAHU_KETU;
  var html = '<div class="rk-card">';

  // Intro
  if (rk.intro) html += '<div class="rk-intro">' + escapeHTML(rk.intro) + '</div>';

  // Current transit
  if (rk.currentTransit) {
    var ct = rk.currentTransit;
    html += '<div class="rk-section rk-current">';
    html += '<div class="rk-subtitle">🌐 ราหูปัจจุบัน ' + (ct.signEmoji||'') + ' ราศี' + escapeHTML(ct.sign||'') + '</div>';
    html += '<div class="rk-transit-period">⏱️ ' + escapeHTML(ct.period||'') + '</div>';
    html += '<div class="rk-transit-meaning">' + escapeHTML(ct.meaning||'') + '</div>';
    if (ct.affectedDays && ct.affectedDays.length) {
      html += '<div class="rk-transit-affected">⚠️ คนเกิดวัน<strong>' + ct.affectedDays.join('</strong>, <strong>') + '</strong> โดนหนัก</div>';
    }
    if (ct.advice) html += '<div class="rk-advice">💡 ' + escapeHTML(ct.advice) + '</div>';
    html += '</div>';
  }

  // Rahu by sign table
  if (rk.rahuBySign) {
    html += '<div class="rk-section">';
    html += '<div class="rk-subtitle">📊 ราหูอยู่ราศีไหน = คนเกิดวันไหนโดน</div>';
    html += '<table class="rk-table"><thead><tr><th>ราศี</th><th>โดนหนัก</th><th>เปลี่ยนเรื่อง</th></tr></thead><tbody>';
    var signs = ['เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
    signs.forEach(function(s) {
      var data = rk.rahuBySign[s];
      if (!data) return;
      var isCurrent = (rk.currentTransit && rk.currentTransit.sign === s);
      var rowCls = isCurrent ? 'rk-row-current' : '';
      html += '<tr class="' + rowCls + '"><td>' + (data.emoji||'') + ' ' + s + (isCurrent ? ' 🔵' : '') + '</td><td>' + escapeHTML(data.affected) + '</td><td>' + escapeHTML(data.topic) + '</td></tr>';
    });
    html += '</tbody></table></div>';
  }

  // Per-birth-day effects
  if (rk.rahu && rk.rahu[dayName]) {
    var rh = rk.rahu[dayName];
    html += '<div class="rk-section">';
    html += '<div class="rk-subtitle">🌑 ราหูกระทบคนเกิดวัน' + dayName + '</div>';
    html += '<div class="rk-impact"><strong>ผลกระทบ:</strong> ' + escapeHTML(rh.impact) + '</div>';
    html += '<div class="rk-change"><strong>สิ่งที่เปลี่ยน:</strong> ' + escapeHTML(rh.change) + '</div>';
    if (rh.advice) html += '<div class="rk-advice"><strong>💡 วิธีรับมือ:</strong> ' + escapeHTML(rh.advice) + '</div>';
    html += '</div>';
  }

  // Ketu section
  if (rk.ketu && rk.ketu[dayName]) {
    var kt = rk.ketu[dayName];
    html += '<div class="rk-section">';
    html += '<div class="rk-subtitle">🌗 เกตุ — จุดปล่อยวางสำหรับคนเกิดวัน' + dayName + '</div>';
    html += '<div class="rk-impact"><strong>ต้องปล่อย:</strong> ' + escapeHTML(kt.impact) + '</div>';
    html += '<div class="rk-change"><strong>สิ่งที่เปลี่ยน:</strong> ' + escapeHTML(kt.change) + '</div>';
    if (kt.advice) html += '<div class="rk-advice"><strong>💡 บทเรียน:</strong> ' + escapeHTML(kt.advice) + '</div>';
    html += '</div>';
  }

  // Coping strategies
  if (rk.coping && rk.coping.length) {
    html += '<div class="rk-section">';
    html += '<div class="rk-subtitle">🧭 วิธีรับมือเมื่อดาวย้าย</div>';
    rk.coping.forEach(function(c) {
      html += '<div class="rk-coping-item"><strong>' + escapeHTML(c.situation) + '</strong>: ' + escapeHTML(c.action) + '</div>';
    });
    html += '</div>';
  }

  // Wisdom
  if (rk.wisdom) html += '<div class="rk-wisdom"><blockquote>✨ ' + escapeHTML(rk.wisdom) + '</blockquote></div>';

  html += '</div>';
  return html;
}

function buildYearlyEnhancementHtml(dayOfWeek) {
  if (typeof YEARLY_ENHANCEMENT === 'undefined') return '';
  var DAY_NAMES = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
  var dayName = DAY_NAMES[dayOfWeek] || 'อาทิตย์';
  var ye = YEARLY_ENHANCEMENT[dayName];
  if (!ye) return '';

  var html = '<div class="ye-card">';

  // === ส่วนที่ 1: Header ===
  html += '<div class="ye-header">'
    + '<div class="ye-title">✦ วิธีเสริมดวงปีนี้ ✦</div>'
    + '<div class="ye-subtitle">คนเกิดวัน' + dayName + ' · ' + escapeHTML(ye.currentTransit || '') + '</div>'
    + '</div>';

  // === ส่วนที่ 2: คำอธิบายความหมาย ===
  html += '<div class="ye-etymology">'
    + '<div class="ye-etym-label">📚 "เสริมดวง" คืออะไร?</div>'
    + '<div class="ye-etym-body">'
    + '"เสริมดวง" ในโหราศาสตร์ไทยโบราณ <strong>ไม่ใช่การ "เปลี่ยนดวง"</strong> แต่คือการ <em>ปรับสมดุลพลังงาน</em> ให้สอดคล้องกับจังหวะดาวที่โคจรอยู่'
    + '<br><br>'
    + 'หลักการสำคัญ: <strong>ดวงบอกแนวโน้ม แต่การกระทำคือตัวเปลี่ยนผลลัพธ์</strong>'
    + ' — ปีนี้ดาวอะไรเด่น → เสริมทางนั้น · ปีนี้ดาวอะไรอ่อน → ระวังทางนั้น'
    + '<br><br>'
    + 'การเสริมดวงมี 4 วิธีหลัก: <strong>สีมงคล</strong> (ปรับพลังสี) · <strong>ของมงคล</strong> (เครื่องราง/วัตถุ) · <strong>ทิศมงคล</strong> (ทิศที่ดาวส่งผลดี) · <strong>การกระทำ</strong> (พฤติกรรมที่เสริมพลัง)'
    + '</div>'
    + '</div>';

  // === ส่วนที่ 3: รายละเอียด ===
  if (ye.items) {
    html += '<div class="ye-detail-card ye-detail-items">'
      + '<div class="ye-detail-icon">🎁</div>'
      + '<div class="ye-detail-content">'
      + '<div class="ye-detail-label">ของเสริมมงคล</div>'
      + '<div class="ye-detail-text">' + escapeHTML(ye.items) + '</div>'
      + '</div>'
      + '</div>';
  }

  if (ye.direction) {
    html += '<div class="ye-detail-card ye-detail-direction">'
      + '<div class="ye-detail-icon">🧭</div>'
      + '<div class="ye-detail-content">'
      + '<div class="ye-detail-label">ทิศมงคล</div>'
      + '<div class="ye-detail-text">' + escapeHTML(ye.direction) + '</div>'
      + '</div>'
      + '</div>';
  }

  // === ส่วนที่ 4: Transit ตามดาวปีนี้ ===
  if (ye.transit) {
    html += '<div class="ye-transit-section">'
      + '<div class="ye-transit-title">🌟 ดาวปีนี้ส่งผลอย่างไร?</div>';

    var planetColors = {
      'อาทิตย์': '#FF6B35', 'จันทร์': '#C0C0C0', 'อังคาร': '#E63946',
      'พุธ': '#2EC4B6', 'ราหู': '#7B2D8E', 'เสาร์': '#1D3557', 'พฤหัส': '#F4A261'
    };

    var transitKeys = Object.keys(ye.transit);
    for (var i = 0; i < transitKeys.length; i++) {
      var planet = transitKeys[i];
      var advice = ye.transit[planet];
      var pColor = planetColors[planet] || '#7B68EE';
      html += '<div class="ye-transit-item">'
        + '<div class="ye-transit-dot" style="background:' + pColor + '"></div>'
        + '<div class="ye-transit-planet" style="color:' + pColor + '">' + escapeHTML(planet) + '</div>'
        + '<div class="ye-transit-advice">' + escapeHTML(advice) + '</div>'
        + '</div>';
    }
    html += '</div>';
  }

  // === ส่วนที่ 5: เชื่อมกลับ ===
  html += '<div class="ye-connect">'
    + '<div class="ye-connect-icon">🔗</div>'
    + '<div class="ye-connect-text">'
    + '<strong>ดูเพิ่มเติม:</strong> '
    + '<span class="ye-link" onclick="document.querySelector(\'.collapsible-toggle[data-section=\\\'yearlyTransit\'\']\')?.click()">แนวโน้มชีวิตปีนี้</span> · '
    + '<span class="ye-link" onclick="document.querySelector(\'.collapsible-toggle[data-section=\\\'domain\'\']\')?.click()">คัมภีร์แก้ดวง 6 ด้าน</span> · '
    + '<span class="ye-link" onclick="document.querySelector(\'.collapsible-toggle[data-section=\\\'rahuketu\'\']\')?.click()">ราหูเกตุ</span>'
    + '</div>'
    + '</div>';

  html += '</div>';
  return html;
}

function buildPlanetaryStrengthHtml(birthMonth) {
  if (typeof PLANETARY_STRENGTH === 'undefined') return '';
  var MONTH_NAMES = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  if (!birthMonth || birthMonth < 1 || birthMonth > 12) return '';
  var monthName = MONTH_NAMES[birthMonth - 1];
  var ps = PLANETARY_STRENGTH[monthName];
  if (!ps) return '';

  var planetColors = {
    'อาทิตย์': '#FF6B35', 'จันทร์': '#C0C0C0', 'อังคาร': '#E63946',
    'พุธ': '#2EC4B6', 'ราหู': '#7B2D8E', 'เสาร์': '#1D3557', 'พฤหัส': '#F4A261',
    'ศุกร์': '#E8A0BF'
  };

  // แยกดาวหลายดวง (เช่น "เสาร์ + ราหู")
  var strengthPlanets = (ps.strength || '').split('+').map(function(s){ return s.trim(); });
  var weaknessPlanets = (ps.weakness || '').split('+').map(function(s){ return s.trim(); });

  var html = '<div class="ps-card">';

  // === ส่วนที่ 1: Header ===
  html += '<div class="ps-header">'
    + '<div class="ps-title">✦ กำลังวันประจำเดือนเกิด ✦</div>'
    + '<div class="ps-subtitle">' + escapeHTML(monthName) + ' · ' + escapeHTML(ps.dateRange || '') + ' · ราศี' + escapeHTML(ps.zodiac || '') + '</div>'
    + '</div>';

  // === ส่วนที่ 2: คำอธิบายความหมาย ===
  html += '<div class="ps-etymology">'
    + '<div class="ps-etym-label">📚 "กำลังวัน" คืออะไร?</div>'
    + '<div class="ps-etym-body">'
    + '"กำลังวัน" ในโหราศาสตร์ไทยโบราณ หมายถึง <strong>พลังของดาวพระเคราะห์ที่กำกับวันเกิด</strong> '
    + 'ซึ่งส่งผลต่ออุปนิสัย จุดแข็ง จุดอ่อน และวิธีใช้ชีวิต'
    + '<br><br>'
    + 'แต่ละเดือนเกิดมี <strong>ดาวเจ้าปาง</strong> (ดาวที่ทรงพลังที่สุด) '
    + 'และ <strong>ดาวอ่อน</strong> (ดาวที่ต้องระวัง) — '
    + 'รู้จุดแข็ง → ใช้เป็นอาวุธ · รู้จุดอ่อน → เตรียมรับมือ'
    + '<br><br>'
    + 'ดาวเจ้าปางไม่ใช่แค่ "นิสัย" แต่คือ <em>พลังงานหลักที่ขับเคลื่อนชีวิต</em> — '
    + 'ยิ่งเข้าใจ ยิ่งใช้ชีวิตได้ตรงจุด'
    + '</div>'
    + '</div>';

  // === ส่วนที่ 3: ดาวเจ้าปาง + ความเชี่ยวชาญ (แสดงเสมอ — UI แบบ C) ===
  // แสดงแค่สิ่งที่อ่านง่าย ส่วนตัวเลข (power) ซ่อนไว้ใน toggle ด้านล่าง
  var mainPlanet = strengthPlanets[0] || ps.planet || '';
  var mainPlanetColor = planetColors[mainPlanet] || '#7B68EE';
  html += '<div class="ps-expertise">'
    + '<div class="ps-expertise-row">'
    + '<span class="ps-expertise-label">🪐 ดาวเจ้าปาง</span>'
    + '<span class="ps-expertise-value" style="color:' + mainPlanetColor + '">' + escapeHTML(mainPlanet) + '</span>'
    + '</div>'
    + '<div class="ps-expertise-row">'
    + '<span class="ps-expertise-label">📖 ความเชี่ยวชาญ</span>'
    + '<span class="ps-expertise-value">' + escapeHTML(ps.expertise || ps.description || '—') + '</span>'
    + '</div>'
    + '</div>';

  // === ส่วนที่ 4: Toggle — ดูค่าพละ (ซ่อนไว้ก่อน คลิกดู) ===
  if (ps.power) {
    html += '<details class="ps-power-detail">'
      + '<summary class="ps-power-toggle">🔍 ดูค่าพละ ' + ps.power + '/21 ตามคัมภีร์ →</summary>'
      + '<div class="ps-power-bar">'
      + '<div class="ps-power-label">กำลังวัน (พละ)</div>'
      + '<div class="ps-power-value-wrap">'
      + '<div class="ps-power-number">' + ps.power + '</div>'
      + '<div class="ps-power-bar-track"><div class="ps-power-bar-fill" style="width:' + Math.round(ps.power/21*100) + '%"></div></div>'
      + '<div class="ps-power-max">/ 21</div>'
      + '</div>'
      + '<div class="ps-power-desc">ค่าพละของดาว' + escapeHTML(ps.planet) + ' ตามคัมภีร์โหราศาสตร์ไทยมาตรฐาน — '
      + 'ค่านี้ไม่ได้บอกว่า "ดวงดี/ไม่ดี" แต่บอกว่า<strong>ดาวนี้เด่นเรื่องอะไร</strong> '
      + '(คะแนนเยอะ = เด่นเฉพาะทาง, คะแนนน้อย = เรื่องอื่นมากกว่า)</div>'
      + '</div>'
      + '</details>';
  }

  // === ส่วนที่ 4: ดาวเจ้าปาง + จุดอ่อน ===
  html += '<div class="ps-planet-cards">';

  // ดาวเจ้าปาง (จุดแข็ง)
  for (var i = 0; i < strengthPlanets.length; i++) {
    var sp = strengthPlanets[i];
    var spColor = planetColors[sp] || '#7B68EE';
    html += '<div class="ps-planet-card ps-strength-card" style="border-left-color:' + spColor + '">'
      + '<div class="ps-planet-icon" style="color:' + spColor + '">🪐</div>'
      + '<div class="ps-planet-info">'
      + '<div class="ps-planet-label">จุดแข็ง · ดาวเจ้าปาง</div>'
      + '<div class="ps-planet-name" style="color:' + spColor + '">' + escapeHTML(sp) + '</div>'
      + '</div>'
      + '</div>';
  }

  // ดาวอ่อน (จุดอ่อน)
  for (var j = 0; j < weaknessPlanets.length; j++) {
    var wp = weaknessPlanets[j];
    var wpColor = planetColors[wp] || '#7B68EE';
    html += '<div class="ps-planet-card ps-weakness-card" style="border-left-color:' + wpColor + '">'
      + '<div class="ps-planet-icon" style="color:' + wpColor + '">⚠️</div>'
      + '<div class="ps-planet-info">'
      + '<div class="ps-planet-label">จุดอ่อน · ดาวที่ต้องระวัง</div>'
      + '<div class="ps-planet-name" style="color:' + wpColor + '">' + escapeHTML(wp) + '</div>'
      + '</div>'
      + '</div>';
  }

  html += '</div>';

  // === ส่วนที่ 4: คำอธิบาย + คำแนะนำ ===
  if (ps.description) {
    html += '<div class="ps-detail-card">'
      + '<div class="ps-detail-icon">💎</div>'
      + '<div class="ps-detail-content">'
      + '<div class="ps-detail-label">ลักษณะเด่นของคุณ</div>'
      + '<div class="ps-detail-text">' + escapeHTML(ps.description) + '</div>'
      + '</div>'
      + '</div>';
  }

  if (ps.advice) {
    html += '<div class="ps-detail-card ps-advice-card">'
      + '<div class="ps-detail-icon">🧭</div>'
      + '<div class="ps-detail-content">'
      + '<div class="ps-detail-label">คำแนะนำจากดาวเจ้าปาง</div>'
      + '<div class="ps-detail-text">' + escapeHTML(ps.advice) + '</div>'
      + '</div>'
      + '</div>';
  }

  // === ส่วนที่ 5: เชื่อมกลับ ===
  html += '<div class="ps-connect">'
    + '<div class="ps-connect-icon">🔗</div>'
    + '<div class="ps-connect-text">'
    + '<strong>ดูเพิ่มเติม:</strong> '
    + '<span class="ps-link" onclick="document.querySelector(\'.collapsible-toggle[data-section=\\\'taksa\'\']\')?.click()">ทักษามหาอุติ — ช่วงชีวิตตามดาว</span> · '
    + '<span class="ps-link" onclick="document.querySelector(\'.collapsible-toggle[data-section=\\\'domain\'\']\')?.click()">คัมภีร์แก้ดวง 6 ด้าน</span>'
    + '</div>'
    + '</div>';

  html += '</div>';
  return html;
}
