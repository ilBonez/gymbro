import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CalendarPlus, ChevronRight, Flame, HeartPulse, TrendingDown } from 'lucide-react';
import { PROGRAMS } from '../data/programs';
import { useStore } from '../store/useStore';
import { Button, Card, Field, SectionTitle, Sheet, Tag, Warn, inputCls } from '../components/ui';
import { GIORNI_IT, oggi } from '../lib/date';
import { GOAL_RULES, macroTargets } from '../lib/nutrition';
import { useTargets } from '../lib/useTargets';
import {
  commentoStima,
  kcalAlMinuto,
  kcalScheda,
  metCardio,
  metScheda,
  nomeCardio,
  stimaSettimanale,
} from '../lib/burn';

export default function ProgramDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const programma = PROGRAMS.find((p) => p.id === id);

  const applica = useStore((s) => s.applicaProgramma);
  const aggiornaProfilo = useStore((s) => s.aggiornaProfilo);
  const targets = useTargets(true);

  const [sheet, setSheet] = useState(false);
  const [dataInizio, setDataInizio] = useState(oggi());
  const [settimane, setSettimane] = useState(programma?.durataSettimane ?? 4);
  const [adeguaDieta, setAdeguaDieta] = useState(true);
  const [soloFeriali, setSoloFeriali] = useState(false);

  if (!programma) return <Navigate to="/allena" replace />;

  const macroProg = targets ? macroTargets(programma.goal, targets.pesoKg, targets.tdee, true) : null;
  const stima = targets
    ? stimaSettimanale(programma, targets.bmr, targets.pesoKg, programma.goal, targets.tdee)
    : null;

  const conferma = () => {
    applica(programma.id, dataInizio, settimane, soloFeriali);
    if (adeguaDieta) aggiornaProfilo({ obiettivo: programma.goal });
    setSheet(false);
    nav('/piano');
  };

  return (
    <div>
      <Tag tone="brand">{GOAL_RULES[programma.goal].label}</Tag>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{programma.nome}</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-soft">{programma.descrizione}</p>

      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
        {[
          ['Settimane', programma.durataSettimane],
          ['Sedute/sett.', programma.giorniSettimana],
          ['Schede', programma.workouts.length],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border border-line/70 bg-surface py-3">
            <p className="text-xl font-bold tabular-nums">{v}</p>
            <p className="text-[11px] text-muted">{k}</p>
          </div>
        ))}
      </div>

      {programma.avvertenze && programma.avvertenze.length > 0 && (
        <div className="mt-4 space-y-2">
          {programma.avvertenze.map((a, i) => (
            <Warn key={i}>
              <AlertTriangle size={14} className="mr-1.5 -mt-0.5 inline" />
              {a}
            </Warn>
          ))}
        </div>
      )}

      <SectionTitle>Settimana tipo</SectionTitle>
      <Card className="!p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {programma.splitSuggerito.map((s, i) => {
            const riposo = /ripos/i.test(s);
            return (
              <div
                key={i}
                className={
                  'rounded-lg px-1 py-2 text-center ' +
                  (riposo ? 'bg-raise text-muted' : 'bg-brand-500/12 text-brandink')
                }
              >
                <p className="text-[10px] font-semibold uppercase">{GIORNI_IT[i]}</p>
                <p className="mt-1 text-[10px] leading-tight break-words">{s}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {programma.cardio && (
        <Card className="mt-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-carb/12 text-carb">
              <HeartPulse size={17} />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Cardio: {programma.cardio.tipo}</h3>
              <p className="mt-0.5 text-xs text-soft">
                {programma.cardio.frequenzaSettimana}× a settimana · {programma.cardio.durataMin} min ·{' '}
                {programma.cardio.intensita}
              </p>
              {programma.cardio.note && (
                <p className="mt-1 text-xs text-muted">{programma.cardio.note}</p>
              )}
              {targets && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Al minuto il cardio costa più dei pesi:{' '}
                  <b className="text-ink">
                    {kcalAlMinuto(metCardio(programma.cardio.modalita), targets.pesoKg)} kcal/min
                  </b>{' '}
                  ({nomeCardio(programma.cardio.modalita).toLowerCase()}) contro{' '}
                  <b className="text-ink">
                    {kcalAlMinuto(metScheda(programma.workouts[0], programma.goal), targets.pesoKg)}{' '}
                    kcal/min
                  </b>{' '}
                  in sala pesi, dove gran parte del tempo è recupero. Nel totale settimanale però i
                  pesi possono superarlo, perché le sedute durano il doppio.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {macroProg && (
        <>
          <SectionTitle>Dieta abbinata</SectionTitle>
          <Card>
            <p className="text-sm text-soft">{GOAL_RULES[programma.goal].descrizione}</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                ['kcal', macroProg.kcal, 'text-ink'],
                ['Prot', macroProg.proteine, 'text-prot'],
                ['Carb', macroProg.carbs, 'text-carb'],
                ['Gras', macroProg.grassi, 'text-fat'],
              ].map(([k, v, c]) => (
                <div key={k as string} className="rounded-xl bg-raise py-2.5">
                  <p className={`text-base font-bold tabular-nums ${c}`}>{v}</p>
                  <p className="text-[10px] text-muted">{k}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {stima && (
        <>
          <SectionTitle>Cosa aspettarsi in una settimana</SectionTitle>
          <Card>
            <div className="flex items-baseline justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-soft">
                <TrendingDown size={15} className={stima.kgSettimana < 0 ? 'text-brand-500' : 'text-carb'} />
                Variazione di peso attesa
              </span>
              <span
                className={
                  'text-2xl font-bold tabular-nums ' +
                  (stima.kgSettimana < 0 ? 'text-brand-500' : stima.kgSettimana > 0 ? 'text-carb' : '')
                }
              >
                {stima.kgSettimana > 0 ? '+' : ''}
                {stima.kgSettimana} kg
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{commentoStima(stima)}</p>

            <div className="mt-3.5 space-y-1.5 border-t border-line pt-3 text-xs">
              {[
                ['Metabolismo e vita quotidiana', stima.kcalBase],
                [`Allenamenti (${stima.giorniAllenamento} sedute)`, stima.kcalAllenamenti],
                stima.giorniCardio > 0
                  ? [`Cardio (${stima.giorniCardio} sessioni)`, stima.kcalCardio]
                  : null,
              ]
                .filter(Boolean)
                .map((r) => {
                  const [label, v] = r as [string, number];
                  return (
                    <div key={label} className="flex justify-between text-muted">
                      <span>{label}</span>
                      <span className="tabular-nums">{v.toLocaleString('it-IT')} kcal</span>
                    </div>
                  );
                })}
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                <span>Spesa settimanale</span>
                <span className="tabular-nums">{stima.spesaTotale.toLocaleString('it-IT')} kcal</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Introito con questa dieta</span>
                <span className="tabular-nums">{stima.introito.toLocaleString('it-IT')} kcal</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Stime con un margine del 20-30%: i MET degli allenamenti sono tabellari, non misurati.
              Servono a confrontare un programma con l'altro. Il numero che conta davvero è la bilancia
              dopo due settimane.
            </p>
          </Card>
        </>
      )}

      <SectionTitle>Schede</SectionTitle>
      <div className="space-y-2.5">
        {programma.workouts.map((w) => (
          <Link key={w.id} to={`/allena/workout/${programma.id}/${w.id}`} className="block">
            <Card>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">{w.nome}</h3>
                  <p className="mt-0.5 text-xs text-muted">{w.focus}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {w.esercizi.length} esercizi · ~{w.durataMin} min
                    {targets && (
                      <>
                        {' · '}
                        <span className="text-brandink">
                          <Flame size={10} className="mr-0.5 -mt-0.5 inline" />
                          ~{kcalScheda(w, programma.goal, targets.pesoKg)} kcal
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <ChevronRight size={17} className="shrink-0 text-muted" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="sticky bottom-24 mt-6 -mx-4 bg-gradient-to-t from-page via-page/95 to-transparent px-4 pb-2 pt-6">
        <Button full onClick={() => setSheet(true)}>
          <CalendarPlus size={16} className="mr-1.5 -mt-0.5 inline" /> Metti in calendario
        </Button>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Pianifica il programma">
        <div className="space-y-4">
          <Field label="Data di inizio">
            <input
              type="date"
              className={inputCls}
              value={dataInizio}
              onChange={(e) => setDataInizio(e.target.value)}
            />
          </Field>
          <Field
            label={`Durata: ${settimane} settimane`}
            hint={
              programma.durataMaxSettimane
                ? `Limite consigliato per questo blocco: ${programma.durataMaxSettimane} settimane.`
                : undefined
            }
          >
            <input
              type="range"
              min={1}
              max={programma.durataMaxSettimane ?? 16}
              value={settimane}
              onChange={(e) => setSettimane(+e.target.value)}
              className="w-full accent-brand-500"
            />
          </Field>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-raise p-3">
            <input
              type="checkbox"
              checked={soloFeriali}
              onChange={(e) => setSoloFeriali(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span className="text-xs">
              Allenati da <b>lunedì a venerdì</b>, weekend libero
              <span className="mt-0.5 block text-muted">
                Le sedute vengono distribuite sui feriali il più distanziate possibile; sabato e
                domenica restano di riposo.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-raise p-3">
            <input
              type="checkbox"
              checked={adeguaDieta}
              onChange={(e) => setAdeguaDieta(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span className="text-xs">
              Adegua anche la dieta a <b>{GOAL_RULES[programma.goal].label}</b>
              <span className="mt-0.5 block text-muted">
                Ricalcola calorie, macro, menu e lista della spesa.
              </span>
            </span>
          </label>

          <p className="text-[11px] text-muted">
            I giorni già pianificati nell'intervallo verranno sovrascritti.
          </p>

          <Button full onClick={conferma}>
            Applica al calendario
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
