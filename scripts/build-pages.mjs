import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const enDir = path.join(root, 'en');

const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://alpik-kyiv.com').trim().replace(/\/+$/g, '');

const GTM_ID = (process.env.SITE_GTM_ID || '').trim();
const GADS_ID = (process.env.SITE_GADS_ID || '').trim();

function injectGoogleAdsTag(html) {
  if (!GADS_ID || !/^AW-\d+$/i.test(GADS_ID)) return html;

  const headBlock = [
    '<!-- gads:start -->',
    '<!-- Google tag (gtag.js) -->',
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${GADS_ID}"></script>`,
    '<script>',
    '  window.dataLayer = window.dataLayer || [];',
    '  function gtag(){dataLayer.push(arguments);} ',
    '  gtag(\'js\', new Date());',
    '',
    `  gtag(\'config\', '${GADS_ID}');`,
    '</script>',
    '<!-- gads:end -->'
  ].join('\r\n');

  let out = html;
  out = out.replace(/\s*<!-- gads:start -->[\s\S]*?<!-- gads:end -->\s*/g, '\r\n');
  out = out.replace(/<\/head>/i, `${headBlock}\r\n</head>`);
  return out;
}

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

function injectFavicon(html) {
  const headBlock = [
    '<!-- favicon:start -->',
    '<link rel="preload" as="image" href="/img/logo1-optimized.webp" fetchpriority="high">',
    '<link rel="preload" as="image" href="/img/logo1-optimized.png" fetchpriority="high">',
    '<link rel="icon" href="/img/favicon-32.png" type="image/png">',
    '<link rel="apple-touch-icon" href="/img/apple-touch-icon-180.png">',
    '<!-- favicon:end -->'
  ].join('\r\n');

  let out = html;
  // Remove any existing icon declarations so we can enforce the optimized set.
  out = out.replace(/\s*<link\b[^>]*\brel=["'](?:shortcut\s+icon|icon|apple-touch-icon)["'][^>]*>\s*/gi, '\r\n');
  out = out.replace(/\s*<!-- favicon:start -->[\s\S]*?<!-- favicon:end -->\s*/g, '\r\n');
  out = out.replace(/<\/head>/i, `${headBlock}\r\n</head>`);
  return out;
}

function routeFromDestPath(destPath) {
  const rel = path.relative(dist, destPath).split(path.sep).join('/');
  if (!rel) return null;

  if (rel.toLowerCase() === 'index.html') return '/';

  if (rel.toLowerCase().endsWith('/index.html')) {
    const dir = rel.slice(0, -'/index.html'.length);
    return `/${dir}/`;
  }

  if (rel.toLowerCase().endsWith('.html')) {
    const withoutExt = rel.slice(0, -'.html'.length);
    return `/${withoutExt}/`;
  }

  return null;
}

function injectI18nSeo(html, routePath) {
  if (!routePath) return html;
  if (!SITE_BASE_URL) return html;

  let out = html;
  out = out.replace(/\s*<!-- i18n-seo:start -->[\s\S]*?<!-- i18n-seo:end -->\s*/g, '\r\n');

  const isEn = routePath === '/en/' || routePath.startsWith('/en/');
  const uaPath = isEn ? routePath.replace(/^\/en/, '') : routePath;
  const enPath = isEn ? routePath : (uaPath === '/' ? '/en/' : `/en${uaPath}`);
  const canonicalPath = isEn ? enPath : uaPath;

  const headBlock = [
    '<!-- i18n-seo:start -->',
    `<link rel="canonical" href="${SITE_BASE_URL}${canonicalPath}">`,
    `<link rel="alternate" hreflang="uk" href="${SITE_BASE_URL}${uaPath}">`,
    `<link rel="alternate" hreflang="en" href="${SITE_BASE_URL}${enPath}">`,
    `<link rel="alternate" hreflang="x-default" href="${SITE_BASE_URL}${uaPath}">`,
    '<!-- i18n-seo:end -->'
  ].join('\r\n');

  out = out.replace(/<\/head>/i, `${headBlock}\r\n</head>`);
  return out;
}

function optimizeImgTags(html) {
  let out = html;

  // Header logo: use <picture> with WebP + lightweight PNG fallback.
  out = out.replace(/<img\b([^>]*\bclass\s*=\s*["'][^"']*\blogo-img\b[^"']*["'][^>]*)>/gi, (m, attrs) => {
    let a = attrs.replace(/\s*\/\s*$/i, '');
    a = a.replace(/\bsrc\s*=\s*["']\/img\/logo1\.png["']/i, 'src="/img/logo1-optimized.png"');
    if (!/\bfetchpriority\s*=\s*/i.test(a)) a += ' fetchpriority="high"';
    return [
      '<picture class="logo-picture">',
      '  <source type="image/webp" srcset="/img/logo1-optimized.webp">',
      `  <img${a}>`,
      '</picture>'
    ].join('');
  });

  // Footer logo: same idea, but no fetchpriority.
  out = out.replace(/<img\b([^>]*\bclass\s*=\s*["'][^"']*\bfooter-logo\b[^"']*["'][^>]*)>/gi, (m, attrs) => {
    let a = attrs.replace(/\s*\/\s*$/i, '');
    a = a.replace(/\bsrc\s*=\s*["']\/img\/logo1\.png["']/i, 'src="/img/logo1-optimized.png"');
    return [
      '<picture class="footer-logo-picture">',
      '  <source type="image/webp" srcset="/img/logo1-optimized.webp">',
      `  <img${a}>`,
      '</picture>'
    ].join('');
  });

  // Add non-blocking decode for all images (safe default). Handle "<img ... />".
  out = out.replace(/<img\b([^>]*?)>/gi, (m, attrs) => {
    if (/\bdecoding\s*=\s*/i.test(attrs)) return m;
    const cleaned = attrs.replace(/\s*\/\s*$/i, '');
    return `<img${cleaned} decoding="async">`;
  });

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
  let out = html;
  out = injectI18nSeo(out, routeFromDestPath(destPath));
  out = optimizeImgTags(out);
  out = injectFavicon(out);
  out = injectGtm(out);
  out = injectGoogleAdsTag(out);
  fs.writeFileSync(destPath, out, 'utf8');
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
run('node', [path.join(root, 'scripts', 'optimize-images.mjs')]);
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
