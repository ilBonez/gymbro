/**
 * Pasti fuori piano, con i valori tipici di una porzione da ristorante o da asporto.
 * Sono medie italiane ragionevoli, non etichette nutrizionali: servono a non
 * lasciare un buco nel diario quando si mangia fuori.
 */
export interface Sgarro {
  id: string;
  nome: string;
  kcal: number;
  proteine: number;
  carbs: number;
  grassi: number;
  /**
   * Grammi di alcol etilico. Vale 7 kcal/g e non rientra in nessun macro:
   * senza questo campo le calorie di birra e vino non tornerebbero mai
   * con la somma di proteine, carboidrati e grassi.
   */
  alcol?: number;
  nota?: string;
}

export const SGARRI: Sgarro[] = [
  { id: 'pizza-margherita', nome: 'Pizza margherita', kcal: 900, proteine: 35, carbs: 115, grassi: 32 },
  { id: 'pizza-farcita', nome: 'Pizza farcita (salumi o fritti)', kcal: 1250, proteine: 48, carbs: 130, grassi: 60 },
  { id: 'hamburger-patatine', nome: 'Hamburger con patatine', kcal: 1100, proteine: 45, carbs: 100, grassi: 58 },
  { id: 'sushi-misto', nome: 'Sushi misto (20 pezzi)', kcal: 800, proteine: 42, carbs: 110, grassi: 18 },
  { id: 'pasta-ristorante', nome: 'Primo al ristorante', kcal: 750, proteine: 22, carbs: 95, grassi: 28 },
  { id: 'kebab', nome: 'Kebab con salse', kcal: 950, proteine: 45, carbs: 85, grassi: 47 },
  { id: 'piadina-farcita', nome: 'Piadina farcita', kcal: 600, proteine: 26, carbs: 55, grassi: 30 },
  { id: 'aperitivo', nome: 'Aperitivo con buffet', kcal: 700, proteine: 18, carbs: 65, grassi: 38 },
  { id: 'birra-media', nome: 'Birra media (400 ml)', kcal: 180, proteine: 2, carbs: 15, grassi: 0, alcol: 16, nota: "L'alcol frena l'ossidazione dei grassi per qualche ora." },
  { id: 'calice-vino', nome: 'Calice di vino (150 ml)', kcal: 125, proteine: 0, carbs: 4, grassi: 0, alcol: 15, nota: 'Quasi tutte le calorie vengono dall’alcol, non dai macro.' },
  { id: 'gelato-medio', nome: 'Gelato (due gusti)', kcal: 320, proteine: 6, carbs: 40, grassi: 15 },
  { id: 'dolce-ristorante', nome: 'Dolce al ristorante', kcal: 480, proteine: 7, carbs: 55, grassi: 25 },
  { id: 'cornetto-cappuccino', nome: 'Cornetto e cappuccino', kcal: 400, proteine: 10, carbs: 48, grassi: 18 },
  { id: 'patatine-busta', nome: 'Patatine in busta (100 g)', kcal: 535, proteine: 6, carbs: 51, grassi: 34 },
  { id: 'cioccolato-100', nome: 'Tavoletta di cioccolato (100 g)', kcal: 545, proteine: 7, carbs: 57, grassi: 31 },
  { id: 'cena-fuori', nome: 'Cena fuori completa', kcal: 1500, proteine: 60, carbs: 140, grassi: 75, nota: 'Antipasto, primo o secondo, vino e dolce.' },
];

export function sgarroById(id: string): Sgarro | undefined {
  return SGARRI.find((s) => s.id === id);
}
