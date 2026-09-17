import { EXERCISES } from '../data/exercises';
import type { Exercise } from '../data/exercises';
import { PROGRAMS } from '../data/programs';
import type { Program, WorkoutTemplate } from '../data/programs';
import { FOODS } from '../data/foods';
import type { Food } from '../data/foods';
import { RECIPES } from '../data/recipes';
import type { Recipe } from '../data/recipes';

const exMap = new Map(EXERCISES.map((e) => [e.id, e]));
const foodMap = new Map(FOODS.map((f) => [f.id, f]));
const recipeMap = new Map(RECIPES.map((r) => [r.id, r]));
const progMap = new Map(PROGRAMS.map((p) => [p.id, p]));

export function esercizio(id: string): Exercise | undefined {
  return exMap.get(id);
}

export function nomeEsercizio(id: string): string {
  return exMap.get(id)?.nome ?? id;
}

export function alimento(id: string): Food | undefined {
  return foodMap.get(id);
}

/**
 * Ricette scritte dall'utente, tenute a parte da quelle del ricettario.
 *
 * Le registra lo store a ogni cambiamento (vedi useStore.ts): il catalogo resta
 * un modulo puro e chi cerca una ricetta per id le trova entrambe.
 */
let ricetteMie = new Map<string, Recipe>();

export function registraRicetteMie(lista: Recipe[]): void {
  ricetteMie = new Map(lista.map((r) => [r.id, r]));
}

export function ricetta(id: string): Recipe | undefined {
  return recipeMap.get(id) ?? ricetteMie.get(id);
}

/** Vero per le ricette scritte dall'utente: si possono modificare e cancellare. */
export function ricettaMia(id: string): boolean {
  return id.startsWith('mia-');
}

/**
 * Le schede scritte dall'utente vivono dentro un programma finto, "Le mie
 * schede": cosi' il calendario, la sessione e la progressione dei carichi le
 * trattano come tutte le altre senza sapere che sono diverse.
 */
export const ID_PROGRAMMA_MIO = 'mie-schede';

let schedeMie: WorkoutTemplate[] = [];

export function registraSchedeMie(lista: WorkoutTemplate[]): void {
  schedeMie = lista;
}

export function schedaMia(id: string): boolean {
  return id.startsWith('mia-');
}

export function programmaMio(): Program | undefined {
  if (schedeMie.length === 0) return undefined;
  // la settimana tipo alterna le tue schede e mette riposo negli altri giorni
  const split = Array.from({ length: 7 }, (_, i) =>
    i < schedeMie.length && i < 5 ? schedeMie[i].nome : 'Riposo',
  );
  return {
    id: ID_PROGRAMMA_MIO,
    nome: 'Le mie schede',
    goal: 'mantenimento',
    descrizione:
      'Le schede che hai scritto tu. Funzionano come le altre: le metti sul calendario, le fai partire e i carichi entrano nella progressione.',
    durataSettimane: 4,
    giorniSettimana: Math.min(schedeMie.length, 5),
    splitSuggerito: split,
    cardio: null,
    workouts: schedeMie,
  };
}

export function programma(id: string): Program | undefined {
  if (id === ID_PROGRAMMA_MIO) return programmaMio();
  return progMap.get(id);
}

/** Programmi del catalogo piu' quello finto con le tue schede, se ne hai. */
export function tuttiIProgrammi(): Program[] {
  const mio = programmaMio();
  return mio ? [mio, ...PROGRAMS] : PROGRAMS;
}

export function scheda(programId: string, workoutId: string): WorkoutTemplate | undefined {
  return programma(programId)?.workouts.find((w) => w.id === workoutId);
}

/** Esercizi mancanti nel catalogo: usato dallo smoke test dei dati. */
export function riferimentiRotti(): string[] {
  const rotti: string[] = [];
  for (const p of PROGRAMS) {
    for (const w of p.workouts) {
      for (const e of w.esercizi) {
        if (!exMap.has(e.exerciseId)) rotti.push(`${p.id}/${w.id}/${e.exerciseId}`);
      }
    }
  }
  for (const r of RECIPES) {
    for (const i of r.ingredienti) {
      if (i.foodId && !foodMap.has(i.foodId)) rotti.push(`ricetta ${r.id} -> ${i.foodId}`);
    }
  }
  return rotti;
}
