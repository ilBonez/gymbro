import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CalendarDays, ChevronLeft, Dumbbell, Home, ShoppingCart, UtensilsCrossed, User } from 'lucide-react';
import { cx } from './ui';
import { useStore } from '../store/useStore';
import { TimerBar } from './TimerBar';

const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/allena', label: 'Allena', icon: Dumbbell },
  { to: '/piano', label: 'Piano', icon: CalendarDays },
  { to: '/dieta', label: 'Dieta', icon: UtensilsCrossed },
  { to: '/spesa', label: 'Spesa', icon: ShoppingCart },
];

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const profile = useStore((s) => s.profile);
  const inSessione = useStore((s) => !!s.sessioneAttiva);

  const isTab = TABS.some((t) => t.to === pathname);
  const nascondiNav = pathname.startsWith('/sessione');

  return (
    <div className="min-h-full bg-page">
      {!nascondiNav && (
      <header className="sticky top-0 z-30 safe-top bg-page/85 backdrop-blur-lg border-b border-raise">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 h-14">
          {!isTab && !nascondiNav ? (
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
          {!nascondiNav && (
            <NavLink
              to="/profilo"
              className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-xs text-soft hover:border-line2 flex items-center gap-1.5"
            >
              <User size={14} />
              {profile?.nome?.split(' ')[0] ?? 'Profilo'}
            </NavLink>
          )}
        </div>
      </header>
      )}

      <main className={cx('mx-auto max-w-2xl px-4', nascondiNav ? 'safe-top pt-2 pb-8' : 'pt-4 pb-32')}>
        {children}
      </main>

      {!nascondiNav && inSessione && <TimerBar />}

      {!nascondiNav && (
        <nav className="fixed bottom-0 inset-x-0 z-30 safe-bottom border-t border-raise bg-page/92 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl">
            {TABS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                    isActive ? 'text-brandink' : 'text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
