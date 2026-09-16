import type { ModalitaCardio, Program, WorkoutTemplate, Goal } from '../data/programs';
import { esercizio } from './catalog';
import { macroTargets } from './nutrition';

/**
 * Stime di spesa energetica.
 *
 * Tutto qui dentro usa i MET (Metabolic Equivalent of Task): 1 MET è il consumo
 * a riposo, circa 1 kcal per kg di peso ogni ora. I valori sono presi dal
 * **2024 Adult Compendium of Physical Activities** (pacompendium.com), che è il
 * riferimento standard, e il codice della voce è citato accanto a ognuno.
 *
 * Due cose che sorprendono e sono invece corrette:
 *
 * 1. **Una seduta di pesi costa meno di quanto sembri.** Il Compendium assegna
 *    3.5 MET a "resistance training, multiple exercises, 8-15 reps" (02054),
 *    perché in un'ora di palestra il tempo sotto sforzo è pochi minuti: il
 *    resto è recupero. Solo il body building a sforzo vigoroso arriva a 6.0
 *    (02050) e squat e stacchi a 5.0 (02052).
 *
 * 2. **Il cardio costa di più al minuto, ma le sedute sono più corte.** Una
 *    camminata in pendenza sta sui 7 MET (17035) contro i ~4-5.5 di una seduta
 *    di pesi, però dura 30 minuti invece di 60. Per questo nel totale
 *    settimanale i pesi possono comunque superarlo.
 *
 * Restano stime: l'errore realistico è del 20-30%. Servono a confrontare un
 * programma con un altro, non a contare le calorie al singolo kcal.
 */

/** kcal = MET x peso(kg) x ore. */
function kcalDaMet(met: number, pesoKg: number, minuti: number): number {
  return Math.round(met * pesoKg * (minuti / 60));
}

/**
 * MET di partenza per una seduta di pesi, ancorati al Compendium:
 * - 02054 «multiple exercises, 8-15 reps at varied resistance» = 3.5
 * - 02052 «squats, deadlift, slow or explosive effort» = 5.0
 * - 02035 «circuit training, moderate effort» = 4.3-5.0
 * - 02055 «circuit, reciprocal supersets» = 5.8
 * - 02050 «power lifting or body building, vigorous effort» = 6.0
 */
const MET_BASE: Record<Goal, number> = {
  // recuperi lunghissimi: molto tempo fermi, anche se le alzate sono pesanti
  forza: 4.2,
  massa: 4.0,
  // recuperi corti e densità alta: si avvicina al circuito
  definizione: 5.0,
  mantenimento: 3.8,
};

/** MET di una scheda: parte dall'obiettivo e corregge su recuperi e tipo di esercizi. */
export function metScheda(w: WorkoutTemplate, goal: Goal): number {
  let met = MET_BASE[goal];

  const recuperi = w.esercizi.map((e) => e.recuperoSec);
  const recuperoMedio = recuperi.reduce((a, b) => a + b, 0) / Math.max(recuperi.length, 1);
  if (recuperoMedio <= 60) met += 0.6;
  else if (recuperoMedio >= 150) met -= 0.8;

  // i multiarticolari muovono più massa muscolare e costano di più
  const composti = w.esercizi.filter((e) => esercizio(e.exerciseId)?.tipo === 'composto').length;
  const quota = composti / Math.max(w.esercizi.length, 1);
  met += (quota - 0.5) * 0.8;

  return Math.max(2.5, Math.round(met * 10) / 10);
}

export function kcalScheda(w: WorkoutTemplate, goal: Goal, pesoKg: number): number {
  return kcalDaMet(metScheda(w, goal), pesoKg, w.durataMin);
}

/**
 * MET per modalità di cardio, dal Compendium 2024. Prima questi valori venivano
 * indovinati con una regex sulla descrizione testuale del programma, che però
 * elenca alternative ("camminata in pendenza o ellittica"): vinceva la parola
 * che capitava prima nella tabella, non l'attività reale.
 */
const MET_CARDIO: Record<ModalitaCardio, { met: number; codice: string; nome: string }> = {
  'camminata-pendenza': { met: 6.5, codice: '17035', nome: 'Camminata in pendenza' },
  camminata: { met: 4.8, codice: '17354', nome: 'Camminata veloce in piano' },
  ellittica: { met: 5.5, codice: '02048', nome: 'Ellittica' },
  cyclette: { met: 6.0, codice: '01200', nome: 'Cyclette' },
  vogatore: { met: 7.0, codice: '02070', nome: 'Vogatore' },
  corsa: { met: 9.0, codice: '12040', nome: 'Corsa' },
  scala: { met: 9.0, codice: '02065', nome: 'Stairmaster' },
  hiit: { met: 9.5, codice: '02210/02214', nome: 'HIIT' },
};

/**
 * I piani salvati prima che `modalita` esistesse non ce l'hanno: in quel caso
 * si ripiega su un valore medio invece di restituire NaN.
 */
export function metCardio(modalita: ModalitaCardio | undefined): number {
  return (modalita && MET_CARDIO[modalita]?.met) || 5.0;
}

export function nomeCardio(modalita: ModalitaCardio | undefined): string {
  return (modalita && MET_CARDIO[modalita]?.nome) || 'Cardio';
}

export function kcalCardio(
  modalita: ModalitaCardio | undefined,
  minuti: number,
  pesoKg: number,
): number {
  return kcalDaMet(metCardio(modalita), pesoKg, minuti);
}

/** Quanto costa al minuto: è il confronto onesto fra pesi e cardio. */
export function kcalAlMinuto(met: number, pesoKg: number): number {
  return Math.round((met * pesoKg) / 60);
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

  const c = prog.cardio;
  const giorniCardio = c?.frequenzaSettimana ?? 0;
  let kcalCardioTot = 0;
  if (c) {
    // alcuni programmi mescolano sedute lente e una di HIIT: vanno contate a parte
    const hiit = Math.min(c.sessioniHiit ?? 0, c.frequenzaSettimana);
    const lente = c.frequenzaSettimana - hiit;
    kcalCardioTot =
      lente * kcalCardio(c.modalita, c.durataMin, pesoKg) +
      hiit * kcalCardio('hiit', c.durataHiitMin ?? c.durataMin, pesoKg);
  }

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
