import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadThaiAstroContent() {
  const source = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'data/thai-astrology-content.js' });
  return context.THAI_ASTRO_CONTENT;
}

describe('Thai astrology content data', () => {
  it('defines Karma Mirror content for the four Thai elements and seven weekdays', () => {
    const content = loadThaiAstroContent();

    expect(content).toBeTruthy();
    expect(content.karmaMirror).toBeTruthy();

    for (const element of ['ไฟ', 'ดิน', 'ลม', 'น้ำ']) {
      expect(content.karmaMirror.elements[element]).toMatchObject({
        pattern: expect.any(String),
        lesson: expect.any(String),
        action: expect.any(String),
        ritual: expect.any(String),
      });
    }

    expect(content.karmaMirror.weekdayShadows).toHaveLength(7);
    content.karmaMirror.weekdayShadows.forEach((shadow) => {
      expect(shadow).toEqual(expect.any(String));
      expect(shadow.length).toBeGreaterThan(10);
    });
  });

  it('loads content, reading helpers, and renderers in dependency order in index.html', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const contentIndex = html.indexOf('data/thai-astrology-content.js');
    const helpersIndex = html.indexOf('js/reading-helpers.js');
    const sharedIndex = html.indexOf('js/renderer-shared.js');
    const individualIndex = html.indexOf('js/renderer-individual.js');

    expect(contentIndex).toBeGreaterThan(-1);
    expect(helpersIndex).toBeGreaterThan(-1);
    expect(sharedIndex).toBeGreaterThan(-1);
    expect(individualIndex).toBeGreaterThan(-1);
    expect(contentIndex).toBeLessThan(helpersIndex);
    expect(helpersIndex).toBeLessThan(sharedIndex);
    expect(sharedIndex).toBeLessThan(individualIndex);
  });

  it('presents a slim brand header (no hero video) before the report form', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');

    expect(html).toContain('brand-slim');
    expect(html).toContain('เริ่มดูดวงฟรี');
    expect(html).toContain('รู้จักตัวเองลึกกว่าที่เคย');
    expect(html).toContain('4 มิติที่จะเปลี่ยนมุมมอง');
    expect(html).toContain('เริ่มจากข้อมูลพื้นฐาน');
    expect(html).toContain('ใช้เวลาไม่ถึง 30 วินาที');
    expect(html).not.toContain('hero-splash');
    expect(html).not.toContain('mama-kara-loop.mp4');
    expect(html).not.toContain('Free + Premium');
  });

  it('puts the free birth form before long landing sections so users can start in the first viewport', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const formIndex = html.indexOf('id="fc0"');
    const dailyIndex = html.indexOf('daily-fortune-section');
    const socialIndex = html.indexOf('social-proof-section');
    const valueIndex = html.indexOf('value-section');

    expect(formIndex).toBeGreaterThan(-1);
    expect(dailyIndex).toBe(-1); // daily widget removed by design (12 ต.ค.69)
    expect(socialIndex).toBeGreaterThan(-1);
    expect(valueIndex).toBeGreaterThan(-1);
    expect(formIndex).toBeLessThan(socialIndex);
    expect(formIndex).toBeLessThan(valueIndex);
  });

  it('has no landing daily fortune widget (removed by design — card menu covers readings)', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');

    expect(html).not.toContain('daily-fortune-section');
    expect(html).not.toContain('จังหวะของวันนี้');
  });

  it('does not contain broken #premium-preview links', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    expect(html).not.toContain('#premium-preview');
    expect(html).not.toContain('ดูตัวอย่างพรีเมียม');
  });

  it('routes premium CTA buttons to the payment modal action', () => {
    const appSource = fs.readFileSync(path.resolve('app.js'), 'utf8');
    const rendererSource = fs.readFileSync(path.resolve('js/renderer-individual.js'), 'utf8');

    expect(rendererSource).toContain('data-action="unlock-premium"');
    expect(appSource).toContain("action === 'open-payment' || action === 'unlock-premium'");
    expect(appSource).toContain('openPayment();');
  });

  it('loads only 2 essential Google Fonts families (Chakra Petch + Sarabun)', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    expect(html).toContain('family=Chakra+Petch');
    expect(html).toContain('family=Sarabun');
    // Removed: Charmonman, Kanit, Noto Serif Thai (CSS still references them, browser falls back to next in stack)
    expect(html).not.toContain('family=Charmonman');
    expect(html).not.toContain('family=Kanit');
    expect(html).not.toContain('family=Noto+Serif+Thai');
    expect(html).not.toContain('family=Chonburi');
    expect(html).not.toContain('family=Maitree');
  });

  it('defines Monthly Life Map content for subscription retention', () => {
    const content = loadThaiAstroContent();
    expect(content.monthlyLifeMap).toBeTruthy();
    expect(content.monthlyLifeMap.domains.map((domain) => domain.key)).toEqual([
      'career', 'money', 'windfall', 'relationship', 'health'
    ]);
    const windfall = content.monthlyLifeMap.domains.find((domain) => domain.key === 'windfall');
    expect(windfall.label).toContain('ลาภลอย');
    expect(windfall.teaser).toMatch(/โชคลอย|ลาภลอย/);
    expect(content.monthlyLifeMap.weeklyThemes).toHaveLength(4);
    expect(content.monthlyLifeMap.rituals).toHaveLength(7);
    for (const element of ['ไฟ', 'ดิน', 'ลม', 'น้ำ']) {
      expect(content.monthlyLifeMap.elementGuidance[element]).toMatchObject({
        focus: expect.any(String),
        warning: expect.any(String),
        action: expect.any(String),
      });
    }
  });

  it('defines Life Domain Forecast content for six required domains', () => {
    const content = loadThaiAstroContent();
    expect(content.lifeDomainForecast).toBeTruthy();
    expect(content.lifeDomainForecast.domains.map((domain) => domain.key)).toEqual([
      'luck', 'money', 'health', 'relationship', 'career', 'supporters'
    ]);
    content.lifeDomainForecast.domains.forEach((domain) => {
      expect(domain.label).toEqual(expect.any(String));
      expect(domain.subtitle).toEqual(expect.any(String));
    });
    expect(content.lifeDomainForecast.domainThemes.luck.current).toMatch(/โชคลอย|ลาภลอย/);
    expect(content.lifeDomainForecast.domainThemes.luck.remedy).toContain('เลข');
    for (const element of ['ไฟ', 'ดิน', 'ลม', 'น้ำ']) {
      expect(content.lifeDomainForecast.elementGuidance[element]).toBeTruthy();
    }
  });
});
