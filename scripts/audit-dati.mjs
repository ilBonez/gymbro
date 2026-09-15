/**
 * Verifica numerica dei dati statici: calcola invece di fidarsi.
 *
 * `check:data` controlla che i riferimenti incrociati risolvano. Questo script
 * controlla che i numeri abbiano senso: kcal coerenti con i macro, ricette
 * coerenti con i loro ingredienti, foods.ts e equivalenze.ts d'accordo sullo
 * stesso alimento, recuperi coerenti con l'obiettivo del programma.
 *
 * Non fallisce la build: i rilievi "minore" sono spesso scelte deliberate
 * (CREA calcola le kcal diversamente dalle etichette). Serve a rileggere i dati
 * dopo averli toccati.
 *
 * Uso: npm run audit:dati
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RADICE = fileURLToPath(new URL('..', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '');
const dir = mkdtempSync(join(tmpdir(), 'gymbro-audit-'));
const entry = join(dir, 'entry.ts');

writeFileSync(
  entry,
  `
export { FOODS } from '${RADICE}/src/data/foods';
export { RECIPES } from '${RADICE}/src/data/recipes';
export { SGARRI } from '${RADICE}/src/data/sgarri';
export { EQUIVALENZE } from '${RADICE}/src/data/equivalenze';
export { EXERCISES } from '${RADICE}/src/data/exercises';
export { PROGRAMS } from '${RADICE}/src/data/programs';
export { SUPPLEMENTS } from '${RADICE}/src/data/supplements';
`,
);

const out = join(dir, 'bundle.mjs');
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: out, platform: 'node', logLevel: 'error' });
const D = await import('file://' + out.replace(/\\/g, '/'));

const problemi = [];
const nota = [];
const divergenze = [];
const segna = (gravita, dove, testo) => problemi.push({ gravita, dove, testo });

// ---------- 1. kcal coerenti con i macro ----------
/**
 * Atwater "generale": 4/4/9, piu' 2 kcal/g per la fibra e 7 per l'alcol.
 * Senza fibra e alcol nel conto, alimenti come i semi di chia o un calice di
 * vino risulterebbero sempre sbagliati pur essendo corretti.
 */
function kcalAttese(m) {
  return (
    m.proteine * 4 +
    m.carbs * 4 +
    m.grassi * 9 +
    (m.fibre ?? 0) * 2 +
    (m.alcol ?? 0) * 7
  );
}

function controllaKcal(lista, nomeFile, tolleranza = 0.15) {
  for (const x of lista) {
    const m = x.macro ?? x;
    const calc = kcalAttese(m);
    const dich = m.kcal;
    if (dich <= 0 && calc <= 0) continue;
    const scarto = Math.abs(calc - dich) / Math.max(dich, 1);
    if (scarto > tolleranza && Math.abs(calc - dich) > 25) {
      segna(
        scarto > 0.3 ? 'importante' : 'minore',
        `${nomeFile} · ${x.id}`,
        `kcal dichiarate ${dich}, da macro+fibra+alcol verrebbero ${Math.round(calc)} (${Math.round(scarto * 100)}% di scarto)`,
      );
    }
  }
}
controllaKcal(D.FOODS, 'foods');
controllaKcal(D.RECIPES, 'recipes');
controllaKcal(D.SGARRI, 'sgarri');
controllaKcal(D.EQUIVALENZE, 'equivalenze');

// ---------- 2. somma macro impossibile ----------
for (const f of [...D.FOODS, ...D.EQUIVALENZE]) {
  const somma = f.proteine + f.carbs + f.grassi + (f.fibre ?? 0);
  if (somma > 100.5) segna('importante', `${f.id}`, `macro+fibra = ${somma.toFixed(1)} g su 100 g`);
}

// ---------- 3. ricette: macro dichiarati vs ingredienti ----------
const perId = new Map(D.FOODS.map((f) => [f.id, f]));
let verificate = 0;
for (const r of D.RECIPES) {
  const conFood = r.ingredienti.filter((i) => i.foodId && perId.has(i.foodId));
  // solo ricette dove quasi tutti gli ingredienti sono mappati, altrimenti il confronto non dice nulla
  const mappati = conFood.length / r.ingredienti.filter((i) => i.unita !== 'q.b.').length;
  if (mappati < 0.85) continue;
  let somma = { kcal: 0, proteine: 0, carbs: 0, grassi: 0 };
  let ok = true;
  for (const i of conFood) {
    const f = perId.get(i.foodId);
    let g;
    if (i.unita === 'g' || i.unita === 'ml') g = i.qta;
    // `porzioneTipica` di un alimento "a pezzi" e' espressa in pezzi, non in
    // grammi: senza un peso unitario nei dati la ricetta non e' verificabile
    else if (i.unita === 'pz') { ok = false; break; }
    // un cucchiaio di olio pesa ~10 g, uno di burro d'arachidi ~16, uno di miele ~21
    else if (i.unita === 'cucchiaio') g = i.qta * (f.categoria === 'grassi' ? 15 : 12);
    else { ok = false; break; }
    for (const k of ['kcal', 'proteine', 'carbs', 'grassi']) somma[k] += (f[k] * g) / 100;
  }
  if (!ok) continue;
  verificate++;
  const perPorzione = somma.kcal / r.porzioni;
  const scarto = Math.abs(perPorzione - r.macro.kcal) / Math.max(r.macro.kcal, 1);
  if (scarto > 0.2) {
    segna(
      scarto > 0.4 ? 'importante' : 'minore',
      `recipes · ${r.id}`,
      `kcal/porzione dichiarate ${r.macro.kcal}, dagli ingredienti ${Math.round(perPorzione)} (${Math.round(scarto * 100)}%)`,
    );
  }
}
nota.push(
  `ricette verificate contro i loro ingredienti: ${verificate}/${D.RECIPES.length}` +
    ` (le altre usano ingredienti a pezzi, di cui non conosciamo il peso unitario)`,
);

// ---------- 4. foods.ts vs equivalenze.ts sullo stesso alimento ----------
const normalizza = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
for (const e of D.EQUIVALENZE) {
  const gemello = D.FOODS.find((f) => {
    const a = normalizza(f.nome).slice(0, 12);
    const b = normalizza(e.nome).slice(0, 12);
    return a === b;
  });
  if (!gemello) continue;
  for (const k of ['kcal', 'carbs', 'proteine', 'grassi']) {
    const d = Math.abs(gemello[k] - e[k]);
    const base = Math.max(gemello[k], e[k], 1);
    if (d / base > 0.15 && d > 2) {
      divergenze.push(
        `${e.id} vs ${gemello.id} · ${k}: equivalenze ${e[k]}, foods ${gemello[k]}`,
      );
    }
  }
}

// ---------- 5. programmi: recuperi e rep coerenti con l'obiettivo ----------
const exById = new Map(D.EXERCISES.map((e) => [e.id, e]));
for (const p of D.PROGRAMS) {
  for (const w of p.workouts) {
    const rec = w.esercizi.map((e) => e.recuperoSec);
    const media = rec.reduce((a, b) => a + b, 0) / rec.length;
    if (p.goal === 'forza' && media < 120)
      segna('importante', `${p.id}/${w.id}`, `programma di forza con recupero medio ${Math.round(media)}s`);
    if (p.goal === 'definizione' && media > 120)
      segna('minore', `${p.id}/${w.id}`, `definizione con recupero medio ${Math.round(media)}s: poca densita'`);

    // Durata: la stima e' grossolana (non conosce riscaldamento, cambi di
    // postazione, attese al rack) quindi segnaliamo solo scarti enormi.
    let sec = 0;
    for (const e of w.esercizi) {
      const rip = parseInt(e.ripetizioni, 10) || 10;
      sec += e.serie * (rip * 3 + e.recuperoSec);
    }
    const stimaMin = Math.round(sec / 60);
    if (w.durataMin > stimaMin * 2.6 || w.durataMin < stimaMin * 0.7)
      segna('minore', `${p.id}/${w.id}`, `durataMin ${w.durataMin}, dal solo contenuto ~${stimaMin} min`);
  }

  // serie settimanali per gruppo primario
  const conta = {};
  for (const w of p.workouts)
    for (const e of w.esercizi) {
      const ex = exById.get(e.exerciseId);
      if (!ex || ex.tipo === 'cardio') continue;
      conta[ex.gruppi[0]] = (conta[ex.gruppi[0]] ?? 0) + e.serie;
    }
  const scarsi = Object.entries(conta).filter(([, v]) => v < 4).map(([k, v]) => `${k} ${v}`);
  const tanti = Object.entries(conta).filter(([, v]) => v > 24).map(([k, v]) => `${k} ${v}`);
  if (tanti.length) segna('minore', p.id, `serie/settimana molto alte: ${tanti.join(', ')}`);
  nota.push(
    `${p.id}: serie primarie/sett ` +
      Object.entries(conta).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') +
      (scarsi.length ? ` | sotto 4: ${scarsi.join(', ')}` : ''),
  );
}

// ---------- 6. sostituti fra esercizi ----------
// Un sostituto con primario diverso spesso va benissimo (dip alla panca verso
// dip alle parallele, burpees verso mountain climber): segnaliamo solo quando
// i due esercizi non condividono proprio nessun gruppo muscolare.
for (const e of D.EXERCISES) {
  for (const sid of e.sostituti ?? []) {
    const s = exById.get(sid);
    if (!s) continue;
    const comuni = s.gruppi.filter((g) => e.gruppi.includes(g));
    if (comuni.length === 0)
      segna(
        'minore',
        `${e.id} -> ${sid}`,
        `sostituto senza nessun gruppo in comune (${e.gruppi.join('/')} vs ${s.gruppi.join('/')})`,
      );
  }
}

// ---------- referto ----------
const ordine = { bloccante: 0, importante: 1, minore: 2 };
problemi.sort((a, b) => ordine[a.gravita] - ordine[b.gravita]);
console.log(`\n=== ${problemi.length} rilievi ===\n`);
for (const p of problemi) console.log(`[${p.gravita}] ${p.dove}\n    ${p.testo}`);
if (divergenze.length) {
  console.log(`\n=== ${divergenze.length} divergenze fra foods.ts ed equivalenze.ts ===`);
  console.log(
    'Attese, non errori: foods.ts segue etichette e USDA (carboidrati comprensivi\n' +
      'di fibra), equivalenze.ts segue CREA (carboidrati disponibili). Le 54 ricette\n' +
      'sono calcolate su foods.ts, quindi allinearlo le sposterebbe tutte: i due file\n' +
      'restano separati di proposito.\n',
  );
  for (const d of divergenze) console.log('  · ' + d);
}

console.log('\n=== contesto ===');
for (const n of nota) console.log('· ' + n);
