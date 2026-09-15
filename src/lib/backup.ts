import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

/**
 * Backup dei dati.
 *
 * Tutto GymBro vive in localStorage: basta svuotare i dati del browser, cambiare
 * telefono o reinstallare l'APK per perdere profilo, allenamenti e pesate. Un
 * export manuale non basta, perché nessuno se lo ricorda: qui c'è anche un
 * backup automatico che scatta da solo una volta al giorno.
 *
 * Sul telefono i file finiscono in Documents/GymBro. Nel browser il salvataggio
 * automatico non è possibile senza chiedere ogni volta, quindi resta il solo
 * export manuale.
 */

const CHIAVE_STORE = 'gymbro-v1';
const CHIAVE_ULTIMO = 'gymbro-ultimo-backup';
const CARTELLA = 'GymBro';
const DA_TENERE = 7;

export interface EsitoBackup {
  ok: boolean;
  percorso?: string;
  motivo?: string;
}

function datiCorrenti(): string {
  return localStorage.getItem(CHIAVE_STORE) ?? '{}';
}

function nomeFile(d = new Date()): string {
  return `gymbro-${d.toISOString().slice(0, 10)}.json`;
}

async function filesystemDisponibile(): Promise<boolean> {
  try {
    await Filesystem.readdir({ path: CARTELLA, directory: Directory.Documents });
    return true;
  } catch {
    try {
      await Filesystem.mkdir({ path: CARTELLA, directory: Directory.Documents, recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}

/** Scrive un backup su file. Sul web non è possibile: restituisce ok:false. */
export async function salvaBackup(): Promise<EsitoBackup> {
  if (!(await filesystemDisponibile())) {
    return { ok: false, motivo: 'Il salvataggio su file funziona solo nell’app installata.' };
  }
  try {
    const percorso = `${CARTELLA}/${nomeFile()}`;
    await Filesystem.writeFile({
      path: percorso,
      data: datiCorrenti(),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    localStorage.setItem(CHIAVE_ULTIMO, new Date().toISOString());
    await potaVecchi();
    return { ok: true, percorso };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}

/** Tiene solo gli ultimi backup, per non riempire la memoria del telefono. */
async function potaVecchi(): Promise<void> {
  try {
    const { files } = await Filesystem.readdir({ path: CARTELLA, directory: Directory.Documents });
    const backup = files
      .filter((f) => f.name.startsWith('gymbro-') && f.name.endsWith('.json'))
      .map((f) => f.name)
      .sort();
    for (const vecchio of backup.slice(0, Math.max(0, backup.length - DA_TENERE))) {
      await Filesystem.deleteFile({
        path: `${CARTELLA}/${vecchio}`,
        directory: Directory.Documents,
      });
    }
  } catch {
    /* se la pulizia fallisce non è un problema: il backup è già scritto */
  }
}

export function ultimoBackup(): Date | null {
  const v = localStorage.getItem(CHIAVE_ULTIMO);
  return v ? new Date(v) : null;
}

/** Backup automatico: scatta se è passato più di un giorno dall'ultimo. */
export async function backupSeServe(): Promise<void> {
  const ultimo = ultimoBackup();
  if (ultimo && Date.now() - ultimo.getTime() < 24 * 3600 * 1000) return;
  await salvaBackup();
}

/** Scarica il backup come file, l'unica via nel browser. */
export function scaricaBackup(): void {
  const blob = new Blob([datiCorrenti()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile();
  a.click();
  URL.revokeObjectURL(url);
}

export interface Anteprima {
  nome: string;
  allenamenti: number;
  pesate: number;
  pasti: number;
  obiettivo: string;
}

/** Controlla che il file sia davvero un backup di GymBro prima di ripristinarlo. */
export function leggiBackup(testo: string): { dati: string; anteprima: Anteprima } | null {
  try {
    const parsed = JSON.parse(testo);
    const stato = parsed?.state;
    if (!stato || typeof stato !== 'object') return null;
    if (!('profile' in stato) || !('pesi' in stato)) return null;
    return {
      dati: testo,
      anteprima: {
        nome: stato.profile?.nome ?? 'senza nome',
        allenamenti: Array.isArray(stato.sessioni) ? stato.sessioni.length : 0,
        pesate: Array.isArray(stato.pesi) ? stato.pesi.length : 0,
        pasti: Array.isArray(stato.pasti) ? stato.pasti.length : 0,
        obiettivo: stato.profile?.obiettivo ?? '—',
      },
    };
  } catch {
    return null;
  }
}

/** Sovrascrive i dati e ricarica: va chiamata solo dopo conferma esplicita. */
export function ripristina(dati: string): void {
  localStorage.setItem(CHIAVE_STORE, dati);
  window.location.reload();
}
