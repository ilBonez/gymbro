export type Tema = 'sistema' | 'chiaro' | 'scuro';

export const TEMI: { id: Tema; label: string; desc: string }[] = [
  { id: 'chiaro', label: 'Chiaro', desc: 'Bianco e arancio, sempre' },
  { id: 'scuro', label: 'Scuro', desc: 'Più riposante la mattina presto' },
  { id: 'sistema', label: 'Sistema', desc: 'Segue le impostazioni del telefono' },
];

const mq = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

export function temaEffettivo(t: Tema): 'chiaro' | 'scuro' {
  if (t !== 'sistema') return t;
  return mq()?.matches ? 'scuro' : 'chiaro';
}

/** Scrive il tema su <html> e aggiorna la barra di stato su Android. */
export function applicaTema(t: Tema): void {
  const eff = temaEffettivo(t);
  document.documentElement.dataset.theme = eff;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', eff === 'scuro' ? '#07090d' : '#f4f5f7');
}

/**
 * Riapplica il tema quando il telefono passa da chiaro a scuro.
 * Restituisce la funzione per annullare l'ascolto.
 */
export function ascoltaSistema(t: Tema, onCambio: () => void): () => void {
  if (t !== 'sistema') return () => {};
  const m = mq();
  if (!m) return () => {};
  m.addEventListener('change', onCambio);
  return () => m.removeEventListener('change', onCambio);
}

/** Legge un colore del tema corrente: serve ai grafici, che vogliono valori concreti. */
export function coloreTema(nome: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--c-${nome}`).trim();
  return v || fallback;
}
