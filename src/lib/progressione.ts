import type { LoggedExercise, SessionLog } from '../types';
import type { ProgramSet } from '../data/programs';
import { esercizio } from './catalog';
import type { Exercise } from '../data/exercises';

/**
 * Progressione dei carichi.
 *
 * Il massimale stimato usa la formula di Epley (1RM = kg x (1 + rip/30)), che è
 * attendibile fino a 10-12 ripetizioni e sovrastima oltre: sopra le 12 il valore
 * viene restituito ma marcato come poco affidabile.
 */

export function stima1RM(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0;
  if (reps === 1) return kg;
  return Math.round(kg * (1 + reps / 30) * 10) / 10;
}

export function affidabile(reps: number): boolean {
  return reps > 0 && reps <= 12;
}

export interface SerieFatta {
  kg: number;
  reps: number;
  stima: number;
}

/** La serie migliore di un esercizio in una sessione, per massimale stimato. */
export function migliorSerie(ex: LoggedExercise): SerieFatta | null {
  const valide = ex.serie
    .filter((s) => s.fatto && (s.kg ?? 0) > 0 && (s.reps ?? 0) > 0)
    .map((s) => ({ kg: s.kg!, reps: s.reps!, stima: stima1RM(s.kg!, s.reps!) }));
  if (valide.length === 0) return null;
  return valide.sort((a, b) => b.stima - a.stima)[0];
}

export interface PuntoStorico {
  data: string;
  stima: number;
  kg: number;
  reps: number;
  volume: number;
}

/** Andamento di un esercizio nel tempo, una riga per sessione. */
export function storicoEsercizio(sessioni: SessionLog[], exerciseId: string): PuntoStorico[] {
  const punti: PuntoStorico[] = [];
  for (const s of sessioni) {
    for (const ex of s.esercizi) {
      if (ex.exerciseId !== exerciseId) continue;
      const best = migliorSerie(ex);
      if (!best) continue;
      const volume = ex.serie.reduce(
        (t, x) => t + (x.fatto ? (x.kg ?? 0) * (x.reps ?? 0) : 0),
        0,
      );
      punti.push({ data: s.data, stima: best.stima, kg: best.kg, reps: best.reps, volume });
    }
  }
  return punti.sort((a, b) => a.data.localeCompare(b.data));
}

export interface Record1RM {
  exerciseId: string;
  nome: string;
  stima: number;
  kg: number;
  reps: number;
  data: string;
}

/** Il record di ogni esercizio mai eseguito, dal più recente. */
export function recordPersonali(sessioni: SessionLog[]): Record1RM[] {
  const mappa = new Map<string, Record1RM>();
  for (const s of sessioni) {
    for (const ex of s.esercizi) {
      const best = migliorSerie(ex);
      if (!best) continue;
      const attuale = mappa.get(ex.exerciseId);
      if (!attuale || best.stima > attuale.stima) {
        mappa.set(ex.exerciseId, {
          exerciseId: ex.exerciseId,
          nome: esercizio(ex.exerciseId)?.nome ?? ex.exerciseId,
          stima: best.stima,
          kg: best.kg,
          reps: best.reps,
          data: s.data,
        });
      }
    }
  }
  return [...mappa.values()].sort((a, b) => b.data.localeCompare(a.data));
}

/** I record battuti in questa sessione rispetto a tutte le precedenti. */
export function recordBattuti(sessione: SessionLog, precedenti: SessionLog[]): Record1RM[] {
  const vecchi = new Map(recordPersonali(precedenti).map((r) => [r.exerciseId, r.stima]));
  const out: Record1RM[] = [];
  for (const ex of sessione.esercizi) {
    const best = migliorSerie(ex);
    if (!best) continue;
    const prima = vecchi.get(ex.exerciseId);
    if (prima === undefined || best.stima > prima + 0.4) {
      out.push({
        exerciseId: ex.exerciseId,
        nome: esercizio(ex.exerciseId)?.nome ?? ex.exerciseId,
        stima: best.stima,
        kg: best.kg,
        reps: best.reps,
        data: sessione.data,
      });
    }
  }
  return out;
}

/**
 * Secondi richiesti, per gli esercizi che si misurano a tempo invece che a
 * ripetizioni: plank, hollow hold, camminate del contadino. Restituisce il
 * valore alto dell'intervallo, che e' quello a cui puntare.
 */
export function secondiRichiesti(v: string): number | null {
  const m = v.trim().toLowerCase().match(/^(\d+)(?:\s*[-–]\s*(\d+))?\s*s(ec)?$/);
  if (!m) return null;
  return parseInt(m[2] ?? m[1], 10);
}

/** Intervallo di ripetizioni richiesto, quando la scheda ne indica uno. */
export function intervalloRipetizioni(v: string): { min: number; max: number } | null {
  const pulito = v.trim().toLowerCase();
  if (/s$|sec|amrap|max/.test(pulito)) return null;
  const range = pulito.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) return { min: +range[1], max: +range[2] };
  const singolo = pulito.match(/^(\d+)$/);
  if (singolo) return { min: +singolo[1], max: +singolo[1] };
  return null;
}

/**
 * Di quanto ha senso salire su questo esercizio.
 * I manubri si comprano a coppie, quindi il salto minimo è doppio;
 * a corpo libero ed elastici non c'è un carico da suggerire.
 */
export function incrementoMinimo(ex: Exercise): number | null {
  if (ex.tipo === 'cardio') return null;
  if (ex.attrezzatura === 'corpo-libero' || ex.attrezzatura === 'elastico') return null;

  const gambe = ['quadricipiti', 'femorali', 'glutei'];
  const grosso = ex.tipo === 'composto' && (gambe.includes(ex.gruppi[0]) || ex.gruppi[0] === 'schiena');

  if (ex.attrezzatura === 'manubri') return grosso ? 4 : 2;
  if (ex.attrezzatura === 'macchina') return 5;
  if (ex.attrezzatura === 'cavi') return 2.5;
  return grosso ? 5 : 2.5;
}

export type Verdetto = 'sali' | 'conferma' | 'cala' | 'primo';

export interface Suggerimento {
  verdetto: Verdetto;
  kg: number | null;
  testo: string;
}

/**
 * Cosa caricare alla prossima seduta, guardando l'ultima volta che si è fatto
 * questo esercizio con questa scheda.
 *
 * Regola di doppia progressione, la più semplice che funziona: si sale di peso
 * solo quando tutte le serie hanno chiuso il tetto dell'intervallo. Se due o più
 * serie sono finite sotto il minimo, si cala.
 */
export function suggerimentoCarico(
  def: ProgramSet,
  ultima: LoggedExercise | undefined,
): Suggerimento {
  const ex = esercizio(def.exerciseId);
  const intervallo = intervalloRipetizioni(def.ripetizioni);
  const passo = ex ? incrementoMinimo(ex) : null;

  const fatte = (ultima?.serie ?? []).filter((s) => s.fatto && (s.reps ?? 0) > 0);
  if (fatte.length === 0) {
    return {
      verdetto: 'primo',
      kg: null,
      testo: 'Prima volta: parti con un carico che ti lascia due ripetizioni di margine.',
    };
  }

  const carichi = fatte.map((s) => s.kg ?? 0).filter((k) => k > 0);
  const carico = carichi.length ? Math.max(...carichi) : 0;

  if (!intervallo || passo === null || carico === 0) {
    const r = fatte.map((s) => s.reps).join(', ');
    return {
      verdetto: 'conferma',
      kg: carico || null,
      testo: `L'ultima volta: ${r} ripetizioni${carico ? ` a ${carico} kg` : ''}.`,
    };
  }

  const sottoMinimo = fatte.filter((s) => (s.reps ?? 0) < intervallo.min).length;
  const tutteAlMassimo = fatte.every((s) => (s.reps ?? 0) >= intervallo.max);

  if (sottoMinimo >= 2) {
    const nuovo = Math.max(passo, Math.round((carico - passo) * 10) / 10);
    return {
      verdetto: 'cala',
      kg: nuovo,
      testo: `Due serie sotto le ${intervallo.min} ripetizioni: scendi a ${nuovo} kg e ricostruisci.`,
    };
  }

  if (tutteAlMassimo) {
    const nuovo = Math.round((carico + passo) * 10) / 10;
    return {
      verdetto: 'sali',
      kg: nuovo,
      testo: `Hai chiuso tutte le serie a ${intervallo.max}: sali a ${nuovo} kg.`,
    };
  }

  return {
    verdetto: 'conferma',
    kg: carico,
    testo: `Resta a ${carico} kg finché non chiudi ${intervallo.max} ripetizioni su tutte le serie.`,
  };
}

/** L'ultima esecuzione di un esercizio, cercando all'indietro fra le sessioni. */
export function ultimaEsecuzione(
  sessioni: SessionLog[],
  exerciseId: string,
): { sessione: SessionLog; esercizio: LoggedExercise } | null {
  for (const s of sessioni) {
    const ex = s.esercizi.find(
      (e) => e.exerciseId === exerciseId && e.serie.some((x) => x.fatto),
    );
    if (ex) return { sessione: s, esercizio: ex };
  }
  return null;
}
