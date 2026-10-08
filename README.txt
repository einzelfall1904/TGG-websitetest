TG Gold-Weiß Gelsenkirchen – Website-Paket
==========================================
Start: index.html im Browser öffnen. Zum Veröffentlichen den ganzen Ordner auf den Webspace hochladen.

Seitenstruktur
  Club:   verein.html, clubanlage.html, trainer.html, sponsoren.html
  Sport:  mannschaften.html, turniere.html, clubmeisterschaften.html, pumucklturnier.html
  Dazu:   probetraining.html, mitglied-werden.html, kontakt.html, impressum.html, datenschutz.html

Turniere
  turniere.html listet die abgeschlossenen Turniere. clubmeisterschaften.html und pumucklturnier.html
  zeigen die Sieger je Kategorie (teils noch Platzhalter-Namen!). jugend-stadtmeisterschaften-2026.html zeigt die Turnierbäume.

Quelltext: Alle HTML-Dateien sind eingerückt und in Abschnitte gegliedert. Jede Seite beginnt mit einem
          Kommentar zur Seite; Kopfzeile, Hauptinhalt, Fußzeile und jeder Inhaltsabschnitt sind mit
          <!-- ===== Name ===== --> markiert. css/style.css hat oben ein Inhaltsverzeichnis.
          Hinweis: &nbsp; zwischen Wörtern verhindert gezielt Zeilenumbrüche (z. B. „3&nbsp;Stunden“).
Plakate:  Ankündigungsplakate liegen in img/events/. Neues oder ausgetauschtes Plakat vorbereiten:
            python3 plakat-einbinden.py <Originaldatei> <name>
          Das erzeugt Vorschaubild und Großansicht; der Copyright-Hinweis wird dabei fest in die
          Großansicht gesetzt. Auf den Vorschaubildern blendet die Website ihn automatisch ein.
Animationen: js/motion.js mit GSAP 3.13 (liegt lokal in js/vendor/). Ohne GSAP erscheint die Seite
          einfach ohne Animation. Wer „Bewegung reduzieren“ eingestellt hat, sieht keine Bewegung.
Schrift:  Archivo (liegt lokal in fonts/, eingebunden oben in css/style.css).
Ordner:   css/ (Design) · fonts/ (Schrift) · img/ (Logo, Icons, Plakate) · fotos/ (Vereinsfotos) · js/ (Menü, Animationen)
Fotos:    Alle Fotos liegen in fotos/. Die Seite lädt nichts von fremden Servern, nur Google Maps
          nach Klick auf „Karte laden“.
