import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTargets } from '../lib/useTargets';
import { analizzaSettimana, etichettaSettimana, settimaneDisponibili } from '../lib/aderenza';
import { Card, Empty, SectionTitle, cx } from './ui';
import { GIORNI_IT } from '../lib/date';
import { useNumeroUrl } from '../lib/urlState';

/** Quanto ha seguito la dieta questa settimana, e cosa ne è venuto fuori sul peso. */
export function Aderenza() {
  const profile = useStore((s) => s.profile);
  const pasti = useStore((s) => s.pasti);
  const piano = useStore((s) => s.piano);
  const pesi = useStore((s) => s.pesi);
  const targets = useTargets(true);

  const [offset, setOffset] = useNumeroUrl('sett', 0);
  const maxIndietro = useMemo(() => settimaneDisponibili(pasti), [pasti]);

  const a = useMemo(
    () => (profile && targets ? analizzaSettimana(profile, targets.tdee, pasti, piano, pesi, offset) : null),
    [profile, targets, pasti, piano, pesi, offset],
  );

  if (!a) return null;

  const maxKcal = Math.max(...a.giorni.map((g) => Math.max(g.kcalAssunte, g.kcalTarget)), 1);

  return (
    <>
      <SectionTitle
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset(Math.max(-(maxIndietro - 1), offset - 1))}
              disabled={offset <= -(maxIndietro - 1)}
              className="rounded p-1 text-muted disabled:opacity-30"
              aria-label="Settimana precedente"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="min-w-24 text-center text-[11px] text-muted">
              {etichettaSettimana(offset)}
            </span>
            <button
              onClick={() => setOffset(Math.min(0, offset + 1))}
              disabled={offset >= 0}
              className="rounded p-1 text-muted disabled:opacity-30"
              aria-label="Settimana successiva"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        }
      >
        Aderenza alla dieta
      </SectionTitle>

      {a.giorniRegistrati === 0 ? (
        <Empty
          icon={<UtensilsCrossed size={24} />}
          title="Nessun pasto registrato"
          sub="Segna quello che mangi dalla scheda Dieta: qui vedrai se il piano viene seguito davvero e cosa succede al peso."
        />
      ) : (
        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Media giornaliera</p>
              <p className="text-2xl font-bold tabular-nums">
                {a.mediaAssunte ?? '—'}
                <span className="ml-1 text-sm font-medium text-muted">/ {a.mediaTarget} kcal</span>
              </p>
            </div>
            {a.scartoMedio !== null && (
              <span
                className={cx(
                  'shrink-0 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums',
                  Math.abs(a.scartoMedio) <= 100
                    ? 'bg-brand-500/12 text-brandink'
                    : 'bg-carb/12 text-carb',
                )}
              >
                {a.scartoMedio > 0 ? '+' : ''}
                {a.scartoMedio} kcal
              </span>
            )}
          </div>

          {/* una colonna per giorno: barra piena = assunte, tacca = target */}
          <div className="mt-4 flex items-end gap-1.5" style={{ height: 96 }}>
            {a.giorni.map((g, i) => {
              const hAssunte = (g.kcalAssunte / maxKcal) * 100;
              const hTarget = (g.kcalTarget / maxKcal) * 100;
              const dentro = g.registrato && Math.abs(g.scarto) <= g.kcalTarget * 0.1;
              return (
                <div key={g.data} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative w-full flex-1">
                    <div
                      className="absolute inset-x-0 border-t border-dashed border-line2"
                      style={{ bottom: `${hTarget}%` }}
                    />
                    <div
                      className={cx(
                        'absolute inset-x-0 bottom-0 rounded-t-md transition-all',
                        !g.registrato
                          ? 'bg-line'
                          : dentro
                            ? 'bg-brand-500'
                            : g.scarto > 0
                              ? 'bg-carb'
                              : 'bg-prot',
                      )}
                      style={{ height: `${Math.max(hAssunte, g.registrato ? 3 : 2)}%` }}
                    />
                  </div>
                  <span className={cx('text-[9px]', g.allenamento ? 'font-bold text-brandink' : 'text-muted')}>
                    {GIORNI_IT[i]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] text-muted">
            <span>
              <b className="text-ink">{a.giorniRegistrati}/7</b> giorni registrati
            </span>
            <span>
              <b className="text-ink">{a.giorniInLinea}</b> entro il 10% dal target
            </span>
            {a.variazionePesoKg !== null && (
              <span>
                peso{' '}
                <b className={a.variazionePesoKg < 0 ? 'text-brandink' : 'text-ink'}>
                  {a.variazionePesoKg > 0 ? '+' : ''}
                  {a.variazionePesoKg} kg
                </b>
              </span>
            )}
          </div>

          <p
            className={cx(
              'mt-3 text-[11px] leading-relaxed',
              a.affidabile ? 'text-soft' : 'text-carb',
            )}
          >
            {a.commento}
          </p>

          <p className="mt-2 text-[10px] text-muted">
            I giorni in grassetto sono quelli di allenamento, dove il target è più alto. La riga
            tratteggiata è il target del giorno.
          </p>
        </Card>
      )}
    </>
  );
}
