import { PROGRAMS } from '../../data/programs';
import { useStore } from '../../store/useStore';
import { useTargets } from '../../lib/useTargets';
import { macroTargets } from '../../lib/nutrition';
import { Button, Sheet, cx } from '../ui';
import { labelLungo, oggi } from '../../lib/date';

/** Foglio per assegnare a un giorno una scheda, il cardio o il riposo. */
export function AssegnaGiorno({ data, onClose }: { data: string | null; onClose: () => void }) {
  const piano = useStore((s) => s.piano);
  const setGiorno = useStore((s) => s.setGiorno);
  const svuotaGiorno = useStore((s) => s.svuotaGiorno);
  const targets = useTargets(true);

  const corrente = data ? piano[data] : undefined;
  const prog = corrente ? PROGRAMS.find((p) => p.id === corrente.programId) : undefined;

  return (
    <Sheet
      open={!!data}
      onClose={onClose}
      title={data ? labelLungo(data).replace(/^\w/, (c) => c.toUpperCase()) : ''}
    >
      {data && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Programma</p>
            <div className="space-y-2">
              {PROGRAMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    setGiorno({
                      data,
                      programId: p.id,
                      workoutId: corrente?.programId === p.id ? corrente.workoutId : p.workouts[0].id,
                    })
                  }
                  className={cx(
                    'w-full rounded-xl border px-3.5 py-2.5 text-left text-sm',
                    corrente?.programId === p.id
                      ? 'border-brand-500 bg-brand-500/10 text-brandink'
                      : 'border-line bg-raise text-soft',
                  )}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>

          {prog && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Scheda del giorno
              </p>
              <div className="space-y-2">
                {prog.workouts.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setGiorno({ data, programId: prog.id, workoutId: w.id })}
                    className={cx(
                      'w-full rounded-xl border px-3.5 py-2.5 text-left',
                      corrente?.workoutId === w.id
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
                      data,
                      programId: prog.id,
                      workoutId: null,
                      cardio: prog.cardio
                        ? {
                            tipo: prog.cardio.tipo,
                            modalita: prog.cardio.modalita,
                            durataMin: prog.cardio.durataMin,
                          }
                        : null,
                    })
                  }
                  className={cx(
                    'w-full rounded-xl border px-3.5 py-2.5 text-left',
                    corrente && corrente.workoutId === null
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-line bg-raise',
                  )}
                >
                  <span className="block text-sm font-medium">Riposo / solo cardio</span>
                  <span className="block text-[11px] text-muted">
                    {prog.cardio
                      ? `${prog.cardio.tipo}, ${prog.cardio.durataMin} min`
                      : 'Recupero completo'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {corrente && (
            <Button
              full
              variant="danger"
              onClick={() => {
                svuotaGiorno(data);
                onClose();
              }}
            >
              Libera il giorno
            </Button>
          )}

          {targets && (
            <p className="text-[11px] text-muted">
              Dieta di quel giorno:{' '}
              {corrente?.workoutId
                ? `${targets.macro.kcal} kcal (allenamento)`
                : `${macroTargets(targets.goal, targets.pesoKg, targets.tdee, false).kcal} kcal (riposo)`}
              . {data === oggi() && 'È oggi.'}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
