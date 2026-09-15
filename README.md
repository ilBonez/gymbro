# GymBro

App per allenamento e dieta. Gira tutta sul tuo dispositivo: niente account, niente server, i dati
restano nel browser (o nell'app) e non escono mai.

## Avvio rapido da PC

Servono **Node 22+** e **Git**. Una volta sola:

```bash
git clone https://github.com/ilBonez/gymbro.git
```

```bash
cd gymbro
```

```bash
npm install
```

Poi, ogni volta che vuoi usarla:

```bash
npm run dev
```

Apri **http://localhost:5173**. Al primo avvio ti chiede nome, misure e obiettivo, poi sei dentro.
Per fermarla: `Ctrl+C` nel terminale.

> Lancia i comandi **dentro la cartella `gymbro`**. Da un'altra cartella npm risponde
> `ENOENT ... package.json`.

### Usarla sul telefono, senza compilare niente

Con `npm run dev` attivo, dal telefono sulla stessa rete Wi-Fi apri `http://<ip-del-pc>:5173`
(l'IP lo trovi con `ipconfig`). Nel browser scegli "Aggiungi alla schermata Home": diventa un'app a
tutti gli effetti e continua a funzionare offline.

## Cosa c'è dentro

| Sezione | Cosa fa |
| --- | --- |
| **Home** | Allenamento di oggi, macro della giornata, checklist integratori, peso |
| **Allena** | 4 programmi (definizione low carb, forza, massa, mantenimento), 16 schede, 86 esercizi con esecuzione ed errori comuni |
| **Sessione** | Timer, log di serie/carico/ripetizioni, timer di recupero con beep, playlist Spotify |
| **Piano** | Calendario: stendi un programma su più settimane (anche solo lun-ven), calorie e passi giorno per giorno |
| **Dieta** | Menu generato sui tuoi macro da 54 ricette, diario pasti (anche a mano o "sgarro"), ricettario |
| **Spesa** | Lista dei 7 giorni raggruppata per reparto, con link di ricerca Eurospin |
| **Progressi** | Peso, girovita, BMI, volume settimanale, anelli di movimento/passi/sonno da Health Connect |

Calorie e macro: metabolismo basale con Mifflin-St Jeor, TDEE per livello di attività, macro per
obiettivo (le regole stanno in [`src/lib/nutrition.ts`](src/lib/nutrition.ts)). Il blocco low carb è
limitato a 4-6 settimane e l'app avvisa quando è ora di smettere.

Ogni programma mostra anche quante calorie costa una seduta e che variazione di peso aspettarsi in una
settimana: sono stime con un margine del 20-30%, utili per confrontare un blocco con l'altro.

I prezzi degli alimenti sono **indicativi**: cambiano da un punto vendita all'altro.

Il tema si sceglie dal profilo: chiaro, scuro o automatico.

**Spotify:** a ogni scheda puoi associare una playlist incollando il suo link; durante l'allenamento un
tasto la apre in Spotify. Non c'è un player interno — servirebbero un'app registrata su Spotify e un
account Premium.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | avvia l'app su http://localhost:5173 |
| `npm run build` | controlla i tipi e crea la build in `dist/` |
| `npm run typecheck` | solo controllo dei tipi |
| `npm run check:data` | verifica che i riferimenti fra esercizi, programmi, ricette e alimenti risolvano |
| `npm run android:sync` | build web + copia nel progetto Android |
| `npm run android:apk` | APK di debug (vedi sotto) |

## App Android

Il progetto Capacitor è pronto in `android/`, e nell'APK l'app legge peso, passi, calorie attive e
frequenza cardiaca da **Health Connect**.

`npm run android:apk` **non funziona su questo PC**: Sophos blocca le socket che Gradle usa
internamente. L'APK si compila su GitHub Actions — tab **Actions → APK Android → Run workflow**, poi
scarichi `gymbro-debug-apk` dagli artifact della run.

Diagnosi completa, toolchain e permessi richiesti: [`docs/android.md`](docs/android.md).

## Struttura

```
src/
  data/         esercizi, programmi, alimenti, ricette, integratori
  lib/          logica pura: nutrizione, dieta, date, Health Connect
  store/        stato globale (zustand, salvato in localStorage)
  components/   UI condivisa
  pages/        una schermata per file
```

## Avvertenza

GymBro non è un dispositivo medico e non sostituisce medico, dietista o preparatore. Le stime
caloriche hanno un margine del 10-15%: sono un punto di partenza da correggere sui risultati reali.
