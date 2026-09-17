import { useMemo, useState } from 'react';
import { History, PartyPopper, PencilLine, ScanBarcode } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SGARRI } from '../data/sgarri';
import type { Meal } from '../data/recipes';
import { MOMENTI, MOMENTO_LABEL } from '../lib/diet';
import { Button, Chip, Field, Sheet, cx, inputCls } from './ui';
import { kcalDaMacro } from '../lib/nutrition';
import { pastiFrequenti } from '../lib/pastiFrequenti';
import { ScannerBarcode } from './ScannerBarcode';
import { cercaProdotto, porzione, type ProdottoOFF } from '../lib/openfoodfacts';

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
  const pasti = useStore((s) => s.pasti);
  const frequenti = useMemo(() => pastiFrequenti(pasti, data), [pasti, data]);

  const [modo, setModo] = useState<'manuale' | 'frequenti' | 'barcode' | 'sgarro'>('manuale');
  const [prodotto, setProdotto] = useState<ProdottoOFF | null>(null);
  const [grammi, setGrammi] = useState(100);
  const [statoRicerca, setStatoRicerca] = useState('');
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
          {frequenti.length > 0 && (
            <Chip active={modo === 'frequenti'} onClick={() => setModo('frequenti')}>
              <History size={11} className="mr-1 -mt-0.5 inline" /> Soliti
            </Chip>
          )}
          <Chip active={modo === 'barcode'} onClick={() => setModo('barcode')}>
            <ScanBarcode size={11} className="mr-1 -mt-0.5 inline" /> Barcode
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

        {modo === 'barcode' ? (
          <>
            {!prodotto ? (
              <>
                <ScannerBarcode
                  onCodice={async (codice) => {
                    setStatoRicerca('Cerco su Open Food Facts…');
                    const esito = await cercaProdotto(codice);
                    if (esito.stato === 'trovato') {
                      setProdotto(esito.prodotto);
                      setGrammi(esito.prodotto.porzioneG ?? 100);
                      setStatoRicerca('');
                    } else if (esito.stato === 'assente') {
                      setStatoRicerca(
                        `Il codice ${codice} non è in Open Food Facts. Registralo a mano.`,
                      );
                    } else {
                      setStatoRicerca(esito.messaggio);
                    }
                  }}
                />
                {statoRicerca && <p className="text-[11px] text-muted">{statoRicerca}</p>}
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-raise px-3.5 py-3">
                  <p className="text-sm font-semibold">{prodotto.nome}</p>
                  <p className="text-[11px] text-muted">
                    {prodotto.marca ? `${prodotto.marca} · ` : ''}per 100 g: {prodotto.per100.kcal}{' '}
                    kcal · P {prodotto.per100.proteine} · C {prodotto.per100.carbs} · G{' '}
                    {prodotto.per100.grassi}
                  </p>
                </div>

                {prodotto.incompleto && (
                  <p className="text-[11px] leading-relaxed text-carb">
                    Su Open Food Facts questo prodotto non ha le calorie: sono dati inseriti dagli
                    utenti e a volte mancano. Controlla l'etichetta e correggi a mano.
                  </p>
                )}

                <Field label="Quanti grammi">
                  <input
                    type="number"
                    min={1}
                    value={grammi}
                    onChange={(e) => setGrammi(Math.max(1, Number(e.target.value) || 1))}
                    className={inputCls}
                  />
                </Field>

                <Button
                  full
                  disabled={porzione(prodotto, grammi).kcal <= 0}
                  onClick={() => {
                    const m = porzione(prodotto, grammi);
                    addPasto({
                      data,
                      momento,
                      nome: `${prodotto.nome}${prodotto.marca ? ` (${prodotto.marca})` : ''} ${grammi} g`,
                      porzioni: 1,
                      kcal: m.kcal,
                      proteine: m.proteine,
                      carbs: m.carbs,
                      grassi: m.grassi,
                      tipo: 'normale',
                    });
                    setProdotto(null);
                    onClose();
                  }}
                >
                  Aggiungi · {porzione(prodotto, grammi).kcal} kcal
                </Button>

                <button
                  onClick={() => {
                    setProdotto(null);
                    setStatoRicerca('');
                  }}
                  className="w-full text-center text-[11px] text-muted underline"
                >
                  Cerca un altro prodotto
                </button>
              </div>
            )}
          </>
        ) : modo === 'frequenti' ? (
          <>
            <p className="text-xs leading-relaxed text-muted">
              Quello che registri più spesso, coi macro dell'ultima volta. Un tocco e va nel diario
              del momento scelto qui sopra.
            </p>
            <div className="space-y-2">
              {frequenti.map((f) => (
                <button
                  key={f.chiave}
                  onClick={() => {
                    addPasto({
                      data,
                      momento,
                      nome: f.nome,
                      porzioni: 1,
                      kcal: f.kcal,
                      proteine: f.proteine,
                      carbs: f.carbs,
                      grassi: f.grassi,
                      tipo: f.tipo ?? 'normale',
                    });
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-raise px-3.5 py-2.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{f.nome}</span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      P {f.proteine} · C {f.carbs} · G {f.grassi} · {f.volte} volte
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums">{f.kcal}</span>
                </button>
              ))}
            </div>
          </>
        ) : modo === 'manuale' ? (
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
