# SMRT.FTNSS — persoonlijke trainingsapp

Web-app (PWA) voor thuistraining op basis van het rapport *"Fysiologische Optimalisatie van Thuistraining voor Hypertrofie en Lichaamsrecompositie"*. Volledig statisch — geen backend, geen build-stap. Alle data blijft lokaal op je toestel; de enige externe verbindingen zijn intervals.icu (met jouw API-key) en YouTube (video-embeds).

## Wat zit erin

- **Wachtrij-planner**: geen vaste trainingsdagen maar een A→B→C-wachtrij op basis van wat je echt gedaan hebt. Gemiste sessies schuiven automatisch op, met bewaking van spierherstel (±48 u per spiergroep) en een doel van 3 zware sessies per week.
- **Mesocyclus**: blokken van 5 weken — volume bouwt op van rustig (MEV) naar piek (MRV), daarna deload. Bij aanhoudend slechte vorm komt de deload eerder (vermoeidheids-deload).
- **Hardcoded slimmigheid**: het dagadvies weegt je intervals.icu-vorm (CTL−ATL), **slaap** (<7 u = lichter, <5,5 u = alleen een snack), **rusthartslag/HRV-afwijkingen**, zware activiteiten van gisteren/vandaag, je eigen logs en de "moe"-knoppen.
- **Twee richtingen intervals.icu**: lezen (wellness + activiteiten) én schrijven — afgeronde sessies worden als WeightTraining-activiteit gepost (met geschatte load via sessie-RPE), zodat je vorm ook je krachttraining meetelt.
- **Workout-player**: set-logging met RIR per set, rusttimer met piep/tril, wake lock, automatische opwarmsets (±50%/±75% ramp), supersets uit het rapport (geen rust tussen A/B), oefening wisselen met gelijkwaardige alternatieven, YouTube-instructies (alle ID's geverifieerd), afrond-scherm met gevoel + notitie en PR-viering 🎉.
- **Progressie**: per-oefening e1RM-grafieken en records, double progression met je échte dumbbell-inventaris, plateau-detectie, weekvolume vs. rapport-doelen + 8-weekse volume-historie met MRV-waarschuwing, fitness/vorm-grafiek, gewichtstrend met recomp-bewaking (>0,7%/week verlies = waarschuwing), maandcheck met taille-meting, weekdoel-streak.
- **Programma-beheer**: sessies in-app bewerken (oefeningen, sets/reps/rust, volgorde), eigen oefeningen aanmaken, vrije workouts die gewoon meetellen.
- **Historie**: workouts bekijken, bewerken, verwijderen (incl. verwijderen op intervals.icu).
- **113+ oefeningen** (uit de oude Swift-app + banden/ab-roller-oefeningen uit het rapport + je eigen toevoegingen), gefilterd op jouw materiaal.

## Online zetten (GitHub Pages, gratis)

1. Maak een (private kan ook) repo, bijv. `smrt-ftnss`, en push de inhoud van deze map naar de root (of push de hele FAIT-repo en gebruik deze submap).
2. GitHub → repo → Settings → Pages → Source: *Deploy from a branch* → branch `main`, folder `/ (root)` (of `/webapp` als je de hele repo pusht — kies dan "GitHub Actions" of verplaats deze map naar de root).
3. Na een minuut staat de app op `https://<gebruikersnaam>.github.io/fait/`.

Alternatieven: Cloudflare Pages of Netlify (map hierheen slepen is genoeg), of lokaal testen met `python3 -m http.server` in deze map.

> **Let op:** een service worker (offline-modus) werkt alleen via https of localhost.

## Op je iPhone installeren

1. Open de URL in **Safari**.
2. Deel-knop → **"Zet op beginscherm"**.
3. De app opent voortaan fullscreen met eigen icoon, werkt offline en onthoudt alles lokaal.

## intervals.icu koppelen

1. intervals.icu → **Settings → Developer Settings → API key** aanmaken.
2. In SMRT.FTNSS: **Instellingen → intervals.icu** → key plakken → *Opslaan & testen*.
3. De key blijft in localStorage op je toestel en gaat uitsluitend rechtstreeks naar intervals.icu (de API ondersteunt CORS; er zit geen server tussen).

Apple Watch later? Apps als HealthFit sturen Watch-workouts automatisch naar intervals.icu — SMRT.FTNSS ziet ze dan vanzelf.

## Structuur

```
webapp/
├── index.html            app-shell
├── manifest.webmanifest  PWA-manifest
├── sw.js                 service worker (offline cache)
├── css/style.css         huisstijl (dark teal, BBH Hegarty self-hosted)
├── js/
│   ├── app.js            router + tabbar
│   ├── state.js          localStorage-state + backup import/export
│   ├── icu.js            intervals.icu-client (Basic auth, cache 30 min)
│   ├── engine.js         weekplanning, readiness-regels, progressie, volume
│   ├── data/exercises.js 113 oefeningen (gegenereerd uit ExerciseLibrary.swift)
│   ├── data/program.js   sessies, snacks, weekschema, deload, gewoontes
│   └── ui/               schermen (vandaag, workout, week, bibliotheek, progressie, instellingen)
└── assets/               font + iconen
```

## Regels van de planner (engine.js)

**Wachtrij** (welke sessie vandaag): volgende in A→B→C-cyclus zodra alle focus-spiergroepen hersteld zijn én er nog zware sessies nodig zijn deze week (doel 3); liefst om de dag, maar inhalen mag op opeenvolgende dagen als het weekdoel anders niet haalbaar is. Anders: snack (core/pomp afwisselend), zondag rust als het doel gehaald is.

**Readiness** (hoe zwaar vandaag):

| Situatie | Actie |
|---|---|
| Vorm ≤ −25 of "kapot"-knop | Zware sessie → mobiliteitssnack, sessie schuift op |
| Vorm ≤ −12 of "moe"-knop | −25% sets, RIR +1, +30s rust |
| Slaap < 5,5 u | Zware sessie → snack + geen agressief calorietekort vandaag |
| Slaap < 7 u of weekgemiddelde < 6,5 u | Lichter |
| Rust-HR ≥ 7d-gemiddelde +5, of HRV ≤ 80% van gemiddelde | Lichter |
| Gisteren zware activiteit (load ≥ 70 of ≥ 1,5 u) | Lichter |
| Vandaag al zwaar gesport | Zware sessie → banden-snack |
| Gisteren lange rit/loop + benen gepland | Verlicht |

**Mesocyclus**: blokweek 1-4 → sets ×0.85 / ×1.0 / ×1.1 / ×1.2, week 5 deload ×0.6 & RIR +3. Vermoeidheids-deload: gemiddelde vorm ≤ −15 over 5 dagen → deload direct.

**Recomp-bewaking**: gewichtsverlies ≥ 0,7%/week → waarschuwing (spierverlies-risico); bij doel "cut" en ~4 weken stilstand → suggestie −100 kcal.
