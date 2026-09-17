import { useMemo } from 'react';
import { BatteryLow, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { valutaDeload } from '../lib/deload';
import { segnaliRecenti } from '../lib/diario';
import { oggi } from '../lib/date';
import { Card, SectionTitle, cx } from './ui';

/** Segnale di scarico, dedotto dall'andamento dei massimali invece che dal calendario. */
export function Deload() {
  const sessioni = useStore((s) => s.sessioni);
  const obiettivo = useStore((s) => s.profile?.obiettivo);
  const diario = useStore((s) => s.diario);

  const d = useMemo(
    () => (obiettivo ? valutaDeload(sessioni, obiettivo, segnaliRecenti(diario, oggi())) : null),
    [sessioni, obiettivo, diario],
  );

  if (!d || d.esito === 'dati-insufficienti') return null;

  const grave = d.esito === 'calo';
  const attenzione = d.esito === 'stallo';

  const Icona = grave ? BatteryLow : attenzione ? TrendingDown : TrendingUp;

  return (
    <>
      <SectionTitle>Recupero</SectionTitle>
      <Card
        className={cx(
          grave && '!border-carb/40 !bg-carb/8',
          attenzione && '!border-line2',
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cx(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
              grave
                ? 'bg-carb/15 text-carb'
                : attenzione
                  ? 'bg-raise text-soft'
                  : 'bg-brand-500/12 text-brand-500',
            )}
          >
            <Icona size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={cx('text-sm font-semibold', grave && 'text-carb')}>{d.titolo}</h3>
            <p className="mt-1 text-xs leading-relaxed text-soft">{d.messaggio}</p>
          </div>
        </div>

        {(d.inCalo.length > 0 || d.fermi.length > 0 || d.inCrescita.length > 0) && (
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {[...d.inCalo, ...d.fermi, ...d.inCrescita].slice(0, 6).map((a) => (
              <li key={a.exerciseId} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="min-w-0 truncate text-soft">{a.nome}</span>
                <span
                  className={cx(
                    'shrink-0 tabular-nums font-semibold',
                    a.variazione > 0.4
                      ? 'text-brandink'
                      : a.variazione < -0.4
                        ? 'text-carb'
                        : 'text-muted',
                  )}
                >
                  {a.variazione > 0 ? '+' : ''}
                  {a.variazione} kg
                  <span className="ml-1 font-normal text-muted">({a.sedute} sedute)</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2.5 text-[10px] leading-relaxed text-muted">
          Variazione del massimale stimato negli ultimi {d.settimaneAnalizzate * 7} giorni, sui soli
          esercizi multiarticolari: sono quelli che raccontano se il recupero regge.
        </p>
      </Card>
    </>
  );
}
