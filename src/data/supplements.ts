import type { Goal } from './programs';

export type Timing = 'pre-workout' | 'post-workout' | 'mattina' | 'pranzo' | 'sera' | 'a-piacere';

export interface Supplement {
  id: string;
  nome: string;
  dose: string;
  timing: Timing;
  quando: string;
  perche: string;
  evidenza: 'alta' | 'media' | 'bassa';
  fasi: Goal[];
  attenzioni?: string[];
  predefinito: boolean;
}

export const TIMING_LABEL: Record<Timing, string> = {
  'pre-workout': 'Pre-workout',
  'post-workout': 'Post-workout',
  mattina: 'Mattina',
  pranzo: 'Pranzo',
  sera: 'Sera',
  'a-piacere': 'Orario libero',
};

export const SUPPLEMENTS: Supplement[] = [
  {
    id: 'caffeina',
    nome: 'Caffeina',
    dose: '3-6 mg per kg di peso (200-400 mg tipici)',
    timing: 'pre-workout',
    quando: '30-45 minuti prima della seduta, a stomaco vuoto va benissimo',
    perche: 'Riduce la percezione della fatica, migliora forza e prestazione nel cardio. È il pre-workout con più prove a supporto.',
    evidenza: 'alta',
    fasi: ['definizione', 'forza', 'massa', 'mantenimento'],
    attenzioni: [
      'Non assumerla dopo le 16:00: emivita di 5-6 ore, rovina il sonno e quindi il recupero.',
      'Se ti alleni molto presto conta anche il caffè della colazione nel totale giornaliero.',
      'Tetto di sicurezza generalmente indicato: 400 mg al giorno per un adulto sano.',
      'Se hai ipertensione, aritmie o prendi farmaci, parlane prima col medico.',
    ],
    predefinito: true,
  },
  {
    id: 'creatina',
    nome: 'Creatina monoidrato',
    dose: '3-5 g al giorno, tutti i giorni (anche di riposo)',
    timing: 'a-piacere',
    quando: "L'orario non conta: conta la costanza. Comodo insieme al pasto post-workout.",
    perche: 'Aumenta forza, ripetizioni nelle serie e massa magra. Integratore più studiato in assoluto.',
    evidenza: 'alta',
    fasi: ['definizione', 'forza', 'massa', 'mantenimento'],
    attenzioni: [
      'Non serve la fase di carico: 3-5 g al giorno saturano i muscoli in 3-4 settimane.',
      'Nelle prime settimane puoi prendere 1-2 kg di acqua intracellulare: è normale, non è grasso.',
      'Bevi a sufficienza. Se hai problemi renali noti, senti il medico.',
    ],
    predefinito: true,
  },
  {
    id: 'magnesio',
    nome: 'Magnesio (citrato o bisglicinato)',
    dose: '200-400 mg di magnesio elementare',
    timing: 'sera',
    quando: 'La sera, dopo cena o prima di dormire',
    perche: 'Supporta funzione neuromuscolare e qualità del sonno. Utile se sudi molto o sei in deficit calorico.',
    evidenza: 'media',
    fasi: ['definizione', 'forza', 'massa', 'mantenimento'],
    attenzioni: [
      'Lossido di magnesio è poco assorbito: meglio citrato o bisglicinato.',
      'Dosi alte possono avere effetto lassativo: sali gradualmente.',
    ],
    predefinito: true,
  },
  {
    id: 'proteine-whey',
    nome: 'Proteine in polvere (cacao)',
    dose: '25-35 g per porzione',
    timing: 'post-workout',
    quando: 'Nel pasto post-allenamento, oppure quando non arrivi al target proteico giornaliero',
    perche: "Sono cibo, non magia: servono a chiudere il fabbisogno proteico. Il totale giornaliero conta più del timing.",
    evidenza: 'alta',
    fasi: ['definizione', 'forza', 'massa', 'mantenimento'],
    attenzioni: ['Se sei intollerante al lattosio scegli isolate o proteine vegetali.'],
    predefinito: true,
  },
  {
    id: 'omega3',
    nome: 'Omega 3 (EPA/DHA)',
    dose: '1-2 g di EPA+DHA al giorno',
    timing: 'pranzo',
    quando: 'Con un pasto che contiene grassi',
    perche: 'Utile se mangi poco pesce grasso. Supporto cardiovascolare e antinfiammatorio.',
    evidenza: 'media',
    fasi: ['definizione', 'forza', 'massa', 'mantenimento'],
    attenzioni: ['Se prendi anticoagulanti, parlane col medico.'],
    predefinito: false,
  },
  {
    id: 'vitamina-d',
    nome: 'Vitamina D3',
    dose: '1000-2000 UI al giorno (da autunno a primavera)',
    timing: 'pranzo',
    quando: 'Con un pasto grasso, per assorbirla meglio',
    perche: 'Carenza molto comune in Italia nei mesi freddi. Incide su ossa, immunità e forza.',
    evidenza: 'media',
    fasi: ['definizione', 'forza', 'massa', 'mantenimento'],
    attenzioni: ['Idealmente dosala dopo un esame del sangue (25-OH vitamina D).'],
    predefinito: false,
  },
  {
    id: 'elettroliti',
    nome: 'Sali minerali / elettroliti',
    dose: '1 bustina in 500 ml',
    timing: 'pre-workout',
    quando: 'Nelle sedute lunghe, nel cardio a digiuno o quando fa caldo',
    perche: 'Sodio e potassio mantengono prestazione e pressione durante il low carb, quando trattieni meno acqua.',
    evidenza: 'media',
    fasi: ['definizione', 'mantenimento'],
    predefinito: false,
  },
  {
    id: 'multivitaminico',
    nome: 'Multivitaminico',
    dose: '1 compressa',
    timing: 'mattina',
    quando: 'Con la colazione',
    perche: 'Rete di sicurezza durante le fasi di deficit calorico, quando la varietà alimentare cala.',
    evidenza: 'bassa',
    fasi: ['definizione'],
    predefinito: false,
  },
];

/** Stack preimpostato: mattina presto in palestra a digiuno. */
export const STACK_MATTINA_PRESTO = ['caffeina', 'proteine-whey', 'creatina', 'magnesio'];

export function supplementById(id: string): Supplement | undefined {
  return SUPPLEMENTS.find((s) => s.id === id);
}
