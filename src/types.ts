import type { Goal } from './data/programs';

export type Sex = 'uomo' | 'donna';

export type ActivityLevel =
  | 'sedentario'
  | 'leggero'
  | 'moderato'
  | 'attivo'
  | 'molto-attivo';

export interface Profile {
  nome: string;
  sesso: Sex;
  eta: number;
  altezzaCm: number;
  pesoKg: number;
  attivita: ActivityLevel;
  obiettivo: Goal;
  pesoTargetKg?: number;
  creato: string; // ISO
}

export interface WeightEntry {
  id: string;
  data: string;       // yyyy-MM-dd
  pesoKg: number;
  massaGrassaPct?: number;
  vitaCm?: number;
  note?: string;
}

/** Un giorno pianificato dall'utente sul calendario. */
export interface PlanDay {
  data: string;             // yyyy-MM-dd (chiave)
  programId: string;
  workoutId: string | null; // null = giorno di riposo
  cardio?: { tipo: string; durataMin: number } | null;
  note?: string;
}

export interface LoggedSet {
  reps: number | null;
  kg: number | null;
  fatto: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  serie: LoggedSet[];
  note?: string;
}

export interface SessionLog {
  id: string;
  data: string;         // yyyy-MM-dd
  iniziata: string;     // ISO
  conclusa?: string;    // ISO
  durataSec: number;
  programId: string;
  workoutId: string;
  esercizi: LoggedExercise[];
  volumeKg: number;
  completata: boolean;
  note?: string;
}

export interface MacroTargets {
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
  fibre: number;
  acquaLitri: number;
}

export interface ShoppingItem {
  id: string;
  nome: string;
  qta?: string;
  categoria: string;
  foodId?: string;
  ricercaUrl?: string;
  preso: boolean;
  manuale: boolean;
}

export interface SupplementLogEntry {
  data: string;         // yyyy-MM-dd
  supplementId: string;
  preso: boolean;
}
