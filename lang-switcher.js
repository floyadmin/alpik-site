(function () {
    const MOBILE_MQ = '(max-width: 900px)';

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

    function ensureLangSwitchEl() {
        let wrap = document.querySelector('.lang-switch');
        if (wrap) return wrap;

        const { onEn, uaHref, enHref } = buildLinks();

        wrap = document.createElement('div');
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

        return wrap;
    }

    function updateLangSwitch(el) {
        if (!el) return;
        const { onEn, uaHref, enHref } = buildLinks();
        const links = el.querySelectorAll('a.lang-link');
        const ua = links[0];
        const en = links[1];
        if (ua) {
            ua.href = uaHref;
            ua.classList.toggle('active', !onEn);
        }
        if (en) {
            en.href = enHref;
            en.classList.toggle('active', !!onEn);
        }
    }

    function mountLangSwitch() {
        const mq = window.matchMedia ? window.matchMedia(MOBILE_MQ) : null;
        const isMobile = mq ? mq.matches : (window.innerWidth || 0) <= 900;

        const el = ensureLangSwitchEl();
        updateLangSwitch(el);

        if (isMobile) {
            const mobileNav = document.getElementById('mobileNav');
            const ul = mobileNav ? mobileNav.querySelector('ul') : null;
            if (!ul) return;

            let li = ul.querySelector('li.mobile-lang-switch-item');
            if (!li) {
                li = document.createElement('li');
                li.className = 'mobile-lang-switch-item';
                ul.insertBefore(li, ul.firstChild);
            }
            if (el.parentElement !== li) {
                li.appendChild(el);
            }
        } else {
            const headerInner = document.querySelector('.header-main-inner');
            if (!headerInner) return;
            if (el.parentElement !== headerInner) {
                headerInner.appendChild(el);
            }
        }
    }

    function setupHeaderScrollBehavior() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        const mobileNav = document.getElementById('mobileNav');
        const threshold = 120;
        const delta = 10;
        let lastY = window.scrollY || 0;
        let ticking = false;

        function apply() {
            ticking = false;
            const y = window.scrollY || 0;
            const menuOpen = !!(mobileNav && mobileNav.classList.contains('open'));

            if (menuOpen) {
                header.classList.remove('header-hidden');
                header.classList.toggle('header-compact', y > threshold);
                lastY = y;
                return;
            }

            if (y <= 10) {
                header.classList.remove('header-hidden');
                header.classList.remove('header-compact');
                lastY = y;
                return;
            }

            if (y > lastY + delta && y > threshold) {
                header.classList.add('header-hidden');
                header.classList.add('header-compact');
            } else if (y < lastY - delta) {
                header.classList.remove('header-hidden');
                header.classList.toggle('header-compact', y > threshold);
            }

            lastY = y;
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(apply);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        apply();
    }

    function ensureLangSwitch() {
        mountLangSwitch();
        setupHeaderScrollBehavior();

        const mq = window.matchMedia ? window.matchMedia(MOBILE_MQ) : null;
        if (mq) {
            const handler = () => mountLangSwitch();
            if (mq.addEventListener) mq.addEventListener('change', handler);
            else if (mq.addListener) mq.addListener(handler);
        } else {
            window.addEventListener('resize', () => mountLangSwitch());
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureLangSwitch);
    } else {
        ensureLangSwitch();
    }
})();
