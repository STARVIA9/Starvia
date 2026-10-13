// Shared renderer utilities (buildTabs, resetM)
// Loaded after reading-helpers.js and before individual/couple/auspicious renderers.
function premiumIsUnlocked(){
  return (typeof isPremiumUnlocked === 'function') ? isPremiumUnlocked() : false;
}

function buildPremiumLockOverlay(title, description){
  return '<div class="lock-overlay">'
    + '<div style="font-size:35px; margin-bottom:10px; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5));">🔒</div>'
    + '<div style="color:#C9A227; font-size:16px; font-weight:700; margin-bottom:5px;">' + title + '</div>'
    + '<div style="color:#b8a8d8; font-size:13px; margin-bottom:15px; max-width:300px; line-height:1.6;">' + description + '</div>'
    + '<button class="pdf-btn" data-action="open-payment" style="padding:10px 24px; font-size:13px; box-shadow:0 4px 15px rgba(201,162,39,0.3);">ปลดล็อกรีพอร์ตฉบับเต็ม 199/เดือน</button>'
    + '</div>';
}

function premiumLockedCard(className, teaserHtml, title, description, previewText){
  var previewHtml = '';
  if (previewText) {
    previewHtml = '<div class="lock-preview-text">' + previewText + '</div>';
  }
  return '<div class="' + className + ' is-locked">'
    + previewHtml
    + teaserHtml
    + buildPremiumLockOverlay(title || 'เนื้อหาเจาะลึกเฉพาะคุณ (Premium)', description || 'ปลดล็อกรีพอร์ตฉบับเต็มเพื่ออ่านคำวิเคราะห์เชิงลึกและคำแนะนำที่นำไปใช้ได้จริง')
    + '</div>';
}

// ===== Teaser for Locked Tabs =====
// สร้างข้อความ teaser ที่น่าสนใจ ให้ผู้ใช้อยากปลดล็อค
function buildTabTeaser(tb, i, p) {
  // ดึงข้อความจากเนื้อหาเต็ม เอาแค่ 1-2 ประโยคแรก
  var fullContent = '';
  if (tb.secs && tb.secs[0] && tb.secs[0].c) {
    fullContent = String(tb.secs[0].c);
  }

  // Strip HTML tags + decode entities
  var plain = fullContent
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  // เอาแค่ 120 ตัวอักษรแรก
  var teaserText = plain.length > 120 ? plain.substring(0, 120) + '...' : plain;

  // เพิ่มคำชวนปลดล็อคตามแต่ละแท็บ
  var hooks = {
    'คู่สัมพันธ์': {
      hook: '💕 คุณกับคนรัก...',
      question: 'คุณเข้ากันได้แค่ไหน? ปลดล็อกเพื่อดูคำทำนายความสัมพันธ์เชิงลึก',
      icon: '💞'
    },
    'การงาน': {
      hook: '💼 สายอาชีพที่ใช่...',
      question: 'คุณเหมาะกับงานแบบไหน? ดูเส้นทางอาชีพ + โอกาสที่รออยู่',
      icon: '💼'
    },
    'การเงิน': {
      hook: '💰 พิมพ์เขียวความมั่งคั่ง...',
      question: 'เงินของคุณไหลไปทางไหน? ดูแผนการเงินเฉพาะตัว',
      icon: '💰'
    }
  };

  var label = tb.lb;
  var hook = hooks[label] || {
    hook: '🔮 เนื้อหาเจาะลึก...',
    question: 'ปลดล็อกเพื่อดูคำทำนายเต็ม',
    icon: '✦'
  };

  // สร้าง HTML teaser
  return ''
    + '<div class="teaser-icon">' + hook.icon + '</div>'
    + '<div class="teaser-hook">' + hook.hook + '</div>'
    + '<div class="teaser-content">' + escapeHtml(teaserText) + '</div>'
    + '<div class="teaser-question">' + hook.question + '</div>'
    + '<div class="teaser-cta">🔒 ปลดล็อกเพื่ออ่านต่อ →</div>';
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function buildTabs(tid,sid,pre,TB,p,u){
  var tt=document.getElementById(tid), ts2=document.getElementById(sid);
  // Icon map for each tab position
  var tabIcons = ['👤', '💞', '💼', '💰'];

  // ★ ARIA: กำหนด role="tablist" + aria-label ให้กับ container
  if (tt) {
    tt.setAttribute('role', 'tablist');
    if (!tt.getAttribute('aria-label')) {
      tt.setAttribute('aria-label', 'หมวดคำทำนาย');
    }
  }
  
  TB.forEach(function(tb,i){
    var btn=document.createElement('button');
    btn.className='tab'+(i===0?' on':'');
    var lockSpan = '<span class="tab-lock">🔒</span>';
    btn.innerHTML = '<span class="tab-icon">' + (tabIcons[i] || '✦') + '</span><span class="tab-text">' + tb.lb + '</span>' + lockSpan;

    // ★ ARIA: แต่ละ tab button ต้องมี role="tab", aria-selected, aria-controls
    var panelId = pre + i;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', (i === 0) ? 'true' : 'false');
    btn.setAttribute('aria-controls', panelId);
    // tabindex management: roving tabindex pattern — tab ที่ active เท่านั้นที่ tabbable
    btn.setAttribute('tabindex', (i === 0) ? '0' : '-1');
    // ผูก id ของ tab เพื่อให้ panel ใช้ aria-labelledby ชี้กลับมา
    btn.id = (tid || 'tabs') + '-tab-' + i;

    btn.addEventListener('click', function(){
      var nextSec = document.getElementById(pre+i);
      // Smooth tab switching: fade-out old, fade-in new via CSS animation
      document.querySelectorAll('#'+tid+' .tab').forEach(function(t){
        t.classList.remove('on');
        // อัปเดต aria-selected + tabindex พร้อมกัน
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      // ★ ARIA: อัปเดต aria-hidden บน panel — panel ที่ไม่ active ให้ซ่อนจาก screen reader
      var prevSecs = document.querySelectorAll('#'+sid+' .sec.on');
      for(var pi=0; pi<prevSecs.length; pi++){
        prevSecs[pi].classList.add('tab-exit');
        prevSecs[pi].classList.remove('on');
        prevSecs[pi].setAttribute('aria-hidden', 'true');
      }
      btn.classList.add('on');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      nextSec.classList.add('on');
      nextSec.setAttribute('aria-hidden', 'false');
      // Clean up exit class after animation completes
      setTimeout(function(){
        var exits = document.querySelectorAll('#'+sid+' .sec.tab-exit');
        for(var ei=0; ei<exits.length; ei++) exits[ei].classList.remove('tab-exit');
      }, 250);
    });
    tt.appendChild(btn);
    
    var sec=document.createElement('div');
    sec.className='sec'+(i===0?' on':'');
    sec.id=pre+i;

    // ★ ARIA: แต่ละ panel ต้องมี role="tabpanel" + aria-labelledby ชี้กลับไปที่ tab
    sec.setAttribute('role', 'tabpanel');
    sec.setAttribute('aria-labelledby', (tid || 'tabs') + '-tab-' + i);
    // tabpanel ที่ไม่ได้ active ให้ hidden เพื่อให้ screen reader ข้าม
    if (i !== 0) {
      sec.setAttribute('aria-hidden', 'true');
    } else {
      sec.setAttribute('aria-hidden', 'false');
    }

    var isPremiumTab = true; // Option A: ทุกแท็บ = Premium, เฉพาะส่วนสรุปด้านบนที่ฟรี
    var isLocked = isPremiumTab && !premiumIsUnlocked();
    if (isLocked) {
       sec.classList.add('is-locked');
    }

    // ★ Teaser แยกออกมา ไม่อยู่ใน .is-locked เพื่อไม่ให้ overlay ทับ
    if (isLocked) {
      var teaser = buildTabTeaser(tb, i, p);
      if (teaser) {
        sec.insertAdjacentHTML('beforeend', '<div class="lock-preview-text">' + teaser + '</div>');
      }
      // Wrap content ที่จะ blur ใน .locked-content
      var lockedWrapper = document.createElement('div');
      lockedWrapper.className = 'locked-content';
      sec.appendChild(lockedWrapper);
    }

    var html='';
    tb.secs.forEach(function(s){
      html += '<div class="tab-section-card">'
        + '<div class="tsc-header"><span class="tsc-icon">✦</span><span class="tsc-title">' + s.t + '</span></div>'
        + '<div class="tsc-body">';
      if(s.c==='habits'){
        p.hb.forEach(function(h,n){ html+='<div class="hi"><div class="hn">'+(n+1)+'</div><div class="ht">'+h+'</div></div>'; });
      } else {
        html += '<div class="rb">'+s.c+'</div>';
      }
      html += '<div class="tsc-ref"><span class="tsc-ref-dot">🔍</span>' + u.rf + ' ' + s.rf + '</div>'
        + '</div></div>';
    });

    // ใส่ content ใน locked wrapper (ถ้ามี) หรือ sec ตรงๆ (ถ้าฟรี)
    if (isLocked) {
      var lockedWrapperEl = sec.querySelector('.locked-content');
      lockedWrapperEl.innerHTML = html;
      // เพิ่ม overlay ใน locked wrapper
      lockedWrapperEl.insertAdjacentHTML('beforeend', buildPremiumLockOverlay(
        'เนื้อหาเจาะลึกเฉพาะคุณ (Premium)',
        'ปลดล็อกเพื่ออ่านกระจกกรรม วิเคราะห์ 6 ด้าน อดีต-ปัจจุบัน-อนาคต และคำแนะนำที่นำไปใช้ได้จริง'
      ));
    } else {
      sec.innerHTML += html;
    }

    ts2.appendChild(sec);
  });

  // ★ ARIA: keyboard navigation สำหรับ tab list (Arrow Left/Right, Home, End)
  // เป็นไปตาม WAI-ARIA Authoring Practices Guide (tablist pattern)
  if (tt && TB && TB.length > 0) {
    tt.addEventListener('keydown', function(e) {
      // ตรวจสอบ key ที่เกี่ยวข้องเท่านั้น
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' &&
          e.key !== 'Home' && e.key !== 'End') {
        return;
      }
      var tabs = Array.prototype.slice.call(tt.querySelectorAll('[role="tab"]'));
      if (tabs.length === 0) return;
      var currentIdx = tabs.indexOf(document.activeElement);
      // ถ้า focus ยังไม่อยู่ที่ tab ใดเลย ให้ถือว่าอยู่ที่ tab แรก
      if (currentIdx < 0) currentIdx = 0;
      var targetTab = null;
      if (e.key === 'ArrowRight') {
        targetTab = tabs[(currentIdx + 1) % tabs.length];
      } else if (e.key === 'ArrowLeft') {
        targetTab = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      } else if (e.key === 'Home') {
        targetTab = tabs[0];
      } else if (e.key === 'End') {
        targetTab = tabs[tabs.length - 1];
      }
      if (targetTab) {
        e.preventDefault();
        targetTab.focus();
        // Activate the tab — ใช้ click() เพื่อ trigger handler ที่มีอยู่ (เปลี่ยน aria-selected, tabindex, panel)
        try { targetTab.click(); } catch (_) {}
      }
    });
  }
}

// ===== เหตุเสริมแกร่งธาตุ (Dharma Gift — ฟรีสำหรับทุกคน) =====
// Shared between individual reading (mode 0) and auspicious reading (mode 2)
// Data: ทาน · จิตบริสุทธิ์ · เมตตา · ปัญญา — personalized by birth element
function buildVinaiSection(p, now) {
  if (!now) now = new Date();
  var nextWanPhra = (typeof getNextWanPhra === 'function') ? getNextWanPhra(now) : { dateStr: 'เช็คปฏิทิน', dayName: '' };
  var VINAI = {
    'ไฟ': {
      title: '🔥 เหตุเสริมสำหรับธาตุไฟ',
      subtitle: 'เปลี่ยนความร้อนแรงเป็นพลังนำทาง',
      steps: [
        { icon: '🍚', name: 'ทาน — ให้น้ำดื่ม', action: 'ซื้อน้ำดื่ม 3 ขวด ให้คนทำงานกลางแดด รปภ. หรือแม่บ้าน — ธาตุไฟให้ธาตุน้ำ = ดับร้อนในใจ', why: 'ทานน้ำ = พลังงานสูง เพราะเป็นสิ่งจำเป็นในการดำรงชีวิต (ให้ชีวิต)', level: 'การให้วัตถุ · ผู้ที่รักษาจิตบริสุทธิ์' },
        { icon: '🙏', name: 'จิตบริสุทธิ์ + ตั้งจิตเข้มข้น วันที่จิตเข้มข้น', action: 'รักษาจิตบริสุทธิ์ทุกวัน — แล้วตั้งจิตเข้มข้น ในวันที่จิตเข้มข้นถัดไป ' + nextWanPhra.dateStr + ' (' + nextWanPhra.dayName + ')', why: 'ตั้งจิตเข้มข้น วันที่จิตเข้มข้นได้พลังงานทวีคูณของวันปกติ สงบไฟในใจ', level: 'รักษาจิตบริสุทธิ์ทุกวัน + ตั้งจิตเข้มข้นวันที่จิตเข้มข้น' },
        { icon: '💛', name: 'เมตตา — ดับไฟในใจ', action: 'ก่อนนอนคืนนี้ หลับตา 3 นาที หายใจลึกๆ แล้วพูดกับตัวเองว่า "ฉันมีความสุข ฉันปลอดภัย ฉันส่งพลังงานดีออกไป"', why: 'การส่งพลังงานดีให้ตัวเองช่วยปรับคลื่นสมอง หลับลึก ตื่นมาสดใส', level: 'พลังงานจักรวาล · ส่งให้ตัวเองก่อน แล้วขยายไปทั่วทุกทิศ' },
        { icon: '🧠', name: 'ปัญญา — กำหนดลมหายใจ', action: 'นั่งนิ่ง 5 นาที หายใจเข้า-ออกช้าๆ ไม่บังคับลม ปล่อยให้จิตนิ่งเอง — จิตฟุ้งก็แค่กลับมาที่ลม', why: 'การกำหนดลมหายใจช่วยปรับคลื่นสมองให้นิ่ง พลังงานจักรวาลจะไหลเข้าสู่จิตได้สะดวก', level: 'ปัญญาจักรวาล · นั่งสมาธิ 5-10 นาที/วัน' }
      ],
      weekChallenge: '🎯 แบบฝึก 7 วันธาตุไฟ:\nจันทร์: นั่งนิ่ง 3 นาทีก่อนเริ่มงาน ตั้งจิตให้นิ่ง\nอังคาร: ให้น้ำดื่ม 1 ขวดกับคนทำงานกลางแดด\nพุธ: ส่งพลังงานดีให้คนที่ทำให้โกรธ 3 นาที\nพฤหัส: ไม่พูดคำร้อนทั้งวัน รักษาจิตให้บริสุทธิ์\nศุกร์: แชร์ความรู้ 1 เรื่องให้คนที่ต้องการ\nเสาร์: นั่งสมาธิ 10 นาที + นอนก่อน 4 ทุ่ม\nอาทิตย์: เขียน 3 สิ่งที่ขอบคุณ + ส่งพลังงานดีออกไปทั่วทุกทิศ'
    },
    'น้ำ': {
      title: '💧 เหตุเสริมสำหรับธาตุน้ำ',
      subtitle: 'เปลี่ยนความอ่อนไหวเป็นความเข้าใจ',
      steps: [
        { icon: '🍚', name: 'ทาน — ให้อาหารคนชรา/เด็ก', action: 'ซื้ออาหารหรือขนมให้คนชราที่นั่งคนเดียว หรือเด็กที่ต้องการความอบอุ่น — ธาตุน้ำหล่อเลี้ยงชีวิต', why: 'ให้อาหาร = สิ่งจำเป็นในการดำรงชีวิต พลังงานสูง ให้คนชรา/เด็ก = ผู้ที่สมควรได้รับ', level: 'การให้วัตถุ · ผู้ที่รักษาจิตบริสุทธิ์' },
        { icon: '🙏', name: 'จิตบริสุทธิ์ + งดพูดไม่ดี 7 วัน', action: 'รักษาจิตบริสุทธิ์ทุกวัน — แล้วเพิ่ม "งดพูดไม่ดี" 7 วันติด ไม่ว่าใครจะน่าโมโหแค่ไหน', why: 'น้ำนิ่ง = ใจนิ่ง งดพูดไม่ดี 7 วัน = ศีลข้อ 4 เข้มข้น ลดกรรมทางวาจา', level: 'รักษาจิตบริสุทธิ์ทุกวัน + ศีลเพิ่ม 7 วัน' },
        { icon: '💛', name: 'เมตตา — แผ่ให้ตัวเองก่อน', action: 'ก่อนนอนคืนนี้ หลับตา 3 นาที แล้วสวด: "นิททุกโข โหมิ — ขอให้ข้าพเจ้าปราศจากทุกข์ / อัพยาปัชโฌ โหมิ — ปราศจากความเบียดเบียน"', why: 'คนธาตุน้ำรับอารมณ์คนอื่นมาเยอะ — ต้องส่งพลังงานดีให้ตัวเองก่อน จึงจะมีแรงให้คนอื่น', level: 'เมตตาภาวนา · เริ่มจากตัวเอง → คนที่รัก → กลาง → ศัตรู → ทั่วทุกทิศ' },
        { icon: '🧠', name: 'ปัญญา — สังเกตอารมณ์', action: 'เมื่อรู้สึกท่วมท้น หยุดถาม: "สิ่งนี้เที่ยงไหม? อยู่กับเราตลอดไหม?" — เห็นว่าอารมณ์เกิดดับได้ ไม่ต้องจม', why: 'ไตรลักษณ์: ทุกข์ อนิจจัง อนัตตา — เห็นว่าอารมณ์ไม่เที่ยง จึงปล่อยวางได้', level: 'จินตามยปัญญา · ใคร่ครวญไตรลักษณ์' }
      ],
      weekChallenge: '🎯 แบบฝึก 7 วันธาตุน้ำ:\nจันทร์: ให้เวลาคนที่ต้องการคนรับฟัง 15 นาที แค่ฟังไม่ต้องแก้\nอังคาร: ส่งพลังงานดีให้ตัวเอง 3 นาทีก่อนนอน\nพุธ: งดพูดไม่ดีวันแรก — ถ้าเผลอ หยุดแล้วเปลี่ยนเรื่อง\nพฤหัส: ถือจิตบริสุทธิ์ เต็มวัน + เขียน "วันนี้ปล่อยวางอะไรได้ 1 อย่าง"\nศุกร์: ให้อาหาร/ขนมคนชราหรือเด็ก 1 คน\nเสาร์: นั่งสมาธิ 5 นาที กำหนดลมหายใจ\nอาทิตย์: ส่งพลังงานดีออกไปทั่วทุกทิศ + เขียนขอบคุณ 3 สิ่ง'
    },
    'ลม': {
      title: '💨 เหตุเสริมสำหรับธาตุลม',
      subtitle: 'เปลี่ยนความคิดกระจายเป็นปัญญาคมชัด',
      steps: [
        { icon: '🍚', name: 'ทาน — การให้ปัญญา', action: 'สอนความรู้ 1 เรื่องให้คนที่ต้องการ ฟรี ไม่หวังผลตอบแทน — การให้ปัญญาชนะทานทั้งปวง', why: 'การให้ปัญญา = ให้ปัญญา เป็นทานที่ไม่เสื่อม ให้ได้ทุกที่ทุกเวลา', level: 'การให้ปัญญา · พลังงานสูงกว่าการให้วัตถุ 100 เท่า' },
        { icon: '🙏', name: 'จิตบริสุทธิ์ + นั่งสมาธิทุกวัน', action: 'รักษาจิตบริสุทธิ์ทุกวัน — แล้วนั่งสมาธิ 5 นาทีทุกวันติดกัน 7 วัน วันที่จิตเข้มข้นถัดไป ' + nextWanPhra.dateStr + ' ตั้งจิตเข้มข้น', why: 'ลมหายใจนิ่ง = จิตนิ่ง การนั่งนิ่งช่วยรวมจิตที่กระจาย ตั้งจิตเข้มข้น วันที่จิตเข้มข้น = พลังงานทวีคูณ', level: 'รักษาจิตบริสุทธิ์ทุกวัน + สมาธิ 5 นาที/วัน + ตั้งจิตเข้มข้น วันที่จิตเข้มข้น' },
        { icon: '💛', name: 'เมตตา — ก่อนตอบ เว้น 1 ลมหายใจ', action: 'ก่อนพูดทุกครั้งวันนี้ หยุด 1 ลมหายใจ ถาม "คำนี้จะสร้างสะพานหรือกำแพง?" แล้วค่อยตอบ', why: 'คนธาตุลมคิดเร็ว พูดเร็ว — เว้น 1 ลมหายใจ = ใช้สตินำวาจา', level: 'เมตตาในชีวิตประจำวัน · สตินำวาจา' },
        { icon: '🧠', name: 'ปัญญา — นั่งนิ่ง 3 นาที', action: 'นั่งนิ่ง 3 นาที ดูลมหายใจ ไม่ต้องคิดอะไร แค่รู้ตัวว่าหายใจเข้า-ออก จิตฟุ้งก็แค่กลับมา', why: 'การนั่งนิ่งช่วยปรับคลื่นสมอง เหมาะกับคนจิตกระจายที่ต้องการความชัดเจน', level: 'ปัญญาจักรวาล · กำหนดลมหายใจ' }
      ],
      weekChallenge: '🎯 แบบฝึก 7 วันธาตุลม:\nจันทร์: สอนความรู้ 1 เรื่องให้คนที่ต้องการ (การให้ปัญญา)\nอังคาร: นั่งสมาธิ 5 นาที กำหนดลมหายใจ\nพุธ: ก่อนพูดทุกครั้ง เว้น 1 ลมหายใจ\nพฤหัส: ถือจิตบริสุทธิ์ เต็มวัน + นั่งสมาธิ 5 นาที\nศุกร์: เลือก 1 เป้าหมาย ทำให้คืบหน้า ปิดสิ่งรบกวน 45 นาที\nเสาร์: ส่งพลังงานดีให้คนที่ขัดใจ 3 นาที\nอาทิตย์: นั่งสมาธิ 10 นาที + เขียนขอบคุณ 3 สิ่ง'
    },
    'ดิน': {
      title: '🪨 เหตุเสริมสำหรับธาตุดิน',
      subtitle: 'เปลี่ยนความแข็งแกร่งเป็นความยืดหยุ่น',
      steps: [
        { icon: '🍚', name: 'ทาน — ให้แรงกาย', action: 'ช่วยคนย้ายของ ทำความสะอาดวัด หรือช่วยงานจิตอาสา 1 อย่าง — ธาตุดินให้แรงกาย = ทานที่ใช้ร่างกายเป็นเครื่องมือ', why: 'แรงกายทาน = ใช้ร่างกายเป็นทาน ได้พลังงานทั้งกายและใจ', level: 'การให้วัตถุ (แรงกาย) · ผู้ที่รับใช้ชุมชน' },
        { icon: '🙏', name: 'จิตบริสุทธิ์ + ตื่นเช้า 7 วัน', action: 'รักษาจิตบริสุทธิ์ทุกวัน — แล้วตื่นก่อน 6 โมงเช้า 7 วันติด วันที่จิตเข้มข้นถัดไป ' + nextWanPhra.dateStr + ' ตั้งจิตเข้มข้น', why: 'ดินมั่นคง = วินัย ตื่นเช้า = สร้างความสม่ำเสมอ ตั้งจิตเข้มข้น วันที่จิตเข้มข้น = พลังงานทวีคูณ', level: 'รักษาจิตบริสุทธิ์ทุกวัน + วินัย 7 วัน + ตั้งจิตเข้มข้น วันที่จิตเข้มข้น' },
        { icon: '💛', name: 'เมตตา — ชม/ขอบคุณ 1 คน', action: 'ชมหรือขอบคุณคนใกล้ตัว 1 คน อย่างจริงใจวันนี้ — "ขอบคุณที่อยู่ข้างๆ" หรือ "วันนี้ทำดีมาก"', why: 'คนธาตุดินเก่งเรื่องแบก แต่ไม่เก่งเรื่องบอกรัก — เมตตาเริ่มจากคำพูดง่ายๆ', level: 'เมตตาในชีวิตประจำวัน · แสดงความรักก่อนสาย' },
        { icon: '🧠', name: 'ปัญญา — เดินช้าๆ มีสติ 10 นาที', action: 'เดินช้าๆ รู้สึกเท้าแตะพื้น ทีละก้าว 10 นาที — ไม่คิดเรื่องงาน แค่รู้ว่าเดิน', why: 'การเดินอย่างมีสติช่วยให้จิตนิ่ง เหมาะกับคนธาตุดินที่นั่งนิ่งยาก — รู้สึกเท้าแตะพื้นทีละก้าว', level: 'ปัญญาจักรวาล · เดินมีสติ' }
      ],
      weekChallenge: '🎯 แบบฝึก 7 วันธาตุดิน:\nจันทร์: มอบหมายงาน 1 อย่างที่เคยแบกคนเดียว\nอังคาร: ตื่นก่อน 6 โมงเช้า + ส่งพลังงานดีให้ตัวเอง 3 นาที\nพุธ: ช่วยคนย้ายของหรือทำความสะอาด 1 อย่าง (ทานแรงกาย)\nพฤหัส: ถือจิตบริสุทธิ์ เต็มวัน + ชม/ขอบคุณคนใกล้ตัว 1 คน\nศุกร์: เดินช้าๆ มีสติ 10 นาที รู้สึกเท้าแตะพื้น\nเสาร์: นั่งสมาธิ 5 นาที กำหนดลมหายใจ\nอาทิตย์: ส่งพลังงานดีออกไปทั่วทุกทิศ + เขียนขอบคุณ 3 สิ่ง'
    }
  };

  var vinai = VINAI[p.el] || VINAI['ไฟ'];
  // Add structured days array for the 7-day challenge (dharma-style rendering)
  vinai.days = [
    { day: 'จันทร์', action: vinai.weekChallenge.split('\n')[1].replace('จันทร์: ', '') },
    { day: 'อังคาร', action: vinai.weekChallenge.split('\n')[2].replace('อังคาร: ', '') },
    { day: 'พุธ', action: vinai.weekChallenge.split('\n')[3].replace('พุธ: ', '') },
    { day: 'พฤหัสบดี', action: vinai.weekChallenge.split('\n')[4].replace('พฤหัส: ', '') },
    { day: 'ศุกร์', action: vinai.weekChallenge.split('\n')[5].replace('ศุกร์: ', '') },
    { day: 'เสาร์', action: vinai.weekChallenge.split('\n')[6].replace('เสาร์: ', '') },
    { day: 'อาทิตย์', action: vinai.weekChallenge.split('\n')[7].replace('อาทิตย์: ', '') }
  ];

  var html = '<div class="ausp-vinai-card">'
    + '<div class="avc-header">'
    + '<div class="avc-title">' + vinai.title + '</div>'
    + '<div class="avc-subtitle">' + vinai.subtitle + '</div>'
    + '</div>';

  vinai.steps.forEach(function(step) {
    html += '<div class="avc-step">'
      + '<div class="avc-step-icon">' + step.icon + '</div>'
      + '<div class="avc-step-content">'
      + '<div class="avc-step-name">' + step.name + '</div>'
      + '<div class="avc-step-action">' + step.action + '</div>'
      + '<div class="avc-step-why">เหตุผล: ' + step.why + '</div>'
      + (step.level ? '<div class="avc-step-level">📿 ' + step.level + '</div>' : '')
      + '</div></div>';
  });

  // ===== แบบฝึก 7 วัน — สไตล์ธรรมทาน =====
  // แต่ละวันเป็น card ย่อย น่าเชื่อถือและน่าอ่าน
  var daysHtml = '';
  var dayIcons = ['🌄','🌞','🌤','🌅','🌇','🌙','✨'];
  vinai.days.forEach(function(d, i) {
    daysHtml += '<div class="avc-day-compact">'
      + '<div class="avc-day-num">' + dayIcons[i] + ' ' + (i + 1) + '</div>'
      + '<div class="avc-day-content">'
      + '<div class="avc-day-label">' + d.day + '</div>'
      + '<div class="avc-day-action">' + d.action + '</div>'
      + '</div></div>';
  });

  var elName = p.el || 'ธาตุ';
  html += '<div class="avc-challenge">'
    + '<div class="avc-challenge-title">🪷 แบบฝึก 7 วัน ' + elName + '<span>เริ่มจากวันนี้ — ทำวันละนิด</span></div>'
    + '<div class="avc-dharma-blessing">"การฝึกตนครั้งละ 7 วัน คือเมล็ดพันธุ์แห่งความดีที่จะเบ่งบานในชีวิต"</div>'
    + '<div class="avc-days-grid">' + daysHtml + '</div>'
    + '<div class="avc-dharma-seal">🙏 ขอให้เจริญในธรรม พบความสงบและพลังที่แท้จริง</div>'
    + '</div>'
    + '<div class="avc-ref">พลังงานจักรวาล 5 ระดับ — ให้ → รักษา → ส่งพลังดี → เข้าใจ → ตื่นรู้</div>'
    + '</div>';
  return html;
}

function resetM(mode){
  var fc=['fc0','fc1','fc2'][mode], r=['r0','r1','r2'][mode];
  if (document.body && document.body.classList) document.body.classList.remove('has-report');

  // ✨ Smooth transition: fade out report first
  var reportEl = document.getElementById(r);
  reportEl.style.transition = 'opacity .3s ease, transform .3s ease';
  reportEl.style.opacity = '0';
  reportEl.style.transform = 'translateY(10px)';

  setTimeout(function(){
    reportEl.innerHTML='';
    reportEl.style.opacity = '';
    reportEl.style.transform = '';
    reportEl.style.transition = '';

    // Show form with fade-in
    var formCard = document.getElementById(fc);
    formCard.style.opacity = '0';
    formCard.style.transition = 'opacity .4s ease';
    formCard.style.display='block';
    requestAnimationFrame(function(){
      formCard.style.opacity = '1';
    });

    setTimeout(function(){
      formCard.style.opacity = '';
      formCard.style.transition = '';
    }, 400);

    scrollTo({top:0,behavior:'smooth'});
  }, 300);
}

// ponytail: one clear path for all modes — wipe mode inputs + saved state, then show form
var CLEAR_FIELDS = [['n0','g0','d0','t0'],['n1a','g1a','d1a','t1a','n1b','g1b','d1b','t1b'],['n2','g2x','d2']];
function clearM(mode){
  var fields = CLEAR_FIELDS[mode] || [];
  for(var i=0;i<fields.length;i++){
    var el = document.getElementById(fields[i]);
    if(el) el.value = '';
  }
  try {
    var raw = localStorage.getItem('starvia_form_state_v1');
    if(raw){
      var s = JSON.parse(raw);
      for(var j=0;j<fields.length;j++){ delete s[fields[j]]; }
      localStorage.setItem('starvia_form_state_v1', JSON.stringify(s));
    }
  } catch(_){}
  resetM(mode);
}

// ===== Daily Reading Quota (12 ต.ค.69) =====
// ฟรีวันละ 3 ดวง (ทุกโหมดรวมกัน) พรีเมียมไม่จำกัด แชร์แลกเพิ่มได้สูงสุด +2/วัน
// pattern เดียวกับ tarot free tier (starvia_tarot_count)
var READ_FREE_PER_DAY = 3;
var READ_BONUS_PER_DAY = 2;
var READ_COUNT_KEY = 'starvia_read_count';

function readQuotaToday(){
  var d = new Date();
  var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  var data = { date: today, count: 0, bonus: 0 };
  try {
    var raw = localStorage.getItem(READ_COUNT_KEY);
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.date === today) {
        data.count = s.count | 0;
        data.bonus = Math.min(s.bonus | 0, READ_BONUS_PER_DAY);
      }
    }
  } catch (_) {}
  return data;
}

function getDailyReadCount(){ return readQuotaToday().count; }

function getRemainingReads(){
  var q = readQuotaToday();
  return Math.max(0, READ_FREE_PER_DAY + q.bonus - q.count);
}

function canReadFree(){ return getRemainingReads() > 0; }

function incrementDailyReadCount(){
  var q = readQuotaToday();
  q.count++;
  try { localStorage.setItem(READ_COUNT_KEY, JSON.stringify(q)); } catch (_) {}
  updateQuotaMeters();
}

function grantShareBonus(){
  var q = readQuotaToday();
  if (q.bonus >= READ_BONUS_PER_DAY) return false;
  q.bonus++;
  try { localStorage.setItem(READ_COUNT_KEY, JSON.stringify(q)); } catch (_) {}
  updateQuotaMeters();
  return true;
}

function updateQuotaMeters(){
  var left = getRemainingReads();
  var ids = ['q0', 'q1', 'q2'];
  for (var i = 0; i < ids.length; i++) {
    var el = (typeof document !== 'undefined') ? document.getElementById(ids[i]) : null;
    if (el) el.textContent = 'โควต้าดูฟรีวันนี้ เหลือ ' + left + '/' + READ_FREE_PER_DAY + ' ดวง';
  }
}

// การ์ดล็อกเมื่อโควต้าหมด — มีทางออก 2 ทาง (จ่าย / แชร์แลกเพิ่ม)
function renderQuotaLock(wrap){
  var bonusLeft = READ_BONUS_PER_DAY - readQuotaToday().bonus;
  wrap.innerHTML = '<div class="mc"><div class="mc-l">✦ โควต้าวันนี้หมดแล้ว ✦</div>'
    + '<div class="mc-t">"ดวงของคุณมีค่า อย่าใช้หมดในวันเดียว"</div>'
    + '<p style="font-size:14px;line-height:1.9;color:var(--tx2)">วันนี้ดูครบ ' + READ_FREE_PER_DAY + ' ดวงแล้ว กลับมาใหม่พรุ่งนี้ หรือปลดล็อกดูไม่จำกัด</p>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">'
    + '<button class="rbtn rbtn-clear" data-action="open-payment">✦ ปลดล็อกไม่จำกัด 199/เดือน</button>'
    + (bonusLeft > 0 ? '<button class="rbtn" data-action="quota-share">📤 แชร์แลกดูเพิ่ม (เหลือ ' + bonusLeft + ')</button>' : '')
    + '</div></div>';
  if (typeof CardMenu !== 'undefined' && CardMenu.build) { try { CardMenu.build(wrap.id); } catch (_) {} }
}

// ═══ Lottery Results Card ═══
function loadLotteryResults(){
  var section = document.getElementById('lottery-results-section');
  if(!section) return;
  section.innerHTML = '<div class="lottery-loading">🎰 กำลังโหลดผลสลาก...</div>';
  var apiBase = (window.STARVIA_CONFIG && window.STARVIA_CONFIG.apiBaseUrl) || '/v1';
  fetch(apiBase + '/lottery/results')
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data || !data.available || !data.firstPrize){
        var now = new Date(), day = now.getDate(), h = now.getHours();
        if((day === 1 || day === 16) && h >= 16){
          section.innerHTML = '<div class="lottery-waiting">'
            + '<div class="lottery-header">🎰 ผลสลากกินแบ่งรัฐบาล</div>'
            + '<p style="text-align:center;color:var(--tx2);font-size:13px;padding:14px;">⏳ กำลังรอผลการออกรางวัล... ระบบจะอัปเดตให้อัตโนมัติ</p></div>';
          setTimeout(loadLotteryResults, 30000);
        } else {
          section.innerHTML = '<div class="lottery-empty">'
            + '<div class="lottery-header">🎰 ผลสลากกินแบ่งรัฐบาล</div>'
            + '<p style="text-align:center;color:var(--tx2);font-size:13px;padding:14px;">ยังไม่มีผลหวยงวดล่าสุด — รออัปเดตเมื่อมีการออกรางวัล</p></div>';
        }
        return;
      }
      var dd = data.displayDate || {};
      var yr = dd.year ? (parseInt(dd.year,10)+543) : '';
      var dateStr = (dd.date||'')+'/'+(dd.month||'')+'/'+yr;
      var html = '<div class="lottery-card">'
        + '<div class="lottery-header">🎰 ผลสลากกินแบ่งรัฐบาล</div>'
        + '<div class="lottery-date">งวดวันที่ ' + dateStr + '</div>'
        + '<div class="lottery-prize first-prize">'
        + '<div class="lp-label">รางวัลที่ 1</div>'
        + '<div class="lp-number">' + data.firstPrize + '</div>'
        + '<div class="lp-amount">6,000,000 บาท</div></div>'
        + '<div class="lottery-grid">'
        + '<div class="lottery-sub"><span class="ls-label">เลขหน้า 3 ตัว</span><span class="ls-nums">' + (data.last3f||[]).join(' · ') + '</span></div>'
        + '<div class="lottery-sub"><span class="ls-label">เลขท้าย 3 ตัว</span><span class="ls-nums">' + (data.last3b||[]).join(' · ') + '</span></div>'
        + '<div class="lottery-sub"><span class="ls-label">เลขท้าย 2 ตัว</span><span class="ls-nums">' + (data.last2||[]).join(' · ') + '</span></div></div>'
        + '<div class="lottery-note">ข้อมูลจากสำนักงานสลากกินแบ่งรัฐบาล</div></div>';
      section.innerHTML = html;
    })
    .catch(function(){ section.innerHTML = ''; });
}

// Auto-load after report renders
(function(){
  var _origRenderInd = window.renderInd;
  if(typeof renderInd === 'function'){
    renderInd = function(){
      _origRenderInd.apply(this, arguments);
      setTimeout(loadLotteryResults, 600);
    };
  }
})();
