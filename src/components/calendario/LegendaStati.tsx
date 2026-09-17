import { COLORE_STATO, ETICHETTA_STATO_GIORNO, type StatoGiorno } from '../../lib/giornata';
import { cx } from '../ui';

const MOSTRATI: StatoGiorno[] = ['fatto', 'previsto', 'saltato', 'cardio', 'riposo'];

/** Che cosa vuol dire ogni colore nelle griglie. */
export function LegendaStati() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
      {MOSTRATI.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 text-[10px] text-muted">
          <span className={cx('block h-2 w-2 rounded-full', COLORE_STATO[s])} />
          {ETICHETTA_STATO_GIORNO[s]}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-[10px] text-muted">
        <span className="block h-2 w-2 rounded-full bg-prot" />
        Pasti registrati
      </span>
    </div>
  );
}
