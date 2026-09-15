import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Promemoria locali. Niente server e niente push: sono sveglie programmate sul
 * telefono, quindi funzionano anche offline e non escono dal dispositivo.
 *
 * Nel browser non esistono: ogni funzione degrada in silenzio.
 */

export interface ImpostazioniNotifiche {
  attive: boolean;
  /** ora dell'allenamento, formato HH:mm */
  oraAllenamento: string;
  /** minuti prima dell'allenamento per la caffeina */
  anticipoCaffeina: number;
  preAllenamento: boolean;
  caffeina: boolean;
  pesata: boolean;
  oraPesata: string;
  integratoriSera: boolean;
  oraSera: string;
}

export const NOTIFICHE_DEFAULT: ImpostazioniNotifiche = {
  attive: false,
  oraAllenamento: '06:30',
  anticipoCaffeina: 40,
  preAllenamento: true,
  caffeina: true,
  pesata: true,
  oraPesata: '07:00',
  integratoriSera: true,
  oraSera: '22:00',
};

const ID = { caffeina: 101, allenamento: 102, pesata: 103, sera: 104 };

function orario(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return { hour: Number.isFinite(h) ? h : 7, minute: Number.isFinite(m) ? m : 0 };
}

function sottrai(hhmm: string, minuti: number): string {
  const { hour, minute } = orario(hhmm);
  let tot = hour * 60 + minute - minuti;
  while (tot < 0) tot += 1440;
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
}

export async function disponibili(): Promise<boolean> {
  try {
    const s = await LocalNotifications.checkPermissions();
    return s.display !== 'denied';
  } catch {
    return false;
  }
}

export async function chiediPermesso(): Promise<boolean> {
  try {
    const s = await LocalNotifications.requestPermissions();
    return s.display === 'granted';
  } catch {
    return false;
  }
}

async function pulisci(): Promise<void> {
  try {
    const { notifications } = await LocalNotifications.getPending();
    const nostre = notifications.filter((n) => Object.values(ID).includes(n.id));
    if (nostre.length > 0) await LocalNotifications.cancel({ notifications: nostre });
  } catch {
    /* niente da cancellare */
  }
}

/** Riprogramma tutte le notifiche secondo le impostazioni correnti. */
export async function riprogramma(i: ImpostazioniNotifiche): Promise<boolean> {
  await pulisci();
  if (!i.attive) return true;

  const voci: { id: number; title: string; body: string; ora: string }[] = [];

  if (i.caffeina) {
    voci.push({
      id: ID.caffeina,
      title: 'Caffeina',
      body: `Prendila ora: fa effetto fra ${i.anticipoCaffeina} minuti, quando inizi.`,
      ora: sottrai(i.oraAllenamento, i.anticipoCaffeina),
    });
  }
  if (i.preAllenamento) {
    voci.push({
      id: ID.allenamento,
      title: 'Allenamento',
      body: 'È ora. Apri GymBro per la scheda di oggi.',
      ora: i.oraAllenamento,
    });
  }
  if (i.pesata) {
    voci.push({
      id: ID.pesata,
      title: 'Pesati',
      body: 'A digiuno e dopo il bagno: sempre nelle stesse condizioni.',
      ora: i.oraPesata,
    });
  }
  if (i.integratoriSera) {
    voci.push({
      id: ID.sera,
      title: 'Magnesio',
      body: 'Ultimo integratore della giornata.',
      ora: i.oraSera,
    });
  }

  try {
    await LocalNotifications.schedule({
      notifications: voci.map((v) => ({
        id: v.id,
        title: v.title,
        body: v.body,
        schedule: { on: orario(v.ora), allowWhileIdle: true, repeats: true },
      })),
    });
    return true;
  } catch {
    return false;
  }
}

/** Orario in cui partirà il promemoria della caffeina, per mostrarlo nelle impostazioni. */
export function oraCaffeina(i: ImpostazioniNotifiche): string {
  return sottrai(i.oraAllenamento, i.anticipoCaffeina);
}
