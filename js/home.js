/* ══════════════════════════════════════════════════════════
   ARETÉ · animazioni home (GSAP + ScrollTrigger)
   Menu e marquee funzionano anche senza GSAP; con "riduci
   movimento" resta il layout statico.
   ══════════════════════════════════════════════════════════ */
(function () {
    var html = document.documentElement;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── MENU A TENDINA ─────────────────────────────────── */
    var btn = document.getElementById('menuBtn');
    var menu = document.getElementById('bmenu');
    var lastFocus = null;
    function setMenu(open, viaKeyboard) {
        html.classList.toggle('menu-open', open);
        if (btn) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
        if (menu) { menu.setAttribute('aria-hidden', open ? 'false' : 'true'); }
        if (open) {
            lastFocus = document.activeElement;
            /* Il focus va alla prima voce solo se il menu è aperto da tastiera */
            if (viaKeyboard) { setTimeout(function () { var f = menu && menu.querySelector('a'); if (f) { f.focus({ preventScroll: true }); } }, 450); }
        } else if (lastFocus && lastFocus.focus) {
            lastFocus.focus({ preventScroll: true });
        }
    }
    if (btn) { btn.addEventListener('click', function (e) { setMenu(!html.classList.contains('menu-open'), e.detail === 0); }); }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); } });
    if (menu) { [].forEach.call(menu.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); }); }

    /* ── COLORE NAV SULLE SEZIONI SCURE ─────────────────── */
    var nav = document.getElementById('nav');
    var themed = [].slice.call(document.querySelectorAll('[data-theme]')).filter(function (el) { return el !== nav; });
    var ticking = false;
    function updateNav() {
        ticking = false;
        if (!nav) { return; }
        var probe = 40, theme = 'light';
        for (var i = 0; i < themed.length; i++) {
            var r = themed[i].getBoundingClientRect();
            if (r.top <= probe && r.bottom > probe) { theme = themed[i].getAttribute('data-theme'); }
        }
        if (nav.getAttribute('data-theme') !== theme) { nav.setAttribute('data-theme', theme); }
        nav.classList.toggle('is-scrolled', window.scrollY > 30);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updateNav); } }, { passive: true });
    window.addEventListener('resize', updateNav);
    updateNav();

    /* ── MARQUEE: velocità e verso seguono lo scroll ────── */
    if (!reduce) {
        var anims = [].slice.call(document.querySelectorAll('.mq-track')).map(function (t) {
            return t.getAnimations ? t.getAnimations()[0] : null;
        }).filter(Boolean);
        if (anims.length) {
            var lastY = window.scrollY, vel = 0;
            (function loop() {
                var y = window.scrollY, d = y - lastY;
                lastY = y;
                vel += (d - vel) * 0.12;
                var target = (vel < -0.4 ? -1 : 1) * (1 + Math.min(Math.abs(vel) / 5, 6));
                anims.forEach(function (a) { a.playbackRate += (target - a.playbackRate) * 0.08; });
                requestAnimationFrame(loop);
            })();
        }
    }

    /* ── DA QUI SERVE GSAP ──────────────────────────────── */
    if (reduce || !window.gsap || !window.ScrollTrigger) { html.classList.remove('anim'); return; }
    html.classList.add('anim');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateNav, onRefresh: updateNav });

    /* Intro hero */
    gsap.timeline({ defaults: { ease: 'power4.out' } })
        .fromTo('.bnav', { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.2)
        .fromTo('.hero-title .ln > span', { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.1)
        .fromTo('.hero-meta', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 0.55)
        .fromTo('.hero-scroll', { scale: 0 }, { scale: 1, duration: 0.9, ease: 'back.out(1.6)' }, 0.75);

    var mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, function (ctx) {
        var desk = ctx.conditions.desk;

        /* Hero: la foto sale dal basso e si allarga a tutto schermo */
        var frame = document.querySelector('.hero-frame');
        /* Solo desktop: su mobile la foto resta ferma sotto i bottoni */
        if (frame && desk) {
            gsap.timeline({ scrollTrigger: { trigger: '.hero-wrap', start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
                .fromTo(frame,
                    { x: 0, y: 0, xPercent: -50, yPercent: 100, width: '34vw', height: '52vh', borderRadius: 6 },
                    { x: 0, y: 0, xPercent: -50, yPercent: 0, duration: 0.42, ease: 'none' })
                .to(frame, { width: '100vw', height: '100vh', borderRadius: 0, duration: 0.58, ease: 'power1.inOut' })
                .fromTo(frame.querySelector('img'), { scale: 1.2 }, { scale: 1, duration: 1, ease: 'none' }, 0)
                .to('.hero-content', { y: -50, autoAlpha: 0.3, duration: 1, ease: 'none' }, 0);
        }

        /* Bordo curvo di ogni sezione: sale bombato e si appiattisce */
        gsap.utils.toArray('.curve').forEach(function (sec) {
            gsap.fromTo(sec, { '--arc': desk ? 28 : 14 }, {
                '--arc': 1, ease: 'none',
                scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 20%', scrub: true }
            });
        });

        /* Titolo sfalsato: le righe scorrono in versi opposti */
        gsap.utils.toArray('.stagger-title .sl').forEach(function (line) {
            var x = parseFloat(line.getAttribute('data-x') || 0);
            gsap.fromTo(line.firstElementChild, { xPercent: x }, {
                xPercent: -x, ease: 'none',
                scrollTrigger: { trigger: line, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });

        /* Mouse sulla lista discipline: l'immagine segue in verticale */
        if (desk && window.matchMedia('(hover: hover)').matches) {
            gsap.utils.toArray('.drow').forEach(function (row) {
                var inner = row.querySelector('.drow-img-in');
                if (!inner) { return; }
                var toY = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3' });
                var toR = gsap.quickTo(inner, 'rotation', { duration: 0.6, ease: 'power3' });
                var reset;
                row.addEventListener('mousemove', function (e) {
                    var r = row.getBoundingClientRect();
                    toY((e.clientY - (r.top + r.height / 2)) * 0.4);
                    toR(gsap.utils.clamp(-7, 7, (e.movementX || 0) * 0.5));
                    clearTimeout(reset);
                    reset = setTimeout(function () { toR(0); }, 120);
                });
                row.addEventListener('mouseleave', function () { toY(0); toR(0); });
            });
        }

        /* Linea del percorso che si riempie */
        var fill = document.querySelector('.steps-fill');
        if (fill) {
            gsap.fromTo(fill, desk ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, {
                scaleX: 1, scaleY: 1, ease: 'none',
                scrollTrigger: { trigger: '.steps', start: 'top 78%', end: desk ? 'top 30%' : 'bottom 60%', scrub: true }
            });
        }
    });

    /* Righe dei titoli che salgono dalla maschera */
    gsap.utils.toArray('[data-reveal="lines"]').forEach(function (h) {
        gsap.fromTo(h.querySelectorAll('.ln > span, .sl > span'), { yPercent: 110 }, {
            yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.1,
            scrollTrigger: { trigger: h, start: 'top 86%' }
        });
    });

    /* Foto che si rivelano dal basso */
    gsap.utils.toArray('[data-reveal="img"]').forEach(function (el) {
        var img = el.querySelector('img');
        var d = parseFloat(el.getAttribute('data-delay') || 0);
        var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%' }, delay: d });
        tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut' });
        if (img) { tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.7, ease: 'power3.out' }, 0); }
    });

    /* Testi che salgono, singoli e a cascata */
    gsap.utils.toArray('[data-reveal="up"]').forEach(function (el) {
        gsap.fromTo(el, { autoAlpha: 0, y: 36 }, {
            autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' }
        });
    });
    gsap.utils.toArray('[data-reveal="stagger"]').forEach(function (group) {
        gsap.fromTo(group.children, { autoAlpha: 0, y: 36 }, {
            autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
            scrollTrigger: { trigger: group, start: 'top 86%' }
        });
    });

    /* Linee della lista discipline che si allungano */
    gsap.utils.toArray('.drow-line').forEach(function (l) {
        gsap.fromTo(l, { scaleX: 0 }, {
            scaleX: 1, duration: 1.3, ease: 'power3.inOut',
            scrollTrigger: { trigger: l, start: 'top 94%' }
        });
    });

    /* Marchio grande sotto i contatti, lettera per lettera */
    var marks = document.querySelectorAll('.brand-mark .bm-l');
    if (marks.length) {
        gsap.fromTo(marks, { yPercent: 105 }, {
            yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.06,
            scrollTrigger: { trigger: '.brand-mark', start: 'top 92%' }
        });
    }

    /* Ricalcolo dopo font e immagini */
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ScrollTrigger.refresh(); }); }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); updateNav(); });
})();
