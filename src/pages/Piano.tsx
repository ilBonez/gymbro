import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarRange, ChevronLeft, ChevronRight, Trash2, UtensilsCrossed } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button, Card, Empty, SectionTitle, cx } from '../components/ui';
import { AssegnaGiorno } from '../components/calendario/AssegnaGiorno';
import { DettaglioGiorno } from '../components/calendario/DettaglioGiorno';
import { ListaSettimana } from '../components/calendario/ListaSettimana';
import { GrigliaMese } from '../components/calendario/GrigliaMese';
import { GrigliaAnno } from '../components/calendario/GrigliaAnno';
import { useImpostaParametri, useParametroUrl } from '../lib/urlState';
import { inizioSettimana, key, labelMese, oggi, settimana } from '../lib/date';
import { GOAL_RULES } from '../lib/nutrition';
import { useTargets } from '../lib/useTargets';

type Vista = 'giorno' | 'settimana' | 'mese' | 'anno';

const VISTE: { id: Vista; label: string }[] = [
  { id: 'giorno', label: 'Giorno' },
  { id: 'settimana', label: 'Settimana' },
  { id: 'mese', label: 'Mese' },
  { id: 'anno', label: 'Anno' },
];

export default function Piano() {
  const piano = useStore((s) => s.piano);
  const svuotaPiano = useStore((s) => s.svuotaPiano);
  const targets = useTargets(true);

  const [vistaRaw, setVista] = useParametroUrl('vista', 'settimana');
  const [dataSel, setDataSel] = useParametroUrl('d', oggi());
  const [assegna, setAssegna] = useState<string | null>(null);
  const impostaParametri = useImpostaParametri();

  const vista = (VISTE.some((v) => v.id === vistaRaw) ? vistaRaw : 'settimana') as Vista;
  const today = oggi();
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dataSel) ? dataSel : today;
  const d = parseISO(data);

  const giorniSettimana = settimana(d);
  const pianificati = Object.keys(piano).length;

  /** Un passo avanti o indietro, della durata della vista corrente. */
  const sposta = (verso: 1 | -1) => {
    const nuovo =
      vista === 'giorno'
        ? addDays(d, verso)
        : vista === 'settimana'
          ? addWeeks(d, verso)
          : vista === 'mese'
            ? addMonths(d, verso)
            : addYears(d, verso);
    setDataSel(key(nuovo));
  };

  const etichetta =
    vista === 'giorno'
      ? format(d, 'EEEE d MMMM', { locale: it })
      : vista === 'settimana'
        ? `${format(inizioSettimana(d), 'd')} – ${format(addDays(inizioSettimana(d), 6), 'd MMM yyyy', { locale: it })}`
        : vista === 'mese'
          ? labelMese(d)
          : String(d.getFullYear());

  // scendere di livello impila un passaggio: il tasto indietro riporta alla vista di prima
  const apriGiorno = (k: string) =>
    impostaParametri({ d: k === today ? null : k, vista: 'giorno' }, { push: true });

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="mt-1 text-sm text-muted">Allenamenti, dieta e attività, giorno per giorno.</p>
        </div>
        {pianificati > 0 && (
          <button
            onClick={() => confirm('Svuotare tutto il calendario?') && svuotaPiano()}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-raise hover:text-red-300"
            aria-label="Svuota piano"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-1 rounded-2xl border border-line/70 bg-surface p-1">
        {VISTE.map((v) => (
          <button
            key={v.id}
            onClick={() => setVista(v.id)}
            className={cx(
              'flex-1 rounded-xl py-1.5 text-xs font-medium transition-colors',
              vista === v.id ? 'bg-brand-500 text-onbrand' : 'text-soft hover:bg-raise',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-2xl border border-line/70 bg-surface px-2 py-1.5">
        <button
          onClick={() => sposta(-1)}
          aria-label="Periodo precedente"
          className="rounded-lg p-2 text-soft hover:bg-raise"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize">{etichetta}</p>
          <button onClick={() => setDataSel(today)} className="text-[11px] text-brandink">
            {data === today ? 'Oggi' : 'Torna a oggi'}
          </button>
        </div>
        <button
          onClick={() => sposta(1)}
          aria-label="Periodo successivo"
          className="rounded-lg p-2 text-soft hover:bg-raise"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {pianificati === 0 && (
        <div className="mt-4">
          <Empty
            icon={<CalendarRange size={26} />}
            title="Calendario vuoto"
            sub="Scegli un programma: l'app riempie le settimane con schede, cardio e dieta abbinata."
            action={
              <Link to="/allena">
                <Button>Scegli un programma</Button>
              </Link>
            }
          />
        </div>
      )}

      <div className="mt-4">
        {vista === 'giorno' && <DettaglioGiorno data={data} onAssegna={setAssegna} />}
        {vista === 'settimana' && (
          <ListaSettimana giorni={giorniSettimana} onApri={apriGiorno} onAssegna={setAssegna} />
        )}
        {vista === 'mese' && <GrigliaMese mese={d} onApri={apriGiorno} />}
        {vista === 'anno' && (
          <GrigliaAnno
            anno={d.getFullYear()}
            onApri={apriGiorno}
            onMese={(m) => impostaParametri({ d: key(m), vista: 'mese' }, { push: true })}
          />
        )}
      </div>

      {vista === 'settimana' && targets && (
        <>
          <SectionTitle
            action={
              <Link to="/dieta" className="text-xs text-brandink">
                Vai alla dieta
              </Link>
            }
          >
            Dieta della settimana
          </SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brandink">
                <UtensilsCrossed size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold">{GOAL_RULES[targets.goal].label}</p>
                <p className="text-[11px] text-muted">
                  {targets.macro.kcal} kcal · P {targets.macro.proteine} / C {targets.macro.carbs} /
                  G {targets.macro.grassi} g nei giorni di allenamento
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      <AssegnaGiorno data={assegna} onClose={() => setAssegna(null)} />
    </div>
  );
}
