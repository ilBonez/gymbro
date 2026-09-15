import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BellRing, Download, HardDriveDownload, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  chiediPermesso,
  disponibili,
  oraCaffeina,
  riprogramma,
} from '../lib/notifiche';
import { leggiBackup, ripristina, salvaBackup, scaricaBackup, ultimoBackup } from '../lib/backup';
import type { Anteprima } from '../lib/backup';
import { Button, Card, Field, SectionTitle, Sheet, cx, inputCls } from './ui';

export function ImpostazioniNotifichePannello() {
  const n = useStore((s) => s.notifiche);
  const setN = useStore((s) => s.setNotifiche);
  const [supportate, setSupportate] = useState<boolean | null>(null);
  const [esito, setEsito] = useState('');

  useEffect(() => {
    disponibili().then(setSupportate);
  }, []);

  // ogni modifica riprogramma le sveglie sul telefono
  useEffect(() => {
    if (supportate) riprogramma(n);
  }, [n, supportate]);

  const attiva = async () => {
    const ok = await chiediPermesso();
    if (!ok) {
      setEsito('Permesso negato. Puoi darlo dalle impostazioni di sistema dell’app.');
      return;
    }
    setEsito('');
    setN({ attive: true });
  };

  return (
    <>
      <SectionTitle>Promemoria</SectionTitle>
      <Card>
        {supportate === false ? (
          <p className="text-xs leading-relaxed text-muted">
            I promemoria funzionano solo nell’app installata sul telefono, non nel browser.
          </p>
        ) : (
          <>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={n.attive}
                onChange={(e) => (e.target.checked ? attiva() : setN({ attive: false }))}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span className="text-sm">
                Promemoria attivi
                <span className="mt-0.5 block text-[11px] text-muted">
                  Sveglie programmate sul telefono: niente server, funzionano offline.
                </span>
              </span>
            </label>

            {n.attive && (
              <div className="mt-4 space-y-3.5 border-t border-line pt-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ora dell’allenamento">
                    <input
                      type="time"
                      className={inputCls}
                      value={n.oraAllenamento}
                      onChange={(e) => setN({ oraAllenamento: e.target.value })}
                    />
                  </Field>
                  <Field label="Caffeina, minuti prima">
                    <input
                      type="number"
                      inputMode="numeric"
                      step="5"
                      className={cx(inputCls, 'text-center')}
                      value={n.anticipoCaffeina}
                      onChange={(e) =>
                        setN({ anticipoCaffeina: Math.max(0, Math.min(120, +e.target.value)) })
                      }
                    />
                  </Field>
                </div>

                {[
                  {
                    k: 'caffeina' as const,
                    label: `Caffeina alle ${oraCaffeina(n)}`,
                    desc: 'Fa effetto in 30-45 minuti: presa troppo tardi non serve.',
                  },
                  {
                    k: 'preAllenamento' as const,
                    label: `Allenamento alle ${n.oraAllenamento}`,
                    desc: 'Con la scheda del giorno già pronta.',
                  },
                  { k: 'pesata' as const, label: 'Pesata del mattino', desc: 'A digiuno, dopo il bagno.' },
                  { k: 'integratoriSera' as const, label: 'Magnesio la sera', desc: undefined },
                ].map((r) => (
                  <label key={r.k} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={n[r.k]}
                      onChange={(e) => setN({ [r.k]: e.target.checked })}
                      className="mt-0.5 h-4 w-4 accent-brand-500"
                    />
                    <span className="text-xs">
                      {r.label}
                      {r.desc && <span className="mt-0.5 block text-muted">{r.desc}</span>}
                    </span>
                  </label>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ora della pesata">
                    <input
                      type="time"
                      className={inputCls}
                      value={n.oraPesata}
                      onChange={(e) => setN({ oraPesata: e.target.value })}
                    />
                  </Field>
                  <Field label="Ora della sera">
                    <input
                      type="time"
                      className={inputCls}
                      value={n.oraSera}
                      onChange={(e) => setN({ oraSera: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            )}
          </>
        )}
        {esito && <p className="mt-2 text-[11px] text-carb">{esito}</p>}
      </Card>
    </>
  );
}

export function BackupPannello() {
  const [esito, setEsito] = useState('');
  const [conferma, setConferma] = useState<{ dati: string; anteprima: Anteprima } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const ultimo = ultimoBackup();

  const salvaOra = async () => {
    const r = await salvaBackup();
    setEsito(r.ok ? `Backup salvato in Documenti/${r.percorso}` : (r.motivo ?? 'Non riuscito.'));
    if (!r.ok) scaricaBackup();
  };

  const scegliFile = async (f: File) => {
    const testo = await f.text();
    const letto = leggiBackup(testo);
    if (!letto) {
      setEsito('Questo file non è un backup di GymBro.');
      return;
    }
    setEsito('');
    setConferma(letto);
  };

  return (
    <>
      <SectionTitle>Backup</SectionTitle>
      <Card>
        <p className="text-xs leading-relaxed text-muted">
          I dati stanno solo su questo dispositivo. L’app ne salva una copia una volta al giorno in
          <b className="text-ink"> Documenti/GymBro</b>, tenendo gli ultimi sette file.
        </p>
        <p className="mt-2 text-[11px] text-muted">
          {ultimo
            ? `Ultimo backup: ${ultimo.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
            : 'Nessun backup ancora salvato.'}
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <Button variant="ghost" onClick={salvaOra}>
            <HardDriveDownload size={15} className="mr-1.5 -mt-0.5 inline" /> Salva ora
          </Button>
          <Button variant="ghost" onClick={() => input.current?.click()}>
            <Upload size={15} className="mr-1.5 -mt-0.5 inline" /> Ripristina
          </Button>
        </div>
        <Button full variant="outline" className="mt-2.5" onClick={scaricaBackup}>
          <Download size={15} className="mr-1.5 -mt-0.5 inline" /> Scarica una copia
        </Button>

        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) scegliFile(f);
            e.target.value = '';
          }}
        />

        {esito && <p className="mt-2.5 text-[11px] text-brandink">{esito}</p>}
      </Card>

      <Sheet open={!!conferma} onClose={() => setConferma(null)} title="Ripristinare questo backup?">
        {conferma && (
          <div className="space-y-4">
            <div className="rounded-xl border border-carb/30 bg-carb/10 p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-carb">
                <AlertTriangle size={15} /> Sovrascrive tutto
              </p>
              <p className="mt-1 text-xs leading-relaxed text-soft">
                Profilo, allenamenti, pesate, piano e diario di adesso vengono sostituiti dal contenuto
                del file. Non si torna indietro.
              </p>
            </div>

            <div className="rounded-xl bg-raise p-3.5 text-sm">
              <p className="font-semibold">{conferma.anteprima.nome}</p>
              <p className="mt-1 text-[11px] text-muted">
                obiettivo {conferma.anteprima.obiettivo} · {conferma.anteprima.allenamenti} allenamenti ·{' '}
                {conferma.anteprima.pesate} pesate · {conferma.anteprima.pasti} pasti
              </p>
            </div>

            <Button full variant="danger" onClick={() => ripristina(conferma.dati)}>
              Sostituisci i dati e riavvia
            </Button>
            <Button full variant="ghost" onClick={() => setConferma(null)}>
              Annulla
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}

export function IconaNotifiche() {
  return <BellRing size={15} />;
}
