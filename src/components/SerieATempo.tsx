import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { cx } from './ui';

/**
 * Conto alla rovescia per le serie che si misurano a tempo: plank, hollow hold,
 * camminata del contadino. Finora l'app chiedeva di scrivere "40" in un campo
 * chiamato ripetizioni, e il cronometro non c'era.
 *
 * A zero segna la serie come fatta, registrando i secondi effettivamente tenuti:
 * se si molla prima e si ferma il timer, viene salvato il tempo reale.
 */
export function SerieATempo({
  secondiTarget,
  fatto,
  secondiFatti,
  onFine,
  beep,
}: {
  secondiTarget: number;
  fatto: boolean;
  secondiFatti: number | null;
  onFine: (secondi: number) => void;
  beep: () => void;
}) {
  const [restano, setRestano] = useState<number | null>(null);
  const finito = useRef(false);

  /**
   * `onFine` e `beep` arrivano come funzioni inline, quindi cambiano identita'
   * a ogni render del padre — e il padre si ridisegna col cronometro della
   * sessione. Tenendole fra le dipendenze dell'effetto, il timeout veniva
   * azzerato e ricreato in continuazione e il conto alla rovescia non partiva.
   */
  const cb = useRef({ onFine, beep });
  cb.current = { onFine, beep };

  useEffect(() => {
    if (restano === null) return;

    if (restano <= 0) {
      if (!finito.current) {
        finito.current = true;
        cb.current.beep();
        cb.current.onFine(secondiTarget);
      }
      setRestano(null);
      return;
    }
    const id = setTimeout(() => setRestano((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [restano, secondiTarget]);

  const inCorso = restano !== null;

  // fermare il timer a metà registra il tempo davvero tenuto
  const ferma = () => {
    const tenuti = secondiTarget - (restano ?? 0);
    setRestano(null);
    if (tenuti > 0) cb.current.onFine(tenuti);
  };

  if (fatto && !inCorso) {
    return (
      <button
        onClick={() => {
          finito.current = false;
          setRestano(secondiTarget);
        }}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-raise text-xs tabular-nums text-soft"
      >
        <RotateCcw size={12} />
        {secondiFatti ?? secondiTarget}s
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        if (inCorso) ferma();
        else {
          finito.current = false;
          setRestano(secondiTarget);
        }
      }}
      className={cx(
        'flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold tabular-nums transition-colors',
        inCorso
          ? 'border-brand-500 bg-brand-500/12 text-brandink'
          : 'border-line2 text-soft',
      )}
      aria-label={inCorso ? 'Ferma il tempo' : 'Avvia il tempo'}
    >
      {inCorso ? (
        `${restano}s`
      ) : (
        <>
          <Play size={12} fill="currentColor" />
          {secondiTarget}s
        </>
      )}
    </button>
  );
}
