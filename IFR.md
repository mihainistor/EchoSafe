# Documentație Tehnică (IFR)

Acest document acoperă specificațiile funcționale și tehnice ale aplicației EchoSafe.

## 1. Context și Scop
- Scop: monitorizarea locației membrilor familiei (dispozitive), cu rute/destinații/zone, alerte și istorice.
- Actori:
  - Administrator (utilizator logat)
  - Membru (dispozitiv monitorizat)
  - Servicii Orange (Location, Reachability, SMS) — integrate prin adaptoare.

## 2. Stack Tehnologic
- Frontend: React 18, Vite, React Router, Leaflet (react-leaflet).
- Backend: Node.js (Express 4), JWT pentru auth, stocări în memorie pentru demo.

## 3. Funcționalități Cheie
- Autentificare: înregistrare, login, logout.
- Onboarding membru cu OTP (GDPR), listare, detalii, revocare.
- Localizare:
  - Status: stationary/on_route/off_route; Live Tracking temporar.
  - Istoric locații, heatmap în Time Machine.
- Alerte: check-in, deviație, no-go, inactivitate; setări de notificare în UI.

## 4. Modelare Domeniu (Frontend)
- Member: { id, label, msisdn, status, lastLocation, lastUpdated, live_tracking_mode, live_tracking_until }
- Destinații: per memberId.
- Zone No-Go: per memberId.
- Trasee: per memberId (smart/freehand).
- Alerte: { id, type, memberLabel, message, at }

## 5. API Backend (Rute Principale)

### Auth (/api/auth)
- POST /register — body: { email, password, msisdn_admin, first_name?, last_name? } → { token, user }
- POST /login — body: { email, password } → { token, user }
- POST /logout — header Authorization: Bearer <token> → { ok: true }

### Users (/api/users)
- GET /me — profilul utilizatorului curent (din token).
- PATCH /me — body: { email?, msisdn_admin?, first_name?, last_name?, notification_pref? }

### Devices (/api/devices)
- Protejate prin JWT; verificare ownership.
- POST / — body: { msisdn_target, label } → { device_id, status } + SMS OTP.
- POST /:id/validate-otp — body: { otp } → { device_id, status }.
- PATCH /:id — body: { label?, stationary_alert_enabled?, stationary_threshold_min?, safe_zone_destination_ids? } → device.
- DELETE /:id — revocă dispozitivul → { ok: true }.
- GET / — lista dispozitivelor pentru admin curent.
- GET /:id — detalii dispozitiv.
- GET /:id/location — locație curentă (demo fallback).
- GET /:id/location-history?from=&to= — istoric puncte (demo generator).
- GET /:id/reachability — status conectivitate (demo fallback).
- PATCH /:id/live-tracking — body: { enabled: boolean } → setează/poate opri automat după 10 min.

## 6. Fluxuri
- Onboarding OTP: FE → POST /devices → SMS OTP → FE → POST validate-otp → FE: GET /devices.
- Live Tracking: FE → PATCH live-tracking {enabled:true} → backend actualizează timerul.
- Histories: FE → GET location-history cu intervale → vizualizare points/routes.

## 7. Securitate
- JWT pe rutele protejate; middleware verifyToken.
- Verificare proprietar dispozitiv la fiecare operație.
- Consimțământ explicit prin OTP.

## 8. Configurare și Variabile de Mediu
- ORANGE_DEMO=true — activează răspunsuri demo pentru locație/reachability.
- Chei de integrare Orange — configurate în mediu (neincluse în repo).

## 9. Build & Rulare
- Frontend:
  - Dezvoltare: npm run dev (Vite).
  - Build: npm run build → dist/.
- Backend:
  - Dezvoltare: npm run dev (watch).
  - Producție: npm start.

## 10. Observabilitate
- Logging de bază în backend pentru fluxuri cheie (register/login).
- Poate fi extins cu Winston/Elastic APM.

## 11. Extensii Planificate
- Persistență DB (PostgreSQL), migrarea store-ului în memorie.
- Politici avansate pentru alerte și notificări.
- Rute reale pentru trasee (integrare Directions API).
