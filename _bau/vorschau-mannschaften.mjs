/* Vorschau: Mannschaftsseite aus nuLiga + Fotos aus Sanity erzeugen, ohne die Website zu ändern.
   Ergebnis: mannschaften-vorschau.html (wird nicht veröffentlicht, steht in .gitignore).
   Aufruf: node _bau/vorschau-mannschaften.mjs */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mannschaftenAusNuliga, mannschaftsseite } from './nuliga.mjs';

const QUELLE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://g6e90jq0.api.sanity.io/v2025-02-19/data/query/production';

function bildUrl(b, w, hh) {
  const { width: W, height: H } = b.groesse;
  const c = b.crop || { left: 0, right: 0, top: 0, bottom: 0 };
  const rx = Math.round(c.left * W), ry = Math.round(c.top * H), rw = Math.round((1 - c.left - c.right) * W), rh = Math.round((1 - c.top - c.bottom) * H);
  const p = new URLSearchParams({ w: String(w), h: String(hh), fit: 'crop', fm: 'jpg', q: '84' });
  if (b.crop) p.set('rect', `${rx},${ry},${rw},${rh}`);
  if (b.hotspot) { p.set('crop', 'focalpoint'); p.set('fp-x', ((b.hotspot.x * W - rx) / rw).toFixed(4)); p.set('fp-y', ((b.hotspot.y * H - ry) / rh).toFixed(4)); }
  return `${b.url}?${p}`;
}

const html = await fs.readFile(path.join(QUELLE, 'mannschaften.html'), 'utf8');
const daten = await mannschaftenAusNuliga(html);
console.log(`nuLiga: ${daten.teams.length} Mannschaften, ${daten.saison}${daten.laufend ? ' (laufende Saison)' : ' (Winterpause – letzte Saison)'}`);
for (const t of daten.teams) console.log(`  ${t.name.padEnd(18)} ${t.liga} | ${t.region}, ${t.gruppe} | Platz ${t.platz} | ${t.punkte}`);

const q = `*[_type == "mannschaft" && defined(foto.asset)]{ name, "foto": foto{ "url": asset->url, "groesse": asset->metadata.dimensions, crop, hotspot, alt } }`;
const fotos = (await (await fetch(`${API}?query=${encodeURIComponent(q)}`)).json()).result;
const nachName = new Map(fotos.map((f) => [f.name.replace(/\s+/g, ' ').trim(), f.foto]));
const ohne = daten.teams.filter((t) => !nachName.has(t.name)).map((t) => t.name);
if (ohne.length) console.log(`Ohne Foto in Sanity (Kürzel-Grafik): ${ohne.join(', ')}`);

let neu = mannschaftsseite(html, daten, (name) => { const f = nachName.get(name); return f ? { src: bildUrl(f, 1200, 675), alt: f.alt } : null; });
neu = neu.replace('<main id="main">', '<main id="main">\n      <p style="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:999;margin:0;padding:10px 18px;border-radius:99px;background:#C9A456;color:#0A1622;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:calc(100% - 32px);text-align:center">VORSCHAU – Mannschaften automatisch aus nuLiga (noch nicht veröffentlicht)</p>');
await fs.writeFile(path.join(QUELLE, 'mannschaften-vorschau.html'), neu);
console.log('Geschrieben: mannschaften-vorschau.html');
