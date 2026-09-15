import { Health } from '@capgo/capacitor-health';
import type { HealthDataType } from '@capgo/capacitor-health';
import type { GiornoSalute } from '../store/useStore';

/**
 * Ponte verso Health Connect (Android) e HealthKit (iOS).
 *
 * Nel browser non esiste nessuna delle due: ogni funzione degrada in modo
 * silenzioso e l'app continua a funzionare con i dati inseriti a mano.
 */

/** Dati che GymBro legge. Nient'altro viene richiesto. */
export const TIPI_LETTI: HealthDataType[] = ['weight', 'steps', 'calories', 'heartRate', 'sleep'];

export interface StatoHealth {
  disponibile: boolean;
  piattaforma: 'ios' | 'android' | 'web' | 'sconosciuta';
  motivo?: string;
  autorizzati: HealthDataType[];
  negati: HealthDataType[];
  storicoEsteso: boolean | null;
}

export interface DatiHealth {
  pesoKg: number | null;
  pesoData: string | null;
  pesoFonte: string | null;
  giorni: GiornoSalute[];
  fcRiposo: number | null;
}

const giorniFa = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const giorno = (iso: string) => iso.slice(0, 10);

/**
 * Calorie bruciate camminando, quando il telefono conta i passi ma non le calorie.
 * Circa 0.0004-0.0005 kcal per passo per kg: per 80 kg fanno ~360 kcal ogni 10.000 passi.
 * È una stima al ribasso, e non va mai sommata alle calorie attive misurate,
 * che i passi li contengono già.
 */
export function kcalDaPassi(passi: number, pesoKg: number): number {
  return Math.round(passi * pesoKg * 0.00045);
}

/** Calorie di movimento del giorno: le misurate se ci sono, altrimenti la stima. */
export function kcalMovimento(g: GiornoSalute): number {
  return g.kcalAttive > 0 ? g.kcalAttive : g.kcalStimateDaPassi;
}

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
      pesoKg: Math.round(s.value * 10) / 10,
      pesoData: giorno(s.endDate),
      pesoFonte: s.sourceName ?? s.deviceType ?? null,
    };
  } catch {
    return { pesoKg: null, pesoData: null, pesoFonte: null };
  }
}

async function sommaPerGiorno(dataType: HealthDataType, giorni: number) {
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

/** Minuti di sonno per notte, attribuiti al giorno del risveglio. */
async function sonnoPerGiorno(giorni: number): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const { samples } = await Health.readSamples({
      dataType: 'sleep',
      startDate: giorniFa(giorni),
      endDate: new Date().toISOString(),
      ascending: true,
    });
    for (const s of samples) {
      // le fasi "sveglio" dentro una sessione non contano come sonno
      if (s.sleepState === 'awake') continue;
      const minuti = (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 60000;
      if (minuti <= 0 || minuti > 16 * 60) continue;
      const k = giorno(s.endDate);
      out.set(k, (out.get(k) ?? 0) + minuti);
    }
  } catch {
    /* niente dati sul sonno */
  }
  return out;
}

/** Calorie delle sessioni di allenamento registrate da altre app. */
async function allenamentiPerGiorno(giorni: number): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const { workouts } = await Health.queryWorkouts({
      startDate: giorniFa(giorni),
      endDate: new Date().toISOString(),
    });
    for (const w of workouts) {
      const k = giorno(w.endDate ?? w.startDate);
      out.set(k, (out.get(k) ?? 0) + (w.totalEnergyBurned ?? 0));
    }
  } catch {
    /* niente sessioni registrate */
  }
  return out;
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

/** Legge peso, passi, calorie, sonno e allenamenti degli ultimi `giorni` giorni. */
export async function leggiDati(giorni = 14, pesoKg = 75): Promise<DatiHealth> {
  const [peso, passi, kcal, sonno, allenamenti, fc] = await Promise.all([
    ultimoPeso(),
    sommaPerGiorno('steps', giorni),
    sommaPerGiorno('calories', giorni),
    sonnoPerGiorno(giorni),
    allenamentiPerGiorno(giorni),
    frequenzaRiposo(),
  ]);

  const pesoRif = peso.pesoKg ?? pesoKg;
  const mappa = new Map<string, GiornoSalute>();

  const tocca = (k: string): GiornoSalute => {
    const g = mappa.get(k) ?? {
      data: k,
      passi: 0,
      kcalAttive: 0,
      kcalStimateDaPassi: 0,
      sonnoMin: 0,
      kcalAllenamento: 0,
    };
    mappa.set(k, g);
    return g;
  };

  for (const s of passi) {
    const g = tocca(giorno(s.startDate));
    g.passi = Math.round(s.value);
    g.kcalStimateDaPassi = kcalDaPassi(g.passi, pesoRif);
  }
  for (const s of kcal) tocca(giorno(s.startDate)).kcalAttive = Math.round(s.value);
  for (const [k, min] of sonno) tocca(k).sonnoMin = Math.round(min);
  for (const [k, v] of allenamenti) tocca(k).kcalAllenamento = Math.round(v);

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

function media(valori: number[]): number | null {
  const v = valori.filter((x) => x > 0);
  if (v.length === 0) return null;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

export function mediaKcalAttive(giorni: GiornoSalute[]): number | null {
  return media(giorni.map(kcalMovimento));
}

export function mediaPassi(giorni: GiornoSalute[]): number | null {
  return media(giorni.map((g) => g.passi));
}

export function mediaSonnoMin(giorni: GiornoSalute[]): number | null {
  return media(giorni.map((g) => g.sonnoMin));
}

export function fmtSonno(minuti: number): string {
  const h = Math.floor(minuti / 60);
  const m = Math.round(minuti % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
