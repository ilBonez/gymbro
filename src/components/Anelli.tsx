import type { ReactNode } from 'react';
import { Dumbbell, Flame, Footprints, Moon } from 'lucide-react';
import { fmtSonno } from '../lib/health';
import { cx } from './ui';

export interface Anello {
  chiave: string;
  etichetta: string;
  valore: number;
  obiettivo: number;
  colore: string;
  classeTesto: string;
  icona: ReactNode;
  /** come scrivere il valore accanto all'anello */
  formato: (v: number) => string;
}

/**
 * Gli anelli della giornata, sullo stile di Attività.
 *
 * Quattro invece dei tre di Apple: movimento, esercizio, passi, sonno. Il
 * "tempo in piedi" di Apple non c'è perché non esiste su Android — è una
 * metrica che l'Apple Watch calcola per conto suo e Health Connect non la
 * espone. Al suo posto stanno i minuti di esercizio.
 */
export function anelliGiornata(
  d: { kcal: number; minutiEsercizio: number; passi: number; sonnoMin: number },
  obiettivi: { kcal: number; minutiEsercizio: number; passi: number; sonnoOre: number },
): Anello[] {
  return [
    {
      chiave: 'movimento',
      etichetta: 'Movimento',
      valore: d.kcal,
      obiettivo: obiettivi.kcal,
      colore: 'var(--c-brand-500)',
      classeTesto: 'text-brand-500',
      icona: <Flame size={13} />,
      formato: (v) => `${Math.round(v).toLocaleString('it-IT')} kcal`,
    },
    {
      chiave: 'esercizio',
      etichetta: 'Esercizio',
      valore: d.minutiEsercizio,
      obiettivo: obiettivi.minutiEsercizio,
      colore: 'var(--c-prot)',
      classeTesto: 'text-prot',
      icona: <Dumbbell size={13} />,
      formato: (v) => `${Math.round(v)} min`,
    },
    {
      chiave: 'passi',
      etichetta: 'Passi',
      valore: d.passi,
      obiettivo: obiettivi.passi,
      colore: 'var(--c-carb)',
      classeTesto: 'text-carb',
      icona: <Footprints size={13} />,
      formato: (v) => Math.round(v).toLocaleString('it-IT'),
    },
    {
      chiave: 'sonno',
      etichetta: 'Sonno',
      valore: d.sonnoMin,
      obiettivo: Math.round(obiettivi.sonnoOre * 60),
      colore: 'var(--c-sonno)',
      classeTesto: 'text-sonno',
      icona: <Moon size={13} />,
      formato: (v) => (v > 0 ? fmtSonno(v) : '—'),
    },
  ];
}

function Arco({
  raggio,
  spessore,
  frazione,
  colore,
}: {
  raggio: number;
  spessore: number;
  frazione: number;
  colore: string;
}) {
  const circonferenza = 2 * Math.PI * raggio;
  const pieno = Math.min(1, frazione) * circonferenza;
  return (
    <>
      <circle r={raggio} fill="none" stroke={colore} strokeWidth={spessore} opacity={0.18} />
      <circle
        r={raggio}
        fill="none"
        stroke={colore}
        strokeWidth={spessore}
        strokeLinecap="round"
        strokeDasharray={`${pieno} ${circonferenza}`}
        transform="rotate(-90)"
        style={{ transition: 'stroke-dasharray .6s ease-out' }}
      />
    </>
  );
}

/** Solo gli anelli, senza legenda: serve nelle celle del calendario. */
export function AnelliCompatti({
  anelli,
  dimensione = 34,
}: {
  anelli: Anello[];
  dimensione?: number;
}) {
  const spessore = dimensione * 0.11;
  const passo = dimensione * 0.125;
  const raggioEsterno = dimensione * 0.42;

  return (
    <svg
      width={dimensione}
      height={dimensione}
      viewBox={`${-dimensione / 2} ${-dimensione / 2} ${dimensione} ${dimensione}`}
      aria-hidden
    >
      {anelli.map((a, i) => (
        <Arco
          key={a.chiave}
          raggio={raggioEsterno - i * passo}
          spessore={spessore}
          frazione={a.obiettivo > 0 ? a.valore / a.obiettivo : 0}
          colore={a.colore}
        />
      ))}
    </svg>
  );
}

/** Anelli con la legenda accanto: la vista principale della giornata. */
export function Anelli({ anelli, dimensione = 148 }: { anelli: Anello[]; dimensione?: number }) {
  const spessore = dimensione * 0.075;
  const passo = dimensione * 0.095;
  const raggioEsterno = dimensione * 0.42;

  const descrizione = anelli
    .map((a) => `${a.etichetta} ${a.formato(a.valore)} su ${a.formato(a.obiettivo)}`)
    .join(', ');

  return (
    <div className="flex items-center gap-4">
      <svg
        width={dimensione}
        height={dimensione}
        viewBox={`${-dimensione / 2} ${-dimensione / 2} ${dimensione} ${dimensione}`}
        className="shrink-0"
        role="img"
        aria-label={descrizione}
      >
        {anelli.map((a, i) => (
          <Arco
            key={a.chiave}
            raggio={raggioEsterno - i * passo}
            spessore={spessore}
            frazione={a.obiettivo > 0 ? a.valore / a.obiettivo : 0}
            colore={a.colore}
          />
        ))}
      </svg>

      <div className="min-w-0 flex-1 space-y-1.5">
        {anelli.map((a) => {
          const pieno = a.obiettivo > 0 && a.valore >= a.obiettivo;
          return (
            <div key={a.chiave}>
              <p className={cx('flex items-center gap-1.5 text-[11px] font-medium', a.classeTesto)}>
                {a.icona}
                {a.etichetta}
                {pieno && <span aria-hidden>✓</span>}
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {a.formato(a.valore)}
                <span className="ml-1 text-[11px] font-normal text-muted">
                  / {a.formato(a.obiettivo)}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
