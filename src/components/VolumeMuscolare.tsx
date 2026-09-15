import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  COLORE_VOLUME,
  MAX_SERIE,
  MIN_SERIE,
  commentoVolume,
  statoVolume,
  volumePerGruppo,
} from '../lib/volume';
import { Card, Empty, SectionTitle, cx } from './ui';
import { Dumbbell } from 'lucide-react';

/** Serie settimanali per gruppo muscolare, con la fascia consigliata di riferimento. */
export function VolumeMuscolare() {
  const sessioni = useStore((s) => s.sessioni);
  const volume = useMemo(() => volumePerGruppo(sessioni, 7), [sessioni]);

  const allenati = volume.filter((v) => v.serie > 0);
  const commento = commentoVolume(volume);
  const scala = Math.max(MAX_SERIE + 4, ...volume.map((v) => v.serie));

  return (
    <>
      <SectionTitle>Serie per gruppo muscolare · 7 giorni</SectionTitle>

      {allenati.length === 0 ? (
        <Empty
          icon={<Dumbbell size={24} />}
          title="Nessuna serie negli ultimi 7 giorni"
          sub="Completa un allenamento e qui vedrai come si distribuisce il lavoro fra i gruppi."
        />
      ) : (
        <Card>
          <div className="space-y-2">
            {volume.map((v) => {
              const stato = statoVolume(v.serie);
              return (
                <div key={v.gruppo} className="flex items-center gap-2.5">
                  <span className="w-24 shrink-0 truncate text-[11px] capitalize text-soft">
                    {v.gruppo}
                  </span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded-md bg-raise">
                    {/* fascia consigliata */}
                    <div
                      className="absolute inset-y-0 border-x border-dashed border-line2/80"
                      style={{
                        left: `${(MIN_SERIE / scala) * 100}%`,
                        width: `${((MAX_SERIE - MIN_SERIE) / scala) * 100}%`,
                      }}
                    />
                    <div
                      className={cx('h-full rounded-md transition-all', COLORE_VOLUME[stato])}
                      style={{ width: `${Math.min(100, (v.serie / scala) * 100)}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">
                    {v.serie % 1 === 0 ? v.serie : v.serie.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {commento && <p className="mt-3 text-[11px] leading-relaxed text-soft">{commento}</p>}

          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Il tratteggio è la fascia {MIN_SERIE}-{MAX_SERIE} serie a settimana, il riferimento
            classico per l'ipertrofia. Il muscolo primario di un esercizio prende una serie piena, i
            secondari mezza. In definizione stare nella parte bassa va benissimo: lì si mantiene, non
            si costruisce.
          </p>
        </Card>
      )}
    </>
  );
}
