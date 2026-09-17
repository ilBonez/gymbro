import type { Recipe, RecipeIngredient } from '../data/recipes';
import { alimento } from './catalog';

/**
 * Conti per le ricette scritte dall'utente.
 *
 * I valori del catalogo alimenti sono sempre per 100 g (o 100 ml): un
 * ingrediente contribuisce ai macro solo se ha un alimento collegato ed è
 * pesato in grammi o millilitri. Quelli a pezzi o "q.b." restano nell'elenco
 * della ricetta ma non entrano nel conto, perché il peso di un pezzo non è un
 * dato che abbiamo.
 */

export interface MacroRicetta {
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
}

export interface ContoIngredienti extends MacroRicetta {
  /** ingredienti che hanno contribuito ai macro */
  contati: number;
  /** ingredienti elencati ma non conteggiabili (pezzi, q.b., roba scritta a mano) */
  scoperti: number;
}

export function contaIngredienti(ingredienti: RecipeIngredient[]): ContoIngredienti {
  const c: ContoIngredienti = {
    kcal: 0,
    proteine: 0,
    carbs: 0,
    grassi: 0,
    contati: 0,
    scoperti: 0,
  };

  for (const i of ingredienti) {
    const f = i.foodId ? alimento(i.foodId) : undefined;
    const pesabile = i.unita === 'g' || i.unita === 'ml';
    if (!f || !pesabile || i.qta <= 0) {
      if (i.unita !== 'q.b.') c.scoperti++;
      continue;
    }
    const q = i.qta / 100;
    c.kcal += f.kcal * q;
    c.proteine += f.proteine * q;
    c.carbs += f.carbs * q;
    c.grassi += f.grassi * q;
    c.contati++;
  }
  return c;
}

/** I macro di una porzione, arrotondati come nel ricettario. */
export function perPorzione(tot: MacroRicetta, porzioni: number): MacroRicetta {
  const n = Math.max(1, porzioni);
  return {
    kcal: Math.round(tot.kcal / n),
    proteine: Math.round(tot.proteine / n),
    carbs: Math.round(tot.carbs / n),
    grassi: Math.round(tot.grassi / n),
  };
}

/** Cosa manca perché la ricetta sia salvabile. Vuoto = si può salvare. */
export function problemi(r: {
  nome: string;
  momenti: unknown[];
  macro: MacroRicetta;
}): string[] {
  const p: string[] = [];
  if (r.nome.trim().length < 2) p.push('Manca il nome.');
  if (r.momenti.length === 0) p.push('Scegli almeno un momento della giornata.');
  if (r.macro.kcal <= 0) p.push('Le calorie per porzione devono essere maggiori di zero.');
  return p;
}

/** Fase suggerita dai carboidrati, con la stessa regola del ricettario. */
export function fasiSuggerite(macro: MacroRicetta): Recipe['fasi'] {
  if (macro.carbs < 25) return ['definizione'];
  if (macro.carbs > 60) return ['massa', 'forza'];
  return ['mantenimento'];
}
