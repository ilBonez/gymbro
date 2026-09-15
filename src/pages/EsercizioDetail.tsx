import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, Repeat, Star, TrendingUp, Trophy } from 'lucide-react';
import { esercizio } from '../lib/catalog';
import { useStore } from '../store/useStore';
import { Card, SectionTitle, Tag, cx } from '../components/ui';
import { Sparkline } from '../components/Sparkline';
import { affidabile, storicoEsercizio } from '../lib/progressione';

export default function EsercizioDetail() {
  const { id = '' } = useParams();
  const e = esercizio(id);
  const preferiti = useStore((s) => s.preferiti);
  const toggle = useStore((s) => s.togglePreferito);
  const sessioni = useStore((s) => s.sessioni);

  if (!e) return <Navigate to="/esercizi" replace />;

  const preferito = preferiti.includes(e.id);

  const storico = storicoEsercizio(sessioni, e.id);
  const migliore = storico.length ? [...storico].sort((a, b) => b.stima - a.stima)[0] : null;
  const ultimo = storico[storico.length - 1];
  const progresso =
    storico.length >= 2 ? +(ultimo.stima - storico[0].stima).toFixed(1) : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{e.nome}</h1>
        <button
          onClick={() => toggle(e.id)}
          className={cx(
            'shrink-0 rounded-xl border p-2.5 transition-colors',
            preferito ? 'border-brand-500 bg-brand-500/12 text-brandink' : 'border-line text-muted',
          )}
          aria-label="Preferito"
        >
          <Star size={17} fill={preferito ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {e.gruppi.map((g, i) => (
          <Tag key={g} tone={i === 0 ? 'brand' : 'neutral'}>{g}</Tag>
        ))}
        <Tag>{e.attrezzatura}</Tag>
        <Tag>{e.tipo}</Tag>
        <Tag tone="carb">{e.livello}</Tag>
      </div>

      {e.tempoConsigliato && (
        <p className="mt-3 text-xs text-muted">
          Tempo consigliato: <span className="font-semibold text-ink-200">{e.tempoConsigliato}</span>{' '}
          (eccentrica-pausa-concentrica)
        </p>
      )}

      <SectionTitle>Esecuzione</SectionTitle>
      <Card>
        <ol className="space-y-2.5">
          {e.esecuzione.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm leading-snug text-ink-200">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-500/15 text-[11px] font-bold text-brandink">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
      </Card>

      <SectionTitle>Errori da evitare</SectionTitle>
      <Card>
        <ul className="space-y-2">
          {e.errori.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-snug text-soft">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-carb" />
              {p}
            </li>
          ))}
        </ul>
      </Card>

      {e.sostituti && e.sostituti.length > 0 && (
        <>
          <SectionTitle>Alternative</SectionTitle>
          <div className="space-y-2">
            {e.sostituti.map((sid) => {
              const s = esercizio(sid);
              if (!s) return null;
              return (
                <Link key={sid} to={`/esercizi/${sid}`} className="block">
                  <Card className="!p-3.5">
                    <div className="flex items-center gap-3">
                      <Repeat size={15} className="shrink-0 text-muted" />
                      <span className="flex-1 truncate text-sm font-medium">{s.nome}</span>
                      <ChevronRight size={16} className="shrink-0 text-muted" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {migliore && (
        <>
          <SectionTitle>I tuoi carichi</SectionTitle>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
                  <Trophy size={12} className="text-brand-500" /> Record
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {migliore.kg} kg × {migliore.reps}
                </p>
                <p className="text-[11px] text-muted">{migliore.data}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-muted">Massimale stimato</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-brandink">
                  {migliore.stima} kg
                </p>
                {!affidabile(migliore.reps) && (
                  <p className="text-[10px] text-carb">stima poco attendibile sopra le 12 rip.</p>
                )}
              </div>
            </div>

            {storico.length >= 2 && (
              <div className="mt-3 border-t border-line pt-3">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-muted">Massimale stimato, {storico.length} sedute</span>
                  {progresso !== null && progresso !== 0 && (
                    <span
                      className={cx(
                        'inline-flex items-center gap-1 font-semibold',
                        progresso > 0 ? 'text-brandink' : 'text-carb',
                      )}
                    >
                      <TrendingUp size={11} className={progresso < 0 ? 'rotate-180' : undefined} />
                      {progresso > 0 ? '+' : ''}
                      {progresso} kg
                    </span>
                  )}
                </div>
                <Sparkline valori={storico.map((p) => p.stima)} />
              </div>
            )}

            <ul className="mt-3 divide-y divide-line/60 border-t border-line pt-1">
              {[...storico]
                .reverse()
                .slice(0, 6)
                .map((h, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-soft">{h.data}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold">
                        {h.kg} kg × {h.reps}
                      </span>
                      <span className="ml-2 text-[11px] text-muted">1RM ~{h.stima}</span>
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
