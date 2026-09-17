import type { MealEntry } from '../store/useStore';
import type { WeightEntry } from '../types';
import { giorniTra } from './date';

/**
 * Il fabbisogno vero, dedotto dai tuoi dati invece che dalla formula.
 *
 * Mifflin-St Jeor più un fattore di attività è una media di popolazione: sul
 * singolo sbaglia facilmente di 200-300 kcal. Se sai quanto hai mangiato e
 * quanto è cambiato il peso, il fabbisogno si ricava dal bilancio energetico:
 *
 *   TDEE = calorie medie assunte + (kg persi × 7700) / giorni
 *
 * 7700 kcal per kg è il valore convenzionale per il tessuto adiposo (circa
 * 7000-7800 a seconda della composizione). Vale solo su periodi lunghi: sotto
 * le due settimane l'acqua corporea si muove più del grasso e il conto dice
 * sciocchezze.
 */

const KCAL_PER_KG = 7700;

export interface StimaTdee {
  giorni: number;
  /** giorni del periodo in cui hai davvero registrato dei pasti */
  giorniTracciati: number;
  copertura: number;
  kcalMedie: number;
  pesate: number;
  kgASettimana: number;
  tdeeStimato: number;
  scarto: number;
  affidabile: boolean;
  motivo: string;
}

/** Pendenza in kg/giorno con i minimi quadrati: usa tutte le pesate, non solo due. */
function pendenza(punti: { x: number; y: number }[]): number {
  const n = punti.length;
  const mx = punti.reduce((t, p) => t + p.x, 0) / n;
  const my = punti.reduce((t, p) => t + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of punti) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function stimaTdeeReale(
  pasti: MealEntry[],
  pesi: WeightEntry[],
  tdeeFormula: number,
  oggiK: string,
  giorni = 28,
): StimaTdee | null {
  const dentro = (d: string) => {
    const diff = giorniTra(d, oggiK);
    return diff >= 0 && diff < giorni;
  };

  const pastiPeriodo = pasti.filter((p) => dentro(p.data));
  const pesiPeriodo = pesi.filter((p) => dentro(p.data)).sort((a, b) => a.data.localeCompare(b.data));
  if (pastiPeriodo.length === 0 || pesiPeriodo.length < 2) return null;

  const perGiorno = new Map<string, number>();
  for (const p of pastiPeriodo) perGiorno.set(p.data, (perGiorno.get(p.data) ?? 0) + p.kcal);

  const giorniTracciati = perGiorno.size;
  const kcalMedie = Math.round(
    [...perGiorno.values()].reduce((a, b) => a + b, 0) / Math.max(1, giorniTracciati),
  );

  const arco = giorniTra(pesiPeriodo[0].data, pesiPeriodo[pesiPeriodo.length - 1].data);
  const kgAlGiorno = pendenza(
    pesiPeriodo.map((p) => ({ x: giorniTra(pesiPeriodo[0].data, p.data), y: p.pesoKg })),
  );

  const copertura = giorniTracciati / giorni;
  const tdeeStimato = Math.round(kcalMedie - kgAlGiorno * KCAL_PER_KG);

  let motivo = '';
  if (arco < 14) motivo = 'Servono almeno due settimane fra la prima e l’ultima pesata.';
  else if (copertura < 0.6)
    motivo = `Hai registrato i pasti in ${giorniTracciati} giorni su ${giorni}: troppi buchi perché la media regga.`;
  else if (pesiPeriodo.length < 4) motivo = 'Con meno di quattro pesate la tendenza è rumore.';
  else if (Math.abs(tdeeStimato - tdeeFormula) > tdeeFormula * 0.4)
    motivo = 'Il risultato è troppo distante dalla formula: probabilmente manca qualche pasto.';

  return {
    giorni,
    giorniTracciati,
    copertura,
    kcalMedie,
    pesate: pesiPeriodo.length,
    kgASettimana: +(kgAlGiorno * 7).toFixed(2),
    tdeeStimato,
    scarto: tdeeStimato - tdeeFormula,
    affidabile: motivo === '',
    motivo,
  };
}

export function commentoTdee(s: StimaTdee): string {
  if (!s.affidabile) return s.motivo;

  const verso = s.kgASettimana < -0.05 ? 'cali' : s.kgASettimana > 0.05 ? 'sali' : 'sei stabile';
  const ritmo =
    Math.abs(s.kgASettimana) < 0.05
      ? 'di peso'
      : `di ${Math.abs(s.kgASettimana).toFixed(2)} kg a settimana`;

  if (Math.abs(s.scarto) < 100) {
    return `Mangi ${s.kcalMedie} kcal al giorno e ${verso} ${ritmo}: la formula ci aveva preso, non c'è niente da correggere.`;
  }
  const direzione = s.scarto > 0 ? 'più alto' : 'più basso';
  return `Mangi ${s.kcalMedie} kcal al giorno e ${verso} ${ritmo}: il tuo fabbisogno reale è ${Math.abs(s.scarto)} kcal ${direzione} di quello che calcola la formula.`;
}
