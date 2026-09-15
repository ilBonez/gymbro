import { useState } from 'react';
import { ArrowRight, Check, Dumbbell } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ACTIVITY_FACTORS, GOAL_RULES, bmr, bmi, bmiCategoria, macroTargets, tdee } from '../lib/nutrition';
import type { ActivityLevel, Sex } from '../types';
import type { Goal } from '../data/programs';
import { Button, Card, Field, cx, inputCls } from '../components/ui';

const PASSI = ['Chi sei', 'Misure', 'Attività', 'Obiettivo'];

export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile);
  const completa = useStore((s) => s.completaOnboarding);

  const [step, setStep] = useState(0);
  const [nome, setNome] = useState('');
  const [sesso, setSesso] = useState<Sex>('uomo');
  const [eta, setEta] = useState(30);
  const [altezza, setAltezza] = useState(178);
  const [peso, setPeso] = useState(80);
  const [attivita, setAttivita] = useState<ActivityLevel>('moderato');
  const [obiettivo, setObiettivo] = useState<Goal>('definizione');

  const b = bmr(sesso, peso, altezza, eta);
  const t = tdee(b, attivita);
  const m = macroTargets(obiettivo, peso, t);
  const iBmi = bmi(peso, altezza);
  const cat = bmiCategoria(iBmi);

  const avanti = () => setStep((s) => Math.min(PASSI.length, s + 1));

  const salva = () => {
    setProfile({
      nome: nome.trim() || 'Atleta',
      sesso,
      eta,
      altezzaCm: altezza,
      pesoKg: peso,
      attivita,
      obiettivo,
      creato: new Date().toISOString(),
    });
    completa();
  };

  return (
    <div className="min-h-full bg-ink-900 safe-top safe-bottom">
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-ink-950">
            <Dumbbell size={19} strokeWidth={2.6} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">GymBro</h1>
            <p className="text-xs text-ink-400">Allenamento e dieta, nello stesso posto</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1.5">
          {PASSI.map((_, i) => (
            <div
              key={i}
              className={cx('h-1 flex-1 rounded-full', i <= step ? 'bg-brand-500' : 'bg-ink-700')}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4 animate-in-up">
            <h2 className="text-xl font-bold">Come ti chiami?</h2>
            <Field label="Nome">
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Il tuo nome" />
            </Field>
            <Field label="Sesso biologico" hint="Serve solo per la formula del metabolismo basale.">
              <div className="grid grid-cols-2 gap-2">
                {(['uomo', 'donna'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSesso(s)}
                    className={cx(
                      'rounded-xl border py-2.5 text-sm capitalize',
                      sesso === s ? 'border-brand-500 bg-brand-500/12 text-brand-300' : 'border-ink-700 bg-ink-800 text-ink-300',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Età: ${eta} anni`}>
              <input type="range" min={14} max={85} value={eta} onChange={(e) => setEta(+e.target.value)} className="w-full accent-brand-500" />
            </Field>
            <Button full onClick={avanti}>
              Continua <ArrowRight size={16} className="inline ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in-up">
            <h2 className="text-xl font-bold">Le tue misure</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Altezza (cm)">
                <input type="number" inputMode="decimal" className={inputCls} value={altezza} onChange={(e) => setAltezza(+e.target.value)} />
              </Field>
              <Field label="Peso (kg)">
                <input type="number" inputMode="decimal" step="0.1" className={inputCls} value={peso} onChange={(e) => setPeso(+e.target.value)} />
              </Field>
            </div>
            <Card>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-300">Indice di massa corporea</span>
                <span className="text-2xl font-bold tabular-nums">{iBmi}</span>
              </div>
              <p className={cx('mt-1 text-sm font-medium', cat.color)}>{cat.label}</p>
              <p className="mt-2 text-xs text-ink-400">
                Il BMI è solo un riferimento grezzo: non distingue muscolo da grasso. Peso e misure nel tempo contano molto di più.
              </p>
            </Card>
            <Button full onClick={avanti} disabled={altezza < 120 || peso < 30}>
              Continua <ArrowRight size={16} className="inline ml-1" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-in-up">
            <h2 className="text-xl font-bold">Quanto ti muovi?</h2>
            {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((k) => (
              <button
                key={k}
                onClick={() => setAttivita(k)}
                className={cx(
                  'w-full rounded-2xl border p-4 text-left transition-colors',
                  attivita === k ? 'border-brand-500 bg-brand-500/10' : 'border-ink-700 bg-ink-850',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{ACTIVITY_FACTORS[k].label}</span>
                  <span className="text-xs tabular-nums text-ink-400">×{ACTIVITY_FACTORS[k].f}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-400">{ACTIVITY_FACTORS[k].desc}</p>
              </button>
            ))}
            <Button full onClick={avanti}>
              Continua <ArrowRight size={16} className="inline ml-1" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 animate-in-up">
            <h2 className="text-xl font-bold">Qual è l'obiettivo?</h2>
            {(Object.keys(GOAL_RULES) as Goal[]).map((g) => (
              <button
                key={g}
                onClick={() => setObiettivo(g)}
                className={cx(
                  'w-full rounded-2xl border p-4 text-left transition-colors',
                  obiettivo === g ? 'border-brand-500 bg-brand-500/10' : 'border-ink-700 bg-ink-850',
                )}
              >
                <span className="font-semibold text-sm">{GOAL_RULES[g].label}</span>
                <p className="mt-0.5 text-xs text-ink-400">{GOAL_RULES[g].descrizione}</p>
              </button>
            ))}

            <Card className="!bg-ink-800/60">
              <p className="text-xs uppercase tracking-wide text-ink-400">Il tuo punto di partenza</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-ink-400 text-xs block">Metabolismo basale</span>
                  <span className="font-bold tabular-nums">{b} kcal</span>
                </div>
                <div>
                  <span className="text-ink-400 text-xs block">Fabbisogno (TDEE)</span>
                  <span className="font-bold tabular-nums">{t} kcal</span>
                </div>
                <div>
                  <span className="text-ink-400 text-xs block">Target giornaliero</span>
                  <span className="font-bold tabular-nums text-brand-400">{m.kcal} kcal</span>
                </div>
                <div>
                  <span className="text-ink-400 text-xs block">Proteine / Carbo / Grassi</span>
                  <span className="font-bold tabular-nums">
                    {m.proteine} / {m.carbs} / {m.grassi} g
                  </span>
                </div>
              </div>
            </Card>

            <Button full onClick={salva}>
              <Check size={16} className="inline mr-1.5" /> Inizia
            </Button>
            <p className="pt-1 text-center text-[11px] leading-relaxed text-ink-400">
              GymBro è uno strumento di supporto, non un servizio medico. Se hai patologie, prendi farmaci
              o sei in gravidanza, parlane con un medico prima di cambiare dieta o allenamento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
