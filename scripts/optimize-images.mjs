import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const imgDir = path.join(root, 'img');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function buildLogoAssets() {
  const src = path.join(imgDir, 'logo1.png');
  if (!exists(src)) return;

  // Smaller logo for header/footer rendering (keep original logo1.png untouched).
  const logoOptimizedPng = path.join(imgDir, 'logo1-optimized.png');
  await sharp(src)
    .resize({ height: 256, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(logoOptimizedPng);

  const logoOptimized = path.join(imgDir, 'logo1-optimized.webp');
  await sharp(src)
    .resize({ height: 256, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(logoOptimized);

  // Favicons/icons (contain to avoid cropping if logo isn't square).
  const favicon32 = path.join(imgDir, 'favicon-32.png');
  await sharp(src)
    .resize({ width: 32, height: 32, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(favicon32);

  const appleTouch180 = path.join(imgDir, 'apple-touch-icon-180.png');
  await sharp(src)
    .resize({ width: 180, height: 180, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(appleTouch180);
}

async function buildHeroBackgroundWebps() {
  const sources = [
    { in: 'hero-bg.jpg', out: 'hero-bg.webp', width: 1600 },
    { in: 'about-bg.jpg', out: 'about-bg.webp', width: 1600 },
    { in: 'flat-roof-bg.jpg', out: 'flat-roof-bg.webp', width: 1600 },
    { in: 'contact-bg.jpg', out: 'contact-bg.webp', width: 1600 }
  ];

  for (const item of sources) {
    const src = path.join(imgDir, item.in);
    const dst = path.join(imgDir, item.out);
    if (!exists(src)) continue;

    await sharp(src)
      .resize({ width: item.width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(dst);
  }
}

function listHtmlFiles(dirPath) {
  const out = [];
  if (!exists(dirPath)) return out;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      out.push(...listHtmlFiles(p));
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

function extractHeroImagePathsFromHtml(html) {
  const out = [];
  const s = String(html || '');

  // Match inline hero backgrounds like:
  // <div class="hero-bg" style="... url('/img/1.jpg?v=20260115') ..."></div>
  const re = /class\s*=\s*(["'])[^"']*\bhero-bg\b[^"']*\1[\s\S]*?style\s*=\s*(["'])([\s\S]*?)\2/gi;
  let m;
  while ((m = re.exec(s))) {
    const styleValue = m[3] || '';
    const urlRe = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
    let u;
    while ((u = urlRe.exec(styleValue))) {
      const raw = (u[2] || '').trim();
      if (!raw) continue;

      // Strip query/hash.
      const cleaned = raw.split('#')[0].split('?')[0];
      out.push(cleaned);
    }
  }

  return out;
}

function normalizeImgRelPath(p) {
  const s = String(p || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return '';
  if (s.startsWith('/img/')) return s.slice(1); // -> img/...
  if (s.startsWith('img/')) return s;
  if (s.startsWith('./img/')) return s.slice(2);
  if (s.startsWith('.//img/')) return s.replace(/^\.\/+/, '');
  return '';
}

async function optimizeHeroImagesFromHtml() {
  const rootDir = root;
  const enDir = path.join(root, 'en');
  const htmlFiles = [...listHtmlFiles(rootDir), ...listHtmlFiles(enDir)];

  const relPaths = new Set();
  for (const filePath of htmlFiles) {
    let html = '';
    try {
      html = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const urls = extractHeroImagePathsFromHtml(html);
    for (const u of urls) {
      const rel = normalizeImgRelPath(u);
      if (rel) relPaths.add(rel);
    }
  }

  const maxWidth = 1600;

  for (const rel of relPaths) {
    const abs = path.join(root, rel);
    if (!exists(abs)) continue;

    const ext = path.extname(abs).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const tmp = abs + '.tmp';
    try {
      const img = sharp(abs);
      const meta = await img.metadata();
      const width = meta && meta.width ? meta.width : null;
      const shouldResize = !!(width && width > maxWidth);

      let pipeline = sharp(abs);
      if (shouldResize) {
        pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
      }

      if (ext === '.png') {
        await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(tmp);
      } else {
        await pipeline
          .jpeg({ quality: 78, progressive: true, mozjpeg: true })
          .toFile(tmp);
      }

      fs.renameSync(tmp, abs);
    } catch (err) {
      try {
        if (exists(tmp)) fs.rmSync(tmp, { force: true });
      } catch {
        // ignore
      }
      console.warn('Hero image optimize skipped for', rel, String(err && err.message ? err.message : err));
    }
  }
}

async function main() {
  ensureDir(imgDir);
  await buildLogoAssets();
  await buildHeroBackgroundWebps();
  await optimizeHeroImagesFromHtml();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
