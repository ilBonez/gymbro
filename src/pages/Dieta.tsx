import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Clock, Pill, Plus, RefreshCw, Search, ShoppingCart } from 'lucide-react';
import { RECIPES } from '../data/recipes';
import { useStore } from '../store/useStore';
import { useTargets } from '../lib/useTargets';
import { MOMENTO_LABEL, generaGiornoDieta, listaSpesaDaPasti, fmtQta, totaliGiorno, suggerimentiCompletamento } from '../lib/diet';
import { MacroBlock } from '../components/MacroRow';
import { Button, Card, Chip, SectionTitle, Tag, cx, inputCls } from '../components/ui';
import { key, oggi } from '../lib/date';
import { GOAL_RULES } from '../lib/nutrition';
import { addDays } from 'date-fns';

export default function Dieta() {
  const [tab, setTab] = useState<'oggi' | 'ricette'>('oggi');
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dieta</h1>
      <div className="mt-3 flex gap-2">
        <Chip active={tab === 'oggi'} onClick={() => setTab('oggi')}>Menu di oggi</Chip>
        <Chip active={tab === 'ricette'} onClick={() => setTab('ricette')}>Ricette</Chip>
      </div>
      {tab === 'oggi' ? <MenuOggi /> : <Ricettario />}
    </div>
  );
}

function MenuOggi() {
  const today = oggi();
  const piano = useStore((s) => s.piano);
  const pasti = useStore((s) => s.pasti);
  const addPasto = useStore((s) => s.addPasto);
  const removePasto = useStore((s) => s.removePasto);
  const aggiungiLista = useStore((s) => s.aggiungiListaSpesa);

  const allenamentoOggi = !!piano[today]?.workoutId;
  const targets = useTargets(allenamentoOggi);
  const [msg, setMsg] = useState('');

  const menu = useMemo(
    () => (targets ? generaGiornoDieta(today, targets.goal, targets.macro, allenamentoOggi) : []),
    [targets, today, allenamentoOggi],
  );

  if (!targets) return null;

  const totale = totaliGiorno(menu);
  const completamenti = suggerimentiCompletamento(totale, targets.macro);
  const pastiOggi = pasti.filter((p) => p.data === today);
  const consumati = pastiOggi.reduce(
    (t, p) => ({
      kcal: t.kcal + p.kcal,
      proteine: t.proteine + p.proteine,
      carbs: t.carbs + p.carbs,
      grassi: t.grassi + p.grassi,
    }),
    { kcal: 0, proteine: 0, carbs: 0, grassi: 0 },
  );

  const generaSpesa = () => {
    const settimana = Array.from({ length: 7 }, (_, i) => {
      const d = key(addDays(new Date(), i));
      const allena = !!piano[d]?.workoutId;
      return generaGiornoDieta(d, targets.goal, targets.macro, allena);
    });
    const voci = listaSpesaDaPasti(settimana);
    const n = aggiungiLista(
      voci.map((v) => ({
        nome: v.nome,
        qta: fmtQta(v),
        categoria: v.categoria,
        foodId: v.foodId,
        ricercaUrl: v.ricercaUrl,
        preso: false,
        manuale: false,
      })),
    );
    setMsg(n > 0 ? `${n} prodotti aggiunti alla lista della spesa.` : 'La lista era già aggiornata.');
  };

  return (
    <div>
      <SectionTitle>Bilancio di oggi</SectionTitle>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Tag tone="brand">{GOAL_RULES[targets.goal].label}</Tag>
          <span className="text-[11px] text-ink-400">
            {allenamentoOggi ? 'Giorno di allenamento' : 'Giorno di riposo'}
          </span>
        </div>
        <MacroBlock
          kcal={consumati.kcal}
          kcalTarget={targets.macro.kcal}
          proteine={consumati.proteine}
          carbs={consumati.carbs}
          grassi={consumati.grassi}
          tProteine={targets.macro.proteine}
          tCarbs={targets.macro.carbs}
          tGrassi={targets.macro.grassi}
        />
        <p className="mt-3 text-[11px] text-ink-400">
          Obiettivo acqua: {targets.macro.acquaLitri} l · fibre {targets.macro.fibre} g
        </p>
      </Card>

      <SectionTitle
        action={
          <Link to="/integratori" className="inline-flex items-center gap-1 text-xs text-brand-400">
            <Pill size={12} /> Integratori
          </Link>
        }
      >
        Menu suggerito
      </SectionTitle>

      <div className="space-y-2.5">
        {menu.map((p) => {
          const registrato = pastiOggi.find((x) => x.recipeId === p.recipe.id && x.momento === p.momento);
          return (
            <Card key={p.momento} className="!p-0 overflow-hidden">
              <div className="flex items-start gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                      {MOMENTO_LABEL[p.momento]}
                    </span>
                    {p.porzioni !== 1 && <Tag>×{p.porzioni}</Tag>}
                  </div>
                  <Link to={`/dieta/ricetta/${p.recipe.id}`} className="mt-1 block">
                    <h3 className="text-sm font-semibold leading-snug">{p.recipe.nome}</h3>
                  </Link>
                  <p className="mt-1 text-[11px] tabular-nums text-ink-400">
                    {p.kcal} kcal · P {p.proteine} · C {p.carbs} · G {p.grassi}
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Clock size={10} /> {p.recipe.tempoMin}′
                    </span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    registrato
                      ? removePasto(registrato.id)
                      : addPasto({
                          data: today,
                          momento: p.momento,
                          recipeId: p.recipe.id,
                          nome: p.recipe.nome,
                          porzioni: p.porzioni,
                          kcal: p.kcal,
                          proteine: p.proteine,
                          carbs: p.carbs,
                          grassi: p.grassi,
                        })
                  }
                  className={cx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors',
                    registrato ? 'border-brand-500 bg-brand-500 text-ink-950' : 'border-ink-600 text-ink-400',
                  )}
                  aria-label={registrato ? 'Rimuovi dal diario' : 'Segna come mangiato'}
                >
                  {registrato ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-3 !py-3">
        <p className="text-[11px] uppercase tracking-wide text-ink-400">Totale del menu suggerito</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            ['kcal', totale.kcal, targets.macro.kcal],
            ['Prot', totale.proteine, targets.macro.proteine],
            ['Carb', totale.carbs, targets.macro.carbs],
            ['Gras', totale.grassi, targets.macro.grassi],
          ].map(([k, v, t]) => (
            <div key={k as string} className="rounded-xl bg-ink-800 py-2">
              <p className="text-sm font-bold tabular-nums">{v}</p>
              <p className="text-[10px] text-ink-400">
                {k} · obiettivo {t}
              </p>
            </div>
          ))}
        </div>
        {completamenti.length > 0 ? (
          <div className="mt-3 space-y-1.5 border-t border-ink-700/60 pt-3">
            <p className="text-[11px] font-semibold text-ink-300">Per chiudere i macro</p>
            {completamenti.map((c) => (
              <p key={c.macro} className="text-[11px] leading-snug text-ink-400">
                · {c.testo}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-ink-400">
            Il menu copre i target: aggiusta le porzioni di 20-30 g e resti dentro il margine.
          </p>
        )}
      </Card>

      <div className="mt-5 space-y-2">
        <Button full variant="ghost" onClick={generaSpesa}>
          <ShoppingCart size={15} className="mr-1.5 -mt-0.5 inline" /> Genera lista spesa (7 giorni)
        </Button>
        {msg && <p className="text-center text-xs text-brand-400">{msg}</p>}
        <p className="text-center text-[11px] text-ink-400">
          <RefreshCw size={10} className="mr-1 -mt-0.5 inline" />
          Il menu cambia ogni giorno ma resta stabile durante la giornata.
        </p>
      </div>
    </div>
  );
}

function Ricettario() {
  const [q, setQ] = useState('');
  const [fase, setFase] = useState<string>('tutte');
  const obiettivo = useStore((s) => s.profile?.obiettivo);

  const fasi = ['tutte', 'definizione', 'forza', 'massa', 'mantenimento'];

  const risultati = RECIPES.filter((r) => {
    if (fase !== 'tutte' && !r.fasi.includes(fase as never)) return false;
    const t = q.trim().toLowerCase();
    if (t && !r.nome.toLowerCase().includes(t) && !(r.tags ?? []).join(' ').includes(t)) return false;
    return true;
  });

  return (
    <div>
      <div className="relative mt-4">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca ricetta… (es. pancake)"
          className={cx(inputCls, 'pl-10')}
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {fasi.map((f) => (
          <Chip key={f} active={fase === f} onClick={() => setFase(f)}>
            {f === 'tutte' ? 'Tutte le fasi' : f}
            {f === obiettivo && ' ★'}
          </Chip>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-400">{risultati.length} ricette</p>

      <div className="mt-2 space-y-2">
        {risultati.map((r) => (
          <Link key={r.id} to={`/dieta/ricetta/${r.id}`} className="block">
            <Card className="!p-3.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{r.nome}</h3>
                  <p className="mt-0.5 text-[11px] tabular-nums text-ink-400">
                    {r.macro.kcal} kcal · P {r.macro.proteine} · C {r.macro.carbs} · G {r.macro.grassi} ·{' '}
                    {r.tempoMin}′
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {r.momenti.slice(0, 2).map((m) => (
                      <Tag key={m}>{MOMENTO_LABEL[m]}</Tag>
                    ))}
                    {(r.tags ?? []).slice(0, 2).map((t) => (
                      <Tag key={t} tone="brand">{t}</Tag>
                    ))}
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ink-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
