import type { SessionLog } from '../types';
import type { MuscleGroup } from '../data/exercises';
import { esercizio } from './catalog';
import { giorniTra, oggi } from './date';

/**
 * Serie settimanali per gruppo muscolare.
 *
 * Conta 1 serie al muscolo primario dell'esercizio e mezza serie a quelli
 * secondari: in una panca piana il petto lavora molto più dei tricipiti, ma
 * ignorarli del tutto sottostima il carico sulle braccia.
 *
 * Il riferimento di 10-20 serie settimanali per gruppo viene dalla letteratura
 * sull'ipertrofia (Schoenfeld e colleghi): sotto le 10 si cresce poco, sopra le
 * 20 il ritorno cala e il recupero diventa il limite. In definizione basta stare
 * nella parte bassa: lì si mantiene, non si costruisce.
 */

export const MIN_SERIE = 10;
export const MAX_SERIE = 20;

export interface VolumeGruppo {
  gruppo: MuscleGroup;
  serie: number;
  /** quante sedute hanno toccato questo gruppo */
  sedute: number;
}

const ORDINE: MuscleGroup[] = [
  'petto',
  'schiena',
  'spalle',
  'bicipiti',
  'tricipiti',
  'quadricipiti',
  'femorali',
  'glutei',
  'polpacci',
  'core',
  'avambracci',
  'full-body',
];

export function volumePerGruppo(sessioni: SessionLog[], giorni = 7): VolumeGruppo[] {
  const conteggio = new Map<MuscleGroup, number>();
  const sedute = new Map<MuscleGroup, Set<string>>();
  const oggiK = oggi();

  for (const s of sessioni) {
    if (giorniTra(s.data, oggiK) >= giorni) continue;
    for (const ex of s.esercizi) {
      const info = esercizio(ex.exerciseId);
      if (!info || info.tipo === 'cardio') continue;
      const fatte = ex.serie.filter((x) => x.fatto).length;
      if (fatte === 0) continue;

      info.gruppi.forEach((g, i) => {
        const peso = i === 0 ? 1 : 0.5;
        conteggio.set(g, (conteggio.get(g) ?? 0) + fatte * peso);
        const set = sedute.get(g) ?? new Set<string>();
        set.add(s.id);
        sedute.set(g, set);
      });
    }
  }

  return ORDINE.filter((g) => g !== 'full-body').map((gruppo) => ({
    gruppo,
    serie: Math.round((conteggio.get(gruppo) ?? 0) * 10) / 10,
    sedute: sedute.get(gruppo)?.size ?? 0,
  }));
}

export type StatoVolume = 'scarso' | 'giusto' | 'alto' | 'nullo';

export function statoVolume(serie: number): StatoVolume {
  if (serie === 0) return 'nullo';
  if (serie < MIN_SERIE) return 'scarso';
  if (serie > MAX_SERIE) return 'alto';
  return 'giusto';
}

export const COLORE_VOLUME: Record<StatoVolume, string> = {
  nullo: 'bg-line2',
  scarso: 'bg-carb',
  giusto: 'bg-brand-500',
  alto: 'bg-fat',
};

/** Una frase su cosa c'è da sistemare, o niente se il quadro è a posto. */
export function commentoVolume(v: VolumeGruppo[]): string | null {
  const allenati = v.filter((x) => x.serie > 0);
  if (allenati.length === 0) return null;

  const trascurati = v.filter((x) => x.serie > 0 && x.serie < MIN_SERIE).map((x) => x.gruppo);
  const mai = v.filter((x) => x.serie === 0).map((x) => x.gruppo);
  const eccessivi = v.filter((x) => x.serie > MAX_SERIE).map((x) => x.gruppo);

  const pezzi: string[] = [];
  if (mai.length > 0 && mai.length <= 4) pezzi.push(`niente per ${mai.join(', ')}`);
  if (trascurati.length > 0 && trascurati.length <= 4)
    pezzi.push(`sotto le ${MIN_SERIE} serie su ${trascurati.join(', ')}`);
  if (eccessivi.length > 0) pezzi.push(`oltre le ${MAX_SERIE} su ${eccessivi.join(', ')}`);

  if (pezzi.length === 0) return 'Volume distribuito bene su tutti i gruppi.';
  return `Questa settimana: ${pezzi.join('; ')}.`;
}
