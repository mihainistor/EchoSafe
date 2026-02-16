# Test Cases — EchoSafe

Acest document enumeră scenariile de testare recomandate pentru aplicație (frontend + integrare API), acoperind fluxurile principale, stările de eroare, performanța, accesibilitatea și specificul modului Demo. Toate testele sunt descrise la nivelul rezultatelor așteptate; pot fi implementate ulterior ca teste automate end‑to‑end (ex. Playwright/Cypress) și/sau teste unitare/integrate.

## Convenții
- Medii vizate: 
  - Demo ON (date synthetic generate local).
  - Demo OFF (integrare cu API, dacă sunt disponibile endpoint‑urile).
- Browsere: Chrome (desktop), Edge (desktop), Firefox (desktop), Chrome Mobile (Android).
- Rezoluții: 1440×900, 1280×800, 1024×768, 390×844 (mobil).
- Locale: ro‑RO pentru formatare dată/oră.

## 1. Autentificare și Demo
- TC‑A1: Login corect
  - Precondiții: cont existent.
  - Pași: Introdu email/parolă valide → Login.
  - Așteptat: redirecționare la /dashboard, token salvat local.
- TC‑A2: Login eșuat
  - Pași: email/parolă invalide.
  - Așteptat: mesaj eroare, rămâne pe login, fără token.
- TC‑A3: Logout
  - Pași: Deschide meniul profil → Logout.
  - Așteptat: token eliminat, redirect la /login.
- TC‑A4: Demo ON toggle din header
  - Pași: Buton DEMO → ON.
  - Așteptat: starea persistă (localStorage), la Login se permite intrare rapidă în demo.
- TC‑A5: Demo OFF
  - Pași: DEMO OFF.
  - Așteptat: deautentificare și redirect la /login (dacă era activ).

## 2. Header & Navigație
- TC‑H1: Link “EchoSafe” spre /
- TC‑H2: Meniu dashboard: Panou, Familie, Istoric Locație, Alerte.
- TC‑H3: Buton profil vizibil, meniu cu “Profil” (dacă user există) și “Logout”.
- TC‑H4: Z‑index header peste hartă
  - Așteptat: header rămâne deasupra hărții (nu este acoperit).
- TC‑H5: DEMO toggle deschide/închide dropdown și persistă setarea.

## 3. Dashboard
- TC‑D1: Quick links funcționale: Membri familie, Istoric Locație, Alerte.
- TC‑D2: Contează corect numerele (membri, alerte recente).
- TC‑D3: Simulare alerte din dashboard
  - Pași: “Simulează deviere”, “Simulează zona No‑Go”.
  - Așteptat: apar în “Alerte recente”, format dată/ora ro‑RO, link harta corect.
- TC‑D4: “Vezi toate alertele” deschide pagina Alerte.

## 4. Membri — listă și detaliu
- TC‑M1: În Demo — apar 5 membri (Andrei, Maria, Ioana, Vlad, Elena).
- TC‑M2: Navigare detaliu membru
  - Pași: Click pe membru.
  - Așteptat: pagina detaliu cu antet (nume, msisdn, status) și buton “Live”.
- TC‑M3: Ștergere membru (“Șterge membru”)
  - Pași: Apasă → Confirmă.
  - Așteptat: membrul dispare din listă, fără efecte secundare.

## 5. Live Tracking (detaliu membru)
- TC‑L1: Buton “Live” în antet
  - Pași: Start live → Contor mm:ss apare lângă buton.
  - Așteptat: buton devine “Oprește”, contor scade în timp real.
- TC‑L2: Oprire live
  - Pași: “Oprește”.
  - Așteptat: contor dispare, revine la “Live”.
- TC‑L3: Erori rețea la setarea live
  - Așteptat: mesaj de eroare prietenos.
- TC‑L4: Actualizare reachability/status legendă corectă.

## 6. Destinații (Safe Zones)
- TC‑Z1: Listare destinații implicite (Acasă, Școală, Antrenament).
- TC‑Z2: Adăugare destinație (nume, coordonate, rază)
  - Așteptat: apare în listă, valori persistate în context.
- TC‑Z3: Editare destinație (nume/rază/adresă).
- TC‑Z4: Ștergere destinație.
- TC‑Z5: Selectare destinații drept Safe Zones pentru staționare.

## 7. Configurare alerte (detaliu membru)
- TC‑C1: Toggle “Intrare în zonă No‑Go”.
- TC‑C2: Toggle “Abatere de la traseu”.
- TC‑C3: “Staționare prelungită”:
  - Pași: Enable → selectează durata (minute) → alege Safe Zones.
  - Așteptat: setările se salvează în context; doar staționarea are durată.
- TC‑C4: Verifică absența altor setări de timp pentru No‑Go și Abatere.

## 8. Trasee — Smart Path
- TC‑R1: “Calculează traseu” și “Salvează” separate
  - Așteptat: “Salvează” apare doar după calcul.
- TC‑R2: Selector mijloc de transport (o singură dată în SmartPath).
- TC‑R3: ETA/distanță din calculul smart.
- TC‑R4: Denumire traseu și alocare la unul sau mai mulți membri
  - Așteptat: salvat cu nume și lista membrilor.
- TC‑R5: Afișarea la ce membri e alocat fiecare traseu în listă.
- TC‑R6: Ștergere traseu din listă.

## 9. Trasee — Desenare manuală (Free‑hand)
- TC‑F1: Desen liber polilinie pe hartă.
- TC‑F2: Drag&drop puncte pentru ajustare.
- TC‑F3: Adăugare/ștergere puncte (dacă UI permite).
- TC‑F4: Selector mijloc de transport disponibil în Free‑hand.
- TC‑F5: Calcul distanță/durată pe segmente desenate.
- TC‑F6: Denumire traseu + alocare multi‑membru + salvare.
- TC‑F7: Pin/marker vizibil (URL explicit Leaflet) — fără icon lipsă.

## 10. Pagina Alerte
- TC‑AL1: Afișează doar istoricul de alerte (setări eliminate).
- TC‑AL2: “Generează alerte demo” adaugă elemente în listă.
- TC‑AL3: “Curăță” adaugă mesaj de instrucțiune (comportament demo).
- TC‑AL4: Linkuri din mesaje
  - Interne “/dashboard/member/:id” → navigare internă.
  - Externe Google Maps → deschidere în tab nou, rel=noopener.
- TC‑AL5: Empty state când nu există alerte.

## 11. Istoric Locație (Time Machine)
- Redare traseu:
  - TC‑T1: Un singur buton “Redă traseul” lângă intervalul orar; celălalt nu există.
  - TC‑T2: Încărcare puncte; colorare segmente în funcție de viteză; markeri start/stop.
  - TC‑T3: Tabel rute: sortare desc după start; selectare rând filtrează harta; “Afișează toate”.
  - TC‑T4: Export CSV disponibil când sunt puncte.
- Heatmap:
  - TC‑T5: Un singur buton “Afișează heatmap”.
  - TC‑T6: Fără slider; raza fixă 40 m.
  - TC‑T7: “Curăță” elimină heatmap.
  - TC‑T8: Performanță acceptabilă la 30 zile (demo).

## 12. Date Demo
- TC‑DD1: 5 membri generați.
- TC‑DD2: 3 trasee implicite pentru fiecare membru.
- TC‑DD3: 5 zone No‑Go per membru (mix permanent/scheduled).
- TC‑DD4: Istoric 10 rute/puncte pentru Heatmap.

## 13. Erori & Reziliență
- TC‑E1: API indisponibil la listDevices
  - Așteptat: UI nu se blochează; fallback safe; mesaje discrete.
- TC‑E2: Eșec la istoricul de locații
  - Așteptat: mesaj eroare în Time Machine.
- TC‑E3: Eșec salvare traseu
  - Așteptat: mesaj eroare și păstrare datelor completate.
- TC‑E4: Lipsă coordonate/permisiuni — hărți încă se încarcă cu centru implicit.

## 14. Securitate
- TC‑S1: Token eliminat la logout; rutele protejate redirecționează spre /login.
- TC‑S2: Fără scurgeri de token în loguri/URL.
- TC‑S3: XSS: mesaje alertă randate sigur; linkuri detectate controlat.
- TC‑S4: rel="noopener noreferrer" pentru linkuri externe.

## 15. Accesibilitate
- TC‑AC1: Navigare tastatură: header, meniul profil, butoane principale.
- TC‑AC2: Focus vizibil pentru elemente interactive.
- TC‑AC3: Contrast text esențial (antet, butoane).
- TC‑AC4: Atribute alt corecte pe logo; titluri de secțiune descriptive.

## 16. Responsivitate & Layout
- TC‑RSP1: Antet sticky fără a fi acoperit de hartă (z‑index).
- TC‑RSP2: Hărțile se redimensionează corect pe mobil.
- TC‑RSP3: Tabele scrollabile orizontal pe ecrane mici.
- TC‑RSP4: Butoane și controale neaglomerate pe mobil.

## 17. Performanță
- TC‑P1: Încărcare inițială < 3s în build producție la 10MBps.
- TC‑P2: Interacțiuni hartă fluide cu 10 rute în redare.
- TC‑P3: Heatmap pe 30 zile randează în < 1s după fetch (demo).

## 18. Internaționalizare & Formate
- TC‑I1: Formatare dată/oră în ro‑RO (Istoric, Alerte).
- TC‑I2: Texte butoane și etichete conforme cerințelor (ex. “Live”, “Șterge membru”).

## 19. Regresie — modificări recente
- TC‑RG1: “Live” + contor în antet, funcționează corect.
- TC‑RG2: “Șterge membru” înlocuiește “Revocă legătura”.
- TC‑RG3: Eliminat “Live Tracking … 1 min/10 min” din detalii membru.
- TC‑RG4: Tab Heatmap cu un singur buton; rază fixă 40m.
- TC‑RG5: Tab Redare traseu cu un singur “Redă traseul” la intervalul orar.
- TC‑RG6: SmartPath — selector transport o singură dată; Free‑hand — selector prezent.
- TC‑RG7: Pinurile Leaflet apar corect (iconuri externe).

## 20. Backend (dacă API disponibil)
- TC‑B1: POST /api/devices — creare device cu msisdn/label.
- TC‑B2: PATCH /api/devices/:id/live‑tracking — enable/disable; verificare until.
- TC‑B3: GET /api/devices/:id/location — maxAge, valori numeric valide.
- TC‑B4: GET /api/devices/:id/reachability — stări posibile.
- TC‑B5: GET /api/devices/:id/location‑history — interval from/to; rezultate ordonate.

---

Notă: Lista acoperă atât cazurile de happy‑path, cât și erorile și variațiile importante. Pentru automatizare, recomand structurarea pe fișiere per pagină (ex. dashboard.spec, member.spec, routes.spec, alerts.spec, timeMachine.spec) și fixarea datelor demo prin factory‑uri locale.

## 21. Mod NON‑DEMO (Prod/API) — End‑to‑End
- TC‑ND1: Login cu cont real
  - Pași: autentificare cu credențiale valide.
  - Așteptat: token JWT salvat; getMe returnează profilul.
- TC‑ND2: Token expirat
  - Pași: invalidează tokenul, reîncarcă o rută protejată.
  - Așteptat: 401, redirect la /login; niciun apel ulterior fără token.
- TC‑ND3: Autorizare 403
  - Pași: user fără drepturi pe un resource.
  - Așteptat: 403, mesaj prietenos în UI, fără leak detalii server.
- TC‑ND4: Listă dispozitive reale
  - Așteptat: GET /api/devices returnează lista; mapare corectă în UI Membri.
- TC‑ND5: Detaliu dispozitiv
  - Așteptat: GET /api/devices/:id conține label, msisdn, live_tracking flags.
- TC‑ND6: Live tracking enable
  - Pași: PATCH /api/devices/:id/live‑tracking enabled=true.
  - Așteptat: live_tracking_mode=true, live_tracking_until setat de server; UI arată contor.
- TC‑ND7: Live tracking disable
  - Așteptat: live_tracking_mode=false; contor dispare; fără polling la 1 minut.
- TC‑ND8: Locație curentă cu maxAge
  - Pași: GET /api/devices/:id/location?maxAge=NN.
  - Așteptat: lat/lng valide; accuracy numeric; timestamp în trecut ≤ maxAge.
- TC‑ND9: Reachability
  - Așteptat: una dintre stări server: CONNECTED_DATA | CONNECTED_SMS | NOT_CONNECTED; UI badge corect.
- TC‑ND10: Istoric locație interval
  - Pași: GET /location‑history?from&to.
  - Așteptat: puncte sortate crescător; rutele grupate logic; fără goluri mari sau cu justificare (ex. lipsă semnal).
- TC‑ND11: Heatmap pe date reale
  - Pași: încărcare interval 7/14/30 zile.
  - Așteptat: densitate realistă; performanță acceptabilă; fără slider, rază 40m.
- TC‑ND12: Destinații persistente
  - Pași: CRUD destinații dacă endpoint‑uri există; altfel salvare locală doar.
  - Așteptat: după reload, destinațiile revin din API; coordonate și raze corecte.
- TC‑ND13: Zone No‑Go persistente
  - Pași: CRUD zone; programări opționale; validări radius/time.
  - Așteptat: date persistă și sunt aplicate în logica alertelor.
- TC‑ND14: Trasee persistente (Smart + Free‑hand)
  - Pași: creare, actualizare, ștergere.
  - Așteptat: afișare în listă cu membri alocați; după reload rămân.
- TC‑ND15: Alerte end‑to‑end
  - Pași: declanșează no‑go/deviation/stationary pe date reale.
  - Așteptat: evenimente procesate; apar în listă cu timestamp corect; canale notificate conform setărilor.
- TC‑ND16: Notificări SMS/Push
  - Pași: activează SMS pentru no‑go; provoacă intrare în zonă.
  - Așteptat: livrare SMS conform politicii; în UI apare alertă cu mențiune canal.
- TC‑ND17: Rate limiting
  - Pași: depășește limitele de API intenționat.
  - Așteptat: 429 cu retry‑after; UI tratează elegant, fără retry agresiv.
- TC‑ND18: Reziliență la erori server
  - 5xx la diverse endpoint‑uri: UI afișează mesaje, permite retry, nu blochează alte funcții.
- TC‑ND19: Conectivitate slabă
  - Pași: simulează offline/timeout.
  - Așteptat: afișare stări offline; acțiuni critice dezactivate; reluare când revine rețeaua.
- TC‑ND20: Securitate API
  - CORS corect; fără token în query; header Authorization folosit.
  - Nicio informație sensibilă în erori; rel=noopener pe linkuri externe.
- TC‑ND21: Consistență date între pagini
  - Adăugare/ștergere în secțiunile membri/destinații/zone/trasee reflectată peste tot după răspuns API.
- TC‑ND22: Observabilitate
  - Logare client minimală; fără PII în console; corelare cu request‑id dacă serverul îl expune.
- TC‑ND23: Retenție date
  - Istoric 30 zile sau conform politicii; puncte vechi indisponibile după termen.
- TC‑ND24: Stabilitate sesiune
  - Persistență token la refresh; logout invalidează sesiunea.
- TC‑ND25: Compatibilitate
  - Test pe browsere suportate; layout și hărți funcționale.
