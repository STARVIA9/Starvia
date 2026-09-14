import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dist = path.join(root, 'dist');

// JS files that need cache-busting hashes
const jsFiles = [
  'app.js',
  'astrology-core.js',
  'ui-actions.js',
  'data/thai-astrology-content.js',
  'data/zodiac-identities.js',
  'data/element-practices.js',
  'data/life-periods.js',
  'data/yearly-transit.js',
  'data/couple-compatibility.js',
  'data/rahu-ketu.js',
  'data/yearly-enhancement.js',
  'data/auspicious-timing.js',
  'data/planetary-strength.js',
  'data/element-quiz.js',
  'data/life-graph-data.js',
  'data/premium-config.js',
  'js/reading-helpers.js',
  'js/life-graph.js',
  'js/renderer-shared.js',
  'js/streak-tracker.js',
  'js/cosmic-events.js',
  'data/cosmic-events-generated.js',
  'js/renderer-individual.js',
  'js/renderer-couple.js',
  'js/renderer-auspicious.js',
  'js/daily-fortune.js',
  'js/onboarding.js',
  'js/gamification.js',
  'js/share-viral.js',
  'js/social-proof.js',
  'js/analytics.js',
  'js/ab-testing.js',
  'js/tarot.js',
  'js/tarot-ui.js',
  'js/toc-navigation.js',
];

// Other static files (no hash needed)
const otherFiles = [
  'css/tarot.css',
  'analytics.html',
  'agent-docs.md',
  'assets/html2canvas.min.js',
  'assets/og-image.png',
  'assets/og-share-story.jpg',
  'assets/qr-payment.jpg',
  'privacy.html',
  'terms.html',
  'admin.html',
  'share.html',
  'quiz.html',
  'payment-success.html',
  'promo-fullsize.html',
  '_headers',
];

// Compute short hash for a file
function fileHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
}

// Map: original src path → hashed filename
const hashMap = {};

// Copy JS files with hashes
for (const file of jsFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Static asset not found: ${file}`);
  }
  const hash = fileHash(source);
  const ext = path.extname(file);
  const base = file.slice(0, -ext.length);
  const hashedName = `${base}-${hash}${ext}`;
  const target = path.join(dist, hashedName);

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);

  // Store: original src value → hashed filename
  hashMap[file] = hashedName;
}

// Copy other files without hashing
for (const file of otherFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Static asset not found: ${file}`);
  }
  const target = path.join(dist, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

// Recursively copy subdirectories
// Mapping: source dir → target dir (lets us pull from public/ but emit as dist/assets/)
const extraDirs = [
  { src: 'assets/zodiac', dst: 'assets/zodiac' },
  { src: 'public/hero',   dst: 'assets/hero' },  // public/hero/* → dist/assets/hero/*
  { src: 'assets/hero',   dst: 'assets/hero' },
  { src: 'public/pick-a-card', dst: 'pick-a-card', recursive: true },  // Pick-a-Card เว็บย่อย (78 ไพ่ + js + css + data)
];
for (const { src, dst, recursive } of extraDirs) {
  const sourceDir = path.join(root, src);
  if (!fs.existsSync(sourceDir)) continue;
  if (recursive) {
    fs.cpSync(sourceDir, path.join(dist, dst), { recursive: true });
    continue;
  }
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const source = path.join(sourceDir, entry.name);
    const target = path.join(dist, dst, entry.name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

// Rewrite dist/index.html to use hashed JS filenames
const indexHtml = path.join(dist, 'index.html');
if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, 'utf-8');
  let replacements = 0;

  for (const [original, hashed] of Object.entries(hashMap)) {
    // Escape for regex (dots in paths)
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match src="original" or src='/original' — with or without leading slash
    // Also strip ?v=... cache-buster from the src before matching
    const regex = new RegExp(`(src=["'])(/?)${escaped}(\\?[^"']*)?(["'])`, 'g');

    html = html.replace(regex, (match, prefix, slash, _query, suffix) => {
      replacements++;
      return `${prefix}${slash}${hashed}${suffix}`;
    });
  }

  // Rewrite hero asset hashed paths back to stable /assets/hero/* paths
  // (CF Pages CDN caches hashed files but served as 404 HTML on first deploy —
  // stable paths from copy-static-assets work reliably)
  const heroReplacements = [
    { from: /\/assets\/mama-kara-loop-[A-Za-z0-9_-]+\.webm/g, to: '/assets/hero/mama-kara-loop.webm' },
    { from: /\/assets\/mama-kara-loop-[A-Za-z0-9_-]+\.mp4/g, to: '/assets/hero/mama-kara-loop.mp4' },
    { from: /\/assets\/mama-kara-loop-poster-[A-Za-z0-9_-]+\.jpg/g, to: '/assets/hero/mama-kara-loop-poster.jpg' }
  ];
  let heroFixed = 0;
  for (const r of heroReplacements) {
    html = html.replace(r.from, (match) => { heroFixed++; return r.to; });
  }
  console.log(`🎬 Hero asset paths normalized: ${heroFixed} hashed → /assets/hero/*`);

  fs.writeFileSync(indexHtml, html);
  console.log(`✅ Rewrote index.html: ${replacements} JS references → hashed`);
} else {
  console.warn('⚠️ dist/index.html not found — skipping rewrite');
}

// Also rewrite share.html / quiz.html / terms.html / privacy.html with hashed JS filenames
const rewriteTargets = ['share.html', 'quiz.html', 'terms.html', 'privacy.html'];
for (const name of rewriteTargets) {
  const file = path.join(dist, name);
  if (!fs.existsSync(file)) {
    console.warn(`⚠️ dist/${name} not found — skipping rewrite`);
    continue;
  }
  let html = fs.readFileSync(file, 'utf-8');
  let replacements = 0;
  for (const [original, hashed] of Object.entries(hashMap)) {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(src=["'])(/?)${escaped}(\\?[^"']*)?(["'])`, 'g');
    html = html.replace(regex, (match, prefix, slash, _query, suffix) => {
      replacements++;
      return `${prefix}${slash}${hashed}${suffix}`;
    });
  }
  fs.writeFileSync(file, html);
  console.log(`✅ Rewrote ${name}: ${replacements} JS references → hashed`);
}

// Fix legacy "styles.css" links (terms/privacy) → real built CSS bundle from vite
const assetsDir = path.join(dist, 'assets');
const builtCss = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).find((f) => /^main-[A-Za-z0-9_-]+\.css$/.test(f))
  : null;
if (builtCss) {
  for (const name of ['terms.html', 'privacy.html']) {
    const file = path.join(dist, name);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf-8');
    if (!html.includes('href="styles.css"')) continue;
    html = html.replace(/href="styles\.css"/g, `href="/assets/${builtCss}"`);
    fs.writeFileSync(file, html);
    console.log(`✅ ${name}: styles.css → /assets/${builtCss}`);
  }
} else {
  console.warn('⚠️ built CSS bundle not found — styles.css links left as-is');
}

console.log(`Copied ${jsFiles.length} JS (hashed) + ${otherFiles.length} static files to dist/`);
