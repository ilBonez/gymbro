import { eachDayOfInterval, endOfMonth, endOfWeek, isSameMonth, startOfMonth } from 'date-fns';
import { AnelliCompatti, anelliGiornata } from '../Anelli';
import { cx } from '../ui';
import { useStore } from '../../store/useStore';
import { useGiornate } from '../../lib/useGiornata';
import { COLORE_STATO, statoGiorno } from '../../lib/giornata';
import { GIORNI_IT, inizioSettimana, key, oggi } from '../../lib/date';
import { RiepilogoCard } from './RiepilogoCard';
import { LegendaStati } from './LegendaStati';

/** Il mese come griglia: anelli piccoli dove ci sono dati, pallino di stato dove no. */
export function GrigliaMese({ mese, onApri }: { mese: Date; onApri: (k: string) => void }) {
  const primo = startOfMonth(mese);
  const celle = eachDayOfInterval({
    start: inizioSettimana(primo),
    end: endOfWeek(endOfMonth(mese), { weekStartsOn: 1 }),
  });

  const giornate = useGiornate(celle.map(key));
  const obiettivi = useStore((s) => s.obiettiviAttivita);
  const today = oggi();

  const delMese = giornate.filter((_, i) => isSameMonth(celle[i], primo));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 px-0.5 pb-1">
        {GIORNI_IT.map((g) => (
          <p key={g} className="text-center text-[10px] font-semibold uppercase text-muted">
            {g.slice(0, 1)}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {giornate.map((g, i) => {
          const d = celle[i];
          const fuori = !isSameMonth(d, primo);
          const isToday = g.data === today;
          const stato = statoGiorno(g, today);
          const attivita =
            g.kcalMovimento > 0 || g.passi > 0 || g.minutiEsercizio > 0 || g.sonnoMin > 0;

          return (
            <button
              key={g.data}
              onClick={() => onApri(g.data)}
              aria-label={g.data}
              className={cx(
                'flex aspect-[5/6] flex-col items-center justify-start gap-0.5 rounded-xl border pt-1 transition-colors',
                isToday
                  ? 'border-brand-500/60 bg-brand-500/8'
                  : 'border-line/60 bg-surface hover:bg-raise',
                fuori && 'opacity-35',
              )}
            >
              <span
                className={cx(
                  'text-[11px] font-semibold leading-none tabular-nums',
                  isToday ? 'text-brandink' : 'text-soft',
                )}
              >
                {d.getDate()}
              </span>

              <span className="grid h-[26px] place-items-center">
                {attivita && (
                  <AnelliCompatti
                    anelli={anelliGiornata(
                      {
                        kcal: g.kcalMovimento,
                        minutiEsercizio: g.minutiEsercizio,
                        passi: g.passi,
                        sonnoMin: g.sonnoMin,
                      },
                      obiettivi,
                    )}
                    dimensione={26}
                  />
                )}
              </span>

              {/* i pallini restano anche dove ci sono gli anelli: dicono cosa era in programma */}
              <span className="flex h-2 items-center gap-0.5">
                {stato !== 'libero' && (
                  <span className={cx('block h-1.5 w-1.5 rounded-full', COLORE_STATO[stato])} />
                )}
                {g.pasti.length > 0 && <span className="block h-1.5 w-1.5 rounded-full bg-prot" />}
              </span>
            </button>
          );
        })}
      </div>

      <LegendaStati />
      <RiepilogoCard giornate={delMese} titolo="Totale del mese" />
    </div>
  );
}
