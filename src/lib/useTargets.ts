import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { bmr, macroTargets, tdee } from './nutrition';
import type { MacroTargets } from '../types';
import type { Goal } from '../data/programs';

export interface Targets {
  bmr: number;
  tdee: number;
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
    const t = tdee(b, profile.attivita);
    return {
      bmr: b,
      tdee: t,
      macro: macroTargets(profile.obiettivo, profile.pesoKg, t, allenamento),
      goal: profile.obiettivo,
      pesoKg: profile.pesoKg,
    };
  }, [profile, allenamento]);
}
