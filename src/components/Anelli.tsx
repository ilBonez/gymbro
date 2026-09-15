import { Flame, Footprints, Moon } from 'lucide-react';
import { fmtSonno } from '../lib/health';

interface Anello {
  valore: number;
  obiettivo: number;
  colore: string;
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
      <circle
        r={raggio}
        fill="none"
        stroke={colore}
        strokeWidth={spessore}
        opacity={0.18}
      />
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

/**
 * Tre anelli concentrici: movimento, passi, sonno.
 * Stessa idea degli anelli di Attività, con i dati letti da Health Connect.
 */
export function Anelli({
  kcal,
  kcalObiettivo,
  passi,
  passiObiettivo,
  sonnoMin,
  sonnoObiettivoMin,
  dimensione = 132,
}: {
  kcal: number;
  kcalObiettivo: number;
  passi: number;
  passiObiettivo: number;
  sonnoMin: number;
  sonnoObiettivoMin: number;
  dimensione?: number;
}) {
  const anelli: Anello[] = [
    { valore: kcal, obiettivo: kcalObiettivo, colore: 'var(--c-brand-500)' },
    { valore: passi, obiettivo: passiObiettivo, colore: 'var(--c-prot)' },
    { valore: sonnoMin, obiettivo: sonnoObiettivoMin, colore: 'var(--c-sonno)' },
  ];

  const spessore = dimensione * 0.085;
  const raggi = [0.42, 0.305, 0.19].map((r) => dimensione * r);

  return (
    <div className="flex items-center gap-4">
      <svg
        width={dimensione}
        height={dimensione}
        viewBox={`${-dimensione / 2} ${-dimensione / 2} ${dimensione} ${dimensione}`}
        className="shrink-0"
        role="img"
        aria-label={`Movimento ${kcal} di ${kcalObiettivo} kcal, ${passi} di ${passiObiettivo} passi, sonno ${fmtSonno(sonnoMin)}`}
      >
        {anelli.map((a, i) => (
          <Arco
            key={i}
            raggio={raggi[i]}
            spessore={spessore}
            frazione={a.obiettivo > 0 ? a.valore / a.obiettivo : 0}
            colore={a.colore}
          />
        ))}
      </svg>

      <div className="min-w-0 flex-1 space-y-2">
        <Riga
          icona={<Flame size={13} />}
          etichetta="Movimento"
          valore={`${Math.round(kcal).toLocaleString('it-IT')} / ${kcalObiettivo.toLocaleString('it-IT')} kcal`}
          colore="text-brand-500"
        />
        <Riga
          icona={<Footprints size={13} />}
          etichetta="Passi"
          valore={`${Math.round(passi).toLocaleString('it-IT')} / ${passiObiettivo.toLocaleString('it-IT')}`}
          colore="text-prot"
        />
        <Riga
          icona={<Moon size={13} />}
          etichetta="Sonno"
          valore={sonnoMin > 0 ? `${fmtSonno(sonnoMin)} / ${fmtSonno(sonnoObiettivoMin)}` : 'nessun dato'}
          colore="text-sonno"
        />
      </div>
    </div>
  );
}

function Riga({
  icona,
  etichetta,
  valore,
  colore,
}: {
  icona: React.ReactNode;
  etichetta: string;
  valore: string;
  colore: string;
}) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-[11px] font-medium ${colore}`}>
        {icona}
        {etichetta}
      </p>
      <p className="text-sm font-semibold tabular-nums">{valore}</p>
    </div>
  );
}
