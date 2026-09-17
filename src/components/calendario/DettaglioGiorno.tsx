import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  CalendarCog,
  Dumbbell,
  HeartPulse,
  Moon,
  Play,
  Scale,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { Anelli, anelliGiornata } from '../Anelli';
import { Button, Card, SectionTitle, Tag, cx } from '../ui';
import { useStore } from '../../store/useStore';
import { useTargets } from '../../lib/useTargets';
import { useGiornata } from '../../lib/useGiornata';
import { ETICHETTA_STATO_GIORNO, statoGiorno } from '../../lib/giornata';
import { kcalCardio, kcalScheda, nomeCardio } from '../../lib/burn';
import { RegistraCardio } from '../RegistraCardio';
import { fmtDurata, labelLungo, oggi } from '../../lib/date';
import { macroTargets } from '../../lib/nutrition';

/** Una giornata sola, con tutto quello che l'app ne sa. */
export function DettaglioGiorno({
  data,
  onAssegna,
}: {
  data: string;
  onAssegna: (k: string) => void;
}) {
  const nav = useNavigate();
  const g = useGiornata(data);
  const obiettivi = useStore((s) => s.obiettiviAttivita);
  const removeCardio = useStore((s) => s.removeCardio);
  const [registra, setRegistra] = useState(false);
  const targets = useTargets(!!g.scheda);
  const today = oggi();

  const stato = statoGiorno(g, today);
  const anelli = anelliGiornata(
    {
      kcal: g.kcalMovimento,
      minutiEsercizio: g.minutiEsercizio,
      passi: g.passi,
      sonnoMin: g.sonnoMin,
    },
    obiettivi,
  );
  const conAttivita = g.kcalMovimento > 0 || g.passi > 0 || g.minutiEsercizio > 0 || g.sonnoMin > 0;

  const kcalPreviste =
    targets && g.scheda && g.programma
      ? kcalScheda(g.scheda, g.programma.goal, targets.pesoKg)
      : targets && g.pianificato?.cardio
        ? kcalCardio(g.pianificato.cardio.modalita, g.pianificato.cardio.durataMin, targets.pesoKg)
        : 0;

  const kcalTarget = targets
    ? g.scheda
      ? targets.macro.kcal
      : macroTargets(targets.goal, targets.pesoKg, targets.tdee, false).kcal
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        {/* la data sta già nella barra di navigazione qui sopra: qui basta lo stato */}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{ETICHETTA_STATO_GIORNO[stato]}</h2>
          <p className="text-[11px] capitalize text-muted">
            {data === today ? 'oggi' : labelLungo(data)}
          </p>
        </div>
        <button
          onClick={() => onAssegna(data)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-raise px-3 py-2 text-xs font-medium text-soft"
        >
          <CalendarCog size={15} /> Modifica
        </button>
      </div>

      <SectionTitle>Attività</SectionTitle>
      <Card>
        {conAttivita ? (
          <Anelli anelli={anelli} />
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted">
            <Activity size={18} className="shrink-0 text-line2" />
            <p>
              Nessun dato di movimento per questo giorno.{' '}
              <Link to="/profilo" className="text-brandink">
                Collega Health Connect
              </Link>{' '}
              per vederli qui.
            </p>
          </div>
        )}
        {kcalPreviste > 0 && g.sessioni.length === 0 && (
          <p className="mt-3 border-t border-line pt-3 text-[11px] text-muted">
            Quello in programma vale circa <b className="text-brandink">{kcalPreviste} kcal</b>.
          </p>
        )}
      </Card>

      <SectionTitle>Allenamento</SectionTitle>
      {g.scheda && g.programma ? (
        <Card className={cx(stato === 'fatto' && '!border-brand-500/35')}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Tag tone="brand">{g.programma.nome}</Tag>
              <h3 className="mt-2 font-semibold leading-tight">{g.scheda.nome}</h3>
              <p className="mt-0.5 text-xs text-muted">
                {g.scheda.focus} · {g.scheda.durataMin} min · {g.scheda.esercizi.length} esercizi
              </p>
            </div>
            <Dumbbell size={18} className="shrink-0 text-brandink" />
          </div>
          {g.sessioni.length === 0 && (
            <Button
              full
              className="mt-3"
              variant={data === today ? 'primary' : 'ghost'}
              onClick={() => nav(`/allena/workout/${g.programma!.id}/${g.scheda!.id}`)}
            >
              <Play size={14} className="mr-1.5 -mt-0.5 inline" fill="currentColor" />
              {data === today ? 'Inizia allenamento' : 'Apri la scheda'}
            </Button>
          )}
        </Card>
      ) : g.pianificato?.cardio ? (
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-carb/12 text-carb">
              <HeartPulse size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">Solo cardio</h3>
              <p className="text-xs text-muted">
                {nomeCardio(g.pianificato.cardio.modalita)} · {g.pianificato.cardio.durataMin} min
              </p>
            </div>
          </div>
          {g.cardio.length === 0 && (
            <Button full variant="ghost" className="mt-3" onClick={() => setRegistra(true)}>
              Registra la seduta
            </Button>
          )}
        </Card>
      ) : g.pianificato ? (
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raise text-soft">
              <Moon size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Riposo</h3>
              <p className="text-xs text-muted">
                {g.pianificato.note ?? 'Recupero attivo: camminata, mobilità, sonno.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card onClick={() => onAssegna(data)}>
          <p className="text-sm text-muted">Giorno libero — tocca per assegnare scheda o riposo.</p>
        </Card>
      )}

      {g.sessioni.length > 0 && (
        <div className="mt-2 space-y-2">
          {g.sessioni.map((s) => (
            <Link
              key={s.id}
              to="/storico"
              className="flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/8 px-3.5 py-3"
            >
              <Dumbbell size={16} className="shrink-0 text-brandink" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Sessione registrata</p>
                <p className="text-[11px] text-muted">
                  {fmtDurata(s.durataSec)} · {Math.round(s.volumeKg).toLocaleString('it-IT')} kg di
                  volume · {s.esercizi.length} esercizi
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {g.cardio.length > 0 && (
        <div className="mt-2 space-y-2">
          {g.cardio.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-carb/30 bg-carb/8 px-3.5 py-3"
            >
              <HeartPulse size={16} className="shrink-0 text-carb" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{nomeCardio(c.modalita)}</p>
                <p className="text-[11px] text-muted">
                  {c.minuti} min · {c.kcal} kcal{c.kcalAMano && ' (a mano)'}
                  {c.fcMedia ? ` · ${c.fcMedia} bpm` : ''}
                </p>
              </div>
              <button
                onClick={() => removeCardio(c.id)}
                aria-label="Elimina seduta cardio"
                className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!g.pianificato?.cardio && (
        <Button
          full
          variant="ghost"
          className="mt-2 !text-xs"
          onClick={() => setRegistra(true)}
        >
          <HeartPulse size={14} className="mr-1.5 -mt-0.5 inline" /> Aggiungi cardio
        </Button>
      )}

      <SectionTitle
        action={
          data === today ? (
            <Link to="/dieta" className="text-xs text-brandink">
              Registra
            </Link>
          ) : undefined
        }
      >
        Dieta
      </SectionTitle>
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brandink">
            <UtensilsCrossed size={18} />
          </span>
          <div className="min-w-0 flex-1">
            {g.pasti.length > 0 ? (
              <>
                <p className="text-sm font-semibold tabular-nums">
                  {Math.round(g.kcalAssunte).toLocaleString('it-IT')} kcal
                  {kcalTarget > 0 && (
                    <span className="ml-1 text-[11px] font-normal text-muted">
                      / {kcalTarget.toLocaleString('it-IT')}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted">
                  {g.pasti.length} {g.pasti.length === 1 ? 'pasto' : 'pasti'} ·{' '}
                  {Math.round(g.proteine)} g di proteine
                  {g.sgarri > 0 && (
                    <span className="text-carb">
                      {' '}
                      · {g.sgarri} {g.sgarri === 1 ? 'sgarro' : 'sgarri'}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">
                Nessun pasto registrato
                {kcalTarget > 0 && ` · target ${kcalTarget.toLocaleString('it-IT')} kcal`}
              </p>
            )}
          </div>
        </div>
      </Card>

      <RegistraCardio
        data={data}
        open={registra}
        onClose={() => setRegistra(false)}
        modalitaIniziale={g.pianificato?.cardio?.modalita}
        minutiIniziali={g.pianificato?.cardio?.durataMin}
      />

      {g.pesoKg !== null && (
        <>
          <SectionTitle>Peso</SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <Scale size={17} className="text-brandink" />
              <p className="text-sm font-semibold tabular-nums">{g.pesoKg} kg</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
