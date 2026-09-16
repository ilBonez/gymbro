import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, ChevronRight, Flame, LineChart, Moon, Pill, Play, Scale, Timer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PROGRAMS } from '../data/programs';
import { SUPPLEMENTS, TIMING_LABEL, supplementById } from '../data/supplements';
import { useTargets } from '../lib/useTargets';
import { MacroBlock } from '../components/MacroRow';
import { Anelli } from '../components/Anelli';
import { kcalMovimento } from '../lib/health';
import { kcalScheda } from '../lib/burn';
import { Button, Card, Empty, SectionTitle, Stat, Tag, Warn, cx } from '../components/ui';
import { giorniTra, labelLungo, oggi } from '../lib/date';
import { GOAL_RULES } from '../lib/nutrition';

export default function Dashboard() {
  const nav = useNavigate();
  const profile = useStore((s) => s.profile);
  const piano = useStore((s) => s.piano);
  const pasti = useStore((s) => s.pasti);
  const pesi = useStore((s) => s.pesi);
  const sessioni = useStore((s) => s.sessioni);
  const integratoriAttivi = useStore((s) => s.integratoriAttivi);
  const giorniSalute = useStore((s) => s.giorniSalute);
  const obiettiviAttivita = useStore((s) => s.obiettiviAttivita);
  const logIntegratori = useStore((s) => s.logIntegratori);
  const segnaIntegratore = useStore((s) => s.segnaIntegratore);

  const today = oggi();
  const giorno = piano[today];
  const programma = giorno ? PROGRAMS.find((p) => p.id === giorno.programId) : undefined;
  const workout = programma?.workouts.find((w) => w.id === giorno?.workoutId);
  const allenamentoOggi = !!workout;

  const targets = useTargets(allenamentoOggi);
  const saluteOggi = giorniSalute[today];
  if (!profile || !targets) return null;

  const kcalPrevisteAllenamento =
    workout && programma ? kcalScheda(workout, programma.goal, targets.pesoKg) : 0;

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

  const ultimoPeso = pesi[pesi.length - 1];
  const settimanaFa = [...pesi].reverse().find((p) => giorniTra(p.data, today) >= 7);
  const delta = ultimoPeso && settimanaFa ? +(ultimoPeso.pesoKg - settimanaFa.pesoKg).toFixed(1) : null;
  const sessioniSettimana = sessioni.filter((s) => giorniTra(s.data, today) < 7).length;

  const stack = integratoriAttivi.map(supplementById).filter(Boolean) as typeof SUPPLEMENTS;
  const presiOggi = stack.filter((s) => logIntegratori[`${today}|${s.id}`]).length;

  // avviso durata del blocco low carb
  const inizioBlocco = Object.values(piano)
    .filter((d) => d.programId === 'definizione-lowcarb')
    .map((d) => d.data)
    .sort()[0];
  const settimaneLowCarb = inizioBlocco ? Math.floor(giorniTra(inizioBlocco, today) / 7) : 0;
  const progLowCarb = PROGRAMS.find((p) => p.id === 'definizione-lowcarb');
  const troppoLowCarb =
    profile.obiettivo === 'definizione' &&
    settimaneLowCarb >= (progLowCarb?.durataMaxSettimane ?? 6);

  return (
    <div className="space-y-1">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-muted">{labelLungo(today)}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Ciao {profile.nome.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted">
          Obiettivo: <span className="text-brandink">{GOAL_RULES[profile.obiettivo].label}</span>
        </p>
      </div>

      {troppoLowCarb && (
        <Warn>
          Sei in low carb da <b>{settimaneLowCarb} settimane</b>. Oltre le {progLowCarb?.durataMaxSettimane} è
          il momento di passare a mantenimento per 2-3 settimane: recuperi ormoni, forza e sonno, e la
          definizione successiva funziona meglio.{' '}
          <Link to="/profilo" className="underline">Cambia obiettivo</Link>
        </Warn>
      )}

      <SectionTitle>Oggi</SectionTitle>
      {workout && programma ? (
        <Card className="!border-brand-500/35 !bg-gradient-to-br from-brand-500/12 to-surface">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Tag tone="brand">{programma.nome}</Tag>
              <h3 className="mt-2 text-lg font-bold leading-tight">{workout.nome}</h3>
              <p className="mt-0.5 text-sm text-soft">{workout.focus}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-bold tabular-nums">{workout.durataMin}'</p>
              <p className="text-[11px] text-muted">{workout.esercizi.length} esercizi</p>
              <p className="mt-0.5 text-[11px] text-brandink">
                ~{kcalScheda(workout, programma.goal, targets.pesoKg)} kcal
              </p>
            </div>
          </div>
          <Button
            full
            className="mt-4"
            onClick={() => nav(`/allena/workout/${programma.id}/${workout.id}`)}
          >
            <Play size={15} className="inline mr-1.5 -mt-0.5" fill="currentColor" /> Inizia allenamento
          </Button>
        </Card>
      ) : giorno ? (
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raise text-soft">
              <Moon size={18} />
            </span>
            <div>
              <h3 className="font-semibold">Giorno di riposo</h3>
              <p className="text-xs text-muted">
                {giorno.cardio
                  ? `Consigliato: ${giorno.cardio.tipo}, ${giorno.cardio.durataMin} min`
                  : 'Recupero attivo: camminata, mobilità, sonno.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Empty
          icon={<CalendarPlus size={26} />}
          title="Nessun allenamento pianificato oggi"
          sub="Scegli un programma e appoggialo sul calendario: da lì l'app costruisce workout, dieta e spesa."
          action={<Button onClick={() => nav('/piano')}>Pianifica</Button>}
        />
      )}

      {saluteOggi && (
        <>
          <SectionTitle action={<Link to="/progressi" className="text-xs text-brandink">Dettagli</Link>}>
            Attività di oggi
          </SectionTitle>
          <Card>
            <Anelli
              kcal={kcalMovimento(saluteOggi)}
              kcalObiettivo={obiettiviAttivita.kcal}
              passi={saluteOggi.passi}
              passiObiettivo={obiettiviAttivita.passi}
              sonnoMin={saluteOggi.sonnoMin}
              sonnoObiettivoMin={Math.round(obiettiviAttivita.sonnoOre * 60)}
            />
            {kcalPrevisteAllenamento > 0 && (
              <p className="mt-3 border-t border-line pt-3 text-[11px] text-muted">
                L'allenamento di oggi vale circa{' '}
                <b className="text-brandink">{kcalPrevisteAllenamento} kcal</b> in più, se lo fai.
              </p>
            )}
          </Card>
        </>
      )}

      <SectionTitle action={<Link to="/dieta" className="text-xs text-brandink">Dettagli</Link>}>
        Nutrizione di oggi
      </SectionTitle>
      <Card>
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
        {pastiOggi.length === 0 && (
          <p className="mt-3 text-xs text-muted">
            Nessun pasto registrato. Apri <Link to="/dieta" className="text-brandink">Dieta</Link> per il menu
            generato su misura per oggi.
          </p>
        )}
      </Card>

      <SectionTitle action={<Link to="/integratori" className="text-xs text-brandink">Gestisci</Link>}>
        Integratori · {presiOggi}/{stack.length}
      </SectionTitle>
      <Card className="!p-2">
        {stack.length === 0 ? (
          <p className="p-3 text-xs text-muted">Nessun integratore attivo.</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {stack.map((s) => {
              const preso = !!logIntegratori[`${today}|${s.id}`];
              return (
                <li key={s.id}>
                  <button
                    onClick={() => segnaIntegratore(today, s.id, !preso)}
                    className="flex w-full items-center gap-3 px-2.5 py-2.5 text-left"
                  >
                    <span
                      className={cx(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors',
                        preso ? 'border-brand-500 bg-brand-500 text-onbrand' : 'border-line2',
                      )}
                    >
                      {preso && <Pill size={13} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-sm font-medium', preso && 'text-muted line-through')}>
                        {s.nome}
                      </span>
                      <span className="block text-[11px] text-muted">{s.dose}</span>
                    </span>
                    <Tag tone={s.timing === 'pre-workout' ? 'brand' : 'neutral'}>{TIMING_LABEL[s.timing]}</Tag>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <SectionTitle>Numeri</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Peso attuale"
          value={ultimoPeso?.pesoKg ?? profile.pesoKg}
          unit="kg"
          sub={
            delta !== null ? (
              <span className={delta < 0 ? 'text-brandink' : delta > 0 ? 'text-carb' : ''}>
                {delta > 0 ? '+' : ''}
                {delta} kg in 7 giorni
              </span>
            ) : (
              'Aggiungi un peso per il trend'
            )
          }
        />
        <Stat label="Sedute (7gg)" value={sessioniSettimana} sub={`${sessioni.length} totali`} />
        <Stat label="TDEE" value={targets.tdee} unit="kcal" sub={`Basale ${targets.bmr}`} />
        <Stat
          label="Target oggi"
          value={targets.macro.kcal}
          unit="kcal"
          tone="text-brandink"
          sub={allenamentoOggi ? 'Giorno di allenamento' : 'Giorno di riposo'}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Link to="/progressi" className="rounded-2xl border border-line/70 bg-surface p-3.5 text-center">
          <LineChart size={19} className="mx-auto text-brandink" />
          <span className="mt-1.5 block text-xs font-medium">Progressi</span>
        </Link>
        <Link to="/storico" className="rounded-2xl border border-line/70 bg-surface p-3.5 text-center">
          <Timer size={19} className="mx-auto text-brandink" />
          <span className="mt-1.5 block text-xs font-medium">Storico</span>
        </Link>
        <Link
          to="/progressi/dieta"
          className="rounded-2xl border border-line/70 bg-surface p-3.5 text-center"
        >
          <Scale size={19} className="mx-auto text-brandink" />
          <span className="mt-1.5 block text-xs font-medium">Aderenza</span>
        </Link>
      </div>

      <Link
        to="/allena"
        className="mt-3 flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-3.5"
      >
        <Flame size={18} className="text-brandink" />
        <span className="flex-1 text-sm font-medium">Sfoglia programmi ed esercizi</span>
        <ChevronRight size={17} className="text-muted" />
      </Link>
    </div>
  );
}
