import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Stato dell'interfaccia tenuto nell'indirizzo invece che in `useState`.
 *
 * Il motivo è il tasto indietro: filtri e schede vivevano dentro il componente,
 * che viene distrutto quando si apre un dettaglio. Tornando indietro si
 * ripartiva da capo — filtri azzerati, scheda sbagliata. Mettendoli nell'URL è
 * il browser stesso a ripristinarli, senza che l'app debba ricordarsi niente.
 */
export function useParametroUrl(
  chiave: string,
  predefinito: string,
): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const valore = params.get(chiave) ?? predefinito;

  const imposta = useCallback(
    (v: string) => {
      setParams(
        (prec) => {
          const nuovi = new URLSearchParams(prec);
          // il valore predefinito non sporca l'indirizzo
          if (v === predefinito || v === '') nuovi.delete(chiave);
          else nuovi.set(chiave, v);
          return nuovi;
        },
        // sostituire invece di impilare: cambiare filtro non deve riempire
        // la cronologia di passaggi da cui tornare indietro uno a uno
        { replace: true },
      );
    },
    [chiave, predefinito, setParams],
  );

  return [valore, imposta];
}

/**
 * Più parametri in un colpo solo, con la possibilità di impilare il passaggio.
 *
 * Serve ai passaggi di livello — dal mese al giorno, ad esempio — dove cambiano
 * due chiavi insieme e il tasto indietro deve riportare alla vista di prima:
 * due `set` separati creerebbero due voci di cronologia, o nessuna.
 */
export function useImpostaParametri(): (
  patch: Record<string, string | null>,
  opzioni?: { push?: boolean },
) => void {
  const [, setParams] = useSearchParams();

  return useCallback(
    (patch, opzioni) => {
      setParams(
        (prec) => {
          const nuovi = new URLSearchParams(prec);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === '') nuovi.delete(k);
            else nuovi.set(k, v);
          }
          return nuovi;
        },
        { replace: !opzioni?.push },
      );
    },
    [setParams],
  );
}

/** Versione booleana, per gli interruttori tipo "solo preferiti". */
export function useFlagUrl(chiave: string): [boolean, (v: boolean) => void] {
  const [v, set] = useParametroUrl(chiave, '');
  return [v === '1', (b: boolean) => set(b ? '1' : '')];
}

/** Versione numerica, per gli sfogliatori di settimane. */
export function useNumeroUrl(
  chiave: string,
  predefinito: number,
): [number, (v: number) => void] {
  const [v, set] = useParametroUrl(chiave, String(predefinito));
  const n = Number.parseInt(v, 10);
  return [Number.isFinite(n) ? n : predefinito, (x: number) => set(String(x))];
}
