export type Goal = 'definizione' | 'forza' | 'massa' | 'mantenimento';

/**
 * Che cosa si fa davvero durante il cardio. Serve a scegliere il MET giusto:
 * il campo `tipo` e' una descrizione per l'utente ed elenca alternative
 * ("camminata in pendenza o ellittica"), quindi non e' interpretabile a codice.
 */
export type ModalitaCardio =
  | 'camminata-pendenza'
  | 'camminata'
  | 'ellittica'
  | 'cyclette'
  | 'vogatore'
  | 'corsa'
  | 'scala'
  | 'hiit';

export interface Cardio {
  /** descrizione leggibile, mostrata nell'app */
  tipo: string;
  /** attivita' prevalente, usata per stimare le calorie */
  modalita: ModalitaCardio;
  frequenzaSettimana: number;
  durataMin: number;
  /** quante delle sedute settimanali sono HIIT invece della modalita' base */
  sessioniHiit?: number;
  durataHiitMin?: number;
  intensita: string;
  note?: string;
}

export interface ProgramSet {
  exerciseId: string;   // deve esistere in EXERCISES
  serie: number;
  ripetizioni: string;  // es. '8-10', '5', '30-45s', 'AMRAP'
  recuperoSec: number;
  rpe?: string;         // es. 'RPE 7-8' oppure '75% 1RM'
  note?: string;
}

export interface WorkoutTemplate {
  id: string;           // kebab-case unico
  nome: string;         // es. 'Push A - Spinta'
  focus: string;        // es. 'Petto, spalle, tricipiti'
  durataMin: number;    // durata stimata sessione
  riscaldamento: string[];
  esercizi: ProgramSet[];
  defaticamento?: string[];
}

export interface Program {
  id: string;
  nome: string;
  goal: Goal;
  descrizione: string;
  durataSettimane: number;      // durata consigliata del blocco
  durataMaxSettimane?: number;  // limite di sicurezza oltre il quale va interrotto
  giorniSettimana: number;      // sessioni/settimana
  splitSuggerito: string[];     // es. ['Push','Pull','Gambe','Riposo',...] lunghezza 7
  cardio: Cardio | null;
  workouts: WorkoutTemplate[];
  avvertenze?: string[];
}

export const PROGRAMS: Program[] = [
  // =================================================================
  // 1. DEFINIZIONE - blocco low carb
  // =================================================================
  {
    id: 'definizione-lowcarb',
    nome: 'Definizione Low Carb - Upper/Lower',
    goal: 'definizione',
    descrizione:
      'Blocco breve e intenso in deficit calorico con carboidrati ridotti. Quattro sedute di pesi con densità alta e recuperi corti per mantenere la massa magra, più cardio LISS quasi quotidiano e una sola sessione HIIT. Il carico sui fondamentali va mantenuto, non aumentato: in questa fase l\'obiettivo è conservare la forza, non costruirla.',
    durataSettimane: 4,
    durataMaxSettimane: 6,
    giorniSettimana: 4,
    splitSuggerito: [
      'Upper A',
      'Lower A',
      'Solo cardio LISS',
      'Upper B',
      'Lower B',
      'Cardio LISS + core',
      'Riposo completo',
    ],
    cardio: {
      tipo: 'LISS (camminata in pendenza o ellittica) + 1 sessione HIIT',
      modalita: 'camminata-pendenza',
      frequenzaSettimana: 4,
      durataMin: 35,
      sessioniHiit: 1,
      durataHiitMin: 18,
      intensita: 'LISS al 60-70% della frequenza cardiaca massima; HIIT 30s sprint / 90s recupero',
      note: '3 sessioni LISS da 30-40 minuti più 1 HIIT da 15-20 minuti. Tieni l\'HIIT lontano dalla seduta di gambe, idealmente a 24 ore di distanza.',
    },
    workouts: [
      {
        id: 'def-upper-a',
        nome: 'Upper A - Spinta e tirata',
        focus: 'Petto, schiena, spalle, braccia',
        durataMin: 60,
        riscaldamento: [
          '5 minuti di ellittica o cyclette a ritmo blando.',
          'Circonduzioni delle spalle e rotazioni esterne con elastico, 2 serie da 15.',
          '1 serie leggera di panca con manubri al 50% del carico di lavoro.',
        ],
        esercizi: [
          { exerciseId: 'panca-piana-manubri', serie: 4, ripetizioni: '10-12', recuperoSec: 75, rpe: 'RPE 8' },
          { exerciseId: 'rematore-bilanciere', serie: 4, ripetizioni: '10-12', recuperoSec: 75, rpe: 'RPE 8' },
          { exerciseId: 'lento-avanti-manubri', serie: 3, ripetizioni: '12', recuperoSec: 60, rpe: 'RPE 8' },
          { exerciseId: 'lat-machine-avanti', serie: 3, ripetizioni: '12-15', recuperoSec: 60 },
          { exerciseId: 'alzate-laterali-cavo', serie: 3, ripetizioni: '15', recuperoSec: 45, note: 'Ultima serie in stripping.' },
          { exerciseId: 'push-down-corda', serie: 3, ripetizioni: '12-15', recuperoSec: 45 },
          { exerciseId: 'curl-manubri-alternato', serie: 3, ripetizioni: '12-15', recuperoSec: 45 },
        ],
        defaticamento: [
          '5 minuti di camminata leggera sul tapis roulant.',
          'Allungamento di pettorali sullo stipite e dorsali alla sbarra, 30 secondi per lato.',
          'Respirazione diaframmatica supina, 10 respiri lenti.',
        ],
      },
      {
        id: 'def-lower-a',
        nome: 'Lower A - Catena anteriore',
        focus: 'Quadricipiti, glutei, polpacci, core',
        durataMin: 60,
        riscaldamento: [
          '5 minuti di cyclette a resistenza bassa.',
          'Mobilità di anca e caviglia: affondi con rotazione, 8 per lato.',
          '2 serie leggere di squat a corpo libero e 1 serie di squat al 50% del carico.',
        ],
        esercizi: [
          { exerciseId: 'squat-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 90, rpe: 'RPE 8' },
          { exerciseId: 'leg-press', serie: 3, ripetizioni: '12-15', recuperoSec: 75 },
          { exerciseId: 'affondi-manubri', serie: 3, ripetizioni: '12 per gamba', recuperoSec: 60 },
          { exerciseId: 'leg-curl-sdraiato', serie: 3, ripetizioni: '12-15', recuperoSec: 60 },
          { exerciseId: 'calf-raise-in-piedi', serie: 4, ripetizioni: '15-20', recuperoSec: 45 },
          { exerciseId: 'plank', serie: 3, ripetizioni: '30-45s', recuperoSec: 45 },
          { exerciseId: 'mountain-climber', serie: 3, ripetizioni: '30s', recuperoSec: 45, note: 'Ritmo costante, non massimale.' },
        ],
        defaticamento: [
          '5 minuti di camminata in piano per smaltire il lattato.',
          'Allungamento di quadricipiti e flessori dell\'anca, 30 secondi per lato.',
          'Foam roller su quadricipiti e glutei, 1 minuto per zona.',
        ],
      },
      {
        id: 'def-upper-b',
        nome: 'Upper B - Volume e dettaglio',
        focus: 'Petto alto, dorsali, deltoidi posteriori, braccia',
        durataMin: 60,
        riscaldamento: [
          '5 minuti di vogatore a ritmo blando.',
          'Attivazione scapolare: scap pull up e face pull leggeri, 2 serie da 12.',
          '1 serie leggera di panca inclinata con manubri.',
        ],
        esercizi: [
          { exerciseId: 'panca-inclinata-manubri', serie: 4, ripetizioni: '10-12', recuperoSec: 75, rpe: 'RPE 8' },
          { exerciseId: 'trazioni-alla-sbarra', serie: 4, ripetizioni: 'AMRAP', recuperoSec: 90, note: 'Se superi le 12 ripetizioni aggiungi zavorra.' },
          { exerciseId: 'pulley-basso', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'croci-ai-cavi', serie: 3, ripetizioni: '12-15', recuperoSec: 45 },
          { exerciseId: 'alzate-posteriori-manubri', serie: 3, ripetizioni: '15', recuperoSec: 45 },
          { exerciseId: 'french-press-ez', serie: 3, ripetizioni: '12', recuperoSec: 45 },
          { exerciseId: 'curl-martello', serie: 3, ripetizioni: '12', recuperoSec: 45 },
        ],
        defaticamento: [
          '5 minuti di ellittica a resistenza minima.',
          'Allungamento di tricipiti sopra la testa e dorsali, 30 secondi per lato.',
          'Mobilità del rachide toracico: cat-camel, 10 ripetizioni.',
        ],
      },
      {
        id: 'def-lower-b',
        nome: 'Lower B - Catena posteriore e glutei',
        focus: 'Femorali, glutei, polpacci, core',
        durataMin: 60,
        riscaldamento: [
          '5 minuti di camminata in pendenza.',
          'Ponte a terra e clamshell con elastico, 2 serie da 15.',
          '1 serie leggera di stacco rumeno con il solo bilanciere.',
        ],
        esercizi: [
          { exerciseId: 'stacco-rumeno-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 90, rpe: 'RPE 8' },
          { exerciseId: 'hip-thrust-bilanciere', serie: 4, ripetizioni: '10-12', recuperoSec: 75, rpe: 'RPE 8' },
          { exerciseId: 'bulgarian-split-squat', serie: 3, ripetizioni: '10 per gamba', recuperoSec: 60 },
          { exerciseId: 'leg-extension', serie: 3, ripetizioni: '15', recuperoSec: 45 },
          { exerciseId: 'abduzioni-macchina', serie: 3, ripetizioni: '15-20', recuperoSec: 45 },
          { exerciseId: 'calf-raise-seduto', serie: 4, ripetizioni: '15-20', recuperoSec: 45 },
          { exerciseId: 'russian-twist', serie: 3, ripetizioni: '40s', recuperoSec: 40 },
        ],
        defaticamento: [
          '5 minuti di cyclette a resistenza minima.',
          'Allungamento di femorali e glutei, 30 secondi per lato.',
          'Foam roller sulla catena posteriore, 1 minuto per zona.',
        ],
      },
    ],
    avvertenze: [
      'Il blocco low carb non va protratto oltre le 4-6 settimane: dopo, inserisci un refeed o una fase di mantenimento di almeno 2 settimane.',
      'Interrompi o alza i carboidrati se noti cali di forza costanti su più sedute consecutive.',
      'Interrompi se peggiorano sonno, umore o libido: sono i primi segnali che il deficit è troppo aggressivo.',
      'Cura idratazione e sali minerali: con pochi carboidrati trattieni meno acqua e i crampi sono frequenti.',
      'Non aggiungere altro cardio per accelerare i risultati: il recupero in deficit è già limitato.',
    ],
  },

  // =================================================================
  // 2. FORZA - 5/3/1
  // =================================================================
  {
    id: 'forza-531',
    nome: 'Forza 5/3/1 - Quattro giorni',
    goal: 'forza',
    descrizione:
      'Programma di forza costruito sui quattro alzate fondamentali: squat, panca piana, stacco da terra e military press. Ogni seduta apre con un fondamentale a basse ripetizioni e alte percentuali, seguito da accessori in volume moderato. I recuperi sono lunghi perché qui conta la qualità della singola serie, non la densità. Calcola le percentuali su un massimale di lavoro pari al 90% del tuo 1RM reale.',
    durataSettimane: 8,
    durataMaxSettimane: 12,
    giorniSettimana: 4,
    splitSuggerito: [
      'Squat day',
      'Panca day',
      'Riposo',
      'Stacco day',
      'Military day',
      'Cardio LISS leggero',
      'Riposo completo',
    ],
    cardio: {
      tipo: 'LISS a basso impatto (camminata in pendenza o cyclette)',
      modalita: 'camminata-pendenza',
      frequenzaSettimana: 2,
      durataMin: 20,
      intensita: 'Zona 2, ritmo conversazionale',
      note: 'Solo recupero attivo. Mai nelle ore precedenti una seduta pesante: ruba energia agli alzate principali.',
    },
    workouts: [
      {
        id: 'forza-squat-day',
        nome: 'Squat Day - Forza sulle gambe',
        focus: 'Squat pesante, quadricipiti, catena posteriore',
        durataMin: 75,
        riscaldamento: [
          '5 minuti di cyclette più mobilità di anca e caviglia.',
          'Serie di avvicinamento allo squat: 5 a vuoto, 5 al 40%, 3 al 60%, 2 al 75%.',
          'Attivazione dei glutei con elastico: monster walk, 2 serie da 15 passi.',
        ],
        esercizi: [
          { exerciseId: 'squat-bilanciere', serie: 3, ripetizioni: '5 / 3 / 1+', recuperoSec: 300, rpe: '75% - 85% - 95% 1RM', note: 'Serie top a cedimento tecnico, mai oltre.' },
          { exerciseId: 'front-squat', serie: 4, ripetizioni: '5', recuperoSec: 180, rpe: '70% 1RM' },
          { exerciseId: 'leg-press', serie: 3, ripetizioni: '8', recuperoSec: 150, rpe: 'RPE 7-8' },
          { exerciseId: 'leg-curl-sdraiato', serie: 3, ripetizioni: '8-10', recuperoSec: 120 },
          { exerciseId: 'calf-raise-in-piedi', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'plank', serie: 3, ripetizioni: '45-60s', recuperoSec: 60 },
        ],
        defaticamento: [
          '5 minuti di camminata in piano.',
          'Allungamento di flessori dell\'anca e adduttori, 40 secondi per lato.',
          'Decompressione lombare: gambe al muro per 2 minuti.',
        ],
      },
      {
        id: 'forza-panca-day',
        nome: 'Panca Day - Forza di spinta',
        focus: 'Panca piana pesante, petto, tricipiti, dorso di supporto',
        durataMin: 75,
        riscaldamento: [
          '5 minuti di vogatore a ritmo blando.',
          'Rotazioni esterne e band pull apart, 2 serie da 15.',
          'Serie di avvicinamento alla panca: 8 a vuoto, 5 al 40%, 3 al 60%, 2 al 75%.',
        ],
        esercizi: [
          { exerciseId: 'panca-piana-bilanciere', serie: 3, ripetizioni: '5 / 3 / 1+', recuperoSec: 300, rpe: '75% - 85% - 95% 1RM' },
          { exerciseId: 'panca-stretta-bilanciere', serie: 4, ripetizioni: '6', recuperoSec: 180, rpe: '70% 1RM' },
          { exerciseId: 'rematore-bilanciere', serie: 4, ripetizioni: '6-8', recuperoSec: 150, rpe: 'RPE 8' },
          { exerciseId: 'lento-avanti-manubri', serie: 3, ripetizioni: '8', recuperoSec: 120 },
          { exerciseId: 'push-down-cavo', serie: 3, ripetizioni: '10', recuperoSec: 90 },
          { exerciseId: 'face-pull', serie: 3, ripetizioni: '15', recuperoSec: 60, note: 'Lavoro di salute per la spalla: carico leggero, controllo massimo.' },
        ],
        defaticamento: [
          '5 minuti di ellittica a resistenza minima.',
          'Allungamento di pettorali sullo stipite, 40 secondi per lato.',
          'Mobilità toracica sul foam roller, 10 estensioni.',
        ],
      },
      {
        id: 'forza-stacco-day',
        nome: 'Stacco Day - Catena posteriore',
        focus: 'Stacco da terra pesante, dorso, femorali, presa',
        durataMin: 75,
        riscaldamento: [
          '5 minuti di camminata in pendenza.',
          'Mobilità di anca: hip hinge a vuoto con bastone, 2 serie da 10.',
          'Serie di avvicinamento allo stacco: 5 al 40%, 3 al 60%, 1 al 80%.',
        ],
        esercizi: [
          { exerciseId: 'stacco-da-terra', serie: 3, ripetizioni: '5 / 3 / 1+', recuperoSec: 300, rpe: '75% - 85% - 95% 1RM', note: 'Ogni ripetizione parte da terra, senza rimbalzo.' },
          { exerciseId: 'stacco-rumeno-bilanciere', serie: 3, ripetizioni: '5', recuperoSec: 210, rpe: '65% 1RM dello stacco' },
          { exerciseId: 'trazioni-alla-sbarra', serie: 4, ripetizioni: '5', recuperoSec: 150, note: 'Aggiungi zavorra quando le 5 ripetizioni diventano facili.' },
          { exerciseId: 'rematore-manubrio', serie: 3, ripetizioni: '8', recuperoSec: 120 },
          { exerciseId: 'hyperextension', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'farmer-walk', serie: 3, ripetizioni: '30-40 metri', recuperoSec: 120 },
        ],
        defaticamento: [
          '5 minuti di camminata lenta.',
          'Allungamento di femorali e gran dorsale, 40 secondi per lato.',
          'Respirazione supina con gambe flesse, 10 respiri per scaricare la lombare.',
        ],
      },
      {
        id: 'forza-military-day',
        nome: 'Military Day - Spinta sopra la testa',
        focus: 'Military press pesante, spalle, tricipiti, dorso',
        durataMin: 70,
        riscaldamento: [
          '5 minuti di ellittica.',
          'Mobilità di spalla e rachide toracico, 2 serie da 10.',
          'Serie di avvicinamento al military: 8 a vuoto, 5 al 45%, 3 al 65%.',
        ],
        esercizi: [
          { exerciseId: 'military-press-bilanciere', serie: 3, ripetizioni: '5 / 3 / 1+', recuperoSec: 300, rpe: '75% - 85% - 95% 1RM' },
          { exerciseId: 'dip-alle-parallele', serie: 4, ripetizioni: '6-8', recuperoSec: 180, note: 'Zavorra se superi le 10 ripetizioni pulite.' },
          { exerciseId: 'lat-machine-avanti', serie: 4, ripetizioni: '8', recuperoSec: 120 },
          { exerciseId: 'alzate-laterali-manubri', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'curl-bilanciere', serie: 3, ripetizioni: '8', recuperoSec: 90 },
          { exerciseId: 'shrug-bilanciere', serie: 3, ripetizioni: '10', recuperoSec: 90 },
        ],
        defaticamento: [
          '5 minuti di cyclette a resistenza minima.',
          'Allungamento di deltoidi posteriori e tricipiti, 40 secondi per lato.',
          'Rotazioni lente delle spalle a corpo libero, 15 per verso.',
        ],
      },
    ],
    avvertenze: [
      'Dopo 8-12 settimane inserisci una settimana di scarico al 60% dei carichi prima di ripartire con un nuovo ciclo.',
      'La serie finale marcata 1+ va portata a cedimento tecnico, mai a cedimento muscolare con perdita di assetto.',
      'Con carichi sopra il 90% usa sempre i fermi di sicurezza del rack o uno spotter.',
      'Se manchi le ripetizioni previste per due settimane di fila, riduci il massimale di lavoro del 10% e riparti.',
      'Non aggiungere altro cardio intenso: compete direttamente con il recupero necessario alle alzate pesanti.',
    ],
  },

  // =================================================================
  // 3. MASSA - ipertrofia
  // =================================================================
  {
    id: 'massa-ipertrofia',
    nome: 'Massa e Ipertrofia - PPL + Upper/Lower',
    goal: 'massa',
    descrizione:
      'Cinque sedute settimanali che combinano la rotazione push/pull/gambe con una coppia upper/lower, così ogni gruppo muscolare viene stimolato circa due volte a settimana. Range di 8-12 ripetizioni, recuperi medi e attenzione al sovraccarico progressivo: aggiungi peso o ripetizioni ogni settimana restando nel range. Richiede un leggero surplus calorico e almeno 7 ore di sonno.',
    durataSettimane: 8,
    durataMaxSettimane: 12,
    giorniSettimana: 5,
    splitSuggerito: [
      'Push',
      'Pull',
      'Gambe',
      'Riposo',
      'Upper',
      'Lower',
      'Riposo completo',
    ],
    cardio: {
      tipo: 'LISS su tapis roulant o cyclette',
      modalita: 'camminata',
      frequenzaSettimana: 2,
      durataMin: 20,
      intensita: 'Zona 2, ritmo conversazionale',
      note: 'Da fare dopo i pesi o in giornata separata. Serve per la salute cardiovascolare e l\'appetito, non per bruciare calorie.',
    },
    workouts: [
      {
        id: 'massa-push',
        nome: 'Push - Spinta',
        focus: 'Petto, spalle, tricipiti',
        durataMin: 75,
        riscaldamento: [
          '5 minuti di ellittica o vogatore.',
          'Band pull apart e rotazioni esterne, 2 serie da 15.',
          '2 serie di avvicinamento alla panca piana al 50% e al 70%.',
        ],
        esercizi: [
          { exerciseId: 'panca-piana-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'panca-inclinata-manubri', serie: 3, ripetizioni: '10-12', recuperoSec: 90, rpe: 'RPE 8' },
          { exerciseId: 'spinte-spalle-macchina', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'croci-ai-cavi', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'alzate-laterali-manubri', serie: 4, ripetizioni: '12-15', recuperoSec: 60, note: 'Ultima serie con 2 stripping.' },
          { exerciseId: 'push-down-corda', serie: 3, ripetizioni: '10-12', recuperoSec: 60 },
          { exerciseId: 'estensioni-sopra-testa-manubrio', serie: 3, ripetizioni: '12', recuperoSec: 60 },
        ],
        defaticamento: [
          '5 minuti di camminata leggera.',
          'Allungamento di pettorali e tricipiti, 30 secondi per lato.',
          'Mobilità toracica: estensioni sul foam roller, 10 ripetizioni.',
        ],
      },
      {
        id: 'massa-pull',
        nome: 'Pull - Tirata',
        focus: 'Dorsali, trapezi, deltoidi posteriori, bicipiti',
        durataMin: 75,
        riscaldamento: [
          '5 minuti di vogatore a ritmo medio.',
          'Scap pull up e dead hang, 2 serie da 20 secondi.',
          '1 serie leggera di lat machine e 1 di rematore al 50%.',
        ],
        esercizi: [
          { exerciseId: 'trazioni-alla-sbarra', serie: 4, ripetizioni: '8-10', recuperoSec: 120, note: 'Usa l\'assistenza elastica se non arrivi a 8 ripetizioni pulite.' },
          { exerciseId: 'rematore-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'pulley-basso', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'lat-machine-presa-stretta', serie: 3, ripetizioni: '10-12', recuperoSec: 75 },
          { exerciseId: 'alzate-posteriori-manubri', serie: 3, ripetizioni: '15', recuperoSec: 60 },
          { exerciseId: 'curl-bilanciere', serie: 3, ripetizioni: '8-10', recuperoSec: 75 },
          { exerciseId: 'curl-martello', serie: 3, ripetizioni: '10-12', recuperoSec: 60 },
        ],
        defaticamento: [
          '5 minuti di ellittica a resistenza bassa.',
          'Dead hang passivo alla sbarra, 2 serie da 20 secondi.',
          'Allungamento di dorsali e bicipiti, 30 secondi per lato.',
        ],
      },
      {
        id: 'massa-gambe',
        nome: 'Gambe - Seduta completa',
        focus: 'Quadricipiti, femorali, glutei, polpacci',
        durataMin: 80,
        riscaldamento: [
          '5 minuti di cyclette a resistenza progressiva.',
          'Mobilità di anca e caviglia, 2 serie da 10 per lato.',
          'Squat di avvicinamento: 8 a vuoto, 5 al 50%, 3 al 70%.',
        ],
        esercizi: [
          { exerciseId: 'squat-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'stacco-rumeno-bilanciere', serie: 3, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'leg-press', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'leg-curl-seduto', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'leg-extension', serie: 3, ripetizioni: '12-15', recuperoSec: 60, note: 'Ultima serie con 3 ripetizioni parziali finali.' },
          { exerciseId: 'calf-raise-in-piedi', serie: 4, ripetizioni: '12-15', recuperoSec: 60 },
        ],
        defaticamento: [
          '5 minuti di camminata in piano.',
          'Allungamento di quadricipiti, femorali e polpacci, 30 secondi per lato.',
          'Foam roller su quadricipiti e bandelletta, 1 minuto per lato.',
        ],
      },
      {
        id: 'massa-upper',
        nome: 'Upper - Richiamo parte alta',
        focus: 'Petto alto, dorso, spalle, braccia',
        durataMin: 70,
        riscaldamento: [
          '5 minuti di vogatore.',
          'Circonduzioni e band pull apart, 2 serie da 15.',
          '1 serie di avvicinamento alla panca inclinata al 60%.',
        ],
        esercizi: [
          { exerciseId: 'panca-inclinata-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'rematore-manubrio', serie: 4, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'lento-avanti-manubri', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'pectoral-machine', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'face-pull', serie: 3, ripetizioni: '15', recuperoSec: 60 },
          { exerciseId: 'curl-panca-scott', serie: 3, ripetizioni: '10-12', recuperoSec: 60 },
          { exerciseId: 'french-press-ez', serie: 3, ripetizioni: '10-12', recuperoSec: 60 },
        ],
        defaticamento: [
          '5 minuti di camminata leggera.',
          'Allungamento di petto, dorsali e spalle, 30 secondi per zona.',
          'Respirazione diaframmatica, 10 respiri lenti.',
        ],
      },
      {
        id: 'massa-lower',
        nome: 'Lower - Richiamo gambe e glutei',
        focus: 'Quadricipiti, glutei, femorali, core',
        durataMin: 75,
        riscaldamento: [
          '5 minuti di camminata in pendenza.',
          'Attivazione dei glutei con elastico: ponte e clamshell, 2 serie da 15.',
          '2 serie leggere di hack squat a carico ridotto.',
        ],
        esercizi: [
          { exerciseId: 'hack-squat', serie: 4, ripetizioni: '10-12', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'hip-thrust-bilanciere', serie: 4, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 8' },
          { exerciseId: 'affondi-manubri', serie: 3, ripetizioni: '10 per gamba', recuperoSec: 90 },
          { exerciseId: 'leg-curl-sdraiato', serie: 3, ripetizioni: '10-12', recuperoSec: 60 },
          { exerciseId: 'calf-raise-seduto', serie: 4, ripetizioni: '15', recuperoSec: 45 },
          { exerciseId: 'ab-wheel', serie: 3, ripetizioni: '10-12', recuperoSec: 60 },
          { exerciseId: 'crunch-ai-cavi', serie: 3, ripetizioni: '12-15', recuperoSec: 60 },
        ],
        defaticamento: [
          '5 minuti di cyclette a resistenza minima.',
          'Allungamento di glutei e flessori dell\'anca, 30 secondi per lato.',
          'Gambe al muro per 2 minuti.',
        ],
      },
    ],
    avvertenze: [
      'Cinque sedute a settimana funzionano solo con sonno e alimentazione adeguati: se dormi meno di 6 ore, scendi a 4 giorni.',
      'Dopo 8 settimane inserisci una settimana di scarico dimezzando le serie.',
      'Il sovraccarico progressivo va cercato dentro il range: prima aggiungi ripetizioni, poi peso.',
      'Un dolore articolare acuto non è indolenzimento muscolare: sostituisci l\'esercizio e non forzare.',
    ],
  },

  // =================================================================
  // 4. MANTENIMENTO - full body
  // =================================================================
  {
    id: 'mantenimento-fullbody',
    nome: 'Mantenimento Full Body - Tre giorni',
    goal: 'mantenimento',
    descrizione:
      'Tre sedute full body a settimana per conservare forza e massa muscolare con il minimo impegno necessario. Ideale dopo un blocco intenso, nei periodi di lavoro pesante o in vacanza. Il volume è contenuto ma i carichi restano significativi: è questo che preserva i muscoli, non il numero di serie. Un blocco sostenibile a lungo, da cui ripartire verso un obiettivo specifico.',
    durataSettimane: 6,
    durataMaxSettimane: 12,
    giorniSettimana: 3,
    splitSuggerito: [
      'Full Body A',
      'Riposo o cardio leggero',
      'Full Body B',
      'Riposo',
      'Full Body C',
      'Cardio leggero',
      'Riposo completo',
    ],
    cardio: {
      tipo: 'Camminata veloce, cyclette o vogatore',
      modalita: 'camminata',
      frequenzaSettimana: 3,
      durataMin: 25,
      intensita: 'Moderata, zona 2',
      note: 'Anche nei giorni di riposo, come recupero attivo. Va bene sostituirla con un\'attività all\'aperto.',
    },
    workouts: [
      {
        id: 'mant-full-a',
        nome: 'Full Body A - Fondamentali',
        focus: 'Gambe, petto, dorso, spalle, core',
        durataMin: 55,
        riscaldamento: [
          '5 minuti di cyclette o camminata veloce.',
          'Mobilità generale di anche e spalle, 2 serie da 10 per zona.',
          '1 serie di avvicinamento al goblet squat con carico leggero.',
        ],
        esercizi: [
          { exerciseId: 'goblet-squat', serie: 3, ripetizioni: '10-12', recuperoSec: 90, rpe: 'RPE 7' },
          { exerciseId: 'panca-piana-manubri', serie: 3, ripetizioni: '10-12', recuperoSec: 90, rpe: 'RPE 7' },
          { exerciseId: 'rematore-manubrio', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'lento-avanti-manubri', serie: 3, ripetizioni: '10-12', recuperoSec: 75 },
          { exerciseId: 'leg-curl-sdraiato', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'plank', serie: 3, ripetizioni: '40s', recuperoSec: 45 },
        ],
        defaticamento: [
          '5 minuti di camminata leggera.',
          'Allungamento di gambe e spalle, 30 secondi per zona.',
          'Respirazione diaframmatica, 10 respiri lenti.',
        ],
      },
      {
        id: 'mant-full-b',
        nome: 'Full Body B - Catena posteriore',
        focus: 'Femorali, dorso, petto, spalle, core',
        durataMin: 55,
        riscaldamento: [
          '5 minuti di vogatore a ritmo blando.',
          'Hip hinge a vuoto con bastone, 2 serie da 10.',
          '1 serie di stacco rumeno con il solo bilanciere.',
        ],
        esercizi: [
          { exerciseId: 'stacco-rumeno-bilanciere', serie: 3, ripetizioni: '8-10', recuperoSec: 120, rpe: 'RPE 7' },
          { exerciseId: 'lat-machine-avanti', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'chest-press-macchina', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'affondi-manubri', serie: 3, ripetizioni: '10 per gamba', recuperoSec: 75 },
          { exerciseId: 'alzate-laterali-manubri', serie: 3, ripetizioni: '12-15', recuperoSec: 60 },
          { exerciseId: 'hollow-hold', serie: 3, ripetizioni: '30s', recuperoSec: 45 },
        ],
        defaticamento: [
          '5 minuti di camminata in piano.',
          'Allungamento di femorali e dorsali, 30 secondi per lato.',
          'Gambe al muro per 2 minuti.',
        ],
      },
      {
        id: 'mant-full-c',
        nome: 'Full Body C - Richiamo e braccia',
        focus: 'Gambe, glutei, dorso, petto, braccia',
        durataMin: 55,
        riscaldamento: [
          '5 minuti di ellittica.',
          'Attivazione dei glutei con elastico, 2 serie da 15.',
          '1 serie leggera di leg press a carico ridotto.',
        ],
        esercizi: [
          { exerciseId: 'leg-press', serie: 3, ripetizioni: '12', recuperoSec: 90, rpe: 'RPE 7' },
          { exerciseId: 'trazioni-presa-supina', serie: 3, ripetizioni: 'AMRAP', recuperoSec: 90, note: 'Con assistenza elastica se necessario.' },
          { exerciseId: 'push-up', serie: 3, ripetizioni: '12-15', recuperoSec: 60 },
          { exerciseId: 'hip-thrust-bilanciere', serie: 3, ripetizioni: '10-12', recuperoSec: 90 },
          { exerciseId: 'curl-martello', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'push-down-cavo', serie: 3, ripetizioni: '12', recuperoSec: 60 },
          { exerciseId: 'calf-raise-in-piedi', serie: 3, ripetizioni: '15', recuperoSec: 45 },
        ],
        defaticamento: [
          '5 minuti di cyclette a resistenza minima.',
          'Allungamento di glutei, petto e braccia, 30 secondi per zona.',
          'Mobilità lenta di collo e spalle, 10 ripetizioni per verso.',
        ],
      },
    ],
    avvertenze: [
      'Il mantenimento funziona se i carichi restano alti: non scambiare volume basso per intensità bassa.',
      'Puoi restare in questo blocco a lungo, ma dopo 12 settimane è meglio scegliere un obiettivo specifico per continuare a progredire.',
      'Se salti una seduta non recuperarla accorpando: riprendi semplicemente dalla successiva.',
    ],
  },
];
