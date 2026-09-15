import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock, Dumbbell, HeartPulse, Layers } from 'lucide-react';
import { PROGRAMS } from '../data/programs';
import { useStore } from '../store/useStore';
import { Card, SectionTitle, Tag, cx } from '../components/ui';
import { GOAL_RULES } from '../lib/nutrition';

export default function Allena() {
  const obiettivo = useStore((s) => s.profile?.obiettivo);

  const ordinati = [...PROGRAMS].sort(
    (a, b) => (b.goal === obiettivo ? 1 : 0) - (a.goal === obiettivo ? 1 : 0),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Allenamento</h1>
      <p className="mt-1 text-sm text-ink-400">
        Quattro blocchi pronti. Scegline uno e appoggialo sul calendario.
      </p>

      <Link
        to="/esercizi"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-700/70 bg-ink-850 px-4 py-3.5"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/12 text-brand-400">
          <BookOpen size={17} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">Libreria esercizi</span>
          <span className="block text-xs text-ink-400">Schede, esecuzione, errori, alternative</span>
        </span>
        <ChevronRight size={17} className="text-ink-400" />
      </Link>

      <SectionTitle>Programmi</SectionTitle>
      <div className="space-y-3">
        {ordinati.map((p) => (
          <Link key={p.id} to={`/allena/programma/${p.id}`} className="block">
            <Card className={cx(p.goal === obiettivo && '!border-brand-500/40')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-base font-bold leading-tight">{p.nome}</h3>
                    {p.goal === obiettivo && <Tag tone="brand">Il tuo obiettivo</Tag>}
                  </div>
                  <p className="mt-1 text-sm leading-snug text-ink-300">{p.descrizione}</p>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-ink-400" />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {p.durataSettimane} settimane
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Dumbbell size={13} /> {p.giorniSettimana}×/sett
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={13} /> {p.workouts.length} schede
                </span>
                {p.cardio && (
                  <span className="inline-flex items-center gap-1.5 text-carb">
                    <HeartPulse size={13} /> cardio {p.cardio.frequenzaSettimana}×
                  </span>
                )}
              </div>

              <p className="mt-2.5 text-[11px] text-ink-400">
                Dieta abbinata: {GOAL_RULES[p.goal].label}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
