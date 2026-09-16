import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, Dumbbell, Home, LineChart, UtensilsCrossed, User } from 'lucide-react';
import { cx } from './ui';
import { useStore } from '../store/useStore';
import { TimerBar } from './TimerBar';

/**
 * Le cinque voci in basso sono le sezioni, non le singole schermate: dentro
 * ognuna si naviga con la barra di sezione. `dentro` elenca gli indirizzi che
 * appartengono alla sezione, così aprendo la libreria esercizi resta acceso
 * "Allena" invece di spegnersi tutto.
 */
const TABS = [
  { to: '/', label: 'Oggi', icon: Home, dentro: [] as string[] },
  { to: '/allena', label: 'Allena', icon: Dumbbell, dentro: ['/esercizi', '/storico'] },
  { to: '/piano', label: 'Piano', icon: CalendarDays, dentro: [] },
  { to: '/dieta', label: 'Dieta', icon: UtensilsCrossed, dentro: ['/spesa', '/integratori'] },
  { to: '/progressi', label: 'Progressi', icon: LineChart, dentro: [] },
];

function sezioneAttiva(pathname: string, tab: (typeof TABS)[number]): boolean {
  if (tab.to === '/') return pathname === '/';
  if (pathname === tab.to || pathname.startsWith(tab.to + '/')) return true;
  return tab.dentro.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const tipoNavigazione = useNavigationType();

  /**
   * Aprendo una schermata nuova si parte dall'alto; tornando indietro no,
   * perché il browser rimette da solo la pagina dov'era. Senza questo si
   * arrivava su una pagina nuova già a metà scorrimento.
   */
  useEffect(() => {
    if (tipoNavigazione !== 'POP') window.scrollTo(0, 0);
  }, [pathname, tipoNavigazione]);
  const profile = useStore((s) => s.profile);
  const inSessione = useStore((s) => !!s.sessioneAttiva);

  // le schermate di dettaglio mostrano la freccia indietro al posto del logo
  const radice = TABS.some((t) => t.to === pathname) || NAV_INTERNE.includes(pathname);
  const nascondiNav = pathname.startsWith('/sessione');

  return (
    <div className="min-h-full bg-page">
      {!nascondiNav && (
        <header className="sticky top-0 z-30 safe-top bg-page/85 backdrop-blur-lg border-b border-line">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 h-14">
            {!radice ? (
              <button
                onClick={() => nav(-1)}
                className="-ml-1.5 rounded-lg p-1.5 text-soft hover:bg-raise"
                aria-label="Indietro"
              >
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-onbrand">
                  <Dumbbell size={16} strokeWidth={2.6} />
                </div>
                <span className="text-[15px] font-bold tracking-tight">GymBro</span>
              </div>
            )}
            <div className="flex-1" />
            <NavLink
              to="/profilo"
              className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-xs text-soft hover:border-line2 flex items-center gap-1.5"
            >
              <User size={14} />
              {profile?.nome?.split(' ')[0] ?? 'Profilo'}
            </NavLink>
          </div>
        </header>
      )}

      <main className={cx('mx-auto max-w-2xl px-4', nascondiNav ? 'safe-top pt-2 pb-8' : 'pt-4 pb-32')}>
        {children}
      </main>

      {!nascondiNav && inSessione && <TimerBar />}

      {!nascondiNav && (
        <nav className="fixed bottom-0 inset-x-0 z-30 safe-bottom border-t border-line bg-page/92 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl">
            {TABS.map((tab) => {
              const attiva = sezioneAttiva(pathname, tab);
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={cx(
                    'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                    attiva ? 'text-brandink' : 'text-muted',
                  )}
                >
                  <Icon size={20} strokeWidth={attiva ? 2.5 : 2} />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/** Schermate che fanno parte di una sezione: mostrano il logo, non la freccia. */
const NAV_INTERNE = [
  '/esercizi',
  '/storico',
  '/spesa',
  '/integratori',
  '/dieta/ricette',
  '/dieta/sostituzioni',
  '/progressi/dieta',
  '/progressi/allenamento',
];
