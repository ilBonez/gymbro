import type { GiornoSalute, MealEntry, SessioneCardio } from '../store/useStore';
import type { PlanDay, SessionLog } from '../types';
import type { Program, WorkoutTemplate } from '../data/programs';
import { programma, scheda } from './catalog';
import { kcalAlMinuto, metScheda } from './burn';
import { kcalMovimento } from './health';

/**
 * Tutto quello che l'app sa di una data, in un oggetto solo.
 *
 * Le viste del calendario (giorno, settimana, mese, anno) hanno bisogno degli
 * stessi dati a granularità diverse: tenerli insieme evita che ognuna se li
 * ricalcoli a modo suo e finisca per dire cose leggermente diverse.
 */

export interface Giornata {
  data: string;
  pianificato: PlanDay | undefined;
  programma: Program | undefined;
  scheda: WorkoutTemplate | undefined;
  sessioni: SessionLog[];
  cardio: SessioneCardio[];
  salute: GiornoSalute | undefined;
  pasti: MealEntry[];
  kcalAssunte: number;
  proteine: number;
  sgarri: number;
  /** calorie di movimento: misurate se ci sono, altrimenti stimate (vedi sotto) */
  kcalMovimento: number;
  /** minuti di esercizio: i misurati dal telefono o i registrati, mai sommati */
  minutiEsercizio: number;
  passi: number;
  sonnoMin: number;
  pesoKg: number | null;
}

export type StatoGiorno =
  | 'fatto'          // allenamento completato
  | 'saltato'        // era pianificato e non è stato fatto, ed è passato
  | 'previsto'       // pianificato, ancora da fare
  | 'cardio'
  | 'riposo'
  | 'libero';        // niente in calendario

export interface Fonti {
  piano: Record<string, PlanDay>;
  sessioni: SessionLog[];
  sessioniCardio: SessioneCardio[];
  giorniSalute: Record<string, GiornoSalute>;
  pasti: MealEntry[];
  pesi: { data: string; pesoKg: number }[];
  /** peso di riferimento, per stimare le calorie della palestra */
  pesoKg: number;
}

export function componiGiornata(data: string, f: Fonti): Giornata {
  return costruisci(
    data,
    f,
    f.sessioni.filter((s) => s.data === data),
    f.sessioniCardio.filter((c) => c.data === data),
    f.pasti.filter((p) => p.data === data),
    f.pesi.find((p) => p.data === data)?.pesoKg ?? null,
  );
}

/**
 * Le stesse giornate, per un periodo intero.
 *
 * La vista anno chiede 365 giorni: scorrere sessioni e pasti una volta per
 * giorno costerebbe 365 passate sugli stessi array. Qui si indicizza una volta
 * sola e poi si pesca.
 */
export function componiPeriodo(chiavi: string[], f: Fonti): Giornata[] {
  const perData = <T extends { data: string }>(arr: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of arr) {
      const l = m.get(x.data);
      if (l) l.push(x);
      else m.set(x.data, [x]);
    }
    return m;
  };

  const sessioni = perData(f.sessioni);
  const cardio = perData(f.sessioniCardio);
  const pasti = perData(f.pasti);
  const pesi = new Map(f.pesi.map((p) => [p.data, p.pesoKg]));

  return chiavi.map((k) =>
    costruisci(
      k,
      f,
      sessioni.get(k) ?? [],
      cardio.get(k) ?? [],
      pasti.get(k) ?? [],
      pesi.get(k) ?? null,
    ),
  );
}

function costruisci(
  data: string,
  f: Fonti,
  sessioni: SessionLog[],
  cardio: SessioneCardio[],
  pasti: MealEntry[],
  pesoKg: number | null,
): Giornata {
  const pianificato = f.piano[data];
  const prog = pianificato ? programma(pianificato.programId) : undefined;
  const sch =
    pianificato?.workoutId && pianificato.programId
      ? scheda(pianificato.programId, pianificato.workoutId)
      : undefined;

  const salute = f.giorniSalute[data];

  const minutiCardio = cardio.reduce((t, c) => t + c.minuti, 0);
  const minutiPalestra = sessioni.reduce((t, s) => t + s.durataSec / 60, 0);
  const minutiRegistrati = Math.round(minutiCardio + minutiPalestra);

  const kcalCardio = cardio.reduce((t, c) => t + c.kcal, 0);
  const kcalPalestra = sessioni.reduce((t, s) => {
    const w = scheda(s.programId, s.workoutId);
    const p = programma(s.programId);
    if (!w || !p) return t;
    return t + kcalAlMinuto(metScheda(w, p.goal), f.pesoKg) * (s.durataSec / 60);
  }, 0);

  /*
   * Niente somme allegre: le calorie misurate dal telefono contengono già
   * tutto. Quando mancano, la stima dai passi e il cardio registrato coprono
   * spesso la stessa attività (il tapis roulant fa passi), quindi si prende la
   * più grande delle due; la palestra invece i passi non la contano e si somma.
   */
  const misurate = salute ? kcalMovimento(salute) : 0;
  const stimate = Math.max(salute?.kcalStimateDaPassi ?? 0, kcalCardio) + kcalPalestra;

  return {
    data,
    pianificato,
    programma: prog,
    scheda: sch,
    sessioni,
    salute,
    pasti,
    kcalAssunte: pasti.reduce((t, p) => t + p.kcal, 0),
    proteine: pasti.reduce((t, p) => t + p.proteine, 0),
    sgarri: pasti.filter((p) => p.tipo === 'sgarro').length,
    cardio,
    kcalMovimento: salute && salute.kcalAttive > 0 ? misurate : Math.round(stimate),
    // stesso ragionamento dei minuti: il maggiore fra misurato e registrato
    minutiEsercizio: Math.max(salute?.minutiEsercizio ?? 0, minutiRegistrati),
    passi: salute?.passi ?? 0,
    sonnoMin: salute?.sonnoMin ?? 0,
    pesoKg,
  };
}

/** Vero se la giornata ha qualcosa da mostrare oltre alla data. */
export function haDati(g: Giornata): boolean {
  return (
    g.kcalMovimento > 0 ||
    g.passi > 0 ||
    g.minutiEsercizio > 0 ||
    g.sonnoMin > 0 ||
    g.pasti.length > 0 ||
    g.sessioni.length > 0 ||
    g.cardio.length > 0 ||
    g.pesoKg !== null
  );
}

export function statoGiorno(g: Giornata, oggiK: string): StatoGiorno {
  if (g.sessioni.length > 0) return 'fatto';
  if (g.cardio.length > 0 && !g.scheda) return 'cardio';
  if (g.scheda) return g.data < oggiK ? 'saltato' : 'previsto';
  if (g.pianificato?.cardio) return 'cardio';
  if (g.pianificato) return 'riposo';
  return 'libero';
}

export const COLORE_STATO: Record<StatoGiorno, string> = {
  fatto: 'bg-brand-500',
  previsto: 'bg-brand-500/35',
  saltato: 'bg-red-400/60',
  cardio: 'bg-carb/70',
  riposo: 'bg-line2',
  libero: 'bg-transparent',
};

export const ETICHETTA_STATO_GIORNO: Record<StatoGiorno, string> = {
  fatto: 'Allenamento fatto',
  previsto: 'Allenamento previsto',
  saltato: 'Allenamento saltato',
  cardio: 'Cardio',
  riposo: 'Riposo',
  libero: 'Libero',
};

export interface RiepilogoPeriodo {
  giorni: number;
  allenamentiFatti: number;
  allenamentiPrevisti: number;
  saltati: number;
  kcalMovimento: number;
  passi: number;
  minutiEsercizio: number;
  giorniConPasti: number;
  sgarri: number;
  volumeKg: number;
  seduteCardio: number;
}

export function riepiloga(giornate: Giornata[], oggiK: string): RiepilogoPeriodo {
  const r: RiepilogoPeriodo = {
    giorni: giornate.length,
    allenamentiFatti: 0,
    allenamentiPrevisti: 0,
    saltati: 0,
    kcalMovimento: 0,
    passi: 0,
    minutiEsercizio: 0,
    giorniConPasti: 0,
    sgarri: 0,
    volumeKg: 0,
    seduteCardio: 0,
  };

  for (const g of giornate) {
    const st = statoGiorno(g, oggiK);
    if (st === 'fatto') r.allenamentiFatti++;
    if (g.scheda) r.allenamentiPrevisti++;
    if (st === 'saltato') r.saltati++;
    r.kcalMovimento += g.kcalMovimento;
    r.passi += g.passi;
    r.minutiEsercizio += g.minutiEsercizio;
    if (g.pasti.length > 0) r.giorniConPasti++;
    r.sgarri += g.sgarri;
    r.seduteCardio += g.cardio.length;
    r.volumeKg += g.sessioni.reduce((t, s) => t + s.volumeKg, 0);
  }
  return r;
}
