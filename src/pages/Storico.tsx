import { useState } from 'react';
import { ChevronDown, Dumbbell, Flame, HeartPulse, Timer, Trash2, Weight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { nomeEsercizio, scheda } from '../lib/catalog';
import { Button, Card, Empty, SectionTitle, Stat, Tag, cx } from '../components/ui';
import { NAV_ALLENA, SottoNav } from '../components/SottoNav';
import { nomeCardio } from '../lib/burn';
import { RegistraCardio } from '../components/RegistraCardio';
import { fmtDurata, giorniTra, labelLungo, oggi } from '../lib/date';

export default function Storico() {
  const sessioni = useStore((s) => s.sessioni);
  const sessioniCardio = useStore((s) => s.sessioniCardio);
  const removeCardio = useStore((s) => s.removeCardio);
  const [aperta, setAperta] = useState<string | null>(null);
  const [registra, setRegistra] = useState(false);

  const settimana = sessioni.filter((s) => giorniTra(s.data, oggi()) < 7);
  const volumeSettimana = settimana.reduce((t, s) => t + s.volumeKg, 0);
  const tempoTotale = sessioni.reduce((t, s) => t + s.durataSec, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Storico allenamenti</h1>
      <SottoNav voci={NAV_ALLENA} />

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat
          label="Sedute"
          value={sessioni.length}
          sub={
            sessioniCardio.length > 0
              ? `${settimana.length} questa sett. · ${sessioniCardio.length} cardio`
              : `${settimana.length} questa sett.`
          }
        />
        <Stat
          label="Volume 7gg"
          value={volumeSettimana >= 1000 ? (volumeSettimana / 1000).toFixed(1) : volumeSettimana}
          unit={volumeSettimana >= 1000 ? 't' : 'kg'}
          sub="peso sollevato"
        />
        <Stat label="Tempo" value={Math.round(tempoTotale / 3600)} unit="h" sub="totali" />
      </div>

      {sessioni.length === 0 ? (
        <div className="mt-5">
          <Empty
            icon={<Dumbbell size={26} />}
            title="Nessun allenamento registrato"
            sub="Le sessioni completate finiscono qui, con carichi e volume."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {sessioni.map((s) => {
            const w = scheda(s.programId, s.workoutId);
            const open = aperta === s.id;
            const serieFatte = s.esercizi.reduce((t, e) => t + e.serie.filter((x) => x.fatto).length, 0);
            return (
              <Card key={s.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setAperta(open ? null : s.id)}
                  className="flex w-full items-center gap-3 p-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{w?.nome ?? s.workoutId}</h3>
                    <p className="mt-0.5 text-[11px] capitalize text-muted">{labelLungo(s.data)}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Timer size={11} /> {fmtDurata(s.durataSec)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Weight size={11} /> {s.volumeKg.toLocaleString('it-IT')} kg
                      </span>
                      <span>{serieFatte} serie</span>
                    </div>
                  </div>
                  <ChevronDown size={17} className={cx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
                </button>

                {open && (
                  <div className="border-t border-line/60 px-3.5 py-3">
                    {s.note && (
                      <p className="mb-3 rounded-lg bg-raise px-3 py-2 text-xs italic text-soft">{s.note}</p>
                    )}
                    <ul className="space-y-2.5">
                      {s.esercizi.map((e, i) => {
                        const fatte = e.serie.filter((x) => x.fatto);
                        if (fatte.length === 0) return null;
                        return (
                          <li key={i}>
                            <p className="text-xs font-semibold">{nomeEsercizio(e.exerciseId)}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {fatte.map((x, j) => (
                                <Tag key={j}>
                                  {x.kg ? `${x.kg} kg` : 'corpo libero'} × {x.reps ?? '—'}
                                </Tag>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle
        action={
          <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => setRegistra(true)}>
            Registra
          </Button>
        }
      >
        Cardio
      </SectionTitle>
      {sessioniCardio.length === 0 ? (
        <Card>
          <p className="text-xs leading-relaxed text-muted">
            Nessuna seduta di cardio registrata. Registrandola, minuti e calorie entrano negli anelli
            e nei totali del calendario invece di restare una stima.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {[...sessioniCardio]
            .sort((a, b) => b.data.localeCompare(a.data))
            .map((c) => (
              <Card key={c.id} className="!p-3.5">
                <div className="flex items-center gap-3">
                  <HeartPulse size={16} className="shrink-0 text-carb" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{nomeCardio(c.modalita)}</h3>
                    <p className="mt-0.5 text-[11px] capitalize text-muted">{labelLungo(c.data)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Timer size={11} /> {c.minuti} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Flame size={11} /> {c.kcal} kcal{c.kcalAMano && ' (a mano)'}
                      </span>
                      {c.fcMedia && <span>{c.fcMedia} bpm</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCardio(c.id)}
                    aria-label="Elimina seduta cardio"
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </Card>
            ))}
        </div>
      )}

      <RegistraCardio data={oggi()} open={registra} onClose={() => setRegistra(false)} />
    </div>
  );
}
