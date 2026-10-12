// Couple reading renderer (Mode 1)
// Provides: renderCouple, go1
// ===== MODE 1: Couple =====
function go1(){
  var da=document.getElementById('d1a').value, db=document.getElementById('d1b').value;
  if(!da)return;
  var u=U(), PL2=getPL(), RA2=getRA();
  var def=u.def||['คนที่หนึ่ง','คนที่สอง'];
  var na=document.getElementById('n1a').value||def[0];
  var ta=document.getElementById('t1a').value||'06:00';
  var pa=PL2[new Date(da).getDay()];
  var ria=getRasi(da);
  var lia=getLagna(da,ta);

  // ✨ Smooth transition: fade out form first
  var formCard = document.getElementById('fc1');
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

        if(!db){
          renderSingleLoveOpportunity(na,pa,RA2[ria],RA2[lia],ria,lia,u,RA2,da);
          var r1 = document.getElementById('r1');
          if(r1) {
            var targetY = r1.getBoundingClientRect().top + window.scrollY - 20;
            window.scrollTo({ top: targetY, behavior: 'smooth' });
            if (window.StarviaStats) { window.StarviaStats.pingReport('m1'); window.StarviaStats.mountVote(r1, 'm1'); }
          }
          return;
        }
        var nb=document.getElementById('n1b').value||def[1];
        var tb=document.getElementById('t1b').value||'06:00';
        var pb=PL2[new Date(db).getDay()];
        var rib=getRasi(db), lib=getLagna(db,tb);
        renderCouple(na,pa,RA2[ria],RA2[lia],ria,lia,nb,pb,RA2[rib],RA2[lib],rib,lib,u,RA2,da,db);
        var r1 = document.getElementById('r1');
        if(r1) {
          var targetY = r1.getBoundingClientRect().top + window.scrollY - 20;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          if (window.StarviaStats) { window.StarviaStats.pingReport('m1'); window.StarviaStats.mountVote(r1, 'm1'); }
        }
      }, 400);
    }, 900);
  }, 300);
}

function parseBirthDateSafe(value){
  if(!value) return null;
  var d = new Date(value + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function getAgeFromBirthDate(value){
  var d = parseBirthDateSafe(value);
  if(!d) return null;
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var hadBirthday = today.getMonth() > d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
  return hadBirthday ? age : age - 1;
}

// แปลงคะแนนสูตรภายในเป็นคำพูด (กฎพ่อ: ห้ามโชว์ % ลอยๆ ที่ไม่ได้มาจากสถิติจริง)
function scoreWord(s){
  s = Math.round(s);
  if(s >= 90) return 'สูงมาก';
  if(s >= 80) return 'สูง';
  if(s >= 70) return 'ค่อนข้างสูง';
  if(s >= 60) return 'ปานกลาง';
  return 'ต้องดูแลเป็นพิเศษ';
}

function loveDigitFromDate(value){
  var d = parseBirthDateSafe(value);
  if(!d) return 6;
  var raw = String(d.getFullYear()) + String(d.getMonth()+1) + String(d.getDate());
  var sum = raw.split('').reduce(function(acc,ch){ return acc + (parseInt(ch,10)||0); },0);
  while(sum > 9) sum = String(sum).split('').reduce(function(acc,ch){ return acc + (parseInt(ch,10)||0); },0);
  return sum || 6;
}

function loveWindowForPerson(dateValue, planetIndex, rasiIndex, offset){
  var age = getAgeFromBirthDate(dateValue);
  var digit = loveDigitFromDate(dateValue);
  var base = 18 + ((digit * 3 + planetIndex * 2 + rasiIndex + offset) % 16);
  var target = base;
  var safety = 0;
  while(age !== null && target < age - 1 && safety < 8){
    target += 7;
    safety++;
  }
  return {
    age: age,
    baseStart: base,
    baseEnd: base + 2,
    cyclesShifted: safety,
    shiftedFromPast: safety > 0,
    start: target,
    end: target + 2,
    label: target + '–' + (target + 2) + ' ปี',
    baseLabel: base + '–' + (base + 2) + ' ปี'
  };
}

function buildLoveDestinyModel(dateA,dateB,total,elS,plS,angS,lgS,pa,pb,ria,rib){
  var piA = Math.max(0, getPL().indexOf(pa));
  var piB = Math.max(0, getPL().indexOf(pb));
  var wa = loveWindowForPerson(dateA, piA, ria || 0, 0);
  var wb = loveWindowForPerson(dateB, piB, rib || 0, 3);
  var overlapStart = Math.max(wa.start, wb.start);
  var overlapEnd = Math.min(wa.end, wb.end);
  var hasOverlap = overlapStart <= overlapEnd;
  var coupleStart = hasOverlap ? overlapStart : Math.round((wa.start + wb.start) / 2);
  var coupleEnd = hasOverlap ? overlapEnd : coupleStart + 2;
  var shiftedText = [];
  if(wa.shiftedFromPast) shiftedText.push('รอบเดิมของคนที่หนึ่ง (' + wa.baseLabel + ') ผ่านไปแล้ว ระบบอ่านรอบถัดไป');
  if(wb.shiftedFromPast) shiftedText.push('รอบเดิมของคนที่สอง (' + wb.baseLabel + ') ผ่านไปแล้ว ระบบอ่านรอบถัดไป');
  var timingStatus = hasOverlap
    ? 'จังหวะรักของทั้งคู่ซ้อนกันจริงในช่วงนี้ จึงเหมาะกับการขยับความสัมพันธ์หรือวางแผนอนาคตร่วมกัน'
    : 'จังหวะรักของทั้งคู่มาไม่พร้อมกัน — ต้องนัด ต้องคุย ต้องเปิดโอกาส อย่าปล่อยให้เวลาพาไปเอง';
  if(shiftedText.length) timingStatus += ' · ' + shiftedText.join(' · ');
  var openness = Math.max(48, Math.min(96, Math.round(total * .42 + elS * .18 + plS * .16 + angS * .16 + lgS * .08)));
  var channelMap = {
    'ไฟ': 'กิจกรรมที่มีพลังร่วมกัน งานอีเวนต์ กีฬา โปรเจกต์ที่ต้องตัดสินใจเร็ว หรือพื้นที่ที่ได้แสดงตัวตน',
    'น้ำ': 'วงเพื่อนสนิท ครอบครัว งานดูแลผู้คน คอมมูนิตี้เล็ก ๆ หรือบทสนทนาที่เปิดใจลึก',
    'ลม': 'ออนไลน์ การเรียน คอร์ส เวิร์กช็อป งานสื่อสาร และพื้นที่ที่ได้คุยแลกเปลี่ยนความคิด',
    'ดิน': 'ที่ทำงาน งานอาชีพ ธุรกิจ การเงิน อสังหา หรือกิจวัตรที่พบกันซ้ำจนไว้ใจกัน'
  };
  var mainEl = elS >= 78 ? pa.el : pb.el;
  var risk = pa.ei === pb.ei ? 'อารมณ์หรือรูปแบบเดิมของทั้งคู่คล้ายกันมาก จึงควรระวังการย้ำแผลเดิมซ้ำ ๆ' : 'แรงดึงดูดมาจากความต่าง จึงต้องแปลความต่างให้เป็นการเติมเต็ม ไม่ใช่การเอาชนะ';
  var premiumPlan = [
    'เปิดพื้นที่เจอคนใหม่อย่างน้อยสัปดาห์ละ 1 ครั้งในช่องทางที่ธาตุเด่นสนับสนุน',
    'ใช้กติกา 3 คำถามก่อนเริ่มสัมพันธ์จริงจัง: คุยกันรู้เรื่องไหม, รู้สึกปลอดภัยไหม, เป้าหมายชีวิตไม่ชนกันเกินไปไหม',
    'ถ้าเริ่มคุยแล้ว ให้ดูความสม่ำเสมอ 21 วัน มากกว่าคำหวานช่วงแรก'
  ];
  return {
    wa: wa,
    wb: wb,
    hasOverlap: hasOverlap,
    timingStatus: timingStatus,
    coupleLabel: coupleStart + '–' + coupleEnd + ' ปี',
    openness: openness,
    channel: channelMap[mainEl] || channelMap['ลม'],
    risk: risk,
    premiumPlan: premiumPlan,
    reference: 'อ้างอิงเชิงระบบ: วันเกิด → ดาวประจำวัน/ธาตุ, ราศีสัมพันธ์, ลัคนา และวงรอบ 7 ปีของจังหวะชีวิต ใช้เป็นแนวโน้มเพื่อวางแผนความสัมพันธ์ ไม่ใช่คำทำนายตายตัว'
  };
}

function buildSingleLoveOpportunityModel(dateA, pa, ra, la, ria, lia, RA2){
  var piA = Math.max(0, getPL().indexOf(pa));
  var windowA = loveWindowForPerson(dateA, piA, ria || 0, 2);
  var digit = loveDigitFromDate(dateA);
  var signIdx = (digit + piA + (ria || 0) + (lia || 0)) % 12;
  var fallbackSigns = ['เมษ','พฤษภ','เมถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
  var partnerSign = RA2 && RA2[signIdx] ? RA2[signIdx] : { n: fallbackSigns[signIdx], s: '', el: signIdx % 4 };
  var elNames = ['ไฟ','ดิน','ลม','น้ำ'];
  var partnerEl = typeof partnerSign.el === 'number' ? elNames[partnerSign.el % 4] : (partnerSign.el || pa.el || 'ลม');
  var channelMap = {
    'ไฟ': 'งานอีเวนต์ กิจกรรมที่ได้แสดงตัวตน กีฬา โปรเจกต์ใหม่ หรือพื้นที่ที่ต้องใช้ความกล้า',
    'น้ำ': 'วงเพื่อนสนิท ครอบครัว งานดูแลผู้คน คาเฟ่เงียบ ๆ หรือบทสนทนาที่ได้เปิดใจลึก',
    'ลม': 'ออนไลน์ คอร์สเรียน เวิร์กช็อป งานสื่อสาร คอมมูนิตี้ความรู้ หรือการเดินทางสั้น ๆ',
    'ดิน': 'ที่ทำงาน ธุรกิจ การเงิน อสังหา สถานที่ที่ไปเป็นประจำ หรือคนที่เจอจากกิจวัตรเดิม'
  };
  var traitMap = {
    'ไฟ': 'ตรงไปตรงมา มีแพสชัน ชอบคนจริงใจ ตัดสินใจเร็ว แต่บางครั้งใจร้อน',
    'น้ำ': 'อ่อนโยน ลึกซึ้ง อ่านบรรยากาศเก่ง ต้องการความปลอดภัยทางใจ',
    'ลม': 'คุยสนุก ฉลาด ชอบแลกเปลี่ยนความคิด รักอิสระและไม่ชอบความสัมพันธ์ที่อึดอัด',
    'ดิน': 'มั่นคง รับผิดชอบ รักจริงแบบค่อยเป็นค่อยไป ชอบความชัดเจนและไว้ใจได้'
  };
  var chance = Math.max(52, Math.min(94, 58 + (digit * 3) + (piA * 2) + ((ria || 0) % 9)));
  var monthHints = ['ม.ค.–มี.ค.', 'เม.ย.–มิ.ย.', 'ก.ค.–ก.ย.', 'ต.ค.–ธ.ค.'];
  var monthHint = monthHints[(digit + piA) % monthHints.length];
  return {
    window: windowA,
    chance: chance,
    monthHint: monthHint,
    partnerSignName: partnerSign.n || fallbackSigns[signIdx],
    partnerSignIndex: signIdx,
    partnerSignSymbol: partnerSign.s || '',
    partnerElement: partnerEl,
    channel: channelMap[partnerEl] || channelMap['ลม'],
    traits: traitMap[partnerEl] || traitMap['ลม'],
    signal: 'สัญญาณที่ควรสังเกตคือคนที่คุยแล้วใจนิ่งขึ้น ไม่เร่งให้ตัดสินใจ และมีความสม่ำเสมอมากกว่าคำหวานช่วงแรก',
    reference: 'อ้างอิงเชิงระบบ: วันเกิด → ดาวประจำวัน/ธาตุ, ราศีเกิด, ลัคนา และวงรอบ 7 ปีของจังหวะความรัก ใช้เป็นแนวโน้มเพื่อเปิดโอกาส ไม่ใช่คำฟันธงตายตัว'
  };
}

function renderSingleLoveOpportunity(na,pa,ra,la,ria,lia,u,RA2,dateA){
  var wrap=document.getElementById('r1');
  na = escapeHTML(na);
  var model = buildSingleLoveOpportunityModel(dateA, pa, ra, la, ria, lia, RA2);
  // Couple mode is fully unlocked (per user decision 2026-06-07) —
  // premium plan always renders. No lock overlay, no teaser, no paywall.
  var loveTimingHtml = '<div class="love-destiny-premium">'
    + '<div class="ld-section-title">แผนเปิดทางความรัก 3 ขั้น</div>'
    + '<ol>'
    + '<li>เลือกออกไปอยู่ในพื้นที่ที่ตรงกับธาตุของคนที่มีแนวโน้มเข้ามา: ' + escapeHTML(model.channel) + '</li>'
    + '<li>ตั้งกติกาคัดคน: คุยแล้วสบายใจไหม, สม่ำเสมอไหม, เป้าหมายชีวิตไปทางเดียวกันไหม</li>'
    + '<li>ช่วง ' + escapeHTML(model.monthHint) + ' ให้เพิ่มโอกาสเจอคนใหม่อย่างน้อยสัปดาห์ละ 1 ครั้ง</li>'
    + '</ol>'
    + '<div class="ld-note"><strong>สัญญาณคนที่ควรให้โอกาส:</strong> ' + escapeHTML(model.signal) + '</div>'
    + '</div>';
  wrap.innerHTML = '<div class="love-destiny-card single-love-card">'
    + '<div class="ld-kicker">Single Love Timing</div>'
    + '<div class="ld-title">💖 โอกาสเจอคู่ของคุณ</div>'
    + '<div class="ld-summary"><strong>' + na + '</strong> ยังไม่ต้องมีข้อมูลอีกฝ่าย ก็อ่านจังหวะรักจากดวงตัวเองได้ — ช่วงเด่นคือ <span>' + escapeHTML(model.window.label) + '</span></div>'
    + '<div class="ld-grid">'
    + '<div class="ld-box"><small>โอกาสเปิดใจ/เจอคนใหม่</small><strong>' + escapeHTML(scoreWord(model.chance)) + '</strong><p>เด่นเป็นพิเศษช่วง ' + escapeHTML(model.monthHint) + ' ของรอบปีที่จังหวะรักเปิด</p></div>'
    + '<div class="ld-box"><small>มีแนวโน้มเจอที่ไหน</small><p>' + escapeHTML(model.channel) + '</p></div>'
    + '</div>'
    + '<div class="ld-two">'
    + '<div><b>ราศี/พลังที่มีแนวโน้มเข้ามา</b><br>' + rasiIconHtml(model.partnerSignIndex, model.partnerSignName, 28) + ' <strong>' + escapeHTML(model.partnerSignName) + '</strong> · ธาตุ' + escapeHTML(model.partnerElement) + '</div>'
    + '<div><b>นิสัยคนที่มีแนวโน้มเข้ากัน</b><br>' + escapeHTML(model.traits) + '</div>'
    + '</div>'
    + (premiumIsUnlocked() ? loveTimingHtml : buildConversionCta(
        '💕 ดูแผนเปิดทางความรัก 3 ขั้น',
        'วิธีคัดคน · สัญญาณคนที่ใช่ · จังหวะเปิดใจ',
        '',
        '✦ ปลดล็อกแผนความรัก ✦'
      ))
    + '<div class="ld-ref">' + escapeHTML(model.reference) + '</div>'
    + '</div>'
    + '<div class="ld-note">🔭 ถ้าอยากดูดวงตัวเองล้วนๆ ไม่เกี่ยวกับความรัก กดปุ่ม "ดูแค่ดวงตัวเอง" ด้านล่างได้เลย</div>'
    + '<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="1">' + (u.r1 || 'เริ่มใหม่') + '</button> <button class="rbtn" onclick="document.getElementById(\'mn0\').click()">✦ ดูแค่ดวงตัวเอง</button></div>';
}

function buildLoveDestinyCard(model, na, nb){
  // การ์ด 2/3: จังหวะรัก + เจอที่ไหน (เล่าเรื่องเดียว — แผนกับหลุมพรางย้ายไปการ์ด 3)
  return '<div class="love-destiny-card">'
    + '<div class="ld-kicker">Love Timing</div>'
    + '<div class="ld-title">🕰 จังหวะรัก + เจอที่ไหน</div>'
    + '<div class="ld-summary">ช่วงที่ดวงความรักของ <strong>' + na + '</strong> และ <strong>' + nb + '</strong> เปิดพร้อมกัน: <span>' + escapeHTML(model.coupleLabel) + '</span></div>'
    + '<div class="ld-status ' + (model.hasOverlap ? 'ld-overlap' : 'ld-no-overlap') + '">' + escapeHTML(model.timingStatus) + '</div>'
    + '<div class="ld-two">'
    + '<div><b>' + na + '</b><br>จังหวะเปิดเด่น: ' + escapeHTML(model.wa.label) + '</div>'
    + '<div><b>' + nb + '</b><br>จังหวะเปิดเด่น: ' + escapeHTML(model.wb.label) + '</div>'
    + '</div>'
    + '<div class="ld-note">📍 ทางที่มีโอกาสเจอคนที่ใช่: ' + escapeHTML(model.channel) + '</div>'
    + '<div class="ld-ref">' + escapeHTML(model.reference) + '</div>'
    + '</div>';
}

function renderCouple(na,pa,ra,la,ria,lia,nb,pb,rb,lb2,rib,lib,u,RA2,dateA,dateB){
  var wrap=document.getElementById('r1');
  na = escapeHTML(na);
  nb = escapeHTML(nb);
  // Option A: ฟรีดูแค่ระดับคำพูด, รายละเอียดล็อค Premium
  var premiumUnlocked = premiumIsUnlocked();
  var elS=ELC[pa.ei][pb.ei];
  var piA=getPL().indexOf(pa), piB=getPL().indexOf(pb);
  var plS=PLC[piA>=0?piA:0][piB>=0?piB:0];
  var ang=rasiAngle(ria,rib), angS=ang[0], angD=ang[1];
  var lgS=ELC[RA2[lia].el][RA2[lib].el];

  // คำนวณคะแนนความเข้ากันได้
  var total=Math.round(elS*.3+plS*.3+angS*.25+lgS*.15);
  var ELD=getELD();
  var elDesc=ELD[pa.ei][pb.ei];

  // ระบบตัดเกรด (S, A, B, C, D)
  var gradeLtr = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';
  var gradeLbl = total >= 90 ? 'Soulmate Energy (คู่แท้ส่งเสริมกัน)' :
                 total >= 80 ? 'Harmonious Pair (คู่ที่เข้ากันได้ดีเยี่ยม)' :
                 total >= 70 ? 'Growing Together (คู่ที่ต้องเรียนรู้และเติบโต)' :
                 total >= 60 ? 'Understanding Needed (คู่ที่ต้องใช้ความเข้าใจสูง)' :
                               'Karmic Lesson (คู่เวรคู่กรรม/บทเรียนสำคัญ)';

  // ต้นฉบับกลางเรื่องธาตุคู่ (กฎพ่อ: เล่าเรื่องเดียวที่เดียว — ตาราง 10 คู่คือต้นฉบับ)
  var pairKey = (typeof COUPLE_COMPATIBILITY !== 'undefined')
    ? (COUPLE_COMPATIBILITY[pa.el + '-' + pb.el] ? pa.el + '-' + pb.el : pb.el + '-' + pa.el) : null;
  var pairInfo = (pairKey && COUPLE_COMPATIBILITY[pairKey]) || null;
  var chemPara = pairInfo ? (pairInfo.meaning + ' 💡 ' + pairInfo.advice) : elDesc;
  var chemLove = pairInfo ? ('คู่นี้' + pairInfo.love) : gradeLbl;
  var bondLine = total >= 80 ? 'ผูกพันแน่น — ผ่านช่วงเบื่อได้ถ้าตั้งใจดูแลกัน'
    : total >= 60 ? 'ไปได้ยาวถ้าคุยกันสม่ำเสมอ ไม่ปล่อยให้เงียบค้างคา'
    : 'คู่นี้มาเพื่อบทเรียน — อยู่กันได้ถ้าเคารพขอบเขตกัน';

  var loveDestiny = buildLoveDestinyModel(dateA, dateB, total, elS, plS, angS, lgS, pa, pb, ria, rib);
  var loveDestinyHtml = buildLoveDestinyCard(loveDestiny, na, nb);

  var dharma = getCoupleDharmaType(total, elS, pa.ei === pb.ei);
  // หลุมพรางเดียว (รวมคำเตือนทุกที่ไว้ข้อเดียว — กฎพ่อ: เล่าเรื่องเดียวที่เดียว)
  var pitfallOne = loveDestiny.risk + ((pairInfo && pairInfo.warning) ? ' · ระวัง' + pairInfo.warning : '');

  // 4-dimensional score breakdown — always render
  var scoreBreakdownHtml = '<div class="cg2">'
    +'<div class="ci2"><div class="ci2l">'+u.ec+'</div><div class="ci2s">'+pa.el+' + '+pb.el+'</div><div class="ci2v">'+escapeHTML(scoreWord(elS))+'</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.pc+'</div><div class="ci2s">'+pa.s+' + '+pb.s+'</div><div class="ci2v">'+escapeHTML(scoreWord(plS))+'</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.rc+'</div><div class="ci2s">'+ra.s+' + '+rb.s+'</div><div class="ci2v">'+escapeHTML(scoreWord(angS))+'</div></div>'
    +'<div class="ci2"><div class="ci2l">'+u.lc+'</div><div class="ci2s">'+RA2[lia].s+' + '+RA2[lib].s+'</div><div class="ci2v">'+escapeHTML(scoreWord(lgS))+'</div></div>'
    +'</div>';

  // สร้าง Viral Matrix Card (การ์ด 1/3: สรุปคู่ของคุณ)
  var matrixHtml = '<div class="matrix-card">'
    + '<div class="mx-names">'
    + '<div class="mx-person"><div class="mx-n">' + na + '</div><div class="mx-p">' + pa.s + ' ' + pa.n + ' · ธาตุ' + pa.el + '</div></div>'
    + '<div class="mx-heart">♡</div>'
    + '<div class="mx-person"><div class="mx-n">' + nb + '</div><div class="mx-p">' + pb.s + ' ' + pb.n + ' · ธาตุ' + pb.el + '</div></div>'
    + '</div>'

    + '<div class="mx-score-wrap">'
    + '<div class="mx-title">The Compatibility Matrix</div>'
    + '<div class="mx-score">' + escapeHTML(scoreWord(total)) + ' <span class="mx-grade">' + gradeLtr + '</span></div>'
    + '<div class="mx-lbl">' + gradeLbl + '</div>'
    + '<div class="mx-lbl dharma-chip">' + escapeHTML(dharma.label) + '</div>'
    + '</div>'

    + '<div class="chem-box">'
    + '<div class="chem-title"><span style="font-size:14px">⚗️</span> เคมีธาตุของคู่นี้</div>'
    + '<div class="chem-desc">' + escapeHTML(chemPara) + '</div>'
    + '<div class="chem-desc">⚗️ เคมีดึงดูด: ' + escapeHTML(chemLove) + '</div>'
    + '<div class="chem-desc">🪐 พันธะระยะยาว: ' + escapeHTML(bondLine) + '</div>'
    + '</div>' // ปิด chem-box
    + (premiumUnlocked ? scoreBreakdownHtml : '')
    + '</div>' // ปิด matrix-card
    // ปุ่มเซฟรูปภาพถูกเอาออกตามคำขอผู้ใช้

  // การ์ด 3/3: แผน 3 ขั้น + หลุมพรางเดียว (รวมธรรมะคู่ไว้ในนี้ ไม่แยกการ์ด)
  var strG = elS>=80 ? 'ธาตุ'+pa.el+'และ'+pb.el+'ที่ส่งเสริมกันอย่างเป็นธรรมชาติ' : 'ความแตกต่างของธาตุที่ทำให้อีกฝ่ายได้เห็นมุมมองใหม่';
  var actionPlanFullHtml = '<div class="action-plan-card" style="margin-top:0;">'
    + '<div class="ap-title">✦ พิมพ์เขียวความสัมพันธ์ ✦</div>'
    + '<div class="dharma-chip">' + escapeHTML(dharma.label) + ' · ' + escapeHTML(dharma.title) + '</div>'
    + '<div class="ap-step"><div class="ap-num">1</div><div class="ap-content"><h4>จุดแข็งที่ต้องรักษา</h4><p>ความสัมพันธ์นี้มีจุดเด่นเรื่อง <strong>' + strG + '</strong> ' + escapeHTML(dharma.meaning) + '</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">2</div><div class="ap-content"><h4>หลุมพรางเดียวที่ต้องระวัง</h4><p>' + escapeHTML(pitfallOne) + ' เมื่อเกิดอาการนี้ ให้หยุดพัก 15 นาทีก่อนคุยต่อเพื่อลดการใช้อารมณ์</p></div></div>'
    + '<div class="ap-step"><div class="ap-num">3</div><div class="ap-content"><h4>คำแนะนำจากดวงดาว</h4><p>ความสัมพันธ์ที่ยั่งยืนไม่ได้เกิดจากดวงที่สมบูรณ์แบบ แต่เกิดจากคนสองคนที่ไม่ยอมแพ้ต่อกัน วิธีของคู่นี้คือ ' + escapeHTML(dharma.advice) + '</p></div></div>'
    + '</div>';

  // 3 การ์ด: สรุปคู่ (โชว์เสมอ) + จังหวะรัก + แผน 3 ขั้น (พรีเมียม)
  wrap.innerHTML = matrixHtml
    + (premiumUnlocked ? loveDestinyHtml : buildConversionCta(
        '💕 ดูแผนเปิดทางความรัก + ดวงคู่สมพงศ์',
        'จังหวะรัก · วิธีดูแล · หลุมพราง',
        'อ่านจากดวงของทั้งคู่ ไม่ใช่ดวงรวมทั่วไป',
        '✦ ปลดล็อกดวงคู่เต็ม ✦'
      ))
    + (premiumUnlocked ? actionPlanFullHtml : '');

  // ปิดท้ายด้วย closing card + reset button
  wrap.insertAdjacentHTML('beforeend',
    '<div class="mc" style="margin-top:20px;"><div class="mc-l">✦ '+u.cm+' ✦</div>'
    +'<div class="mc-t">"'+u.cv2+'"</div></div>'
    +'<div class="rbt"><button class="rbtn" data-action="reset-mode" data-mode="1">'+u.r1+'</button></div>'
  );
  // ✨ Scroll-triggered reveal — all report cards float up when scrolled into view
  (function(){
    var cards = wrap.querySelectorAll(':scope > .card, :scope > .mc, :scope > .love-destiny-card, :scope > .collapsible-section');
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
  if (typeof CardMenu !== 'undefined' && CardMenu.build) CardMenu.build('r1');
}
