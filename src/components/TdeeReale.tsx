import { useMemo, useState } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTargets } from '../lib/useTargets';
import { commentoTdee, stimaTdeeReale } from '../lib/tdeeReale';
import { Button, Card, SectionTitle } from './ui';
import { oggi } from '../lib/date';

/** Il fabbisogno dedotto dai dati, con la possibilità di adottarlo al posto della formula. */
export function TdeeReale() {
  const pasti = useStore((s) => s.pasti);
  const pesi = useStore((s) => s.pesi);
  const aggiornaProfilo = useStore((s) => s.aggiornaProfilo);
  const targets = useTargets(true);
  const [msg, setMsg] = useState('');

  const stima = useMemo(
    () => (targets ? stimaTdeeReale(pasti, pesi, targets.tdeeFormula, oggi()) : null),
    [pasti, pesi, targets],
  );

  if (!targets) return null;

  return (
    <>
      <SectionTitle>Fabbisogno reale</SectionTitle>
      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brandink">
            <Calculator size={17} />
          </span>
          <div className="min-w-0 flex-1">
            {!stima ? (
              <p className="text-xs leading-relaxed text-muted">
                Servono pasti registrati e almeno due pesate nelle ultime quattro settimane. Con
                quelli l'app ricava il fabbisogno dal bilancio energetico, invece di fidarsi della
                formula.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-xl font-bold tabular-nums">
                    {stima.affidabile ? stima.tdeeStimato.toLocaleString('it-IT') : '—'}
                  </p>
                  <p className="text-[11px] text-muted">
                    kcal al giorno · formula {targets.tdeeFormula.toLocaleString('it-IT')}
                    {targets.daMisura && ' · in uso il tuo'}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-soft">{commentoTdee(stima)}</p>
                <p className="mt-1.5 text-[11px] text-muted">
                  Su {stima.giorni} giorni: {stima.giorniTracciati} con i pasti registrati,{' '}
                  {stima.pesate} pesate.
                </p>
              </>
            )}
          </div>
        </div>

        {stima?.affidabile && Math.abs(stima.scarto) >= 100 && (
          <Button
            full
            variant="ghost"
            className="mt-3"
            onClick={() => {
              aggiornaProfilo({ tdeeManuale: stima.tdeeStimato });
              setMsg(`Target ricalcolati su ${stima.tdeeStimato} kcal.`);
            }}
          >
            Usa {stima.tdeeStimato} kcal per i target
          </Button>
        )}

        {targets.daMisura && (
          <button
            onClick={() => {
              aggiornaProfilo({ tdeeManuale: undefined });
              setMsg('Torni alla formula.');
            }}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-muted underline"
          >
            <RotateCcw size={11} /> Torna al valore della formula
          </button>
        )}

        {msg && <p className="mt-2 text-center text-xs text-brandink">{msg}</p>}
      </Card>
    </>
  );
}
