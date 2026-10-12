// Shared reading helpers for STARVIA renderers.
// Loaded after data/thai-astrology-content.js and before astro-renderers.js.
function escapeHTML(value){
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== Cosmic zodiac icons (STARVIA brand style) =====
// Used by both renderer-individual.js and renderer-couple.js.
// RASI_EN_NAMES[i] must match the rashi index from getRasi() (0-11).
var RASI_EN_NAMES = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
function rasiIconUrl(idx) {
  var num = String(idx + 1).padStart(2, '0');
  return 'assets/zodiac/' + num + '-' + (RASI_EN_NAMES[idx] || 'aries') + '.svg?v=2';
}
function rasiIconHtml(idx, name, size) {
  size = size || 40;
  return '<img class="rasi-icon" src="' + rasiIconUrl(idx) + '" width="' + size + '" height="' + size + '" alt="' + (name || '') + '" loading="lazy">';
}

var FALLBACK_KARMA_MIRROR = {
  intro: 'กระจกกรรมไม่ใช่คำตัดสิน แต่คือรูปแบบที่ชีวิตมักพาคุณกลับมาเรียนรู้ซ้ำ เพื่อให้คุณเลือกทางใหม่ได้ชัดขึ้น',
  elements: {
    'ไฟ': { pattern: 'พลังใจร้อนและการเร่งตัดสินใจ', lesson: 'ใช้ความกล้าอย่างมีสติ', action: 'หยุด 3 ลมหายใจก่อนตัดสินใจเรื่องสำคัญ', ritual: 'ตั้งเจตนาว่าใช้พลังเพื่อสร้าง ไม่ใช่เพื่อเอาชนะ' }
  },
  weekdayShadows: ['เงาของวันเกิดคือรูปแบบเดิมที่รอให้คุณมองเห็นและเลือกต่างจากเดิม']
};

function buildKarmaMirror(p, dayOfWeek){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var km = content && content.karmaMirror ? content.karmaMirror : FALLBACK_KARMA_MIRROR;
  var elements = km.elements || FALLBACK_KARMA_MIRROR.elements;
  var weekdayShadows = km.weekdayShadows || FALLBACK_KARMA_MIRROR.weekdayShadows;
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var element = elements[elementKey] || elements['ไฟ'] || FALLBACK_KARMA_MIRROR.elements['ไฟ'];
  var shadow = weekdayShadows[dayOfWeek] || weekdayShadows[0] || FALLBACK_KARMA_MIRROR.weekdayShadows[0];

  return {
    title: 'กระจกกรรม',
    intro: km.intro || FALLBACK_KARMA_MIRROR.intro,
    pattern: element.pattern,
    lesson: element.lesson,
    weekdayShadow: shadow,
    action: element.action,
    ritual: element.ritual
  };
}

var FALLBACK_COUPLE_DHARMA = {
  intro: 'ดวงคู่คือแผนที่ความสัมพันธ์ที่ช่วยให้เห็นบทเรียนและวิธีดูแลกันให้ดีขึ้น',
  pairTypes: {
    supportive: { label: 'คู่เกื้อหนุน', title: 'คู่ที่ช่วยกันยกระดับชีวิต', meaning: 'มีพลังส่งเสริมกันและกัน', advice: 'วางเป้าหมายร่วมกัน' },
    mirror: { label: 'คู่กระจกใจ', title: 'คู่ที่สะท้อนเงาในใจ', meaning: 'สะท้อนบทเรียนและแผลเดิมของกันและกัน', advice: 'คุยกันด้วยความซื่อสัตย์' },
    fire: { label: 'คู่รักแรง', title: 'คู่ที่มีแรงดึงดูดสูง', meaning: 'เคมีแรงและปะทะง่าย', advice: 'พักก่อนคุยเมื่ออารมณ์ร้อน' },
    lesson: { label: 'คู่บทเรียน', title: 'คู่ที่มาเปิดบทเรียนสำคัญ', meaning: 'ความสัมพันธ์นี้สอนเรื่องขอบเขตและคุณค่า', advice: 'ทำข้อตกลงที่ปลอดภัย' },
    builder: { label: 'คู่สร้างฐาน', title: 'คู่ที่ค่อย ๆ สร้างชีวิตด้วยกัน', meaning: 'สร้างความมั่นคงระยะยาวได้ดี', advice: 'ดูแลแผนชีวิตและหน้าที่ร่วมกัน' }
  }
};

function getCoupleDharmaType(total, elS, sameElement){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var dharma = content && content.coupleDharma ? content.coupleDharma : FALLBACK_COUPLE_DHARMA;
  var pairTypes = dharma.pairTypes || FALLBACK_COUPLE_DHARMA.pairTypes;
  var key;

  if (total >= 90 || (total >= 86 && elS >= 82)) {
    key = 'supportive';
  } else if (sameElement && total >= 65) {
    key = 'mirror';
  } else if (elS >= 88 && total >= 65) {
    key = 'fire';
  } else if (total < 60 || elS < 55) {
    key = 'lesson';
  } else {
    key = 'builder';
  }

  var selected = pairTypes[key] || pairTypes.builder || FALLBACK_COUPLE_DHARMA.pairTypes.builder;
  return {
    key: key,
    label: selected.label,
    title: selected.title,
    meaning: selected.meaning,
    advice: selected.advice,
    intro: dharma.intro || FALLBACK_COUPLE_DHARMA.intro
  };
}

var FALLBACK_LIFE_DOMAIN_FORECAST = {
  domains: [
    { key: 'luck', label: 'โชค', subtitle: 'จังหวะโอกาส', icon: '✦' },
    { key: 'money', label: 'การเงิน', subtitle: 'ทรัพย์สิน', icon: '💰' },
    { key: 'health', label: 'สุขภาพ', subtitle: 'พลังชีวิต', icon: '🫀' },
    { key: 'relationship', label: 'ความสัมพันธ์', subtitle: 'คู่ครอง / ครอบครัว', icon: '♡' },
    { key: 'career', label: 'การงาน', subtitle: 'ชื่อเสียง / ความก้าวหน้า', icon: '◈' },
    { key: 'supporters', label: 'บริวาร', subtitle: 'ทีม / ผู้สนับสนุน', icon: '♟' }
  ],
  domainThemes: {
    luck: { current: 'จังหวะโชคลอยและลาภลอยกำลังเปิดจากโอกาสเล็ก ๆ ที่ต้องใช้สติ', warning: 'อย่าเสี่ยงเกินงบหรือหวังผลเร็ว', remedy: 'ตั้งงบเสี่ยงโชคที่เสียได้จริง แล้วใช้สี/เลขเสริมดวงเป็นตัวช่วยเล็ก ๆ' }
  },
  elementGuidance: {
    'ไฟ': { tone: 'พลังไฟเปิดทางผ่านความกล้า', warning: 'ระวังใจร้อน', remedy: 'หยุด 3 ลมหายใจก่อนตัดสินใจ' }
  },
  ageBandOpportunities: {}
};

function formatDomainAgeRange(band){
  if (!band) return 'ช่วงอายุถัดไป';
  if (band.to >= 120) return band.from + ' ปีขึ้นไป';
  return band.from + '–' + band.to + ' ปี';
}

function buildLifeDomainMatrix(p, r, l, currentBand, nextBands){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var cfg = content && content.lifeDomainForecast ? content.lifeDomainForecast : FALLBACK_LIFE_DOMAIN_FORECAST;
  var domains = cfg.domains || FALLBACK_LIFE_DOMAIN_FORECAST.domains;
  var themes = cfg.domainThemes || FALLBACK_LIFE_DOMAIN_FORECAST.domainThemes;
  var ageOps = cfg.ageBandOpportunities || {};
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var element = (cfg.elementGuidance && (cfg.elementGuidance[elementKey] || cfg.elementGuidance['ไฟ'])) || FALLBACK_LIFE_DOMAIN_FORECAST.elementGuidance['ไฟ'];
  var activeBand = currentBand || { key: 'build', from: 29, to: 35, title: 'สร้างฐานมั่นคง' };
  var upcomingBands = (nextBands && nextBands.length ? nextBands : []).slice(0, 2);
  if (!upcomingBands.length) upcomingBands = [activeBand];

  return {
    title: 'คัมภีร์แก้ดวง 6 ด้าน',
    intro: 'อ่านสถานการณ์ปัจจุบัน วิธีเสริมให้ดีขึ้น และโอกาสที่จะเปิดตามช่วงอายุ โดยผสานธาตุชีวิต ดาวเจ้าชะตา ราศี ลัคนา และจังหวะวัยปัจจุบัน',
    elementSummary: element.tone,
    currentAgeRange: formatDomainAgeRange(activeBand),
    domains: domains.map(function(domain){
      var theme = themes[domain.key] || themes.luck || FALLBACK_LIFE_DOMAIN_FORECAST.domainThemes.luck;
      var opportunities = upcomingBands.map(function(band){
        var bandMap = ageOps[band.key] || {};
        return {
          ageRange: formatDomainAgeRange(band),
          title: band.title || 'ช่วงอายุถัดไป',
          text: bandMap[domain.key] || ('โอกาสด้าน' + domain.label + 'จะเปิดเมื่อใช้บทเรียนของช่วงวัยนี้ให้ถูกทาง')
        };
      });
      return {
        key: domain.key,
        label: domain.label,
        subtitle: domain.subtitle,
        icon: domain.icon || '✦',
        current: theme.current + ' · ตอนนี้อยู่ในช่วง ' + formatDomainAgeRange(activeBand) + ' (' + (activeBand.title || 'จังหวะชีวิตปัจจุบัน') + ') ' + element.tone,
        warning: theme.warning + ' · ' + element.warning,
        remedy: theme.remedy + ' · ' + element.remedy,
        opportunities: opportunities
      };
    })
  };
}

var THAI_MONTH_NAMES = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

var FALLBACK_MONTHLY_LIFE_MAP = {
  domains: [
    { key: 'career', label: 'การงาน', icon: '◈', teaser: 'เลือกงานหลักแล้วปิดให้เห็นผล' },
    { key: 'money', label: 'การเงิน', icon: '💰', teaser: 'วางระบบเงินให้ชัด' },
    { key: 'windfall', label: 'โชคลอย / ลาภลอย', icon: '🎲', teaser: 'ลาภลอยมาจากจังหวะสั้น ๆ แต่ต้องไม่เสี่ยงเกินงบ' },
    { key: 'relationship', label: 'ความรัก', icon: '♡', teaser: 'คุยด้วยความจริงใจและมีขอบเขต' },
    { key: 'health', label: 'สุขภาพ', icon: '🫀', teaser: 'พักให้พอและดูแล routine เล็ก ๆ' }
  ],
  elementGuidance: {
    'ไฟ': { focus: 'ลงมือเรื่องสำคัญ', warning: 'ระวังใจร้อน', action: 'เลือกเป้าหมายหลักหนึ่งเรื่อง' }
  },
  weeklyThemes: [
    { title: 'สัปดาห์ที่ 1 · ตั้งเจตนา', brief: 'ตั้งเป้าหมายเดือนนี้' },
    { title: 'สัปดาห์ที่ 2 · เร่งจังหวะ', brief: 'ลงมือกับงานหลัก' },
    { title: 'สัปดาห์ที่ 3 · ปรับสมดุล', brief: 'ทบทวนและปรับแผน' },
    { title: 'สัปดาห์ที่ 4 · เก็บเกี่ยว', brief: 'ปิดงานและสรุปบทเรียน' }
  ],
  rituals: ['เขียนเป้าหมายเดือนนี้','เคลียร์พื้นที่','เลือกสีมงคล','ขอบคุณผู้สนับสนุน','พักใจ','จดบทเรียน','ตั้งเจตนาเดือนถัดไป'],
  activityLabels: { career: 'งาน/โปรเจกต์', money: 'เงิน/ลงทุน', love: 'รัก/ความสัมพันธ์', rest: 'พัก/เคลียร์ใจ', caution: 'วันที่ควรระวัง' }
};

function getDaysInMonth(year, monthIndex){
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampMonthlyScore(value){
  return Math.max(55, Math.min(99, value));
}

function buildMonthlyDayAdvice(tone, label){
  if (tone === 'caution') return 'วันนี้ควรชะลอเรื่องใหญ่ อ่านรายละเอียดซ้ำ และอย่ารีบตอบตกลงทันที';
  if (tone === 'career') return 'วันนี้ควรเลือกงานสำคัญ 1 เรื่อง แล้วทำให้มีความคืบหน้าชัดเจน';
  if (tone === 'money') return 'วันนี้ควรตรวจเงินเข้าออก แยกเงินจำเป็น และค่อยตัดสินใจเรื่องลงทุน';
  if (tone === 'love') return 'วันนี้ควรคุยด้วยน้ำเสียงนุ่มนวล ถามให้ชัด และอย่าเดาใจแทนกัน';
  if (tone === 'rest') return 'วันนี้ควรพักใจ เคลียร์พื้นที่เล็ก ๆ และอย่าฝืนใช้พลังเกินจำเป็น';
  return 'วันนี้ควรใช้จังหวะนี้กับ' + label + 'แบบค่อยเป็นค่อยไป';
}

function padLuckyNumber(value){
  var normalized = Math.abs(parseInt(value, 10) || 0) % 100;
  return normalized < 10 ? ('0' + normalized) : String(normalized);
}

function buildWindfallLuckGuide(p, birthDate, dayOfWeek){
  var birth = birthDate ? new Date(birthDate) : new Date();
  var bornDay = birth && !isNaN(birth.getTime()) ? birth.getDate() : 1;
  var bornMonth = birth && !isNaN(birth.getTime()) ? birth.getMonth() + 1 : 1;
  var planetIndex = p && typeof p.ei === 'number' ? p.ei : 0;
  var weekday = typeof dayOfWeek === 'number' ? dayOfWeek : (birth && !isNaN(birth.getTime()) ? birth.getDay() : 0);
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var planetName = p && p.n ? p.n : 'ดาวเจ้าชะตา';
  var elementMap = {
    'ไฟ': { direction: 'ทิศตะวันออก', time: 'หลังพระอาทิตย์ขึ้นถึง 09:09 น.', omen: 'เลขจากไฟ แสง ป้ายสีแดง รถสีสว่าง หรือเลขที่เห็นตอนกำลังรีบ', offering: 'แสงไฟอุ่น ๆ หรือเทียนสีขาว 1 ดวง' },
    'ดิน': { direction: 'ทิศตะวันออกเฉียงเหนือ', time: 'ช่วง 08:08–10:10 น.', omen: 'เลขบ้าน ที่ดิน ใบเสร็จ ของหนัก ของเก่า หรือเลขที่เจอในที่ทำงาน', offering: 'เหรียญ 9 บาทหรือข้าวสารหยิบมือเล็ก ๆ' },
    'ลม': { direction: 'ทิศเหนือ', time: 'ช่วง 11:11–13:13 น.', omen: 'เลขจากแชต เบอร์โทร ป้ายรถ ข่าวบอกต่อ หรือเลขที่ได้ยินซ้ำสองครั้ง', offering: 'น้ำเปล่า 1 แก้วและการพูดดี 1 ประโยคก่อนออกจากบ้าน' },
    'น้ำ': { direction: 'ทิศตะวันตก', time: 'ช่วง 18:18–21:21 น.', omen: 'เลขจากความฝัน น้ำ ฝน กระจก เพลง หรือชื่อคนที่แวบเข้ามาในใจ', offering: 'น้ำสะอาด 1 แก้ว วางไว้ 9 นาทีแล้วอธิษฐานเงียบ ๆ' }
  };
  var profile = elementMap[elementKey] || elementMap['ไฟ'];
  var base = bornDay + (bornMonth * 3) + ((planetIndex + 1) * 7) + weekday;
  var luckyNumbers = [
    padLuckyNumber(base),
    padLuckyNumber((bornDay * 2) + bornMonth + planetIndex + 9),
    padLuckyNumber((base + bornDay + (weekday * 11)))
  ];

  return {
    title: 'สูตรเปิดดวงลาภลอย',
    subtitle: 'กิมมิกสายมูสำหรับหวย ลอตเตอรี่ และตัวเลขที่ควรลองแบบพอดีมือ',
    luckyNumbers: luckyNumbers,
    lotteryFocus: 'หวย / ลอตเตอรี่: ให้ลองจับคู่เลขชุดแรกกับเลขที่เจอซ้ำในชีวิตจริง อย่าซื้อเพราะโลภ ให้ซื้อเพราะเลขนั้นสะดุดใจแล้วใจนิ่ง',
    sacredTime: profile.time,
    direction: profile.direction,
    omen: profile.omen,
    ritualSteps: [
      'หันหน้าไปทาง' + profile.direction + ' วาง ' + profile.offering + ' แล้วตั้งนะโม 3 จบ',
      'เขียนเลข ' + luckyNumbers.join(' · ') + ' ลงกระดาษเล็ก ๆ พับเข้าหาตัว 3 ครั้ง แล้วพูดว่า “สาธุ ขอให้โชคที่เป็นของข้าพเจ้าเปิดทางมาอย่างปลอดภัย”',
      'ก่อนซื้อ ให้ตั้งงบก่อนเสี่ยง ห้ามเพิ่มเงินตามอารมณ์ ถ้าใจร้อนให้หยุดทันที ถือว่าเจ้าที่เจ้าทางเตือนแล้ว'
    ],
    mantra: 'โอม ศรีโชค ลาภะ มหาเฮง ' + planetName + ' เปิดทางทรัพย์ สาธุ',
    avoid: 'งดซื้อเพราะประชดชีวิต งดตามเลขคนอื่นทั้งชุด และงดทุ่มเงินเกินงบ เพราะดวงเฮงชอบคนใจนิ่ง ไม่ชอบคนใจร้อน'
  };
}

// วันที่จิตเข้มข้น — Days of heightened spiritual energy based on Thai lunar calendar
// ขึ้น 8 ค่ำ, ขึ้น 15 ค่ำ (full moon), แรม 8 ค่ำ, แรม 14 ค่ำ (new moon)
// Approximate: every ~7.4 days. We use a known anchor + cycle.
function getNextWanPhra(fromDate){
  var THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  // Known Wan Phra anchor: 2026-06-03 (ขึ้น 8 ค่ำ เดือน 7)
  var anchor = new Date(2026, 5, 3); // June 3, 2026
  var cycle = 7.38; // approximate days between Wan Phra
  var d = fromDate || new Date();
  // Find next Wan Phra from today
  var diff = (d.getTime() - anchor.getTime()) / (1000*60*60*24);
  var cyclesAhead = Math.ceil(diff / cycle);
  var nextDate = new Date(anchor.getTime() + cyclesAhead * cycle * 24*60*60*1000);
  // If still in the past, go one more
  if (nextDate <= d) nextDate = new Date(nextDate.getTime() + cycle * 24*60*60*1000);
  var dayIdx = nextDate.getDay();
  var dateStr = nextDate.getDate() + ' ' + (THAI_MONTH_NAMES[nextDate.getMonth()] || '') + ' ' + (nextDate.getFullYear() + 543);
  return { date: nextDate, dateStr: dateStr, dayName: THAI_DAYS[dayIdx] };
}

function buildMonthlyLifeMap(p, r, l, birthDate, today){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var cfg = content && content.monthlyLifeMap ? content.monthlyLifeMap : FALLBACK_MONTHLY_LIFE_MAP;
  var now = today || new Date();
  var year = now.getFullYear();
  var monthIndex = now.getMonth();
  var monthName = THAI_MONTH_NAMES[monthIndex] || '';
  var buddhistYear = year + 543;
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var guide = (cfg.elementGuidance && (cfg.elementGuidance[elementKey] || cfg.elementGuidance['ไฟ'])) || FALLBACK_MONTHLY_LIFE_MAP.elementGuidance['ไฟ'];
  var daysInMonth = getDaysInMonth(year, monthIndex);
  var bornDay = birthDate ? new Date(birthDate).getDate() : 1;
  if (!bornDay || isNaN(bornDay)) bornDay = 1;
  var planetIndex = p && typeof p.ei === 'number' ? p.ei : 0;
  var labels = cfg.activityLabels || FALLBACK_MONTHLY_LIFE_MAP.activityLabels;
  var calendarDays = [];
  var activityKeys = ['career', 'money', 'love', 'rest'];

  for (var d = 1; d <= daysInMonth; d++) {
    var seed = (d + bornDay + planetIndex + monthIndex) % 9;
    var key = activityKeys[(d + planetIndex + monthIndex) % activityKeys.length];
    var tone = seed === 0 || seed === 4 ? 'caution' : key;
    if (d % 10 === 0) tone = 'caution';
    calendarDays.push({
      day: d,
      tone: tone,
      label: labels[tone] || labels[key] || 'จังหวะชีวิต',
      text: tone === 'caution' ? 'ชะลอการตัดสินใจใหญ่และทบทวนข้อมูลให้ครบ' : 'เหมาะกับ' + (labels[key] || 'เรื่องสำคัญ'),
      simpleText: tone === 'caution'
        ? 'วันนี้เหมาะกับการทบทวน ไม่ควรรีบตัดสินใจเรื่องใหญ่'
        : 'วันนี้เหมาะกับ' + (labels[key] || 'เรื่องสำคัญ') + ' เพราะพลังเดือนนี้ช่วยให้เรื่องนี้เดินง่ายขึ้น',
      advice: buildMonthlyDayAdvice(tone, labels[key] || 'เรื่องสำคัญ')
    });
  }

  var freeDays = calendarDays.filter(function(day){ return day.tone !== 'caution'; }).slice(0, 3);
  if (freeDays.length < 3) freeDays = calendarDays.slice(0, 3);

  return {
    title: 'แผนที่ชีวิตรายเดือน STARVIA · ' + monthName + ' ' + buddhistYear,
    monthName: monthName,
    year: buddhistYear,
    elementFocus: guide.focus,
    elementWarning: guide.warning,
    elementAction: guide.action,
    domains: (cfg.domains || FALLBACK_MONTHLY_LIFE_MAP.domains).map(function(domain, index){
      var personalSeed = bornDay * 13 + (monthIndex + 1) * 17 + (planetIndex + 1) * 19 + index * 23 + elementKey.charCodeAt(0);
      var score = clampMonthlyScore(58 + (personalSeed % 38));
      var domainForecasts = {
        career: [
          'ดาวเสาร์เล็งเรือนกัมมะ — เดือนนี้งานจะทดสอบความอดทน แต่ถ้าผ่านไปได้ ผลลัพธ์จะยั่งยืนกว่าที่คิด',
          'ดาวพฤหัสหนุนเรือนการงาน — โอกาสมาจากผู้ใหญ่หรือคนที่ไม่คาดคิด อย่าปิดประตู',
          'จังหวะดาวเปลี่ยน เรื่องงานที่เคยนิ่งจะขยับ ให้เตรียมข้อมูลให้พร้อมก่อนรับโอกาส',
          'เรือนศุภะส่องสว่าง — งานที่เกี่ยวกับต่างประเทศ ออนไลน์ หรือการเรียนรู้จะโดดเด่นเป็นพิเศษ'
        ],
        money: [
          'ดาวอังคารผ่านเรือนกดุมภะ — เงินจะขยับจากจุดเล็ก แต่ต้องระวังรายจ่ายฉุกเฉินที่ไม่คาดคิด',
          'จันทร์เต็มดวงในเรือนการเงิน — กระแสเงินจะไหลเข้าจากช่องทางที่เคยปิด ให้เปิดรับ',
          'ดาวศุกร์หนุน — เดือนนี้เงินจะมาจากความสัมพันธ์ การเจรจา หรือสิ่งที่ทำด้วยใจ',
          'เรือนลาภะมีดาวเล็ง — รายจ่ายที่ไม่จำเป็นจะโผล่มาให้เห็นชัด ตัดได้ตัดเลย อย่าเสียดาย'
        ],
        windfall: [
          'ลาภลอยมาแบบสั้น ๆ ถ้าเจอเลขซ้ำให้ลองดูสักครั้ง — ดาวลาภะเปิด',
          'โชคลอยมาจากที่ที่ไม่คาดคิด อย่ามองข้ามเรื่องเล็ก — จักรวาลกำลังส่งสัญญาณ',
          'เลขที่เจอซ้ำรอบตัวเดือนนี้มีความหมาย — จดไว้บ้าง ดาวกำลังกระซิบ',
          'เสี่ยงเล็กพอสนุกได้ แต่อย่าไล่ทุนถ้าพลาด — ตั้งลิมิตไว้'
        ],
        relationship: [
          'พูดตรงแต่ใจเย็นเข้าไว้ เดือนนี้ถ้อยคำมีพลังเป็นพิเศษ — ดาวศุกร์ส่งผล',
          'นัดคุยกันก่อนคิดแทนกัน หลายเรื่องแค่ถามก็จบ — จันทร์หนุนการสื่อสาร',
          'ลดคาดหวังที่ไม่เคยบอกออกไป แล้วจะเบาขึ้น — ดาวราหูเล็งเรือนคู่',
          'ถ้ามีเรื่องค้างคาใจ ปลายเดือนเหมาะจะเคลียร์ — ดาวเปลี่ยนจะเปิดทาง'
        ],
        health: [
          'พักให้เป็นเวลาขึ้นอีกนิด ร่างกายจะตอบแทนชัด — ดาวเสาร์เตือนเรื่องพักผ่อน',
          'อย่าฝืนถ้ารู้สึกไม่ไหว — พักก่อนค่อยลุยต่อ — ธาตุในตัวต้องสมดุล',
          'ทำ routine เล็ก ๆ ทุกวัน ดีกว่าโหมหนักแค่วันเดียว — ดาวพุธหนุนวินัย',
          'เดือนนี้สายตาและหลังต้องดูแลเป็นพิเศษ — ดาวอังคารส่งผลต่อกล้ามเนื้อ'
        ]
      };
      var domainActions = {
        career: [
          'นั่งนิ่งกำหนดลมหายใจ 3 นาทีก่อนเริ่มงานทุกวัน — สมาธิเพิ่มพลังงานและความชัดเจน',
          'ธรรมทาน: สอนความรู้ 1 เรื่องให้รุ่นน้อง/เพื่อนร่วมงาน — ธรรมทานชนะทานทั้งปวง',
          'ถือจิตบริสุทธิ์ + ไม่พูดไม่ดี 1 วัน — วาจาดีเปิดทางงาน',
          'ส่งพลังงานดีให้หัวหน้า/เพื่อนร่วมงานที่ขัดใจ 3 นาทีก่อนนอน — ลดเวร เปิดทางงาน'
        ],
        money: [
          'ให้อาหาร/น้ำดื่มกับคนที่ต้องการ 1 ครั้งวันนี้ — ทานเปิดกระแสทรัพย์ (ปัจจัย 4)',
          'จดรายจ่ายทุกวัน 7 วัน — สติเรื่องเงิน = ปัญญาเรื่องเงิน',
          'ถ้ามีของใหญ่อยากซื้อ รอ 7 วัน — ถือจิตบริสุทธิ์ ครบ 7 วันก่อนค่อยตัดสินใจ',
          'ส่งพลังงานดีให้ตัวเอง: "ขอให้ข้าพเจ้ามีทรัพย์เพียงพอ" — 3 นาทีก่อนนอน'
        ],
        windfall: [
          'ให้ทาน 1 อย่างก่อนเสี่ยง — การให้เปิดทางโชคลาภจากจักรวาล',
          'ตั้งงบเสี่ยงไว้ล่วงหน้า เมื่อถึงให้หยุดทันที — ศีลข้อ 5 รักษาสติ',
          'วันที่จิตเข้มข้นถัดไป ' + (typeof getNextWanPhra === 'function' ? getNextWanPhra(new Date()).dateStr : 'เช็คปฏิทิน') + ' — ตั้งจิตเข้มข้น + ให้ทาน พลังงาน 100 เท่า',
          'ถ้าฝันเห็นตัวเลข ให้จดไว้ก่อนตื่น แล้วทำบุญ 1 อย่างก่อนเสี่ยง'
        ],
        relationship: [
          'ส่งพลังงานดีให้คนรัก 3 นาทีก่อนนอน: "สุขิตา โหนตุ — ขอให้เขามีความสุข"',
          'ฟังก่อนตอบ หยุด 1 ลมหายใจก่อนพูด — สตินำวาจา ลดกรรมทางวาจา',
          'ถ้าขัดใจกัน ส่งพลังงานดีให้คนนั้น 3 นาที — ลดเวร เปิดทางรัก',
          'ชม/ขอบคุณคนใกล้ตัว 1 คนอย่างจริงใจวันนี้ — เมตตาเริ่มจากคำพูดง่ายๆ'
        ],
        health: [
          'นั่งนิ่งกำหนดลมหายใจ 5 นาทีก่อนนอน — การหายใจช้าๆ ช่วยให้จิตนิ่งและหลับลึก',
          'เดินช้าๆ 10 นาที — การเดินอย่างมีสติช่วยให้จิตนิ่ง รู้สึกเท้าแตะพื้นทีละก้าว',
          'นอนก่อน 4 ทุ่ม 7 วันติด — วินัย = ศีล ดูแลกาย = ดูแลธรรม',
          'ถือจิตบริสุทธิ์ เต็มวัน — ศีลคือรากฐานของสุขภาพทั้งกายและใจ'
        ]
      };
      var omenPool = {
        career: [
          'ถ้าเห็นนกบินผ่านหน้าต่างเช้าวันจันทร์ — งานจะมีข่าวดีภายในสัปดาห์',
          'ถ้ามีคนทักเรื่องงานโดยไม่ได้ถาม — ให้รับฟัง นั่นคือสัญญาณจากจักรวาล',
          'ความรู้สึกอยากเปลี่ยนแปลงแรงขึ้น — ให้ฟังเสียงข้างใน มันกำลังบอกทาง',
          'ถ้าเห็นเลข 1 หรือ 9 ซ้ำรอบตัว — โอกาสมาจากผู้ใหญ่หรือตำแหน่ง'
        ],
        money: [
          'ถ้าเห็นแบงค์ 500 ซ้ำ ๆ — แปลว่าเงินกำลังจะขยับ ให้เตรียมรับ',
          'ถ้ามีคนคืนเงินหรือของที่ยืมไป — กระแสเงินกำลังดี ให้เปิดรับ',
          'ความรู้สึกอยากจัดระเบียบเงินมาแรง — ให้ลงมือเลย ดาวหนุน',
          'ถ้าเห็นราคาหรือตัวเลขซ้ำรอบตัว — ให้จดไว้ มีความหมายซ่อนอยู่'
        ],
        windfall: [
          'ถ้าฝันเห็นตัวเลขชัดเจน — ให้จดไว้ก่อนตื่น จักรวาลกำลังกระซิบ',
          'ถ้าเจอเหรียญหรือแบงค์ตก — ให้เก็บไว้เป็นเคล็ด ลาภกำลังมา',
          'ความรู้สึกอยากเสี่ยงมาแรง — ให้ลองเล็ก ๆ แต่ต้องมีลิมิต',
          'ถ้ามีคนทักเรื่องโชคโดยไม่ได้ถาม — ให้ลองดู ดาวลาภะเปิด'
        ],
        relationship: [
          'ถ้ามีคนที่ไม่ได้คุยนานทักมา — ให้ตอบกลับ ดาวคู่กำลังขยับ',
          'ความรู้สึกอยากอยู่คนเดียวแรงขึ้น — ก็ไม่ผิด ดาวราหูเล็ง',
          'ถ้าเห็นคู่รักแสดงความรักต่อหน้า — แปลว่าความรักกำลังจะดี',
          'ถ้าทะเลาะกันเล็กน้อย — ให้ถอยออกมาคิดก่อน ดาวอารมณ์แรง'
        ],
        health: [
          'ถ้ารู้สึกเหนื่อยง่ายกว่าปกติ — ให้พักจริงจัง ร่างกายกำลังเตือน',
          'ความรู้สึกอยากออกกำลังกายมาแรง — ให้เริ่มเลย ดาวอังคารหนุน',
          'ถ้ามีอาการเตือนเล็ก ๆ — อย่าเพิกเฉย ดาวเสาร์กำลังบอก',
          'ถ้านอนหลับดีขึ้นเอง — แปลว่าร่างกายกำลังปรับตัว ธาตุสมดุล'
        ]
      };
      var planetNudges = ['ใช้จังหวะผู้นำ', 'ฟังความรู้สึกก่อน', 'ตัดสินใจให้คม', 'สื่อสารให้ครบ', 'ยึดหลักให้มั่น', 'เลือกความพอดี', 'ทำแบบมีวินัย'];
      var forecastPool = domainForecasts[domain.key] || [domain.teaser];
      var actionPool = domainActions[domain.key] || ['ตั้งเป้าหมายให้ชัดแล้วลงมือ'];
      var omenPoolForDomain = omenPool[domain.key] || ['สังเกตสิ่งรอบตัวให้ดี เดือนนี้มีสัญญาณ'];
      var forecast = forecastPool[personalSeed % forecastPool.length];
      var action = actionPool[(personalSeed + planetIndex) % actionPool.length];
      var omen = omenPoolForDomain[(personalSeed + index * 7) % omenPoolForDomain.length];
      var nudge = planetNudges[planetIndex % planetNudges.length] || guide.focus;
      var luckyDay = (personalSeed % 28) + 1;
      var phase = score >= 78 ? 'ขาขึ้น' : score >= 62 ? 'ทรงตัว' : 'ต้องระวัง';
      return {
        key: domain.key,
        label: domain.label,
        icon: domain.icon || '✦',
        score: score,
        teaser: forecast,
        forecast: forecast + ' — ' + nudge,
        action: action,
        goal: 'เลือก 1 ข้อของ' + domain.label + ' แล้วเช็กผลปลายสัปดาห์',
        omen: omen,
        luckyDay: luckyDay,
        phase: phase
      };
    }),
    calendarDays: calendarDays,
    freeDays: freeDays,
    weeklyBriefs: (cfg.weeklyThemes || FALLBACK_MONTHLY_LIFE_MAP.weeklyThemes).map(function(week, index){
      return {
        title: week.title,
        brief: week.brief + ' · โฟกัสส่วนตัว: ' + guide.focus,
        action: index === 0 ? 'ตั้งเป้า' : index === 1 ? 'ลงมือ' : index === 2 ? 'ปรับแผน' : 'สรุปผล'
      };
    }),
    rituals: (cfg.rituals || FALLBACK_MONTHLY_LIFE_MAP.rituals).slice(0, 7)
  };
}

function buildCoupleCompatibilityHtml(myElement) {
  if (typeof COUPLE_COMPATIBILITY === 'undefined') return '';
  var html = '<div class="cc-card">';
  html += '<div class="cc-title">✦ ตารางความเข้ากันได้ของธาตุ ✦</div>';
  html += '<div class="cc-subtitle" style="text-align:center;color:var(--tx2);font-size:12px;margin-bottom:12px">แตะเซลล์เพื่อดูรายละเอียด · เซลล์สีทอง = ธาตุของคุณ</div>';
  var elements = ['ไฟ','น้ำ','ลม','ดิน'];
  var elementEmoji = {'ไฟ':'🔥','น้ำ':'🌊','ลม':'💨','ดิน':'🌍'};
  // Header row
  html += '<table class="cc-table"><thead><tr><th></th>';
  elements.forEach(function(e) { html += '<th>' + (elementEmoji[e]||'') + ' ' + e + '</th>'; });
  html += '</tr></thead><tbody>';
  elements.forEach(function(e1) {
    html += '<tr><th>' + (elementEmoji[e1]||'') + ' ' + e1 + '</th>';
    elements.forEach(function(e2) {
      var key = e1 + '-' + e2;
      var pair = COUPLE_COMPATIBILITY[key];
      var word = pair ? (pair.love || '-') : '-';
      var isMyPair = (e1 === myElement || e2 === myElement);
      var cls = isMyPair ? 'cc-cell cc-highlight' : 'cc-cell';
      var title = pair ? (pair.love || '') + ' · ' + (pair.warning || '') + '\n' + (pair.meaning || '') : '';
      html += '<td class="' + cls + '" title="' + escapeHTML(title) + '" onclick="showCcDetail(this)" data-pair="' + key + '">' + escapeHTML(word) + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  // Detail panel (hidden by default, shown on click)
  html += '<div id="cc-detail-panel" class="cc-detail" style="display:none">';
  html += '<div class="cc-detail-title"></div>';
  html += '<div class="cc-detail-body"></div>';
  html += '<div class="cc-detail-close" onclick="closeCcDetail()">✕ ปิด</div>';
  html += '</div>';

  // Show user's element pairs detail below
  if (myElement) {
    html += '<div class="cc-my-pairs">';
    html += '<div class="cc-my-title">✨ ธาตุ ' + (elementEmoji[myElement]||'') + ' ' + myElement + ' เข้ากันกับธาตุไหน?</div>';
    elements.forEach(function(other) {
      if (other === myElement) return;
      var key1 = myElement + '-' + other;
      var key2 = other + '-' + myElement;
      var pair = COUPLE_COMPATIBILITY[key1] || COUPLE_COMPATIBILITY[key2];
      if (!pair) return;
      var scoreColor = pair.score >= 80 ? '#4CAF50' : pair.score >= 65 ? '#C9A227' : '#FF9800';
      html += '<div class="cc-pair-row">';
      html += '<div class="cc-pair-label">' + (elementEmoji[myElement]||'') + ' ' + myElement + ' × ' + (elementEmoji[other]||'') + ' ' + other + '</div>';
      html += '<div class="cc-pair-score" style="color:' + scoreColor + '">' + escapeHTML(pair.love || '') + '</div>';
      html += '<div class="cc-pair-meaning">' + escapeHTML(pair.meaning || '') + '</div>';
      if (pair.warning) html += '<div class="cc-pair-warning">⚠️ ' + escapeHTML(pair.warning) + '</div>';
      html += '<div class="cc-pair-advice">💡 ' + escapeHTML(pair.advice || '') + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// Click handler for detail popup
function showCcDetail(td) {
  var key = td.getAttribute('data-pair');
  if (!key || typeof COUPLE_COMPATIBILITY === 'undefined') return;
  var pair = COUPLE_COMPATIBILITY[key];
  if (!pair) return;
  var panel = document.getElementById('cc-detail-panel');
  if (!panel) return;
  var parts = key.split('-');
  var emoji1 = {'ไฟ':'🔥','น้ำ':'🌊','ลม':'💨','ดิน':'🌍'};
  panel.querySelector('.cc-detail-title').innerHTML = (emoji1[parts[0]]||'') + ' ' + parts[0] + ' × ' + (emoji1[parts[1]]||'') + ' ' + parts[1] + ' — ' + escapeHTML(pair.love || '');
  var body = '';
  body += '<div class="cc-d-row"><strong>💕 ความรัก:</strong> ' + escapeHTML(pair.love || '-') + '</div>';
  body += '<div class="cc-d-row"><strong>💼 งาน:</strong> ' + escapeHTML(pair.career || '-') + '</div>';
  body += '<div class="cc-d-row"><strong>🤝 เพื่อน:</strong> ' + escapeHTML(pair.friendship || '-') + '</div>';
  if (pair.warning) body += '<div class="cc-d-row cc-d-warn"><strong>⚠️ ระวัง:</strong> ' + escapeHTML(pair.warning) + '</div>';
  body += '<div class="cc-d-row cc-d-meaning">' + escapeHTML(pair.meaning || '') + '</div>';
  body += '<div class="cc-d-row cc-d-advice">💡 ' + escapeHTML(pair.advice || '') + '</div>';
  panel.querySelector('.cc-detail-body').innerHTML = body;
  panel.style.display = 'block';
}
function closeCcDetail() {
  var panel = document.getElementById('cc-detail-panel');
  if (panel) panel.style.display = 'none';
}
