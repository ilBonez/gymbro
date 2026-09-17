import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PencilLine, Plus, Search } from 'lucide-react';
import { RECIPES } from '../data/recipes';
import { useStore } from '../store/useStore';
import { MOMENTO_LABEL } from '../lib/diet';
import { Button, Card, Chip, Tag, cx, inputCls } from '../components/ui';
import { NAV_DIETA, SottoNav } from '../components/SottoNav';
import { ricettaMia } from '../lib/catalog';
import { useParametroUrl } from '../lib/urlState';

export default function DietaRicette() {
  const [q, setQ] = useParametroUrl('q', '');
  const [fase, setFase] = useParametroUrl('fase', 'tutte');
  const obiettivo = useStore((s) => s.profile?.obiettivo);
  const ricetteMie = useStore((s) => s.ricetteMie);

  const fasi = ['tutte', 'mie', 'definizione', 'forza', 'massa', 'mantenimento'];

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    // le tue in cima: sono poche e le cerchi piu' spesso di una delle 54 fisse
    return [...ricetteMie, ...RECIPES].filter((r) => {
      if (fase === 'mie' && !ricettaMia(r.id)) return false;
      if (fase !== 'tutte' && fase !== 'mie' && !r.fasi.includes(fase as never)) return false;
      if (t && !r.nome.toLowerCase().includes(t) && !(r.tags ?? []).join(' ').includes(t)) return false;
      return true;
    });
  }, [q, fase, ricetteMie]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dieta</h1>
      <SottoNav voci={NAV_DIETA} />

      <div className="relative mt-4">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
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
            {f === 'tutte' ? 'Tutte le fasi' : f === 'mie' ? `Le mie (${ricetteMie.length})` : f}
            {f === obiettivo && ' ★'}
          </Chip>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{risultati.length} ricette</p>
        <Link to="/dieta/ricetta/nuova">
          <Button variant="ghost" className="!py-1.5 !text-xs">
            <Plus size={13} className="mr-1 -mt-0.5 inline" /> Nuova ricetta
          </Button>
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        {risultati.map((r) => (
          <Link key={r.id} to={`/dieta/ricetta/${r.id}`} className="block">
            <Card className="!p-3.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {ricettaMia(r.id) && <PencilLine size={12} className="shrink-0 text-brandink" />}
                    {r.nome}
                  </h3>
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted">
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
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
