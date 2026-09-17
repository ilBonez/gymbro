import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { bmr, macroTargets, tdee } from './nutrition';
import type { MacroTargets } from '../types';
import type { Goal } from '../data/programs';

export interface Targets {
  bmr: number;
  tdee: number;
  /** quello che direbbe la formula, anche quando usi il tuo */
  tdeeFormula: number;
  daMisura: boolean;
  macro: MacroTargets;
  goal: Goal;
  pesoKg: number;
}

/** Target calorici e macro dell'utente. `allenamento` alza leggermente i carboidrati. */
export function useTargets(allenamento = true): Targets | null {
  const profile = useStore((s) => s.profile);

  return useMemo(() => {
    if (!profile) return null;
    const b = bmr(profile.sesso, profile.pesoKg, profile.altezzaCm, profile.eta);
    const formula = tdee(b, profile.attivita);
    // il fabbisogno misurato dai tuoi dati batte la formula, se l'hai salvato
    const t = profile.tdeeManuale ?? formula;
    return {
      bmr: b,
      tdee: t,
      tdeeFormula: formula,
      daMisura: profile.tdeeManuale !== undefined,
      macro: macroTargets(profile.obiettivo, profile.pesoKg, t, allenamento),
      goal: profile.obiettivo,
      pesoKg: profile.pesoKg,
    };
  }, [profile, allenamento]);
}
