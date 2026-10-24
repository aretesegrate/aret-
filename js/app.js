function loadMaps() {
        document.querySelectorAll('iframe[data-map-src]').forEach(function(f) { if (!f.getAttribute('src')) { f.src = f.dataset.mapSrc; } });
        document.documentElement.classList.add('maps-on');
        try { localStorage.setItem('arete-maps', '1'); } catch (e) {}
    }
    try { if (localStorage.getItem('arete-maps') === '1') { loadMaps(); } } catch (e) {}
    // ══════════ CAROSELLO PRIMA / DOPO ══════════
    // Aggiungere qui le coppie di foto (cartella img/prima-dopo/). Con la lista vuota l'hero mostra la foto dello studio.
    var PRIMA_DOPO = [
        // { prima: '/img/prima-dopo/01-prima.jpg', dopo: '/img/prima-dopo/01-dopo.jpg', caption: 'Postura · 3 mesi di percorso' },
    ];
    function buildBeforeAfter(list) {
        var box = document.getElementById('heroMedia');
        if (!box || !list.length) { return; }
        var html = '<div class="ba' + (list.length < 2 ? ' ba--single' : '') + '" aria-roledescription="carosello" aria-label="Risultati prima e dopo il percorso Areté">';
        list.forEach(function(s, i) {
            var alt = s.caption ? ': ' + s.caption : '', lazy = i ? ' loading="lazy"' : '';
            html += '<figure class="ba-slide" data-caption="' + (s.caption || '') + '"><div class="ba-pair">' +
                '<div class="ba-half"><img src="' + s.prima + '" alt="Prima del percorso' + alt + '"' + lazy + '><span class="ba-tag">Prima</span></div>' +
                '<div class="ba-half"><img src="' + s.dopo + '" alt="Dopo il percorso' + alt + '"' + lazy + '><span class="ba-tag ba-tag--dopo">Dopo</span></div>' +
                '</div></figure>';
        });
        html += '<button type="button" class="ba-nav ba-prev" aria-label="Foto precedente">&#8249;</button><button type="button" class="ba-nav ba-next" aria-label="Foto successiva">&#8250;</button>';
        html += '<div class="ba-foot"><div class="ba-caption"></div><div class="ba-dots">';
        list.forEach(function(s, i) { html += '<button type="button" class="ba-dot" aria-label="Vai alla foto ' + (i + 1) + '"></button>'; });
        html += '</div></div></div>';
        box.innerHTML = html;
        var root = box.firstChild, slides = root.querySelectorAll('.ba-slide'), dots = root.querySelectorAll('.ba-dot'), cap = root.querySelector('.ba-caption'), cur = 0, timer = null;
        function go(n) {
            cur = (n + slides.length) % slides.length;
            slides.forEach(function(el, i) { el.classList.toggle('is-active', i === cur); });
            dots.forEach(function(el, i) { el.classList.toggle('is-active', i === cur); });
            cap.textContent = slides[cur].dataset.caption;
        }
        function play() {
            clearInterval(timer);
            if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
            timer = setInterval(function() { go(cur + 1); }, 5000);
        }
        root.querySelector('.ba-prev').addEventListener('click', function() { go(cur - 1); play(); });
        root.querySelector('.ba-next').addEventListener('click', function() { go(cur + 1); play(); });
        dots.forEach(function(d, i) { d.addEventListener('click', function() { go(i); play(); }); });
        root.addEventListener('mouseenter', function() { clearInterval(timer); });
        root.addEventListener('mouseleave', play);
        var x0 = null;
        root.addEventListener('touchstart', function(e) { x0 = e.touches[0].clientX; }, { passive: true });
        root.addEventListener('touchend', function(e) {
            if (x0 === null) { return; }
            var dx = e.changedTouches[0].clientX - x0; x0 = null;
            if (Math.abs(dx) > 40) { go(dx < 0 ? cur + 1 : cur - 1); play(); }
        });
        go(0); play();
    }
    buildBeforeAfter(PRIMA_DOPO);
    function toggleFaq(el) {
        var item = el.parentElement;
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function(openItem) { openItem.classList.remove('open'); var b = openItem.querySelector('[aria-expanded]'); if (b) { b.setAttribute('aria-expanded', 'false'); } });
        if (!wasOpen) { item.classList.add('open'); el.setAttribute('aria-expanded', 'true'); }
    }
    // ══════════ Form: UTM, invio a Google Sheet, redirect /grazie/, WhatsApp ══════════
    var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz7V31hb6pPfotYOaW8hgvTBC47HZ4XPz80UiIWdnb9gcnoFw1SJPqW8AxewyxvorcO/exec';
    var FORM_T0 = Date.now(); // antispam: momento di caricamento pagina
    (function () {
        try {
            var p = new URLSearchParams(location.search);
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
                var v = p.get(k); if (v) { sessionStorage.setItem('arete_' + k, v.slice(0, 200)); }
            });
            if (!sessionStorage.getItem('arete_landing')) {
                sessionStorage.setItem('arete_landing', (location.pathname + location.search).slice(0, 300));
            }
        } catch (e) {}
    })();
    function fillHidden(f) {
        try {
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
                var el = f.elements[k]; if (el) { el.value = sessionStorage.getItem('arete_' + k) || ''; }
            });
            var pg = f.elements['pagina']; if (pg) { pg.value = sessionStorage.getItem('arete_landing') || location.pathname; }
        } catch (e) {}
    }
    function handleSubmit(e) {
        e.preventDefault();
        var f = e.target;
        var done = false;
        var go = function () { if (done) { return; } done = true; window.location.href = '/grazie/'; };
        // Antispam: honeypot compilato = bot. Finge successo senza salvare né tracciare.
        var hp = f.elements['website'];
        if (hp && hp.value) { go(); return; }
        fillHidden(f);
        var tEl = f.elements['t']; if (tEl) { tEl.value = String(Date.now() - FORM_T0); }
        try { sessionStorage.setItem('arete_lead', '1'); } catch (_) {}
        if (FORM_ENDPOINT) {
            var body = new URLSearchParams(new FormData(f)).toString();
            fetch(FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: body }).then(go).catch(go);
            setTimeout(go, 2500);
        } else {
            go();
        }
    }
    function openWhatsAppForm() {
        var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var msg = 'Ciao! Vorrei prenotare una consulenza Areté.\n\n';
        msg += 'Nome: ' + g('nome') + ' ' + g('cognome') + '\n';
        msg += 'Email: ' + g('email') + '\n';
        msg += 'Telefono: ' + g('telefono') + '\n';
        msg += 'Mi interessa: ' + g('interesse') + '\n';
        msg += 'Messaggio: ' + g('messaggio');
        window.open('https://api.whatsapp.com/send/?phone=393517005245&text=' + encodeURIComponent(msg) + '&type=phone_number&app_absent=0', '_blank');
    }
    window.addEventListener('scroll', function() {
        var nav = document.getElementById('nav');
        if (window.scrollY > 50) { nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }
    });
    var revealObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) { if (entry.isIntersecting) { entry.target.classList.add('visible'); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { revealObs.observe(el); });
// ══════════ CAROSELLO RISULTATI ══════════
(function () {
    var track = document.getElementById('risultatiTrack');
    if (!track) { return; }
    function step() { var c = track.querySelector('.result-card'); return (c ? c.getBoundingClientRect().width : 320) + 16; }
    var prev = document.querySelector('.results-prev'), next = document.querySelector('.results-next');
    if (prev) { prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); }); }
    if (next) { next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); }); }
})();
// ══════════ MENU MOBILE: blocco scroll quando aperto ══════════
(function () {
    var toggle = document.querySelector('.mob-toggle'), links = document.getElementById('navLinks');
    if (!toggle || !links) { return; }
    toggle.addEventListener('click', function () {
        document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });
    toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
    });
})();
