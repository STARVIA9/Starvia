import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadContext(overrides = {}) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
  const rendererSources = [
    'js/renderer-shared.js',
    'js/renderer-individual.js',
    'js/renderer-couple.js',
    'js/renderer-auspicious.js',
  ].map((file) => [file, fs.readFileSync(path.resolve(file), 'utf8')]);
  const context = {
    window: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
    },
    setTimeout: () => {},
    scrollTo: () => {},
    getPL: () => [],
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

const ui = {
  ec: 'เคมีธาตุ', pc: 'ดาวคู่', rc: 'ราศีคู่', lc: 'ลัคนาคู่',
  ct: ['ภาพรวม', 'ธาตุ', 'ราศี', 'ลัคนา'],
  cs: ['ภาพรวม', 'ธาตุ', 'ราศี', 'ลัคนา'],
  rf: 'อ้างอิง:', cm: 'คำแนะนำคู่', cv2: 'รักที่ดีคือการเติบโตไปด้วยกัน', r1: 'เริ่มใหม่'
};

describe('Couple Dharma Map', () => {
  it('defines Thai pair types in the shared content file', () => {
    const context = loadContext();

    expect(context.THAI_ASTRO_CONTENT.coupleDharma.pairTypes.supportive.label).toBe('คู่เกื้อหนุน');
    expect(context.THAI_ASTRO_CONTENT.coupleDharma.pairTypes.mirror.label).toBe('คู่กระจกใจ');
    expect(context.THAI_ASTRO_CONTENT.coupleDharma.pairTypes.fire.label).toBe('คู่รักแรง');
    expect(context.THAI_ASTRO_CONTENT.coupleDharma.pairTypes.lesson.label).toBe('คู่บทเรียน');
    expect(context.THAI_ASTRO_CONTENT.coupleDharma.pairTypes.builder.label).toBe('คู่สร้างฐาน');
  });

  it('selects a Thai relationship type from score and element signals', () => {
    const context = loadContext();

    expect(context.getCoupleDharmaType(92, 88, false).label).toBe('คู่เกื้อหนุน');
    expect(context.getCoupleDharmaType(78, 62, true).label).toBe('คู่กระจกใจ');
    expect(context.getCoupleDharmaType(72, 92, false).label).toBe('คู่รักแรง');
    expect(context.getCoupleDharmaType(55, 48, false).label).toBe('คู่บทเรียน');
    expect(context.getCoupleDharmaType(82, 74, false).label).toBe('คู่สร้างฐาน');
  });

  it('renders Couple Dharma Map labels in the couple matrix card', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0, '☉');
    const pb = planet('เสาร์', 'ไฟ', 0, '♄');
    const planets = [pa, pb];
    const context = loadContext({
      window: dom.window,
      document: dom.window.document,
      getPL: () => planets,
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ ความรักชัด แรง และต้องฝึกผ่อนจังหวะกัน']],
      rasiAngle: () => [78, 'มุมสัมพันธ์ที่สะท้อนกันและกัน'],
      isPremiumUnlocked: () => true,
    });
    const ra = sign('เมษ', '♈', 0);
    const rb = sign('สิงห์', '♌', 0);
    const RA2 = [ra, rb];

    context.renderCouple('พ่อ', pa, ra, ra, 0, 0, 'แม่', pb, rb, rb, 1, 1, ui, RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('พิมพ์เขียวความสัมพันธ์');
    expect(output).toContain('คู่กระจกใจ');
    expect(output).toContain('จุดแข็งที่ต้องรักษา');
    expect(dom.window.document.querySelector('.action-plan-card')).toBeTruthy();
  });
});
