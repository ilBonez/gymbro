import { useEffect, useState } from 'react';
import { Activity, Check, ExternalLink, Footprints, HeartPulse, Link2, RefreshCw, Settings2, Smartphone } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  apriImpostazioni,
  apriInformativa,
  chiediPermessi,
  leggiDati,
  mediaKcalAttive,
  mediaPassi,
  statoHealth,
} from '../lib/health';
import type { DatiHealth, StatoHealth } from '../lib/health';
import { Button, Card, SectionTitle, Tag, cx } from './ui';
import { useTargets } from '../lib/useTargets';

export function HealthCard() {
  const health = useStore((s) => s.health);
  const setHealth = useStore((s) => s.setHealth);
  const addPeso = useStore((s) => s.addPeso);
  const targets = useTargets(true);

  const [stato, setStato] = useState<StatoHealth | null>(null);
  const [dati, setDati] = useState<DatiHealth | null>(null);
  const [caricando, setCaricando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    statoHealth().then(setStato);
  }, []);

  const autorizzato = !!stato?.disponibile && stato.autorizzati.length > 0;

  const sincronizza = async () => {
    setCaricando(true);
    setMsg('');
    try {
      const d = await leggiDati(14);
      setDati(d);
      setHealth({
        collegato: true,
        ultimaSync: new Date().toISOString(),
        passiMedi: mediaPassi(d.giorni),
        kcalAttiveMedie: mediaKcalAttive(d.giorni),
        fcRiposo: d.fcRiposo,
      });
      if (!d.pesoKg && d.giorni.length === 0) {
        setMsg('Health Connect è collegato ma non contiene ancora dati.');
      }
    } finally {
      setCaricando(false);
    }
  };

  const collega = async () => {
    setCaricando(true);
    const s = await chiediPermessi();
    setStato(s);
    setCaricando(false);
    if (s.autorizzati.length > 0) await sincronizza();
    else setMsg('Nessun permesso concesso. Puoi cambiarli dalle impostazioni di Health Connect.');
  };

  const importaPeso = () => {
    if (!dati?.pesoKg || !dati.pesoData) return;
    addPeso({ data: dati.pesoData, pesoKg: dati.pesoKg, note: `Da ${dati.pesoFonte ?? 'Health Connect'}` });
    setMsg(`Peso ${dati.pesoKg} kg del ${dati.pesoData} salvato nel registro.`);
  };

  // in attesa del primo controllo non mostriamo nulla: evita un lampeggio
  if (!stato) return null;

  if (!stato.disponibile) {
    return (
      <>
        <SectionTitle>Dati dal telefono</SectionTitle>
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-800 text-ink-400">
              <Smartphone size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Health Connect non disponibile qui</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                {stato.piattaforma === 'web'
                  ? "Funziona solo nell'app installata sul telefono (APK Android o build iOS), non nel browser."
                  : (stato.motivo ??
                    'Su Android 14 e successivi è già nel sistema. Su Android 9-13 va installata "Health Connect" dal Play Store.')}
              </p>
            </div>
          </div>
        </Card>
      </>
    );
  }

  const passiMedi = dati ? mediaPassi(dati.giorni) : health.passiMedi;
  const kcalMedie = dati ? mediaKcalAttive(dati.giorni) : health.kcalAttiveMedie;
  const fc = dati?.fcRiposo ?? health.fcRiposo;

  // confronto onesto fra il TDEE stimato dalla formula e il movimento misurato
  const tdeeMisurato = targets && kcalMedie ? Math.round(targets.bmr * 1.1 + kcalMedie) : null;
  const scarto = targets && tdeeMisurato ? tdeeMisurato - targets.tdee : null;

  return (
    <>
      <SectionTitle
        action={
          autorizzato ? (
            <button onClick={sincronizza} disabled={caricando} className="text-xs text-brand-400 disabled:opacity-50">
              <RefreshCw size={11} className={cx('mr-1 -mt-0.5 inline', caricando && 'animate-spin')} />
              Sincronizza
            </button>
          ) : undefined
        }
      >
        Dati dal telefono
      </SectionTitle>

      {!autorizzato ? (
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-400">
              <Link2 size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">Collega Health Connect</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                GymBro legge <b>peso, passi, calorie attive e frequenza cardiaca</b> da quello che già
                registrano bilancia, orologio o app di fitness. Non scrive nulla e non manda niente fuori dal
                telefono.
              </p>
            </div>
          </div>
          <Button full className="mt-3.5" onClick={collega} disabled={caricando}>
            {caricando ? 'Attendo i permessi…' : 'Collega'}
          </Button>
          <button onClick={apriInformativa} className="mt-2.5 w-full text-center text-[11px] text-ink-400 underline">
            Informativa privacy
          </button>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <Tag tone="brand">
              <Check size={10} className="mr-1 -mt-0.5 inline" strokeWidth={3} />
              Collegato
            </Tag>
            <span className="text-[11px] text-ink-400">
              {health.ultimaSync
                ? `Ultima sync ${new Date(health.ultimaSync).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                : 'Mai sincronizzato'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [<Footprints key="p" size={14} />, 'Passi/giorno', passiMedi?.toLocaleString('it-IT') ?? '—'],
              [<Activity key="k" size={14} />, 'Kcal attive', kcalMedie?.toLocaleString('it-IT') ?? '—'],
              [<HeartPulse key="f" size={14} />, 'FC a riposo', fc ?? '—'],
            ].map(([icon, label, value], i) => (
              <div key={i} className="rounded-xl bg-ink-800 py-2.5">
                <span className="flex justify-center text-ink-400">{icon}</span>
                <p className="mt-1 text-base font-bold tabular-nums">{value}</p>
                <p className="text-[10px] text-ink-400">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-400">Medie degli ultimi 14 giorni.</p>

          {dati?.pesoKg && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-800 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tabular-nums">{dati.pesoKg} kg</p>
                <p className="text-[11px] text-ink-400">
                  {dati.pesoData}
                  {dati.pesoFonte ? ` · ${dati.pesoFonte}` : ''}
                </p>
              </div>
              <Button onClick={importaPeso}>Importa</Button>
            </div>
          )}

          {scarto !== null && Math.abs(scarto) > 150 && (
            <p className="mt-3 text-[11px] leading-relaxed text-carb">
              Il movimento misurato suggerisce un fabbisogno di circa <b>{tdeeMisurato} kcal</b>, contro le{' '}
              {targets?.tdee} stimate dal livello di attività che hai dichiarato
              {scarto > 0 ? ': ti muovi più di quanto hai indicato.' : ': ti muovi meno di quanto hai indicato.'}{' '}
              Se il peso non si muove come previsto, correggi il livello nel profilo.
            </p>
          )}

          {stato.storicoEsteso === false && (
            <p className="mt-3 text-[11px] text-ink-400">
              Senza il permesso sullo storico, Health Connect restituisce solo gli ultimi 30 giorni.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <Button variant="ghost" className="flex-1 !text-xs" onClick={apriImpostazioni}>
              <Settings2 size={13} className="mr-1.5 -mt-0.5 inline" /> Permessi
            </Button>
            <Button variant="ghost" className="flex-1 !text-xs" onClick={apriInformativa}>
              <ExternalLink size={13} className="mr-1.5 -mt-0.5 inline" /> Privacy
            </Button>
          </div>
        </Card>
      )}

      {msg && <p className="mt-2 text-center text-[11px] text-brand-400">{msg}</p>}
    </>
  );
}
