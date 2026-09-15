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

export function ricetta(id: string): Recipe | undefined {
  return recipeMap.get(id);
}

export function programma(id: string): Program | undefined {
  return progMap.get(id);
}

export function scheda(programId: string, workoutId: string): WorkoutTemplate | undefined {
  return progMap.get(programId)?.workouts.find((w) => w.id === workoutId);
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
