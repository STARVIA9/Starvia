import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadContext(dom, overrides = {}) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
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
    setTimeout: () => {},
    scrollTo: () => {},
    getPL: () => [],
    isPremiumUnlocked: () => false,
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(contentSource, context, { filename: 'data/thai-astrology-content.js' });
  vm.runInContext(helperSource, context, { filename: 'js/reading-helpers.js' });
  for (const [filename, source] of rendererSources) {
    vm.runInContext(source, context, { filename });
  }
  return context;
}

function planet(name, element, ei, symbol = '☉') {
  return { n: name, el: element, ei, s: symbol };
}

function sign(name = 'เมษ', symbol = '♈', el = 0) {
  return { n: name, s: symbol, add: 'พลังเสริมความสัมพันธ์', el };
}

function coupleUi() {
  return {
    ec: 'เคมีธาตุ', pc: 'ดาวคู่', rc: 'ราศีคู่', lc: 'ลัคนาคู่',
    ct: ['ภาพรวม', 'ธาตุ', 'ราศี', 'ลัคนา'],
    cs: ['ภาพรวม', 'ธาตุ', 'ราศี', 'ลัคนา'],
    rf: 'อ้างอิง:', cm: 'คำแนะนำคู่', cv2: 'รักที่ดีคือการเติบโตไปด้วยกัน', r1: 'เริ่มใหม่',
  };
}

describe('Couple mode rendering', () => {
  it('renders matrix card with compatibility score and names', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0, '☉');
    const pb = planet('เสาร์', 'ไฟ', 0, '♄');
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ แรงและดึงดูด']],
      rasiAngle: () => [78, 'มุมสัมพันธ์ที่สะท้อนกัน'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('สมชาย', pa, ra, ra, 0, 0, 'สมหญิง', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('Compatibility Matrix');
    expect(output).toContain('%');
    expect(output).toContain('สมชาย');
    expect(output).toContain('สมหญิง');
    expect(output).toContain('เคมีธาตุ');
  });

  it('escapes XSS in couple names', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('<script>alert(1)</script>', pa, ra, ra, 0, 0, 'แม่', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('&lt;script&gt;');
    expect(dom.window.document.querySelector('script')).toBeNull();
  });

  it('does not render detailed sub-tabs for couple results', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).not.toContain('tabs-w');
    expect(output).not.toContain('id="tt1"');
    expect(output).not.toContain('id="ts1"');
  });

  it('renders reset button at the end', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('data-action="reset-mode"');
    expect(output).toContain('data-mode="1"');
  });

  it('renders full couple dharma, score breakdown, and action plan for premium (Option A lock)', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
      // B (2026-09-24): couple full content is premium-locked (Option A).
      // Free sees matrix + CTA only. This test verifies premium view.
      isPremiumUnlocked: () => true,
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    // Premium context — renders full content
    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('Compatibility Matrix');
    expect(output).toContain('คู่');
    // Premium content visible for unlocked members
    expect(output).toContain('สิ่งที่คู่นี้มาเรียนรู้ร่วมกัน');
    expect(output).toContain('พิมพ์เขียวความสัมพันธ์');
    expect(output).toContain('วิธีดูแลความสัมพันธ์');
    // No lock wrappers in premium view
    expect(dom.window.document.querySelector('[class*="is-locked"]')).toBeNull();
    expect(dom.window.document.querySelector('.couple-premium-details')).toBeNull();
    expect(dom.window.document.querySelector('.lock-overlay')).toBeNull();
    expect(output).not.toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
  });

  it('locks couple details for free readers (matrix + CTA only)', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
      // default isPremiumUnlocked = false → free view
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('Compatibility Matrix');
    expect(output).toContain('ปลดล็อกดวงคู่เต็ม');
    expect(output).not.toContain('สิ่งที่คู่นี้มาเรียนรู้ร่วมกัน');
  });

  it('renders couple full content without collapsible details (premium expanded mode)', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
      isPremiumUnlocked: () => true,
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    // No <details> element at all — content is rendered directly
    expect(dom.window.document.querySelector('details.couple-premium-details')).toBeNull();
    // All 4 score breakdown boxes are visible (not hidden behind a details)
    const breakdown = dom.window.document.querySelectorAll('.cg2 .ci2');
    expect(breakdown.length).toBe(4);
  });

  it('renders couple premium content the same way regardless of unlock state', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
      isPremiumUnlocked: () => true,
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('สิ่งที่คู่นี้มาเรียนรู้ร่วมกัน');
    expect(output).toContain('พิมพ์เขียวความสัมพันธ์');
    expect(dom.window.document.querySelector('.cg2.is-locked')).toBeNull();
  });

  it('renders love timing as a visible flagship couple section for premium', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('พุธ', 'ลม', 1);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[82, 74], [74, 80]],
      PLC: [[82, 74], [74, 80]],
      getELD: () => [['ไฟเจอไฟ', 'ไฟเจอลม'], ['ลมเจอไฟ', 'ลมเจอลม']],
      rasiAngle: () => [76, 'มุมส่งเสริม'],
      isPremiumUnlocked: () => true,
    });
    const ra = sign('เมษ');
    const rb = sign('เมถุน');
    const RA2 = [ra, rb];

    context.renderCouple('ดาว', pa, ra, ra, 0, 0, 'ฟ้า', pb, rb, rb, 1, 1, coupleUi(), RA2, '1998-04-12', '2000-09-20');

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('ดวงคู่รักของคุณกับเขา');
    expect(output).toContain('จังหวะเปิดเด่น');
    expect(output).toContain('โอกาสความสัมพันธ์');
    expect(output).toContain('อ้างอิงเชิงระบบ');
    expect(output).toContain('ดาวประจำวัน/ธาตุ');
    expect(output).toContain('จังหวะรักของทั้งคู่');
    // Love timing premium plan is now always visible (not hidden behind <details>).
    // Couple mode unlocked 2026-06-07 — content shows for everyone.
    expect(output).toContain('ความสม่ำเสมอ 21 วัน');
    expect(output).toContain('กติกา 3 คำถาม');
  });

  it('marks love timing cycles that already passed and shifts to the next 7-year window', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('พุธ', 'ลม', 1);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
    });

    const oldWindow = context.loveWindowForPerson('1970-01-01', 0, 0, 0);
    const model = context.buildLoveDestinyModel('1970-01-01', '1972-07-15', 78, 75, 78, 80, 82, pa, pb, 0, 6);

    expect(oldWindow.shiftedFromPast).toBe(true);
    expect(oldWindow.cyclesShifted).toBeGreaterThan(0);
    expect(model.timingStatus).toContain('ผ่านไปแล้ว');
    expect(model.timingStatus).toContain('ระบบอ่านรอบถัดไป');
  });

  it('renders love timing action plan for premium (Option A lock)', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('พุธ', 'ลม', 1);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[82, 74], [74, 80]],
      PLC: [[82, 74], [74, 80]],
      getELD: () => [['ไฟเจอลม'], ['ลมเจอไฟ']],
      rasiAngle: () => [76, 'มุมส่งเสริม'],
      isPremiumUnlocked: () => true,
    });
    const ra = sign('เมษ');
    const rb = sign('เมถุน');
    const RA2 = [ra, rb];

    context.renderCouple('ดาว', pa, ra, ra, 0, 0, 'ฟ้า', pb, rb, rb, 1, 1, coupleUi(), RA2, '1998-04-12', '2000-09-20');

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('แผนเพิ่มโอกาสให้ได้คู่ที่เข้ากัน');
    expect(output).toContain('ความสม่ำเสมอ 21 วัน');
    // No "unlock" CTA in couple mode
    expect(output).not.toContain('ปลดล็อกแผนความรักเฉพาะคู่');
  });

  it('renders single love opportunity when partner data is not provided', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa],
    });
    const signs = [
      sign('เมษ', '♈', 0), sign('พฤษภ', '♉', 1), sign('เมถุน', '♊', 2), sign('กรกฎ', '♋', 3),
      sign('สิงห์', '♌', 0), sign('กันย์', '♍', 1), sign('ตุลย์', '♎', 2), sign('พิจิก', '♏', 3),
      sign('ธนู', '♐', 0), sign('มังกร', '♑', 1), sign('กุมภ์', '♒', 2), sign('มีน', '♓', 3),
    ];

    context.renderSingleLoveOpportunity('ดาว', pa, signs[0], signs[0], 0, 0, coupleUi(), signs, '1998-04-12');

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('โอกาสเจอคู่ของคุณ');
    expect(output).toContain('มีแนวโน้มเจอที่ไหน');
    expect(output).toContain('ราศี/พลังที่มีแนวโน้มเข้ามา');
    expect(output).toContain('นิสัยคนที่มีแนวโน้มเข้ากัน');
    expect(output).toContain('อ้างอิงเชิงระบบ');
    expect(output).toContain('แผนเปิดทางความรัก 3 ขั้น');
  });

});
