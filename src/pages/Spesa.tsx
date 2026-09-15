import { useMemo, useState } from 'react';
import { Check, ExternalLink, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { FOODS } from '../data/foods';
import { useStore } from '../store/useStore';
import { Button, Card, Chip, Empty, SectionTitle, Sheet, cx, inputCls } from '../components/ui';

const CATEGORIA_LABEL: Record<string, string> = {
  'proteine-polvere': 'Proteine in polvere',
  'snack-proteico': 'Snack proteici',
  latticini: 'Latticini',
  carne: 'Carne',
  pesce: 'Pesce',
  uova: 'Uova',
  verdura: 'Verdura',
  frutta: 'Frutta',
  cereali: 'Cereali',
  legumi: 'Legumi',
  grassi: 'Grassi',
  integratori: 'Integratori',
  bevande: 'Bevande',
  dispensa: 'Dispensa',
};

export default function Spesa() {
  const spesa = useStore((s) => s.spesa);
  const toggle = useStore((s) => s.toggleSpesa);
  const remove = useStore((s) => s.removeSpesa);
  const svuota = useStore((s) => s.svuotaSpesa);
  const add = useStore((s) => s.addSpesa);
  const addLista = useStore((s) => s.aggiungiListaSpesa);

  const [sheet, setSheet] = useState(false);
  const [nome, setNome] = useState('');
  const [qta, setQta] = useState('');

  const gruppi = useMemo(() => {
    const m = new Map<string, typeof spesa>();
    for (const i of spesa) {
      const arr = m.get(i.categoria) ?? [];
      arr.push(i);
      m.set(i.categoria, arr);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [spesa]);

  const presi = spesa.filter((i) => i.preso).length;

  const snackProteici = FOODS.filter(
    (f) => f.eurospin && (f.categoria === 'snack-proteico' || f.categoria === 'proteine-polvere'),
  ).slice(0, 12);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lista della spesa</h1>
          <p className="mt-1 text-sm text-muted">
            {spesa.length === 0 ? 'Vuota' : `${presi}/${spesa.length} presi`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {presi > 0 && (
            <button
              onClick={() => svuota(true)}
              className="rounded-lg p-2 text-muted hover:bg-raise"
              title="Rimuovi i presi"
            >
              <Check size={17} />
            </button>
          )}
          {spesa.length > 0 && (
            <button
              onClick={() => confirm('Svuotare la lista?') && svuota(false)}
              className="rounded-lg p-2 text-muted hover:bg-raise hover:text-red-300"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button variant="ghost" onClick={() => setSheet(true)}>
          <Plus size={15} className="mr-1.5 -mt-0.5 inline" /> Voce manuale
        </Button>
        <a href="https://online.eurospin.com/" target="_blank" rel="noreferrer noopener">
          <Button variant="outline" full>
            <ExternalLink size={14} className="mr-1.5 -mt-0.5 inline" /> Eurospin online
          </Button>
        </a>
      </div>

      {spesa.length === 0 ? (
        <div className="mt-5">
          <Empty
            icon={<ShoppingBasket size={26} />}
            title="Lista vuota"
            sub="Genera la spesa dalla pagina Dieta: prende il menu dei prossimi 7 giorni e somma gli ingredienti."
          />
        </div>
      ) : (
        gruppi.map(([cat, items]) => (
          <div key={cat}>
            <SectionTitle>{CATEGORIA_LABEL[cat] ?? cat}</SectionTitle>
            <Card className="!p-1.5">
              <ul className="divide-y divide-line/50">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-2.5 px-2 py-2.5">
                    <button
                      onClick={() => toggle(i.id)}
                      className={cx(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors',
                        i.preso ? 'border-brand-500 bg-brand-500 text-onbrand' : 'border-line2',
                      )}
                      aria-label="Preso"
                    >
                      {i.preso && <Check size={13} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cx('truncate text-sm', i.preso && 'text-muted line-through')}>{i.nome}</p>
                      {i.qta && <p className="text-[11px] text-muted">{i.qta}</p>}
                    </div>
                    {i.ricercaUrl && (
                      <a
                        href={i.ricercaUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="shrink-0 rounded-lg p-1.5 text-muted hover:text-brandink"
                        aria-label="Cerca su Eurospin"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => remove(i.id)}
                      className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-300"
                      aria-label="Rimuovi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ))
      )}

      <SectionTitle>Aggiunta rapida · snack proteici</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {snackProteici.map((f) => (
          <Chip
            key={f.id}
            onClick={() =>
              addLista([
                {
                  nome: f.nome,
                  qta: `${f.porzioneTipica} ${f.unita}`,
                  categoria: f.categoria,
                  foodId: f.id,
                  ricercaUrl: f.ricercaUrl,
                  preso: false,
                  manuale: false,
                },
              ])
            }
          >
            + {f.nome}
          </Chip>
        ))}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-muted">
        I link aprono la ricerca sul sito Eurospin nel browser. Disponibilità e prezzi cambiano per punto
        vendita: quelli in app sono indicativi.
      </p>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Aggiungi alla lista">
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="Cosa serve?"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
          <input
            className={inputCls}
            placeholder="Quantità (opzionale) — es. 500 g"
            value={qta}
            onChange={(e) => setQta(e.target.value)}
          />
          <Button
            full
            disabled={!nome.trim()}
            onClick={() => {
              add({
                nome: nome.trim(),
                qta: qta.trim() || undefined,
                categoria: 'dispensa',
                preso: false,
                manuale: true,
              });
              setNome('');
              setQta('');
              setSheet(false);
            }}
          >
            Aggiungi
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
