/* =========================================================
   gate.js – spoločná logika pre stránky článkov
   ⚙️ KONFIGURÁCIA – vyplň rovnaké hodnoty ako v index.html
   ========================================================= */
const CONFIG = {
    EMAILJS_PUBLIC_KEY: "TVOJ_PUBLIC_KEY",        // EmailJS → Account → Public Key
    EMAILJS_SERVICE_ID: "TVOJ_SERVICE_ID",        // EmailJS → Email Services
    EMAILJS_TEMPLATE_NOTIFY: "TVOJ_TEMPLATE_NOTIFY", // notifikácia pre teba (rovnaká šablóna ako na hlavnej stránke)
    NOTIFY_EMAIL: "rastislav.kozlik@balanced-hr.com"
};

/* ===== Dark mode toggle ===== */
(function () {
    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('rk-theme', isDark ? 'dark' : 'light'); } catch (e) {}
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));
})();

/* ===== Rok vo footeri ===== */
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* ===== Lišta priebehu čítania ===== */
(function () {
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:#E60000;width:0;z-index:60;transition:width .1s linear;';
    document.body.appendChild(bar);
    function update() {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
})();

/* =========================================================
   E-MAIL GATE
   Prvá časť článku je viditeľná, zvyšok je rozmazaný.
   Po zadaní e-mailu sa obsah odomkne (a zostane odomknutý
   vďaka localStorage – platí pre všetky články).
   ========================================================= */
(function () {
    const KEY = 'rk-clanky-odomknute';
    const gateWrap = document.getElementById('gate-wrap');
    const gated = document.getElementById('gated');
    const overlay = document.getElementById('gate-overlay');
    if (!gateWrap || !gated || !overlay) return;

    function unlock() {
        gated.classList.remove('gated-locked');
        overlay.classList.add('hidden');
    }

    try { if (localStorage.getItem(KEY) === '1') { unlock(); return; } } catch (e) {}

    const form = document.getElementById('gate-form');
    const statusEl = document.getElementById('gate-status');
    const emailEl = document.getElementById('gate-email');
    const consentEl = document.getElementById('gate-consent');
    const btn = document.getElementById('gate-submit');

    function showStatus(msg, ok) {
        statusEl.textContent = msg;
        statusEl.className = 'mt-4 text-center text-sm font-semibold rounded-xl px-4 py-3 ' +
            (ok ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400');
    }

    const configured = CONFIG.EMAILJS_PUBLIC_KEY && !CONFIG.EMAILJS_PUBLIC_KEY.startsWith('TVOJ_');
    if (configured && window.emailjs) emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailEl.value.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showStatus('Zadajte platnú e-mailovú adresu.', false); return; }
        if (!consentEl.checked) { showStatus('Pre odomknutie článku je potrebný súhlas so spracovaním e-mailu.', false); return; }

        btn.disabled = true;
        showStatus('Odomykám…', true);

        if (configured && window.emailjs) {
            try {
                await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_NOTIFY, {
                    user_email: email,
                    to_email: CONFIG.NOTIFY_EMAIL,
                    page_url: window.location.href,
                    date: new Date().toLocaleString('sk-SK')
                });
            } catch (err) {
                console.error('EmailJS error:', err);
                /* lead sa nestratí úplne – článok aj tak odomkneme, ale chybu zalogujeme */
            }
        }

        try { localStorage.setItem(KEY, '1'); } catch (e2) {}
        unlock();
    });
})();
