/**
 * Collegamento a Spotify tramite link.
 *
 * Non c'è nessuna integrazione con le API di Spotify: servirebbero un'app
 * registrata sulla Developer Dashboard, il login OAuth e un account Premium.
 * Qui apriamo semplicemente Spotify sulla playlist scelta — funziona anche con
 * l'account gratuito e senza configurare niente.
 */

export interface SuggerimentoPlaylist {
  nome: string;
  /** cosa cercare su Spotify: la ricerca funziona sempre, un id inventato no */
  query: string;
  per: string;
}

export const PLAYLIST_SUGGERITE: SuggerimentoPlaylist[] = [
  { nome: 'Beast Mode', query: 'Beast Mode workout', per: 'Forza e alzate pesanti' },
  { nome: 'Power Workout', query: 'Power Workout', per: 'Sedute ad alto volume' },
  { nome: 'Gym Hip Hop', query: 'Gym Hip Hop', per: 'Ipertrofia, ritmo costante' },
  { nome: 'Cardio Run', query: 'Cardio running playlist', per: 'Corsa e HIIT' },
  { nome: 'Workout Twerkout', query: 'Workout Twerkout', per: 'Circuiti e densità alta' },
  { nome: 'Deep Focus', query: 'Deep Focus', per: 'LISS lungo e noioso' },
  { nome: 'Rock Hard', query: 'Rock Workout', per: 'Chi tira meglio con le chitarre' },
  { nome: 'Metal Gym', query: 'Metal workout', per: 'Massimali' },
];

const RX_PLAYLIST = /(?:playlist|album|track)[/:]([A-Za-z0-9]{22})/;

/**
 * Accetta un link o un URI di Spotify e restituisce un URL apribile.
 * `null` se non sembra un indirizzo Spotify.
 */
export function normalizzaLink(input: string): string | null {
  const t = input.trim();
  if (!t) return null;

  const m = t.match(RX_PLAYLIST);
  if (m) {
    const tipo = /album/.test(t) ? 'album' : /track/.test(t) ? 'track' : 'playlist';
    return `https://open.spotify.com/${tipo}/${m[1]}`;
  }

  if (/^https?:\/\/open\.spotify\.com\//.test(t)) return t.split('?')[0];
  return null;
}

/** Ricerca su Spotify: apre l'app se installata, altrimenti il sito. */
export function urlRicerca(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export function apriSpotify(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
