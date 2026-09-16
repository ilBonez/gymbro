import type { SessionLog } from '../types';
import type { Goal } from '../data/programs';
import { esercizio } from './catalog';
import { storicoEsercizio } from './progressione';
import { giorniTra, oggi } from './date';

/**
 * Quando serve una settimana di scarico.
 *
 * L'avviso sul low carb guarda il calendario: "sei in deficit da sei settimane".
 * Questo guarda invece le prove, cioè il massimale stimato dei fondamentali. Se
 * su piu' esercizi e' fermo o sta scendendo, il corpo sta dicendo che il
 * recupero non tiene il passo, e in definizione e' esattamente il segnale per
 * cui il blocco va chiuso.
 *
 * Servono almeno tre settimane di dati: sotto, il rumore di una singola brutta
 * giornata conta piu' della tendenza.
 */

export interface AndamentoEsercizio {
  exerciseId: string;
  nome: string;
  /** variazione del massimale stimato nel periodo, in kg */
  variazione: number;
  variazionePct: number;
  sedute: number;
  primaData: string;
  ultimaData: string;
}

export type EsitoDeload = 'ok' | 'stallo' | 'calo' | 'dati-insufficienti';

export interface SegnaleDeload {
  esito: EsitoDeload;
  titolo: string;
  messaggio: string;
  fermi: AndamentoEsercizio[];
  inCalo: AndamentoEsercizio[];
  inCrescita: AndamentoEsercizio[];
  settimaneAnalizzate: number;
}

const GIORNI_FINESTRA = 28;
const SEDUTE_MINIME = 3;
/** sotto l'1% di variazione un esercizio si considera fermo, non in crescita */
const SOGLIA_STALLO = 0.01;

/** Andamento del massimale stimato di ogni esercizio nell'ultima finestra. */
export function andamenti(sessioni: SessionLog[], giorni = GIORNI_FINESTRA): AndamentoEsercizio[] {
  const oggiK = oggi();
  const recenti = sessioni.filter((s) => giorniTra(s.data, oggiK) <= giorni);
  const ids = new Set(recenti.flatMap((s) => s.esercizi.map((e) => e.exerciseId)));

  const out: AndamentoEsercizio[] = [];
  for (const id of ids) {
    const info = esercizio(id);
    // il cardio e gli isolamenti leggeri non dicono niente sul recupero generale
    if (!info || info.tipo !== 'composto') continue;

    const punti = storicoEsercizio(recenti, id);
    if (punti.length < SEDUTE_MINIME) continue;

    const primo = punti[0];
    const ultimo = punti[punti.length - 1];
    if (giorniTra(primo.data, ultimo.data) < 14) continue;

    const variazione = +(ultimo.stima - primo.stima).toFixed(1);
    out.push({
      exerciseId: id,
      nome: info.nome,
      variazione,
      variazionePct: primo.stima > 0 ? variazione / primo.stima : 0,
      sedute: punti.length,
      primaData: primo.data,
      ultimaData: ultimo.data,
    });
  }
  return out.sort((a, b) => a.variazionePct - b.variazionePct);
}

export function valutaDeload(sessioni: SessionLog[], goal: Goal): SegnaleDeload {
  const lista = andamenti(sessioni);
  const settimaneAnalizzate = Math.round(GIORNI_FINESTRA / 7);

  const base = {
    fermi: lista.filter((a) => Math.abs(a.variazionePct) < SOGLIA_STALLO),
    inCalo: lista.filter((a) => a.variazionePct <= -SOGLIA_STALLO),
    inCrescita: lista.filter((a) => a.variazionePct > SOGLIA_STALLO),
    settimaneAnalizzate,
  };

  if (lista.length < 2) {
    return {
      ...base,
      esito: 'dati-insufficienti',
      titolo: 'Ancora pochi dati',
      messaggio:
        'Servono almeno due esercizi multiarticolari con tre sedute registrate nelle ultime quattro settimane. Continua a segnare i carichi e qui comparirà l’andamento.',
    };
  }

  const nomi = (a: AndamentoEsercizio[]) => a.map((x) => x.nome.toLowerCase()).join(', ');

  // un singolo fondamentale che perde piu' del 3% non e' rumore: vale quanto
  // due esercizi appena sotto la soglia
  const caloMarcato = base.inCalo.some((a) => a.variazionePct <= -0.03);

  if (base.inCalo.length >= 2 || caloMarcato) {
    return {
      ...base,
      esito: 'calo',
      titolo: 'I carichi stanno scendendo',
      messaggio:
        (base.inCalo.length === 1
          ? `Il massimale stimato è calato del ${Math.abs(Math.round(base.inCalo[0].variazionePct * 100))}% su ${base.inCalo[0].nome.toLowerCase()}. `
          : `Il massimale stimato è calato su ${base.inCalo.length} esercizi (${nomi(base.inCalo)}). `) +
        (goal === 'definizione'
          ? 'In definizione questo è il segnale per chiudere il blocco: perdere forza sui fondamentali significa che stai perdendo anche massa magra, non solo grasso. Passa a mantenimento per due settimane.'
          : 'Un calo su più sedute non è una brutta giornata. Fai una settimana di scarico: stessi carichi, metà delle serie.'),
    };
  }

  if (base.fermi.length + base.inCalo.length >= 2 && base.inCrescita.length === 0) {
    return {
      ...base,
      esito: 'stallo',
      titolo: 'Progressione ferma',
      messaggio:
        `Nessun fondamentale è salito nelle ultime ${settimaneAnalizzate} settimane (${nomi([...base.fermi, ...base.inCalo])}). ` +
        (base.inCalo.length > 0
          ? 'Uno sta già scendendo, ma di poco: tienilo d’occhio la prossima settimana. '
          : '') +
        (goal === 'definizione'
          ? 'In deficit mantenere i carichi è già un buon risultato: il segnale di stop arriva quando iniziano a scendere davvero.'
          : 'Prima di cambiare programma prova una settimana di scarico: spesso lo stallo è fatica accumulata, non mancanza di stimolo. Controlla anche sonno e calorie.'),
    };
  }

  return {
    ...base,
    esito: 'ok',
    titolo: 'Progressione in corso',
    messaggio:
      `${base.inCrescita.length === 1 ? 'Un fondamentale è salito' : `${base.inCrescita.length} fondamentali sono saliti`} nelle ultime ${settimaneAnalizzate} settimane (${nomi(base.inCrescita)}). Continua così: il deload si fa quando serve, non a calendario.`,
  };
}
