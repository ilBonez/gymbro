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

**Prerequisiti non ancora presenti su questa macchina:**

| Serve | Stato attuale |
| --- | --- |
| JDK 21 (Capacitor 7 non compila con versioni precedenti) | installato JDK 8 |
| Android SDK (via Android Studio o command line tools), con `ANDROID_HOME` impostata | non installato |

Una volta installati:

```bash
npm run android:sync     # build web + copia dentro al progetto nativo
npm run android:apk      # APK di debug
```

L'APK di debug esce in `android/app/build/outputs/apk/debug/app-debug.apk`: si installa sul telefono
abilitando "origini sconosciute". Per un APK firmato da distribuire serve una keystore, si genera da
Android Studio (`Build > Generate Signed Bundle / APK`).

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
