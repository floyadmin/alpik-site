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

async function main() {
  ensureDir(imgDir);
  await buildLogoAssets();
  await buildHeroBackgroundWebps();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
