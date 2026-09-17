import { useStore } from '../store/useStore';
import { ETICHETTE_DIARIO, SCALA, type CampoDiario } from '../lib/diario';
import { Card, SectionTitle, cx } from './ui';

const CAMPI: CampoDiario[] = ['energia', 'fame', 'dolori'];

/** Tre numeri al giorno: energia, fame, dolori. Alimentano la logica dello scarico. */
export function DiarioSensazioni({ data }: { data: string }) {
  const voce = useStore((s) => s.diario[data]);
  const setDiario = useStore((s) => s.setDiario);

  return (
    <>
      <SectionTitle>Come ti senti</SectionTitle>
      <Card>
        <div className="space-y-3">
          {CAMPI.map((campo) => {
            const info = ETICHETTE_DIARIO[campo];
            const valore = voce?.[campo];
            return (
              <div key={campo}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-soft">{info.label}</span>
                  <span className="text-[10px] text-muted">
                    1 {info.basso} · 5 {info.alto}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {SCALA.map((n) => (
                    <button
                      key={n}
                      onClick={() => setDiario(data, { [campo]: n })}
                      aria-label={`${info.label} ${n}`}
                      className={cx(
                        'h-9 flex-1 rounded-xl border text-sm font-semibold tabular-nums transition-colors',
                        valore === n
                          ? 'border-brand-500 bg-brand-500 text-onbrand'
                          : 'border-line bg-raise text-soft',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!voce && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Serve a capire prima dei carichi quando il recupero non tiene: quattro giorni segnati e
            l'app comincia a tenerne conto nello scarico.
          </p>
        )}
      </Card>
    </>
  );
}
