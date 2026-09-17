import { useEffect, useState } from 'react';
import type { ModalitaCardio } from '../data/programs';
import { useStore } from '../store/useStore';
import { MODALITA_CARDIO, kcalCardio } from '../lib/burn';
import { Button, Chip, Field, Sheet, inputCls } from '../components/ui';

/**
 * Registra una seduta di cardio.
 *
 * Il cardio non passa dalla sessione pesi: senza questo resterebbe una cosa
 * pianificata e mai verificata, e le calorie del giorno sarebbero solo stime.
 */
export function RegistraCardio({
  data,
  open,
  onClose,
  modalitaIniziale,
  minutiIniziali,
}: {
  data: string;
  open: boolean;
  onClose: () => void;
  modalitaIniziale?: ModalitaCardio;
  minutiIniziali?: number;
}) {
  const addCardio = useStore((s) => s.addCardio);
  const pesoKg = useStore((s) => s.profile?.pesoKg ?? 75);

  const [modalita, setModalita] = useState<ModalitaCardio>(modalitaIniziale ?? 'camminata-pendenza');
  const [minuti, setMinuti] = useState(minutiIniziali ?? 30);
  const [fc, setFc] = useState('');
  const [kcalMano, setKcalMano] = useState<number | null>(null);

  // riaprendo il foglio su un altro giorno i valori suggeriti sono cambiati
  useEffect(() => {
    if (!open) return;
    setModalita(modalitaIniziale ?? 'camminata-pendenza');
    setMinuti(minutiIniziali ?? 30);
    setKcalMano(null);
    setFc('');
  }, [open, modalitaIniziale, minutiIniziali]);

  const stimate = kcalCardio(modalita, minuti, pesoKg);
  const kcal = kcalMano ?? stimate;

  const salva = () => {
    addCardio({
      data,
      modalita,
      minuti,
      kcal,
      kcalAMano: kcalMano !== null,
      fcMedia: fc ? Number(fc) : undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Registra cardio">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Che cosa</p>
          <div className="flex flex-wrap gap-2">
            {MODALITA_CARDIO.map((m) => (
              <Chip key={m.id} active={modalita === m.id} onClick={() => setModalita(m.id)}>
                {m.nome}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Minuti">
            <input
              type="number"
              min={1}
              value={minuti}
              onChange={(e) => setMinuti(Math.max(1, Number(e.target.value) || 1))}
              className={inputCls}
            />
          </Field>
          <Field label="FC media" hint="Facoltativa.">
            <input
              type="number"
              min={40}
              max={220}
              value={fc}
              onChange={(e) => setFc(e.target.value)}
              placeholder="bpm"
              className={inputCls}
            />
          </Field>
        </div>

        <Field
          label="Calorie"
          hint={`Stimate dal MET e dai tuoi ${pesoKg} kg: ${stimate} kcal. Correggile se l'attrezzo ne dà altre.`}
        >
          <input
            type="number"
            min={0}
            value={kcal}
            onChange={(e) => setKcalMano(Math.max(0, Number(e.target.value) || 0))}
            className={inputCls}
          />
        </Field>

        <Button full onClick={salva}>
          Salva seduta
        </Button>
      </div>
    </Sheet>
  );
}
