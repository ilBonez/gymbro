import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus, Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button, Card, Empty, Field, SectionTitle, Sheet, Stat, cx, inputCls } from '../components/ui';
import { giorniTra, oggi } from '../lib/date';
import { bmi, bmiCategoria, pesoIdealeRange, variazionePesoAttesa } from '../lib/nutrition';
import { useTargets } from '../lib/useTargets';
import { HealthCard } from '../components/HealthCard';
import { NAV_PROGRESSI, SottoNav } from '../components/SottoNav';
import { CIRCONFERENZE } from '../types';
import { massaGrassaNavy } from '../lib/nutrition';
import { coloreTema } from '../lib/theme';

export default function Progressi() {
  const profile = useStore((s) => s.profile);
  const pesi = useStore((s) => s.pesi);
  const addPeso = useStore((s) => s.addPeso);
  const removePeso = useStore((s) => s.removePeso);
  const targets = useTargets(true);

  const tema = useStore((s) => s.tema);
  // i grafici vogliono colori concreti, non variabili CSS: li rileggiamo a ogni cambio tema
  const colori = useMemo(
    () => ({
      griglia: coloreTema('line', '#e5e7eb'),
      testo: coloreTema('muted', '#6b7280'),
      superficie: coloreTema('surface', '#ffffff'),
      bordo: coloreTema('line2', '#d1d5db'),
      brand: coloreTema('brand-500', '#f97316'),
      accento: coloreTema('prot', '#0284c7'),
    }),
    [tema],
  );

  const [sheet, setSheet] = useState(false);
  const [data, setData] = useState(oggi());
  const [peso, setPeso] = useState(profile?.pesoKg ?? 80);
  const [bf, setBf] = useState('');
  const [misure, setMisure] = useState<Record<string, string>>({});

  /**
   * Il peso oscilla di 1-2 kg al giorno per acqua, sale e glicogeno: da solo il
   * punto grezzo non dice niente. La media mobile a 7 giorni e' la linea che
   * conta davvero, e va guardata su due o tre settimane.
   */
  const serie = useMemo(
    () =>
      pesi.map((p, i) => {
        const finestra = pesi.filter(
          (q, j) => j <= i && giorniTra(q.data, p.data) < 7,
        );
        const media = finestra.reduce((t, q) => t + q.pesoKg, 0) / Math.max(finestra.length, 1);
        return {
          data: p.data.slice(5),
          peso: p.pesoKg,
          media: +media.toFixed(2),
          vita: p.vitaCm,
        };
      }),
    [pesi],
  );

  if (!profile || !targets) return null;

  const primo = pesi[0];
  const ultimo = pesi[pesi.length - 1];
  const totale = primo && ultimo ? +(ultimo.pesoKg - primo.pesoKg).toFixed(1) : 0;
  const settimanaFa = [...pesi].reverse().find((p) => giorniTra(p.data, oggi()) >= 7);
  const delta7 = ultimo && settimanaFa ? +(ultimo.pesoKg - settimanaFa.pesoKg).toFixed(1) : null;

  const iBmi = ultimo ? bmi(ultimo.pesoKg, profile.altezzaCm) : bmi(profile.pesoKg, profile.altezzaCm);
  const cat = bmiCategoria(iBmi);
  const [minIdeale, maxIdeale] = pesoIdealeRange(profile.altezzaCm);
  const attesa = variazionePesoAttesa(targets.macro.kcal, targets.tdee);

  const navy = massaGrassaNavy(
    profile.sesso,
    profile.altezzaCm,
    misure.vitaCm ? +misure.vitaCm : 0,
    misure.colloCm ? +misure.colloCm : 0,
    misure.fianchiCm ? +misure.fianchiCm : undefined,
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Progressi</h1>
        <Button onClick={() => setSheet(true)} className="shrink-0">
          <Plus size={15} className="mr-1 -mt-0.5 inline" /> Pesati
        </Button>
      </div>

      <SottoNav voci={NAV_PROGRESSI} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat
          label="Peso"
          value={ultimo?.pesoKg ?? profile.pesoKg}
          unit="kg"
          sub={
            totale !== 0 ? (
              <span className={totale < 0 ? 'text-brandink' : 'text-carb'}>
                {totale > 0 ? '+' : ''}
                {totale} kg dall'inizio
              </span>
            ) : (
              'Primo dato registrato'
            )
          }
        />
        <Stat
          label="Ultimi 7 giorni"
          value={delta7 === null ? '—' : `${delta7 > 0 ? '+' : ''}${delta7}`}
          unit={delta7 === null ? '' : 'kg'}
          tone={delta7 === null ? '' : delta7 < 0 ? 'text-brandink' : delta7 > 0 ? 'text-carb' : ''}
          sub={`Atteso ${attesa > 0 ? '+' : ''}${attesa} kg/sett`}
        />
        <Stat label="BMI" value={iBmi} tone={cat.color} sub={cat.label} />
        <Stat
          label="Range normopeso"
          value={`${minIdeale}-${maxIdeale}`}
          unit="kg"
          sub="Per la tua altezza"
        />
      </div>

      <HealthCard />

      <SectionTitle>Andamento peso</SectionTitle>
      {serie.length < 2 ? (
        <Empty
          icon={<Scale size={24} />}
          title="Servono almeno due pesate"
          sub="Pesati sempre nelle stesse condizioni: al mattino, dopo il bagno, prima di mangiare."
          action={<Button onClick={() => setSheet(true)}>Aggiungi peso</Button>}
        />
      ) : (
        <Card className="!px-1 !py-3">
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={serie} margin={{ top: 6, right: 14, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={colori.griglia} vertical={false} />
              <XAxis dataKey="data" tick={{ fill: colori.testo, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fill: colori.testo, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: colori.superficie,
                  border: `1px solid ${colori.bordo}`,
                  color: coloreTema('ink', '#111827'),
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: colori.testo }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke={colori.testo}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={{ r: 2, fill: colori.testo }}
                activeDot={{ r: 4 }}
                name="Pesata"
              />
              <Line
                type="monotone"
                dataKey="media"
                stroke={colori.brand}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
                name="Tendenza 7 giorni"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="px-3 pb-1 pt-2 text-[10px] leading-relaxed text-muted">
            La linea piena è la media degli ultimi 7 giorni: è quella da guardare. I puntini
            tratteggiati sono le pesate singole, che oscillano di 1-2 kg per acqua e sale.
          </p>
        </Card>
      )}

      {pesi.length > 0 && (
        <>
          <SectionTitle>Registro pesate</SectionTitle>
          <Card className="!p-1.5">
            <ul className="divide-y divide-line/50">
              {[...pesi].reverse().map((p, i, arr) => {
                const prec = arr[i + 1];
                const d = prec ? +(p.pesoKg - prec.pesoKg).toFixed(1) : null;
                return (
                  <li key={p.id} className="flex items-center gap-3 px-2.5 py-2.5">
                    <span className="w-24 shrink-0 text-xs text-muted">{p.data}</span>
                    <span className="flex-1 text-sm font-semibold tabular-nums">{p.pesoKg} kg</span>
                    {p.vitaCm && <span className="text-[11px] text-muted">vita {p.vitaCm}</span>}
                    {p.massaGrassaPct && (
                      <span className="text-[11px] text-muted">{p.massaGrassaPct}% gr</span>
                    )}
                    {d !== null && d !== 0 && (
                      <span
                        className={cx(
                          'inline-flex items-center gap-0.5 text-[11px] tabular-nums',
                          d < 0 ? 'text-brandink' : 'text-carb',
                        )}
                      >
                        {d < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {Math.abs(d)}
                      </span>
                    )}
                    <button
                      onClick={() => removePeso(p.id)}
                      className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-300"
                      aria-label="Elimina"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Nuova pesata">
        <div className="space-y-3.5">
          <Field label="Data">
            <input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Peso (kg)" hint="Al mattino, a digiuno, dopo il bagno: sempre nelle stesse condizioni.">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              className={inputCls}
              value={peso}
              onChange={(e) => setPeso(+e.target.value)}
            />
          </Field>
          <Field label="Massa grassa % (opz.)" hint="Lasciala vuota: se misuri collo e vita la stimo io.">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              className={inputCls}
              value={bf}
              onChange={(e) => setBf(e.target.value)}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-medium text-soft">Circonferenze (cm, tutte opzionali)</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CIRCONFERENZE.map((c) => (
                <Field key={c.campo} label={c.label} hint={c.dove}>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    className={cx(inputCls, 'text-center')}
                    value={misure[c.campo] ?? ''}
                    onChange={(e) => setMisure((m) => ({ ...m, [c.campo]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>
            {navy !== null && (
              <p className="mt-2.5 rounded-xl bg-raise px-3 py-2 text-[11px] leading-relaxed text-soft">
                Con collo e vita la formula della Marina americana stima{' '}
                <b className="text-brandink">{navy}% di massa grassa</b>. Errore tipico 3-4 punti: guarda
                come cambia nel tempo, non il valore assoluto.
              </p>
            )}
          </div>
          <Button
            full
            onClick={() => {
              const num = (k: string) => (misure[k] ? +misure[k] : undefined);
              addPeso({
                data,
                pesoKg: peso,
                massaGrassaPct: bf ? +bf : (navy ?? undefined),
                colloCm: num('colloCm'),
                toraceCm: num('toraceCm'),
                braccioCm: num('braccioCm'),
                vitaCm: num('vitaCm'),
                fianchiCm: num('fianchiCm'),
                cosciaCm: num('cosciaCm'),
              });
              setBf('');
              setMisure({});
              setSheet(false);
            }}
          >
            Salva
          </Button>
          <p className="text-[11px] text-muted">
            Il peso oscilla di 1-2 kg al giorno per acqua, sale e glicogeno: guarda la tendenza su 2-3 settimane,
            non il singolo numero.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
