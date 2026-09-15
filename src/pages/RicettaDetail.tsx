import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Check, Clock, ExternalLink, Minus, Plus, ShoppingCart, Users } from 'lucide-react';
import { alimento, ricetta } from '../lib/catalog';
import { useStore } from '../store/useStore';
import { MOMENTO_LABEL } from '../lib/diet';
import { Button, Card, SectionTitle, Tag } from '../components/ui';
import { oggi } from '../lib/date';

export default function RicettaDetail() {
  const { id = '' } = useParams();
  const r = ricetta(id);
  const addPasto = useStore((s) => s.addPasto);
  const aggiungiLista = useStore((s) => s.aggiungiListaSpesa);
  const [porzioni, setPorzioni] = useState(1);
  const [fatto, setFatto] = useState<'' | 'diario' | 'spesa'>('');

  if (!r) return <Navigate to="/dieta" replace />;

  const m = {
    kcal: Math.round(r.macro.kcal * porzioni),
    proteine: Math.round(r.macro.proteine * porzioni),
    carbs: Math.round(r.macro.carbs * porzioni),
    grassi: Math.round(r.macro.grassi * porzioni),
  };

  const inSpesa = () => {
    const n = aggiungiLista(
      r.ingredienti
        .filter((i) => i.unita !== 'q.b.')
        .map((i) => {
          const f = i.foodId ? alimento(i.foodId) : undefined;
          return {
            nome: f?.nome ?? i.nome,
            qta: `${Math.ceil(i.qta * porzioni)} ${i.unita}`,
            categoria: f?.categoria ?? 'dispensa',
            foodId: i.foodId,
            ricercaUrl: f?.ricercaUrl,
            preso: false,
            manuale: false,
          };
        }),
    );
    setFatto('spesa');
    if (n === 0) setTimeout(() => setFatto(''), 1800);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold leading-tight tracking-tight">{r.nome}</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {r.momenti.map((mm) => (
          <Tag key={mm}>{MOMENTO_LABEL[mm]}</Tag>
        ))}
        {r.fasi.map((f) => (
          <Tag key={f} tone="brand">{f}</Tag>
        ))}
        {(r.tags ?? []).map((t) => (
          <Tag key={t} tone="carb">{t}</Tag>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {r.tempoMin} min</span>
        <span className="inline-flex items-center gap-1.5"><Users size={13} /> ricetta per {r.porzioni} porz.</span>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-300">Porzioni</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPorzioni((p) => Math.max(0.5, +(p - 0.5).toFixed(1)))}
              className="grid h-8 w-8 place-items-center rounded-lg bg-ink-800 text-ink-300"
            >
              <Minus size={15} />
            </button>
            <span className="w-8 text-center text-lg font-bold tabular-nums">{porzioni}</span>
            <button
              onClick={() => setPorzioni((p) => Math.min(6, +(p + 0.5).toFixed(1)))}
              className="grid h-8 w-8 place-items-center rounded-lg bg-ink-800 text-ink-300"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ['kcal', m.kcal, 'text-ink-100'],
            ['Prot', m.proteine, 'text-prot'],
            ['Carb', m.carbs, 'text-carb'],
            ['Gras', m.grassi, 'text-fat'],
          ].map(([k, v, c]) => (
            <div key={k as string} className="rounded-xl bg-ink-800 py-2.5">
              <p className={`text-base font-bold tabular-nums ${c}`}>{v}</p>
              <p className="text-[10px] text-ink-400">{k}</p>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>Ingredienti</SectionTitle>
      <Card className="!p-3.5">
        <ul className="divide-y divide-ink-700/60">
          {r.ingredienti.map((i, idx) => {
            const f = i.foodId ? alimento(i.foodId) : undefined;
            return (
              <li key={idx} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 text-sm">
                  {f?.nome ?? i.nome}
                  {f?.marca && <span className="ml-1.5 text-[11px] text-ink-400">{f.marca}</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-ink-300">
                  {i.unita === 'q.b.' ? 'q.b.' : `${Math.round(i.qta * porzioni * 10) / 10} ${i.unita}`}
                </span>
                {f?.ricercaUrl && (
                  <a
                    href={f.ricercaUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="shrink-0 text-ink-400 hover:text-brand-400"
                    aria-label={`Cerca ${f.nome} su Eurospin`}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <SectionTitle>Procedimento</SectionTitle>
      <Card>
        <ol className="space-y-2.5">
          {r.procedimento.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm leading-snug text-ink-200">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-500/15 text-[11px] font-bold text-brand-400">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button variant="ghost" onClick={inSpesa}>
          {fatto === 'spesa' ? (
            <><Check size={15} className="mr-1.5 -mt-0.5 inline" /> In lista</>
          ) : (
            <><ShoppingCart size={15} className="mr-1.5 -mt-0.5 inline" /> Alla spesa</>
          )}
        </Button>
        <Button
          onClick={() => {
            addPasto({
              data: oggi(),
              momento: r.momenti[0],
              recipeId: r.id,
              nome: r.nome,
              porzioni,
              ...m,
            });
            setFatto('diario');
            setTimeout(() => setFatto(''), 1800);
          }}
        >
          {fatto === 'diario' ? (
            <><Check size={15} className="mr-1.5 -mt-0.5 inline" /> Aggiunto</>
          ) : (
            'Segna mangiato'
          )}
        </Button>
      </div>
    </div>
  );
}
