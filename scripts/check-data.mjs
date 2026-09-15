/**
 * Smoke test sui dati statici: verifica che ogni riferimento incrociato risolva
 * e che non ci siano id duplicati. Non serve un bundler, lavora sul testo.
 *
 * Uso: npm run check:data
 */
import { readFileSync } from 'node:fs';

const leggi = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const idsDi = (testo) => {
  const set = new Set();
  const doppi = [];
  for (const m of testo.matchAll(/^\s{2,4}id:\s*'([^']+)'/gm)) {
    if (set.has(m[1])) doppi.push(m[1]);
    set.add(m[1]);
  }
  return { set, doppi };
};

const exercises = leggi('src/data/exercises.ts');
const programs = leggi('src/data/programs.ts');
const foods = leggi('src/data/foods.ts');
const recipes = leggi('src/data/recipes.ts');

const ex = idsDi(exercises);
const fd = idsDi(foods);
const rc = idsDi(recipes);

const problemi = [];

for (const [nome, { doppi }] of [
  ['exercises', ex],
  ['foods', fd],
  ['recipes', rc],
]) {
  for (const d of doppi) problemi.push(`id duplicato in ${nome}: ${d}`);
}

// programs -> exercises
const exRef = new Set([...programs.matchAll(/exerciseId:\s*'([^']+)'/g)].map((m) => m[1]));
for (const id of exRef) {
  if (!ex.set.has(id)) problemi.push(`programs.ts: exerciseId inesistente "${id}"`);
}

// exercises -> exercises (sostituti)
for (const m of exercises.matchAll(/sostituti:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].matchAll(/'([^']+)'/g)) {
    if (!ex.set.has(s[1])) problemi.push(`exercises.ts: sostituto inesistente "${s[1]}"`);
  }
}

// recipes -> foods
const foodRef = new Set([...recipes.matchAll(/foodId:\s*'([^']+)'/g)].map((m) => m[1]));
for (const id of foodRef) {
  if (!fd.set.has(id)) problemi.push(`recipes.ts: foodId inesistente "${id}"`);
}

const conta = (t, re) => [...t.matchAll(re)].length;

console.log(`esercizi:   ${ex.set.size}`);
console.log(`programmi:  ${conta(programs, /^\s{2}\{\s*$/gm)} blocchi, ${exRef.size} esercizi referenziati`);
console.log(`alimenti:   ${fd.set.size}`);
console.log(`ricette:    ${rc.set.size} (${foodRef.size} alimenti referenziati)`);

if (problemi.length) {
  console.error(`\n${problemi.length} problemi:`);
  for (const p of problemi.slice(0, 40)) console.error('  - ' + p);
  process.exit(1);
}
console.log('\nTutti i riferimenti incrociati risolvono.');
