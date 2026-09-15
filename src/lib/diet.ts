import { RECIPES } from '../data/recipes';
import type { Meal, Recipe } from '../data/recipes';
import { FOODS } from '../data/foods';
import type { Goal } from '../data/programs';
import type { MacroTargets } from '../types';

export const MOMENTI: Meal[] = [
  'pre-workout',
  'post-workout',
  'colazione',
  'spuntino-mattina',
  'pranzo',
  'spuntino-pomeriggio',
  'cena',
];

export const MOMENTO_LABEL: Record<Meal, string> = {
  'pre-workout': 'Pre-workout',
  'post-workout': 'Post-workout',
  colazione: 'Colazione',
  'spuntino-mattina': 'Spuntino mattina',
  pranzo: 'Pranzo',
  'spuntino-pomeriggio': 'Spuntino pomeriggio',
  cena: 'Cena',
};

/** Quota di calorie giornaliere per ogni momento, a seconda che ci si alleni o no. */
function ripartizione(allenamento: boolean): { momento: Meal; quota: number }[] {
  if (allenamento) {
    return [
      { momento: 'post-workout', quota: 0.28 },
      { momento: 'spuntino-mattina', quota: 0.08 },
      { momento: 'pranzo', quota: 0.3 },
      { momento: 'spuntino-pomeriggio', quota: 0.1 },
      { momento: 'cena', quota: 0.24 },
    ];
  }
  return [
    { momento: 'colazione', quota: 0.26 },
    { momento: 'spuntino-mattina', quota: 0.08 },
    { momento: 'pranzo', quota: 0.32 },
    { momento: 'spuntino-pomeriggio', quota: 0.1 },
    { momento: 'cena', quota: 0.24 },
  ];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface PastoPianificato {
  momento: Meal;
  recipe: Recipe;
  porzioni: number;
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
}

function candidati(momento: Meal, goal: Goal): Recipe[] {
  const esatti = RECIPES.filter((r) => r.momenti.includes(momento) && r.fasi.includes(goal));
  if (esatti.length) return esatti;
  const soloMomento = RECIPES.filter((r) => r.momenti.includes(momento));
  if (soloMomento.length) return soloMomento;
  return RECIPES;
}

function arrotonda(v: number): number {
  return Math.max(0.5, Math.min(2, Math.round(v * 4) / 4));
}

function scarto(valore: number, obiettivo: number): number {
  return Math.abs(valore - obiettivo) / Math.max(obiettivo, 1);
}

/**
 * Piano pasti deterministico per una data: stessa data e stessi parametri = stesso menu.
 * Per ogni momento sceglie la ricetta che, una volta porzionata, si avvicina di piu' ai
 * macro del pasto — non solo alle calorie, altrimenti le proteine sfondano il target.
 */
export function generaGiornoDieta(
  data: string,
  goal: Goal,
  targets: MacroTargets,
  allenamento: boolean,
): PastoPianificato[] {
  const usati = new Set<string>();

  return ripartizione(allenamento).map(({ momento, quota }) => {
    const tutti = candidati(momento, goal);
    // niente ricette ripetute nello stesso giorno, a meno che non resti altro
    const liberi = tutti.filter((r) => !usati.has(r.id));
    const pool = liberi.length > 0 ? liberi : tutti;

    const obiettivo = {
      kcal: targets.kcal * quota,
      proteine: targets.proteine * quota,
      carbs: targets.carbs * quota,
      grassi: targets.grassi * quota,
    };

    const valutate = pool
      .map((r) => {
        const porzioni = arrotonda(obiettivo.kcal / Math.max(80, r.macro.kcal));
        const p = r.macro.proteine * porzioni;
        const c = r.macro.carbs * porzioni;
        const g = r.macro.grassi * porzioni;
        // proteine in eccesso pesano meno di proteine mancanti: in deficit
        // l'eccesso e' innocuo, la carenza costa massa magra
        const errProt = p >= obiettivo.proteine
          ? scarto(p, obiettivo.proteine) * 0.5
          : scarto(p, obiettivo.proteine) * 1.4;
        const errore =
          scarto(r.macro.kcal * porzioni, obiettivo.kcal) * 1.2 +
          errProt +
          scarto(c, obiettivo.carbs) * 0.9 +
          scarto(g, obiettivo.grassi) * 0.6;
        return { r, porzioni, errore };
      })
      .sort((a, b) => a.errore - b.errore);

    // fra le tre opzioni migliori ne scegliamo una in base alla data: il menu varia
    // da un giorno all'altro senza allontanarsi dai macro
    const rosa = valutate.slice(0, Math.min(3, valutate.length));
    const scelta = rosa[hash(data + momento + goal) % rosa.length];
    const { r, porzioni } = scelta;
    usati.add(r.id);

    return {
      momento,
      recipe: r,
      porzioni,
      kcal: Math.round(r.macro.kcal * porzioni),
      proteine: Math.round(r.macro.proteine * porzioni),
      carbs: Math.round(r.macro.carbs * porzioni),
      grassi: Math.round(r.macro.grassi * porzioni),
    };
  });
}

export function totaliGiorno(pasti: PastoPianificato[]) {
  return pasti.reduce(
    (t, p) => ({
      kcal: t.kcal + p.kcal,
      proteine: t.proteine + p.proteine,
      carbs: t.carbs + p.carbs,
      grassi: t.grassi + p.grassi,
    }),
    { kcal: 0, proteine: 0, carbs: 0, grassi: 0 },
  );
}

export interface Completamento {
  macro: 'carboidrati' | 'proteine' | 'grassi';
  nome: string;
  grammi: number;
  testo: string;
}

/**
 * Sceglie una fonte sensata per un macro.
 *
 * Non basta ordinare per "purezza": un limone ha quasi solo carboidrati sulle
 * sue pochissime calorie e vincerebbe sempre, salvo poi servirne mezzo chilo.
 * Prima si scartano gli alimenti troppo diluiti, poi si ordina per purezza.
 */
const SOGLIA_PER_100G: Record<'carbs' | 'proteine' | 'grassi', number> = {
  carbs: 25,
  proteine: 18,
  grassi: 30,
};

function migliorFonte(macro: 'carbs' | 'proteine' | 'grassi', categorie: string[]) {
  const soglia = SOGLIA_PER_100G[macro];
  // le categorie sono in ordine di preferenza: meglio proporre riso che datteri
  for (const cat of categorie) {
    const trovato = FOODS.filter(
      (f) => f.categoria === cat && f[macro] >= soglia && f.unita !== 'pz',
    )
      .map((f) => ({ f, purezza: (f[macro] * (macro === 'grassi' ? 9 : 4)) / Math.max(f.kcal, 1) }))
      .sort((a, b) => b.purezza - a.purezza || a.f.nome.localeCompare(b.f.nome))[0]?.f;
    if (trovato) return trovato;
  }
  return undefined;
}

/**
 * Se il menu resta lontano dai target, propone quanto aggiungere di un alimento
 * semplice per chiudere il buco. Solo scarti sopra il 12%.
 */
export function suggerimentiCompletamento(
  totale: { kcal: number; proteine: number; carbs: number; grassi: number },
  targets: MacroTargets,
): Completamento[] {
  const out: Completamento[] = [];

  const casi: [Completamento['macro'], 'carbs' | 'proteine' | 'grassi', number, string[]][] = [
    ['carboidrati', 'carbs', targets.carbs, ['cereali', 'frutta', 'legumi']],
    ['proteine', 'proteine', targets.proteine, ['carne', 'pesce', 'latticini', 'proteine-polvere']],
    ['grassi', 'grassi', targets.grassi, ['grassi']],
  ];

  for (const [etichetta, campo, target, categorie] of casi) {
    const mancante = target - totale[campo];
    if (mancante < target * 0.12 || mancante < 8) continue;
    const fonte = migliorFonte(campo, categorie);
    if (!fonte || fonte[campo] <= 0) continue;
    const grammi = Math.round((mancante / fonte[campo]) * 100);
    if (grammi < 10 || grammi > 600) continue;
    out.push({
      macro: etichetta,
      nome: fonte.nome,
      grammi,
      testo: `mancano ${Math.round(mancante)} g di ${etichetta}: circa ${grammi} ${fonte.unita} di ${fonte.nome.toLowerCase()}`,
    });
  }

  return out;
}

export interface VoceSpesa {
  nome: string;
  qta: number;
  unita: string;
  foodId?: string;
  categoria: string;
  ricercaUrl?: string;
}

/** Aggrega gli ingredienti di piu' giorni in un'unica lista della spesa. */
export function listaSpesaDaPasti(giorni: PastoPianificato[][]): VoceSpesa[] {
  const mappa = new Map<string, VoceSpesa>();

  for (const giorno of giorni) {
    for (const pasto of giorno) {
      for (const ing of pasto.recipe.ingredienti) {
        if (ing.unita === 'q.b.') continue;
        const food = ing.foodId ? FOODS.find((f) => f.id === ing.foodId) : undefined;
        const chiave = (ing.foodId ?? ing.nome.toLowerCase()) + '|' + ing.unita;
        const esistente = mappa.get(chiave);
        const qta = ing.qta * pasto.porzioni;
        if (esistente) {
          esistente.qta += qta;
        } else {
          mappa.set(chiave, {
            nome: food?.nome ?? ing.nome,
            qta,
            unita: ing.unita,
            foodId: ing.foodId,
            categoria: food?.categoria ?? 'dispensa',
            ricercaUrl: food?.ricercaUrl,
          });
        }
      }
    }
  }

  return [...mappa.values()]
    .map((v) => ({ ...v, qta: Math.ceil(v.qta) }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
}

export function fmtQta(v: VoceSpesa): string {
  if (v.unita === 'g' && v.qta >= 1000) return `${(v.qta / 1000).toFixed(1).replace('.0', '')} kg`;
  if (v.unita === 'ml' && v.qta >= 1000) return `${(v.qta / 1000).toFixed(1).replace('.0', '')} l`;
  if (v.unita === 'cucchiaio') return `${v.qta} cucchiai`;
  return `${v.qta} ${v.unita}`;
}
