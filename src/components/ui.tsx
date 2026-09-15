import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'rounded-2xl bg-ink-850 border border-ink-700/70 p-4',
        onClick && 'w-full text-left active:scale-[.985] transition-transform',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-2.5 mt-6 first:mt-0">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400">{children}</h2>
      {action}
    </div>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
  type = 'button',
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  full?: boolean;
}) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-brand-500 text-ink-950 font-semibold hover:bg-brand-400',
    ghost: 'bg-ink-800 text-ink-100 hover:bg-ink-700',
    outline: 'border border-ink-600 text-ink-100 hover:bg-ink-800',
    danger: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-xl px-4 py-2.5 text-sm transition-colors active:scale-[.97]',
        'disabled:opacity-40 disabled:pointer-events-none',
        full && 'w-full',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
        active
          ? 'bg-brand-500 text-ink-950 border-brand-500'
          : 'bg-ink-800 text-ink-300 border-ink-700 hover:border-ink-600',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'carb' | 'fat' | 'danger' }) {
  const tones = {
    neutral: 'bg-ink-800 text-ink-300 border-ink-700',
    brand: 'bg-brand-500/12 text-brand-300 border-brand-500/25',
    carb: 'bg-carb/12 text-carb border-carb/25',
    fat: 'bg-fat/12 text-fat border-fat/25',
    danger: 'bg-red-500/12 text-red-300 border-red-500/25',
  };
  return (
    <span className={cx('rounded-md border px-2 py-0.5 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-ink-850 border border-ink-700/70 p-3.5">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className={cx('mt-1 text-2xl font-bold tabular-nums leading-none', tone)}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-ink-400">{unit}</span>}
      </div>
      {sub && <div className="mt-1.5 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

export function Bar({
  value,
  max,
  color = 'bg-brand-500',
  height = 'h-2',
}: {
  value: number;
  max: number;
  color?: string;
  height?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cx('w-full rounded-full bg-ink-700/70 overflow-hidden', height)}>
      <div className={cx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-300">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl bg-ink-800 border border-ink-700 px-3.5 py-2.5 text-sm outline-none ' +
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-ink-400';

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-ink-850 border border-ink-700 animate-in-up safe-bottom">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-ink-850/95 backdrop-blur px-5 py-4 border-b border-ink-700/70">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-ink-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-700 py-10 px-6 text-center">
      {icon && <div className="mb-3 flex justify-center text-ink-600">{icon}</div>}
      <p className="text-sm font-medium text-ink-300">{title}</p>
      {sub && <p className="mt-1 text-xs text-ink-400 max-w-xs mx-auto">{sub}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-carb/25 bg-carb/8 px-3.5 py-3 text-[13px] leading-relaxed text-carb/95">
      {children}
    </div>
  );
}
