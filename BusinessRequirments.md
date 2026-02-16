# Cerințe de Business — EchoSafe

Document complex de business pentru aplicația EchoSafe. Definește context, scop, actori, procese, cerințe funcționale și nefuncționale, criterii de acceptare, riscuri, metrici și roadmap. Acest document ghidează analiza, designul și implementarea, precum și alinierea cu stakeholderii.

## 1. Viziune & Obiective
- Viziune: Oferă părinților/tutorilor o aplicație de siguranță familială pentru a monitoriza non-invaziv deplasările copiilor, cu alerte inteligente, istorice și vizualizări intuitive.
- Obiective strategice:
  - Siguranță proactivă: detectarea deviațiilor și a staționării prelungite în contexte nesigure.
  - Transparență & control: configurarea ușoară a rutelor, zonelor și alertelor.
  - Confidențialitate: prelucrare minimă a datelor, controlul retenției, consimțământ parental.
  - Extensibilitate: integrare cu Orange CAMARA pentru locație/reachability, scalabilitate pentru noi servicii.

## 2. Context & Stakeholderi
- Stakeholderi primari: părinți/tutori (utilizatori), copii (subiecți monitorizare).
- Stakeholderi secundari: operator telecom (Orange), echipa produs (PM, design, dev, QA), echipa legal/compliance (GDPR), suport clienți.
- Constrângeri: conformitate GDPR, calitatea semnalului mobil, disponibilitatea API‑urilor Orange, acuratețea geolocației.

## 3. Personas
- Părinte urban, 35–45 ani: program încărcat, vrea alerte simple și acțiuni rapide.
- Părinte suburban, 30–40 ani: folosește preponderent mobil; interesat de rute către școală/activități.
- Tutore/bonă: acces limitat; primește alerte relevante.

## 4. Domeniu & Scop
- In scope (MVP avansat):
  - Autentificare, gestionare cont, onboarding dispozitiv cu OTP.
  - Membri/dispozitive și status (locație/ reachability).
  - Rute smart și free‑hand; zone No‑Go și Safe Zones.
  - Alerte: no‑go (enter/exit), deviație de rută, staționare prelungită.
  - Time Machine: redare istoric, Heatmap, export CSV.
  - Demo Mode: date sintetice pentru prezentări/teste.
- Out of scope (current):
  - Tracking în background cu aplicație mobilă dedicată.
  - Notificări push/SMS în producție (planificate).
  - Persistență completă în DB (roadmap).

## 5. Glosar
- Membru: copil/dispozitiv monitorizat, asociat unui cont părinte.
- Rută Smart: drum calculat între puncte, cu parametri (zile/ore/transport).
- Rută Free‑hand: traseu desenat manual.
- No‑Go Zone: poligon interzis; intrarea/ieșirea declanșează alerte.
- Safe Zone: zone considerate în regulă pentru staționare.
- Deviație: punct live în afara coridorului (buffer) rutei curente.
- Staționare prelungită: lipsă mișcare peste un prag configurat.
- Reachability: starea de comunicare a dispozitivului (Data/SMS/Unknown).

## 6. KPI & Metrici
- North‑Star: procent rute parcurse fără incidente nejustificate.
- KPI:
  - Timp mediu de livrare alertă < 5 sec (non‑demo, când integrat).
  - Rate de fals pozitiv pentru deviație < 5% (cu buffer configurat).
  - Latenta de încărcare Time Machine < 2s pentru 5k puncte.
  - Retenție date conform politicilor (ex. 30 zile default; configurabil).

## 7. Prezentare Funcționalități
- Cont & autentificare (login/register/reset/change).
- Onboarding dispozitiv cu OTP (prin SMS).
- Membri & dispozitive (listă, detaliu, ștergere).
- Locație curentă & reachability; live tracking cu auto‑stop 10m.
- Rute (smart/free‑hand), alocare multi‑membru, ETA/distanță.
- Zone (No‑Go, Safe); matrice alerte.
- Alerte inteligente: deviație, no‑go enter/exit, staționare.
- Time Machine: redare, heatmap, export CSV.
- Profil: notificări, preferințe.
- Demo Mode.

## 8. Cerințe Funcționale (detaliu)

### 8.1. Autentificare & Cont
- FR‑AUTH‑1: Utilizatorul se poate înregistra cu email/parolă; parolă complexă.
- FR‑AUTH‑2: Autentificare cu JWT; sesiunea persistă între vizite (localStorage).
- FR‑AUTH‑3: Recuperare parolă (forgot/reset) cu token temporar (exp. 15–60 min).
- FR‑AUTH‑4: Schimbare parolă la autentificat cu verificare parolă curentă.
- FR‑AUTH‑5: Logout curăță tokenul și invalidează accesul la rute protejate.

Acceptanță:
- Email invalid → mesaj clar; parole nepotrivite → eroare.
- La succes → redirect la Dashboard.

### 8.2. Onboarding Dispozitiv (OTP)
- FR‑ONB‑1: Creare dispozitiv cu msisdn_target și etichetă.
- FR‑ONB‑2: Trimitere OTP via SMS (non‑demo, viitor); demo validează local.
- FR‑ONB‑3: Validare OTP asociat device‑ului.
- FR‑ONB‑4: După validare, dispozitivul apare în listă.

Acceptanță:
- OTP invalid → eroare; re‑trimitere permisă cu rate limit.

### 8.3. Membri & Dispozitive
- FR‑MEM‑1: Listă membri cu status (on_route/off_route/stationary) și reachability.
- FR‑MEM‑2: Detaliu membru cu acțiuni Live, locație curentă, rute, zone, alerte.
- FR‑MEM‑3: Ștergere membru cu confirmare.

### 8.4. Locație curentă & Reachability
- FR‑LOC‑1: Interogare locație curentă (lat, lng, accuracy, ts).
- FR‑LOC‑2: Reachability (CONNECTED_DATA / CONNECTED_SMS / UNKNOWN).
- FR‑LOC‑3: maxAge opțional pentru cache.

### 8.5. Live Tracking
- FR‑LIVE‑1: Activare live; setează live_tracking_until = now + 10m.
- FR‑LIVE‑2: Contor vizibil MM:SS; badge LIVE în header.
- FR‑LIVE‑3: Oprire manuală sau auto‑stop la expirare.

### 8.6. Rute (Smart & Free‑hand)
- FR‑ROUTE‑1: Rută Smart — introducere adrese, mod transport, zile/interval; previzualizare; salvare.
- FR‑ROUTE‑2: Free‑hand — adăugare/mutare puncte, undo/redo; calcul distanță/ETA; salvare.
- FR‑ROUTE‑3: Alocare rută la unul sau mai mulți membri.
- FR‑ROUTE‑4: Editare și ștergere rută; realocare.

### 8.7. Zone (No‑Go, Safe)
- FR‑ZONE‑1: CRUD No‑Go (poligon) și Safe Zones.
- FR‑ZONE‑2: Safe Zones folosite de alerta de staționare pentru excluderi.

### 8.8. Alerte
- FR‑ALERT‑1: No‑Go enter/exit — la intrarea/ieșirea într‑o zonă interzisă.
- FR‑ALERT‑2: Deviație — punct live în afara coridorului rutei (> threshold).
- FR‑ALERT‑3: Staționare — lipsă mișcare >= X minute, excluzând Safe Zones.
- FR‑ALERT‑4: Configurări per membru: toggles no‑go/deviație; staționare (enable, minute, safe zones).
- FR‑ALERT‑5: Istoric alerte cu filtrare (tip, interval).

### 8.9. Time Machine
- FR‑TM‑1: Selectare membru + interval; redare traseu (polilinii/puncte) cu controale (play/pause/seek/viteză).
- FR‑TM‑2: Heatmap: încărcare istoric și agregare; demo local, non‑demo server (roadmap).
- FR‑TM‑3: Export CSV al punctelor redate.

### 8.10. Profil & Notificări
- FR‑PRF‑1: Editare email, msisdn, preferințe notificări.
- FR‑PRF‑2: Schimbare parolă autenticat.
- FR‑PRF‑3: Suspendare/Ștergere cont (confirmări explicite).

### 8.11. Demo Mode
- FR‑DEMO‑1: Activabil din UI; populatează clienții cu date sintetice.
- FR‑DEMO‑2: Marcaje vizuale (“Demo”) în ecrane relevante.

## 9. Cerințe Nefuncționale
- Securitate & Privacy:
  - JWT Bearer; transport TLS.
  - Minimization: colectează doar date necesare (locație puncte, meta).
  - Retenție: default 30 zile istoric (configurabil); opțiuni ștergere.
  - Drepturi persoană vizată: acces, rectificare, ștergere; consimțământ parental.
  - Logging acces date sensibile; fără expunere chei în UI/loguri.
- Performanță & Scalabilitate:
  - Timp încărcare UI < 2s pentru 5k puncte; randare mapă fluentă.
  - Endpoints principale median < 300ms (non‑demo, fără rețele externe).
  - Scalabilitate orizontală backend; caching la istorice/analytics.
- Disponibilitate:
  - 99.5% uptime (target) pentru API public; health checks.
- Observabilitate:
  - Logs structurale, corelare request‑id; metrici (rate, latențe, erori).
  - Traces (OpenTelemetry) — roadmap.
- UX & A11y:
  - Navigare tastatură; contrast adecvat; etichete aria pentru controale.
- i18n:
  - ro‑RO ca limbă principală; extensibil pentru locale viitoare.
- Compatibilitate:
  - Browsere evergreen (Chromium, Firefox, Safari); viewport desktop + mobile.

## 10. Constrângeri & Asumții
- Integrarea cu Orange CAMARA depinde de chei valide, rate limit și SLA extern.
- Mapare geospațială folosind OSM/Leaflet; acuratețe variabilă.
- Demo Mode nu reprezintă date reale; nu se amestecă cu producție.

## 11. Dependențe Externe
- Orange CAMARA: Location Retrieval, Reachability Status.
- SMS Provider: trimitere OTP (non‑demo).
- Servicii geocoding (viitor) pentru adrese (Nominatim/Mapbox).

## 12. Riscuri & Mitigări
- R1: Locații inexacte → buffer dinamic, filtrare zgomot (smoothing).
- R2: Rate limit Orange → backoff + cozi retry.
- R3: GDPR neconform → revizuire legal, politici clare retenție/consimțământ.
- R4: Fals pozitive alerte → calibrare praguri, feedback utilizator.

## 13. Roadmap & Feature Flags
- F1: Persistență PostgreSQL + PostGIS pentru istoric/analytics.
- F2: Notificări push/SMS end‑to‑end.
- F3: Heatmap server-side, export PDF rapoarte.
- Feature flags: Demo Mode, Heatmap server, Push/SMS.

## 14. Criterii de Acceptare (rezumat)
- CA‑AUTH: fluxuri login/register/reset funcționale cu mesaje clare.
- CA‑LIVE: buton Live pornește, badge + contor vizibile; auto‑stop ~10m.
- CA‑ROUTE: creare smart/free‑hand, alocare multi‑membru; editare și ștergere.
- CA‑ALERT: generare no‑go/deviație/staționare conform configurației; afișare în istoric.
- CA‑TM: redare traseu fluidă; export CSV conține puncte corecte; heatmap vizibilă.

## 15. Trasabilitate (Features ↔ UI ↔ API)
- Autentificare: UI Login/Register → /api/auth/*.
- Membri: MemberList/Detail → /api/devices/*.
- Live: MemberDetail → PATCH /api/devices/{id}/live-tracking.
- Locație/Reachability: MemberDetail → GET /api/devices/{id}/location|reachability.
- Istoric: TimeMachine → GET /api/devices/{id}/location-history.
- Alerte: Alerts → GET /api/alerts.
- Analytics (viitor): Heatmap → GET /api/analytics/heatmap.

## 16. Politici de Date
- Retenție: 30 zile implicit; configurabil per cont (roadmap).
- Export: CSV din UI; export JSON/PDF (roadmap).
- Ștergere: la ștergere cont, anonimizare sau purge complet (config legal).

## 17. Raportare & Export
- CSV pentru istorice (UI).
- Rapoarte PDF lunare (roadmap).

## 18. User Stories (MoSCoW)
- Must:
  - Ca părinte, vreau să pornesc live tracking pentru un membru și să văd un contor vizibil.
  - Ca părinte, vreau să definesc rute smart/free‑hand și să fiu alertat la deviații.
  - Ca părinte, vreau să definesc No‑Go și Safe Zones și să primesc alerte relevante.
  - Ca părinte, vreau să văd istoricul deplasărilor și să export CSV.
- Should:
  - Ca părinte, vreau heatmap agregată pentru perioade lungi.
  - Ca părinte, vreau să realoc rute către mai mulți membri.
- Could:
  - Notificări push/SMS configurabile.
  - Raportare PDF periodică.
- Won’t (acum):
  - Aplicație mobilă nativă cu tracking continuu în background.

—
Acest document este “source of truth” pentru cerințele de business și va fi menținut sincron cu [Architecture.md](file:///d:/SafeKidAPP/Architecture.md), [DiagramsUML.md](file:///d:/SafeKidAPP/DiagramsUML.md) și [ApiSwagger.md](file:///d:/SafeKidAPP/ApiSwagger.md).
