/* =====================================================================
   Mannschaften automatisch aus nuLiga (WTV) – Liga, Gruppe, Platz, Punkte, Links.

   Woher kommen die Mannschaften?
   1. Vereinsseite „Mannschaften“ auf nuLiga (laufende Saison).
   2. Ist dort nichts gemeldet (z. B. Winterpause), gelten die Mannschaften der letzten
      Saison weiter – deren nuLiga-Links stehen in der bisherigen mannschaften.html.
   Pro Mannschaft wird die nuLiga-Mannschaftsseite gelesen. Persönliche Angaben
   (Mannschaftsführer, Telefon, E-Mail) werden bewusst NICHT übernommen.
   ===================================================================== */

const NULIGA = 'https://wtv.liga.nu';
const VEREIN = '26022';
const PFAD = '/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/';
const REGIONEN = { 'R-L': 'Ruhr-Lippe', WTV: 'WTV', RLW: 'Regionalliga West', OW: 'Ostwestfalen', MS: 'Münsterland', SW: 'Südwestfalen' };
const ROEMISCH = ['', '', 'II', 'III', 'IV', 'V', 'VI'];
const ZAHLWORT = ['Kein', 'Ein', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf'];
const NB = ' ';

const h = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const entitaeten = (s) => s.replace(/ /g, '&nbsp;').replace(/­/g, '&shy;');
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&uuml;/g, 'ü').replace(/&ouml;/g, 'ö').replace(/&auml;/g, 'ä')
    .replace(/&Uuml;/g, 'Ü').replace(/&Ouml;/g, 'Ö').replace(/&Auml;/g, 'Ä').replace(/&szlig;/g, 'ß').replace(/&ndash;/g, '–')
    .split('\n').map((z) => z.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

async function laden(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'TGG-Website-Bau (Vereinswebsite TG Gold-Weiss Gelsenkirchen)' } });
  if (!r.ok) throw new Error(`nuLiga antwortet nicht (${r.status})`);
  return r.text();
}

const portraitLinks = (html) => [...new Set([...html.matchAll(/teamPortrait\?team=(\d+)&(?:amp;)?championship=([^"&]+)/g)].map((m) => `team=${m[1]}&championship=${m[2]}`))];

/** Eine nuLiga-Mannschaftsseite auslesen */
async function mannschaftLesen(param) {
  const html = await laden(`${NULIGA}${PFAD}teamPortrait?${param}`);
  const inhalt = html.slice(html.indexOf('id="content"'), html.indexOf('Mannschaftsf') > 0 ? html.indexOf('Mannschaftsf') : undefined);
  const z = text(inhalt);
  const kopf = z.find((l) => /,\s*(Sommer|Winter) \d{4}/.test(l)) || '';
  const m = kopf.match(/^(.*?)\s+(\d)er(?:\s+classic)?\s+(\d+),\s*((?:Sommer|Winter) [\d/]+)$/);
  if (!m) throw new Error(`Mannschaftsseite nicht lesbar: ${kopf || param}`);
  const [, klasse, spieler, nr, saison] = m;
  const ligaZeile = z[z.indexOf('Liga') + 1] || '';
  const ohneKlasse = ligaZeile.startsWith(klasse + ' ') ? ligaZeile.slice(klasse.length + 1) : ligaZeile;
  const [liga, gruppe] = ohneKlasse.split(/\s+(?=Gr\.)/);
  const platz = (z.find((l) => /^\d+\. Platz$/.test(l)) || '').replace('. Platz', '');
  const punkte = ((z.find((l) => /^\d+:\d+ Punkte/.test(l)) || '').match(/^(\d+:\d+)/) || [])[1] || '';
  const meisterschaft = decodeURIComponent(param.split('championship=')[1].replace(/\+/g, ' '));
  const gruppenLink = (html.match(/href="([^"]*groupPage\?[^"]*)"/) || [])[1];
  // Den Spielplan (PDF) gibt es nur auf der Tabellenseite der Gruppe
  let spielplan = null;
  if (gruppenLink) {
    await warte(300);
    const g = await laden(NULIGA + gruppenLink.replace(/&amp;/g, '&')).catch(() => '');
    spielplan = (g.match(/href="([^"]*ScheduleReportFOP[^"]*)"/) || [])[1] || null;
  }
  return {
    klasse, spieler: `${spieler}er`, nr: Number(nr), saison, liga: liga || ligaZeile, gruppe: gruppe || '',
    region: REGIONEN[meisterschaft.split(' ')[0]] || meisterschaft.split(' ')[0], platz, punkte,
    links: {
      team: `${NULIGA}${PFAD}teamPortrait?${param.replace(/ /g, '+')}`,
      tabelle: gruppenLink ? NULIGA + gruppenLink.replace(/&amp;/g, '&').replace(/targetFed=WTV&/, '') : '',
      spielplan: spielplan ? NULIGA + spielplan.replace(/&amp;/g, '&') : '',
    },
  };
}

function bereich(klasse) { return /^Junior/.test(klasse) ? 'jugend' : /^Herren/.test(klasse) ? 'herren' : 'damen'; }
function sortierung(t) {
  const alter = Number((t.klasse.match(/(\d+)$/) || [])[1] || 0);
  if (bereich(t.klasse) === 'jugend') return [100 - alter, /^Juniorinnen/.test(t.klasse) ? 1 : 0, t.nr];
  return [alter, 0, t.nr];
}

/** Alle Mannschaften holen. altesHtml = bisherige mannschaften.html (für die Winterpause). */
export async function mannschaftenAusNuliga(altesHtml) {
  let links = portraitLinks(await laden(`${NULIGA}${PFAD}clubTeams?club=${VEREIN}`));
  const laufend = links.length > 0;
  if (!laufend) links = portraitLinks(altesHtml);
  if (!links.length) throw new Error('Keine Mannschaften gefunden.');
  const teams = [];
  for (const l of links) { teams.push(await mannschaftLesen(l)); await warte(300); }   // nuLiga schonen

  // Anzeigename: „Herren“, „Herren II (4er)“, „Damen 50“ …
  for (const t of teams) {
    const erste = teams.find((x) => x.klasse === t.klasse && x.nr === 1);
    t.name = t.klasse + (t.nr > 1 ? ` ${ROEMISCH[t.nr] || t.nr}` : '') + (t.nr > 1 && erste && erste.spieler !== t.spieler ? ` (${t.spieler})` : '');
    t.bereich = bereich(t.klasse);
  }
  teams.sort((a, b) => { const x = sortierung(a), y = sortierung(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; });
  return { saison: teams[0].saison, laufend, teams };
}

/** Vergleichsschlüssel für Mannschaftsnamen: „Herren II (4er)“ = „herren 2“ = „Herren&nbsp;II“ */
export function namensSchluessel(name) {
  return String(name || '').replace(/ |&nbsp;/g, ' ').replace(/\(.*?\)/g, '').replace(/\bIII\b/g, '3').replace(/\bII\b/g, '2').replace(/\bIV\b/g, '4')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Bisherige Fotos aus einer mannschaften.html: Namensschlüssel → { src, alt } */
export function fotosAusSeite(html) {
  const m = new Map();
  for (const [, ph, name] of html.matchAll(/<article class="team">\s*<div class="ph[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<h3>([\s\S]*?)<\/h3>/g)) {
    const img = ph.match(/<img src="([^"]+)" alt="([^"]*)"/);
    if (img) m.set(namensSchluessel(name.replace(/<[^>]+>/g, '')), { src: img[1], alt: img[2] });
  }
  return m;
}

/** Kürzel für die Grafik ohne Foto: „Damen 55“ → D55, „Herren II (4er)“ → H II, „Juniorinnen U15“ → U15 */
export function kuerzel(name) {
  const n = name.replace(/\(.*?\)/g, '').trim();
  const u = n.match(/\bU\s?(\d+)\b/i); if (u) return 'U' + u[1];
  const erst = n[0].toUpperCase();
  const z = n.match(/\b(\d+)\b/); if (z) return erst + z[1];
  const r = n.match(/\b(I{1,3}|IV|V)\b/); if (r) return erst + ' ' + r[1];
  return erst;
}

/* ---------- HTML der Mannschaftsseite */
const EXT = '<svg class="ext" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h8v8M13 3 4 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BEREICHE = [
  { id: 'damen', titel: 'Damen', offen: 'Von der offenen Damenmannschaft bis', soft: false },
  { id: 'herren', titel: 'Herren', offen: 'Von den offenen Herren bis', soft: true },
  { id: 'jugend', titel: 'Jugend', fest: 'Unser Nachwuchs im Mannschaftsspielbetrieb', soft: false },
];
const nb = (s) => s.replace(/ (\d+|II|III|IV|U\d+)\b/g, `${NB}$1`);

function karte(t, foto, e) {
  const ph = foto
    ? `<div class="ph"><img src="${h(foto.src)}" alt="${h(foto.alt || 'Mannschaftsfoto ' + t.name)}" loading="lazy"></div>`
    : `<div class="ph mono" aria-hidden="true"><span>${h(kuerzel(t.name).replace(/ /g, NB))}</span></div>`;
  const l = [];
  l.push(`<a href="${h(t.links.team)}" target="_blank" rel="noopener">Team auf nuLiga${EXT}</a>`);
  if (t.links.tabelle) l.push(`<a href="${h(t.links.tabelle)}" target="_blank" rel="noopener">Tabelle${EXT}</a>`);
  if (t.links.spielplan) l.push(`<a href="${h(t.links.spielplan)}" target="_blank" rel="noopener">Spielplan (PDF)${EXT}</a>`);
  return [
    `${e}<article class="team">`,
    `${e}  ${ph}`,
    `${e}  <div class="tb">`,
    `${e}    <p class="league">${h(t.liga)}<span>${h(t.region)}${t.gruppe ? ', ' + h(t.gruppe.replace(/^Gr\. /, `Gr.${NB}`)) : ''}</span></p>`,
    `${e}    <h3>${h(nb(t.name))}</h3>`,
    `${e}    <dl class="tstats">`,
    `${e}      <div>`, `${e}        <dt>Platz</dt>`, `${e}        <dd>${h(t.platz || '–')}</dd>`, `${e}      </div>`,
    `${e}      <div>`, `${e}        <dt>Punkte</dt>`, `${e}        <dd>${h(t.punkte || '–')}</dd>`, `${e}      </div>`,
    `${e}    </dl>`,
    `${e}    <p class="tlinks">${l.join('')}</p>`,
    `${e}  </div>`,
    `${e}</article>`,
  ].join('\n');
}

/**
 * Setzt die Mannschaften in mannschaften.html ein.
 * fotoFuer(name) → { src, alt } oder null
 */
export function mannschaftsseite(html, daten, fotoFuer, heute = new Date()) {
  const { saison, laufend, teams } = daten;
  const gruppen = BEREICHE.map((b) => ({ ...b, teams: teams.filter((t) => t.bereich === b.id) })).filter((b) => b.teams.length);

  // Abschnitte Damen / Herren / Jugend
  let sektionen = '';
  gruppen.forEach((b, i) => {
    const letzte = b.teams[b.teams.length - 1].name;
    const unter = b.fest || (b.teams.length === 1 ? nb(b.teams[0].name) : `${b.offen} ${nb(letzte.replace(/\s*\(.*\)$/, ''))}`);
    const anz = `${b.teams.length}${NB}${b.teams.length === 1 ? 'Mannschaft' : 'Mannschaften'}`;
    sektionen += `
      <!-- ============ ${b.titel} (#${b.id}) ============ -->
      <section class="tgroup${i % 2 ? ' soft' : ''}" id="${b.id}">
        <div class="wrap">
          <div class="head row">
            <div>
              <h2>${b.titel}</h2>
              <p>${h(unter)}</p>
            </div>
            <span class="count">${anz}</span>
          </div>
          <div class="teams">
${b.teams.map((t) => karte(t, fotoFuer(t.name), '            ')).join('\n')}
          </div>
        </div>
      </section>
`;
  });

  const anfang = html.indexOf('      <!-- ============ Damen (#damen)');
  const ende = html.indexOf('      <!-- ============ Abschluss-Aufruf');
  if (anfang < 0 || ende < 0) throw new Error('Mannschaftsbereich in mannschaften.html nicht gefunden.');
  html = html.slice(0, anfang) + sektionen.replace(/^\n/, '') + html.slice(ende);

  // Seitenkopf, Saison-Leiste, Sprunglinks
  const aeltestes = [...teams].filter((t) => t.bereich !== 'jugend').sort((a, b) => sortierung(b)[0] - sortierung(a)[0])[0];
  const zahl = ZAHLWORT[teams.length] || String(teams.length);
  html = html.replace(/<p class="lead">[\s\S]*?<\/p>/, `<p class="lead">${zahl}${NB}${teams.length === 1 ? 'Team' : 'Teams'} im Spielbetrieb des Westfälischen Tennis-Verbands${NB}– ${gruppen.some((g) => g.id === 'jugend') ? 'vom Nachwuchs ' : ''}bis ${nb(aeltestes ? aeltestes.name : teams[teams.length - 1].name)}.</p>`);
  const alteSaison = (html.match(/<span class="pill">([^<]*)<\/span>/) || [])[1];
  html = html.replace(/<span class="pill">[^<]*<\/span>/, `<span class="pill">${h(saison)}</span>`);
  const datum = heute.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' });
  html = html.replace(/(<span class="pill">[^<]*<\/span>\s*<p>)[^<]*(<\/p>)/, `$1${laufend ? `Tabellenstand laut nuLiga, Stand ${datum}` : 'Endstand laut nuLiga'}$2`);
  html = html.replace(/<nav class="jump"[^>]*>[\s\S]*?<\/nav>/, `<nav class="jump" aria-label="Springe zu">\n${gruppen.map((g) => `            <a href="#${g.id}">${g.titel}</a>`).join('\n')}\n          </nav>`);
  // „Alle Ergebnisse (PDF)“ gehört zu einer bestimmten Saison – bei neuer Saison ausblenden
  if (alteSaison && alteSaison !== saison) html = html.replace(/\s*<a class="btn ghost sm" href="[^"]*ResultReportFOP[^"]*"[\s\S]*?<\/a>/, '');
  html = entitaeten(html);
  return html.includes('\r\n') ? html.replace(/\r?\n/g, '\r\n') : html;   // Zeilenenden der Datei beibehalten
}
