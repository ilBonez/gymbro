import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { RECIPES } from '../data/recipes';
import { useStore } from '../store/useStore';
import { MOMENTO_LABEL } from '../lib/diet';
import { Card, Chip, Tag, cx, inputCls } from '../components/ui';
import { NAV_DIETA, SottoNav } from '../components/SottoNav';
import { useParametroUrl } from '../lib/urlState';

export default function DietaRicette() {
  const [q, setQ] = useParametroUrl('q', '');
  const [fase, setFase] = useParametroUrl('fase', 'tutte');
  const obiettivo = useStore((s) => s.profile?.obiettivo);

  const fasi = ['tutte', 'definizione', 'forza', 'massa', 'mantenimento'];

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (fase !== 'tutte' && !r.fasi.includes(fase as never)) return false;
      if (t && !r.nome.toLowerCase().includes(t) && !(r.tags ?? []).join(' ').includes(t)) return false;
      return true;
    });
  }, [q, fase]);

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
            {f === 'tutte' ? 'Tutte le fasi' : f}
            {f === obiettivo && ' ★'}
          </Chip>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">{risultati.length} ricette</p>

      <div className="mt-2 space-y-2">
        {risultati.map((r) => (
          <Link key={r.id} to={`/dieta/ricetta/${r.id}`} className="block">
            <Card className="!p-3.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{r.nome}</h3>
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
