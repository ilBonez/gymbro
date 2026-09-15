# GymBro

App locale per allenamento + dieta. Nessun account, nessun server: tutti i dati restano nel browser
(o nell'app Android) tramite `localStorage`.

## Cosa fa

| Sezione | Contenuto |
| --- | --- |
| **Home** | Allenamento di oggi, bilancio macro, checklist integratori, peso e TDEE |
| **Allena** | 4 programmi (definizione low carb, forza, massa, mantenimento) + libreria di 86 esercizi con esecuzione, errori e alternative |
| **Sessione** | Timer sessione, log serie/ripetizioni/carico, timer di recupero con beep, volume totale |
| **Piano** | Calendario settimanale: assegni scheda, riposo o cardio a ogni giorno; un programma si stende su N settimane in un colpo |
| **Dieta** | Menu giornaliero generato sui tuoi macro, ricettario, diario pasti |
| **Spesa** | Lista generata dal menu dei 7 giorni, raggruppata per reparto, con link di ricerca su Eurospin |
| **Progressi** | Grafico peso, girovita, BMI, volume settimanale |

## Come sono calcolati i numeri

- **Metabolismo basale**: Mifflin-St Jeor.
- **TDEE**: basale × fattore di attività (1.2 – 1.9).
- **Macro**: per obiettivo, in `src/lib/nutrition.ts` (`GOAL_RULES`).
  - `definizione` — deficit 22%, proteine 2.2 g/kg, carboidrati con tetto a 1.6 g/kg (low carb), grassi a
    coprire il resto. Il blocco è limitato a 4-6 settimane e l'app avvisa quando scade.
  - `forza` — +5% kcal, proteine 2.0 g/kg, carboidrati alti.
  - `massa` — +13% kcal, proteine 1.9 g/kg.
  - `mantenimento` — kcal a pareggio.
- I grassi non scendono mai sotto 0.6 g/kg, anche in deficit.

Sono stime con un margine del 10-15%: vanno corrette in base al peso reale nelle settimane successive.

## Sviluppo

```bash
npm install
npm run dev
```

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | server di sviluppo su http://localhost:5173 |
| `npm run build` | typecheck + build di produzione in `dist/` |
| `npm run typecheck` | solo controllo dei tipi |
| `npm run check:data` | verifica che ogni riferimento incrociato nei dati risolva |

## Build Android (APK)

L'app è impacchettata con [Capacitor](https://capacitorjs.com/) e il progetto nativo è già presente in
`android/` (`npx cap add android` è già stato eseguito).

La toolchain è installata: **Temurin JDK 21** in `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`
e l'**Android SDK** (platform-tools, platform 36, build-tools 36.0.0) in
`%LOCALAPPDATA%\Android\Sdk`, con `JAVA_HOME`, `ANDROID_HOME` e `PATH` già impostate a livello utente.

```bash
npm run android:sync     # build web + copia dentro al progetto nativo
npm run android:apk      # APK di debug
```

> I comandi vanno lanciati **dentro `C:\Progetti\gymbro`**. Da un'altra cartella npm cerca lì il
> `package.json` e fallisce con `ENOENT ... package.json`.

### Gradle non parte su questa macchina

`gradlew assembleDebug` fallisce prima ancora di compilare:

```
java.io.IOException: Unable to establish loopback connection
    at java.base/sun.nio.ch.PipeImpl$Initializer.run(PipeImpl.java:103)
```

Il client Gradle parla col proprio daemon attraverso una `java.nio.channels.Pipe`, che su Windows si
appoggia a una socket locale. Su questo PC quella socket non si apre. Diagnosi eseguita:

| Prova | Esito |
| --- | --- |
| Loopback TCP da PowerShell (IPv4 e IPv6) | funziona |
| `ServerSocket` / `SocketChannel` su 127.0.0.1 da Java | funziona, handshake a 16 byte incluso |
| Socket **AF_UNIX** da Java (`bind` poi `connect`) | `SocketException: Invalid argument: connect` |
| `Selector.open()` da Java, con qualunque provider e qualunque `java.io.tmpdir` | fallisce sempre |

Il blocco è quindi sulle socket AF_UNIX, non sulla rete. Sulla macchina girano **Sophos Intercept X**
(con *Sophos Network Threat Protection*) e il firewall **McAfee**: sono loro il sospetto.

Due strade:

1. **Chiedere all'IT un'esclusione per `java.exe`** (l'eseguibile del JDK sopra) in Sophos Intercept X.
   È l'unica via per compilare in locale, e non è una cosa da fare da soli su un PC aziendale.
2. **Compilare nel cloud**, che è la strada già pronta: vedi sotto.

### Compilare l'APK su GitHub Actions

`.github/workflows/android.yml` compila l'APK a ogni push su `main`, oppure a mano dalla tab **Actions
→ APK Android → Run workflow**. L'APK finisce fra gli artifact della run, scaricabile come
`gymbro-debug-apk`. Non serve nessun toolchain locale.

L'APK di debug si chiama `app-debug.apk` e si installa sul telefono abilitando "origini sconosciute".
Per un APK firmato serve una keystore, che si genera da Android Studio
(`Build > Generate Signed Bundle / APK`).

## Health Connect

Nell'APK la schermata **Progressi** può leggere i dati sanitari del telefono tramite
[Health Connect](https://developer.android.com/health-and-fitness/health-connect) (plugin
`@capgo/capacitor-health`). Le API Google Fit non sono un'opzione: le iscrizioni sono chiuse dal
1 maggio 2024 e Google le spegne entro fine 2026.

GymBro chiede **quattro permessi, tutti in sola lettura**, più lo storico oltre i 30 giorni:

| Permesso | A cosa serve |
| --- | --- |
| `READ_WEIGHT` | importare il peso dalla bilancia senza riscriverlo |
| `READ_STEPS` | passi giornalieri |
| `READ_ACTIVE_CALORIES_BURNED` | confrontare il movimento reale col TDEE stimato |
| `READ_HEART_RATE` | stimare la frequenza a riposo |
| `READ_HEALTH_DATA_HISTORY` | leggere oltre gli ultimi 30 giorni |

Il plugin dichiara nel proprio manifest tutti e 47 i permessi sanitari, lettura *e* scrittura: gli altri
43 sono rimossi in `android/app/src/main/AndroidManifest.xml` con `tools:node="remove"`. L'app non
scrive nulla dentro Health Connect.

Cose da sapere:

- **Health Connect è un intermediario, non una fonte.** Se sul telefono nessuna app ci scrive dentro
  (Samsung Health, Fitbit, Garmin, Zepp, una bilancia smart…), GymBro leggerà un archivio vuoto.
- Su **Android 14+** è già nel sistema; su **Android 9-13** va installata dal Play Store. Sotto Android 9
  e sui dispositivi con profilo di lavoro non funziona.
- Il plugin impone `minSdkVersion 26` (alzato da 24 in `android/variables.gradle`): esclude Android 5-7.1,
  che comunque non supportano Health Connect.
- L'informativa privacy è un file locale, `public/privacypolicy.html`, che finisce in
  `assets/public/privacypolicy.html`: Health Connect la apre dal proprio foglio dei permessi. È
  obbligatoria anche per una build side-loaded.
- **Se un giorno l'app va sul Play Store** serve la *Health apps declaration* in Play Console, con
  giustificazione per ogni tipo di dato, più la sezione Data safety. Per un APK installato a mano non
  risulta necessaria (la documentazione Google parla solo di app pubblicate), ma Google non lo dichiara
  esplicitamente da nessuna parte: è un'assenza di requisito, non un'esenzione scritta.
- Su iOS lo stesso plugin usa HealthKit, ma serve un account sviluppatore Apple e l'entitlement: non è
  configurato.

In alternativa, senza toolchain Android: l'app è una PWA, si apre nel browser del telefono e si aggiunge
alla home con "Installa app".

## Struttura

```
src/
  data/         dati statici: esercizi, programmi, alimenti, ricette, integratori
  lib/          logica pura: nutrition, diet, date, catalog
  store/        stato globale (zustand + persist su localStorage)
  components/   UI condivisa
  pages/        una cartella per schermata
```

## Avvertenza

GymBro è uno strumento di supporto, non un dispositivo medico e non sostituisce medico, dietista o
preparatore atletico. Le indicazioni su integratori e diete sono riferimenti generali per adulti sani.
