import type { VoceDiario } from '../store/useStore';
import { giorniTra } from './date';

/**
 * Come ti senti, in tre numeri al giorno.
 *
 * I carichi dicono se il recupero regge, ma lo dicono in ritardo: quando il
 * massimale scende, la fatica è lì da settimane. Energia, fame e dolori sono
 * grezzi ma arrivano prima, e in deficit sono il primo segnale che il blocco
 * sta durando troppo.
 */

export const SCALA = [1, 2, 3, 4, 5] as const;

export const ETICHETTE_DIARIO = {
  energia: { label: 'Energia', basso: 'a terra', alto: 'in forma' },
  fame: { label: 'Fame', basso: 'sazio', alto: 'fame costante' },
  dolori: { label: 'Dolori', basso: 'nessuno', alto: 'molto indolenzito' },
} as const;

export type CampoDiario = keyof typeof ETICHETTE_DIARIO;

export interface SegnaliSoggettivi {
  giorni: number;
  energiaMedia: number | null;
  fameMedia: number | null;
  doloriMedia: number | null;
}

function media(valori: number[]): number | null {
  if (valori.length === 0) return null;
  return +(valori.reduce((a, b) => a + b, 0) / valori.length).toFixed(1);
}

export function segnaliRecenti(
  diario: Record<string, VoceDiario>,
  oggiK: string,
  giorni = 14,
): SegnaliSoggettivi {
  const voci = Object.values(diario).filter((v) => {
    const d = giorniTra(v.data, oggiK);
    return d >= 0 && d < giorni;
  });

  return {
    giorni: voci.length,
    energiaMedia: media(voci.map((v) => v.energia)),
    fameMedia: media(voci.map((v) => v.fame)),
    doloriMedia: media(voci.map((v) => v.dolori)),
  };
}

/** Una riga sulle sensazioni, o niente se i giorni segnati sono troppo pochi. */
export function commentoSegnali(s: SegnaliSoggettivi): string {
  if (s.giorni < 4) return '';

  const parti: string[] = [];
  if (s.energiaMedia !== null && s.energiaMedia <= 2.4)
    parti.push(`energia ${s.energiaMedia}/5`);
  if (s.doloriMedia !== null && s.doloriMedia >= 3.5) parti.push(`dolori ${s.doloriMedia}/5`);
  if (s.fameMedia !== null && s.fameMedia >= 4) parti.push(`fame ${s.fameMedia}/5`);

  if (parti.length === 0) return '';
  return `Negli ultimi ${s.giorni} giorni segnati: ${parti.join(', ')}.`;
}
