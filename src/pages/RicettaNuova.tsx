import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { FOODS } from '../data/foods';
import type { Meal, Recipe, RecipeIngredient } from '../data/recipes';
import { useStore } from '../store/useStore';
import { ricetta, ricettaMia } from '../lib/catalog';
import { MOMENTI, MOMENTO_LABEL } from '../lib/diet';
import { contaIngredienti, fasiSuggerite, perPorzione, problemi } from '../lib/ricetteMie';
import { Button, Card, Chip, Field, SectionTitle, Sheet, Warn, cx, inputCls } from '../components/ui';

const FASI: Recipe['fasi'] = ['definizione', 'forza', 'massa', 'mantenimento'];
const UNITA: RecipeIngredient['unita'][] = ['g', 'ml', 'pz', 'cucchiaio', 'q.b.'];

/** Scrittura e modifica di una ricetta dell'utente. */
export default function RicettaNuova() {
  const nav = useNavigate();
  const { id } = useParams();
  const esistente = id ? ricetta(id) : undefined;
  // arrivando da un pasto registrato a mano i valori sono gia' noti: li portiamo dentro
  const [params] = useSearchParams();
  const daPasto = params.get('kcal')
    ? {
        nome: params.get('nome') ?? '',
        momento: params.get('momento') as Meal | null,
        macro: {
          kcal: Number(params.get('kcal')) || 0,
          proteine: Number(params.get('p')) || 0,
          carbs: Number(params.get('c')) || 0,
          grassi: Number(params.get('g')) || 0,
        },
      }
    : null;
  const salvaRicetta = useStore((s) => s.salvaRicetta);
  const eliminaRicetta = useStore((s) => s.eliminaRicetta);

  const [nome, setNome] = useState(esistente?.nome ?? daPasto?.nome ?? '');
  const [porzioni, setPorzioni] = useState(esistente?.porzioni ?? 1);
  const [tempoMin, setTempoMin] = useState(esistente?.tempoMin ?? 10);
  const [momenti, setMomenti] = useState<Meal[]>(
    esistente?.momenti ?? (daPasto?.momento ? [daPasto.momento] : []),
  );
  const [fasi, setFasi] = useState<Recipe['fasi']>(esistente?.fasi ?? []);
  const [ingredienti, setIngredienti] = useState<RecipeIngredient[]>(esistente?.ingredienti ?? []);
  const [procedimento, setProcedimento] = useState((esistente?.procedimento ?? []).join('\n'));
  const [aMano, setAMano] = useState(!!daPasto);
  const [macroMano, setMacroMano] = useState(
    esistente?.macro ?? daPasto?.macro ?? { kcal: 0, proteine: 0, carbs: 0, grassi: 0 },
  );
  const [cerca, setCerca] = useState<'' | 'catalogo' | 'libero'>('');
  const [errore, setErrore] = useState<string[]>([]);

  const conto = useMemo(() => contaIngredienti(ingredienti), [ingredienti]);
  const calcolati = perPorzione(conto, porzioni);
  const macro = aMano ? macroMano : calcolati;

  const cambiaIngrediente = (i: number, patch: Partial<RecipeIngredient>) =>
    setIngredienti((prec) => prec.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const salva = () => {
    const p = problemi({ nome, momenti, macro });
    if (p.length > 0) {
      setErrore(p);
      return;
    }
    const nuovo: Omit<Recipe, 'id'> & { id?: string } = {
      id: esistente && ricettaMia(esistente.id) ? esistente.id : undefined,
      nome: nome.trim(),
      momenti,
      fasi: fasi.length > 0 ? fasi : fasiSuggerite(macro),
      porzioni: Math.max(1, porzioni),
      tempoMin: Math.max(0, tempoMin),
      ingredienti,
      procedimento: procedimento
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      macro,
      tags: ['mia'],
    };
    const nuovoId = salvaRicetta(nuovo);
    nav(`/dieta/ricetta/${nuovoId}`, { replace: true });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {esistente ? 'Modifica ricetta' : 'Nuova ricetta'}
      </h1>
      <p className="mt-1 text-sm text-muted">
        I macro si calcolano dagli ingredienti pesati. Se un alimento non c'è, scrivi i valori a
        mano.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="es. Pancake proteici al cacao"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Porzioni" hint="I macro mostrati sono per una porzione.">
            <input
              type="number"
              min={1}
              value={porzioni}
              onChange={(e) => setPorzioni(Math.max(1, Number(e.target.value) || 1))}
              className={inputCls}
            />
          </Field>
          <Field label="Tempo (min)">
            <input
              type="number"
              min={0}
              value={tempoMin}
              onChange={(e) => setTempoMin(Math.max(0, Number(e.target.value) || 0))}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      <SectionTitle>Ingredienti</SectionTitle>
      <Card className="!p-3">
        {ingredienti.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted">
            Nessun ingrediente. Prendili dal catalogo per avere i macro calcolati da soli.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {ingredienti.map((i, k) => (
              <li key={k} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.nome}</p>
                  <p className="text-[11px] text-muted">
                    {i.foodId ? 'dal catalogo' : 'scritto a mano'}
                    {i.unita !== 'g' && i.unita !== 'ml' && ' · non entra nei macro'}
                  </p>
                </div>
                {i.unita !== 'q.b.' && (
                  <input
                    type="number"
                    min={0}
                    value={i.qta}
                    onChange={(e) => cambiaIngrediente(k, { qta: Number(e.target.value) || 0 })}
                    className="w-16 rounded-lg border border-line bg-raise px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-brand-500"
                  />
                )}
                <select
                  value={i.unita}
                  onChange={(e) =>
                    cambiaIngrediente(k, { unita: e.target.value as RecipeIngredient['unita'] })
                  }
                  className="rounded-lg border border-line bg-raise px-1.5 py-1.5 text-xs outline-none focus:border-brand-500"
                >
                  {UNITA.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIngredienti((p) => p.filter((_, x) => x !== k))}
                  aria-label={`Togli ${i.nome}`}
                  className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-400"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={() => setCerca('catalogo')}>
            <Search size={14} className="mr-1.5 -mt-0.5 inline" /> Dal catalogo
          </Button>
          <Button variant="ghost" onClick={() => setCerca('libero')}>
            <Plus size={14} className="mr-1.5 -mt-0.5 inline" /> A mano
          </Button>
        </div>
      </Card>

      <SectionTitle>Macro per porzione</SectionTitle>
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <Chip active={!aMano} onClick={() => setAMano(false)}>
            Calcolati ({conto.contati} {conto.contati === 1 ? 'ingrediente' : 'ingredienti'})
          </Chip>
          <Chip
            active={aMano}
            onClick={() => {
              if (!aMano) setMacroMano(calcolati);
              setAMano(true);
            }}
          >
            A mano
          </Chip>
        </div>

        {aMano ? (
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['kcal', 'Calorie'],
                ['proteine', 'Proteine (g)'],
                ['carbs', 'Carboidrati (g)'],
                ['grassi', 'Grassi (g)'],
              ] as const
            ).map(([campo, label]) => (
              <Field key={campo} label={label}>
                <input
                  type="number"
                  min={0}
                  value={macroMano[campo]}
                  onChange={(e) =>
                    setMacroMano((m) => ({ ...m, [campo]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ['kcal', calcolati.kcal],
                ['P', calcolati.proteine],
                ['C', calcolati.carbs],
                ['G', calcolati.grassi],
              ].map(([label, v]) => (
                <div key={label}>
                  <p className="text-base font-bold tabular-nums">{v}</p>
                  <p className="text-[10px] text-muted">{label}</p>
                </div>
              ))}
            </div>
            {conto.scoperti > 0 && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                {conto.scoperti}{' '}
                {conto.scoperti === 1 ? 'ingrediente non conta' : 'ingredienti non contano'} nei
                macro: i pezzi e le voci scritte a mano non hanno valori nutrizionali. Se pesano,
                passa ai grammi o scrivi i macro a mano.
              </p>
            )}
          </>
        )}
      </Card>

      <SectionTitle>Quando</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {MOMENTI.map((m) => (
          <Chip
            key={m}
            active={momenti.includes(m)}
            onClick={() =>
              setMomenti((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))
            }
          >
            {MOMENTO_LABEL[m]}
          </Chip>
        ))}
      </div>

      <SectionTitle>Fase</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FASI.map((f) => (
          <Chip
            key={f}
            active={fasi.includes(f)}
            onClick={() => setFasi((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))}
          >
            {f}
          </Chip>
        ))}
      </div>
      {fasi.length === 0 && (
        <p className="mt-2 text-[11px] text-muted">
          Se non scegli, la assegniamo dai carboidrati: {fasiSuggerite(macro).join(', ')}.
        </p>
      )}

      <SectionTitle>Procedimento</SectionTitle>
      <textarea
        value={procedimento}
        onChange={(e) => setProcedimento(e.target.value)}
        rows={5}
        placeholder={'Un passaggio per riga.\nes. Monta gli albumi con le proteine.'}
        className={cx(inputCls, 'resize-y')}
      />

      {errore.length > 0 && (
        <div className="mt-4">
          <Warn>{errore.join(' ')}</Warn>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Button full onClick={salva}>
          Salva ricetta
        </Button>
        {esistente && ricettaMia(esistente.id) && (
          <Button
            full
            variant="danger"
            onClick={() => {
              if (!confirm(`Eliminare "${esistente.nome}"?`)) return;
              eliminaRicetta(esistente.id);
              nav('/dieta/ricette', { replace: true });
            }}
          >
            <Trash2 size={14} className="mr-1.5 -mt-0.5 inline" /> Elimina ricetta
          </Button>
        )}
      </div>

      <SceltaIngrediente
        modo={cerca}
        onClose={() => setCerca('')}
        onAggiungi={(i) => {
          setIngredienti((p) => [...p, i]);
          setCerca('');
        }}
      />
    </div>
  );
}

/** Foglio per aggiungere un ingrediente, dal catalogo o scritto a mano. */
function SceltaIngrediente({
  modo,
  onClose,
  onAggiungi,
}: {
  modo: '' | 'catalogo' | 'libero';
  onClose: () => void;
  onAggiungi: (i: RecipeIngredient) => void;
}) {
  const [q, setQ] = useState('');
  const [nome, setNome] = useState('');
  const [qta, setQta] = useState(100);
  const [unita, setUnita] = useState<RecipeIngredient['unita']>('g');

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return FOODS.slice(0, 15);
    return FOODS.filter((f) => f.nome.toLowerCase().includes(t)).slice(0, 30);
  }, [q]);

  return (
    <Sheet
      open={modo !== ''}
      onClose={onClose}
      title={modo === 'catalogo' ? 'Dal catalogo' : 'Ingrediente a mano'}
    >
      {modo === 'catalogo' ? (
        <div>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca alimento…"
              className={cx(inputCls, 'pl-10')}
            />
          </div>
          <ul className="mt-3 divide-y divide-line/60">
            {risultati.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() =>
                    onAggiungi({
                      foodId: f.id,
                      nome: f.nome,
                      qta: f.unita === 'pz' ? 100 : f.porzioneTipica,
                      unita: f.unita === 'pz' ? 'g' : f.unita,
                    })
                  }
                  className="w-full py-2.5 text-left"
                >
                  <span className="block text-sm font-medium">{f.nome}</span>
                  <span className="block text-[11px] tabular-nums text-muted">
                    {f.kcal} kcal · P {f.proteine} · C {f.carbs} · G {f.grassi} — per 100{' '}
                    {f.unita === 'ml' ? 'ml' : 'g'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Nome" hint="Non entra nei macro: quelli li scrivi a mano più sotto.">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="es. salsa della nonna"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantità">
              <input
                type="number"
                min={0}
                value={qta}
                onChange={(e) => setQta(Number(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>
            <Field label="Unità">
              <select
                value={unita}
                onChange={(e) => setUnita(e.target.value as RecipeIngredient['unita'])}
                className={inputCls}
              >
                {UNITA.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button
            full
            disabled={nome.trim().length < 2}
            onClick={() => {
              onAggiungi({ nome: nome.trim(), qta, unita });
              setNome('');
              setQta(100);
            }}
          >
            Aggiungi
          </Button>
        </div>
      )}
    </Sheet>
  );
}
