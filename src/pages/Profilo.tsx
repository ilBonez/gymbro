import { useState } from 'react';
import { Moon, RotateCcw, Save, Smartphone, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ACTIVITY_FACTORS, GOAL_RULES, bmi, bmiCategoria } from '../lib/nutrition';
import type { ActivityLevel, Sex } from '../types';
import type { Goal } from '../data/programs';
import { useTargets } from '../lib/useTargets';
import { Button, Card, Field, SectionTitle, Stat, Warn, cx, inputCls } from '../components/ui';
import { TEMI } from '../lib/theme';
import { BackupPannello, ImpostazioniNotifichePannello } from '../components/ImpostazioniDati';
import type { Tema } from '../lib/theme';

export default function Profilo() {
  const profile = useStore((s) => s.profile);
  const aggiorna = useStore((s) => s.aggiornaProfilo);
  const reset = useStore((s) => s.resetTutto);
  const tema = useStore((s) => s.tema);
  const setTema = useStore((s) => s.setTema);
  const obiettivi = useStore((s) => s.obiettiviAttivita);
  const setObiettivi = useStore((s) => s.setObiettiviAttivita);
  const targets = useTargets(true);

  const [salvato, setSalvato] = useState(false);
  const [bozza, setBozza] = useState(profile);

  if (!profile || !bozza || !targets) return null;

  const cambiato = JSON.stringify(bozza) !== JSON.stringify(profile);
  const iBmi = bmi(bozza.pesoKg, bozza.altezzaCm);
  const cat = bmiCategoria(iBmi);

  const salva = () => {
    aggiorna(bozza);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 1800);
  };


  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Profilo</h1>

      <SectionTitle>Dati personali</SectionTitle>
      <Card className="space-y-3.5">
        <Field label="Nome">
          <input className={inputCls} value={bozza.nome} onChange={(e) => setBozza({ ...bozza, nome: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Età">
            <input
              type="number"
              inputMode="numeric"
              className={inputCls}
              value={bozza.eta}
              onChange={(e) => setBozza({ ...bozza, eta: +e.target.value })}
            />
          </Field>
          <Field label="Sesso biologico">
            <select
              className={inputCls}
              value={bozza.sesso}
              onChange={(e) => setBozza({ ...bozza, sesso: e.target.value as Sex })}
            >
              <option value="uomo">Uomo</option>
              <option value="donna">Donna</option>
            </select>
          </Field>
          <Field label="Altezza (cm)">
            <input
              type="number"
              inputMode="decimal"
              className={inputCls}
              value={bozza.altezzaCm}
              onChange={(e) => setBozza({ ...bozza, altezzaCm: +e.target.value })}
            />
          </Field>
          <Field label="Peso (kg)">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              className={inputCls}
              value={bozza.pesoKg}
              onChange={(e) => setBozza({ ...bozza, pesoKg: +e.target.value })}
            />
          </Field>
        </div>

        <Field label="Livello di attività">
          <select
            className={inputCls}
            value={bozza.attivita}
            onChange={(e) => setBozza({ ...bozza, attivita: e.target.value as ActivityLevel })}
          >
            {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_FACTORS[k].label} — {ACTIVITY_FACTORS[k].desc}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Peso obiettivo (kg, opzionale)">
          <input
            type="number"
            step="0.5"
            inputMode="decimal"
            className={inputCls}
            value={bozza.pesoTargetKg ?? ''}
            onChange={(e) =>
              setBozza({ ...bozza, pesoTargetKg: e.target.value ? +e.target.value : undefined })
            }
          />
        </Field>
      </Card>

      <SectionTitle>Obiettivo</SectionTitle>
      <div className="space-y-2.5">
        {(Object.keys(GOAL_RULES) as Goal[]).map((g) => (
          <button
            key={g}
            onClick={() => setBozza({ ...bozza, obiettivo: g })}
            className={cx(
              'w-full rounded-2xl border p-3.5 text-left transition-colors',
              bozza.obiettivo === g ? 'border-brand-500 bg-brand-500/10' : 'border-line bg-surface',
            )}
          >
            <span className="text-sm font-semibold">{GOAL_RULES[g].label}</span>
            <p className="mt-0.5 text-xs text-muted">{GOAL_RULES[g].descrizione}</p>
          </button>
        ))}
      </div>

      {bozza.obiettivo === 'definizione' && (
        <div className="mt-3">
          <Warn>
            Il blocco low carb va tenuto 4-6 settimane al massimo, poi 2-3 settimane a mantenimento. Tirare
            troppo a lungo fa perdere forza, sonno e massa magra, e rallenta il metabolismo adattandolo al
            deficit.
          </Warn>
        </div>
      )}

      <SectionTitle>Calcoli attuali</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="BMI" value={iBmi} tone={cat.color} sub={cat.label} />
        <Stat label="Metabolismo basale" value={targets.bmr} unit="kcal" />
        <Stat label="Fabbisogno (TDEE)" value={targets.tdee} unit="kcal" />
        <Stat
          label="Target allenamento"
          value={targets.macro.kcal}
          unit="kcal"
          tone="text-brandink"
          sub={`P ${targets.macro.proteine} / C ${targets.macro.carbs} / G ${targets.macro.grassi}`}
        />
      </div>

      {cambiato && (
        <div className="sticky bottom-24 mt-5 -mx-4 bg-gradient-to-t from-page via-page/95 to-transparent px-4 pb-2 pt-6">
          <Button full onClick={salva}>
            <Save size={15} className="mr-1.5 -mt-0.5 inline" /> Salva modifiche
          </Button>
        </div>
      )}
      {salvato && <p className="mt-3 text-center text-xs text-brandink">Profilo aggiornato.</p>}

      <SectionTitle>Aspetto</SectionTitle>
      <Card className="!p-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {TEMI.map((t) => {
            const Icona = t.id === 'chiaro' ? Sun : t.id === 'scuro' ? Moon : Smartphone;
            return (
              <button
                key={t.id}
                onClick={() => setTema(t.id as Tema)}
                className={cx(
                  'rounded-xl border px-2 py-3 text-center transition-colors',
                  tema === t.id
                    ? 'border-brand-500 bg-brand-500/10 text-brandink'
                    : 'border-transparent text-muted hover:bg-raise',
                )}
              >
                <Icona size={17} className="mx-auto" />
                <span className="mt-1.5 block text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="px-2 pb-1.5 pt-2 text-[11px] text-muted">
          {TEMI.find((t) => t.id === tema)?.desc}
        </p>
      </Card>

      <SectionTitle>Obiettivi giornalieri</SectionTitle>
      <Card className="space-y-3.5">
        <p className="text-xs leading-relaxed text-muted">
          Sono i traguardi degli anelli in home: movimento, passi e sonno.
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label="Kcal">
            <input
              type="number"
              inputMode="numeric"
              className={cx(inputCls, 'text-center')}
              value={obiettivi.kcal}
              onChange={(e) => setObiettivi({ kcal: Math.max(0, +e.target.value) })}
            />
          </Field>
          <Field label="Passi">
            <input
              type="number"
              inputMode="numeric"
              className={cx(inputCls, 'text-center')}
              value={obiettivi.passi}
              onChange={(e) => setObiettivi({ passi: Math.max(0, +e.target.value) })}
            />
          </Field>
          <Field label="Sonno (ore)">
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              className={cx(inputCls, 'text-center')}
              value={obiettivi.sonnoOre}
              onChange={(e) => setObiettivi({ sonnoOre: Math.max(0, +e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      <ImpostazioniNotifichePannello />

      <BackupPannello />

      <SectionTitle>Dati</SectionTitle>
      <div className="space-y-2.5">
        <Button
          full
          variant="danger"
          onClick={() => {
            if (confirm('Cancellare profilo, piano, pesate e storico? Operazione non annullabile.')) reset();
          }}
        >
          <RotateCcw size={15} className="mr-1.5 -mt-0.5 inline" /> Azzera tutto
        </Button>
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-muted">
        Tutti i dati restano sul tuo dispositivo. Nessun account, nessun server, niente esce di qui.
      </p>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        GymBro non è un dispositivo medico e non sostituisce un medico, un dietista o un preparatore. Le
        stime caloriche hanno un margine di errore del 10-15%: usale come punto di partenza e correggile in
        base ai risultati reali.
      </p>
    </div>
  );
}
