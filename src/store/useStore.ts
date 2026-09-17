import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays } from 'date-fns';
import type {
  LoggedExercise,
  PlanDay,
  Profile,
  SessionLog,
  ShoppingItem,
  WeightEntry,
} from '../types';
import type { ModalitaCardio, WorkoutTemplate } from '../data/programs';
import type { Meal, Recipe } from '../data/recipes';
import { programma, registraRicetteMie, registraSchedeMie } from '../lib/catalog';
import { key } from '../lib/date';
import { STACK_MATTINA_PRESTO } from '../data/supplements';
import type { Tema } from '../lib/theme';
import { NOTIFICHE_DEFAULT } from '../lib/notifiche';
import type { ImpostazioniNotifiche } from '../lib/notifiche';

export interface StatoSync {
  collegato: boolean;
  ultimaSync: string | null;   // ISO
  passiMedi: number | null;
  kcalAttiveMedie: number | null;
  fcRiposo: number | null;
}

export interface MealEntry {
  id: string;
  data: string;
  momento: Meal;
  recipeId?: string;
  nome: string;
  porzioni: number;
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
  /** 'sgarro' = pasto fuori piano, contato ma segnalato a parte. */
  tipo?: 'normale' | 'sgarro';
}

/** Riepilogo di una giornata letto da Health Connect e messo da parte. */
export interface GiornoSalute {
  data: string;            // yyyy-MM-dd
  passi: number;
  kcalAttive: number;      // misurate; 0 se il telefono non le registra
  kcalStimateDaPassi: number;
  sonnoMin: number;
  kcalAllenamento: number; // da sessioni di esercizio registrate su Health Connect
  /** minuti di esercizio registrati: il posto che su iPhone occupa il tempo in piedi */
  minutiEsercizio?: number;
}

/** Una seduta di cardio registrata a mano: il cardio non passa dalla sessione pesi. */
export interface SessioneCardio {
  id: string;
  data: string;
  modalita: ModalitaCardio;
  minuti: number;
  kcal: number;
  /** vero se le calorie le hai scritte tu invece di lasciarle stimare dal MET */
  kcalAMano?: boolean;
  fcMedia?: number;
  note?: string;
}

/** Come ti sei sentito quel giorno, da 1 a 5. */
export interface VoceDiario {
  data: string;
  energia: number;
  fame: number;
  dolori: number;
  note?: string;
}

export interface ObiettiviAttivita {
  kcal: number;
  passi: number;
  sonnoOre: number;
  minutiEsercizio: number;
}

export interface Playlist {
  nome: string;
  url: string;
}

interface State {
  profile: Profile | null;
  pesi: WeightEntry[];
  piano: Record<string, PlanDay>;
  sessioni: SessionLog[];
  sessioniCardio: SessioneCardio[];
  sessioneAttiva: SessionLog | null;
  spesa: ShoppingItem[];
  integratoriAttivi: string[];
  logIntegratori: Record<string, boolean>;
  pasti: MealEntry[];
  /** ricette scritte dall'utente: stessa forma di quelle del ricettario */
  ricetteMie: Recipe[];
  /** schede scritte dall'utente: stanno nel programma finto 'mie-schede' */
  schedeMie: WorkoutTemplate[];
  preferiti: string[];
  onboardingFatto: boolean;
  health: StatoSync;
  giorniSalute: Record<string, GiornoSalute>;
  /** diario delle sensazioni, una voce per giorno */
  diario: Record<string, VoceDiario>;
  obiettiviAttivita: ObiettiviAttivita;
  /** playlist Spotify: chiave = id della scheda, oppure 'default' */
  playlist: Record<string, Playlist>;
  tema: Tema;
  notifiche: ImpostazioniNotifiche;

  setProfile: (p: Profile) => void;
  aggiornaProfilo: (patch: Partial<Profile>) => void;
  completaOnboarding: () => void;
  resetTutto: () => void;

  addPeso: (e: Omit<WeightEntry, 'id'>) => void;
  removePeso: (id: string) => void;

  setGiorno: (d: PlanDay) => void;
  svuotaGiorno: (data: string) => void;
  applicaProgramma: (
    programId: string,
    dataInizio: string,
    settimane: number,
    soloFeriali?: boolean,
  ) => void;
  svuotaPiano: () => void;

  iniziaSessione: (programId: string, workoutId: string, esercizi: LoggedExercise[]) => void;
  aggiornaSerie: (
    exIdx: number,
    setIdx: number,
    patch: Partial<{ reps: number | null; kg: number | null; fatto: boolean }>,
  ) => void;
  aggiungiSerie: (exIdx: number) => void;
  sostituisciEsercizio: (exIdx: number, nuovoId: string) => void;
  notaEsercizio: (exIdx: number, nota: string) => void;
  concludiSessione: (durataSec: number, nota?: string) => void;
  annullaSessione: () => void;

  addCardio: (c: Omit<SessioneCardio, 'id'>) => void;
  removeCardio: (id: string) => void;

  addSpesa: (i: Omit<ShoppingItem, 'id'>) => void;
  toggleSpesa: (id: string) => void;
  removeSpesa: (id: string) => void;
  svuotaSpesa: (soloPresi?: boolean) => void;
  aggiungiListaSpesa: (items: Omit<ShoppingItem, 'id'>[]) => number;

  toggleIntegratore: (id: string) => void;
  segnaIntegratore: (data: string, id: string, preso: boolean) => void;

  addPasto: (m: Omit<MealEntry, 'id'>) => void;
  removePasto: (id: string) => void;
  /** ricopia i pasti di un giorno su un altro; ritorna quanti ne ha copiati */
  copiaPasti: (daData: string, aData: string) => number;

  /** salva una ricetta nuova o ne aggiorna una esistente; ritorna l'id */
  salvaRicetta: (r: Omit<Recipe, 'id'> & { id?: string }) => string;
  eliminaRicetta: (id: string) => void;

  /** salva una scheda nuova o ne aggiorna una esistente; ritorna l'id */
  salvaScheda: (w: Omit<WorkoutTemplate, 'id'> & { id?: string }) => string;
  eliminaScheda: (id: string) => void;

  togglePreferito: (exerciseId: string) => void;
  setHealth: (patch: Partial<StatoSync>) => void;
  setGiorniSalute: (giorni: GiornoSalute[]) => void;
  setObiettiviAttivita: (patch: Partial<ObiettiviAttivita>) => void;
  setDiario: (data: string, patch: Partial<Omit<VoceDiario, 'data'>>) => void;
  setPlaylist: (chiave: string, p: Playlist | null) => void;
  setTema: (t: Tema) => void;
  setNotifiche: (patch: Partial<ImpostazioniNotifiche>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: null,
      pesi: [],
      piano: {},
      sessioni: [],
      sessioniCardio: [],
      sessioneAttiva: null,
      spesa: [],
      integratoriAttivi: STACK_MATTINA_PRESTO,
      logIntegratori: {},
      pasti: [],
      ricetteMie: [],
      schedeMie: [],
      preferiti: [],
      onboardingFatto: false,
      health: {
        collegato: false,
        ultimaSync: null,
        passiMedi: null,
        kcalAttiveMedie: null,
        fcRiposo: null,
      },
      giorniSalute: {},
      diario: {},
      obiettiviAttivita: { kcal: 500, passi: 9000, sonnoOre: 7.5, minutiEsercizio: 45 },
      playlist: {},
      tema: 'sistema',
      notifiche: NOTIFICHE_DEFAULT,

      setProfile: (p) =>
        set((s) => ({
          profile: p,
          pesi:
            s.pesi.length === 0
              ? [{ id: uid(), data: key(new Date()), pesoKg: p.pesoKg }]
              : s.pesi,
        })),

      aggiornaProfilo: (patch) =>
        set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : {})),

      completaOnboarding: () => set({ onboardingFatto: true }),

      resetTutto: () =>
        set({
          profile: null,
          pesi: [],
          piano: {},
          sessioni: [],
          sessioniCardio: [],
          sessioneAttiva: null,
          spesa: [],
          pasti: [],
          logIntegratori: {},
          preferiti: [],
          onboardingFatto: false,
          giorniSalute: {},
          diario: {},
          health: {
            collegato: false,
            ultimaSync: null,
            passiMedi: null,
            kcalAttiveMedie: null,
            fcRiposo: null,
          },
        }),

      addPeso: (e) =>
        set((s) => {
          const pesi = [...s.pesi.filter((p) => p.data !== e.data), { ...e, id: uid() }].sort(
            (a, b) => a.data.localeCompare(b.data),
          );
          const ultimo = pesi[pesi.length - 1];
          return {
            pesi,
            profile: s.profile ? { ...s.profile, pesoKg: ultimo.pesoKg } : s.profile,
          };
        }),

      removePeso: (id) => set((s) => ({ pesi: s.pesi.filter((p) => p.id !== id) })),

      setGiorno: (d) => set((s) => ({ piano: { ...s.piano, [d.data]: d } })),

      svuotaGiorno: (data) =>
        set((s) => {
          const piano = { ...s.piano };
          delete piano[data];
          return { piano };
        }),

      applicaProgramma: (programId, dataInizio, settimane, soloFeriali = false) => {
        const prog = programma(programId);
        if (!prog) return;
        const piano = { ...get().piano };
        const start = new Date(dataInizio + 'T00:00:00');

        const settimanaTipo = soloFeriali
          ? compattaInFeriali(prog.splitSuggerito, prog.workouts)
          : prog.splitSuggerito;

        // quante volte una stessa etichetta e' gia' stata usata: serve a ruotare
        // fra piu' schede che iniziano allo stesso modo (Push A / Push B)
        const usi = new Map<string, number>();

        for (let g = 0; g < settimane * 7; g++) {
          const d = addDays(start, g);
          // la settimana tipo e' indicizzata per giorno: 0 = lunedi
          const indiceSettimana = (d.getDay() + 6) % 7;
          const etichetta = settimanaTipo[indiceSettimana] ?? 'Riposo';
          const lab = normalizza(etichetta);

          const candidati = prog.workouts.filter((x) => {
            const nome = normalizza(x.nome);
            return nome.startsWith(lab) || lab.startsWith(nome);
          });

          let match: (typeof prog.workouts)[number] | undefined;
          if (candidati.length > 0) {
            const usati = usi.get(lab) ?? 0;
            match = candidati[usati % candidati.length];
            usi.set(lab, usati + 1);
          }

          // un'etichetta di solo cardio o riposo non deve mai ricevere una scheda pesi
          const senzaPesi = !match && RIPOSO_O_CARDIO.test(etichetta);

          piano[key(d)] = {
            data: key(d),
            programId,
            workoutId: match?.id ?? null,
            cardio:
              !match && prog.cardio && SOLO_CARDIO.test(etichetta)
                ? {
                    tipo: prog.cardio.tipo,
                    modalita: prog.cardio.modalita,
                    durataMin: prog.cardio.durataMin,
                  }
                : null,
            note: !match && !senzaPesi ? etichetta : undefined,
          };
        }
        set({ piano });
      },

      svuotaPiano: () => set({ piano: {} }),

      iniziaSessione: (programId, workoutId, esercizi) =>
        set({
          sessioneAttiva: {
            id: uid(),
            data: key(new Date()),
            iniziata: new Date().toISOString(),
            durataSec: 0,
            programId,
            workoutId,
            esercizi,
            volumeKg: 0,
            completata: false,
          },
        }),

      aggiornaSerie: (exIdx, setIdx, patch) =>
        set((s) => {
          if (!s.sessioneAttiva) return {};
          const esercizi = s.sessioneAttiva.esercizi.map((ex, i) =>
            i !== exIdx
              ? ex
              : {
                  ...ex,
                  serie: ex.serie.map((st, j) => (j === setIdx ? { ...st, ...patch } : st)),
                },
          );
          return { sessioneAttiva: { ...s.sessioneAttiva, esercizi } };
        }),

      aggiungiSerie: (exIdx) =>
        set((s) => {
          if (!s.sessioneAttiva) return {};
          const esercizi = s.sessioneAttiva.esercizi.map((ex, i) => {
            if (i !== exIdx) return ex;
            const ultima = ex.serie[ex.serie.length - 1];
            return {
              ...ex,
              serie: [
                ...ex.serie,
                { reps: ultima?.reps ?? null, kg: ultima?.kg ?? null, fatto: false },
              ],
            };
          });
          return { sessioneAttiva: { ...s.sessioneAttiva, esercizi } };
        }),

      sostituisciEsercizio: (exIdx, nuovoId) =>
        set((s) => {
          if (!s.sessioneAttiva) return {};
          // le serie restano, i carichi no: sono di un altro esercizio
          const esercizi = s.sessioneAttiva.esercizi.map((ex, i) =>
            i === exIdx
              ? {
                  exerciseId: nuovoId,
                  serie: ex.serie.map(() => ({ reps: null, kg: null, fatto: false })),
                  note: ex.note,
                }
              : ex,
          );
          return { sessioneAttiva: { ...s.sessioneAttiva, esercizi } };
        }),

      notaEsercizio: (exIdx, nota) =>
        set((s) => {
          if (!s.sessioneAttiva) return {};
          const esercizi = s.sessioneAttiva.esercizi.map((ex, i) =>
            i === exIdx ? { ...ex, note: nota } : ex,
          );
          return { sessioneAttiva: { ...s.sessioneAttiva, esercizi } };
        }),

      concludiSessione: (durataSec, nota) =>
        set((s) => {
          const a = s.sessioneAttiva;
          if (!a) return {};
          const volumeKg = a.esercizi.reduce(
            (tot, ex) =>
              tot + ex.serie.reduce((v, st) => v + (st.fatto ? (st.kg ?? 0) * (st.reps ?? 0) : 0), 0),
            0,
          );
          const fatta: SessionLog = {
            ...a,
            durataSec,
            conclusa: new Date().toISOString(),
            volumeKg: Math.round(volumeKg),
            completata: true,
            note: nota,
          };
          return { sessioni: [fatta, ...s.sessioni], sessioneAttiva: null };
        }),

      annullaSessione: () => set({ sessioneAttiva: null }),

      addCardio: (c) =>
        set((s) => ({ sessioniCardio: [{ ...c, id: uid() }, ...s.sessioniCardio] })),

      removeCardio: (id) =>
        set((s) => ({ sessioniCardio: s.sessioniCardio.filter((c) => c.id !== id) })),

      addSpesa: (i) => set((s) => ({ spesa: [...s.spesa, { ...i, id: uid() }] })),

      toggleSpesa: (id) =>
        set((s) => ({ spesa: s.spesa.map((i) => (i.id === id ? { ...i, preso: !i.preso } : i)) })),

      removeSpesa: (id) => set((s) => ({ spesa: s.spesa.filter((i) => i.id !== id) })),

      svuotaSpesa: (soloPresi) =>
        set((s) => ({ spesa: soloPresi ? s.spesa.filter((i) => !i.preso) : [] })),

      aggiungiListaSpesa: (items) => {
        const esistenti = new Set(get().spesa.map((i) => i.nome.toLowerCase()));
        const nuovi = items
          .filter((i) => !esistenti.has(i.nome.toLowerCase()))
          .map((i) => ({ ...i, id: uid() }));
        set((s) => ({ spesa: [...s.spesa, ...nuovi] }));
        return nuovi.length;
      },

      toggleIntegratore: (id) =>
        set((s) => ({
          integratoriAttivi: s.integratoriAttivi.includes(id)
            ? s.integratoriAttivi.filter((x) => x !== id)
            : [...s.integratoriAttivi, id],
        })),

      segnaIntegratore: (data, id, preso) =>
        set((s) => ({ logIntegratori: { ...s.logIntegratori, [data + '|' + id]: preso } })),

      addPasto: (m) => set((s) => ({ pasti: [...s.pasti, { ...m, id: uid() }] })),

      removePasto: (id) => set((s) => ({ pasti: s.pasti.filter((p) => p.id !== id) })),

      copiaPasti: (daData, aData) => {
        const sorgente = get().pasti.filter((p) => p.data === daData);
        if (sorgente.length === 0) return 0;
        const copie = sorgente.map((p) => ({ ...p, id: uid(), data: aData }));
        set((s) => ({ pasti: [...s.pasti, ...copie] }));
        return copie.length;
      },

      salvaRicetta: (r) => {
        const id = r.id ?? `mia-${uid()}`;
        const ricetta: Recipe = { ...r, id };
        set((s) => ({
          ricetteMie: s.ricetteMie.some((x) => x.id === id)
            ? s.ricetteMie.map((x) => (x.id === id ? ricetta : x))
            : [...s.ricetteMie, ricetta],
        }));
        return id;
      },

      eliminaRicetta: (id) =>
        set((s) => ({ ricetteMie: s.ricetteMie.filter((r) => r.id !== id) })),

      salvaScheda: (w) => {
        const id = w.id ?? `mia-${uid()}`;
        const scheda: WorkoutTemplate = { ...w, id };
        set((s) => ({
          schedeMie: s.schedeMie.some((x) => x.id === id)
            ? s.schedeMie.map((x) => (x.id === id ? scheda : x))
            : [...s.schedeMie, scheda],
        }));
        return id;
      },

      eliminaScheda: (id) => set((s) => ({ schedeMie: s.schedeMie.filter((w) => w.id !== id) })),

      togglePreferito: (exerciseId) =>
        set((s) => ({
          preferiti: s.preferiti.includes(exerciseId)
            ? s.preferiti.filter((x) => x !== exerciseId)
            : [...s.preferiti, exerciseId],
        })),

      setHealth: (patch) => set((s) => ({ health: { ...s.health, ...patch } })),

      setGiorniSalute: (giorni) =>
        set((s) => {
          const mappa = { ...s.giorniSalute };
          for (const g of giorni) mappa[g.data] = g;
          return { giorniSalute: mappa };
        }),

      setObiettiviAttivita: (patch) =>
        set((s) => ({ obiettiviAttivita: { ...s.obiettiviAttivita, ...patch } })),

      setDiario: (data, patch) =>
        set((s) => {
          const prec = s.diario[data] ?? { data, energia: 3, fame: 3, dolori: 2 };
          return { diario: { ...s.diario, [data]: { ...prec, ...patch, data } } };
        }),

      setPlaylist: (chiave, p) =>
        set((s) => {
          const playlist = { ...s.playlist };
          if (p) playlist[chiave] = p;
          else delete playlist[chiave];
          return { playlist };
        }),

      setTema: (t) => set({ tema: t }),

      setNotifiche: (patch) => set((s) => ({ notifiche: { ...s.notifiche, ...patch } })),
    }),
    { name: 'gymbro-v1' },
  ),
);

/**
 * Il catalogo e' un modulo puro e non conosce lo store: gli passiamo noi le
 * ricette scritte dall'utente, cosi' `ricetta(id)` le trova come le altre.
 */
registraRicetteMie(useStore.getState().ricetteMie);
registraSchedeMie(useStore.getState().schedeMie);
useStore.subscribe((s) => {
  registraRicetteMie(s.ricetteMie);
  registraSchedeMie(s.schedeMie);
});

const RIPOSO_O_CARDIO = /ripos|cardio|liss|hiit|camminat|recuper/i;
const SOLO_CARDIO = /cardio|liss|hiit|camminat/i;

/**
 * Rimappa la settimana tipo su lunedi-venerdi, lasciando libero il weekend.
 * Gli allenamenti con i pesi vengono distribuiti il piu' possibile a giorni
 * alterni; il cardio riempie i feriali che restano.
 */
function compattaInFeriali(
  split: string[],
  workouts: { nome: string }[],
): string[] {
  const risolve = (etichetta: string) => {
    const lab = normalizza(etichetta);
    return workouts.some((w) => {
      const nome = normalizza(w.nome);
      return nome.startsWith(lab) || lab.startsWith(nome);
    });
  };

  const pesi = split.filter(risolve);
  const cardio = split.filter((e) => !risolve(e) && SOLO_CARDIO.test(e));

  // posizioni piu' distanziate possibile dentro lunedi-venerdi
  const DISTRIBUZIONE: Record<number, number[]> = {
    0: [],
    1: [2],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
  };

  const settimana = Array<string>(7).fill('Riposo completo');
  const posizioni = DISTRIBUZIONE[Math.min(pesi.length, 5)] ?? [0, 1, 2, 3, 4];
  posizioni.forEach((giorno, i) => {
    settimana[giorno] = pesi[i];
  });

  // i feriali rimasti liberi prendono il cardio, se il programma ne prevede
  let c = 0;
  for (let g = 0; g < 5 && c < cardio.length; g++) {
    if (settimana[g] === 'Riposo completo') settimana[g] = cardio[c++];
  }

  return settimana;
}

function normalizza(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
