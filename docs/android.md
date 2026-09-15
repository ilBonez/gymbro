# App Android e Health Connect

Dettagli tecnici della build nativa. Per l'uso quotidiano basta il [README](../README.md).

## Il progetto nativo

L'app è impacchettata con [Capacitor](https://capacitorjs.com/); il progetto nativo è già in
`android/` (`npx cap add android` è stato eseguito una volta sola e il risultato è nel repository).

```bash
npm run android:sync     # build web + copia dentro al progetto nativo
npm run android:apk      # APK di debug
```

L'APK esce in `android/app/build/outputs/apk/debug/app-debug.apk` e si installa sul telefono
abilitando "origini sconosciute". Per un APK firmato serve una keystore, che si genera da Android
Studio (`Build > Generate Signed Bundle / APK`).

## Toolchain installata sul PC

| Cosa | Dove |
| --- | --- |
| Temurin JDK 21 | `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot` |
| Android SDK (platform-tools, platform 36, build-tools 36.0.0) | `%LOCALAPPDATA%\Android\Sdk` |

`JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` e `PATH` sono già impostate a livello utente.

## Gradle non parte su questa macchina

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

Il blocco è sulle socket AF_UNIX, non sulla rete. Sulla macchina girano **Sophos Intercept X** (con
*Sophos Network Threat Protection*) e il firewall **McAfee**: sono loro il sospetto.

Due strade:

1. **Chiedere all'IT un'esclusione per `java.exe`** (l'eseguibile del JDK qui sopra) in Sophos
   Intercept X. È l'unica via per compilare in locale, e non è una cosa da fare da soli su un PC
   aziendale.
2. **Compilare nel cloud**, che è la strada già pronta.

## Compilare l'APK su GitHub Actions

`.github/workflows/android.yml` compila l'APK a ogni push su `main`, oppure a mano dalla tab
**Actions → APK Android → Run workflow**. L'APK finisce fra gli artifact della run, scaricabile come
`gymbro-debug-apk`. Non serve nessuna toolchain locale.

## Health Connect

Nell'APK la schermata **Progressi** legge i dati sanitari del telefono tramite
[Health Connect](https://developer.android.com/health-and-fitness/health-connect), con il plugin
`@capgo/capacitor-health`. Le API Google Fit non sono un'opzione: le iscrizioni sono chiuse dal
1 maggio 2024 e Google le spegne entro fine 2026.

GymBro chiede **quattro permessi, tutti in sola lettura**, più lo storico oltre i 30 giorni:

| Permesso | A cosa serve |
| --- | --- |
| `READ_WEIGHT` | importare il peso dalla bilancia senza riscriverlo |
| `READ_STEPS` | passi giornalieri |
| `READ_ACTIVE_CALORIES_BURNED` | confrontare il movimento reale col TDEE stimato |
| `READ_HEART_RATE` | stimare la frequenza a riposo |
| `READ_HEALTH_DATA_HISTORY` | leggere oltre gli ultimi 30 giorni |

Il plugin dichiara nel proprio manifest tutti e 47 i permessi sanitari, lettura *e* scrittura: gli
altri 43 sono rimossi in `android/app/src/main/AndroidManifest.xml` con `tools:node="remove"`. L'app
non scrive nulla dentro Health Connect.

Cose da sapere:

- **Health Connect è un intermediario, non una fonte.** Se sul telefono nessuna app ci scrive dentro
  (Samsung Health, Fitbit, Garmin, Zepp, una bilancia smart…), GymBro leggerà un archivio vuoto.
- Su **Android 14+** è già nel sistema; su **Android 9-13** va installata dal Play Store. Sotto
  Android 9 e sui dispositivi con profilo di lavoro non funziona.
- Il plugin impone `minSdkVersion 26` (alzato da 24 in `android/variables.gradle`): esclude Android
  5-7.1, che comunque non supportano Health Connect.
- L'informativa privacy è un file locale, `public/privacypolicy.html`, che finisce in
  `assets/public/privacypolicy.html`: Health Connect la apre dal proprio foglio dei permessi. È
  obbligatoria anche per una build installata a mano.
- **Se un giorno l'app va sul Play Store** serve la *Health apps declaration* in Play Console, con
  giustificazione per ogni tipo di dato, più la sezione Data safety. Per un APK installato a mano non
  risulta necessaria (la documentazione Google parla solo di app pubblicate), ma Google non lo
  dichiara esplicitamente da nessuna parte: è un'assenza di requisito, non un'esenzione scritta.
- Su iOS lo stesso plugin usa HealthKit, ma servono un account sviluppatore Apple e l'entitlement:
  non è configurato.
