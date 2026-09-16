import { NavLink } from 'react-router-dom';
import { cx } from './ui';

export interface VoceSottoNav {
  label: string;
  to: string;
  /** true solo per la voce che corrisponde alla radice della sezione */
  esatta?: boolean;
}

/**
 * Barra di sezione, subito sotto il titolo.
 *
 * Ogni voce è un indirizzo vero, non uno stato interno: così il tasto indietro
 * funziona, l'app si può aprire direttamente sulla scheda giusta, e la barra in
 * basso resta il livello superiore invece di dover contenere tutto.
 */
export function SottoNav({ voci }: { voci: VoceSottoNav[] }) {
  return (
    <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Sezioni">
      {voci.map((v) => (
        <NavLink
          key={v.to}
          to={v.to}
          end={v.esatta}
          className={({ isActive }) =>
            cx(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-brand-500 bg-brand-500 text-onbrand'
                : 'border-line bg-raise text-soft hover:border-line2',
            )
          }
        >
          {v.label}
        </NavLink>
      ))}
    </nav>
  );
}

export const NAV_ALLENA: VoceSottoNav[] = [
  { label: 'Programmi', to: '/allena', esatta: true },
  { label: 'Esercizi', to: '/esercizi', esatta: true },
  { label: 'Storico', to: '/storico' },
];

export const NAV_DIETA: VoceSottoNav[] = [
  { label: 'Oggi', to: '/dieta', esatta: true },
  { label: 'Ricette', to: '/dieta/ricette' },
  { label: 'Sostituzioni', to: '/dieta/sostituzioni' },
  { label: 'Spesa', to: '/spesa' },
  { label: 'Integratori', to: '/integratori' },
];

export const NAV_PROGRESSI: VoceSottoNav[] = [
  { label: 'Peso e misure', to: '/progressi', esatta: true },
  { label: 'Dieta', to: '/progressi/dieta' },
  { label: 'Allenamento', to: '/progressi/allenamento' },
];
