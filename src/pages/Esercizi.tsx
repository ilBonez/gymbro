import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Star } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import type { Equipment, MuscleGroup } from '../data/exercises';
import { useStore } from '../store/useStore';
import { Card, Chip, Empty, Tag, cx, inputCls } from '../components/ui';

const GRUPPI: (MuscleGroup | 'tutti')[] = [
  'tutti', 'petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti',
  'quadricipiti', 'femorali', 'glutei', 'polpacci', 'core', 'avambracci', 'full-body',
];

const ATTREZZI: (Equipment | 'tutti')[] = [
  'tutti', 'bilanciere', 'manubri', 'macchina', 'cavi', 'corpo-libero', 'kettlebell', 'elastico', 'cardio',
];

export default function Esercizi() {
  const preferiti = useStore((s) => s.preferiti);
  const [q, setQ] = useState('');
  const [gruppo, setGruppo] = useState<(typeof GRUPPI)[number]>('tutti');
  const [attrezzo, setAttrezzo] = useState<(typeof ATTREZZI)[number]>('tutti');
  const [soloPreferiti, setSoloPreferiti] = useState(false);

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (soloPreferiti && !preferiti.includes(e.id)) return false;
      if (gruppo !== 'tutti' && !e.gruppi.includes(gruppo)) return false;
      if (attrezzo !== 'tutti' && e.attrezzatura !== attrezzo) return false;
      if (t && !e.nome.toLowerCase().includes(t) && !e.gruppi.join(' ').includes(t)) return false;
      return true;
    });
  }, [q, gruppo, attrezzo, soloPreferiti, preferiti]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Libreria esercizi</h1>
      <p className="mt-1 text-sm text-muted">{EXERCISES.length} esercizi con esecuzione e alternative.</p>

      <div className="relative mt-4">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca esercizio…"
          className={cx(inputCls, 'pl-10')}
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={soloPreferiti} onClick={() => setSoloPreferiti((v) => !v)}>
          <Star size={11} className="mr-1 -mt-0.5 inline" fill={soloPreferiti ? 'currentColor' : 'none'} />
          Preferiti
        </Chip>
        {GRUPPI.map((g) => (
          <Chip key={g} active={gruppo === g} onClick={() => setGruppo(g)}>
            {g === 'tutti' ? 'Tutti i muscoli' : g}
          </Chip>
        ))}
      </div>

      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {ATTREZZI.map((a) => (
          <Chip key={a} active={attrezzo === a} onClick={() => setAttrezzo(a)}>
            {a === 'tutti' ? 'Tutti gli attrezzi' : a}
          </Chip>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">{risultati.length} risultati</p>

      <div className="mt-2 space-y-2">
        {risultati.length === 0 && <Empty title="Nessun esercizio trovato" sub="Prova a togliere qualche filtro." />}
        {risultati.map((e) => (
          <Link key={e.id} to={`/esercizi/${e.id}`} className="block">
            <Card className="!p-3.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold">{e.nome}</h3>
                    {preferiti.includes(e.id) && <Star size={12} className="shrink-0 text-brandink" fill="currentColor" />}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Tag tone="brand">{e.gruppi[0]}</Tag>
                    <Tag>{e.attrezzatura}</Tag>
                    <Tag>{e.tipo}</Tag>
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
