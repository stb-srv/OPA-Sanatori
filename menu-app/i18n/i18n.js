window.OpaI18n = (function () {

    const LANGUAGES = {
        de: { code: 'de', label: 'Deutsch',      flag: '🇩🇪', dir: 'ltr' },
        en: { code: 'en', label: 'English',       flag: '🇬🇧', dir: 'ltr' },
        es: { code: 'es', label: 'Español',       flag: '🇪🇸', dir: 'ltr' },
        el: { code: 'el', label: 'Ελληνικά',      flag: '🇬🇷', dir: 'ltr' },
        da: { code: 'da', label: 'Dansk',         flag: '🇩🇰', dir: 'ltr' },
        pl: { code: 'pl', label: 'Polski',        flag: '🇵🇱', dir: 'ltr' },
        pt: { code: 'pt', label: 'Português',     flag: '🇵🇹', dir: 'ltr' },
        it: { code: 'it', label: 'Italiano',      flag: '🇮🇹', dir: 'ltr' },
        nl: { code: 'nl', label: 'Nederlands',    flag: '🇳🇱', dir: 'ltr' },
        fr: { code: 'fr', label: 'Français',      flag: '🇫🇷', dir: 'ltr' },
        tr: { code: 'tr', label: 'Türkçe',        flag: '🇹🇷', dir: 'ltr' },
        ru: { code: 'ru', label: 'Русский',       flag: '🇷🇺', dir: 'ltr' },
        uk: { code: 'uk', label: 'Українська',    flag: '🇺🇦', dir: 'ltr' },
        ar: { code: 'ar', label: 'العربية',       flag: '🇸🇦', dir: 'rtl' },
    };

    let currentLang = 'de';
    let translations = {};

    async function load(code) {
        if (!LANGUAGES[code]) code = 'de';
        try {
            const r = await fetch(`/menu-app/i18n/${code}.json`);
            if (!r.ok) throw new Error('not found');
            translations = await r.json();
        } catch {
            if (code !== 'de') {
                const r = await fetch('/menu-app/i18n/de.json');
                translations = await r.json();
                code = 'de';
            }
        }
        currentLang = code;
    }

    function t(key, vars = {}) {
        let str = key.split('.').reduce((o, k) => o?.[k], translations) ?? key;
        Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, v);
        });
        return str;
    }

    async function setLanguage(code) {
        await load(code);
        document.documentElement.dir  = LANGUAGES[code]?.dir || 'ltr';
        document.documentElement.lang = code;
        window._opaCurrentLang = code;
        applyDOM();
        if (window.OpaRender) window.OpaRender();
        updateLangBtn(code);
        const menu = document.getElementById('lang-dropdown-menu');
        if (menu) menu.innerHTML = renderDropdown();
    }

    function applyDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = t(el.dataset.i18n);
            if (el.tagName === 'INPUT') el.placeholder = val;
            else el.textContent = val;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });
    }

    function updateLangBtn(code) {
        const btn  = document.getElementById('lang-switcher-btn');
        const lang = LANGUAGES[code];
        if (btn && lang) {
            btn.innerHTML = `${lang.flag} <span>${code.toUpperCase()}</span>
                <i class="fas fa-chevron-down" style="font-size:.6rem;opacity:.6;"></i>`;
        }
    }

    function renderDropdown() {
        return Object.values(LANGUAGES).map(l => `
            <button class="lang-option ${l.code === currentLang ? 'active' : ''}"
                    onclick="OpaI18n.setLanguage('${l.code}');
                             document.getElementById('lang-dropdown').classList.remove('open');">
                <span class="lang-flag">${l.flag}</span>
                <span class="lang-label">${l.label}</span>
                ${l.code === currentLang ? '<i class="fas fa-check" style="margin-left:auto;color:var(--gold,#C8A96E);"></i>' : ''}
            </button>`).join('');
    }

    async function init() {
        const browserLang = navigator.language?.slice(0, 2) || 'de';
        const startLang   = LANGUAGES[browserLang] ? browserLang : 'de';
        await load(startLang);
        applyDOM();
        updateLangBtn(startLang);
        window._opaCurrentLang = startLang;
        document.addEventListener('click', (e) => {
            const dd  = document.getElementById('lang-dropdown');
            const btn = document.getElementById('lang-switcher-btn');
            if (dd && !dd.contains(e.target) && !btn?.contains(e.target))
                dd.classList.remove('open');
        });
    }

    return { init, t, setLanguage, renderDropdown, getLanguages: () => LANGUAGES, getCurrent: () => currentLang };
})();
