import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  leggiDati,
  mediaKcalAttive,
  mediaPassi,
  statoHealth,
  type DatiHealth,
} from './health';

/**
 * Sincronizzazione automatica con Health Connect.
 *
 * Prima i dati arrivavano solo premendo "Sincronizza" nel profilo: chi apriva
 * l'app la mattina vedeva la giornata a zero e i numeri di ieri, perché erano
 * quelli dell'ultima volta che aveva premuto. Ora si aggiorna da sola
 * all'avvio e ogni volta che l'app torna in primo piano, con un intervallo
 * minimo per non interrogare Health Connect a ogni cambio di schermata.
 */

const INTERVALLO_MIN_MS = 15 * 60 * 1000;

let inCorso: Promise<DatiHealth | null> | null = null;

export async function sincronizzaSalute(forzata = false): Promise<DatiHealth | null> {
  // due chiamate ravvicinate (avvio + ritorno in primo piano) sono una sola
  if (inCorso) return inCorso;

  const s = useStore.getState();
  const ultima = s.health.ultimaSync ? Date.parse(s.health.ultimaSync) : 0;
  if (!forzata && Date.now() - ultima < INTERVALLO_MIN_MS) return null;

  inCorso = (async () => {
    try {
      const stato = await statoHealth();
      if (!stato.disponibile || stato.autorizzati.length === 0) return null;

      const dati = await leggiDati(14, useStore.getState().profile?.pesoKg ?? 75);
      const store = useStore.getState();
      store.setGiorniSalute(dati.giorni);
      store.setHealth({
        collegato: true,
        ultimaSync: new Date().toISOString(),
        passiMedi: mediaPassi(dati.giorni),
        kcalAttiveMedie: mediaKcalAttive(dati.giorni),
        fcRiposo: dati.fcRiposo,
      });
      return dati;
    } finally {
      inCorso = null;
    }
  })();

  return inCorso;
}

/** All'avvio e a ogni ritorno in primo piano. */
export function useAutoSyncSalute(attiva: boolean): void {
  useEffect(() => {
    if (!attiva) return;

    void sincronizzaSalute();

    const alRitorno = () => {
      if (document.visibilityState === 'visible') void sincronizzaSalute();
    };
    document.addEventListener('visibilitychange', alRitorno);
    return () => document.removeEventListener('visibilitychange', alRitorno);
  }, [attiva]);
}
