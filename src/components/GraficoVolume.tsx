import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../store/useStore';
import { Card, Empty, SectionTitle } from './ui';
import { giorniTra, oggi } from '../lib/date';
import { coloreTema } from '../lib/theme';
import { Weight } from 'lucide-react';

/** Kg complessivi sollevati, settimana per settimana, sulle ultime 12. */
export function GraficoVolume() {
  const sessioni = useStore((s) => s.sessioni);
  const tema = useStore((s) => s.tema);

  const colori = useMemo(
    () => ({
      griglia: coloreTema('line', '#e5e7eb'),
      testo: coloreTema('muted', '#6b7280'),
      superficie: coloreTema('surface', '#ffffff'),
      bordo: coloreTema('line2', '#d1d5db'),
      accento: coloreTema('prot', '#0284c7'),
      ink: coloreTema('ink', '#111827'),
    }),
    [tema],
  );

  const dati = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of sessioni) {
      const w = Math.floor(giorniTra(s.data, oggi()) / 7);
      if (w > 11) continue;
      m.set(w, (m.get(w) ?? 0) + s.volumeKg);
    }
    return Array.from({ length: 12 }, (_, i) => ({
      data: i === 0 ? 'ora' : `-${i}s`,
      volume: m.get(i) ?? 0,
    })).reverse();
  }, [sessioni]);

  if (sessioni.length === 0) {
    return (
      <>
        <SectionTitle>Volume settimanale</SectionTitle>
        <Empty
          icon={<Weight size={24} />}
          title="Nessun allenamento registrato"
          sub="Il volume è il peso totale sollevato: serie per ripetizioni per carico. Cresce quando cresci."
        />
      </>
    );
  }

  return (
    <>
      <SectionTitle>Volume settimanale (kg sollevati)</SectionTitle>
      <Card className="!px-1 !py-3">
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={dati} margin={{ top: 6, right: 14, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={colori.griglia} vertical={false} />
            <XAxis dataKey="data" tick={{ fill: colori.testo, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: colori.testo, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              contentStyle={{
                background: colori.superficie,
                border: `1px solid ${colori.bordo}`,
                color: colori.ink,
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="volume" stroke={colori.accento} strokeWidth={2.5} dot={false} name="Volume" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
