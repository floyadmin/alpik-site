(function () {
  window.dataLayer = window.dataLayer || [];

  function getLang() {
    return window.location.pathname.startsWith('/en/') ? 'en' : 'uk';
  }

  function pushContactEvent(method, href) {
    window.dataLayer.push({
      event: 'contact_click',
      contact_method: method,
      contact_href: href,
      page_path: window.location.pathname,
      page_title: document.title,
      lang: getLang(),
      ts: Date.now(),
    });
  }

  function classifyHref(href) {
    if (!href) return null;
    const h = String(href);

    if (h.startsWith('tel:')) return { method: 'phone', href: h };
    if (h.startsWith('mailto:')) return { method: 'email', href: h };
    if (h.startsWith('viber://')) return { method: 'viber', href: h };

    try {
      const url = new URL(h, window.location.href);
      if (url.hostname === 't.me') return { method: 'telegram', href: url.href };
    } catch {
      // ignore
    }

    return null;
  }

  function onClick(e) {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;

    const info = classifyHref(a.getAttribute('href'));
    if (!info) return;

    pushContactEvent(info.method, info.href);
  }

  document.addEventListener('click', onClick, { capture: true });
})();
