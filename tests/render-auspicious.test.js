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

function planet(name = 'อาทิตย์', element = 'ไฟ') {
  return { n: name, el: element, ei: 0, s: '☉', c: '#FFB84D' };
}

function auspiciousUi() {
  return {
    dn: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    dg: 'ดี', dm: 'ปานกลาง', db2: 'หลีกเลี่ยง',
    ab: 'วันที่ดีที่สุด:', ad: 'วัน',
    rf: 'อ้างอิง:',
    am: 'คำแนะนำฤกษ์',
    r2: 'เริ่มใหม่',
  };
}

describe('Auspicious mode rendering', () => {
  it('renders auspicious day grid with all 7 days', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, {
      PLC: [
        [85, 70, 60, 90, 75, 80, 65],
        [70, 85, 80, 65, 90, 60, 75],
        [60, 80, 85, 75, 65, 90, 70],
        [90, 65, 75, 85, 70, 60, 80],
        [75, 90, 65, 70, 85, 80, 60],
        [80, 60, 90, 80, 65, 75, 85],
        [65, 75, 70, 80, 80, 85, 85],
      ],
    });
    const p = planet();
    const routines = { 'ไฟ': [{ t: '06:00', d: 'ตื่น' }] };

    context.renderAusp('สมชาย', p, 0, auspiciousUi());

    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('ปฏิทินวันมงคล');
    expect(output).toContain('อาทิตย์');
    expect(output).toContain('จันทร์');
    expect(output).toContain('เสาร์');
  });

  it('escapes XSS in auspicious mode name', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, {
      PLC: [
        [85, 70, 60, 90, 75, 80, 65],
        [70, 85, 80, 65, 90, 60, 75],
        [60, 80, 85, 75, 65, 90, 70],
        [90, 65, 75, 85, 70, 60, 80],
        [75, 90, 65, 70, 85, 80, 60],
        [80, 60, 90, 80, 65, 75, 85],
        [65, 75, 70, 80, 80, 85, 85],
      ],
    });
    const p = planet();

    context.renderAusp('<img src=x onerror="alert(1)">', p, 0, auspiciousUi());

    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('&lt;img');
    expect(dom.window.document.querySelector('img')).toBeNull();
  });

  it('renders reset button for auspicious mode', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, {
      PLC: [
        [85, 70, 60, 90, 75, 80, 65],
        [70, 85, 80, 65, 90, 60, 75],
        [60, 80, 85, 75, 65, 90, 70],
        [90, 65, 75, 85, 70, 60, 80],
        [75, 90, 65, 70, 85, 80, 60],
        [80, 60, 90, 80, 65, 75, 85],
        [65, 75, 70, 80, 80, 85, 85],
      ],
    });
    const p = planet();

    context.renderAusp('ทดสอบ', p, 0, auspiciousUi());

    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('data-action="reset-mode"');
    expect(output).toContain('data-mode="2"');
  });

  it('locks color + Cosmic Routine for free readers (premium shows color)', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, {
      PLC: [
        [85, 70, 60, 90, 75, 80, 65],
        [70, 85, 80, 65, 90, 60, 75],
        [60, 80, 85, 75, 65, 90, 70],
        [90, 65, 75, 85, 70, 60, 80],
        [75, 90, 65, 70, 85, 80, 60],
        [80, 60, 90, 80, 65, 75, 85],
        [65, 75, 70, 80, 80, 85, 85],
      ],
    });
    const p = planet();
    context.renderAusp('ทดสอบ', p, 0, auspiciousUi());

    const output = dom.window.document.getElementById('r2').innerHTML;
    // B (2026-09-24): free sees NO color section (Option A premium lock),
    // but still sees locked Cosmic Routine CTA.
    expect(output).not.toContain('พลังงานสี');
    expect(output).toContain('Cosmic Routine');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(output).not.toContain('Ignite (ปลุกพลัง)');
    expect(dom.window.document.querySelector('.cosmic-routine-card.is-locked')).toBeTruthy();
  });

  it('shows color recommendation for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, {
      PLC: [
        [85, 70, 60, 90, 75, 80, 65],
        [70, 85, 80, 65, 90, 60, 75],
        [60, 80, 85, 75, 65, 90, 70],
        [90, 65, 75, 85, 70, 60, 80],
        [75, 90, 65, 70, 85, 80, 60],
        [80, 60, 90, 80, 65, 75, 85],
        [65, 75, 70, 80, 80, 85, 85],
      ],
      isPremiumUnlocked: () => true,
    });
    const p = planet();
    context.renderAusp('ทดสอบ', p, 0, auspiciousUi());

    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('พลังงานสี');
  });

  it('shows Cosmic Routine and activity time windows for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, {
      PLC: [
        [85, 70, 60, 90, 75, 80, 65],
        [70, 85, 80, 65, 90, 60, 75],
        [60, 80, 85, 75, 65, 90, 70],
        [90, 65, 75, 85, 70, 60, 80],
        [75, 90, 65, 70, 85, 80, 60],
        [80, 60, 90, 80, 65, 75, 85],
        [65, 75, 70, 80, 80, 85, 85],
      ],
      isPremiumUnlocked: () => true,
    });
    const p = planet();
    context.renderAusp('ทดสอบ', p, 0, auspiciousUi());

    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('Ignite (ปลุกพลัง)');
    expect(output).toContain('act-time-window');
    expect(dom.window.document.querySelector('.cosmic-routine-card.is-locked')).toBeNull();
  });
});

describe('Auspicious mode personal upgrades', () => {
  const PLC_DATA = [
    [85, 70, 60, 90, 75, 80, 65],
    [70, 85, 80, 65, 90, 60, 75],
    [60, 80, 85, 75, 65, 90, 70],
    [90, 65, 75, 85, 70, 60, 80],
    [75, 90, 65, 70, 85, 80, 60],
    [80, 60, 90, 80, 65, 75, 85],
    [65, 75, 70, 80, 80, 85, 85],
  ];

  it('renders .ausp-header-card class', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, { PLC: PLC_DATA });
    context.renderAusp('สมชาย', planet(), 0, auspiciousUi());
    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('ausp-header-card');
  });

  it('header card shows planet name', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, { PLC: PLC_DATA });
    context.renderAusp('Test', planet(), 0, auspiciousUi());
    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('อาทิตย์');
  });

  it('header card shows element name', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, { PLC: PLC_DATA });
    context.renderAusp('Test', planet(), 0, auspiciousUi());
    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('ธาตุไฟ');
  });

  it('activity recommendations contain time window indicators for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, { PLC: PLC_DATA, isPremiumUnlocked: () => true });
    context.renderAusp('Test', planet(), 0, auspiciousUi());
    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('act-time-window');
    expect(output).toContain('⏰');
  });

  it('XSS: script tag in name is escaped in header card', () => {
    const dom = new JSDOM('<!doctype html><div id="r2"></div>');
    const context = loadContext(dom, { PLC: PLC_DATA });
    context.renderAusp('<script>alert(1)</script>', planet(), 0, auspiciousUi());
    const output = dom.window.document.getElementById('r2').innerHTML;
    expect(output).toContain('&lt;script&gt;');
    expect(dom.window.document.querySelector('.ausp-header-card script')).toBeNull();
  });
});
