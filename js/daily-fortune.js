// ===== PERSONALIZED DAILY FORTUNE ENGINE v2 =====
// Barnum Effect + Variable Reward + Personalization
// Uses birth data from onboarding to create "feels personal" daily fortunes
// Lucky numbers, colors, times are seeded → same user sees same result all day
// but different every day and different from other users

(function() {
  'use strict';

  // ===== CONSTANTS =====
  var STREAK_KEY = 'starvia_streak';
  var ONBOARDING_KEY = 'starvia_onboarding';

  // ===== ELEMENT DATA =====
  // Birth day-of-week → element (Thai astrology: นพเคราะห์)
  var DAY_ELEMENT = ['ไฟ','น้ำ','ไฟ','ลม','ดิน','น้ำ','ดิน']; // Sun=0..Sat=6
  var DAY_DEITY  = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  var DAY_PLANET = ['ดวงอาทิตย์','ดวงจันทร์','ดาวอังคาร','ดาวพุธ','ดาวพฤหัส','ดาวศุกร์','ดาวเสาร์'];

  // Element colors (Thai traditional)
  var ELEMENT_COLORS = {
    'ไฟ': { name: 'แดง-ส้ม', hex: '#E85D3A', accent: '#FFB84D' },
    'ดิน': { name: 'เหลือง-ทอง', hex: '#C9A227', accent: '#F5D76E' },
    'ลม':  { name: 'เขียว-ม่วง', hex: '#7B68EE', accent: '#98D8C8' },
    'น้ำ': { name: 'น้ำเงิน-เงิน', hex: '#4A90D9', accent: '#B8D4E3' }
  };

  // ===== POOLS =====

  // Personalized quotes — keyed by [birthElement][todayElement]
  // Each pool has 3 variants → seeded pick so same user sees same quote all day
  var QUOTES = {
    'ไฟ': {
      'ไฟ': [
        'วันนี้พลังธาตุไฟของคุณถูกจุดขึ้นอีกครั้ง — ดาวเจ้าชะตาส่งพลังตรงถึงกัน เหมาะกับการเริ่มสิ่งที่ค้างไว้',
        'ไฟในตัวคุณลุกโชนวันนี้ — ความมั่นใจที่เคยหายไปจะกลับมา เชื่อสัญชาตญาณตัวเอง',
        'ดาวธาตุไฟโคจรเสริมกัน — วันนี้คุณจะรู้สึกมีพลังเป็นพิเศษ ใช้มันให้คุ้ม'
      ],
      'น้ำ': [
        'ไฟกับน้ำมาบรรจบกันวันนี้ — ความรู้สึกจะนำทางเหตุผล ฟังเสียงหัวใจให้มากกว่าปกติ',
        'วันนี้ธาตุน้ำรอบตัวแรง — อาจมีอารมณ์ขึ้นลง แต่นั่นคือสัญญาณว่าคุณกำลังรู้สึกลึกซึ้งกับบางอย่าง',
        'ดาวน้ำกระทบธาตุไฟของคุณ — วันนี้เหมาะกับการพูดคุยเรื่องที่อึดอัดใจ'
      ],
      'ลม': [
        'ธาตุลมพัดผ่านธาตุไฟวันนี้ — ความคิดสร้างสรรค์จะพุ่งพล่าน จดไว้ก่อนจะลืม',
        'วันนี้ลมเติมไฟให้คุณ — แรงบันดาลใจจะมาจากทิศที่ไม่คาดคิด',
        'ดาวลมเสริมดาวไฟเจ้าชะตา — การสื่อสารวันนี้จะทรงพลังเป็นพิเศษ'
      ],
      'ดิน': [
        'ธาตุดินช่วยพยุงธาตุไฟวันนี้ — ความมั่นคงจะมาพร้อมกับความมุ่งมั่น',
        'วันนี้ดินช่วยกักเก็บพลังไฟ — ลงมือทำวันนี้ ผลลัพธ์จะยั่งยืน',
        'ดาวดินหนุนธาตุไฟของคุณ — ผู้ใหญ่หรือคนรอบข้างจะสนับสนุนสิ่งที่คุณทำ'
      ]
    },
    'น้ำ': {
      'ไฟ': [
        'วันนี้ไฟมาอุ่นน้ำในตัวคุณ — ความอ่อนโยนจะกลายเป็นพลังที่คนรอบข้างสัมผัสได้',
        'ธาตุไฟเข้ามาเติมความมั่นใจให้ธาตุน้ำ — วันนี้คุณจะกล้าพูดในสิ่งที่เก็บไว้',
        'ดาวไฟกระทบน้ำเจ้าชะตา — ความรู้สึกที่เคยซ่อนจะถูกปล่อยออกมาอย่างงดงาม'
      ],
      'น้ำ': [
        'น้ำสองสายไหลบรรจบ — วันนี้จิตใจจะสงบเป็นพิเศษ เหมาะกับการทบทวนและรักษาตัวเอง',
        'วันนี้ธาตุน้ำเสริมกัน — ความเห็นอกเห็นใจที่คุณมีจะนำพาโอกาสดี ๆ มาให้',
        'ดาวน้ำโคจรคู่กัน — สัญชาตญาณจะแม่นกว่าปกติ ฟังเสียงข้างในตัวเอง'
      ],
      'ลม': [
        'ลมพัดผิวน้ำวันนี้ — ความคิดจะแล่นฉิว เหมาะกับการเขียน วางแผน หรือเริ่มบทสนทนาใหม่',
        'ธาตุลมช่วยระเหยน้ำส่วนเกิน — ความกังวลที่เคยท่วมใจจะเบาลง',
        'ดาวลมเสริมน้ำเจ้าชะตา — การสื่อสารวันนี้จะอ่อนโยนและทรงพลัง'
      ],
      'ดิน': [
        'ดินช่วยกักเก็บน้ำวันนี้ — ความรู้สึกจะนิ่งขึ้น ไม่ไหลไปตามอารมณ์รอบข้าง',
        'ธาตุดินหนุนธาตุน้ำ — วันนี้เหมาะกับการจัดการเรื่องที่ค้างคาให้เป็นระบบ',
        'ดาวดินพยุงน้ำเจ้าชะตา — ความมั่นคงจะมาจากการลงมือทำ ไม่ใช่แค่คิด'
      ]
    },
    'ลม': {
      'ไฟ': [
        'ไฟเติมลมวันนี้ — ความคิดที่เคยหมุนวนจะมีทิศทางชัดเจนขึ้น',
        'ธาตุไฟจุดประกายธาตุลม — แรงบันดาลใจจะมาแบบไม่ทันตั้งตัว',
        'ดาวไฟเสริมลมเจ้าชะตา — วันนี้เหมาะกับการนำเสนอไอเดียที่เก็บไว้'
      ],
      'น้ำ': [
        'น้ำช่วยหล่อเลี้ยงธาตุลมวันนี้ — ความคิดจะลึกซึ้งขึ้น ไม่ใช่แค่เร็ว',
        'ธาตุน้ำกระทบธาตุลม — อารมณ์จะช่วยเติมสีสันให้ความคิดสร้างสรรค์',
        'ดาวน้ำหนุนลมเจ้าชะตา — วันนี้เหมาะกับการรับฟังคนรอบข้างมากกว่าพูด'
      ],
      'ลม': [
        'ลมสองสายพัดเสริมกัน — ความคิดจะแล่นเร็วกว่าปกติ จดไว้ก่อนจะปลิวหาย',
        'วันนี้ธาตุลมแรง — อาจรู้สึกกระจาย แต่ถ้าโฟกัสได้จะทำอะไรได้มากกว่าที่คิด',
        'ดาวลมโคจรคู่กัน — การสื่อสารทุกช่องทางจะราบรื่นเป็นพิเศษ'
      ],
      'ดิน': [
        'ดินช่วยยึดลมวันนี้ — ความคิดจะไม่ลอย ลงมือทำได้จริง',
        'ธาตุดินช่วยรวมพลังธาตุลม — โฟกัสจะคมขึ้น งานจะเดินหน้า',
        'ดาวดินหนุนลมเจ้าชะตา — วันนี้เหมาะกับการเปลี่ยนความคิดให้เป็นรูปธรรม'
      ]
    },
    'ดิน': {
      'ไฟ': [
        'ไฟช่วยอุ่นดินวันนี้ — ความมั่นคงจะมาพร้อมกับความกล้าที่เพิ่มขึ้น',
        'ธาตุไฟเติมพลังธาตุดิน — วันนี้เหมาะกับการลุยงานที่ต้องใช้ทั้งความอดทนและความมุ่งมั่น',
        'ดาวไฟเสริมดินเจ้าชะตา — ผู้ใหญ่จะเห็นความทุ่มเทของคุณ'
      ],
      'น้ำ': [
        'น้ำช่วยหล่อเลี้ยงดินวันนี้ — ความมั่นคงจะไม่แข็งทื่อ แต่อ่อนโยนและยืดหยุ่น',
        'ธาตุน้ำกระทบธาตุดิน — ความรู้สึกจะช่วยให้คุณตัดสินใจได้ดีขึ้น',
        'ดาวน้ำหนุนดินเจ้าชะตา — วันนี้เหมาะกับการดูแลคนรอบข้าง'
      ],
      'ลม': [
        'ลมช่วยพัดพาดินวันนี้ — ความคิดจะเป็นระบบมากขึ้น วางแผนได้ดี',
        'ธาตุลมเสริมธาตุดิน — การสื่อสารจะชัดเจนและน่าเชื่อถือ',
        'ดาวลมหนุนดินเจ้าชะตา — วันนี้เหมาะกับการเจรจาหรือต่อรอง'
      ],
      'ดิน': [
        'ดินสองก้อนรวมกัน — วันนี้ความมั่นคงจะแข็งแกร่งเป็นพิเศษ',
        'ธาตุดินเสริมกัน — ความอดทนของคุณจะถูกทดสอบ แต่ถ้าผ่านได้ผลลัพธ์จะยั่งยืน',
        'ดาวดินโคจรคู่กัน — วันนี้เหมาะกับงานที่ต้องใช้ความละเอียดและความอดทน'
      ]
    }
  };

  // Lucky colors — 7 pools, seeded pick per day
  var LUCKY_COLORS = [
    { name: 'แดงเพลิง', hex: '#E85D3A', meaning: 'เสริมพลังอำนาจและความมั่นใจ' },
    { name: 'ทองอร่าม', hex: '#C9A227', meaning: 'เรียกทรัพย์และโชคลาภ' },
    { name: 'เขียวมรกต', hex: '#2ECC71', meaning: 'เสริมสุขภาพและความอุดมสมบูรณ์' },
    { name: 'น้ำเงินคราม', hex: '#3498DB', meaning: 'เสริมสติปัญญาและความสงบ' },
    { name: 'ม่วงอเมทิสต์', hex: '#9B59B6', meaning: 'เสริมญาณทัศนะและสิ่งลี้ลับ' },
    { name: 'ชมพูพิงค์', hex: '#E91E8C', meaning: 'เสริมความรักและเมตตามหานิยม' },
    { name: 'ส้มอำพัน', hex: '#F39C12', meaning: 'เสริมความคิดสร้างสรรค์และแรงบันดาลใจ' },
    { name: 'เงินมุก', hex: '#C0C0C0', meaning: 'เสริมการปกป้องและปัดเป่าสิ่งไม่ดี' },
    { name: 'ขาวมุก', hex: '#F5F5F5', meaning: 'เสริมความบริสุทธิ์และจิตใจสงบ' },
    { name: 'ครีมงาช้าง', hex: '#FFFFF0', meaning: 'เสริมความเมตตาและเสน่ห์' }
  ];

  // Lucky times — 7 pools
  var LUCKY_TIMES = [
    { time: '06:00-08:00', reason: 'ยามพระอาทิตย์ขึ้น — พลังเริ่มต้นใหม่' },
    { time: '08:00-10:00', reason: 'ยามพุธ — เหมาะกับการเจรจา' },
    { time: '10:00-12:00', reason: 'ยามพฤหัส — เสริมปัญญา' },
    { time: '12:00-14:00', reason: 'ยามเสาร์ — เหมาะกับการลงมือทำ' },
    { time: '14:00-16:00', reason: 'ยามราหู — ระวังแต่ก็มีโชคซ่อน' },
    { time: '16:00-18:00', reason: 'ยามศุกร์ — เสริมความรักและเมตตา' },
    { time: '18:00-20:00', reason: 'ยามจันทร์ — เหมาะกับการพักผ่อนและทบทวน' },
    { time: '20:00-22:00', reason: 'ยามอังคาร — พลังกล้าแกร่ง แก้ปัญหาเฉพาะหน้า' }
  ];

  // Fortune Cards — 22 ใบ (เหมือน Major Arcana)
  var FORTUNE_CARDS = [
    { id: 1,  icon: '☀️', name: 'จักรพรรดิ', meaning: 'วันนี้คุณจะมีอำนาจต่อรองสูง — ใช้ให้เป็นธรรม' },
    { id: 2,  icon: '🌙', name: 'จักรพรรดินี', meaning: 'ความอ่อนโยนคือพลังวันนี้ — ดูแลตัวเองก่อนดูแลคนอื่น' },
    { id: 3,  icon: '⭐', name: 'ดวงดาว', meaning: 'ความหวังที่เคยหายไปจะกลับมา — มองฟ้าแล้วจะเห็นทาง' },
    { id: 4,  icon: '🔥', name: 'หอคอย', meaning: 'สิ่งที่พังลงวันนี้คือสิ่งที่ไม่ควรยึดติด — ปล่อยแล้วเริ่มใหม่' },
    { id: 5,  icon: '🌊', name: 'ความยุติธรรม', meaning: 'ความจริงจะปรากฏ — ไม่ต้องแก้ตัว แค่ทำให้ถูกต้อง' },
    { id: 6,  icon: '👑', name: 'จักรพรรดิ์', meaning: 'ภาวะผู้นำจะถูกทดสอบวันนี้ — ยืนหยัดด้วยเหตุผล' },
    { id: 7,  icon: '🔮', name: 'นักพรต', meaning: 'คำตอบอยู่ในความเงียบ — หยุดพักแล้วจะได้ยินเสียงข้างใน' },
    { id: 8,  icon: '🎡', name: 'วงล้อแห่งโชค', meaning: 'โชคชะตากำลังหมุน — สิ่งที่เคยเสียจะกลับมาในรูปแบบใหม่' },
    { id: 9,  icon: '💪', name: 'ความแข็งแกร่ง', meaning: 'คุณแข็งแกร่งกว่าที่คิด — วันนี้จะพิสูจน์ให้เห็น' },
    { id: 10, icon: '🧙', name: 'นักมายากล', meaning: 'คุณมีเครื่องมือครบแล้ว — ลงมือทำได้เลย' },
    { id: 11, icon: '❤️', name: 'คนรัก', meaning: 'วันนี้ความสัมพันธ์จะโดดเด่น — ให้เวลากับคนที่สำคัญ' },
    { id: 12, icon: '🦅', name: 'นักเดินทาง', meaning: 'ทางที่ไม่เคยไปจะนำพาสิ่งดี ๆ มาให้' },
    { id: 13, icon: '⚖️', name: 'ความสมดุล', meaning: 'วันนี้ต้องเลือกให้ดีระหว่างงานกับชีวิตส่วนตัว' },
    { id: 14, icon: '🦋', name: 'การเปลี่ยนแปลง', meaning: 'สิ่งที่เคยกลัวจะกลายเป็นจุดแข็ง — ยอมรับการเปลี่ยนแปลง' },
    { id: 15, icon: '🌙', name: 'ความลับ', meaning: 'มีบางอย่างซ่อนอยู่ — ฟังให้ดี ดูให้ลึก' },
    { id: 16, icon: '☀️', name: 'ดวงอาทิตย์', meaning: 'วันนี้ทุกอย่างจะสว่างสดใส — ความสุขอยู่ใกล้กว่าที่คิด' },
    { id: 17, icon: '✨', name: 'ความปรารถนา', meaning: 'สิ่งที่เคยอธิษฐานไว้จะเริ่มเป็นรูปเป็นร่าง' },
    { id: 18, icon: '🌊', name: 'สายน้ำ', meaning: 'ปล่อยให้ชีวิตไหลไปตามธรรมชาติ อย่าฝืน' },
    { id: 19, icon: '🌍', name: 'โลก', meaning: 'วันนี้คุณจะเห็นภาพใหญ่ชัดขึ้น — ทุกอย่างเชื่อมถึงกัน' },
    { id: 20, icon: '👁️', name: 'ตาทิพย์', meaning: 'สัญชาตญาณจะแม่นยำเป็นพิเศษ — เชื่อสิ่งที่รู้สึก' },
    { id: 21, icon: '💎', name: 'อัญมณี', meaning: 'คุณค่าของคุณจะถูกคนรอบข้างเห็นชัดขึ้น' },
    { id: 22, icon: '🌟', name: 'ดาวนำทาง', meaning: 'มีแสงนำทางอยู่เสมอ — แม้ในคืนที่มืดที่สุด' }
  ];

  // ===== HELPERS =====

  function getLS() {
    return (typeof localStorage !== 'undefined') ? localStorage : (window && window.localStorage);
  }

  function safeJSON(str) {
    try { return JSON.parse(str); } catch(e) { return null; }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTodayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Deterministic hash: same inputs → same output (0-999)
  function seededRandom(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function pickSeeded(arr, seed, offset) {
    var hash = seededRandom(seed + ':' + (offset || 0));
    return arr[hash % arr.length];
  }

  // ===== BIRTH DATA =====

  function getBirthData() {
    try {
      var raw = getLS().getItem(ONBOARDING_KEY);
      var data = safeJSON(raw);
      if (data && data.birthData) return data.birthData;
    } catch(e) {}
    return null;
  }

  function getBirthDayOfWeek(dob) {
    if (!dob) return 0; // default Sunday
    var d = new Date(dob);
    if (isNaN(d.getTime())) return 0;
    return d.getDay();
  }

  function getBirthElement(dob) {
    var dow = getBirthDayOfWeek(dob);
    return DAY_ELEMENT[dow];
  }

  // ===== LUCKY NUMBER GENERATOR =====
  // Deterministic: same user + same day = same number
  function generateLuckyNumbers(birthData, dateKey) {
    var seed = (birthData && birthData.dob ? birthData.dob : 'default') + ':' + dateKey;
    var numbers = [];
    for (var i = 0; i < 3; i++) {
      var hash = seededRandom(seed + ':num' + i);
      var num = (hash % 90) + 10; // 10-99
      numbers.push(String(num));
    }
    return numbers;
  }

  // ===== PERSONALIZED FORTUNE =====

  function buildPersonalizedFortune(birthData) {
    var today = new Date();
    var dayOfWeek = today.getDay();
    var dateKey = getTodayKey();
    var todayElement = DAY_ELEMENT[dayOfWeek];
    var todayDeity = DAY_DEITY[dayOfWeek];
    var todayPlanet = DAY_PLANET[dayOfWeek];

    var birthElement = getBirthElement(birthData ? birthData.dob : null);
    var birthDow = getBirthDayOfWeek(birthData ? birthData.dob : null);
    var birthDeity = DAY_DEITY[birthDow];

    // Seed: birthDOB + today → deterministic
    var seed = (birthData && birthData.dob ? birthData.dob : 'default') + ':' + dateKey;

    // Pick personalized quote
    var quotePool = QUOTES[birthElement] ? QUOTES[birthElement][todayElement] : null;
    var quote;
    if (quotePool) {
      quote = pickSeeded(quotePool, seed, 0);
    } else {
      // fallback
      quote = 'วันนี้ดาว' + todayDeity + 'โคจรผ่าน — พลังงานรอบตัวกำลังเปลี่ยน ตั้งจิตให้ดีแล้วจะเห็นสัญญาณ';
    }

    // If we have birth data, personalize further
    if (birthData && birthData.dob) {
      quote = 'คนเกิดวัน' + birthDeity + ' (ธาตุ' + birthElement + ') — ' + quote;
    }

    // Lucky color
    var luckyColor = pickSeeded(LUCKY_COLORS, seed, 1);

    // Lucky time
    var luckyTime = pickSeeded(LUCKY_TIMES, seed, 2);

    // Lucky numbers
    var luckyNumbers = generateLuckyNumbers(birthData, dateKey);

    // Fortune card
    var fortuneCard = pickSeeded(FORTUNE_CARDS, seed, 3);

    // Focus & Warning (from element interaction)
    var focusWarning = getFocusWarning(birthElement, todayElement, seed);

    return {
      quote: quote,
      todayElement: todayElement,
      todayDeity: todayDeity,
      todayPlanet: todayPlanet,
      birthElement: birthElement,
      luckyColor: luckyColor,
      luckyTime: luckyTime,
      luckyNumbers: luckyNumbers,
      fortuneCard: fortuneCard,
      focus: focusWarning.focus,
      warning: focusWarning.warning,
      hasBirthData: !!(birthData && birthData.dob)
    };
  }

  function getFocusWarning(birthEl, todayEl, seed) {
    var focuses = {
      'ไฟ': { focus: 'เริ่มต้นสิ่งใหม่, ตัดสินใจเรื่องค้าง, แสดงภาวะผู้นำ', warning: 'อย่าหุนหัน — หยุด 3 ลมหายใจก่อนลงมือ' },
      'น้ำ': { focus: 'ดูแลความสัมพันธ์, รับฟัง, รักษาตัวเอง', warning: 'อย่ารับอารมณ์คนอื่นมาแบก — ขอบเขตคือความรักตัวเอง' },
      'ลม':  { focus: 'สื่อสาร, เจรจา, วางแผน, เขียน', warning: 'อย่ากระจาย — เลือกโฟกัส 1 เรื่องสำคัญที่สุด' },
      'ดิน': { focus: 'ลงมือทำ, จัดระบบ, ดูแลสุขภาพ', warning: 'อย่าแบกทุกอย่างคนเดียว — มอบหมายได้' }
    };
    var todayFocus = focuses[todayEl] || focuses['ไฟ'];

    // Cross-element warning
    var crossWarnings = {
      'ไฟ-น้ำ': 'อารมณ์จะแรงวันนี้ — ใช้ความรู้สึกนำทาง แต่อย่าตัดสินด้วยอารมณ์ชั่ววูบ',
      'ไฟ-ลม': 'ความคิดจะแล่นเร็ว — จดไว้ก่อนจะลืม แล้วเลือกทำแค่ 1 อย่าง',
      'ไฟ-ดิน': 'พลังจะนิ่งและมั่นคง — ลงมือทำวันนี้จะได้ผลลัพธ์ดี',
      'น้ำ-ไฟ': 'ความมั่นใจจะมาพร้อมอารมณ์ — ใช้ให้เป็นพลัง อย่าให้เป็นไฟ',
      'น้ำ-ลม': 'ความคิดจะลึกซึ้ง — เหมาะกับการเขียนบันทึกหรือคุยเรื่องสำคัญ',
      'น้ำ-ดิน': 'จิตใจจะสงบ — เหมาะกับการจัดการเรื่องที่ค้างคา',
      'ลม-ไฟ': 'แรงบันดาลใจจะพุ่งพล่าน — ลงมือทำทันทีก่อนจะหมดไฟ',
      'ลม-น้ำ': 'ความเห็นอกเห็นใจจะเพิ่มขึ้น — วันนี้เหมาะกับการรับฟัง',
      'ลม-ดิน': 'ความคิดจะเป็นระบบ — เหมาะกับการวางแผนและจัดระเบียบ',
      'ดิน-ไฟ': 'ความมุ่งมั่นจะแข็งแกร่ง — ลุยงานที่ท้าทายได้เลย',
      'ดิน-น้ำ': 'ความอ่อนโยนจะเสริมความมั่นคง — ดูแลคนรอบข้าง',
      'ดิน-ลม': 'การสื่อสารจะชัดเจน — เจรจาต่อรองจะสำเร็จ'
    };

    var crossKey = birthEl + '-' + todayEl;
    var crossWarning = crossWarnings[crossKey] || '';

    return {
      focus: todayFocus.focus,
      warning: crossWarning || todayFocus.warning
    };
  }

  // ===== STREAK SYSTEM =====
  function getStreakData() {
    try {
      var raw = getLS().getItem(STREAK_KEY);
      if (!raw) return { count: 0, lastDate: null };
      return JSON.parse(raw);
    } catch (e) {
      return { count: 0, lastDate: null };
    }
  }

  function saveStreakData(data) {
    try {
      getLS().setItem(STREAK_KEY, JSON.stringify(data));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function updateStreak() {
    var data = getStreakData();
    var today = getTodayKey();

    if (data.lastDate === today) {
      return data;
    }

    if (data.lastDate) {
      var lastDate = new Date(data.lastDate + 'T00:00:00');
      var todayDate = new Date(today + 'T00:00:00');
      var diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        data.count += 1;
      } else {
        data.count = 1;
      }
    } else {
      data.count = 1;
    }

    data.lastDate = today;
    saveStreakData(data);
    return data;
  }

  function getStreakBadge(count) {
    if (count >= 30) return { emoji: '👑', label: 'จอมเวทย์แห่งดวงดาว' };
    if (count >= 14) return { emoji: '🌟', label: 'หมอดูประจำตัว' };
    if (count >= 7)  return { emoji: '⭐', label: 'สายมูตัวจริง' };
    if (count >= 3)  return { emoji: '🔥', label: 'นักดูดวงมือใหม่' };
    return { emoji: '🌱', label: 'เริ่มต้นเดินทาง' };
  }

  // ===== RENDERING =====

  function renderStreak() {
    var streakData = updateStreak();
    var badge = getStreakBadge(streakData.count);

    var streakEl = document.getElementById('df-streak');
    if (streakEl) {
      streakEl.innerHTML = '<span class="df-streak-emoji">' + badge.emoji + '</span>' +
        '<span class="df-streak-count">' + streakData.count + ' วัน</span>';
      streakEl.title = badge.label;
    }

    var footerEl = document.getElementById('df-footer-msg');
    if (footerEl) {
      if (streakData.count === 1) {
        footerEl.textContent = '🎉 ยินดีด้วย! นี่คือวันแรกของการเดินทาง ✨ กลับมาพรุ่งนี้เพื่อไม่ให้สตรีคขาดนะ';
      } else if (streakData.count === 3) {
        footerEl.textContent = '🔮 ครบ 3 วันแล้ว! คุณเริ่มเห็นรูปแบบของดวงดาวชัดขึ้น — กลับมาต่อวันพรุ่งนี้ ✨';
      } else if (streakData.count === 7) {
        footerEl.textContent = '⭐ ครบ 7 วันแล้ว! พลังดวงของคุณแข็งแกร่งขึ้นทุกวัน — อย่าหยุดนะ ✨';
      } else if (streakData.count === 14) {
        footerEl.textContent = '🌙 ครบ 14 วัน! คุณคือนักดูดวงตัวจริง — ดวงของคุณกำลังเปลี่ยนแปลง!';
      } else if (streakData.count === 30) {
        footerEl.textContent = '👑 ครบ 30 วัน! คุณคือจอมเวทย์แห่งดวงดาว — STARVIA ภูมิใจในตัวคุณ ✨';
      } else {
        footerEl.textContent = 'อัปเดตทุกวัน — กลับมาเช็กใหม่พรุ่งนี้เพื่อรักษาสตรีค ' + badge.emoji + ' ✨';
      }
    }
  }

  function renderDailyFortune() {
    var birthData = getBirthData();
    var fortune = buildPersonalizedFortune(birthData);

    // Date display
    var dfDate = document.getElementById('df-date');
    if (dfDate) {
      var monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      var d = new Date();
      dfDate.textContent = d.getDate() + ' ' + monthNames[d.getMonth()] + ' ' + (d.getFullYear() + 543);
    }

    // Personalized quote
    var dfQuote = document.getElementById('df-quote');
    if (dfQuote) {
      if (fortune.hasBirthData) {
        dfQuote.innerHTML = '<span class="df-personal-tag">🔮 เฉพาะคุณ</span> "' + escapeHTML(fortune.quote) + '"';
      } else {
        dfQuote.textContent = '"' + fortune.quote + '"';
      }
    }

    // Element
    var dfElement = document.getElementById('df-element');
    if (dfElement) {
      dfElement.textContent = fortune.todayElement + ' (ดาว' + fortune.todayDeity + ')';
    }

    // Focus
    var dfFocus = document.getElementById('df-focus');
    if (dfFocus) dfFocus.textContent = fortune.focus;

    // Warning
    var dfWarning = document.getElementById('df-warning');
    if (dfWarning) dfWarning.textContent = fortune.warning;

    // === NEW SECTIONS ===
    renderLuckySection(fortune);
    renderFortuneCard(fortune);
  }

  function renderLuckySection(fortune) {
    var container = document.getElementById('df-lucky-section');
    if (!container) return;

    var premiumUnlocked = (typeof premiumIsUnlocked === 'function') && premiumIsUnlocked();

    if (!premiumUnlocked) {
      // FREE: แสดงเฉพาะ teaser ชวนปลดล็อก
      container.innerHTML = '<div class="df-lucky-teaser" style="text-align:center;padding:16px;margin-top:8px;border-top:1px solid rgba(201,162,39,0.2);">'
        + '<div style="font-size:13px;color:#7a6a9a;margin-bottom:6px;">🔒 สีมงคล · เลขนำโชค · เวลาเฮง</div>'
        + '<div style="font-size:12px;color:#b8a8d8;line-height:1.6;">ปลดล็อก <strong style="color:#C9A227;">Premium</strong> เพื่อดูสีมงคล เลขนำโชค และจังหวะเวลาเฮงประจำวันนี้</div>'
        + '<button class="cta-btn" data-action="unlock-premium" style="margin-top:10px;font-size:12px;padding:8px 20px;">ปลดล็อก 199 บาท/เดือน</button>'
        + '</div>';
      return;
    }

    var html = '<div class="df-lucky-grid">';

    // Lucky Color
    html += '<div class="df-lucky-item">'
      + '<div class="df-lucky-icon" style="background:' + fortune.luckyColor.hex + ';width:28px;height:28px;border-radius:50%;display:inline-block;vertical-align:middle;box-shadow:0 0 8px ' + fortune.luckyColor.hex + '40"></div>'
      + '<div class="df-lucky-label">สีมงคล</div>'
      + '<div class="df-lucky-value">' + escapeHTML(fortune.luckyColor.name) + '</div>'
      + '<div class="df-lucky-meaning">' + escapeHTML(fortune.luckyColor.meaning) + '</div>'
      + '</div>';

    // Lucky Numbers
    html += '<div class="df-lucky-item">'
      + '<div class="df-lucky-icon">🔢</div>'
      + '<div class="df-lucky-label">เลขนำโชค</div>'
      + '<div class="df-lucky-value df-lucky-numbers">'
      + fortune.luckyNumbers.map(function(n) { return '<span class="df-lucky-num">' + n + '</span>'; }).join('')
      + '</div>'
      + '<div class="df-lucky-meaning">เลขที่ดาวส่งมาให้วันนี้</div>'
      + '</div>';

    // Lucky Time
    html += '<div class="df-lucky-item">'
      + '<div class="df-lucky-icon">⏰</div>'
      + '<div class="df-lucky-label">เวลาเฮง</div>'
      + '<div class="df-lucky-value">' + escapeHTML(fortune.luckyTime.time) + '</div>'
      + '<div class="df-lucky-meaning">' + escapeHTML(fortune.luckyTime.reason) + '</div>'
      + '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  function renderFortuneCard(fortune) {
    var container = document.getElementById('df-fortune-card');
    if (!container) return;

    var card = fortune.fortuneCard;
    var html = '<div class="df-card-inner">'
      + '<div class="df-card-icon">' + card.icon + '</div>'
      + '<div class="df-card-name">' + escapeHTML(card.name) + '</div>'
      + '<div class="df-card-meaning">"' + escapeHTML(card.meaning) + '"</div>'
      + '</div>';
    container.innerHTML = html;
  }

  // ===== INIT =====
  function init() {
    renderDailyFortune();
    renderStreak();
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== PUBLIC API (for tests) =====
  window.PersonalizedFortune = {
    buildPersonalizedFortune: buildPersonalizedFortune,
    getBirthData: getBirthData,
    getBirthElement: getBirthElement,
    getBirthDayOfWeek: getBirthDayOfWeek,
    generateLuckyNumbers: generateLuckyNumbers,
    seededRandom: seededRandom,
    pickSeeded: pickSeeded,
    QUOTES: QUOTES,
    LUCKY_COLORS: LUCKY_COLORS,
    LUCKY_TIMES: LUCKY_TIMES,
    FORTUNE_CARDS: FORTUNE_CARDS
  };
})();
