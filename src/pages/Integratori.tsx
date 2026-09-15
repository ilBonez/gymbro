import { AlertTriangle, Check, Info } from 'lucide-react';
import { SUPPLEMENTS, TIMING_LABEL } from '../data/supplements';
import type { Timing } from '../data/supplements';
import { useStore } from '../store/useStore';
import { Card, SectionTitle, Tag, Warn, cx } from '../components/ui';
import { oggi } from '../lib/date';

const ORDINE: Timing[] = ['pre-workout', 'post-workout', 'mattina', 'pranzo', 'sera', 'a-piacere'];

export default function Integratori() {
  const attivi = useStore((s) => s.integratoriAttivi);
  const toggle = useStore((s) => s.toggleIntegratore);
  const log = useStore((s) => s.logIntegratori);
  const segna = useStore((s) => s.segnaIntegratore);
  const obiettivo = useStore((s) => s.profile?.obiettivo);
  const today = oggi();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Integratori</h1>
      <p className="mt-1 text-sm text-ink-400">
        Attiva quelli che usi: compaiono nella checklist della home, ordinati per momento della giornata.
      </p>

      <div className="mt-4">
        <Warn>
          <AlertTriangle size={14} className="mr-1.5 -mt-0.5 inline" />
          Gli integratori sono un contorno: contano molto meno di dieta, sonno e costanza in palestra. Se prendi
          farmaci o hai patologie, chiedi al medico prima di iniziarne uno.
        </Warn>
      </div>

      {ORDINE.map((t) => {
        const gruppo = SUPPLEMENTS.filter((s) => s.timing === t);
        if (gruppo.length === 0) return null;
        return (
          <div key={t}>
            <SectionTitle>{TIMING_LABEL[t]}</SectionTitle>
            <div className="space-y-2.5">
              {gruppo.map((s) => {
                const on = attivi.includes(s.id);
                const preso = !!log[`${today}|${s.id}`];
                const consigliato = obiettivo ? s.fasi.includes(obiettivo) : false;
                return (
                  <Card key={s.id} className={cx(on && '!border-brand-500/35')}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggle(s.id)}
                        className={cx(
                          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors',
                          on ? 'border-brand-500 bg-brand-500 text-ink-950' : 'border-ink-600',
                        )}
                        aria-label={on ? 'Disattiva' : 'Attiva'}
                      >
                        {on && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold">{s.nome}</h3>
                          <Tag tone={s.evidenza === 'alta' ? 'brand' : s.evidenza === 'media' ? 'carb' : 'neutral'}>
                            evidenza {s.evidenza}
                          </Tag>
                          {consigliato && !on && <Tag tone="brand">adatto al tuo obiettivo</Tag>}
                        </div>

                        <p className="mt-1.5 text-sm font-medium text-brand-300">{s.dose}</p>
                        <p className="mt-0.5 text-xs text-ink-300">{s.quando}</p>
                        <p className="mt-2 text-xs leading-relaxed text-ink-400">{s.perche}</p>

                        {s.attenzioni && (
                          <ul className="mt-2.5 space-y-1">
                            {s.attenzioni.map((a, i) => (
                              <li key={i} className="flex gap-2 text-[11px] leading-snug text-carb/90">
                                <Info size={12} className="mt-0.5 shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}

                        {on && (
                          <button
                            onClick={() => segna(today, s.id, !preso)}
                            className={cx(
                              'mt-3 rounded-lg px-3 py-1.5 text-xs font-medium',
                              preso ? 'bg-brand-500 text-ink-950' : 'bg-ink-800 text-ink-300',
                            )}
                          >
                            {preso ? 'Preso oggi ✓' : 'Segna come preso oggi'}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="mt-6 text-[11px] leading-relaxed text-ink-400">
        Fonti dei dosaggi: linee guida ISSN e EFSA per caffeina, creatina e proteine. I valori indicati sono
        riferimenti per adulti sani.
      </p>
    </div>
  );
}
