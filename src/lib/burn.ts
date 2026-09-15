import type { Program, WorkoutTemplate, Goal } from '../data/programs';
import { esercizio } from './catalog';
import { macroTargets } from './nutrition';

/**
 * Stime di spesa energetica.
 *
 * Tutto qui dentro usa i MET (Metabolic Equivalent of Task): 1 MET è il consumo
 * a riposo, circa 1 kcal per kg di peso ogni ora. Le tabelle del Compendium of
 * Physical Activities danno 3.5 MET per un allenamento coi pesi tranquillo e
 * 6 MET per uno svolto a circuito con recuperi corti.
 *
 * Sono stime: l'errore realistico è del 20-30%. Servono a confrontare un
 * programma con un altro, non a contare le calorie al singolo kcal.
 */

/** MET a riposo per il calcolo: kcal = MET x peso(kg) x ore. */
function kcalDaMet(met: number, pesoKg: number, minuti: number): number {
  return Math.round(met * pesoKg * (minuti / 60));
}

const MET_BASE: Record<Goal, number> = {
  forza: 4.0, // serie corte, recuperi lunghissimi: molto tempo fermi
  massa: 5.0,
  definizione: 6.0, // densità alta, recuperi corti
  mantenimento: 5.0,
};

/** MET di una scheda: parte dall'obiettivo e corregge su recuperi e tipo di esercizi. */
export function metScheda(w: WorkoutTemplate, goal: Goal): number {
  let met = MET_BASE[goal];

  const recuperi = w.esercizi.map((e) => e.recuperoSec);
  const recuperoMedio = recuperi.reduce((a, b) => a + b, 0) / Math.max(recuperi.length, 1);
  if (recuperoMedio <= 60) met += 0.8;
  else if (recuperoMedio >= 150) met -= 1.0;

  // i multiarticolari muovono più massa muscolare e costano di più
  const composti = w.esercizi.filter((e) => esercizio(e.exerciseId)?.tipo === 'composto').length;
  const quota = composti / Math.max(w.esercizi.length, 1);
  met += (quota - 0.5) * 1.2;

  return Math.max(2.5, Math.round(met * 10) / 10);
}

export function kcalScheda(w: WorkoutTemplate, goal: Goal, pesoKg: number): number {
  return kcalDaMet(metScheda(w, goal), pesoKg, w.durataMin);
}

const MET_CARDIO: [RegExp, number][] = [
  [/hiit|sprint|interval/i, 9.0],
  [/cors|running|tapis.*cors/i, 9.8],
  [/vogator|rowing/i, 7.0],
  [/cyclette|bike|bicicl/i, 6.8],
  [/scala|stair/i, 8.0],
  [/pendenza|salita/i, 5.8],
  [/ellittica/i, 5.0],
  [/camminat|walk|liss/i, 4.3],
];

export function metCardio(tipo: string): number {
  for (const [re, met] of MET_CARDIO) if (re.test(tipo)) return met;
  return 5.0;
}

export function kcalCardio(tipo: string, minuti: number, pesoKg: number): number {
  return kcalDaMet(metCardio(tipo), pesoKg, minuti);
}

export interface StimaSettimanale {
  /** spesa di base: metabolismo + vita quotidiana, senza allenamenti */
  kcalBase: number;
  kcalAllenamenti: number;
  kcalCardio: number;
  spesaTotale: number;
  introito: number;
  deficit: number;
  /** variazione di peso attesa in una settimana: negativa = dimagrimento */
  kgSettimana: number;
  giorniAllenamento: number;
  giorniCardio: number;
}

/**
 * Cosa succede in una settimana con questo programma.
 *
 * La spesa non parte dal TDEE dichiarato nel profilo: quel numero contiene già
 * un fattore di attività generico e sommarci gli allenamenti li conterebbe due
 * volte. Partiamo dal metabolismo basale più la vita quotidiana (x1.35) e
 * aggiungiamo sopra solo le sedute davvero pianificate.
 */
export function stimaSettimanale(
  prog: Program,
  bmr: number,
  pesoKg: number,
  goal: Goal,
  tdeeProfilo: number,
): StimaSettimanale {
  const kcalBase = Math.round(bmr * 1.35 * 7);

  const kcalAllenamenti = prog.workouts.reduce(
    (t, w) => t + kcalScheda(w, prog.goal, pesoKg),
    0,
  );
  const giorniAllenamento = prog.workouts.length;

  const giorniCardio = prog.cardio?.frequenzaSettimana ?? 0;
  const kcalCardioTot = prog.cardio
    ? kcalCardio(prog.cardio.tipo, prog.cardio.durataMin, pesoKg) * giorniCardio
    : 0;

  const spesaTotale = kcalBase + kcalAllenamenti + kcalCardioTot;

  // l'introito segue i target della dieta: giorni di allenamento e di riposo
  // hanno quote diverse
  const conAllenamento = macroTargets(goal, pesoKg, tdeeProfilo, true).kcal;
  const aRiposo = macroTargets(goal, pesoKg, tdeeProfilo, false).kcal;
  const gAll = Math.min(giorniAllenamento, 7);
  const introito = conAllenamento * gAll + aRiposo * (7 - gAll);

  const deficit = introito - spesaTotale;

  return {
    kcalBase,
    kcalAllenamenti,
    kcalCardio: kcalCardioTot,
    spesaTotale,
    introito,
    deficit,
    kgSettimana: +(deficit / 7700).toFixed(2),
    giorniAllenamento,
    giorniCardio,
  };
}

/** Frase leggibile sull'esito atteso, senza promesse. */
export function commentoStima(s: StimaSettimanale): string {
  const kg = Math.abs(s.kgSettimana);
  if (kg < 0.1) return 'Peso sostanzialmente stabile: ricomposizione lenta.';
  if (s.kgSettimana < -0.9)
    return `Circa ${kg} kg a settimana: è un ritmo aggressivo, sopra lo 0.8-1% del peso corporeo si perde anche massa magra.`;
  if (s.kgSettimana < 0) return `Circa ${kg} kg a settimana di calo. Ritmo sostenibile.`;
  if (s.kgSettimana > 0.5)
    return `Circa +${kg} kg a settimana: troppo per una crescita pulita, buona parte sarebbe grasso.`;
  return `Circa +${kg} kg a settimana: surplus controllato.`;
}
