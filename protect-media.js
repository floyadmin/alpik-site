(function () {
  const WATERMARK_TEXT = 'alpik.com.ua';

  function isImageTarget(target) {
    if (!target) return false;
    if (target.tagName === 'IMG') return true;
    return !!(target.closest && target.closest('img'));
  }

  // Prevent common “save image as” flows (deterrent only)
  document.addEventListener(
    'contextmenu',
    (e) => {
      if (isImageTarget(e.target)) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  document.addEventListener(
    'dragstart',
    (e) => {
      if (isImageTarget(e.target)) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // Make images non-draggable in most browsers
  function markNonDraggable() {
    document.querySelectorAll('img').forEach((img) => {
      img.setAttribute('draggable', 'false');
      img.style.webkitUserDrag = 'none';
      img.style.userSelect = 'none';
    });
  }

  function ensureStyles() {
    if (document.getElementById('media-protect-styles')) return;

    const style = document.createElement('style');
    style.id = 'media-protect-styles';

    // SVG watermark as a data URL (diagonal repeated text)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
  <defs>
    <pattern id="p" patternUnits="userSpaceOnUse" width="260" height="260" patternTransform="rotate(-25)">
      <text x="0" y="80" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.22)">${WATERMARK_TEXT}</text>
      <text x="0" y="160" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.22)">©</text>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#p)"/>
</svg>`;

    const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

    style.textContent = `
      .media-protect-wrap{position:relative;display:inline-block;max-width:100%}
      .media-protect-wrap>img{display:block;max-width:100%;height:auto}
      .media-protect-watermark{position:absolute;inset:0;pointer-events:none;background-image:${dataUrl};background-size:240px 240px;mix-blend-mode:overlay}
    `;

    document.head.appendChild(style);
  }

  function wrapImagesWithWatermark() {
    ensureStyles();

    document.querySelectorAll('img').forEach((img) => {
      // Skip tiny icons/logos where watermark would look bad
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if ((w && w < 220) || (h && h < 160)) return;

      // Avoid double-wrapping
      if (img.parentElement && img.parentElement.classList && img.parentElement.classList.contains('media-protect-wrap')) {
        return;
      }

      const wrap = document.createElement('span');
      wrap.className = 'media-protect-wrap';

      const wm = document.createElement('span');
      wm.className = 'media-protect-watermark';

      const parent = img.parentNode;
      if (!parent) return;

      parent.insertBefore(wrap, img);
      wrap.appendChild(img);
      wrap.appendChild(wm);
    });
  }

  function init() {
    markNonDraggable();

    // Add watermark after images load
    const onReady = () => {
      wrapImagesWithWatermark();

      // In case of lazy-loaded images later
      const obs = new MutationObserver(() => {
        markNonDraggable();
        wrapImagesWithWatermark();
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  init();
})();
