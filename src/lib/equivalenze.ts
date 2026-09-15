import { EQUIVALENZE } from '../data/equivalenze';
import type { Alternativa, GruppoMacro } from '../data/equivalenze';

export type { Alternativa, GruppoMacro };

/** Quanto macro porta 1 g di questo alimento. */
function perGrammo(a: Alternativa, gruppo: GruppoMacro): number {
  return a[gruppo] / 100;
}

export interface Porzione {
  alimento: Alternativa;
  grammi: number;
  /** peso dopo la cottura, quando la resa è nota */
  grammiCotti: number | null;
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
}

function cotti(a: Alternativa, grammi: number): number | null {
  if (!a.resaCottura || a.stato !== 'crudo') return null;
  return Math.round((grammi * a.resaCottura) / 5) * 5;
}

function arrotonda(g: number, passo: number): number {
  return Math.max(passo, Math.round(g / passo) * passo);
}

export function porzionePer(
  alimento: Alternativa,
  gruppo: GruppoMacro,
  macroTarget: number,
): Porzione | null {
  const densita = perGrammo(alimento, gruppo);
  if (densita <= 0) return null;
  const grammi = arrotonda(macroTarget / densita, alimento.passo ?? 5);
  return {
    alimento,
    grammi,
    grammiCotti: cotti(alimento, grammi),
    kcal: Math.round((alimento.kcal * grammi) / 100),
    proteine: Math.round((alimento.proteine * grammi) / 100),
    carbs: Math.round((alimento.carbs * grammi) / 100),
    grassi: Math.round((alimento.grassi * grammi) / 100),
  };
}

/**
 * Porzioni equivalenti: quanti grammi di ciascun alimento servono per portare
 * la stessa quantità del macro scelto.
 *
 * Attenzione: l'equivalenza è su UN macro solo. 80 g di pasta e 300 g di patate
 * danno gli stessi carboidrati ma non le stesse calorie né le stesse proteine,
 * per questo ogni riga riporta anche le kcal.
 */
export function equivalenti(
  gruppo: GruppoMacro,
  macroTarget: number,
  opzioni: { escludi?: string[]; max?: number } = {},
): Porzione[] {
  const { escludi = [], max = 6 } = opzioni;
  return EQUIVALENZE.filter((a) => a.gruppo === gruppo && a[gruppo] > 0 && !escludi.includes(a.id))
    .map((a) => porzionePer(a, gruppo, macroTarget))
    .filter((p): p is Porzione => p !== null && p.grammi >= 10 && p.grammi <= 900)
    .sort((a, b) => a.alimento.ordine - b.alimento.ordine)
    .slice(0, max);
}

/** Da una porzione di riferimento alle sue alternative con lo stesso macro. */
export function sostituzioniDi(
  alimentoId: string,
  grammi: number,
  gruppo: GruppoMacro,
  max = 8,
): { riferimento: Porzione; alternative: Porzione[] } | null {
  const rif = EQUIVALENZE.find((a) => a.id === alimentoId);
  if (!rif) return null;
  const macro = (rif[gruppo] * grammi) / 100;
  const riferimento: Porzione = {
    alimento: rif,
    grammi,
    grammiCotti: cotti(rif, grammi),
    kcal: Math.round((rif.kcal * grammi) / 100),
    proteine: Math.round((rif.proteine * grammi) / 100),
    carbs: Math.round((rif.carbs * grammi) / 100),
    grassi: Math.round((rif.grassi * grammi) / 100),
  };
  return { riferimento, alternative: equivalenti(gruppo, macro, { escludi: [alimentoId], max }) };
}

export function alimentiDelGruppo(gruppo: GruppoMacro): Alternativa[] {
  return EQUIVALENZE.filter((a) => a.gruppo === gruppo).sort((a, b) => a.ordine - b.ordine);
}

export function alimentoById(id: string): Alternativa | undefined {
  return EQUIVALENZE.find((a) => a.id === id);
}

export const ETICHETTA_STATO: Record<Alternativa['stato'], string> = {
  crudo: 'da crudo',
  cotto: 'già cotto',
  pronto: 'così com’è',
};

export const ETICHETTA_GRUPPO: Record<GruppoMacro, string> = {
  carbs: 'Carboidrati',
  proteine: 'Proteine',
  grassi: 'Grassi',
};
