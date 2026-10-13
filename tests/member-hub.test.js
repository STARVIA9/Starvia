import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadHub(dom, extra = {}) {
  const source = fs.readFileSync(path.resolve('js/member-hub.js'), 'utf8');
  const context = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    setTimeout: () => {},
    ...extra,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'js/member-hub.js' });
  return context.window.MemberHub;
}

function ymNow() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

describe('member hub', () => {
  let dom;
  beforeEach(() => {
    dom = new JSDOM('<!doctype html><section id="member-hub"></section>', { url: 'http://localhost' });
    dom.window.localStorage.clear();
  });

  it('rolls deterministically per user+month', () => {
    const hub = loadHub(dom);
    const a = hub.rollPack('2026-10', 'u123');
    const b = hub.rollPack('2026-10', 'u123');
    const c = hub.rollPack('2026-11', 'u123');
    expect(a).toEqual(b);
    expect(['common', 'rare', 'legendary']).toContain(a.rarity);
    expect(a.god).toBeTruthy();
    // different month usually differs (sanity, not strict)
    expect(JSON.stringify(a) === JSON.stringify(c) && JSON.stringify(a) === JSON.stringify(hub.rollPack('2026-12', 'u123'))).toBe(false);
  });

  it('claims once per month and grows the album', () => {
    const hub = loadHub(dom);
    dom.window.localStorage.setItem('starvia_premium', 'true');
    const p1 = hub.claimPack();
    const p2 = hub.claimPack();
    expect(p1).toEqual(p2);
    expect(hub.getAlbum().length).toBe(1);
    expect(hub.getAlbum()[0].ym).toBe(ymNow());
  });

  it('shows lock teaser for non-members, pack for members', () => {
    loadHub(dom);
    expect(dom.window.document.getElementById('member-hub').textContent).toContain('สมาชิกเท่านั้น');
    dom.window.localStorage.setItem('starvia_premium', 'true');
    const hub2 = loadHub(dom);
    hub2.render();
    expect(dom.window.document.getElementById('member-hub').textContent).toContain('เปิดซองดวงเดือนนี้');
  });

  it('sees same-session paid unlock via memory flag', () => {
    const hub = loadHub(dom);
    expect(hub.isMember()).toBe(false);
    dom.window.isPremiumUnlockedFlag = true;
    expect(hub.isMember()).toBe(true);
  });

  it('gives every god 5 fortune effects, a story, a mark and an element', () => {
    const hub = loadHub(dom);
    expect(hub.GODS.length).toBe(12);
    hub.GODS.forEach((g) => {
      expect(Array.isArray(g.fx)).toBe(true);
      expect(g.fx.length).toBe(5);
      expect(g.fx.join(' ')).toMatch(/งาน.*เงิน.*รัก.*สุขภาพ.*โชคลาภ/s);
      expect(g.fx.join(' ')).not.toMatch(/[💼💰💕📜✉️💎🌟👑]/);
      expect(typeof g.story).toBe('string');
      expect(g.story.length).toBeGreaterThan(30);
      expect(g.story).toContain('ผู้ที่ได้ไพ่ใบนี้');
      expect(typeof g.mark).toBe('string');
      expect(g.mark.length).toBeGreaterThan(5);
      expect(['fire', 'earth', 'air', 'water']).toContain(g.el);
    });
  });

  it('renders gold icons instead of emoji', () => {
    const hub = loadHub(dom);
    dom.window.localStorage.setItem('starvia_premium', 'true');
    hub.claimPack();
    hub.render();
    const html = dom.window.document.getElementById('member-hub').innerHTML;
    expect(html).toContain('assets/icons/work.png');
    expect(html).toContain('assets/icons/money.png');
    expect(html).toContain('assets/icons/love.png');
    expect(html).toContain('assets/icons/story.png');
  });

  it('shows a show-off button after claiming', () => {
    const hub = loadHub(dom);
    dom.window.localStorage.setItem('starvia_premium', 'true');
    hub.claimPack();
    hub.render();
    const btn = dom.window.document.querySelector('[data-action="pack-share"]');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('อวดไพ่');
    expect(typeof hub.sharePack).toBe('function');
  });

  it('detects full-moon events from GENERATED_EVENTS', () => {
    const d = new Date();
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const hub = loadHub(dom, { GENERATED_EVENTS: [{ start: today, end: today, phase: 'full', title: 'Full Moon', zodiac: 'เมษ' }] });
    const st = hub.moonState();
    expect(st.active).toBeTruthy();
    expect(st.msg.length).toBeGreaterThan(10);
  });

  it('tracks monthly check-in and rewards gold at 20 days', () => {
    const hub = loadHub(dom);
    const m = ymNow();
    const todayDD = String(new Date().getDate()).padStart(2, '0');
    // 19 days excluding today → checkin() adds today = 20 → reward
    const days = [];
    for (let i = 1; i <= 31 && days.length < 19; i++) {
      const dd = String(i).padStart(2, '0');
      if (dd !== todayDD) days.push(dd);
    }
    dom.window.localStorage.setItem('starvia_month_checkin', JSON.stringify({ m, days, rewarded: false }));
    hub.checkin();
    const after = JSON.parse(dom.window.localStorage.getItem('starvia_month_checkin'));
    expect(after.days.length).toBe(20);
    expect(after.rewarded).toBe(true);
    expect(JSON.stringify(hub.getAlbum())).toContain('ไพ่ทอง');
    const prog = hub.checkinProgress();
    expect(prog.days).toBe(20);
    expect(prog.rewarded).toBe(true);
  });
});
