import { Health } from '@capgo/capacitor-health';
import type { HealthDataType } from '@capgo/capacitor-health';

/**
 * Ponte verso Health Connect (Android) e HealthKit (iOS).
 *
 * Nel browser non esiste nessuna delle due: ogni funzione degrada in modo
 * silenzioso e l'app continua a funzionare con i dati inseriti a mano.
 */

/** Dati che GymBro legge. Nient'altro viene richiesto. */
export const TIPI_LETTI: HealthDataType[] = ['weight', 'steps', 'calories', 'heartRate'];

export interface StatoHealth {
  disponibile: boolean;
  piattaforma: 'ios' | 'android' | 'web' | 'sconosciuta';
  motivo?: string;
  autorizzati: HealthDataType[];
  negati: HealthDataType[];
  storicoEsteso: boolean | null;
}

export interface GiornoAttivita {
  data: string; // yyyy-MM-dd
  passi: number;
  kcalAttive: number;
}

export interface DatiHealth {
  pesoKg: number | null;
  pesoData: string | null;
  pesoFonte: string | null;
  giorni: GiornoAttivita[];
  fcRiposo: number | null;
}

const giorniFa = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export async function statoHealth(): Promise<StatoHealth> {
  try {
    const disp = await Health.isAvailable();
    if (!disp.available) {
      return {
        disponibile: false,
        piattaforma: disp.platform ?? 'sconosciuta',
        motivo: disp.reason,
        autorizzati: [],
        negati: [],
        storicoEsteso: null,
      };
    }
    const auth = await Health.checkAuthorization({ read: TIPI_LETTI });
    return {
      disponibile: true,
      piattaforma: disp.platform ?? 'sconosciuta',
      autorizzati: auth.readAuthorized,
      negati: auth.readDenied,
      storicoEsteso: auth.historyAccessAuthorized ?? null,
    };
  } catch (e) {
    return {
      disponibile: false,
      piattaforma: 'web',
      motivo: e instanceof Error ? e.message : String(e),
      autorizzati: [],
      negati: [],
      storicoEsteso: null,
    };
  }
}

/** Apre il foglio dei permessi di Health Connect. Va chiamato da un gesto dell'utente. */
export async function chiediPermessi(): Promise<StatoHealth> {
  try {
    const auth = await Health.requestAuthorization({
      read: TIPI_LETTI,
      // senza questo permesso Health Connect restituisce solo gli ultimi 30 giorni
      requestHistoryAccess: true,
    });
    const disp = await Health.isAvailable();
    return {
      disponibile: disp.available,
      piattaforma: disp.platform ?? 'sconosciuta',
      autorizzati: auth.readAuthorized,
      negati: auth.readDenied,
      storicoEsteso: auth.historyAccessAuthorized ?? null,
    };
  } catch (e) {
    return {
      disponibile: false,
      piattaforma: 'sconosciuta',
      motivo: e instanceof Error ? e.message : String(e),
      autorizzati: [],
      negati: [],
      storicoEsteso: null,
    };
  }
}

async function ultimoPeso(): Promise<Pick<DatiHealth, 'pesoKg' | 'pesoData' | 'pesoFonte'>> {
  try {
    const { samples } = await Health.readSamples({
      dataType: 'weight',
      startDate: giorniFa(365),
      endDate: new Date().toISOString(),
      limit: 1,
      ascending: false,
    });
    const s = samples[0];
    if (!s) return { pesoKg: null, pesoData: null, pesoFonte: null };
    return {
      pesoKg: s.unit === 'kilogram' ? Math.round(s.value * 10) / 10 : Math.round(s.value * 10) / 10,
      pesoData: s.endDate.slice(0, 10),
      pesoFonte: s.sourceName ?? s.deviceType ?? null,
    };
  } catch {
    return { pesoKg: null, pesoData: null, pesoFonte: null };
  }
}

async function aggregatoGiornaliero(dataType: HealthDataType, giorni: number) {
  try {
    const { samples } = await Health.queryAggregated({
      dataType,
      startDate: giorniFa(giorni),
      endDate: new Date().toISOString(),
      bucket: 'day',
      aggregation: 'sum',
    });
    return samples;
  } catch {
    return [];
  }
}

async function frequenzaRiposo(): Promise<number | null> {
  try {
    const { samples } = await Health.queryAggregated({
      dataType: 'heartRate',
      startDate: giorniFa(7),
      endDate: new Date().toISOString(),
      bucket: 'day',
      aggregation: 'min',
    });
    const valori = samples.map((s) => s.value).filter((v) => v > 20);
    if (valori.length === 0) return null;
    return Math.round(valori.reduce((a, b) => a + b, 0) / valori.length);
  } catch {
    return null;
  }
}

/** Legge peso, passi e calorie attive degli ultimi `giorni` giorni. */
export async function leggiDati(giorni = 7): Promise<DatiHealth> {
  const [peso, passi, kcal, fc] = await Promise.all([
    ultimoPeso(),
    aggregatoGiornaliero('steps', giorni),
    aggregatoGiornaliero('calories', giorni),
    frequenzaRiposo(),
  ]);

  const mappa = new Map<string, GiornoAttivita>();
  for (const s of passi) {
    const d = s.startDate.slice(0, 10);
    mappa.set(d, { data: d, passi: Math.round(s.value), kcalAttive: 0 });
  }
  for (const s of kcal) {
    const d = s.startDate.slice(0, 10);
    const g = mappa.get(d) ?? { data: d, passi: 0, kcalAttive: 0 };
    g.kcalAttive = Math.round(s.value);
    mappa.set(d, g);
  }

  return {
    ...peso,
    fcRiposo: fc,
    giorni: [...mappa.values()].sort((a, b) => a.data.localeCompare(b.data)),
  };
}

export async function apriImpostazioni(): Promise<void> {
  try {
    await Health.openHealthConnectSettings();
  } catch {
    /* non disponibile su questa piattaforma */
  }
}

export async function apriInformativa(): Promise<void> {
  try {
    await Health.showPrivacyPolicy();
  } catch {
    /* non disponibile su questa piattaforma */
  }
}

/** Media delle calorie attive giornaliere: utile per confrontarla col TDEE stimato. */
export function mediaKcalAttive(giorni: GiornoAttivita[]): number | null {
  const validi = giorni.filter((g) => g.kcalAttive > 0);
  if (validi.length === 0) return null;
  return Math.round(validi.reduce((t, g) => t + g.kcalAttive, 0) / validi.length);
}

export function mediaPassi(giorni: GiornoAttivita[]): number | null {
  const validi = giorni.filter((g) => g.passi > 0);
  if (validi.length === 0) return null;
  return Math.round(validi.reduce((t, g) => t + g.passi, 0) / validi.length);
}
