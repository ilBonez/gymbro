/**
 * Grafico minimo in SVG, senza librerie: serve nelle schede dei singoli
 * esercizi, dove tirarsi dietro recharts raddoppierebbe il bundle.
 */
export function Sparkline({
  valori,
  larghezza = 280,
  altezza = 56,
  colore = 'var(--c-brand-500)',
}: {
  valori: number[];
  larghezza?: number;
  altezza?: number;
  colore?: string;
}) {
  if (valori.length < 2) return null;

  const min = Math.min(...valori);
  const max = Math.max(...valori);
  const span = max - min || 1;
  const pad = 4;

  const punti = valori.map((v, i) => {
    const x = pad + (i / (valori.length - 1)) * (larghezza - pad * 2);
    const y = altezza - pad - ((v - min) / span) * (altezza - pad * 2);
    return [x, y] as const;
  });

  const linea = punti.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${linea} L${punti[punti.length - 1][0].toFixed(1)} ${altezza} L${punti[0][0].toFixed(1)} ${altezza} Z`;
  const ultimo = punti[punti.length - 1];

  return (
    <svg
      viewBox={`0 0 ${larghezza} ${altezza}`}
      width="100%"
      height={altezza}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Andamento da ${min} a ${max}`}
    >
      <path d={area} fill={colore} opacity={0.12} />
      <path d={linea} fill="none" stroke={colore} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ultimo[0]} cy={ultimo[1]} r={3} fill={colore} />
    </svg>
  );
}
