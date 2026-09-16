import { addDays } from 'date-fns';
import type { MealEntry } from '../store/useStore';
import type { PlanDay, Profile, WeightEntry } from '../types';
import { macroTargets } from './nutrition';
import { giorniTra, inizioSettimana, key } from './date';

/**
 * Aderenza alla dieta, settimana per settimana.
 *
 * L'app registra i pasti e registra le pesate, ma finché i due dati restano
 * separati non rispondono alla domanda che conta: perché il peso non si muove
 * come previsto. Qui si incrociano.
 */

export interface GiornoAderenza {
  data: string;
  kcalAssunte: number;
  kcalTarget: number;
  /** differenza fra assunte e target: positiva = ha mangiato di più */
  scarto: number;
  registrato: boolean;
  allenamento: boolean;
  sgarri: number;
}

export interface SettimanaAderenza {
  giorni: GiornoAderenza[];
  giorniRegistrati: number;
  mediaAssunte: number | null;
  mediaTarget: number;
  scartoMedio: number | null;
  /** giorni entro il 10% dal target, sul totale dei giorni registrati */
  giorniInLinea: number;
  variazionePesoKg: number | null;
  attesaKg: number;
  commento: string;
  affidabile: boolean;
}

/** Media dei pesi registrati in una finestra, per smorzare le oscillazioni. */
function pesoMedio(pesi: WeightEntry[], da: string, a: string): number | null {
  const dentro = pesi.filter((p) => p.data >= da && p.data <= a);
  if (dentro.length === 0) return null;
  return dentro.reduce((t, p) => t + p.pesoKg, 0) / dentro.length;
}

export function analizzaSettimana(
  profile: Profile,
  tdee: number,
  pasti: MealEntry[],
  piano: Record<string, PlanDay>,
  pesi: WeightEntry[],
  offsetSettimane = 0,
): SettimanaAderenza {
  const lunedi = addDays(inizioSettimana(), offsetSettimane * 7);
  const giorni: GiornoAderenza[] = [];

  for (let i = 0; i < 7; i++) {
    const d = key(addDays(lunedi, i));
    const delGiorno = pasti.filter((p) => p.data === d);
    const allenamento = !!piano[d]?.workoutId;
    const kcalTarget = macroTargets(profile.obiettivo, profile.pesoKg, tdee, allenamento).kcal;
    const kcalAssunte = delGiorno.reduce((t, p) => t + p.kcal, 0);

    giorni.push({
      data: d,
      kcalAssunte,
      kcalTarget,
      scarto: kcalAssunte - kcalTarget,
      registrato: delGiorno.length > 0,
      allenamento,
      sgarri: delGiorno.filter((p) => p.tipo === 'sgarro').length,
    });
  }

  const registrati = giorni.filter((g) => g.registrato);
  const mediaTarget = Math.round(giorni.reduce((t, g) => t + g.kcalTarget, 0) / 7);
  const mediaAssunte = registrati.length
    ? Math.round(registrati.reduce((t, g) => t + g.kcalAssunte, 0) / registrati.length)
    : null;
  const scartoMedio = mediaAssunte === null ? null : mediaAssunte - mediaTarget;
  const giorniInLinea = registrati.filter(
    (g) => Math.abs(g.scarto) <= g.kcalTarget * 0.1,
  ).length;

  // variazione di peso: media della prima meta' contro media della seconda,
  // meno sensibile al singolo giorno storto di un confronto punto a punto
  const inizio = key(lunedi);
  const meta = key(addDays(lunedi, 3));
  const fine = key(addDays(lunedi, 6));
  const pesoPrima = pesoMedio(pesi, inizio, meta);
  const pesoDopo = pesoMedio(pesi, key(addDays(lunedi, 4)), fine);
  const variazionePesoKg =
    pesoPrima !== null && pesoDopo !== null ? +(pesoDopo - pesoPrima).toFixed(2) : null;

  // quanto ci si aspettava, dal solo scostamento fra target e fabbisogno
  const attesaKg = +(((mediaTarget - tdee) * 7) / 7700).toFixed(2);

  const affidabile = registrati.length >= 4;

  return {
    giorni,
    giorniRegistrati: registrati.length,
    mediaAssunte,
    mediaTarget,
    scartoMedio,
    giorniInLinea,
    variazionePesoKg,
    attesaKg,
    affidabile,
    commento: componiCommento({
      registrati: registrati.length,
      mediaAssunte,
      mediaTarget,
      scartoMedio,
      variazionePesoKg,
      attesaKg,
      sgarri: giorni.reduce((t, g) => t + g.sgarri, 0),
    }),
  };
}

function componiCommento(d: {
  registrati: number;
  mediaAssunte: number | null;
  mediaTarget: number;
  scartoMedio: number | null;
  variazionePesoKg: number | null;
  attesaKg: number;
  sgarri: number;
}): string {
  if (d.registrati === 0) return 'Nessun pasto registrato questa settimana: non c’è niente da confrontare.';
  if (d.registrati < 4)
    return `Solo ${d.registrati} giorni su 7 registrati: troppo pochi per dire qualcosa di sensato. Il diario mezzo vuoto fa sembrare che tu abbia mangiato meno di quanto hai mangiato.`;

  const s = d.scartoMedio ?? 0;
  const pezzi: string[] = [];

  if (Math.abs(s) <= 100) {
    pezzi.push(`Hai centrato il target: ${d.mediaAssunte} kcal di media contro ${d.mediaTarget}.`);
  } else {
    pezzi.push(
      `In media ${d.mediaAssunte} kcal al giorno contro ${d.mediaTarget} di target, ${s > 0 ? '+' : ''}${s} kcal.`,
    );
  }

  if (d.variazionePesoKg !== null) {
    const v = d.variazionePesoKg;
    const atteso = d.attesaKg;
    const differenza = v - atteso;
    pezzi.push(
      `Il peso è ${v === 0 ? 'rimasto fermo' : v < 0 ? `sceso di ${Math.abs(v)} kg` : `salito di ${v} kg`}, contro ${atteso === 0 ? 'nessuna variazione attesa' : `i ${Math.abs(atteso)} kg ${atteso < 0 ? 'di calo' : 'di crescita'} attesi`}.`,
    );

    if (Math.abs(differenza) > 0.4 && Math.abs(s) <= 150) {
      pezzi.push(
        differenza > 0
          ? 'Hai mangiato quanto previsto ma il peso non segue: una settimana sola non basta a dirlo, se si ripete abbassa il fabbisogno stimato nel profilo.'
          : 'Il calo è più rapido del previsto: normale nella prima settimana per via del glicogeno e dell’acqua.',
      );
    } else if (s > 150 && v >= 0) {
      pezzi.push('Il peso fermo si spiega da sé: il deficit non c’è stato.');
    }
  } else {
    pezzi.push('Servono almeno due pesate nella settimana per collegare la dieta al risultato.');
  }

  if (d.sgarri > 0) {
    pezzi.push(
      d.sgarri === 1
        ? 'Uno sgarro registrato: è già nei conti qui sopra.'
        : `${d.sgarri} sgarri registrati: sono già nei conti qui sopra.`,
    );
  }

  return pezzi.join(' ');
}

/** Etichetta leggibile della settimana, es. "settimana corrente" o "2 settimane fa". */
export function etichettaSettimana(offset: number): string {
  if (offset === 0) return 'Settimana corrente';
  if (offset === -1) return 'Settimana scorsa';
  return `${Math.abs(offset)} settimane fa`;
}

/** Quante settimane indietro ha senso mostrare, in base ai dati presenti. */
export function settimaneDisponibili(pasti: MealEntry[]): number {
  if (pasti.length === 0) return 1;
  const piuVecchio = pasti.reduce((m, p) => (p.data < m ? p.data : m), pasti[0].data);
  return Math.min(8, Math.max(1, Math.ceil(giorniTra(piuVecchio, key(new Date())) / 7) + 1));
}
