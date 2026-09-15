import { Bar } from './ui';

export function MacroRow({
  label,
  value,
  target,
  color,
  unit = 'g',
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-soft">{label}</span>
        <span className="tabular-nums text-muted">
          <span className="font-semibold text-ink">{Math.round(value)}</span> / {target} {unit}
        </span>
      </div>
      <Bar value={value} max={target} color={color} height="h-1.5" />
    </div>
  );
}

export function MacroBlock({
  kcal,
  kcalTarget,
  proteine,
  carbs,
  grassi,
  tProteine,
  tCarbs,
  tGrassi,
}: {
  kcal: number;
  kcalTarget: number;
  proteine: number;
  carbs: number;
  grassi: number;
  tProteine: number;
  tCarbs: number;
  tGrassi: number;
}) {
  const resto = kcalTarget - kcal;
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold tabular-nums">{Math.round(kcal)}</span>
          <span className="ml-1 text-sm text-muted">/ {kcalTarget} kcal</span>
        </div>
        <span className={resto >= 0 ? 'text-xs text-muted' : 'text-xs text-carb'}>
          {resto >= 0 ? `${Math.round(resto)} kcal rimaste` : `${Math.abs(Math.round(resto))} kcal oltre`}
        </span>
      </div>
      <Bar value={kcal} max={kcalTarget} color="bg-brand-500" />
      <div className="grid gap-2.5 pt-1">
        <MacroRow label="Proteine" value={proteine} target={tProteine} color="bg-prot" />
        <MacroRow label="Carboidrati" value={carbs} target={tCarbs} color="bg-carb" />
        <MacroRow label="Grassi" value={grassi} target={tGrassi} color="bg-fat" />
      </div>
    </div>
  );
}
