/* =====================================================================
   TG Gold-Weiß Gelsenkirchen – Funktionen der Website
   1. Mobilmenü (öffnen/schließen)
   2. Untermenüs „Club“ und „Sport“
   3. Kopfzeile beim Scrollen
   4. Eingebettete Inhalte (Ladeanzeige)
   5. Google Maps und Bildergalerien erst nach Klick laden (Zwei-Klick-Lösung)
   ===================================================================== */
(function () {
  var menu   = document.getElementById('menu');
  var burger = document.querySelector('.burger');
  var header = document.querySelector('header.top');
  var desktop = window.matchMedia('(min-width:1021px)');

  /* ---------- 1. Mobilmenü ---------- */
  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open);
    burger.querySelector('em').textContent = open ? 'Schließen' : 'Menü';
  }

  if (menu && burger) {
    burger.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    // Menü schließen, sobald ein Link angetippt wird
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && menu.classList.contains('open')) setMenu(false);
    });
    // Menü schließen, wenn das Fenster auf Desktop-Breite wechselt
    desktop.addEventListener('change', function (m) {
      if (m.matches) setMenu(false);
    });
  }

  /* ---------- 2. Untermenüs ---------- */
  var dropdowns = [].slice.call(document.querySelectorAll('.dd'));

  // Am Desktop ist immer nur ein Untermenü offen
  dropdowns.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open && desktop.matches) {
        dropdowns.forEach(function (o) { if (o !== d) o.open = false; });
      }
    });
  });

  // Klick außerhalb schließt Untermenüs (nur Desktop)
  document.addEventListener('click', function (e) {
    if (!desktop.matches) return;
    dropdowns.forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });

  // Escape schließt Untermenüs und Mobilmenü
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    dropdowns.forEach(function (d) { d.open = false; });
    if (menu && menu.classList.contains('open')) setMenu(false);
  });

  // Im Mobilmenü das Untermenü der aktuellen Seite bereits geöffnet zeigen
  if (!desktop.matches) {
    dropdowns.forEach(function (d) { if (d.querySelector('summary.on')) d.open = true; });
  }

  /* ---------- 3. Kopfzeile beim Scrollen ---------- */
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 4. Eingebettete Turnierpläne ---------- */
  [].forEach.call(document.querySelectorAll('.embed iframe'), function (frame) {
    var done = function () { frame.parentNode.classList.add('loaded'); };
    frame.addEventListener('load', done);
    setTimeout(done, 8000); // Ladeanzeige spätestens nach 8 Sekunden ausblenden
  });

  /* ---------- 5. Google Maps und Bildergalerien (Zwei-Klick-Lösung) ---------- */
  [].forEach.call(document.querySelectorAll('.map-consent'), function (box) {
    var button = box.querySelector('button');
    if (!button) return;
    button.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.className = box.getAttribute('data-class') || 'map';
      frame.title = box.getAttribute('data-title') || 'Karte: Feldmarkstraße 200, Gelsenkirchen';
      frame.src = box.getAttribute('data-src');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      box.innerHTML = '';
      box.classList.add('on');
      box.appendChild(frame);
    });
  });
})();

/* ---------- 6. Turnierbäume: Reiter für die Altersklassen ---------- */
(function () {
  var tabs = [].slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  if (!tabs.length) return;
  document.documentElement.classList.add('js');

  function show(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === 'p-' + id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
      if (on) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.id.replace('tab-', '')); });
    // Pfeiltasten wechseln zwischen den Reitern
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length];
      show(n.id.replace('tab-', ''), true);
    });
  });

  // Klick in der Siegerübersicht öffnet die passende Altersklasse
  [].forEach.call(document.querySelectorAll('[data-tab]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(a.getAttribute('data-tab'));
      document.querySelector('.jsm').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Direktlink (#p-u15w) öffnet die gewünschte Altersklasse
  var h = location.hash.replace('#p-', '');
  show(document.getElementById('p-' + h) ? h : tabs[0].id.replace('tab-', ''));
})();

/* ---------- 7. Plakate in Großansicht (Lightbox) ---------- */
(function () {
  var links = document.querySelectorAll('a[data-lightbox]');
  if (!links.length || typeof HTMLDialogElement !== 'function') return; // ohne Dialog-Unterstützung: Link öffnet das Bild normal

  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  // Der Copyright-Hinweis steckt in der Großansicht-Datei selbst (siehe plakat-einbinden.py)
  dlg.innerHTML = '<button type="button" class="lb-close" aria-label="Schließen">×</button><figure><img alt=""></figure>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img');

  [].forEach.call(links, function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      img.src = a.getAttribute('href');
      img.alt = a.querySelector('img') ? a.querySelector('img').alt : '';
      dlg.showModal();
    });
  });

  dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
  // Klick neben das Plakat schließt die Ansicht
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { img.removeAttribute('src'); });
})();
