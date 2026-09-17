import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { cx } from '../ui';
import { useGiornate } from '../../lib/useGiornata';
import { COLORE_STATO, statoGiorno, type Giornata } from '../../lib/giornata';
import { key, oggi } from '../../lib/date';
import { RiepilogoCard } from './RiepilogoCard';
import { LegendaStati } from './LegendaStati';

/** Tutto l'anno in dodici mini-calendari. Un quadratino per giorno. */
export function GrigliaAnno({
  anno,
  onApri,
  onMese,
}: {
  anno: number;
  onApri: (k: string) => void;
  onMese: (d: Date) => void;
}) {
  const mesi = Array.from({ length: 12 }, (_, m) => new Date(anno, m, 1));
  const tutti = mesi.flatMap((m) =>
    eachDayOfInterval({ start: startOfMonth(m), end: endOfMonth(m) }),
  );
  const giornate = useGiornate(tutti.map(key));
  const perData = new Map(giornate.map((g) => [g.data, g]));
  const today = oggi();

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {mesi.map((m) => (
          <MiniMese
            key={m.getMonth()}
            mese={m}
            perData={perData}
            oggiK={today}
            onApri={onApri}
            onMese={onMese}
          />
        ))}
      </div>

      <LegendaStati />
      <RiepilogoCard giornate={giornate} titolo={`Totale ${anno}`} />
    </div>
  );
}

function MiniMese({
  mese,
  perData,
  oggiK,
  onApri,
  onMese,
}: {
  mese: Date;
  perData: Map<string, Giornata>;
  oggiK: string;
  onApri: (k: string) => void;
  onMese: (d: Date) => void;
}) {
  const giorni = eachDayOfInterval({ start: startOfMonth(mese), end: endOfMonth(mese) });
  // lunedì = 0: i giorni prima dell'inizio del mese restano vuoti
  const vuoti = (giorni[0].getDay() + 6) % 7;

  return (
    <div className="rounded-2xl border border-line/70 bg-surface p-2">
      <button
        onClick={() => onMese(mese)}
        className="mb-1.5 block w-full text-left text-[11px] font-semibold capitalize text-soft"
      >
        {format(mese, 'MMMM', { locale: it })}
      </button>

      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: vuoti }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {giorni.map((d) => {
          const k = key(d);
          const g = perData.get(k);
          const stato = g ? statoGiorno(g, oggiK) : 'libero';
          const attivo = !!g && (g.kcalMovimento > 0 || g.passi > 0);
          // niente due classi di sfondo insieme: vincerebbe l'ordine del CSS, non il nostro
          const sfondo =
            stato === 'libero' ? (attivo ? 'bg-line2/70' : 'bg-raise') : COLORE_STATO[stato];
          return (
            <button
              key={k}
              onClick={() => onApri(k)}
              aria-label={k}
              title={`${d.getDate()} · ${g && g.kcalMovimento > 0 ? `${g.kcalMovimento} kcal` : 'nessun dato'}`}
              className={cx(
                'aspect-square rounded-[3px] transition-transform active:scale-90',
                sfondo,
                k === oggiK && 'ring-1 ring-brand-500 ring-offset-1 ring-offset-surface',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
