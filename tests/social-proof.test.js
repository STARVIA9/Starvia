// ===== Social Proof Engine Tests =====
import { describe, it, beforeEach, expect } from 'vitest';

function loadContext(birthData) {
  const store = {};
  const elements = {};
  const window = {
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    document: {
      readyState: 'loading',
      addEventListener: () => {},
      getElementById: (id) => elements[id] || null,
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    IntersectionObserver: class { observe() {} unobserve() {} },
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ success: true }) }),
    setInterval: () => {},
    setTimeout: (fn) => fn(),
  };

  if (birthData) {
    store['starvia_onboarding'] = JSON.stringify({
      step: 2, startedAt: '2026-05-28T10:00:00Z', birthData: birthData
    });
  }

  global.window = window;
  global.localStorage = window.localStorage;
  global.document = window.document;
  global.IntersectionObserver = window.IntersectionObserver;
  global.requestAnimationFrame = window.requestAnimationFrame;

  delete require.cache[require.resolve('../js/daily-fortune.js')];
  require('../js/daily-fortune.js');
  delete require.cache[require.resolve('../js/social-proof.js')];
  require('../js/social-proof.js');

  return { window, store, elements };
}

describe('StarviaStats (real stats — ไม่มีตัวเลขแต่ง)', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadContext({ dob: '1990-06-15', name: 'Test' });
  });

  describe('Public API', () => {
    it('should expose pingReport function', () => {
      expect(typeof window.StarviaStats.pingReport).toBe('function');
    });

    it('should expose mountVote function', () => {
      expect(typeof window.StarviaStats.mountVote).toBe('function');
    });

    it('pingReport must not throw when fetch is missing', () => {
      const oldFetch = window.fetch;
      delete window.fetch;
      expect(() => window.StarviaStats.pingReport('m0')).not.toThrow();
      window.fetch = oldFetch;
    });
  });
});
