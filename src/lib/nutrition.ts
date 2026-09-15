import type { ActivityLevel, MacroTargets, Sex } from '../types';
import type { Goal } from '../data/programs';

export const ACTIVITY_FACTORS: Record<ActivityLevel, { f: number; label: string; desc: string }> = {
  sedentario: { f: 1.2, label: 'Sedentario', desc: 'Lavoro da scrivania, niente sport' },
  leggero: { f: 1.375, label: 'Leggero', desc: '1-3 allenamenti a settimana' },
  moderato: { f: 1.55, label: 'Moderato', desc: '3-5 allenamenti a settimana' },
  attivo: { f: 1.725, label: 'Attivo', desc: '6-7 allenamenti a settimana' },
  'molto-attivo': { f: 1.9, label: 'Molto attivo', desc: 'Doppie sedute o lavoro fisico' },
};

/** Metabolismo basale — formula di Mifflin-St Jeor. */
export function bmr(sesso: Sex, pesoKg: number, altezzaCm: number, eta: number): number {
  const base = 10 * pesoKg + 6.25 * altezzaCm - 5 * eta;
  return Math.round(sesso === 'uomo' ? base + 5 : base - 161);
}

/** Fabbisogno giornaliero totale. */
export function tdee(bmrVal: number, attivita: ActivityLevel): number {
  return Math.round(bmrVal * ACTIVITY_FACTORS[attivita].f);
}

export function bmi(pesoKg: number, altezzaCm: number): number {
  const m = altezzaCm / 100;
  return +(pesoKg / (m * m)).toFixed(1);
}

export function bmiCategoria(v: number): { label: string; color: string } {
  if (v < 18.5) return { label: 'Sottopeso', color: 'text-sky-400' };
  if (v < 25) return { label: 'Normopeso', color: 'text-brandink' };
  if (v < 30) return { label: 'Sovrappeso', color: 'text-carb' };
  return { label: 'Obesità', color: 'text-red-400' };
}

export function pesoIdealeRange(altezzaCm: number): [number, number] {
  const m = altezzaCm / 100;
  return [Math.round(18.5 * m * m), Math.round(24.9 * m * m)];
}

interface GoalRule {
  /** moltiplicatore sul TDEE */
  kcalFactor: number;
  /** g per kg di peso corporeo */
  protPerKg: number;
  grassiPerKg: number;
  /** tetto massimo carbo in g/kg (usato per il low carb) */
  carbMaxPerKg?: number;
  label: string;
  descrizione: string;
}

export const GOAL_RULES: Record<Goal, GoalRule> = {
  definizione: {
    kcalFactor: 0.78,
    protPerKg: 2.2,
    grassiPerKg: 0.9,
    carbMaxPerKg: 1.6,
    label: 'Definizione (low carb)',
    descrizione: 'Deficit ~22%, proteine alte, carboidrati bassi, cardio costante. Blocco breve.',
  },
  forza: {
    kcalFactor: 1.05,
    protPerKg: 2.0,
    grassiPerKg: 1.0,
    label: 'Forza',
    descrizione: 'Leggero surplus, carboidrati alti per sostenere i carichi, recuperi lunghi.',
  },
  massa: {
    kcalFactor: 1.13,
    protPerKg: 1.9,
    grassiPerKg: 1.0,
    label: 'Massa / ipertrofia',
    descrizione: 'Surplus controllato ~13%, volume alto, carboidrati abbondanti.',
  },
  mantenimento: {
    kcalFactor: 1.0,
    protPerKg: 1.8,
    grassiPerKg: 1.0,
    label: 'Mantenimento',
    descrizione: 'Calorie a pareggio, ricomposizione lenta, sostenibile a lungo.',
  },
};

/** Calcola i target macro giornalieri. `giornoAllenamento` alza un po' i carboidrati. */
export function macroTargets(
  goal: Goal,
  pesoKg: number,
  tdeeVal: number,
  giornoAllenamento = true,
): MacroTargets {
  const r = GOAL_RULES[goal];
  const kcal = Math.round(tdeeVal * r.kcalFactor * (giornoAllenamento ? 1 : 0.95));

  const proteine = Math.round(r.protPerKg * pesoKg);
  let grassi = Math.round(r.grassiPerKg * pesoKg);

  let kcalRimanenti = kcal - proteine * 4 - grassi * 9;
  let carbs = Math.max(0, Math.round(kcalRimanenti / 4));

  // tetto low carb: le calorie in eccesso finiscono nei grassi
  if (r.carbMaxPerKg) {
    const maxCarbs = Math.round(r.carbMaxPerKg * pesoKg * (giornoAllenamento ? 1 : 0.7));
    if (carbs > maxCarbs) {
      const extraKcal = (carbs - maxCarbs) * 4;
      carbs = maxCarbs;
      grassi += Math.round(extraKcal / 9);
    }
  }

  // i grassi non scendono mai sotto 0.6 g/kg: serve per gli ormoni
  const grassiMin = Math.round(0.6 * pesoKg);
  if (grassi < grassiMin) {
    const deficitKcal = (grassiMin - grassi) * 9;
    grassi = grassiMin;
    carbs = Math.max(0, carbs - Math.round(deficitKcal / 4));
  }

  return {
    kcal,
    proteine,
    carbs,
    grassi,
    fibre: Math.max(25, Math.round(kcal / 1000 * 14)),
    acquaLitri: +(pesoKg * 0.035 + (giornoAllenamento ? 0.5 : 0)).toFixed(1),
  };
}

/**
 * Massa grassa con la formula della US Navy: stima da circonferenze, con un
 * errore tipico di 3-4 punti percentuali. Più affidabile di una stima a occhio
 * e molto meno di una DEXA, ma soprattutto ripetibile: se misuri sempre negli
 * stessi punti, la tendenza nel tempo è attendibile anche se il valore assoluto
 * è approssimativo.
 *
 * Misure in centimetri. Per le donne servono anche i fianchi.
 */
export function massaGrassaNavy(
  sesso: Sex,
  altezzaCm: number,
  vitaCm: number,
  colloCm: number,
  fianchiCm?: number,
): number | null {
  if (altezzaCm <= 0 || vitaCm <= 0 || colloCm <= 0) return null;
  const log = Math.log10;

  if (sesso === 'uomo') {
    if (vitaCm <= colloCm) return null;
    const v = 495 / (1.0324 - 0.19077 * log(vitaCm - colloCm) + 0.15456 * log(altezzaCm)) - 450;
    return v > 2 && v < 60 ? Math.round(v * 10) / 10 : null;
  }

  if (!fianchiCm || vitaCm + fianchiCm <= colloCm) return null;
  const v =
    495 / (1.29579 - 0.35004 * log(vitaCm + fianchiCm - colloCm) + 0.221 * log(altezzaCm)) - 450;
  return v > 5 && v < 65 ? Math.round(v * 10) / 10 : null;
}

export function kcalDaMacro(p: number, c: number, g: number): number {
  return Math.round(p * 4 + c * 4 + g * 9);
}

/** Stima del ritmo di variazione peso settimanale in kg. */
export function variazionePesoAttesa(kcalTarget: number, tdeeVal: number): number {
  return +(((kcalTarget - tdeeVal) * 7) / 7700).toFixed(2);
}
