import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Food } from '../data/foods';
import { alimentoMio, tuttiGliAlimenti } from '../lib/catalog';
import { Button, Field, Tag, cx, inputCls } from './ui';

/** Macro di una quantità in grammi, dai valori per 100 g dell'alimento. */
export function macroAlimento(f: Food, grammi: number) {
  const q = grammi / 100;
  return {
    kcal: Math.round(f.kcal * q),
    proteine: Math.round(f.proteine * q),
    carbs: Math.round(f.carbs * q),
    grassi: Math.round(f.grassi * q),
  };
}

/**
 * Sceglie un alimento e la quantità.
 *
 * Serve a registrare una cosa sola — uno yogurt, una lattina — senza doverne
 * fare una ricetta: cerca fra il catalogo e i tuoi alimenti, e restituisce
 * l'alimento coi grammi.
 */
export function SceltaAlimento({
  onAggiungi,
  etichettaAzione = 'Aggiungi',
}: {
  onAggiungi: (f: Food, grammi: number) => void;
  etichettaAzione?: string;
}) {
  const [q, setQ] = useState('');
  const [scelto, setScelto] = useState<Food | null>(null);
  const [grammi, setGrammi] = useState(100);

  const risultati = useMemo(() => {
    const t = q.trim().toLowerCase();
    const tutti = tuttiGliAlimenti();
    if (!t) return tutti.slice(0, 20);
    return tutti
      .filter((f) => f.nome.toLowerCase().includes(t) || f.marca?.toLowerCase().includes(t))
      .slice(0, 40);
  }, [q]);

  if (scelto) {
    const m = macroAlimento(scelto, grammi);
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-raise px-3.5 py-3">
          <p className="text-sm font-semibold">{scelto.nome}</p>
          <p className="text-[11px] tabular-nums text-muted">
            {scelto.marca ? `${scelto.marca} · ` : ''}per 100 {scelto.unita === 'ml' ? 'ml' : 'g'}:{' '}
            {scelto.kcal} kcal · P {scelto.proteine} · C {scelto.carbs} · G {scelto.grassi}
          </p>
        </div>

        <Field
          label={`Quanti ${scelto.unita === 'ml' ? 'millilitri' : 'grammi'}`}
          hint={
            scelto.unita === 'pz'
              ? 'Questo alimento è venduto a pezzi: i valori restano per 100 g, quindi scrivi il peso.'
              : undefined
          }
        >
          <input
            type="number"
            min={1}
            value={grammi}
            onChange={(e) => setGrammi(Math.max(1, Number(e.target.value) || 1))}
            className={inputCls}
          />
        </Field>

        <Button full disabled={m.kcal <= 0} onClick={() => onAggiungi(scelto, grammi)}>
          {etichettaAzione} · {m.kcal} kcal
        </Button>
        <button
          onClick={() => setScelto(null)}
          className="w-full text-center text-[11px] text-muted underline"
        >
          Scegli un altro alimento
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca alimento… (es. yogurt)"
          className={cx(inputCls, 'pl-10')}
        />
      </div>

      <ul className="mt-3 divide-y divide-line/60">
        {risultati.map((f) => (
          <li key={f.id}>
            <button
              onClick={() => {
                setScelto(f);
                setGrammi(f.unita === 'pz' ? 100 : f.porzioneTipica);
              }}
              className="flex w-full items-center gap-2 py-2.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{f.nome}</span>
                <span className="block text-[11px] tabular-nums text-muted">
                  {f.kcal} kcal · P {f.proteine} · C {f.carbs} · G {f.grassi} — per 100{' '}
                  {f.unita === 'ml' ? 'ml' : 'g'}
                </span>
              </span>
              {alimentoMio(f.id) && <Tag tone="brand">tuo</Tag>}
            </button>
          </li>
        ))}
        {risultati.length === 0 && (
          <li className="py-3 text-xs text-muted">
            Nessun alimento con questo nome. Leggilo col codice a barre o scrivi i macro a mano.
          </li>
        )}
      </ul>
    </div>
  );
}
