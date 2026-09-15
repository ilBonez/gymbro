import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, ChevronDown, Music, Pause, Play, Plus, SkipForward, Square, TrendingUp, Trophy, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { esercizio, scheda } from '../lib/catalog';
import { Button, Card, Sheet, Tag, cx, inputCls } from '../components/ui';
import { fmtDurata } from '../lib/date';
import { MusicaSheet } from '../components/MusicaSheet';
import { recordBattuti, suggerimentoCarico, ultimaEsecuzione } from '../lib/progressione';

function beep(freq = 880, ms = 160) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
    setTimeout(() => ctx.close(), ms + 200);
  } catch {
    /* audio non disponibile: nessun problema */
  }
}

export default function Sessione() {
  const sessione = useStore((s) => s.sessioneAttiva);
  const aggiornaSerie = useStore((s) => s.aggiornaSerie);
  const aggiungiSerie = useStore((s) => s.aggiungiSerie);
  const concludi = useStore((s) => s.concludiSessione);
  const sessioniPassate = useStore((s) => s.sessioni);
  const annulla = useStore((s) => s.annullaSessione);

  const [sec, setSec] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [recupero, setRecupero] = useState<number | null>(null);
  const [aperto, setAperto] = useState(0);
  const [fine, setFine] = useState(false);
  const [nota, setNota] = useState('');
  // dove andare quando la sessione viene chiusa: senza questo, lo svuotamento
  // dello store fa scattare il redirect di fallback prima della navigazione
  const [uscita, setUscita] = useState<string | null>(null);
  const [musica, setMusica] = useState(false);
  const pausaRef = useRef(pausa);
  pausaRef.current = pausa;

  const w = sessione ? scheda(sessione.programId, sessione.workoutId) : undefined;

  useEffect(() => {
    if (!sessione) return;
    const t0 = new Date(sessione.iniziata).getTime();
    const id = setInterval(() => {
      if (!pausaRef.current) setSec(Math.floor((Date.now() - t0) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [sessione]);

  useEffect(() => {
    if (recupero === null) return;
    if (recupero <= 0) {
      beep(980, 220);
      setTimeout(() => beep(1240, 260), 240);
      setRecupero(null);
      return;
    }
    const id = setTimeout(() => setRecupero((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [recupero]);

  const spunta = useCallback(
    (exIdx: number, setIdx: number, fatto: boolean, recuperoSec: number) => {
      aggiornaSerie(exIdx, setIdx, { fatto });
      if (fatto) {
        beep(660, 90);
        setRecupero(recuperoSec);
      }
    },
    [aggiornaSerie],
  );

  if (!sessione || !w) return <Navigate to={uscita ?? '/allena'} replace />;

  const totSerie = sessione.esercizi.reduce((t, e) => t + e.serie.length, 0);
  const fatte = sessione.esercizi.reduce((t, e) => t + e.serie.filter((s) => s.fatto).length, 0);
  const volume = sessione.esercizi.reduce(
    (t, e) => t + e.serie.reduce((v, s) => v + (s.fatto ? (s.kg ?? 0) * (s.reps ?? 0) : 0), 0),
    0,
  );

  // record battuti finora in questa sessione, ricalcolati a ogni serie spuntata
  const record = recordBattuti(
    { ...sessione, durataSec: sec, volumeKg: Math.round(volume), completata: true },
    sessioniPassate,
  );

  const termina = () => {
    setUscita('/storico');
    concludi(sec, nota.trim() || undefined);
  };

  return (
    <div className={cx('pb-6', recupero !== null && 'pb-36')}>
      <div className="sticky -top-0 z-20 -mx-4 mb-4 border-b border-raise bg-page/95 px-4 pb-3 pt-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Uscire e scartare questo allenamento?')) {
                setUscita('/');
                annulla();
              }
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-raise"
            aria-label="Chiudi"
          >
            <X size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{w.nome}</p>
            <p className="text-[11px] text-muted">
              {fatte}/{totSerie} serie · {Math.round(volume).toLocaleString('it-IT')} kg
            </p>
          </div>
          <span className="tabular-nums text-xl font-bold">{fmtDurata(sec)}</span>
          <button
            onClick={() => setMusica(true)}
            className="rounded-lg bg-raise p-2 text-soft"
            aria-label="Musica"
          >
            <Music size={16} />
          </button>
          <button
            onClick={() => setPausa((p) => !p)}
            className="rounded-lg bg-raise p-2 text-soft"
            aria-label={pausa ? 'Riprendi' : 'Pausa'}
          >
            {pausa ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${totSerie ? (fatte / totSerie) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {sessione.esercizi.map((ex, i) => {
          const def = w.esercizi[i];
          const info = esercizio(ex.exerciseId);
          const complete = ex.serie.every((s) => s.fatto);
          const open = aperto === i;
          return (
            <Card key={ex.exerciseId + i} className={cx('!p-0 overflow-hidden', complete && '!border-brand-500/40')}>
              <button
                onClick={() => setAperto(open ? -1 : i)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className={cx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold',
                    complete ? 'bg-brand-500 text-onbrand' : 'bg-raise text-soft',
                  )}
                >
                  {complete ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{info?.nome ?? ex.exerciseId}</span>
                  <span className="block text-[11px] text-muted">
                    {def ? `${def.serie} × ${def.ripetizioni} · rec ${def.recuperoSec}s` : ''}
                    {def?.rpe ? ` · ${def.rpe}` : ''}
                  </span>
                </span>
                <ChevronDown size={17} className={cx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
              </button>

              {open && (
                <div className="border-t border-line/60 px-4 py-3">
                  {def?.note && <p className="mb-2.5 text-xs text-brandink">{def.note}</p>}
                  {def && (() => {
                    const sug = suggerimentoCarico(
                      def,
                      ultimaEsecuzione(sessioniPassate, ex.exerciseId)?.esercizio,
                    );
                    return (
                      <p
                        className={cx(
                          'mb-2.5 flex items-start gap-1.5 text-[11px] leading-snug',
                          sug.verdetto === 'sali'
                            ? 'text-brandink'
                            : sug.verdetto === 'cala'
                              ? 'text-carb'
                              : 'text-muted',
                        )}
                      >
                        <TrendingUp size={12} className="mt-0.5 shrink-0" />
                        {sug.testo}
                      </p>
                    );
                  })()}
                  <div className="mb-1.5 grid grid-cols-[28px_1fr_1fr_44px] gap-2 text-[10px] uppercase tracking-wide text-muted">
                    <span>#</span>
                    <span>Kg</span>
                    <span>Rip.</span>
                    <span className="text-right">Ok</span>
                  </div>
                  <div className="space-y-2">
                    {ex.serie.map((s, j) => (
                      <div key={j} className="grid grid-cols-[28px_1fr_1fr_44px] items-center gap-2">
                        <span className="text-xs font-semibold text-muted">{j + 1}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          placeholder="—"
                          value={s.kg ?? ''}
                          onChange={(e) =>
                            aggiornaSerie(i, j, { kg: e.target.value === '' ? null : +e.target.value })
                          }
                          className={cx(inputCls, '!py-2 text-center tabular-nums')}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder={def?.ripetizioni ?? '—'}
                          value={s.reps ?? ''}
                          onChange={(e) =>
                            aggiornaSerie(i, j, { reps: e.target.value === '' ? null : +e.target.value })
                          }
                          className={cx(inputCls, '!py-2 text-center tabular-nums')}
                        />
                        <button
                          onClick={() => spunta(i, j, !s.fatto, def?.recuperoSec ?? 90)}
                          className={cx(
                            'grid h-9 w-full place-items-center rounded-xl border transition-colors',
                            s.fatto
                              ? 'border-brand-500 bg-brand-500 text-onbrand'
                              : 'border-line2 text-muted',
                          )}
                          aria-label="Serie completata"
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => aggiungiSerie(i)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-brandink"
                  >
                    <Plus size={13} /> Aggiungi serie
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button full variant="ghost" className="mt-5" onClick={() => setFine(true)}>
        <Square size={14} className="mr-1.5 -mt-0.5 inline" fill="currentColor" /> Concludi allenamento
      </Button>

      {recupero !== null && (
        <div className="fixed inset-x-0 bottom-0 z-40 safe-bottom">
          <div className="mx-auto max-w-2xl px-4 pb-4">
            <div className="rounded-2xl border border-brand-500/40 bg-surface/95 p-4 backdrop-blur-lg animate-in-up">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted">Recupero</p>
                  <p className="text-3xl font-bold tabular-nums text-brandink">{fmtDurata(recupero)}</p>
                </div>
                <button
                  onClick={() => setRecupero((r) => (r ?? 0) + 15)}
                  className="rounded-xl bg-raise px-3 py-2 text-xs font-medium"
                >
                  +15s
                </button>
                <button
                  onClick={() => setRecupero(null)}
                  className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-onbrand"
                >
                  <SkipForward size={14} className="mr-1 -mt-0.5 inline" /> Salta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MusicaSheet open={musica} onClose={() => setMusica(false)} chiave={w.id} titolo={w.nome} />

      <Sheet open={fine} onClose={() => setFine(false)} title="Concludi allenamento">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {[
              ['Durata', fmtDurata(sec)],
              ['Serie', `${fatte}/${totSerie}`],
              ['Volume', `${Math.round(volume).toLocaleString('it-IT')} kg`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-raise py-3">
                <p className="text-base font-bold tabular-nums">{v}</p>
                <p className="text-[10px] text-muted">{k}</p>
              </div>
            ))}
          </div>
          {record.length > 0 && (
            <div className="rounded-xl border border-brand-500/35 bg-brand-500/10 p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brandink">
                <Trophy size={15} /> {record.length === 1 ? 'Nuovo record' : `${record.length} nuovi record`}
              </p>
              <ul className="mt-2 space-y-1">
                {record.map((r) => (
                  <li key={r.exerciseId} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate">{r.nome}</span>
                    <Tag tone="brand">
                      {r.kg} kg × {r.reps}
                    </Tag>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            rows={3}
            placeholder="Note: come è andata, sensazioni, dolori…"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className={inputCls}
          />
          <Button full onClick={termina}>
            Salva e chiudi
          </Button>
          <Button
            full
            variant="danger"
            onClick={() => {
              if (confirm('Scartare la sessione senza salvarla?')) {
                setUscita('/');
                annulla();
              }
            }}
          >
            Scarta sessione
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
