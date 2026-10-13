import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadContext(dom, overrides = {}) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
  const lifeGraphSource = fs.readFileSync(path.resolve('js/life-graph.js'), 'utf8');
  const rendererSources = [
    'js/renderer-shared.js',
    'js/renderer-individual.js',
    'js/renderer-couple.js',
    'js/renderer-auspicious.js',
  ].map((file) => [file, fs.readFileSync(path.resolve(file), 'utf8')]);
  const context = {
    window: dom.window,
    document: dom.window.document,
    CL: 'th',
    fmtDate: () => '17/05/2026',
    buildElementRadar: () => '',
    buildTabs: () => {
      const ts0 = dom.window.document.getElementById('ts0');
      if (ts0) ts0.innerHTML = '';
    },
    setTimeout: () => {},
    scrollTo: () => {},
    isPremiumUnlocked: () => false,
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(contentSource, context, { filename: 'data/thai-astrology-content.js' });
  vm.runInContext(helperSource, context, { filename: 'js/reading-helpers.js' });
  vm.runInContext(lifeGraphSource, context, { filename: 'js/life-graph.js' });
  for (const [filename, source] of rendererSources) {
    vm.runInContext(source, context, { filename });
  }
  return context;
}

function samplePlanet(element = 'ไฟ', planetIndex = 0, planetName = 'อาทิตย์') {
  return {
    c: '#fff', s: '☉', n: planetName, d: 'desc', el: element, ei: planetIndex,
    p: 'personality', str: 'strength', wkfix: 'fix', lv: 'love', ca: 'career', mn: 'money', man: 'mantra'
  };
}

function sampleSign() {
  return { c: '#fff', s: '♈', n: 'เมษ', rl: 'rule', trait: 'trait', apply: 'apply', add: 'add', el: 0 };
}

function sampleUi() {
  return {
    ti: 'เวลา', tu: 'น.', pl: 'ดาว', rl: 'ราศี', rl2: 'เจ้าเรือน', la: 'ลัคนา', ll: 'เจ้าเรือน',
    dob: 'วันเกิด', el: 'ธาตุ', es: 'element', ge: 'เพศ', rf: 'อ้างอิง:', mn: 'มนต์', r0: 'เริ่มใหม่',
    t0: ['ตัวตน', 'รัก', 'งาน', 'อดีต', 'ปัจจุบัน', 'อนาคต'],
    s0: ['พื้นฐาน', 'จุดแข็ง', 'จุดอ่อน', 'รัก', 'งาน', 'เงิน', 'อดีต', 'ปัจจุบัน', 'อนาคต']
  };
}

describe('Daily Thai Cosmic Brief', () => {
  it('renders .weekday-power-card class in output', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('weekday-power-card');
  });

  it('contains the Thai weekday power title', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('กำลังวันประจำตัว');
    expect(output).not.toContain('Daily Cosmic Brief');
    expect(output).not.toContain('สรุปพลังงานวันนี้');
  });

  it('shows weekday power card with 3 action columns', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const actions = dom.window.document.querySelectorAll('.wpc-action');
    expect(actions.length).toBe(3);
    // Badges show day, deity, and element
    expect(dom.window.document.querySelector('.wpc-badge-day')).toBeTruthy();
    expect(dom.window.document.querySelector('.wpc-badge-deity')).toBeTruthy();
    expect(dom.window.document.querySelector('.wpc-badge-element')).toBeTruthy();
  });

  it('shows personal color name', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('สีมงคล');
  });

  it('weekday power card appears before locked premium sections', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const briefIndex = output.indexOf('weekday-power-card');
    const windfallIndex = output.indexOf('windfall-luck');
    const karmaIndex = output.indexOf('karma-card');
    expect(briefIndex).toBeGreaterThan(-1);
    expect(briefIndex).toBeLessThan(windfallIndex);
    // karma section removed per requirement
  });

  it('shows weekday power card with Thursday deity and element for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    // 2000-06-15 is Thursday (dayOfWeek=4)
    expect(output).toContain('กำลังวันประจำตัว');
    expect(output).toContain('แรงครู');  // Thursday energy
    expect(output).toContain('พระราหู');  // Thursday deity
    expect(output).toContain('ดิน');  // Thursday element
    expect(output).toContain('สีมงคล');
  });

  it('shows same weekday power card for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('กำลังวันประจำตัว');
    expect(output).toContain('พระราหู');
    expect(output).toContain('ดิน');
  });
});

describe('Life Domain Forecast Matrix', () => {
  it('shows domain labels but locks detailed life-domain guidance for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('คัมภีร์แก้ดวง 6 ด้าน');
    expect(output).not.toContain('Life Domain Forecast Matrix');
    for (const label of ['โชค', 'การเงิน', 'สุขภาพ', 'ความสัมพันธ์', 'การงาน', 'บริวาร']) {
      expect(output).toContain(label);
    }
    for (const part of ['สถานะตอนนี้', 'ระวัง', 'แก้เหตุ', 'เสริมให้รุ่ง', 'ภารกิจ 7 วัน', 'ดูจังหวะ 15 ปีข้างหน้า']) {
      expect(output).toContain(part);
    }
    expect(output).toContain('คัมภีร์แก้ดวง 6 ด้าน');
    expect(dom.window.document.querySelectorAll('.domain-card').length).toBe(6);
    // Top 2 domains show full content (5 lines each), rest show minimal
    expect(dom.window.document.querySelectorAll('.domain-compact-line').length).toBeGreaterThanOrEqual(10);
    expect(dom.window.document.querySelectorAll('.domain-age-details').length).toBe(2); // Only top 2 have age details
    expect(dom.window.document.querySelector('.domain-locked-zone')).toBeTruthy();
  });

  it('unlocks domain matrix when is-locked class is removed (simulates PIN unlock)', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    // Verify locked zone exists (4 locked domains)
    const lockedZone = dom.window.document.querySelector('.domain-locked-zone');
    expect(lockedZone).toBeTruthy();
    expect(lockedZone.querySelectorAll('.domain-card-locked').length).toBe(4);
    
    // Top 2 domains are visible outside locked zone (not blurred)
    const allDomainCards = dom.window.document.querySelectorAll('.domain-card');
    const freeCards = dom.window.document.querySelectorAll('.domain-card:not(.domain-card-locked)');
    expect(allDomainCards.length).toBe(6);
    expect(freeCards.length).toBe(2);
    
    // Content from top 2 is accessible
    const matrix = dom.window.document.querySelector('.domain-matrix');
    expect(matrix.textContent).toContain('สถานะตอนนี้');
    expect(matrix.textContent).toContain('ระวัง');
  });

  it('renders all required life-domain guidance parts for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    for (const part of ['สถานะตอนนี้', 'ระวัง', 'แก้เหตุ', 'เสริมให้รุ่ง', 'ภารกิจ 7 วัน', 'ดูจังหวะ 15 ปีข้างหน้า']) {
      expect(output).toContain(part);
    }
    expect(output).not.toContain('วิธีเสริมให้ดีขึ้น');
    expect(output).not.toContain('สิ่งที่ทำได้ตอนนี้');
    expect(dom.window.document.querySelectorAll('.domain-dhamma-remedy').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.domain-compact-line').length).toBeGreaterThanOrEqual(30);
    expect(dom.window.document.querySelectorAll('.domain-age-details').length).toBe(6);
  });

  it('shows explicit age-band opportunities for future life stages', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    // V2 keeps age windows available, but tucked behind a details control to reduce mobile text walls.
    const details = Array.from(dom.window.document.querySelectorAll('.domain-age-details'));
    expect(details).toHaveLength(6);
    details.forEach((node) => {
      expect(node.querySelector('summary').textContent).toContain('ดูจังหวะ 15 ปีข้างหน้า');
      expect(node.querySelectorAll('.domain-age-chip').length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Windfall Luck gimmick section', () => {
  it('builds a deterministic Thai lottery and windfall guide', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    const guide = context.buildWindfallLuckGuide(samplePlanet('ไฟ'), '2000-06-15', 1);

    expect(guide.title).toContain('ลาภลอย');
    expect(guide.luckyNumbers).toHaveLength(3);
    guide.luckyNumbers.forEach((number) => expect(number).toMatch(/^\d{2}$/));
    expect(guide.lotteryFocus).toMatch(/หวย|ลอตเตอรี่|ตัวเลข/);
    expect(guide.ritualSteps).toHaveLength(3);
    expect(guide.ritualSteps.join(' ')).toContain('สาธุ');
  });

  it('renders the windfall luck section as a locked premium teaser with masked lucky numbers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const windfall = dom.window.document.querySelector('.windfall-luck');
    const maskedNumbers = Array.from(windfall.querySelectorAll('.wfl-mask-number')).map((node) => node.textContent);
    const fullNumbers = Array.from(windfall.querySelectorAll('.wfl-full-number')).map((node) => node.textContent);

    expect(output).toContain('สูตรเปิดดวงลาภลอย');
    expect(output).toContain('เลขที่ควรลอง');
    expect(output).toContain('หวย / ลอตเตอรี่');
    expect(output).toContain('พิธีเปิดทางโชค');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(maskedNumbers).toHaveLength(3);
    maskedNumbers.forEach((number) => expect(number).toMatch(/^\d●$|^●\d$/));
    expect(fullNumbers).toHaveLength(3);
    fullNumbers.forEach((number) => expect(number).toMatch(/^\d{2}$/));
    const maskedDetail = windfall.querySelector('.wfl-mask-detail').textContent;
    fullNumbers.forEach((number) => expect(maskedDetail).not.toContain(number));
    maskedNumbers.forEach((number) => expect(maskedDetail).toContain(number));
    expect(dom.window.document.querySelector('.windfall-luck-freemium')).toBeTruthy();
    expect(dom.window.document.querySelector('.wfl-locked-zone')).toBeTruthy();
    expect(dom.window.document.querySelector('.wfl-countdown')).toBeTruthy();
  });

  it('adds section-specific premium CTA button labels', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('เปิดเลขตัวที่ 2 ก่อนหวยออก');
    expect(output).toContain('ดูคำเตือนรายเดือนของฉัน');
    expect(output).toContain('เปิดวิธีแก้ดวงเฉพาะตัวครบ 6 ด้าน');
    expect(output).not.toContain('>✦ ปลดล็อกรายงานเต็ม ✦</button>');
  });

  it('keeps masked lucky numbers ready to reveal when the premium lock is removed', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const windfall = dom.window.document.querySelector('.windfall-luck');

    expect(windfall.querySelectorAll('.wfl-mask-number').length).toBe(3);
    expect(windfall.querySelectorAll('.wfl-full-number').length).toBe(3);
    expect(windfall.querySelector('.wfl-mask-detail')).toBeTruthy();
    expect(windfall.querySelector('.wfl-full-detail')).toBeTruthy();

    windfall.classList.remove('is-locked');
    // Remove conversion CTA (new teaser system replaces lock-overlay)
    const cta = windfall.querySelector('.conversion-cta');
    if (cta) cta.remove();
    const teaser = windfall.querySelector('.teaser-reveal');
    if (teaser) teaser.remove();
    const warning = windfall.querySelector('.warning-teaser');
    if (warning) warning.remove();

    expect(windfall.querySelector('.conversion-cta')).toBeNull();
    expect(windfall.querySelectorAll('.wfl-full-number').length).toBe(3);
  });

  it('reveals the windfall luck guide for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('สูตรเปิดดวงลาภลอย');
    expect(output).toContain('คาถาเรียกโชค');
    expect(output).toContain('ตั้งงบก่อนเสี่ยง');
    expect(dom.window.document.querySelectorAll('.wfl-mask-number').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.wfl-full-number').length).toBe(3);
    expect(dom.window.document.querySelector('.windfall-luck-freemium')).toBeNull();
  });
});


describe('Free reader conversion reading order', () => {
  it('orders the free result page from quick value to visible graph, premium hooks, then free detail tabs', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    // New psychological flow order: identity → daily power → enhancement → core reading → detail/CTA
    const order = [
      'blueprint-card',
      'weekday-power-card',
      'power-card',
      'domain-matrix',
      'detail-tabs-card'
    ].map((needle) => output.indexOf(needle));

    order.forEach((index) => expect(index).toBeGreaterThan(-1));
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1]).toBeLessThan(order[i]);
    }
    expect(output).not.toContain('conversion-roadmap');
  });

  it('does not include removed paywall elements as standalone sections', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const wrap = dom.window.document.getElementById('r0');

    // These should no longer be direct children of the report wrap
    expect(wrap.querySelector('.daily-fortune-cta')).toBeNull();
    expect(wrap.querySelector('.premium-preview-summary')).toBeNull();
  });

  it('shows the life graph as its own visible section before the collapsed six-domain scripture', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const domainSection = Array.from(dom.window.document.querySelectorAll('.collapsible-section'))
      .find((node) => node.querySelector('.section-toggle-label')?.textContent.includes('คัมภีร์แก้ดวง'));
    const graphSection = dom.window.document.querySelector('.life-graph-section');

    expect(graphSection).toBeTruthy();
    expect(graphSection.querySelector('.life-graph-card')).toBeTruthy();
    expect(domainSection).toBeTruthy();
    expect(domainSection.classList.contains('collapsed')).toBe(true);
    expect(domainSection.querySelector('.section-body .life-graph-card')).toBeNull();
    // Now the six-domain scripture appears before life graph (core reading first)
    expect(output.indexOf('คัมภีร์แก้ดวง 6 ด้าน')).toBeLessThan(output.indexOf('life-graph-section'));
  });

  it('keeps lower supporting sections collapsed but leaves the free detail tabs visible', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom, {
      buildElementRadar: () => '<div class="element-radar-test">กราฟสมดุลธาตุ</div>',
    });

    context.renderInd('พ่อ', 'ชาย', '1990-01-15', '08:30', samplePlanet('น้ำ', 2, 'จันทร์'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const sections = Array.from(dom.window.document.querySelectorAll('.collapsible-section'));
    const findByLabel = (label) => sections.find((node) => node.querySelector('.section-toggle-label')?.textContent.includes(label));
    const elementSection = findByLabel('สัดส่วนและสมดุลธาตุ');
    const detailSection = findByLabel('อ่านรายละเอียดพื้นฐาน');
    const tabsCard = dom.window.document.querySelector('.detail-tabs-card');

    expect(elementSection).toBeUndefined(); // removed per user request
    expect(detailSection).toBeUndefined();
    expect(tabsCard).toBeTruthy();
    expect(tabsCard.textContent).not.toContain('อ่านรายละเอียดพื้นฐาน');
  });

  it('locks all stacked sections for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const secs = Array.from(dom.window.document.querySelectorAll('#ts0 .stack-sec'));

    expect(secs.length).toBe(4);
    secs.forEach((sec) => {
      expect(sec.classList.contains('is-locked')).toBe(true);
      expect(sec.querySelector('.lock-overlay')).toBeTruthy();
    });
  });

  it('marks the six-domain scripture section as premium in the hint text', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const domainSection = Array.from(dom.window.document.querySelectorAll('.collapsible-section'))
      .find((node) => node.querySelector('.section-toggle-label')?.textContent.includes('คัมภีร์แก้ดวง'));

    expect(domainSection).toBeTruthy();
    expect(domainSection.querySelector('.section-toggle-hint').textContent).toContain('โชค');
  });

  it('does not render the karma mirror section for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).not.toContain('กระจกกรรม');
    expect(output).not.toContain('karma-card');
    expect(output).not.toContain('karma-card collapsed');
  });

  it('renders all four detail sections stacked with no tab clicks needed', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const tabsCard = dom.window.document.querySelector('.detail-tabs-card');
    const secs = Array.from(dom.window.document.querySelectorAll('#ts0 .stack-sec'));
    const heads = secs.map((node) => node.querySelector('.stack-sec-title')?.textContent);

    expect(tabsCard).toBeTruthy();
    // ไม่มีปุ่มแท็ปแล้ว — เปิดครั้งเดียวเห็นทั้ง 4 หมวด
    expect(dom.window.document.querySelectorAll('#tt0 .tab').length).toBe(0);
    expect(heads).toEqual(['ตัวตน', 'คู่สัมพันธ์', 'การงาน', 'การเงิน']);

    // ทั้ง 4 หมวดอยู่ใน DOM พร้อมกัน ไม่ต้องคลิกสลับ
    secs.forEach((sec) => {
      expect(sec.querySelector('.tab-section-card')).toBeTruthy();
    });
  });
});

describe('Monthly Life Map UX clarity', () => {
  it('removes highlighted free days for locked readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(output).not.toContain('ปฏิทินวันดีรายเดือน');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.mlm-cal-day').length).toBe(0);
  });

  it('renders full monthly calendar and removes 3-day preview for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(output).toContain('ปฏิทินวันดีรายเดือน');
    expect(output).toContain('สรุปรายสัปดาห์ 4 สัปดาห์');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.mlm-cal-day').length).toBeGreaterThanOrEqual(28);
  });
});
describe('Monthly Life Map subscription feature', () => {
  it('builds a deterministic monthly model with calendar, weekly briefs, and ritual', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);
    const model = context.buildMonthlyLifeMap(samplePlanet('ไฟ'), sampleSign(), sampleSign(), '2000-01-01', new Date('2026-06-15T00:00:00Z'));

    expect(model.title).toContain('มิถุนายน 2569');
    expect(model.freeDays).toHaveLength(3);
    model.freeDays.forEach((day) => {
      expect(day.simpleText).toContain('เหมาะกับ');
      expect(day.advice).toEqual(expect.any(String));
      expect(day.advice.length).toBeGreaterThan(12);
    });
    expect(model.calendarDays.length).toBeGreaterThanOrEqual(28);
    expect(model.weeklyBriefs).toHaveLength(4);
    expect(model.rituals).toHaveLength(7);
    expect(model.domains.map((domain) => domain.key)).toEqual(['career', 'money', 'windfall', 'relationship', 'health']);
    const windfall = model.domains.find((domain) => domain.key === 'windfall');
    expect(windfall.forecast).toMatch(/โชคลอย|ลาภลอย/);
    expect(windfall.action).not.toMatch(/^ควร/);
    model.domains.forEach((domain) => {
      expect(domain.icon).toMatch(/[◈💰🎲♡🫀]/u);
      expect(domain.score).toBeGreaterThanOrEqual(55);
      expect(domain.score).toBeLessThanOrEqual(99);
      expect(domain.forecast.length).toBeLessThanOrEqual(95);
      expect(domain.action.length).toBeLessThanOrEqual(70);
      expect(domain.forecast).not.toContain('ธาตุไฟบอกให้เดือนนี้');

      // New fields: omen, luckyDay, phase
      expect(domain.omen).toEqual(expect.any(String));
      expect(domain.omen.length).toBeGreaterThan(10);
      expect(domain.omen.length).toBeLessThanOrEqual(80);
      expect(domain.luckyDay).toBeGreaterThanOrEqual(1);
      expect(domain.luckyDay).toBeLessThanOrEqual(28);
      expect(domain.phase).toMatch(/ขาขึ้น|ทรงตัว|ต้องระวัง/);

      // Tone check: no corporate "ควร" standalone prefix in forecast
      expect(domain.forecast).not.toMatch(/^ควร/);
      // Action should be in หมอทัก tone (no "ควร" prefix)
      expect(domain.action).not.toMatch(/^ควร/);
    });

    // 4 entries variety: all 5 domains should produce unique forecasts
    expect(new Set(model.domains.map((d) => d.forecast)).size).toBe(model.domains.length);
  });

  it('personalizes monthly domain copy from birth date, planet, element, and current month', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);
    const mayFire = context.buildMonthlyLifeMap(samplePlanet('ไฟ', 0, 'อาทิตย์'), sampleSign(), sampleSign(), '1991-05-17', new Date('2026-05-15T00:00:00Z'));
    const mayWater = context.buildMonthlyLifeMap(samplePlanet('น้ำ', 2, 'จันทร์'), sampleSign(), sampleSign(), '1994-11-03', new Date('2026-05-15T00:00:00Z'));
    const juneFire = context.buildMonthlyLifeMap(samplePlanet('ไฟ', 0, 'อาทิตย์'), sampleSign(), sampleSign(), '1991-05-17', new Date('2026-06-15T00:00:00Z'));

    expect(mayFire.domains.map((domain) => domain.forecast)).not.toEqual(mayWater.domains.map((domain) => domain.forecast));
    expect(mayFire.domains.map((domain) => domain.action)).not.toEqual(mayWater.domains.map((domain) => domain.action));
    expect(mayFire.domains.map((domain) => domain.forecast)).not.toEqual(juneFire.domains.map((domain) => domain.forecast));
    expect(new Set(mayFire.domains.map((domain) => domain.forecast)).size).toBe(mayFire.domains.length);
  });

  it('shows free monthly preview but locks detailed monthly planning', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('แผนที่ชีวิตรายเดือน STARVIA');
    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(output).toContain('จังหวะเดือนนี้');
    // New teaser system shows conversion CTA instead of lock-overlay
    expect(output).toContain('conversion-cta');
    expect(output).not.toContain('สรุปรายสัปดาห์ 4 สัปดาห์');
    // Domain cards are now visible with teaser content
    expect(dom.window.document.querySelector('.mlm-domains-locked')).toBeTruthy();
  });

  it('renders full monthly planner for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('สรุปรายสัปดาห์ 4 สัปดาห์');
    expect(output).toContain('ภารกิจเสริมดวง 7 วัน');
    expect(output).toContain('ปฏิทินวันดีรายเดือน');
    expect(output).toContain('วันที่ควรระวัง');
    expect(dom.window.document.querySelector('.monthly-life-map.is-locked')).toBeNull();
  });

  it('renders omen, luckyDay badge, and phase chip for each domain in HTML', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    // Each domain should have an omen element (italic)
    const omenElements = dom.window.document.querySelectorAll('.mlm-omen');
    expect(omenElements.length).toBe(5);
    omenElements.forEach((el) => {
      expect(el.textContent.length).toBeGreaterThan(5);
    });

    // Each domain should have a lucky day badge
    const luckyElements = dom.window.document.querySelectorAll('.mlm-lucky-day');
    expect(luckyElements.length).toBe(5);

    // Each domain should have a phase chip
    const phaseElements = dom.window.document.querySelectorAll('.mlm-phase');
    expect(phaseElements.length).toBe(5);
  });
});

describe('Report closing buttons (12 ต.ค.69)', () => {
  it('places .rbt top-level so it stays visible in card-menu mode', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>', { url: 'http://localhost' });
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const rbt = dom.window.document.querySelector('#r0 > .rbt');
    expect(rbt).toBeTruthy();
    expect(rbt.innerHTML).toContain('data-action="reset-mode"');
    expect(rbt.innerHTML).toContain('data-action="clear-mode"');
    expect(rbt.textContent).toContain('ล้างข้อมูล ดูคนใหม่');
  });
});
