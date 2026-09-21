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

/**
 * Le finestre partono dalla mezzanotte locale, non da "adesso meno n giorni".
 *
 * Health Connect raggruppa per giorno a partire dall'istante iniziale: con una
 * finestra che cominciava alle 10:47 i secchielli andavano dalle 10:47 alle
 * 10:47, e la roba di oggi finiva in quello etichettato ieri.
 */
const giorniFa = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

/**
 * Il giorno *locale* di un istante.
 *
 * Prima si tagliavano i primi dieci caratteri dell'ISO, che però è in UTC:
 * in Italia la mezzanotte locale è le 22:00 del giorno prima, quindi ogni
 * giornata veniva registrata sotto la data sbagliata.
 */
const giorno = (iso: string): string => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/**
 * Calorie bruciate camminando, quando il telefono conta i passi ma non le calorie.
 * Circa 0.0004-0.0005 kcal per passo per kg: per 80 kg fanno ~360 kcal ogni 10.000 passi.
 * È una stima al ribasso, e non va mai sommata alle calorie attive misurate,
 * che i passi li contengono già.
 */
export function kcalDaPassi(passi: number, pesoKg: number): number {
  return Math.round(passi * pesoKg * 0.00045);
}

/**
 * Calorie di movimento del giorno.
 *
 * Le misurate vincono su tutto: contengono già passi e allenamenti. Se mancano,
 * si prende la più grande fra la stima dai passi e le calorie delle sessioni
 * registrate da altre app — una passeggiata segnata dall'orologio è anche
 * passi, quindi sommarle le conterebbe due volte.
 */
export function kcalMovimento(g: GiornoSalute): number {
  if (g.kcalAttive > 0) return g.kcalAttive;
  return Math.max(g.kcalStimateDaPassi, g.kcalAllenamento);
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

interface Intervallo {
  da: number;
  a: number;
}

/** Unione di intervalli sovrapposti: la stessa notte contata una volta sola. */
function unisci(intervalli: Intervallo[]): Intervallo[] {
  const ordinati = [...intervalli].sort((x, y) => x.da - y.da);
  const out: Intervallo[] = [];
  for (const i of ordinati) {
    const ultimo = out[out.length - 1];
    if (ultimo && i.da <= ultimo.a) ultimo.a = Math.max(ultimo.a, i.a);
    else out.push({ ...i });
  }
  return out;
}

/** Toglie da `base` le parti coperte da `buchi` (le fasi di veglia). */
function sottrai(base: Intervallo[], buchi: Intervallo[]): Intervallo[] {
  let out = base;
  for (const b of unisci(buchi)) {
    const nuovo: Intervallo[] = [];
    for (const i of out) {
      if (b.a <= i.da || b.da >= i.a) {
        nuovo.push(i);
        continue;
      }
      if (b.da > i.da) nuovo.push({ da: i.da, a: b.da });
      if (b.a < i.a) nuovo.push({ da: b.a, a: i.a });
    }
    out = nuovo;
  }
  return out;
}

/**
 * Minuti di sonno per notte, attribuiti al giorno del risveglio.
 *
 * Chi registra il sonno con l'orologio spesso scrive sia la sessione intera sia
 * le singole fasi: sommandole verrebbero il doppio delle ore. Qui si uniscono
 * gli intervalli e poi si tolgono le fasi di veglia, così la sovrapposizione
 * non conta due volte.
 */
async function sonnoPerGiorno(giorni: number): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const { samples } = await Health.readSamples({
      dataType: 'sleep',
      startDate: giorniFa(giorni),
      endDate: new Date().toISOString(),
      ascending: true,
    });

    const dormito: Intervallo[] = [];
    const sveglio: Intervallo[] = [];
    for (const s of samples) {
      const da = new Date(s.startDate).getTime();
      const a = new Date(s.endDate).getTime();
      if (!(a > da)) continue;
      if (s.sleepState === 'awake') sveglio.push({ da, a });
      else dormito.push({ da, a });
    }

    for (const i of sottrai(unisci(dormito), sveglio)) {
      const minuti = (i.a - i.da) / 60000;
      // una "notte" più lunga di sedici ore è un dato sbagliato, non un sonnellino
      if (minuti <= 0 || minuti > 16 * 60) continue;
      const k = giorno(new Date(i.a).toISOString());
      out.set(k, (out.get(k) ?? 0) + minuti);
    }
  } catch {
    /* niente dati sul sonno */
  }
  return out;
}

/**
 * Calorie e minuti delle sessioni di allenamento registrate da altre app.
 *
 * Nota: Health Connect non ha un equivalente del "tempo in piedi" di Apple —
 * e' una metrica che l'Apple Watch calcola per conto suo e non esiste su
 * Android. Al suo posto usiamo i minuti di esercizio, che invece ci sono.
 */
async function allenamentiPerGiorno(
  giorni: number,
): Promise<Map<string, { kcal: number; minuti: number }>> {
  const out = new Map<string, { kcal: number; minuti: number }>();
  try {
    const { workouts } = await Health.queryWorkouts({
      startDate: giorniFa(giorni),
      endDate: new Date().toISOString(),
    });
    for (const w of workouts) {
      const k = giorno(w.endDate ?? w.startDate);
      const minuti =
        w.endDate && w.startDate
          ? (new Date(w.endDate).getTime() - new Date(w.startDate).getTime()) / 60000
          : 0;
      const prec = out.get(k) ?? { kcal: 0, minuti: 0 };
      out.set(k, {
        kcal: prec.kcal + (w.totalEnergyBurned ?? 0),
        minuti: prec.minuti + Math.max(0, Math.min(minuti, 8 * 60)),
      });
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
      minutiEsercizio: 0,
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
  for (const [k, v] of allenamenti) {
    const g = tocca(k);
    g.kcalAllenamento = Math.round(v.kcal);
    g.minutiEsercizio = Math.round(v.minuti);
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

export function mediaMinutiEsercizio(giorni: GiornoSalute[]): number | null {
  return media(giorni.map((g) => g.minutiEsercizio ?? 0));
}

export function fmtSonno(minuti: number): string {
  const h = Math.floor(minuti / 60);
  const m = Math.round(minuti % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
