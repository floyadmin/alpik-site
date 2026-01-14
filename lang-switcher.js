(function () {
    function isEnPath(pathname) {
        return (pathname || '').split('/').includes('en');
    }

    function getSlug(pathname) {
        const parts = (pathname || '').split('/').filter(Boolean);
        const onEn = isEnPath(pathname);

        // Remove leading 'en'
        const cleanParts = onEn ? parts.slice(1) : parts;
        const first = cleanParts[0] || '';

        // Support both /about/ and /about.html
        if (!first) return '';
        if (first.toLowerCase() === 'index.html' || first.toLowerCase() === 'index') return '';
        return first.replace(/\.html$/i, '');
    }

    function buildLinks() {
        const pathname = window.location.pathname;
        const onEn = isEnPath(pathname);

        const slug = getSlug(pathname);
        const uaHref = slug ? `/${slug}/` : '/';
        const enHref = slug ? `/en/${slug}/` : '/en/';

        return { onEn, uaHref, enHref };
    }

    function ensureLangSwitch() {
        const headerInner = document.querySelector('.header-main-inner');
        if (!headerInner) return;

        if (headerInner.querySelector('.lang-switch')) return;

        const { onEn, uaHref, enHref } = buildLinks();

        const wrap = document.createElement('div');
        wrap.className = 'lang-switch';
        wrap.setAttribute('aria-label', 'Language switch');

        const ua = document.createElement('a');
        ua.className = `lang-link${onEn ? '' : ' active'}`;
        ua.href = uaHref;
        ua.textContent = 'UA';

        const sep = document.createElement('span');
        sep.className = 'lang-sep';
        sep.textContent = '/';

        const en = document.createElement('a');
        en.className = `lang-link${onEn ? ' active' : ''}`;
        en.href = enHref;
        en.textContent = 'EN';

        wrap.appendChild(ua);
        wrap.appendChild(sep);
        wrap.appendChild(en);

        headerInner.appendChild(wrap);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureLangSwitch);
    } else {
        ensureLangSwitch();
    }
})();
