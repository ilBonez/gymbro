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

function rilevatoreDisponibile(): CostruttoreRilevatore | undefined {
  return (globalThis as { BarcodeDetector?: CostruttoreRilevatore }).BarcodeDetector;
}

export function ScannerBarcode({ onCodice }: { onCodice: (codice: string) => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errore, setErrore] = useState('');
  const [manuale, setManuale] = useState('');
  const [inquadra, setInquadra] = useState(false);

  const Rilevatore = rilevatoreDisponibile();

  const spegni = () => {
    setStream((s) => {
      s?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setInquadra(false);
  };

  // la fotocamera non deve restare accesa quando il foglio si chiude
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  /*
   * Attaccare lo stream e farlo partire.
   *
   * Prima lo facevo in un setTimeout dopo getUserMedia: a volte il <video> non
   * era ancora nel DOM, e comunque senza `autoplay` la riproduzione non
   * partiva da sola — restava il rettangolo grigio col triangolo del play.
   * Qui l'effetto gira dopo il commit, quindi l'elemento c'è di sicuro, e
   * play() viene richiamato anche quando i metadati arrivano più tardi.
   */
  useEffect(() => {
    const v = video.current;
    if (!v || !stream) return;

    v.srcObject = stream;
    const avvia = () => {
      v.play()
        .then(() => setInquadra(true))
        .catch(() => setErrore('La fotocamera non è partita. Scrivi il codice a mano qui sotto.'));
    };

    if (v.readyState >= 1) avvia();
    else v.addEventListener('loadedmetadata', avvia, { once: true });

    return () => {
      v.removeEventListener('loadedmetadata', avvia);
      v.srcObject = null;
    };
  }, [stream]);

  /*
   * Il ciclo di lettura.
   *
   * Prima usciva subito: la condizione del while chiedeva readyState >= 2, che
   * appena acceso è ancora 0, e il ciclo non partiva nemmeno una volta. Ora
   * aspetta che ci siano fotogrammi invece di arrendersi.
   */
  useEffect(() => {
    if (!stream || !Rilevatore) return;
    const rilevatore = new Rilevatore({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    let attivo = true;

    const attendi = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const cerca = async () => {
      while (attivo) {
        const v = video.current;
        if (!v || v.readyState < 2 || v.videoWidth === 0) {
          await attendi(200);
          continue;
        }
        try {
          const trovati = await rilevatore.detect(v);
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
        await attendi(250);
      }
    };
    void cerca();

    return () => {
      attivo = false;
    };
  }, [stream, Rilevatore, onCodice]);

  const accendi = async () => {
    setErrore('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      });
      setStream(s);
    } catch {
      setErrore('Fotocamera non disponibile o permesso negato. Scrivi il codice a mano.');
    }
  };

  return (
    <div className="space-y-3">
      {Rilevatore &&
        (stream ? (
          <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              className="h-52 w-full bg-black object-cover"
            />
            <div className="pointer-events-none absolute inset-x-8 inset-y-16 rounded-xl border-2 border-brand-500/80" />
            {!inquadra && (
              <p className="absolute inset-x-0 bottom-2 text-center text-[11px] text-white/80">
                Accendo la fotocamera…
              </p>
            )}
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
