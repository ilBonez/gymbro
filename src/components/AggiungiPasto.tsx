import { useState } from 'react';
import { PartyPopper, PencilLine } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SGARRI } from '../data/sgarri';
import type { Meal } from '../data/recipes';
import { MOMENTI, MOMENTO_LABEL } from '../lib/diet';
import { Button, Chip, Field, Sheet, cx, inputCls } from './ui';
import { kcalDaMacro } from '../lib/nutrition';

/**
 * Registra un pasto che non sta nel ricettario: o a mano coi macro,
 * oppure scegliendo uno sgarro dalla lista dei classici.
 */
export function AggiungiPasto({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: string;
}) {
  const addPasto = useStore((s) => s.addPasto);

  const [modo, setModo] = useState<'manuale' | 'sgarro'>('manuale');
  const [momento, setMomento] = useState<Meal>('pranzo');
  const [nome, setNome] = useState('');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [gras, setGras] = useState('');

  const n = (v: string) => (v.trim() === '' ? 0 : Math.max(0, +v));
  const kcalDaiMacro = kcalDaMacro(n(prot), n(carb), n(gras));
  const kcalFinali = n(kcal) > 0 ? n(kcal) : kcalDaiMacro;
  const scostamento = n(kcal) > 0 && kcalDaiMacro > 0 ? Math.abs(n(kcal) - kcalDaiMacro) : 0;

  const reset = () => {
    setNome('');
    setKcal('');
    setProt('');
    setCarb('');
    setGras('');
  };

  const salvaManuale = () => {
    if (kcalFinali <= 0) return;
    addPasto({
      data,
      momento,
      nome: nome.trim() || 'Pasto libero',
      porzioni: 1,
      kcal: kcalFinali,
      proteine: n(prot),
      carbs: n(carb),
      grassi: n(gras),
      tipo: 'normale',
    });
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Aggiungi pasto">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Chip active={modo === 'manuale'} onClick={() => setModo('manuale')}>
            <PencilLine size={11} className="mr-1 -mt-0.5 inline" /> A mano
          </Chip>
          <Chip active={modo === 'sgarro'} onClick={() => setModo('sgarro')}>
            <PartyPopper size={11} className="mr-1 -mt-0.5 inline" /> Sgarro
          </Chip>
        </div>

        <Field label="Momento della giornata">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {MOMENTI.map((m) => (
              <Chip key={m} active={momento === m} onClick={() => setMomento(m)}>
                {MOMENTO_LABEL[m]}
              </Chip>
            ))}
          </div>
        </Field>

        {modo === 'manuale' ? (
          <>
            <Field label="Cosa hai mangiato">
              <input
                className={inputCls}
                placeholder="es. Insalata di riso della mensa"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Proteine (g)">
                <input
                  type="number"
                  inputMode="decimal"
                  className={cx(inputCls, 'text-center')}
                  value={prot}
                  onChange={(e) => setProt(e.target.value)}
                />
              </Field>
              <Field label="Carbo (g)">
                <input
                  type="number"
                  inputMode="decimal"
                  className={cx(inputCls, 'text-center')}
                  value={carb}
                  onChange={(e) => setCarb(e.target.value)}
                />
              </Field>
              <Field label="Grassi (g)">
                <input
                  type="number"
                  inputMode="decimal"
                  className={cx(inputCls, 'text-center')}
                  value={gras}
                  onChange={(e) => setGras(e.target.value)}
                />
              </Field>
            </div>

            <Field
              label="Calorie"
              hint={
                kcalDaiMacro > 0
                  ? `Dai macro inseriti verrebbero ${kcalDaiMacro} kcal. Lascia vuoto per usare quelle.`
                  : 'Se conosci solo le calorie, compila solo questo campo.'
              }
            >
              <input
                type="number"
                inputMode="numeric"
                className={inputCls}
                placeholder={kcalDaiMacro > 0 ? String(kcalDaiMacro) : '0'}
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
              />
            </Field>

            {scostamento > 60 && (
              <p className="-mt-2 text-[11px] text-carb">
                Le calorie che hai scritto si scostano di {scostamento} kcal dalla somma dei macro. Vince
                il valore che hai scritto tu.
              </p>
            )}

            <Button full disabled={kcalFinali <= 0} onClick={salvaManuale}>
              Aggiungi {kcalFinali > 0 ? `· ${kcalFinali} kcal` : ''}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-muted">
              Valori medi di una porzione da ristorante o da asporto. Registrarlo è meglio che saltarlo:
              uno sgarro dentro i conti è gestibile, uno sgarro invisibile no.
            </p>
            <div className="space-y-2">
              {SGARRI.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    addPasto({
                      data,
                      momento,
                      nome: s.nome,
                      porzioni: 1,
                      kcal: s.kcal,
                      proteine: s.proteine,
                      carbs: s.carbs,
                      grassi: s.grassi,
                      tipo: 'sgarro',
                    });
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-raise px-3.5 py-2.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.nome}</span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      P {s.proteine} · C {s.carbs} · G {s.grassi}
                      {s.nota ? ` · ${s.nota}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-carb">{s.kcal}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
