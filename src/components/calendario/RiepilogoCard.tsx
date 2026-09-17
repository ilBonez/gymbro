import { Card, SectionTitle } from '../ui';
import { riepiloga, type Giornata } from '../../lib/giornata';
import { oggi } from '../../lib/date';

function Voce({ label, valore, sub }: { label: string; valore: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-base font-semibold tabular-nums leading-tight">{valore}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}

/** I totali di un periodo: stessa forma per settimana, mese e anno. */
export function RiepilogoCard({ giornate, titolo }: { giornate: Giornata[]; titolo: string }) {
  const today = oggi();
  const r = riepiloga(giornate, today);
  // la media si fa sui giorni con un dato, non su quelli ancora da vivere
  const conMovimento = giornate.filter((g) => g.kcalMovimento > 0).length;
  const conPassi = giornate.filter((g) => g.passi > 0).length;

  return (
    <>
      <SectionTitle>{titolo}</SectionTitle>
      <Card>
        <div className="grid grid-cols-3 gap-y-4">
          <Voce
            label="Allenamenti"
            valore={`${r.allenamentiFatti}/${r.allenamentiPrevisti}`}
            sub={
              r.seduteCardio > 0
                ? `+ ${r.seduteCardio} cardio`
                : r.saltati > 0
                  ? `${r.saltati} saltati`
                  : 'fatti su previsti'
            }
          />
          <Voce
            label="Movimento"
            valore={r.kcalMovimento > 0 ? r.kcalMovimento.toLocaleString('it-IT') : '—'}
            sub={
              conMovimento > 0
                ? `${Math.round(r.kcalMovimento / conMovimento).toLocaleString('it-IT')} kcal al giorno`
                : 'kcal'
            }
          />
          <Voce
            label="Passi"
            valore={r.passi > 0 ? r.passi.toLocaleString('it-IT') : '—'}
            sub={
              conPassi > 0
                ? `${Math.round(r.passi / conPassi).toLocaleString('it-IT')} al giorno`
                : 'totali'
            }
          />
          <Voce
            label="Esercizio"
            valore={r.minutiEsercizio > 0 ? `${Math.round(r.minutiEsercizio / 60)} h` : '—'}
            sub={`${r.minutiEsercizio} min registrati`}
          />
          <Voce
            label="Volume"
            valore={
              r.volumeKg > 0 ? `${Math.round(r.volumeKg / 1000).toLocaleString('it-IT')} t` : '—'
            }
            sub="sollevato"
          />
          <Voce
            label="Dieta"
            valore={`${r.giorniConPasti}/${r.giorni}`}
            sub={r.sgarri > 0 ? `${r.sgarri} ${r.sgarri === 1 ? 'sgarro' : 'sgarri'}` : 'giorni tracciati'}
          />
        </div>
      </Card>
    </>
  );
}
