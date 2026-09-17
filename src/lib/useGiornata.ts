import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { componiGiornata, componiPeriodo, type Fonti, type Giornata } from './giornata';

/** Le sorgenti grezze dallo store, in un oggetto stabile. */
export function useFonti(): Fonti {
  const piano = useStore((s) => s.piano);
  const sessioni = useStore((s) => s.sessioni);
  const sessioniCardio = useStore((s) => s.sessioniCardio);
  const giorniSalute = useStore((s) => s.giorniSalute);
  const pasti = useStore((s) => s.pasti);
  const pesi = useStore((s) => s.pesi);
  const pesoKg = useStore((s) => s.profile?.pesoKg ?? 75);

  return useMemo(
    () => ({ piano, sessioni, sessioniCardio, giorniSalute, pasti, pesi, pesoKg }),
    [piano, sessioni, sessioniCardio, giorniSalute, pasti, pesi, pesoKg],
  );
}

export function useGiornata(data: string): Giornata {
  const f = useFonti();
  return useMemo(() => componiGiornata(data, f), [data, f]);
}

export function useGiornate(chiavi: string[]): Giornata[] {
  const f = useFonti();
  // le chiavi arrivano da un array ricreato a ogni render: confrontiamo il contenuto
  const firma = chiavi.join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => componiPeriodo(firma ? firma.split('|') : [], f), [firma, f]);
}
