import { useEffect, useRef, useState } from 'react';
import { Camera, Search, X } from 'lucide-react';
import { Button, Field, cx, inputCls } from './ui';
import { barcodeValido } from '../lib/openfoodfacts';

/**
 * Lettura del codice a barre con la fotocamera, dove c'è.
 *
 * Usa BarcodeDetector, che è nella WebView di Android ma non in tutti i
 * browser: quando manca resta il campo per digitare il codice, che è anche
 * l'unico modo di provare la cosa da desktop.
 */

interface RilevatoreCodici {
  detect(sorgente: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

type CostruttoreRilevatore = new (opzioni?: { formats?: string[] }) => RilevatoreCodici;

const Rilevatore = (globalThis as { BarcodeDetector?: CostruttoreRilevatore }).BarcodeDetector;

export function ScannerBarcode({ onCodice }: { onCodice: (codice: string) => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [acceso, setAcceso] = useState(false);
  const [errore, setErrore] = useState('');
  const [manuale, setManuale] = useState('');

  const spegni = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setAcceso(false);
  };

  // la fotocamera non deve restare accesa quando il foglio si chiude
  useEffect(() => spegni, []);

  useEffect(() => {
    if (!acceso || !Rilevatore) return;
    const rilevatore = new Rilevatore({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    let attivo = true;

    const cerca = async () => {
      while (attivo && video.current && video.current.readyState >= 2) {
        try {
          const trovati = await rilevatore.detect(video.current);
          const codice = trovati[0]?.rawValue;
          if (codice && barcodeValido(codice)) {
            attivo = false;
            spegni();
            onCodice(codice);
            return;
          }
        } catch {
          /* fotogramma illeggibile: si riprova col prossimo */
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    };
    void cerca();

    return () => {
      attivo = false;
    };
  }, [acceso, onCodice]);

  const accendi = async () => {
    setErrore('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.current = s;
      setAcceso(true);
      // il video esiste solo dopo il render: aspettiamo il giro successivo
      setTimeout(() => {
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
      }, 0);
    } catch {
      setErrore('Fotocamera non disponibile o permesso negato. Scrivi il codice a mano.');
    }
  };

  return (
    <div className="space-y-3">
      {Rilevatore &&
        (acceso ? (
          <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
            <video ref={video} playsInline muted className="h-52 w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-8 inset-y-16 rounded-xl border-2 border-brand-500/80" />
            <button
              onClick={spegni}
              aria-label="Chiudi fotocamera"
              className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <Button full variant="ghost" onClick={accendi}>
            <Camera size={14} className="mr-1.5 -mt-0.5 inline" /> Inquadra il codice a barre
          </Button>
        ))}

      {!Rilevatore && (
        <p className="text-[11px] leading-relaxed text-muted">
          Questo browser non sa leggere i codici a barre. Nell'app Android la fotocamera funziona;
          qui puoi digitare il codice.
        </p>
      )}

      <Field label="Oppure scrivi il codice">
        <div className="flex gap-2">
          <input
            value={manuale}
            inputMode="numeric"
            onChange={(e) => setManuale(e.target.value.replace(/\D/g, ''))}
            placeholder="8001234567890"
            className={cx(inputCls, 'flex-1 tabular-nums')}
          />
          <Button disabled={!barcodeValido(manuale)} onClick={() => onCodice(manuale.trim())}>
            <Search size={15} />
          </Button>
        </div>
      </Field>

      {errore && <p className="text-[11px] text-carb">{errore}</p>}
    </div>
  );
}
