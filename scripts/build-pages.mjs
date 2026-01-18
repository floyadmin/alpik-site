import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import { minify as minifyJs } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const enDir = path.join(root, 'en');

function shortHash(text) {
  return crypto.createHash('sha1').update(String(text || ''), 'utf8').digest('hex').slice(0, 10);
}

function shortHashBuffer(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
}

const IMAGE_VERSION_CACHE = new Map();

function getVersionForRelPath(relPath) {
  const key = String(relPath || '');
  if (!key) return '';
  if (IMAGE_VERSION_CACHE.has(key)) return IMAGE_VERSION_CACHE.get(key);
  const abs = path.join(root, key);
  if (!fs.existsSync(abs)) {
    IMAGE_VERSION_CACHE.set(key, '');
    return '';
  }
  const stat = fs.statSync(abs);
  if (!stat.isFile()) {
    IMAGE_VERSION_CACHE.set(key, '');
    return '';
  }
  const v = shortHashBuffer(fs.readFileSync(abs));
  IMAGE_VERSION_CACHE.set(key, v);
  return v;
}

function normalizeRelativeImgPaths(html) {
  let out = html;
  // Make relative img paths root-relative so pretty URLs like /service-xx/ don't break.
  out = out.replace(
    /(\b(?:src|href|poster|data-src|data-href)\s*=\s*)(["'])(?:\.\/|\.\/\/)?img\//gi,
    '$1$2/img/'
  );
  out = out.replace(/url\(\s*(["']?)(?:\.\/|\.\/\/)?img\//gi, 'url($1/img/');
  return out;
}

function rewriteHeavyPngPhotosToJpeg(html) {
  // These PNGs are photo-like and huge; we generate .jpg equivalents in optimize-images.mjs.
  // Rewrite URLs so the site downloads much smaller images on mobile.
  let out = html;
  out = out.replace(/\/(img\/montazh)\.png(\?[^"')\s>]*)?/gi, '/$1.jpg');
  out = out.replace(/\/(img\/painting)\.png(\?[^"')\s>]*)?/gi, '/$1.jpg');
  return out;
}

function injectImageVersions(html) {
  let out = html;

  // Add/replace ?v= for local /img/* assets to play nicely with immutable caching.
  // We only touch strings that clearly look like quoted attributes or url(...) usages.
  out = out.replace(
    /([("'=])\/img\/([A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|svg|gif))(?:\?[^"')\s>]*)?/gi,
    (m, prefix, file) => {
      const cleanPath = `/img/${file}`;
      const v = getVersionForRelPath(`img/${file}`);
      if (!v) return `${prefix}${cleanPath}`;
      return `${prefix}${cleanPath}?v=${v}`;
    }
  );

  return out;
}

const STYLE_VERSION = fs.existsSync(path.join(root, 'style.css'))
  ? shortHash(fs.readFileSync(path.join(root, 'style.css'), 'utf8'))
  : '';
const LANG_SWITCHER_VERSION = fs.existsSync(path.join(root, 'lang-switcher.js'))
  ? shortHash(fs.readFileSync(path.join(root, 'lang-switcher.js'), 'utf8'))
  : '';

function injectAssetVersions(html) {
  let out = html;
  if (STYLE_VERSION) {
    out = out.replace(/(href\s*=\s*)(["'])\/(style\.css)(\?[^"']*)?\2/gi, (m, p1, q, file) => {
      if (/\?v=/.test(m)) return m;
      return `${p1}${q}/${file}?v=${STYLE_VERSION}${q}`;
    });
  }
  if (LANG_SWITCHER_VERSION) {
    out = out.replace(/(src\s*=\s*)(["'])\/(lang-switcher\.js)(\?[^"']*)?\2/gi, (m, p1, q, file) => {
      if (/\?v=/.test(m)) return m;
      return `${p1}${q}/${file}?v=${LANG_SWITCHER_VERSION}${q}`;
    });
  }
  return out;
}

const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://alpik-kyiv.com').trim().replace(/\/+$/g, '');

// Google Tag Manager container ID.
// If not provided via env, fall back to the container from the project setup.
const DEFAULT_GTM_ID = 'GTM-M7QW4QDS';
const GTM_ID = (process.env.SITE_GTM_ID || DEFAULT_GTM_ID).trim();

// Legacy single-ID env var (kept for backwards compatibility)
const GADS_ID = (process.env.SITE_GADS_ID || '').trim();

// Prefer SITE_GADS_IDS (comma/space-separated). Default keeps only the new Ads ID.
const DEFAULT_GADS_IDS = 'AW-17880869861';
const GADS_IDS_RAW = (process.env.SITE_GADS_IDS ?? (GADS_ID || DEFAULT_GADS_IDS)).trim();

// Disabled by default; set SITE_GA4_ID if you want GA4.
const GA4_ID = (process.env.SITE_GA4_ID || '').trim();

// Google Ads conversion tracking for interactive phone numbers.
// Override via SITE_ADS_CONVERSION_CONTACT_SEND_TO if needed.
const DEFAULT_ADS_CONVERSION_CONTACT_SEND_TO = 'AW-17880869861/EgvzCPSPt-cbEOXXoc5C';
const ADS_CONVERSION_CONTACT_SEND_TO = (
  process.env.SITE_ADS_CONVERSION_CONTACT_SEND_TO || DEFAULT_ADS_CONVERSION_CONTACT_SEND_TO
).trim();

function parseGadsIds(raw) {
  const parts = String(raw || '')
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [];
  for (const id of parts) {
    if (!/^AW-\d+$/i.test(id)) continue;
    const norm = id.toUpperCase();
    if (!out.includes(norm)) out.push(norm);
  }
  return out;
}

function parseGa4Id(raw) {
  const id = String(raw || '').trim();
  if (!id) return '';
  if (!/^G-[A-Z0-9]+$/i.test(id)) return '';
  return id;
}

function injectGoogleTag(html) {
  const ga4Id = parseGa4Id(GA4_ID);
  const gadsIds = parseGadsIds(GADS_IDS_RAW);
  if (!ga4Id && gadsIds.length === 0) return html;

  const loaderId = ga4Id || gadsIds[0];
  const configLines = [];
  if (ga4Id) configLines.push(`  gtag('config', '${ga4Id}');`);
  for (const id of gadsIds) configLines.push(`  gtag('config', '${id}');`);

  const headBlock = [
    '<!-- gtag:start -->',
    '<!-- Google tag (gtag.js) -->',
    '<link rel="preconnect" href="https://www.googletagmanager.com">',
    '<link rel="dns-prefetch" href="//www.googletagmanager.com">',
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${loaderId}"></script>`,
    '<script>',
    '  window.dataLayer = window.dataLayer || [];',
    '  function gtag(){dataLayer.push(arguments);} ',
    '  gtag(\'js\', new Date());',
    '',
    ...configLines,
    '</script>',
    '<!-- gtag:end -->'
  ].join('\r\n');

  let out = html;
  // Clean up any previous variants to avoid duplicate tags on rebuild.
  out = out.replace(/\s*<!-- gtag:start -->[\s\S]*?<!-- gtag:end -->\s*/g, '\r\n');
  out = out.replace(/\s*<!-- ga4:start -->[\s\S]*?<!-- ga4:end -->\s*/g, '\r\n');
  out = out.replace(/\s*<!-- gads:start -->[\s\S]*?<!-- gads:end -->\s*/g, '\r\n');

  out = out.replace(/<head(\b[^>]*)>/i, `<head$1>\r\n${headBlock}`);
  return out;
}

function injectAdsContactConversion(html) {
  if (!ADS_CONVERSION_CONTACT_SEND_TO) return html;

  const headBlock = [
    '<!-- ads-contact-conversion:start -->',
    '<!-- Event snippet for Интерактивные номера телефонов conversion page -->',
    '<script>',
    '  function gtag_report_conversion(url) {',
    '    var callback = function () {',
    '      if (typeof url != "undefined") {',
    '        window.location = url;',
    '      }',
    '    };',
    '    if (typeof window.gtag !== "function") {',
    '      callback();',
    '      return false;',
    '    }',
    '    window.gtag("event", "conversion", {',
    `      "send_to": "${ADS_CONVERSION_CONTACT_SEND_TO}",`,
    '      "value": 1.0,',
    '      "currency": "UAH",',
    '      "event_callback": callback',
    '    });',
    '    setTimeout(callback, 1000);',
    '    return false;',
    '  }',
    '',
    '  (function () {',
    '    function shouldTrackHref(href) {',
    '      if (!href) return false;',
    '      var h = String(href);',
    '      if (h.indexOf("tel:") === 0) return true;',
    '      if (h.indexOf("mailto:") === 0) return true;',
    '      if (h.indexOf("viber://") === 0) return true;',
    '      if (h.indexOf("tg://") === 0) return true;',
    '      try {',
    '        var url0 = new URL(h, window.location.href);',
    '        var host0 = String(url0.hostname || "").toLowerCase();',
    '        if (host0 === "t.me" || host0 === "telegram.me") return true;',
    '        return false;',
    '      } catch (e) {',
    '        return false;',
    '      }',
    '    }',
    '',
    '    function onClick(e) {',
    '      var a = e.target && e.target.closest ? e.target.closest("a") : null;',
    '      if (!a) return;',
    '',
    '      var href = a.getAttribute("href");',
    '      if (!shouldTrackHref(href)) return;',
    '',
    '      var hs = String(href || "");',
    '      if (hs.indexOf("tel:") === 0 || hs.indexOf("mailto:") === 0 || hs.indexOf("viber://") === 0 || hs.indexOf("tg://") === 0) {',
    '        try { gtag_report_conversion(); } catch (err) {}',
    '        return;',
    '      }',
    '',
    '      try {',
    '        var url = new URL(hs, window.location.href);',
    '        var host = String(url.hostname || "").toLowerCase();',
    '        if (host === "t.me" || host === "telegram.me") {',
    '          e.preventDefault();',
    '          gtag_report_conversion(url.href);',
    '          setTimeout(function () { window.location = url.href; }, 1000);',
    '        }',
    '      } catch (err) {',
    '        // ignore',
    '      }',
    '    }',
    '',
    '    document.addEventListener("click", onClick, { capture: true });',
    '  })();',
    '</script>',
    '<!-- ads-contact-conversion:end -->'
  ].join('\r\n');

  let out = html;
  out = out.replace(/\s*<!-- ads-contact-conversion:start -->[\s\S]*?<!-- ads-contact-conversion:end -->\s*/g, '\r\n');

  if (/<!-- gtag:end -->/i.test(out)) {
    out = out.replace(/<!-- gtag:end -->/i, `<!-- gtag:end -->\r\n${headBlock}`);
  } else if (/<!-- ga4:end -->/i.test(out)) {
    // Backwards compatibility for older builds.
    out = out.replace(/<!-- ga4:end -->/i, `<!-- ga4:end -->\r\n${headBlock}`);
  } else {
    out = out.replace(/<head(\b[^>]*)>/i, `<head$1>\r\n${headBlock}`);
  }

  return out;
}

// Google Ads tag is handled by injectGoogleTag().

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

function injectMetaKeywords(html, routePath) {
  if (!routePath) return html;

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function textFromTag(source, tagName) {
    const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const m = source.match(re);
    if (!m) return '';
    return m[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function textFromClass(source, className) {
    const re = new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<`, 'i');
    const m = source.match(re);
    if (!m) return '';
    return m[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function clampDescription(value) {
    const v = String(value || '').replace(/\s+/g, ' ').trim();
    if (!v) return '';
    if (v.length <= 160) return v;
    return v.slice(0, 157).replace(/\s+\S*$/g, '').trim() + '…';
  }

  const isEn = routePath === '/en/' || routePath.startsWith('/en/');
  const uaPath = isEn ? routePath.replace(/^\/en/, '') : routePath;

  const ua = {
    '/': {
      description:
        'Висотні роботи та промисловий альпінізм у Києві та області: фасадні роботи, клінінг, монтаж і ремонт на висоті. Безпечно, якісно, в узгоджені терміни.',
      keywords:
        'промисловий альпінізм київ, висотні роботи, фасадні роботи, ремонт фасаду, мийка фасаду, клінінг, миття вікон, монтаж на висоті, демонтаж, ремонт даху, монтаж сонячних панелей'
    },
    '/our-services/': {
      description:
        'Перелік послуг alpiK: фасадні роботи, клінінг, монтаж, демонтаж, ремонт і обслуговування промислових об’єктів та будівель у Києві й області.',
      keywords:
        'послуги промислового альпінізму, висотні роботи київ, фасадні роботи, клінінг київ, монтаж сонячних панелей, ремонт димових труб, демонтаж металоконструкцій'
    },
    '/service-02/': {
      description:
        'Фасадні роботи: ремонт, оздоблення, фарбування та гідрофобізація. Професійно виконуємо роботи на висоті у Києві та області.',
      keywords:
        'фасадні роботи київ, ремонт фасаду, фарбування фасаду, гідрофобізація фасаду, утеплення фасаду, промисловий альпінізм'
    },
    '/service-15/': {
      description:
        'Клінінг на висоті: миття фасадів, вікон та промислових цехів. Безпечні роботи на висоті у Києві та області.',
      keywords:
        'клінінг київ, миття фасадів, миття вікон, промисловий клінінг, висотне миття, мийка фасаду альпіністами'
    },
    '/service-16/': {
      description:
        'Монтаж сонячних панелей та інверторів: кріплення, прокладання кабелів і безпечне підключення. Роботи на покрівлях і фасадах у Києві та області.',
      keywords:
        'монтаж сонячних панелей київ, встановлення сонячних панелей, монтаж інвертора, сонячна електростанція під ключ, монтаж на даху'
    },
    '/solar-panels/': {
      description:
        'Сонячні панелі та інвертори: монтаж на дахах і фасадах, безпечні висотні роботи та акуратне підключення обладнання.',
      keywords:
        'сонячні панелі київ, монтаж сонячних панелей, інвертор, сонячна електростанція, монтаж на висоті'
    },
    '/contacts/': {
      description:
        'Контакти alpiK: замовити консультацію щодо висотних робіт, фасадних робіт, клінінгу та монтажу у Києві та області.',
      keywords:
        'контакти alpiK, промисловий альпінізм контакти, висотні роботи замовити'
    },
    '/montage/': {
      description:
        'Монтажні роботи на висоті: димоходи, водостоки, фасадні системи, світлопрозорі конструкції та інше. Київ і область.',
      keywords:
        'монтажні роботи на висоті, монтаж водостоків, монтаж димоходів, монтаж фасадних систем, промисловий альпінізм'
    },
    '/repair/': {
      description:
        'Ремонтні роботи на висоті: димові труби, елеватори, силоси, дахи. Безпечно виконуємо ремонт та відновлення у Києві й області.',
      keywords:
        'ремонт на висоті, ремонт димових труб, ремонт елеваторів, ремонт силосів, ремонт даху'
    }
  };

  const en = {
    '/en/': {
      description:
        'Rope access and high-altitude works in Kyiv region: facade works, cleaning, installation and repairs at height. Safe and on time.',
      keywords:
        'rope access Kyiv, high-altitude works, facade works, facade repair, facade cleaning, industrial cleaning, solar panel installation, roof repairs'
    },
    '/en/our-services/': {
      description:
        'Our services: facade works, industrial cleaning, installation, dismantling and repair of industrial sites and buildings in Kyiv region.',
      keywords:
        'rope access services, high-altitude works Kyiv, facade works, industrial cleaning, solar panel installation, chimney repair'
    },
    '/en/service-02/': {
      description:
        'Facade works: repair, finishing, painting and hydrophobic protection. Professional rope access team in Kyiv region.',
      keywords:
        'facade works Kyiv, facade repair, facade painting, hydrophobic protection, rope access'
    },
    '/en/service-15/': {
      description:
        'Industrial cleaning at height: washing facades, windows and production areas. Safe rope access works in Kyiv region.',
      keywords:
        'industrial cleaning Kyiv, facade washing, window cleaning, rope access cleaning'
    },
    '/en/service-16/': {
      description:
        'Solar panels & inverters installation: mounting, cable routing and safe connection on roofs and facades in Kyiv region.',
      keywords:
        'solar panel installation Kyiv, inverter installation, rooftop solar, turnkey solar'
    },
    '/en/solar-panels/': {
      description:
        'Solar panels & inverters: safe installation on roofs and facades, neat wiring and equipment connection.',
      keywords:
        'solar panels Kyiv, solar installation, inverter, rooftop solar'
    },
    '/en/contacts/': {
      description:
        'Contacts: request a consultation for rope access, facade works, cleaning and installation in Kyiv region.',
      keywords:
        'contacts, rope access consultation, high-altitude works'
    }
  };

  const map = isEn ? en : ua;
  const key = isEn ? routePath : uaPath;
  const meta = map[key];

  const titleText = textFromTag(html, 'title').replace(/\s*[—\-]\s*alpiK\s*$/i, '').trim();
  const h1Text = textFromTag(html, 'h1');
  const heroSubtitle = textFromClass(html, 'hero-subtitle');
  const leadText = textFromClass(html, 'services-catalog-lead');

  const defaultUk = {
    description: clampDescription(heroSubtitle || leadText || titleText),
    keywords: 'промисловий альпінізм, висотні роботи, Київ, alpiK'
  };

  const defaultEn = {
    description: clampDescription(heroSubtitle || leadText || titleText),
    keywords: 'rope access, high-altitude works, Kyiv, alpiK'
  };

  const chosen = meta || (isEn ? defaultEn : defaultUk);
  const description = clampDescription(chosen.description || titleText);

  const keywordParts = [];
  if (h1Text) keywordParts.push(h1Text);
  if (titleText && titleText !== h1Text) keywordParts.push(titleText);
  keywordParts.push(chosen.keywords);

  const keywords = Array.from(
    new Set(
      keywordParts
        .join(', ')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  )
    .slice(0, 18)
    .join(', ');

  let out = html;
  out = out.replace(/\s*<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>\s*/gi, '\r\n');
  out = out.replace(/\s*<meta\b[^>]*\bname\s*=\s*["']keywords["'][^>]*>\s*/gi, '\r\n');

  const headBlock = [
    '<!-- seo-meta:start -->',
    `<meta name="description" content="${escapeAttr(description)}">`,
    `<meta name="keywords" content="${escapeAttr(keywords)}">`,
    '<!-- seo-meta:end -->'
  ].join('\r\n');

  out = out.replace(/\s*<!-- seo-meta:start -->[\s\S]*?<!-- seo-meta:end -->\s*/g, '\r\n');
  out = out.replace(/<\/head>/i, `${headBlock}\r\n</head>`);
  return out;
}

function injectHeroImagesWithAlt(html, routePath) {
  if (!routePath) return html;

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function textFromTag(source, tagName) {
    const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const m = source.match(re);
    if (!m) return '';
    return m[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeImgSrc(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('/')) return s;
    // Handle img/..., ./img/..., .//img/... etc.
    return `/${s.replace(/^\.+\/+/, '').replace(/^\/+/, '')}`;
  }

  const isEn = routePath === '/en/' || routePath.startsWith('/en/');
  const h1Text = textFromTag(html, 'h1');
  const titleText = textFromTag(html, 'title').replace(/\s*[—\-]\s*alpiK\s*$/i, '').trim();
  const base = h1Text || titleText || (isEn ? 'Service' : 'Послуга');
  const alt = isEn ? `Work photo: ${base}` : `Фото робіт: ${base}`;

  let out = html;
  out = out.replace(/<div\b([^>]*\bclass\s*=\s*["'][^"']*\bhero-bg\b[^"']*["'][^>]*)><\/div>/gi, (m, attrs) => {
    const styleMatch = attrs.match(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!styleMatch) return m;

    const styleValue = styleMatch[2] || '';
    if (!/\burl\s*\(/i.test(styleValue)) return m;

    const urlMatch = styleValue.match(/url\(\s*['\"]?([^'\"\)]+)['\"]?\s*\)/i);
    if (!urlMatch) return m;

    const rawSrc = urlMatch[1];
    const src = normalizeImgSrc(rawSrc);
    if (!src) return m;

    // Remove inline style from this block (gradient/filter handled in CSS for .hero-bg--img)
    const attrsWithoutStyle = attrs.replace(/\s*\bstyle\s*=\s*(["'])[\s\S]*?\1/i, '');

    // Ensure the helper class exists.
    let finalAttrs = attrsWithoutStyle;
    finalAttrs = finalAttrs.replace(/\bclass\s*=\s*(["'])([\s\S]*?)\1/i, (mm, q, cls) => {
      const classes = cls.split(/\s+/).filter(Boolean);
      if (!classes.includes('hero-bg--img')) classes.push('hero-bg--img');
      return `class=${q}${classes.join(' ')}${q}`;
    });

    return `<div${finalAttrs} aria-hidden="true"><img class="hero-bg-img" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" fetchpriority="high"></div>`;
  });

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

  // Add explicit dimensions for the biggest above-the-fold gallery/thumb images to reduce CLS.
  // (Dimensions are the source image pixels; layout still controlled by CSS.)
  out = out.replace(/<img\b([^>]*\bsrc\s*=\s*["']\/img\/(?:montazh|painting)\.jpg(?:\?[^"']*)?["'][^>]*)>/gi, (m, attrs) => {
    let a = attrs;
    if (/\bwidth\s*=\s*/i.test(a) || /\bheight\s*=\s*/i.test(a)) return m;

    const isMontazh = /\bsrc\s*=\s*["']\/img\/montazh\.jpg/i.test(a);
    const width = isMontazh ? 1536 : 1024;
    const height = isMontazh ? 1024 : 1536;
    a = a.replace(/\s*\/\s*$/i, '');
    return `<img${a} width="${width}" height="${height}">`;
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
  const routePath = routeFromDestPath(destPath);
  out = injectI18nSeo(out, routePath);
  out = injectMetaKeywords(out, routePath);
  out = normalizeRelativeImgPaths(out);
  out = rewriteHeavyPngPhotosToJpeg(out);
  out = optimizeImgTags(out);
  out = injectFavicon(out);
  out = injectGtm(out);
  out = injectGoogleTag(out);
  out = injectAdsContactConversion(out);
  out = injectAssetVersions(out);
  out = injectImageVersions(out);
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

function listDistHtmlFiles(dirPath) {
  const out = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      out.push(...listDistHtmlFiles(p));
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

function ensureGoogleTagEverywhere() {
  const files = listDistHtmlFiles(dist);
  for (const filePath of files) {
    const html = fs.readFileSync(filePath, 'utf8');
    const hasGtag = /<!--\s*gtag:start\s*-->/i.test(html);
    if (hasGtag) continue;

    let out = html;
    if (!hasGtag) out = injectGoogleTag(out);
    fs.writeFileSync(filePath, out, 'utf8');
  }
}

async function minifyDistAssets() {
  // Minify HTML/CSS/JS in dist/ only (source files remain readable).
  const cleanCss = new CleanCSS({ level: 2 });

  // CSS
  {
    const cssPath = path.join(dist, 'style.css');
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, 'utf8');
      const res = cleanCss.minify(css);
      if (!res.errors || res.errors.length === 0) {
        fs.writeFileSync(cssPath, res.styles, 'utf8');
      } else {
        console.warn('CSS minify skipped due to errors:', res.errors);
      }
    }
  }

  // JS
  for (const file of ['lang-switcher.js', 'tracking.js']) {
    const jsPath = path.join(dist, file);
    if (!fs.existsSync(jsPath)) continue;
    const js = fs.readFileSync(jsPath, 'utf8');
    const res = await minifyJs(js, {
      compress: true,
      mangle: true,
      ecma: 2017,
      safari10: true
    });
    if (res && res.code) fs.writeFileSync(jsPath, res.code, 'utf8');
  }

  // HTML
  const htmlFiles = listDistHtmlFiles(dist);
  for (const filePath of htmlFiles) {
    const html = fs.readFileSync(filePath, 'utf8');
    const min = await minifyHtml(html, {
      removeComments: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      keepClosingSlash: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: false,
      minifyJS: false
    });
    fs.writeFileSync(filePath, min, 'utf8');
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
ensureGoogleTagEverywhere();
await minifyDistAssets();
