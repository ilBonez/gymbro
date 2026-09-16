import { useMemo, useState } from 'react';
import { Repeat, Search } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import { esercizio } from '../lib/catalog';
import { Chip, Sheet, Tag, cx, inputCls } from './ui';

/**
 * Cambia esercizio a metà seduta: la macchina è occupata, il rack è preso.
 * Parte dai sostituti già previsti per quell'esercizio, poi lascia cercare
 * fra tutti, filtrando in automatico per lo stesso gruppo muscolare.
 */
export function CambiaEsercizio({
  open,
  onClose,
  exerciseId,
  onScegli,
}: {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  onScegli: (nuovoId: string) => void;
}) {
  const [q, setQ] = useState('');
  const [soloGruppo, setSoloGruppo] = useState(true);
  const attuale = esercizio(exerciseId);

  const suggeriti = useMemo(
    () => (attuale?.sostituti ?? []).map(esercizio).filter(Boolean),
    [attuale],
  );

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (e.id === exerciseId) return false;
      if (soloGruppo && attuale && !e.gruppi.includes(attuale.gruppi[0])) return false;
      if (t && !e.nome.toLowerCase().includes(t)) return false;
      return true;
    }).slice(0, 40);
  }, [q, soloGruppo, attuale, exerciseId]);

  if (!attuale) return null;

  const scegli = (id: string) => {
    onScegli(id);
    setQ('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Al posto di ${attuale.nome}`}>
      <div className="space-y-4">
        {suggeriti.length > 0 && !q && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Alternative previste
            </p>
            <div className="space-y-2">
              {suggeriti.map((e) => (
                <button
                  key={e!.id}
                  onClick={() => scegli(e!.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/8 px-3.5 py-2.5 text-left"
                >
                  <Repeat size={14} className="shrink-0 text-brand-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e!.nome}</span>
                    <span className="block text-[11px] text-muted">{e!.attrezzatura}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              className={cx(inputCls, 'pl-10')}
              placeholder="Cerca un altro esercizio…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mt-2.5 flex gap-2">
            <Chip active={soloGruppo} onClick={() => setSoloGruppo(true)}>
              Solo {attuale.gruppi[0]}
            </Chip>
            <Chip active={!soloGruppo} onClick={() => setSoloGruppo(false)}>
              Tutti
            </Chip>
          </div>
        </div>

        <div className="space-y-1.5">
          {risultati.length === 0 && (
            <p className="py-4 text-center text-xs text-muted">Nessun esercizio trovato.</p>
          )}
          {risultati.map((e) => (
            <button
              key={e.id}
              onClick={() => scegli(e.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-raise px-3.5 py-2.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{e.nome}</span>
                <span className="block text-[11px] text-muted">{e.attrezzatura}</span>
              </span>
              <Tag>{e.gruppi[0]}</Tag>
            </button>
          ))}
        </div>

        <p className="text-[11px] leading-relaxed text-muted">
          Cambiando esercizio le serie restano, i carichi no: sarebbero di un altro movimento.
        </p>
      </div>
    </Sheet>
  );
}
