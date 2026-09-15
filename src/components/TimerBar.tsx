import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmtDurata } from '../lib/date';

export function TimerBar() {
  const sessione = useStore((s) => s.sessioneAttiva);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!sessione) return;
    const t0 = new Date(sessione.iniziata).getTime();
    const tick = () => setSec(Math.floor((Date.now() - t0) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessione]);

  if (!sessione) return null;

  return (
    <Link
      to="/sessione"
      className="fixed bottom-[68px] inset-x-0 z-30 mx-auto max-w-2xl px-4 safe-bottom"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/12 px-4 py-3 backdrop-blur-lg">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-ink-950 animate-ring">
          <Activity size={16} strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-300">Allenamento in corso</p>
          <p className="text-xs text-ink-300">Tocca per riprendere</p>
        </div>
        <span className="tabular-nums text-lg font-bold text-brand-300">{fmtDurata(sec)}</span>
      </div>
    </Link>
  );
}
