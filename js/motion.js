/* =====================================================================
   TG Gold-Weiß Gelsenkirchen – Animationen (GSAP)
   1. Seite blendet weich ein
   2. Startseite: Platzlinien zeichnen sich, Überschrift baut sich Buchstabe für Buchstabe auf, Foto wird aufgedeckt
   3. Seitenköpfe und Abschnittsüberschriften steigen aus einer Maske auf
   4. Karten, Listen, Bilder erscheinen beim Scrollen gestaffelt, Zahlen zählen hoch
   5. Kopfzeile: Lesefortschritt, beim Runterscrollen aus-, beim Hochscrollen einblenden
   6. Menüs, Turnierbaum-Reiter, Plakat-Großansicht und Karte bekommen weiche Übergänge
   7. Mikroanimationen: magnetische Buttons, leichtes 3D-Kippen von Karten, Foto-Zoom, Parallaxe
   8. Fußzeile: großer Schriftzug „Gold-Weiß“ fährt herein
   Wer im Betriebssystem „Bewegung reduzieren“ eingestellt hat, sieht alles sofort ohne Bewegung.
   Lädt GSAP nicht (z. B. offline), wird der Inhalt einfach ohne Animation angezeigt.
   ===================================================================== */
(function () {
  var html = document.documentElement;
  var show = function () { html.classList.remove('js'); };
  if (!window.gsap) { show(); return; }

  html.classList.add('gsap');
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  var ST = window.ScrollTrigger, Split = window.SplitText;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var one = function (s, r) { return (r || document).querySelector(s); };
  var page = [one('main'), one('footer')].filter(Boolean);

  // Elemente, die beim Scrollen gestaffelt erscheinen
  var REVEAL = ['.b', '.event', '.champs li', '.team', '.past', '.people li', '.reasons li', '.benefits li', '.steps li',
    '.logos li', '.gallery img', '.sponsor', '.facts > div', '.panel', '.coach', '.winners li', '.contact li', '.docs li',
    '.faq details', '.framed', '.wide', '.banner', '.map-consent', '.grp', 'ul.tick li', '.tabs', '.draw-head', '.more-t',
    '.note', '.cta .btns .btn', '.cta p', '.tier', '.extras'].join(', ');

  // Überschrift als Ganzes aus einer Maske (lange Wörter brechen weiter an den Trennstellen um)
  function revealBlock(el) {
    if (!el) return gsap.timeline();
    return gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)', y: 40 },
      { clipPath: 'inset(0% 0% -20% 0%)', y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'clipPath' });
  }

  var mm = gsap.matchMedia();
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', fine: '(hover: hover) and (pointer: fine)' }, function (ctx) {
    var motion = ctx.conditions.motion, fine = ctx.conditions.fine;
    if (!motion) { show(); return; }

    /* ---------- 1. Einblenden */
    gsap.fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power1.out', onStart: show });

    /* ---------- 2. Startseite */
    var hero = one('.hero');
    if (hero) {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      $('.hero-court .court-line').forEach(function (line) {
        var len = line.getTotalLength ? line.getTotalLength() : 1200;
        gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      });
      tl.to($('.hero-court .court-line'), { strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0);
      var h1 = one('.hero h1');
      if (h1 && Split) {
        var s = Split.create(h1, { type: 'words,chars', mask: 'words' });
        // Weiches Trennzeichen (&shy;) würde als eigener Buchstabe eine Lücke reißen –
        // während der Animation ausblenden, danach den Originaltext wiederherstellen.
        s.chars.forEach(function (c) { if (c.textContent === '­') c.style.display = 'none'; });
        tl.from(s.chars, { yPercent: 115, rotate: 8, duration: 0.9, stagger: 0.022, onComplete: function () { s.revert(); } }, 0.15);
      } else if (h1) { tl.add(revealBlock(h1), 0.15); }
      tl.from($('.kicker i'), { scaleX: 0, transformOrigin: 'left center', duration: 0.7 }, 0.1)
        .from($('.kicker span, .hero .lead'), { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.1 }, 0.35)
        .from($('.hero .btns .btn'), { autoAlpha: 0, y: 16, scale: 0.96, duration: 0.6, stagger: 0.08 }, 0.55)
        .fromTo($('.hero-photo img'), { clipPath: 'inset(100% 0% 0% 0% round 24px)', scale: 1.12 },
          { clipPath: 'inset(0% 0% 0% 0% round 24px)', scale: 1, duration: 1.3, ease: 'expo.out' }, 0.25)
        .from($('.hero-photo figcaption'), { autoAlpha: 0, x: -24, y: 10, duration: 0.7, ease: 'back.out(1.8)' }, 0.95);
      if (ST) {
        gsap.to($('.hero-photo img'), { yPercent: -6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to($('.hero-court'), { yPercent: 12, rotate: -20, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      }
      gsap.from($('.bento .b'), { autoAlpha: 0, y: 60, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.7 });
    }

    /* ---------- Probetraining-Kopf */
    if (one('.pt-hero')) {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .add(revealBlock(one('.pt-hero h1')), 0.1)
        .from($('.pt-copy .crumb, .pt-copy .lead'), { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.1 }, 0.3)
        .from($('.chips li'), { autoAlpha: 0, y: 10, scale: 0.9, duration: 0.45, stagger: 0.06, ease: 'back.out(2)' }, 0.5)
        .from($('.pt-copy .btns .btn'), { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.08 }, 0.65)
        .fromTo($('.pt-photo img'), { clipPath: 'inset(0% 100% 0% 0% round 24px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.2, ease: 'expo.out' }, 0.2);
    }

    /* ---------- 3. Seitenköpfe */
    $('.page-hero').forEach(function (ph) {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .add(revealBlock(one('h1', ph)), 0.05)
        .from($('.crumb, .lead', ph), { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.1 }, 0.25);
    });

    if (!ST) return; // ohne ScrollTrigger keine Scroll-Animationen

    /* ---------- Abschnittsüberschriften: am PC Zeile für Zeile, am Handy als Ganzes */
    $('.head h2, .split h2, .cta h2, .draw-head h2').forEach(function (h) {
      var st = { trigger: h, start: 'top 88%', once: true };
      if (Split && window.innerWidth >= 768) {
        var s = Split.create(h, { type: 'lines', mask: 'lines' });
        gsap.from(s.lines, { yPercent: 105, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: st });
      } else {
        gsap.timeline({ scrollTrigger: st }).add(revealBlock(h));
      }
    });

    /* ---------- 4. Gestaffeltes Erscheinen */
    var items = $(REVEAL).filter(function (n) { return !n.closest('.bento'); });
    gsap.set(items, { autoAlpha: 0, y: 32 });
    ST.batch(items, {
      start: 'top 90%', once: true,
      // overwrite 'auto': nur gleiche Eigenschaften überschreiben – sonst würde z. B. die Gold-Linie der Siegerkarten abgebrochen
      onEnter: function (batch) { gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', overwrite: 'auto' }); }
    });

    // Gold-Linie über den Siegerkarten wächst
    $('.champs li').forEach(function (c) {
      gsap.fromTo(c, { '--bar': 0 }, { '--bar': 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
    });

    // Zahlen zählen hoch
    $('.facts dt').forEach(function (dt) {
      var m = dt.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      var end = parseInt(m[1], 10), rest = m[2], o = { v: end > 1000 ? end - 60 : 0 };
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: dt, start: 'top 90%', once: true },
        onUpdate: function () { dt.textContent = Math.round(o.v) + rest; } });
    });

    // Turnierbäume: Runden fahren nacheinander herein
    $('.bracket').forEach(function (b) {
      gsap.from($('.round', b), { autoAlpha: 0, x: -20, duration: 0.6, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: b, start: 'top 85%', once: true } });
    });

    // Parallaxe für große Bilder
    $('.framed img, .wide img, .banner').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---------- 8. Fußzeile */
    var wm = one('.wordmark');
    if (wm) {
      if (Split) {
        var sw = Split.create(wm, { type: 'chars', mask: 'chars' });
        gsap.from(sw.chars, { yPercent: 100, duration: 1, stagger: 0.05, ease: 'power4.out', scrollTrigger: { trigger: wm, start: 'top 95%', once: true } });
      }
      gsap.fromTo(wm, { xPercent: -4 }, { xPercent: 2, ease: 'none', scrollTrigger: { trigger: wm, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    /* ---------- 7. Mikroanimationen (nur mit Maus) */
    if (fine) {
      $('.btn.lg, .btn.gold, .cta .btn, .event .btn').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        btn.addEventListener('pointerleave', function () { gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }); });
      });
      $('.b, .past, .team, .champs li, .winners a, .poster, .tier').forEach(function (card) {
        gsap.set(card, { transformPerspective: 900 });
        var rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        var ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        var lift = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3.out' });
        var k = card.classList.contains('poster') ? 10 : 4;
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * k); rx(-((e.clientY - r.top) / r.height - 0.5) * k); lift(-4);
        });
        card.addEventListener('pointerleave', function () { rx(0); ry(0); lift(0); });
      });
      $('.team').forEach(function (t) {
        var img = one('.ph img', t);
        if (!img) return;
        t.addEventListener('pointerenter', function () { gsap.to(img, { scale: 1.06, duration: 0.8, ease: 'power3.out' }); });
        t.addEventListener('pointerleave', function () { gsap.to(img, { scale: 1, duration: 0.8, ease: 'power3.out' }); });
      });
    }

    // Nachladende Bilder und Schrift verschieben Positionen – Scroll-Auslöser neu berechnen
    var refresh = function () { ST.refresh(); };
    $('img').forEach(function (img) { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  });

  /* ---------- 5. Kopfzeile */
  var header = one('header.top'), bar = one('header.top .progress');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastY = window.scrollY, hidden = false;
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) gsap.set(bar, { scaleX: max > 0 ? y / max : 0 });
    if (reduce || !header) return;
    if (y > lastY + 4 && y > 240 && !hidden && !document.body.classList.contains('menu-open')) {
      hidden = true; gsap.to(header, { yPercent: -100, duration: 0.35, ease: 'power2.in' });
    } else if ((y < lastY - 4 || y < 120) && hidden) {
      hidden = false;
      // transform danach entfernen – sonst würde das fixierte Mobilmenü abgeschnitten
      gsap.to(header, { yPercent: 0, duration: 0.45, ease: 'power3.out', clearProps: 'transform' });
    }
    lastY = y;
  }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  if (reduce) return;

  /* ---------- 6. Übergänge für Menüs, Reiter, Großansicht, Karte */
  // Untermenüs (Einträge gleiten nacheinander herein)
  $('.dd').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) gsap.fromTo($('.sub li', d), { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out', delay: 0.05 });
    });
  });
  // Mobilmenü
  var burger = one('.burger'), nav = one('#menu');
  if (burger && nav) burger.addEventListener('click', function () {
    if (nav.classList.contains('open')) gsap.fromTo($('.main > li, .actions .btn', nav), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' });
  });
  // Turnierbaum-Reiter
  $('.tabs [role="tab"], [data-tab]').forEach(function (t) {
    t.addEventListener('click', function () {
      requestAnimationFrame(function () {
        var p = one('.draw:not([hidden])');
        if (!p) return;
        gsap.fromTo($('.round', p), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
        gsap.fromTo($('.match', p), { scale: 0.97 }, { scale: 1, duration: 0.5, stagger: 0.015, ease: 'back.out(2)' });
      });
    });
  });
  // Plakat-Großansicht
  $('a[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function () {
      requestAnimationFrame(function () {
        var img = one('dialog.lightbox[open] img');
        if (img) gsap.fromTo(img, { scale: 0.9, autoAlpha: 0, y: 20 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' });
      });
    });
  });
  // Karte nach Klick
  $('.map-consent button').forEach(function (b) {
    var box = b.closest('.map-consent');
    b.addEventListener('click', function () {
      requestAnimationFrame(function () {
        var f = one('iframe', box);
        if (f) gsap.from(f, { autoAlpha: 0, scale: 0.98, duration: 0.5, ease: 'power2.out' });
      });
    });
  });
})();
