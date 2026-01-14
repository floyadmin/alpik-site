import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const enDir = path.join(root, 'en');

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function ensureEmptyDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const src = path.join(srcDir, e.name);
    const dst = path.join(destDir, e.name);
    if (e.isDirectory()) {
      copyDir(src, dst);
    } else if (e.isFile()) {
      copyFile(src, dst);
    }
  }
}

function listRootHtmlFiles() {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => d.name);
}

function listEnHtmlFiles() {
  if (!fs.existsSync(enDir)) return [];
  return fs
    .readdirSync(enDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => d.name);
}

function toSlug(htmlFileName) {
  return htmlFileName.replace(/\.html$/i, '');
}

function writePrettyUrlCopy(htmlFileName, srcFilePath, destBaseDir) {
  const slug = toSlug(htmlFileName);
  if (!slug || slug.toLowerCase() === 'index') return;
  copyFile(srcFilePath, path.join(destBaseDir, slug, 'index.html'));
}

// 1) Rebuild /en from UA sources (and inject SEO/switcher)
run('node', [path.join(root, 'scripts', 'rebuild-en.mjs')]);

// 2) Prepare dist/
ensureEmptyDir(dist);

// 3) Copy site files
for (const html of listRootHtmlFiles()) {
  const srcPath = path.join(root, html);
  copyFile(srcPath, path.join(dist, html));
  writePrettyUrlCopy(html, srcPath, dist);
}

for (const html of listEnHtmlFiles()) {
  const srcPath = path.join(enDir, html);
  writePrettyUrlCopy(html, srcPath, path.join(dist, 'en'));
}

for (const file of ['style.css', 'sitemap.xml', 'robots.txt', 'lang-switcher.js', 'tracking.js', '_redirects', '_headers']) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(dist, file));
  }
}

for (const dir of ['img', 'en']) {
  const srcDir = path.join(root, dir);
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, path.join(dist, dir));
  }
}

console.log(`Built static site into: ${dist}`);
