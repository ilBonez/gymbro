import { useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import {
  ETICHETTA_GRUPPO,
  ETICHETTA_STATO,
  alimentiDelGruppo,
  sostituzioniDi,
} from '../lib/equivalenze';
import type { GruppoMacro } from '../lib/equivalenze';
import { Card, Chip, Field, cx, inputCls } from './ui';
import { useNumeroUrl, useParametroUrl } from '../lib/urlState';

const GRUPPI: GruppoMacro[] = ['carbs', 'proteine', 'grassi'];

const PREDEFINITI: Record<GruppoMacro, { id: string; grammi: number }> = {
  carbs: { id: 'pasta-semola', grammi: 80 },
  proteine: { id: 'petto-pollo', grammi: 150 },
  grassi: { id: 'olio-evo', grammi: 10 },
};

/** Tabella di sostituzione: stessa quantità di un macro, alimenti diversi. */
export function Sostituzioni() {
  const [gruppoRaw, setGruppoUrl] = useParametroUrl('gruppo', 'carbs');
  const gruppo = gruppoRaw as GruppoMacro;
  const [rifId, setRifId] = useParametroUrl('da', PREDEFINITI[gruppo]?.id ?? PREDEFINITI.carbs.id);
  const [grammi, setGrammi] = useNumeroUrl('g', PREDEFINITI[gruppo]?.grammi ?? 80);

  const alimenti = useMemo(() => alimentiDelGruppo(gruppo), [gruppo]);
  const risultato = useMemo(
    () => sostituzioniDi(rifId, grammi, gruppo, 10),
    [rifId, grammi, gruppo],
  );

  const cambiaGruppo = (g: GruppoMacro) => {
    setGruppoUrl(g);
    setRifId(PREDEFINITI[g].id);
    setGrammi(PREDEFINITI[g].grammi);
  };

  const passiRapidi = gruppo === 'grassi' ? [5, 10, 15, 20] : gruppo === 'proteine' ? [100, 130, 150, 200] : [60, 80, 100, 120];

  return (
    <div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {GRUPPI.map((g) => (
          <Chip key={g} active={gruppo === g} onClick={() => cambiaGruppo(g)}>
            {ETICHETTA_GRUPPO[g]}
          </Chip>
        ))}
      </div>

      <Card className="mt-3 space-y-3.5">
        <Field label="Parto da">
          <select className={inputCls} value={rifId} onChange={(e) => setRifId(e.target.value)}>
            {alimenti.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Quanti grammi">
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              className={cx(inputCls, 'w-24 text-center')}
              value={grammi}
              onChange={(e) => setGrammi(Math.max(1, +e.target.value))}
            />
            <div className="flex flex-1 gap-1.5 overflow-x-auto">
              {passiRapidi.map((g) => (
                <Chip key={g} active={grammi === g} onClick={() => setGrammi(g)}>
                  {g} g
                </Chip>
              ))}
            </div>
          </div>
        </Field>
      </Card>

      {risultato && (
        <>
          <Card className="mt-3 !bg-raise">
            <div className="flex items-baseline justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{risultato.riferimento.alimento.nome}</p>
                <p className="text-[11px] text-muted">
                  {ETICHETTA_STATO[risultato.riferimento.alimento.stato]} · {risultato.riferimento.kcal} kcal
                </p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-2xl font-bold tabular-nums text-brandink">
                  {risultato.riferimento.grammi} g
                </span>
                {risultato.riferimento.grammiCotti && (
                  <span className="block text-[10px] text-muted">
                    ≈ {risultato.riferimento.grammiCotti} g cotti
                  </span>
                )}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Porta <b className="text-ink">{Math.round(risultato.riferimento[gruppo])} g</b> di{' '}
              {ETICHETTA_GRUPPO[gruppo].toLowerCase()}. Qui sotto la stessa quantità, con altri alimenti.
            </p>
          </Card>

          <div className="mt-3 space-y-2">
            {risultato.alternative.map((p) => {
              const deltaKcal = p.kcal - risultato.riferimento.kcal;
              return (
                <Card key={p.alimento.id} className="!p-3.5">
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight size={14} className="shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.alimento.nome}</p>
                      <p className="text-[11px] text-muted">
                        {ETICHETTA_STATO[p.alimento.stato]} · {p.kcal} kcal
                        {Math.abs(deltaKcal) >= 15 && (
                          <span className={deltaKcal > 0 ? 'text-carb' : 'text-prot'}>
                            {' '}
                            ({deltaKcal > 0 ? '+' : ''}
                            {deltaKcal})
                          </span>
                        )}
                        {p.alimento.nota ? ` · ${p.alimento.nota}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold tabular-nums">{p.grammi} g</span>
                      {p.grammiCotti && (
                        <span className="block text-[10px] text-muted">≈ {p.grammiCotti} g cotti</span>
                      )}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            L'equivalenza è calcolata su un macro solo: le porzioni qui sopra danno gli stessi{' '}
            {ETICHETTA_GRUPPO[gruppo].toLowerCase()}, ma non le stesse calorie — per questo accanto a
            ognuna trovi la differenza. Occhio allo stato: <b>da crudo</b> significa pesato prima di
            cuocere, e riso e pasta in cottura più che raddoppiano.
          </p>
        </>
      )}
    </div>
  );
}
