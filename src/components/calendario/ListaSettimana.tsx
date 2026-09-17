import { CalendarCog, Dumbbell, Flame, Footprints, HeartPulse, Moon, UtensilsCrossed } from 'lucide-react';
import { AnelliCompatti, anelliGiornata } from '../Anelli';
import { cx } from '../ui';
import { useStore } from '../../store/useStore';
import { useGiornate } from '../../lib/useGiornata';
import { statoGiorno } from '../../lib/giornata';
import { useTargets } from '../../lib/useTargets';
import { kcalCardio, kcalScheda, nomeCardio } from '../../lib/burn';
import { fmtSonno } from '../../lib/health';
import { GIORNI_IT, key, oggi } from '../../lib/date';
import { RiepilogoCard } from './RiepilogoCard';

/** La settimana come elenco: una riga per giorno, con quello che è successo. */
export function ListaSettimana({
  giorni,
  onApri,
  onAssegna,
}: {
  giorni: Date[];
  onApri: (k: string) => void;
  onAssegna: (k: string) => void;
}) {
  const chiavi = giorni.map(key);
  const giornate = useGiornate(chiavi);
  const obiettivi = useStore((s) => s.obiettiviAttivita);
  const targets = useTargets(true);
  const today = oggi();

  return (
    <div>
      <div className="space-y-2">
        {giornate.map((g, i) => {
          const isToday = g.data === today;
          const stato = statoGiorno(g, today);
          const attivita =
            g.kcalMovimento > 0 || g.passi > 0 || g.minutiEsercizio > 0 || g.sonnoMin > 0;
          const stima =
            targets && g.scheda && g.programma
              ? kcalScheda(g.scheda, g.programma.goal, targets.pesoKg)
              : targets && g.pianificato?.cardio
                ? kcalCardio(
                    g.pianificato.cardio.modalita,
                    g.pianificato.cardio.durataMin,
                    targets.pesoKg,
                  )
                : 0;

          return (
            <div
              key={g.data}
              className={cx(
                'flex items-center gap-3 rounded-2xl border pl-3.5 pr-1.5 transition-colors',
                isToday ? 'border-brand-500/50 bg-brand-500/8' : 'border-line/70 bg-surface',
              )}
            >
              <button
                onClick={() => onApri(g.data)}
                className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
              >
                <div className="w-10 shrink-0 text-center">
                  <p className="text-[10px] font-semibold uppercase text-muted">{GIORNI_IT[i]}</p>
                  <p
                    className={cx(
                      'text-lg font-bold leading-tight tabular-nums',
                      isToday && 'text-brandink',
                    )}
                  >
                    {giorni[i].getDate()}
                  </p>
                </div>

                {attivita ? (
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
                    dimensione={32}
                  />
                ) : (
                  <span className="w-8 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  {g.scheda ? (
                    <>
                      <p className="truncate text-sm font-semibold">{g.scheda.nome}</p>
                      <p className="truncate text-[11px] text-muted">
                        {g.scheda.focus} · {g.scheda.durataMin} min
                      </p>
                    </>
                  ) : g.pianificato?.cardio ? (
                    <>
                      <p className="text-sm font-medium text-soft">Cardio</p>
                      <p className="truncate text-[11px] text-muted">
                        {nomeCardio(g.pianificato.cardio.modalita)} ·{' '}
                        {g.pianificato.cardio.durataMin} min
                      </p>
                    </>
                  ) : g.pianificato ? (
                    <>
                      <p className="text-sm font-medium text-soft">Riposo</p>
                      <p className="truncate text-[11px] text-muted">
                        {g.pianificato.note ?? 'Recupero attivo'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">— libero</p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted">
                    {g.kcalMovimento > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Flame size={10} className="text-brand-500" />
                        {g.kcalMovimento.toLocaleString('it-IT')} kcal
                      </span>
                    ) : (
                      stima > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Flame size={10} className="text-brand-500" />~
                          {stima.toLocaleString('it-IT')} kcal previste
                        </span>
                      )
                    )}
                    {g.passi > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Footprints size={10} className="text-carb" />
                        {g.passi.toLocaleString('it-IT')}
                      </span>
                    )}
                    {g.sonnoMin > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Moon size={10} className="text-sonno" />
                        {fmtSonno(g.sonnoMin)}
                      </span>
                    )}
                    {g.pasti.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <UtensilsCrossed size={10} className="text-prot" />
                        {Math.round(g.kcalAssunte).toLocaleString('it-IT')} kcal
                      </span>
                    )}
                  </div>
                </div>

                <span className="shrink-0">
                  {stato === 'fatto' ? (
                    <Dumbbell size={16} className="text-brandink" />
                  ) : g.pianificato?.cardio ? (
                    <HeartPulse size={16} className="text-carb" />
                  ) : g.scheda ? (
                    <Dumbbell size={16} className="text-line2" />
                  ) : null}
                </span>
              </button>

              <button
                onClick={() => onAssegna(g.data)}
                aria-label={`Modifica ${g.data}`}
                className="shrink-0 self-stretch rounded-xl px-2 text-muted hover:bg-raise hover:text-ink"
              >
                <CalendarCog size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <RiepilogoCard giornate={giornate} titolo="Totale della settimana" />
    </div>
  );
}
