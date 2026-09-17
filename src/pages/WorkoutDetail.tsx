import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Flame, Music, PencilLine, Play, Snowflake, Timer } from 'lucide-react';
import { esercizio, programma, scheda, schedaMia } from '../lib/catalog';
import { useStore } from '../store/useStore';
import { Button, Card, SectionTitle, Tag } from '../components/ui';
import type { LoggedExercise } from '../types';
import { MusicaSheet } from '../components/MusicaSheet';
import { kcalScheda } from '../lib/burn';
import { suggerimentoCarico, ultimaEsecuzione } from '../lib/progressione';
import { useTargets } from '../lib/useTargets';

export default function WorkoutDetail() {
  const { programId = '', workoutId = '' } = useParams();
  const nav = useNavigate();
  const prog = programma(programId);
  const w = scheda(programId, workoutId);

  const inizia = useStore((s) => s.iniziaSessione);
  const attiva = useStore((s) => s.sessioneAttiva);
  const sessioni = useStore((s) => s.sessioni);
  const targets = useTargets(true);
  const [musica, setMusica] = useState(false);

  if (!prog || !w) return <Navigate to="/allena" replace />;

  const start = () => {
    if (attiva && !confirm('Hai già un allenamento in corso. Vuoi scartarlo e iniziare questo?')) return;

    const esercizi: LoggedExercise[] = w.esercizi.map((e) => {
      const ultima = ultimaEsecuzione(sessioni, e.exerciseId)?.esercizio;
      const sug = suggerimentoCarico(e, ultima);
      return {
        exerciseId: e.exerciseId,
        serie: Array.from({ length: e.serie }, (_, i) => ({
          reps: ultima?.serie[i]?.reps ?? null,
          // il carico parte da quello suggerito dalla progressione
          kg: sug.kg ?? ultima?.serie[i]?.kg ?? null,
          fatto: false,
        })),
      };
    });
    inizia(prog.id, w.id, esercizi);
    nav('/sessione');
  };

  return (
    <div>
      <Tag>{prog.nome}</Tag>
      <div className="flex items-start justify-between gap-3">
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{w.nome}</h1>
        {schedaMia(w.id) && (
          <Link
            to={`/allena/scheda/${w.id}/modifica`}
            aria-label="Modifica scheda"
            className="mt-3 shrink-0 rounded-lg p-2 text-muted hover:bg-raise hover:text-ink"
          >
            <PencilLine size={17} />
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-soft">{w.focus}</p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
        <Timer size={13} /> ~{w.durataMin} minuti · {w.esercizi.length}{' '}
        {w.esercizi.length === 1 ? 'esercizio' : 'esercizi'}
        {targets && (
          <>
            {' · '}
            <span className="text-brandink">~{kcalScheda(w, prog.goal, targets.pesoKg)} kcal</span>
          </>
        )}
      </p>

      {w.riscaldamento.length > 0 && (
        <>
          <SectionTitle>Riscaldamento</SectionTitle>
          <Card>
            <ul className="space-y-1.5 text-sm text-soft">
              {w.riscaldamento.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <Flame size={14} className="mt-0.5 shrink-0 text-carb" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <SectionTitle>Esercizi</SectionTitle>
      <div className="space-y-2.5">
        {w.esercizi.map((e, i) => {
          const ex = esercizio(e.exerciseId);
          return (
            <Link key={e.exerciseId + i} to={`/esercizi/${e.exerciseId}`} className="block">
              <Card className="!p-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-raise text-xs font-bold text-soft">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{ex?.nome ?? e.exerciseId}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {e.serie} × {e.ripetizioni} · recupero {e.recuperoSec}s
                      {e.rpe ? ` · ${e.rpe}` : ''}
                    </p>
                    {e.note && <p className="mt-0.5 text-[11px] text-brandink">{e.note}</p>}
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {w.defaticamento && w.defaticamento.length > 0 && (
        <>
          <SectionTitle>Defaticamento</SectionTitle>
          <Card>
            <ul className="space-y-1.5 text-sm text-soft">
              {w.defaticamento.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <Snowflake size={14} className="mt-0.5 shrink-0 text-sky-400" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <div className="sticky bottom-24 mt-6 -mx-4 bg-gradient-to-t from-page via-page/95 to-transparent px-4 pb-2 pt-6">
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={() => setMusica(true)} className="shrink-0">
            <Music size={16} />
          </Button>
          <Button full onClick={start}>
            <Play size={15} className="mr-1.5 -mt-0.5 inline" fill="currentColor" /> Inizia sessione
          </Button>
        </div>
      </div>

      <MusicaSheet open={musica} onClose={() => setMusica(false)} chiave={w.id} titolo={w.nome} />
    </div>
  );
}
