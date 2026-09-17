import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Search, Trash2, X } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import type { MuscleGroup } from '../data/exercises';
import type { ProgramSet, WorkoutTemplate } from '../data/programs';
import { useStore } from '../store/useStore';
import { ID_PROGRAMMA_MIO, nomeEsercizio, scheda, schedaMia } from '../lib/catalog';
import { Button, Card, Chip, Field, SectionTitle, Sheet, Warn, cx, inputCls } from '../components/ui';

const GRUPPI: MuscleGroup[] = [
  'petto',
  'schiena',
  'spalle',
  'bicipiti',
  'tricipiti',
  'quadricipiti',
  'femorali',
  'glutei',
  'polpacci',
  'core',
];

/** Quanto dura più o meno la seduta: serie per tempo di lavoro più recupero. */
function durataStimata(esercizi: ProgramSet[]): number {
  const sec = esercizi.reduce((t, e) => t + e.serie * (40 + e.recuperoSec), 0);
  return Math.max(10, Math.round((sec / 60 + 8) / 5) * 5);
}

/** Scrittura e modifica di una scheda dell'utente. */
export default function SchedaNuova() {
  const nav = useNavigate();
  const { id } = useParams();
  const esistente = id ? scheda(ID_PROGRAMMA_MIO, id) : undefined;
  const salvaScheda = useStore((s) => s.salvaScheda);
  const eliminaScheda = useStore((s) => s.eliminaScheda);

  const [nome, setNome] = useState(esistente?.nome ?? '');
  const [focus, setFocus] = useState(esistente?.focus ?? '');
  const [riscaldamento, setRiscaldamento] = useState(
    (esistente?.riscaldamento ?? ['5 minuti di cardio leggero', 'Mobilità delle spalle e delle anche']).join('\n'),
  );
  const [esercizi, setEsercizi] = useState<ProgramSet[]>(esistente?.esercizi ?? []);
  const [durataMano, setDurataMano] = useState<number | null>(esistente?.durataMin ?? null);
  const [scegli, setScegli] = useState(false);
  const [errore, setErrore] = useState('');

  const durata = durataMano ?? durataStimata(esercizi);

  const cambia = (i: number, patch: Partial<ProgramSet>) =>
    setEsercizi((p) => p.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const sposta = (i: number, verso: -1 | 1) =>
    setEsercizi((p) => {
      const k = i + verso;
      if (k < 0 || k >= p.length) return p;
      const copia = [...p];
      [copia[i], copia[k]] = [copia[k], copia[i]];
      return copia;
    });

  const salva = () => {
    if (nome.trim().length < 2) return setErrore('Manca il nome della scheda.');
    if (esercizi.length === 0) return setErrore('Aggiungi almeno un esercizio.');

    const nuova: Omit<WorkoutTemplate, 'id'> & { id?: string } = {
      id: esistente && schedaMia(esistente.id) ? esistente.id : undefined,
      nome: nome.trim(),
      focus:
        focus.trim() ||
        // senza focus scritto a mano lo ricaviamo dai muscoli primari degli esercizi
        [...new Set(esercizi.map((e) => EXERCISES.find((x) => x.id === e.exerciseId)?.gruppi[0]))]
          .filter(Boolean)
          .join(', '),
      durataMin: durata,
      riscaldamento: riscaldamento
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      esercizi,
    };
    const nuovoId = salvaScheda(nuova);
    nav(`/allena/workout/${ID_PROGRAMMA_MIO}/${nuovoId}`, { replace: true });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        {esistente ? 'Modifica scheda' : 'Nuova scheda'}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Finisce fra "Le mie schede": la metti sul calendario e la fai partire come le altre.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="es. Push A - Spinta"
            className={inputCls}
          />
        </Field>
        <Field label="Focus" hint="Se lo lasci vuoto lo ricaviamo dagli esercizi.">
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="es. Petto, spalle, tricipiti"
            className={inputCls}
          />
        </Field>
        <Field label="Durata (min)" hint={`Stimata dalle serie: ${durataStimata(esercizi)} min.`}>
          <input
            type="number"
            min={10}
            value={durata}
            onChange={(e) => setDurataMano(Math.max(10, Number(e.target.value) || 10))}
            className={inputCls}
          />
        </Field>
      </div>

      <SectionTitle>Esercizi</SectionTitle>
      <Card className="!p-3">
        {esercizi.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted">
            Nessun esercizio. Prendili dai {EXERCISES.length} del catalogo.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {esercizi.map((e, i) => (
              <li key={`${e.exerciseId}-${i}`} className="rounded-xl border border-line bg-raise p-2.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {nomeEsercizio(e.exerciseId)}
                  </span>
                  <button
                    onClick={() => sposta(i, -1)}
                    disabled={i === 0}
                    aria-label="Sposta su"
                    className="rounded-lg p-1 text-muted disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => sposta(i, 1)}
                    disabled={i === esercizi.length - 1}
                    aria-label="Sposta giù"
                    className="rounded-lg p-1 text-muted disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => setEsercizi((p) => p.filter((_, k) => k !== i))}
                    aria-label={`Togli ${nomeEsercizio(e.exerciseId)}`}
                    className="rounded-lg p-1 text-muted hover:text-red-400"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="text-[10px] uppercase text-muted">Serie</span>
                    <input
                      type="number"
                      min={1}
                      value={e.serie}
                      onChange={(ev) => cambia(i, { serie: Math.max(1, Number(ev.target.value) || 1) })}
                      className="mt-0.5 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm tabular-nums outline-none focus:border-brand-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase text-muted">Ripetizioni</span>
                    <input
                      value={e.ripetizioni}
                      onChange={(ev) => cambia(i, { ripetizioni: ev.target.value })}
                      placeholder="8-10"
                      className="mt-0.5 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase text-muted">Recupero (s)</span>
                    <input
                      type="number"
                      min={0}
                      step={15}
                      value={e.recuperoSec}
                      onChange={(ev) =>
                        cambia(i, { recuperoSec: Math.max(0, Number(ev.target.value) || 0) })
                      }
                      className="mt-0.5 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm tabular-nums outline-none focus:border-brand-500"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button full variant="ghost" className="mt-2.5" onClick={() => setScegli(true)}>
          <Plus size={14} className="mr-1.5 -mt-0.5 inline" /> Aggiungi esercizio
        </Button>
      </Card>

      <SectionTitle>Riscaldamento</SectionTitle>
      <textarea
        value={riscaldamento}
        onChange={(e) => setRiscaldamento(e.target.value)}
        rows={3}
        placeholder="Un passaggio per riga."
        className={cx(inputCls, 'resize-y')}
      />

      {errore && (
        <div className="mt-4">
          <Warn>{errore}</Warn>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Button full onClick={salva}>
          Salva scheda
        </Button>
        {esistente && schedaMia(esistente.id) && (
          <Button
            full
            variant="danger"
            onClick={() => {
              if (!confirm(`Eliminare "${esistente.nome}"?`)) return;
              eliminaScheda(esistente.id);
              nav('/allena', { replace: true });
            }}
          >
            <Trash2 size={14} className="mr-1.5 -mt-0.5 inline" /> Elimina scheda
          </Button>
        )}
      </div>

      <SceltaEsercizio
        open={scegli}
        onClose={() => setScegli(false)}
        onAggiungi={(exerciseId) => {
          setEsercizi((p) => [...p, { exerciseId, serie: 3, ripetizioni: '8-10', recuperoSec: 90 }]);
          setScegli(false);
        }}
      />
    </div>
  );
}

/** Foglio di scelta esercizio, con ricerca e filtro per muscolo. */
function SceltaEsercizio({
  open,
  onClose,
  onAggiungi,
}: {
  open: boolean;
  onClose: () => void;
  onAggiungi: (exerciseId: string) => void;
}) {
  const [q, setQ] = useState('');
  const [gruppo, setGruppo] = useState<MuscleGroup | 'tutti'>('tutti');

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (gruppo !== 'tutti' && !e.gruppi.includes(gruppo)) return false;
      if (t && !e.nome.toLowerCase().includes(t)) return false;
      return true;
    }).slice(0, 40);
  }, [q, gruppo]);

  return (
    <Sheet open={open} onClose={onClose} title="Aggiungi esercizio">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca esercizio…"
          className={cx(inputCls, 'pl-10')}
        />
      </div>

      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={gruppo === 'tutti'} onClick={() => setGruppo('tutti')}>
          Tutti
        </Chip>
        {GRUPPI.map((g) => (
          <Chip key={g} active={gruppo === g} onClick={() => setGruppo(g)}>
            {g}
          </Chip>
        ))}
      </div>

      <ul className="mt-3 divide-y divide-line/60">
        {risultati.map((e) => (
          <li key={e.id}>
            <button onClick={() => onAggiungi(e.id)} className="w-full py-2.5 text-left">
              <span className="block text-sm font-medium">{e.nome}</span>
              <span className="block text-[11px] text-muted">
                {e.gruppi.join(', ')} · {e.attrezzatura}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
