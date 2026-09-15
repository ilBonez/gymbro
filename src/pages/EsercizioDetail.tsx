import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, ListOrdered, Repeat, Star } from 'lucide-react';
import { esercizio } from '../lib/catalog';
import { useStore } from '../store/useStore';
import { Card, SectionTitle, Tag, cx } from '../components/ui';

export default function EsercizioDetail() {
  const { id = '' } = useParams();
  const e = esercizio(id);
  const preferiti = useStore((s) => s.preferiti);
  const toggle = useStore((s) => s.togglePreferito);
  const sessioni = useStore((s) => s.sessioni);

  if (!e) return <Navigate to="/esercizi" replace />;

  const preferito = preferiti.includes(e.id);

  const storico = sessioni
    .flatMap((s) =>
      s.esercizi
        .filter((x) => x.exerciseId === e.id)
        .map((x) => ({
          data: s.data,
          migliore: x.serie
            .filter((st) => st.fatto && st.kg)
            .sort((a, b) => (b.kg ?? 0) - (a.kg ?? 0))[0],
        })),
    )
    .filter((x) => x.migliore)
    .slice(0, 5);

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

      {storico.length > 0 && (
        <>
          <SectionTitle>I tuoi carichi</SectionTitle>
          <Card className="!p-3.5">
            <ul className="divide-y divide-line/60">
              {storico.map((h, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-soft">
                    <ListOrdered size={13} className="text-muted" />
                    {h.data}
                  </span>
                  <span className="tabular-nums font-semibold">
                    {h.migliore?.kg} kg × {h.migliore?.reps}
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
