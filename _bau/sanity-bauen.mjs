/* =====================================================================
   Website bauen: Inhalte aus Sanity (Aktionen + Mannschaftsfotos) in die
   statischen Seiten einsetzen. Läuft bei Netlify vor jeder Veröffentlichung.

   1. Kopiert die Website nach _site/ (ohne Bau-Werkzeuge)
   2. Holt die veröffentlichten Inhalte aus Sanity (öffentlicher Datensatz, kein Passwort nötig)
   3. Schreibt die Termine in index.html (zwischen den PFLEGE:TERMINE-Markierungen)
      und die Fotos in mannschaften.html
   4. Lädt die Bilder: Plakat 360 px + Großansicht mit Copyright-Streifen, Teamfotos 16:9

   Ist Sanity nicht erreichbar, wird die Website unverändert (Stand im Repository) veröffentlicht.
   Aufruf:  node _bau/sanity-bauen.mjs [Zielordner]
   ===================================================================== */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJEKT = 'g6e90jq0';
const DATENSATZ = 'production';
// Bewusst ohne CDN (api statt apicdn): Der Bau startet ca. 1 Sekunde nach dem Veröffentlichen – der CDN-Zwischenspeicher wäre da oft noch veraltet.
const API = `https://${PROJEKT}.api.sanity.io/v2025-02-19/data/query/${DATENSATZ}`;

const QUELLE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.resolve(QUELLE, process.argv[2] || '_site');
const AUSLASSEN = new Set(['_site', '_bau', 'node_modules', '.git', '.github', 'package.json', 'package-lock.json', 'netlify.toml']);

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const NB = ' ';

/* ---------- Hilfen für Text (gleiche Regeln wie im bisherigen Pflegebereich) */
const h = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const entitaeten = (s) => s.replace(/ /g, '&nbsp;').replace(/­/g, '&shy;');
const klartext = (s) => String(s ?? '').replace(/[ ]/g, ' ').replace(/­/g, '').trim();

function textZuHtml(t) {
  t = String(t ?? '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!t) return '';
  let s = h(t);
  s = s.replace(/ – /g, `${NB}– `);
  s = s.replace(/(\d+\.?) (Uhr|Jahre?n?|Euro|€|%|Plätze|Platz|Mannschaften|Meter|km|Stunden?|Minuten|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(?![\p{L}\d])/gu, `$1${NB}$2`);
  s = s.replace(/TG Gold-Weiß/g, 'TG<NBSP><span class="nw">Gold-Weiß</span>');
  s = s.replace(/(?<!class="nw">)Gold-Weiß/g, '<span class="nw">Gold-Weiß</span>');
  s = s.replace(/ (e\.V\.)/g, `${NB}$1`);
  s = s.replace(/(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag), (\d)/g, `$1,${NB}$2`);
  s = s.replace(/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) (\d{4})/g, `$1${NB}$2`);
  s = s.replace(/ (U\d{2})\b/g, `${NB}$1`);
  s = s.replace(/ ([^\s<>]{1,12})$/, `${NB}$1`);                                   // letztes Wort nie allein in der letzten Zeile
  s = s.replace(/E-Mail/g, '<span class="nw">E-Mail</span>');
  s = s.replace(/(?<![\w.+-])([\w.+-]+@[\w-]+\.[\w.-]+\w)(?![\w])/g, '<a href="mailto:$1">$1</a>');
  s = s.replace(/(?<!href=")\b(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/<NBSP>/g, NB);
  return s.replace(/\n/g, '<br>\n');
}

/* ---------- Datum */
const tagVon = (iso) => { const [j, m, t] = iso.split('-').map(Number); return new Date(Date.UTC(j, m - 1, t)); };
function datumLang(iso, mitJahr = true, mitMonat = true) {
  const d = tagVon(iso);
  let s = `${WOCHENTAGE[d.getUTCDay()]},${NB}${d.getUTCDate()}.`;
  if (mitMonat) s += NB + MONATE[d.getUTCMonth() + 1];
  if (mitJahr) s += NB + d.getUTCFullYear();
  return s;
}
const uhrText = (u) => { u = String(u || '').trim().replace(/\s*Uhr$/i, ''); return u ? `${u}${NB}Uhr` : ''; };
function datumAnzeige(von, bis, uhr) {
  let s;
  if (bis && bis !== von) {
    const a = tagVon(von), b = tagVon(bis);
    const gleicherMonat = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
    s = datumLang(von, a.getUTCFullYear() !== b.getUTCFullYear(), !gleicherMonat) + ' bis ' + datumLang(bis);
  } else s = datumLang(von);
  if (uhr) s += ', ' + uhrText(uhr);
  return s;
}
function datumKachel(a) {
  const t = [];
  if (a.datum) {
    const von = tagVon(a.datum), bis = a.bis && a.bis !== a.datum ? tagVon(a.bis) : null;
    let wt = WOCHENTAGE[von.getUTCDay()], tag, mon, jahr;
    if (bis) {
      wt = `${wt.slice(0, 2)}${NB}–${NB}${WOCHENTAGE[bis.getUTCDay()].slice(0, 2)}`;
      const gleich = von.getUTCFullYear() === bis.getUTCFullYear() && von.getUTCMonth() === bis.getUTCMonth();
      tag = `${von.getUTCDate()}.–${bis.getUTCDate()}.`;
      mon = gleich ? MONATE[von.getUTCMonth() + 1] : `${MONATE[von.getUTCMonth() + 1].slice(0, 3)}${NB}/${NB}${MONATE[bis.getUTCMonth() + 1].slice(0, 3)}`;
      jahr = bis.getUTCFullYear();
    } else { tag = `${von.getUTCDate()}.`; mon = MONATE[von.getUTCMonth() + 1]; jahr = von.getUTCFullYear(); }
    t.push(`<span class="wt">${h(wt)}</span>`, `<b${bis ? ' class="lang"' : ''}>${h(tag)}</b>`, `<span class="mon">${h(mon)}</span><span class="jahr">${jahr}</span>`);
    if (a.uhrzeit) t.push(`<span class="uhr">${h(uhrText(a.uhrzeit))}</span>`);
  } else {
    const jahr = (a.sortierMonat || '').slice(0, 4);
    t.push('<span class="wt">Termin</span>', `<b${jahr ? '' : ' class="lang"'}>${h(jahr || 'bald')}</b>`, '<span class="mon">Datum folgt</span>');
  }
  return `<div class="ev-kal" aria-hidden="true">${t.join('')}</div>`;
}

/* ---------- Eine Aktion als HTML (genau im Format der Startseite) */
function aktionHtml(a, e = '          ') {
  const id = a.kennung || 'aktion';
  const ende = a.datumOffen ? null : (a.bis || a.datum || null);
  let attr = ` id="${h(id)}"`;
  if (ende) attr += ` data-ende="${h(ende)}"`;
  if (a.appKennung) attr += ` data-app-anmeldung="${h(a.appKennung)}"`;

  let o = `${e}<article class="event ev-poster"${attr}>\n`;
  if (a.plakat) {
    const alt = a.plakatAlt || `Plakat zu ${klartext(a.titel)}`;
    o += `${e}  <a class="poster" href="img/events/${h(id)}-gross.jpg" data-lightbox aria-label="Plakat ${h(klartext(a.titel))} groß anzeigen"><img src="img/events/${h(id)}.jpg" alt="${h(alt)}" width="360" height="509" loading="lazy"></a>\n`;
  } else {
    o += `${e}  ${datumKachel(a)}\n`;
  }
  const datum = a.datumText ? textZuHtml(a.datumText) : (a.datum ? datumAnzeige(a.datum, a.bis, a.uhrzeit) : '');
  o += `${e}  <div>\n`;
  o += `${e}    <p class="ev-date">${datum}</p>\n`;
  o += `${e}    <h3>${h(a.titel).replace(/ (U\d{2})\b/g, `${NB}$1`)}</h3>\n`;
  if (a.motto) o += `${e}    <p class="ev-tag">${textZuHtml(a.motto)}</p>\n`;
  if (a.beschreibung) o += `${e}    <p>${textZuHtml(a.beschreibung)}</p>\n`;
  const angaben = [];
  for (const w of a.weitereAngaben || []) if (w?.bezeichnung && w?.text && /^wann$/i.test(w.bezeichnung)) angaben.push([w.bezeichnung, w.text]);
  if (a.ort) angaben.push(['Wo', a.ort]);
  for (const w of a.weitereAngaben || []) if (w?.bezeichnung && w?.text && !/^wann$/i.test(w.bezeichnung)) angaben.push([w.bezeichnung, w.text]);
  if (a.anmeldung) angaben.push(['Anmeldung', a.anmeldung]);
  if (angaben.length) {
    o += `${e}    <dl class="meta">\n`;
    for (const [l, w] of angaben) o += `${e}      <dt>${h(l)}</dt>\n${e}      <dd>${textZuHtml(w)}</dd>\n`;
    o += `${e}    </dl>\n`;
  }
  const knoepfe = (a.knoepfe || []).filter((k) => k?.text && k?.ziel).slice(0, 2);
  if (knoepfe.length) {
    o += `${e}    ${knoepfe.map((k) => `<a class="btn${k.stil === 'umrandet' ? ' ghost' : ''}" href="${h(linkZiel(k.ziel))}">${textZuHtml(k.text)}</a>`).join(' ')}\n`;
  }
  o += `${e}  </div>\n${e}</article>\n`;
  return entitaeten(o);
}
function linkZiel(z) {
  z = String(z).trim();
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(z)) return 'mailto:' + z;          // nackte E-Mail-Adresse
  if (/^www\./i.test(z)) return 'https://' + z;
  return z;
}

/* ---------- Bilder */
async function laden(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Bild nicht geladen (${r.status}): ${url}`);
  return Buffer.from(await r.arrayBuffer());
}
/** Ausschnitt (crop) und Mittelpunkt (hotspot) aus Sanity in Bild-Adressen-Parameter umrechnen */
function bildParameter(bild, w, hh) {
  const { width: W, height: H } = bild.groesse;
  const c = bild.crop || { left: 0, right: 0, top: 0, bottom: 0 };
  const rx = Math.round(c.left * W), ry = Math.round(c.top * H);
  const rw = Math.round((1 - c.left - c.right) * W), rh = Math.round((1 - c.top - c.bottom) * H);
  const p = new URLSearchParams({ w: String(w), h: String(hh), fit: 'crop', fm: 'jpg', q: '84' });
  if (bild.crop) p.set('rect', `${rx},${ry},${rw},${rh}`);
  if (bild.hotspot) {
    const fx = (bild.hotspot.x * W - rx) / rw, fy = (bild.hotspot.y * H - ry) / rh;
    p.set('crop', 'focalpoint');
    p.set('fp-x', String(Math.min(1, Math.max(0, fx)).toFixed(4)));
    p.set('fp-y', String(Math.min(1, Math.max(0, fy)).toFixed(4)));
  }
  return `${bild.url}?${p}`;
}

async function plakatSpeichern(a, sharp) {
  const ordner = path.join(ZIEL, 'img', 'events');
  await fs.mkdir(ordner, { recursive: true });
  const id = a.kennung;
  await fs.writeFile(path.join(ordner, `${id}.jpg`), await laden(`${a.plakat.url}?w=360&h=509&fit=crop&fm=jpg&q=84`));
  const gross = await laden(`${a.plakat.url}?w=1200&fit=max&fm=jpg&q=90`);
  if (/-mit-hinweis/.test(a.plakat.dateiname || '')) {          // aus dem alten Pflegebereich übernommen: Hinweis ist schon drin
    await fs.writeFile(path.join(ordner, `${id}-gross.jpg`), gross);
    return;
  }
  const bild = sharp(gross);
  const { width } = await bild.metadata();
  const streifen = await sharp(path.join(QUELLE, '_bau', 'copyright-streifen.png')).resize({ width }).toBuffer();
  await bild.composite([{ input: streifen, gravity: 'south' }]).jpeg({ quality: 86, progressive: true }).toFile(path.join(ordner, `${id}-gross.jpg`));
}

/* ---------- Seiten */
const MARKE = /<!-- PFLEGE:TERMINE:START.*?-->[\s\S]*?<!-- PFLEGE:TERMINE:ENDE -->/;
const MARKE_START = '<!-- PFLEGE:TERMINE:START – dieser Bereich wird beim Veröffentlichen aus Sanity erzeugt (nicht von Hand ändern) -->';

async function termineSchreiben(aktionen) {
  const datei = path.join(ZIEL, 'index.html');
  const html = await fs.readFile(datei, 'utf8');
  if (!MARKE.test(html)) throw new Error('In index.html fehlen die Markierungen PFLEGE:TERMINE.');
  const sortier = (a) => (a.datumOffen ? a.sortierMonat : a.datum) || '9999-12-31';
  aktionen.sort((x, y) => sortier(x).localeCompare(sortier(y)) || klartext(x.titel).localeCompare(klartext(y.titel), 'de'));
  const block = `${MARKE_START}\n${aktionen.map((a) => aktionHtml(a)).join('')}          <!-- PFLEGE:TERMINE:ENDE -->`;
  await fs.writeFile(datei, html.replace(MARKE, () => block));
}

async function mannschaftenSchreiben(teams) {
  const datei = path.join(ZIEL, 'mannschaften.html');
  let html = await fs.readFile(datei, 'utf8');
  const ordner = path.join(ZIEL, 'img', 'teams');
  await fs.mkdir(ordner, { recursive: true });
  const nachName = new Map(teams.map((t) => [klartext(t.name), t]));
  const offen = new Set(nachName.keys());
  const ersetzungen = [];
  html = html.replace(/(<article class="team">\s*)<div class="ph[^"]*"[^>]*>[\s\S]*?<\/div>([\s\S]*?<h3>([\s\S]*?)<\/h3>)/g, (ganz, vor, nach, name) => {
    const t = nachName.get(klartext(name.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '')));
    if (!t) return ganz;
    offen.delete(klartext(t.name));
    if (t.foto) {
      const datei = `img/teams/${t.kennung}-${String(t.foto.version).slice(0, 8)}.jpg`;
      ersetzungen.push([t, datei]);
      return `${vor}<div class="ph"><img src="${h(datei)}" alt="${h(t.foto.alt || 'Mannschaftsfoto ' + klartext(t.name))}" loading="lazy"></div>${nach}`;
    }
    const kz = entitaeten(h(String(t.kuerzel || klartext(t.name).slice(0, 1)).replace(/ /g, NB)));
    return `${vor}<div class="ph mono" aria-hidden="true"><span>${kz}</span></div>${nach}`;
  });
  for (const n of offen) console.warn(`  Hinweis: Mannschaft „${n}“ steht in Sanity, aber nicht auf mannschaften.html – übersprungen.`);
  for (const [t, d] of ersetzungen) await fs.writeFile(path.join(ZIEL, d), await laden(bildParameter(t.foto, 1200, 675)));
  await fs.writeFile(datei, html);
}

/* ---------- Ablauf */
async function kopieren(von, nach) {
  await fs.mkdir(nach, { recursive: true });
  for (const e of await fs.readdir(von, { withFileTypes: true })) {
    if (von === QUELLE && AUSLASSEN.has(e.name)) continue;
    const q = path.join(von, e.name), z = path.join(nach, e.name);
    if (e.isDirectory()) await kopieren(q, z); else await fs.copyFile(q, z);
  }
}

async function abfrage(groq) {
  const r = await fetch(`${API}?query=${encodeURIComponent(groq)}&perspective=published`);
  if (!r.ok) throw new Error(`Sanity antwortet nicht (${r.status})`);
  return (await r.json()).result;
}

const BILD = `{ "url": asset->url, "dateiname": asset->originalFilename, "version": asset->sha1hash, "groesse": asset->metadata.dimensions, crop, hotspot, alt }`;

async function main() {
  await fs.rm(ZIEL, { recursive: true, force: true });
  await kopieren(QUELLE, ZIEL);
  console.log(`Website nach ${path.relative(QUELLE, ZIEL) || '.'} kopiert.`);

  let aktionen, teams;
  try {
    [aktionen, teams] = await Promise.all([
      abfrage(`*[_type == "aktion" && defined(titel)]{ titel, datumOffen, datum, bis, uhrzeit, datumText, sortierMonat, motto, beschreibung, ort, anmeldung, weitereAngaben, knoepfe, "kennung": kennung.current, appKennung, "plakatAlt": plakat.alt, "plakat": plakat${BILD.replace(', alt }', ' }')} }`),
      abfrage(`*[_type == "mannschaft"] | order(reihenfolge asc){ name, kuerzel, "kennung": kennung.current, "foto": foto${BILD} }`),
    ]);
  } catch (err) {
    console.warn(`Sanity nicht erreichbar (${err.message}) – die Website wird mit dem Stand aus dem Repository veröffentlicht.`);
    return;
  }

  // Kennung absichern (Webadresse/Dateiname), doppelte vermeiden
  const vergeben = new Set();
  for (const a of aktionen) {
    let k = String(a.kennung || klartext(a.titel)).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'aktion';
    while (vergeben.has(k)) k += '-2';
    vergeben.add(k); a.kennung = k;
    if (!a.plakat?.url) a.plakat = null;
  }

  const sharp = aktionen.some((a) => a.plakat && !/-mit-hinweis/.test(a.plakat.dateiname || '')) ? (await import('sharp')).default : null;
  await Promise.all(aktionen.filter((a) => a.plakat).map((a) => plakatSpeichern(a, sharp)));
  await termineSchreiben(aktionen);
  console.log(`${aktionen.length} Aktionen eingesetzt (${aktionen.filter((a) => a.plakat).length} mit Plakat).`);

  await mannschaftenSchreiben(teams.map((t) => ({ ...t, foto: t.foto?.url ? t.foto : null })));
  console.log(`${teams.length} Mannschaften eingesetzt (${teams.filter((t) => t.foto?.url).length} mit Foto).`);
}

main().catch((err) => { console.error('Fehler beim Bauen:', err); process.exit(1); });
