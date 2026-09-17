/**
 * Ricerca di un prodotto confezionato per codice a barre.
 *
 * Open Food Facts è un database collaborativo con licenza aperta: niente
 * chiave, niente account. È l'unica parte dell'app che esce su internet, e
 * manda solo il codice a barre — nessun dato personale.
 *
 * I valori sono dichiarati da chi ha inserito il prodotto, quindi possono
 * mancare o essere sbagliati: l'app li mostra e lascia correggere prima di
 * salvarli.
 */

const BASE = 'https://world.openfoodfacts.org/api/v2/product';
const CAMPI = 'code,product_name,product_name_it,brands,nutriments,serving_quantity,quantity';

export interface ProdottoOFF {
  barcode: string;
  nome: string;
  marca?: string;
  /** valori per 100 g o 100 ml, come li dichiara l'etichetta */
  per100: { kcal: number; proteine: number; carbs: number; grassi: number };
  porzioneG?: number;
  incompleto: boolean;
}

export type EsitoRicerca =
  | { stato: 'trovato'; prodotto: ProdottoOFF }
  | { stato: 'assente' }
  | { stato: 'errore'; messaggio: string };

interface RispostaOFF {
  status?: number;
  product?: {
    code?: string;
    product_name?: string;
    product_name_it?: string;
    brands?: string;
    serving_quantity?: number | string;
    nutriments?: Record<string, number | string | undefined>;
  };
}

const numero = (v: number | string | undefined): number => {
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? Math.round((n as number) * 10) / 10 : 0;
};

/** Un codice a barre valido: EAN-8, EAN-13, UPC. Solo cifre. */
export function barcodeValido(codice: string): boolean {
  return /^\d{8,14}$/.test(codice.trim());
}

export async function cercaProdotto(codice: string, segnale?: AbortSignal): Promise<EsitoRicerca> {
  const code = codice.trim();
  if (!barcodeValido(code)) return { stato: 'errore', messaggio: 'Il codice deve avere da 8 a 14 cifre.' };

  try {
    const r = await fetch(`${BASE}/${code}.json?fields=${CAMPI}`, {
      signal: segnale,
      headers: { Accept: 'application/json' },
    });
    if (r.status === 404) return { stato: 'assente' };
    if (!r.ok) return { stato: 'errore', messaggio: `Open Food Facts ha risposto ${r.status}.` };

    const dati = (await r.json()) as RispostaOFF;
    const p = dati.product;
    if (!p || dati.status === 0) return { stato: 'assente' };

    const n = p.nutriments ?? {};
    const kcal =
      numero(n['energy-kcal_100g']) ||
      // alcuni prodotti hanno solo i kJ: 1 kcal = 4.184 kJ
      Math.round(numero(n['energy_100g']) / 4.184);

    const per100 = {
      kcal,
      proteine: numero(n['proteins_100g']),
      carbs: numero(n['carbohydrates_100g']),
      grassi: numero(n['fat_100g']),
    };

    return {
      stato: 'trovato',
      prodotto: {
        barcode: p.code ?? code,
        nome: p.product_name_it || p.product_name || `Prodotto ${code}`,
        marca: p.brands?.split(',')[0]?.trim() || undefined,
        per100,
        porzioneG: numero(p.serving_quantity) || undefined,
        incompleto: per100.kcal === 0,
      },
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return { stato: 'assente' };
    return {
      stato: 'errore',
      messaggio: 'Niente connessione a Open Food Facts. Puoi inserire i valori a mano.',
    };
  }
}

/** I macro di una quantità in grammi, dai valori per 100 g. */
export function porzione(p: ProdottoOFF, grammi: number) {
  const q = grammi / 100;
  return {
    kcal: Math.round(p.per100.kcal * q),
    proteine: Math.round(p.per100.proteine * q),
    carbs: Math.round(p.per100.carbs * q),
    grassi: Math.round(p.per100.grassi * q),
  };
}
