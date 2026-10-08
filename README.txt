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
Animationen: js/motion.js (GSAP 3.13, wird von cdn.jsdelivr.net geladen). Ohne Internet bzw. ohne GSAP
          erscheint die Seite einfach ohne Animation. Wer „Bewegung reduzieren“ eingestellt hat, sieht keine Bewegung.
Schrift:  Archivo (Google Fonts, wird online geladen; ohne Internet greift Arial/Helvetica).
Ordner:   css/ (Design) · img/ (Logo, Icons als SVG) · js/ (Menü, Turnier-Einbettung)
Fotos:    Die Vereinsfotos werden direkt von tg-gold-weiss.de geladen. Für eine komplett eigenständige
          Seite einmal 'python3 bilder-herunterladen.py' ausführen (lädt alle Fotos nach fotos/).
Rechtliches: impressum.html und datenschutz.html enthalten Platzhalter – bitte mit den echten Texten füllen.
