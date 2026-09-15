import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, isSameDay } from 'date-fns';
import { CalendarRange, ChevronLeft, ChevronRight, Dumbbell, Flame, Footprints, HeartPulse, Moon, Trash2, UtensilsCrossed } from 'lucide-react';
import { PROGRAMS } from '../data/programs';
import { useStore } from '../store/useStore';
import { Button, Card, Empty, SectionTitle, Sheet, cx } from '../components/ui';
import { GIORNI_IT, inizioSettimana, key, labelMese, oggi, settimana } from '../lib/date';
import { GOAL_RULES, macroTargets } from '../lib/nutrition';
import { kcalCardio, kcalScheda } from '../lib/burn';
import { fmtSonno, kcalMovimento } from '../lib/health';
import { useTargets } from '../lib/useTargets';

export default function Piano() {
  const piano = useStore((s) => s.piano);
  const giorniSalute = useStore((s) => s.giorniSalute);
  const setGiorno = useStore((s) => s.setGiorno);
  const svuotaGiorno = useStore((s) => s.svuotaGiorno);
  const svuotaPiano = useStore((s) => s.svuotaPiano);
  const targets = useTargets(true);

  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState<string | null>(null);

  const base = addDays(inizioSettimana(), offset * 7);
  const giorni = settimana(base);
  const today = oggi();

  const selGiorno = sel ? piano[sel] : undefined;
  const selProg = selGiorno ? PROGRAMS.find((p) => p.id === selGiorno.programId) : undefined;

  const pianificati = Object.keys(piano).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Il tuo piano</h1>
          <p className="mt-1 text-sm text-muted">Tocca un giorno per assegnare scheda o riposo.</p>
        </div>
        {pianificati > 0 && (
          <button
            onClick={() => confirm('Svuotare tutto il calendario?') && svuotaPiano()}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-raise hover:text-red-300"
            aria-label="Svuota piano"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line/70 bg-surface px-2 py-2">
        <button onClick={() => setOffset((o) => o - 1)} className="rounded-lg p-2 text-soft hover:bg-raise">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize">{labelMese(base)}</p>
          <button onClick={() => setOffset(0)} className="text-[11px] text-brandink">
            {offset === 0 ? 'Settimana corrente' : 'Torna a oggi'}
          </button>
        </div>
        <button onClick={() => setOffset((o) => o + 1)} className="rounded-lg p-2 text-soft hover:bg-raise">
          <ChevronRight size={18} />
        </button>
      </div>

      {pianificati === 0 && (
        <div className="mt-4">
          <Empty
            icon={<CalendarRange size={26} />}
            title="Calendario vuoto"
            sub="Scegli un programma: l'app riempie le settimane con schede, cardio e dieta abbinata."
            action={
              <Link to="/allena">
                <Button>Scegli un programma</Button>
              </Link>
            }
          />
        </div>
      )}

      <SectionTitle>Settimana</SectionTitle>
      <div className="space-y-2">
        {giorni.map((d, i) => {
          const k = key(d);
          const g = piano[k];
          const prog = g ? PROGRAMS.find((p) => p.id === g.programId) : undefined;
          const w = prog?.workouts.find((x) => x.id === g?.workoutId);
          const isToday = isSameDay(d, new Date());
          const salute = giorniSalute[k];
          // se non ci sono ancora dati reali mostriamo quanto costerebbe il giorno pianificato
          const stimaKcal =
            targets && w
              ? kcalScheda(w, prog!.goal, targets.pesoKg)
              : targets && g?.cardio
                ? kcalCardio(g.cardio.tipo, g.cardio.durataMin, targets.pesoKg)
                : 0;

          return (
            <button
              key={k}
              onClick={() => setSel(k)}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
                isToday ? 'border-brand-500/50 bg-brand-500/8' : 'border-line/70 bg-surface',
              )}
            >
              <div className="w-11 shrink-0 text-center">
                <p className="text-[10px] font-semibold uppercase text-muted">{GIORNI_IT[i]}</p>
                <p className={cx('text-lg font-bold tabular-nums leading-tight', isToday && 'text-brandink')}>
                  {d.getDate()}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                {w ? (
                  <>
                    <p className="truncate text-sm font-semibold">{w.nome}</p>
                    <p className="truncate text-[11px] text-muted">
                      {w.focus} · {w.durataMin} min
                    </p>
                  </>
                ) : g ? (
                  <>
                    <p className="text-sm font-medium text-soft">
                      {g.cardio ? 'Cardio' : 'Riposo'}
                    </p>
                    <p className="text-[11px] text-muted">
                      {g.cardio
                        ? `${g.cardio.tipo} · ${g.cardio.durataMin} min`
                        : (g.note ?? 'Recupero attivo: camminata, mobilità, sonno')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">— libero</p>
                )}

                {(salute || stimaKcal > 0) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted">
                    {salute && kcalMovimento(salute) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Flame size={10} className="text-brand-500" />
                        {kcalMovimento(salute).toLocaleString('it-IT')} kcal
                      </span>
                    )}
                    {!salute && stimaKcal > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Flame size={10} className="text-brand-500" />~
                        {stimaKcal.toLocaleString('it-IT')} kcal previste
                      </span>
                    )}
                    {salute && salute.passi > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Footprints size={10} className="text-prot" />
                        {salute.passi.toLocaleString('it-IT')}
                      </span>
                    )}
                    {salute && salute.sonnoMin > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Moon size={10} className="text-sonno" />
                        {fmtSonno(salute.sonnoMin)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {prog && (
                <span className="shrink-0">
                  {w ? (
                    <Dumbbell size={16} className="text-brandink" />
                  ) : g?.cardio ? (
                    <HeartPulse size={16} className="text-carb" />
                  ) : (
                    <Moon size={16} className="text-muted" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {targets && (
        <>
          <SectionTitle action={<Link to="/dieta" className="text-xs text-brandink">Vai alla dieta</Link>}>
            Dieta della settimana
          </SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brandink">
                <UtensilsCrossed size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold">{GOAL_RULES[targets.goal].label}</p>
                <p className="text-[11px] text-muted">
                  {targets.macro.kcal} kcal · P {targets.macro.proteine} / C {targets.macro.carbs} / G{' '}
                  {targets.macro.grassi} g nei giorni di allenamento
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ?? ''}>
        {sel && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Programma</p>
              <div className="space-y-2">
                {PROGRAMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      setGiorno({
                        data: sel,
                        programId: p.id,
                        workoutId: selGiorno?.programId === p.id ? selGiorno.workoutId : p.workouts[0].id,
                      })
                    }
                    className={cx(
                      'w-full rounded-xl border px-3.5 py-2.5 text-left text-sm',
                      selGiorno?.programId === p.id
                        ? 'border-brand-500 bg-brand-500/10 text-brandink'
                        : 'border-line bg-raise text-soft',
                    )}
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
            </div>

            {selProg && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Scheda del giorno</p>
                <div className="space-y-2">
                  {selProg.workouts.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setGiorno({ data: sel, programId: selProg.id, workoutId: w.id })}
                      className={cx(
                        'w-full rounded-xl border px-3.5 py-2.5 text-left',
                        selGiorno?.workoutId === w.id
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-line bg-raise',
                      )}
                    >
                      <span className="block text-sm font-medium">{w.nome}</span>
                      <span className="block text-[11px] text-muted">{w.focus}</span>
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setGiorno({
                        data: sel,
                        programId: selProg.id,
                        workoutId: null,
                        cardio: selProg.cardio
                          ? { tipo: selProg.cardio.tipo, durataMin: selProg.cardio.durataMin }
                          : null,
                      })
                    }
                    className={cx(
                      'w-full rounded-xl border px-3.5 py-2.5 text-left',
                      selGiorno && selGiorno.workoutId === null
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-line bg-raise',
                    )}
                  >
                    <span className="block text-sm font-medium">Riposo / solo cardio</span>
                    <span className="block text-[11px] text-muted">
                      {selProg.cardio
                        ? `${selProg.cardio.tipo}, ${selProg.cardio.durataMin} min`
                        : 'Recupero completo'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {selGiorno && (
              <Button full variant="danger" onClick={() => { svuotaGiorno(sel); setSel(null); }}>
                Libera il giorno
              </Button>
            )}

            {targets && (
              <p className="text-[11px] text-muted">
                Dieta di quel giorno:{' '}
                {selGiorno?.workoutId
                  ? `${targets.macro.kcal} kcal (allenamento)`
                  : `${macroTargets(targets.goal, targets.pesoKg, targets.tdee, false).kcal} kcal (riposo)`}
                . {sel === today && 'È oggi.'}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
