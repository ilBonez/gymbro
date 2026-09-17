import type { MealEntry } from '../store/useStore';
import { giorniTra } from './date';

/**
 * I pasti che registri più spesso, pronti da ripetere.
 *
 * Chi mangia sempre gli stessi quattro piatti li ridigita ogni volta: qui si
 * raggruppa per nome e si tengono i macro dell'ultima volta, che sono quelli
 * che l'utente ha corretto per ultimo.
 */

export interface PastoFrequente {
  chiave: string;
  nome: string;
  momento: MealEntry['momento'];
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
  tipo: MealEntry['tipo'];
  volte: number;
}

const normalizza = (s: string) => s.trim().toLowerCase();

export function pastiFrequenti(
  pasti: MealEntry[],
  oggiK: string,
  giorni = 60,
  max = 6,
): PastoFrequente[] {
  const recenti = pasti.filter((p) => {
    const d = giorniTra(p.data, oggiK);
    return d >= 0 && d < giorni;
  });

  const gruppi = new Map<string, PastoFrequente & { ultima: string }>();
  for (const p of recenti) {
    const k = normalizza(p.nome);
    const prec = gruppi.get(k);
    if (!prec) {
      gruppi.set(k, {
        chiave: k,
        nome: p.nome,
        momento: p.momento,
        kcal: p.kcal,
        proteine: p.proteine,
        carbs: p.carbs,
        grassi: p.grassi,
        tipo: p.tipo,
        volte: 1,
        ultima: p.data,
      });
      continue;
    }
    prec.volte++;
    // i macro dell'ultima volta: sono quelli corretti più di recente
    if (p.data >= prec.ultima) {
      prec.ultima = p.data;
      prec.nome = p.nome;
      prec.momento = p.momento;
      prec.kcal = p.kcal;
      prec.proteine = p.proteine;
      prec.carbs = p.carbs;
      prec.grassi = p.grassi;
      prec.tipo = p.tipo;
    }
  }

  return [...gruppi.values()]
    .filter((g) => g.volte >= 2)
    .sort((a, b) => b.volte - a.volte || b.ultima.localeCompare(a.ultima))
    .slice(0, max)
    .map(({ ultima: _ultima, ...resto }) => resto);
}
