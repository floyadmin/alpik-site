import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const enDir = path.join(root, 'en');

const GTM_ID = (process.env.SITE_GTM_ID || '').trim();

function injectGtm(html) {
  if (!GTM_ID || !/^GTM-[A-Z0-9]+$/i.test(GTM_ID)) return html;

  const headBlock = [
    '<!-- gtm:start -->',
    `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>`,
    '<!-- gtm:end -->'
  ].join('\r\n');

  const bodyBlock = [
    '<!-- gtm-noscript:start -->',
    `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    '<!-- gtm-noscript:end -->'
  ].join('\r\n');

  let out = html;
  out = out.replace(/\s*<!-- gtm:start -->[\s\S]*?<!-- gtm:end -->\s*/g, '\r\n');
  out = out.replace(/\s*<!-- gtm-noscript:start -->[\s\S]*?<!-- gtm-noscript:end -->\s*/g, '\r\n');
  out = out.replace(/<\/head>/i, `${headBlock}\r\n</head>`);
  out = out.replace(/<body([^>]*)>/i, `<body$1>\r\n${bodyBlock}`);
  return out;
}

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

function copyHtml(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const html = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(destPath, injectGtm(html), 'utf8');
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
      if (e.name.toLowerCase().endsWith('.html')) {
        copyHtml(src, dst);
      } else {
        copyFile(src, dst);
      }
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
  copyHtml(srcFilePath, path.join(destBaseDir, slug, 'index.html'));
}

// 1) Rebuild /en from UA sources (and inject SEO/switcher)
run('node', [path.join(root, 'scripts', 'rebuild-en.mjs')]);

// 2) Prepare dist/
ensureEmptyDir(dist);

// 3) Copy site files
for (const html of listRootHtmlFiles()) {
  const srcPath = path.join(root, html);
  copyHtml(srcPath, path.join(dist, html));
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
