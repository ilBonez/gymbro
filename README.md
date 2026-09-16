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

La barra in basso ha cinque sezioni; dentro ognuna si naviga con la fila di schede sotto al titolo,
così niente sta a più di due tocchi. Ogni scheda è un indirizzo vero: il tasto indietro riporta dove
eri, coi filtri che avevi.

| Sezione | Cosa fa |
| --- | --- |
| **Oggi** | Allenamento di oggi, macro della giornata, checklist integratori, peso |
| **Allena** | Programmi · Esercizi · Storico. 4 blocchi, 16 schede, 86 esercizi con esecuzione ed errori comuni |
| **Sessione** | Timer, log di serie/carico/ripetizioni, carico suggerito, record personali, conto alla rovescia per plank e simili, cambio esercizio al volo, playlist Spotify |
| **Piano** | Calendario: stendi un programma su più settimane (anche solo lun-ven), calorie e passi giorno per giorno |
| **Dieta** | Oggi · Ricette · Sostituzioni · Spesa · Integratori |

| **Progressi** | Peso e misure · Dieta (aderenza) · Allenamento (scarico, serie per muscolo, volume) |

Calorie e macro: metabolismo basale con Mifflin-St Jeor, TDEE per livello di attività, macro per
obiettivo (le regole stanno in [`src/lib/nutrition.ts`](src/lib/nutrition.ts)). Il blocco low carb è
limitato a 4-6 settimane e l'app avvisa quando è ora di smettere.

**Progressione dei carichi:** a ogni seduta l'app propone il peso da usare con la regola della doppia
progressione — si sale solo dopo aver chiuso tutte le serie al tetto dell'intervallo, si cala dopo due
serie sotto il minimo. Tiene il massimale stimato (Epley) per esercizio, il suo andamento e i record.

**Aderenza:** la scheda Progressi incrocia i pasti registrati con le pesate e dice cosa è successo
davvero — *"in media 2.328 kcal contro 2.106 di target, il peso è sceso di 0,5 kg contro i 0,58 attesi"*.
Con meno di quattro giorni registrati lo dichiara invece di tirare conclusioni.

**Scarico:** l'app guarda l'andamento del massimale stimato sui multiarticolari. Se cala di oltre il 3%
o resta fermo per quattro settimane lo dice, perché in definizione la perdita di forza è il segnale per
chiudere il blocco.

**Backup:** i dati stanno solo sul dispositivo, quindi l'app ne salva una copia al giorno in
`Documenti/GymBro` tenendo gli ultimi sette file. Dal profilo si ripristina da file, con anteprima e
conferma. Nel browser resta il download manuale.

**Promemoria:** notifiche locali per caffeina (calcolata all'indietro dall'ora di allenamento),
allenamento, pesata del mattino e magnesio della sera. Solo nell'app installata.

Ogni programma mostra anche quante calorie costa una seduta e che variazione di peso aspettarsi in una
settimana. I MET vengono dal
[2024 Adult Compendium of Physical Activities](https://pacompendium.com/adult-compendium/), col codice
della voce citato nel codice. Sono stime con un margine del 20-30%, utili per confrontare un blocco con
l'altro.

Due numeri che sorprendono e sono corretti: **una seduta di pesi costa meno di quanto sembri** (3,5 MET
per "esercizi multipli, 8-15 ripetizioni", perché in un'ora il tempo sotto sforzo è di pochi minuti), e
**il cardio costa di più al minuto ma dura meno**, quindi nel totale settimanale i pesi possono comunque
superarlo.

I prezzi degli alimenti sono **indicativi**: cambiano da un punto vendita all'altro.

**Sostituzioni:** la scheda Dieta calcola le porzioni equivalenti — 80 g di pasta = 70 g di riso = 100 g
di pane = 360 g di patate = 150 g di gnocchi — partendo dalle
[tabelle CREA 2019](https://www.alimenti-nutrizione.it/), non dai rapporti tradizionali, che con i dati
aggiornati non tornano più (la regola "80 g di pasta = 300 g di patate" sottostima del 17%). Ogni
porzione mostra anche il peso da cotto e la differenza di calorie.

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
| `npm run audit:dati` | controlla che i numeri tornino: kcal contro macro, ricette contro ingredienti, recuperi contro obiettivo |
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
