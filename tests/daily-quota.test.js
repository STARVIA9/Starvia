import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadShared(dom) {
  const source = fs.readFileSync(path.resolve('js/renderer-shared.js'), 'utf8');
  const context = {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    setTimeout: () => {},
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'js/renderer-shared.js' });
  return context;
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

describe('daily reading quota', () => {
  let dom;
  let ctx;
  beforeEach(() => {
    dom = new JSDOM('<!doctype html><div id="q0"></div><div id="q1"></div><div id="q2"></div>', { url: 'http://localhost' });
    dom.window.localStorage.clear();
    ctx = loadShared(dom);
  });

  it('starts at 0 with 3 remaining', () => {
    expect(ctx.getDailyReadCount()).toBe(0);
    expect(ctx.canReadFree()).toBe(true);
    expect(ctx.getRemainingReads()).toBe(3);
  });

  it('locks after 3 reads', () => {
    ctx.incrementDailyReadCount();
    ctx.incrementDailyReadCount();
    ctx.incrementDailyReadCount();
    expect(ctx.getDailyReadCount()).toBe(3);
    expect(ctx.canReadFree()).toBe(false);
    expect(ctx.getRemainingReads()).toBe(0);
  });

  it('resets on a new day', () => {
    ctx.incrementDailyReadCount();
    ctx.incrementDailyReadCount();
    ctx.incrementDailyReadCount();
    expect(ctx.canReadFree()).toBe(false);
    dom.window.localStorage.setItem('starvia_read_count', JSON.stringify({ date: '2000-01-01', count: 3, bonus: 0 }));
    expect(ctx.getDailyReadCount()).toBe(0);
    expect(ctx.canReadFree()).toBe(true);
  });

  it('share bonus caps at +2 per day', () => {
    expect(ctx.grantShareBonus()).toBe(true);
    expect(ctx.grantShareBonus()).toBe(true);
    expect(ctx.grantShareBonus()).toBe(false);
    expect(ctx.getRemainingReads()).toBe(5);
    ctx.incrementDailyReadCount();
    ctx.incrementDailyReadCount();
    ctx.incrementDailyReadCount();
    // 3 used of 3+2 → still 2 left from bonus
    expect(ctx.canReadFree()).toBe(true);
    expect(ctx.getRemainingReads()).toBe(2);
  });

  it('updates quota meters in the DOM', () => {
    ctx.updateQuotaMeters();
    expect(dom.window.document.getElementById('q0').textContent).toContain('เหลือ 3/3');
    ctx.incrementDailyReadCount();
    expect(dom.window.document.getElementById('q1').textContent).toContain('เหลือ 2/3');
  });

  it('renders a lock card with payment + share exits', () => {
    const wrapDom = new JSDOM('<!doctype html><div id="r0"></div>', { url: 'http://localhost' });
    const wrapCtx = loadShared(wrapDom);
    const wrap = wrapDom.window.document.getElementById('r0');
    wrapCtx.renderQuotaLock(wrap);
    expect(wrap.innerHTML).toContain('โควต้าวันนี้หมดแล้ว');
    expect(wrap.innerHTML).toContain('data-action="open-payment"');
    expect(wrap.innerHTML).toContain('data-action="quota-share"');
  });
});
