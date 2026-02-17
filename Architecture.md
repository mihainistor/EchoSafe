# Arhitectura Aplicației — EchoSafe

Acest document prezintă arhitectura completă a aplicației EchoSafe (frontend + backend), fluxurile critice, modelele de date, integrarea cu servicii externe, strategiile de securitate/performanță și planul de extensibilitate. Documentul reflectă starea curentă a codului și testelor din repository.

## 1. Viziune și Obiective
- Domeniu: monitorizare familie (copii), localizare și siguranță (trasee, zone No‑Go, alerte, istoric).
- Platformă: aplicație web compusă din frontend React (Vite) și backend Node.js (Express).
- Moduri de funcționare:
  - Demo ON — date sintetice și fluxuri simulate pentru testare rapidă.
  - Non‑demo — consum de API real (conectare viitoare la Orange CAMARA pentru locație/reachability).

Diagrame logice (textual):

```
[Browser] --HTTP--> [Frontend (Vite/React)] --/api (proxy)--> [Backend (Express)]
                                                     |-> [Orange APIs*] (viitor)
                                                     |-> [DB*] (PostgreSQL + PostGIS, viitor)
```

## 2. Tehnologii și Principii
- Frontend: React 18, React Router 6, Vite 5, Leaflet (react‑leaflet).
- Backend: Node.js 18+, Express 4, CORS, JSON REST, Prometheus metrics.
- Principii:
  - Separation of concerns (UI, state, API).
  - Defensive programming pe clienții HTTP; fallback în demo.
  - Securitate JWT pentru rutele protejate; Bearer în OpenAPI.
  - Configurabilitate prin variabile de mediu.
  - Testare e2e cu Playwright pentru scenarii cheie.

## 3. Frontend

### 3.1. Organizare
- Punct intrare: [main.jsx](file:///d:/SafeKidAPP/frontend/src/main.jsx)
- Router + layout: [App.jsx](file:///d:/SafeKidAPP/frontend/src/App.jsx), [Layout.jsx](file:///d:/SafeKidAPP/frontend/src/components/Layout.jsx), [Header.jsx](file:///d:/SafeKidAPP/frontend/src/components/Header.jsx)
- Context global: [AppContext.jsx](file:///d:/SafeKidAPP/frontend/src/context/AppContext.jsx)
- Pagini principale:
  - Dashboard: [Dashboard.jsx](file:///d:/SafeKidAPP/frontend/src/pages/Dashboard.jsx) (dacă există) / shell
  - Membri: listă/detaliu/adăugare — [MemberList.jsx](file:///d:/SafeKidAPP/frontend/src/pages/member/MemberList.jsx), [MemberDetail.jsx](file:///d:/SafeKidAPP/frontend/src/pages/member/MemberDetail.jsx), [AddMember.jsx](file:///d:/SafeKidAPP/frontend/src/pages/member/AddMember.jsx)
  - Istoric Locație: [TimeMachine.jsx](file:///d:/SafeKidAPP/frontend/src/pages/TimeMachine.jsx)
  - Alerte: [Alerts.jsx](file:///d:/SafeKidAPP/frontend/src/pages/Alerts.jsx)
  - Profil: [Profile.jsx](file:///d:/SafeKidAPP/frontend/src/pages/Profile.jsx)
- Componente cheie: [RouteBuilder.jsx](file:///d:/SafeKidAPP/frontend/src/components/RouteBuilder.jsx), LiveMap, AddressAutocomplete etc.

### 3.2. Rute & Navigație
- Rute publice: `/`, `/login`, `/register`, reset‑password etc.
- Rute protejate (via [ProtectedRoute.jsx](file:///d:/SafeKidAPP/frontend/src/components/ProtectedRoute.jsx)):
  - `/dashboard`, `/dashboard/member`, `/dashboard/member/:id`
  - `/dashboard/time-machine`, `/dashboard/alerts`, `/dashboard/profile`
- Protecție: verifică `auth_token` din localStorage înainte de a permite accesul.

### 3.3. State Management (AppContext)
- Surse de adevăr pentru: utilizator curent, `linkedMembers`, `alerts`, `destinations`, `noGoZones`, `routes`, `alertTypes`, setări de inactivitate, notificări.
- Integrare API: la autentificare și în non‑demo, sincronizează cu backend (ex. `listDevices()`).
- Demo mode: controlat prin `localStorage.demo_mode === '1'` (reflectat în header). Datele demo sunt generate la inițializare.

Chei de stat exemplu (extrase din [AppContext.jsx](file:///d:/SafeKidAPP/frontend/src/context/AppContext.jsx)):
- `linkedMembers`: lista dispozitivelor/membrilor.
- `routes`: rute smart/free‑hand per membru, cu alocare multi‑membru.
- `alertTypes`: toggles pentru no‑go/deviation.
- `inactivityAlert`: activare + minute + safe zones.
- `setLiveTrackingState`: actualizează live_on și `live_tracking_until`.

### 3.4. API Client și Mod Demo
- Clienți HTTP: [auth.js](file:///d:/SafeKidAPP/frontend/src/api/auth.js), [client.js](file:///d:/SafeKidAPP/frontend/src/api/client.js)
- Bază URL: `import.meta.env.VITE_API_URL` sau proxy Vite pentru `/api` (vezi [vite.config.js](file:///d:/SafeKidAPP/frontend/vite.config.js)).
- Fallback demo: dacă demo ON, metode precum `getDeviceLocation`, `getDeviceLocationHistory` returnează date sintetice (inclusiv rute și puncte).

Notă validare număr telefon membru:
- Formularul “Adaugă membru” validează pattern 07[0-9]{8} și normalizează inputul la cifre; serverul curăță non‑numerice și validează tolerant E.164.
- Fișier: [AddMember.jsx](file:///d:/SafeKidAPP/frontend/src/pages/member/AddMember.jsx).

### 3.5. Funcționalități majore UI

#### 3.5.1. Membri (Listă & Detaliu)
- Listă: avatar inițial, status (on_route/off_route/stationary), acțiuni (vezi, șterge).
- Detaliu membru:
  - Live Tracking: buton “Live/Oprește” + badge “LIVE” și contor MM:SS; apel PATCH la backend; auto‑stop la 10 min.
  - Locație curentă: actualizare manuală + badge reachability (Data/SMS/Necunoscut) cu sursă Orange (simulată în demo).
  - Destinații: CRUD local (demo), legate de alerte de inactivitate.
  - Zone No‑Go: CRUD local (demo).
  - Trasee: listare + ștergere + form Adaugă (Smart/Free‑hand) via [RouteBuilder.jsx](file:///d:/SafeKidAPP/frontend/src/components/RouteBuilder.jsx).
  - Configurare alerte: toggles no‑go / deviație + “Staționare prelungită” cu selecție minute și Safe Zones.

#### 3.5.2. RouteBuilder — Smart & Free‑hand
- Smart Path:
  - Introducere adresă plecare/destinație, selecție transport, zile + interval orar.
  - “Calculează traseu” (simulat), apoi “Salvează”; salvarea atașează ruta unuia sau mai multor membri.
  - Estimare ETA/distanță (simulată) și previzualizare pe hartă.
- Desenare manuală (free‑hand):
  - Adăugare puncte prin click; mutare prin drag&drop; ștergere ultim punct prin contextmenu.
  - Calcul distanță și ETA in‑line în funcție de transport.
  - Salvare ca rută cu “buffer/coridor”, zile/interval; alocare multi‑membru.

#### 3.5.3. Time Machine — Redare & Heatmap
- Redare traseu pe interval orar:
  - Preia punctele/rutele din API client; desenează polilinii colorate; permite selectarea unei rute din tabel.
  - Export CSV din interfață pentru punctele redate.
- Heatmap:
  - Binning simplu (agregare în celule ~0.001°) cu greutăți normalizate.
  - Rază cerc fixă 40 m per celulă; afișează badge “Heatmap demo” în modul demo.

### 3.6. Configurare Build/Dev
- [package.json](file:///d:/SafeKidAPP/frontend/package.json) — scripturi `dev`, `build`, `preview` și test e2e (`test:e2e`).
- [vite.config.js](file:///d:/SafeKidAPP/frontend/vite.config.js) — server dev pe port 3006, `strictPort: true`, proxy `/api` → `http://localhost:4000`.
- Servire statică: backend servește `frontend/dist` dacă există build.

### 3.7. Testare (E2E)
- Playwright:
  - Config: [playwright.config.js](file:///d:/SafeKidAPP/frontend/playwright.config.js) — baseURL 3006, reuseExistingServer, proiect chromium.
  - Suite: [tests/e2e.spec.js](file:///d:/SafeKidAPP/frontend/tests/e2e.spec.js) — acoperă Heatmap, Redare, Alerte, Header, Live + contor, Free‑hand, Config staționare, Export CSV.
  - Setări: activează Demo ON și injectează `auth_token` în localStorage pentru rute protejate.
- Cazuri de test centralizate: [TestCases.md](file:///d:/SafeKidAPP/TestCases.md). Rezultate: [TestingResults.md](file:///d:/SafeKidAPP/TestingResults.md).

## 4. Backend

### 4.1. Organizare
- Entry: [src/index.js](file:///d:/SafeKidAPP/backend/src/index.js)
- Layere:
  - Routes → Controllers → Services → Repositories → DB
  - Controllers:
    - Devices: [controllers/devicesController.js](file:///d:/SafeKidAPP/backend/src/controllers/devicesController.js)
    - Users: [controllers/usersController.js](file:///d:/SafeKidAPP/backend/src/controllers/usersController.js)
  - Services:
    - Orange Location: [services/orangeLocationService.js](file:///d:/SafeKidAPP/backend/src/services/orangeLocationService.js)
    - Orange Reachability: [services/orangeReachabilityService.js](file:///d:/SafeKidAPP/backend/src/services/orangeReachabilityService.js)
  - Repositories:
    - Users/Devices: [repositories](file:///d:/SafeKidAPP/backend/src/repositories)
    - OTP Audit: [repositories/auditRepo.js](file:///d:/SafeKidAPP/backend/src/repositories/auditRepo.js)
  - DB & Migrații: [db/index.js](file:///d:/SafeKidAPP/backend/src/db/index.js)
- Rute:
  - `/api/auth` — register/login.
  - `/api/users` — profil (me) GET/PATCH.
  - `/api/devices` — listare (cu X‑Total‑Count), detalii, onboarding + validare OTP, location, reachability, location‑history, live‑tracking.
- Dev helpers:
  - `/api/dev/start-vite` — pornește Vite dev server pe 3006.
  - `/api/dev/build-frontend` — build Vite programatic.

### 4.2. Mod Demo vs. Real
- Demo:
  - Store in‑memory pentru users/devices/live‑timers.
  - Răspunsuri sintetice pentru locație/reachability/istoric (ex. vezi `getDeviceLocationHistory()` pe frontend‑client în demo).
- Real (viitor):
  - Integrare cu Orange CAMARA:
    - Device Location Retrieval (v0.3)
    - Device Reachability Status (v0.6)
  - Persistență: PostgreSQL; fallback la in‑memory dacă lipsește `DATABASE_URL`.
  - OTP Audit: persistat în tabel dedicat `otp_audit` (vezi §4.6).

### 4.3. Endpoints relevante (rezumat)
- Auth:
  - `POST /api/auth/register`, `POST /api/auth/login` → JWT.
- Users:
  - `GET /api/users/me`, `PATCH /api/users/me`.
- Devices:
  - `GET /api/devices` — listare (X‑Total‑Count, sortare stabilă).
  - `GET /api/devices/:id` — detalii.
  - `POST /api/devices` — onboarding (msisdn, label) + trimitere OTP.
  - `POST /api/devices/:id/validate-otp` — validează codul.
  - `GET /api/devices/:id/location` — locație curentă.
  - `GET /api/devices/:id/reachability` — reachability.
  - `GET /api/devices/:id/location-history` — istoric.
  - `PATCH /api/devices/:id/live-tracking` — `{ enabled: boolean }`, setează `live_tracking_until = now + 10 min` la activare.

### 4.4. Config integrare Orange
- Chei/Headers: vezi [src/config/README.md](file:///d:/SafeKidAPP/backend/src/config/README.md) — `Authorization: Basic <client_id:client_secret>` + `apiKeyHeader: <ORANGE_APPLICATION_KEY>`.
- Base URL-uri Playground:
  - Location Retrieval v0.3
  - Reachability Status v0.6

Timeout & corelare:
- Timeout cu `AbortController` (implicit 10s, `ORANGE_TIMEOUT_MS`).
- Corelare cu `x-correlator` și log JSON la request/ok/eroare.

Metrici Orange:
- `echosafe_orange_errors_total{api,code}`
- `echosafe_orange_request_duration_seconds{api,status}`

### 4.5. Servire Frontend Build
- Dacă există `frontend/dist/index.html`, backend servește static UI pe orice rută non‑/api.

### 4.6. Persistență și Migrații
- `runMigrations()` creează tabelele de bază (users, devices) și `otp_audit`.
- Opțional, rulează toate fișierele `.sql` din `backend/schema` dacă `RUN_SCHEMA_SQL=1`.
- OTP audit:
  - Repo: [repositories/auditRepo.js](file:///d:/SafeKidAPP/backend/src/repositories/auditRepo.js)
  - Înregistrări la `otp/request`, `otp/resend`, `otp/verify` (ok/fail), cu fallback in‑memory fără DB.

### 4.7. Validări & Paginare
- Query params:
  - `maxAge` (location) — întreg 0..86400, 400 pe invalid.
  - `from`/`to` (location‑history) — ISO 8601, 400 pe invalid.
- Paginare devices: `limit`, `offset` și header `X‑Total‑Count`; sortare stabilă după `created_at desc`.

### 4.8. Rate Limiting
- Global: limiter IP pe prefix `/api` cu metrica `echosafe_rate_limit_hits_total{scope}`.
- Dedicat Orange: middleware `rateLimit(windowMs, max, scope)` pe rutele:
  - `GET /api/devices/:id/location` (scope: `orange_location`)
  - `GET /api/devices/:id/location-history` (scope: `orange_location_history`)
- Include header `Retry‑After` la 429.

### 4.9. Observabilitate (server)
- Endpoint Prometheus: `/metrics`.
- Metrici:
  - `echosafe_http_requests_total{method,route,code}`
  - `echosafe_http_request_duration_seconds{method,route,code}`
  - `echosafe_rate_limit_hits_total{scope}`
  - Metricile Orange (§4.4).
- Health: `/api/health` (include mod `db`/`memory` și build info), `/api/ready`.

### 4.10. Logging structurat
- Logger JSON simplu: [utils/logger.js](file:///d:/SafeKidAPP/backend/src/utils/logger.js)
- Corelare request:
  - Middleware setează `X‑Request‑Id` pentru fiecare cerere.
  - Handler erori: log JSON cu `req_id`, `route`, `code`.
  - Servicii Orange: log la request/ok/eroare cu `correlator`.

### 4.11. Securitate API & OpenAPI
- OpenAPI:
  - `components.securitySchemes.BearerAuth` (JWT).
  - `security` aplicat pe `/api/users` și `/api/devices`.
  - `components.schemas.Error` standard pentru răspunsuri de eroare.
- Fail‑fast în producție:
  - Lipsă `DATABASE_URL` → procesul iese.
  - `AUTH_SECRET` lipsă sau default → procesul iese.
- CORS: allow‑list de origini configurabil; antete de securitate setate default.

## 5. Modele de Date (plan pentru producție)
- Users (admin), Monitored_Devices, Geofences (No‑Go/Safe Zones), Routes (smart/free‑hand), Location_History.
- Indexare spațială (PostGIS) pentru interogări rapide (heatmap, deviatii, proximitate).
- Evenimente/Alerte persistente (istoric) pentru raportare.

## 6. Securitate
- Autentificare: JWT, stocat în localStorage pe frontend; `ProtectedRoute` blochează rutele securizate dacă lipsesc credențiale.
- CORS permis pentru dev; în producție se restricționează origin‑urile.
- Validări ownership la resursele device‑urilor.
- Protecție XSS: randare controlată a textului în alerte; linkurile folosesc `rel="noopener"`.
- Fără logare de secrete; variabile sensibile în `.env` (nepăstrate în repo).
 - Fail‑fast: verificări stricte la start pentru `AUTH_SECRET`/`DATABASE_URL`.

## 7. Observabilitate
- Prometheus `/metrics` cu metricle enumerate în §4.9.
- Logging JSON cu `req.id` și corelare Orange.
- Extensii recomandate: OpenTelemetry, dashboard pentru rate de eroare, latențe și trafic.

## 8. Performanță
- Frontend:
  - Hărți Leaflet optimizate (polilinii eficiente; renunțare la slider heatmap; rază fixă 40m).
  - UI reactiv cu React hooks și CSS modules (z‑index fix pentru header).
  - Export CSV generat client‑side fără roundtrip suplimentar.
- Backend: timeouts pentru apeluri externe; paginare, rate‑limiting dedicat, sortare stabilă.
- Viitor: caching la layerul de istoric/heatmap; streaming WebSocket pentru live; offload calcule trasee.

## 9. Build & Deploy
- Frontend:
  - Dev: `npm run dev` (port 3006).
  - Prod: `npm run build` → `dist/`; servire statică via backend sau server static.
- Backend:
  - Dev: `npm run dev` (watch), port 4000, health: `/api/health`.
  - Prod: `npm start`.
- Config: `VITE_API_URL` (frontend), chei Orange, `ORANGE_TIMEOUT_MS`, `ORANGE_DEMO`, `AUTH_SECRET`, `RUN_SCHEMA_SQL` (backend).

## 10. Testare
- Teste e2e Playwright (Chromium headless), configurate în [playwright.config.js](file:///d:/SafeKidAPP/frontend/playwright.config.js).
- Rulare: `npx playwright test --project=chromium --reporter=list`.
- Raportare:
  - Scenarii: [TestCases.md](file:///d:/SafeKidAPP/TestCases.md)
  - Rezultate: [TestingResults.md](file:///d:/SafeKidAPP/TestingResults.md)

## 11. I18n & Accesibilitate
- Locale principală: ro‑RO (formatare dată/oră).
- Elemente UI etichetate și texte clare; focus vizibil; testare manuală recomandată pentru tab‑navigation.

## 12. Extensibilitate (Roadmap)
- Persistență completă în PostgreSQL + PostGIS (migrări în `backend/schema/`).
- Integrare reală Orange CAMARA + worker pentru ingestia datelor în DB.
- Rules engine pentru alerte (deviere, staționare, no‑go) și notificări (push/SMS).
- WebSocket pentru live tracking “push” + reconcilieri cu polling.
- Observabilitate avansată și panouri de analiză.

—
Document elaborat pe baza codului sursă curent și a testelor e2e integrate.
