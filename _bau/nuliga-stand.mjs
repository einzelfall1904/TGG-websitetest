/* Wöchentlicher Abgleich (dienstags) (GitHub Action „Mannschaften aus nuLiga“):
   Schreibt den aktuellen nuLiga-Stand in mannschaften.html im Repository.
   So kennt die Seite immer die Mannschaften der letzten Saison – auch in der Winterpause –
   und der Tabellenstand bleibt während der Saison aktuell. Fotos bleiben wie sie sind
   (beim Veröffentlichen setzt Netlify ohnehin die Fotos aus Sanity ein).
   Aufruf: node _bau/nuliga-stand.mjs */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mannschaftenAusNuliga, mannschaftsseite, fotosAusSeite, namensSchluessel } from './nuliga.mjs';

const datei = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'mannschaften.html');
const alt = await fs.readFile(datei, 'utf8');
const daten = await mannschaftenAusNuliga(alt);
const fotos = fotosAusSeite(alt);
const neu = mannschaftsseite(alt, daten, (name) => fotos.get(namensSchluessel(name)) || null);
if (neu === alt) console.log('Keine Änderung.');
else { await fs.writeFile(datei, neu); console.log(`mannschaften.html aktualisiert: ${daten.teams.length} Mannschaften, ${daten.saison}.`); }
