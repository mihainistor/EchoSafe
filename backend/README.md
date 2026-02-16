# EchoSafe — Backend

API server și arhitectura de date pentru EchoSafe.

## Schema bazei de date (PostgreSQL + PostGIS)

- `schema/01_extensions.sql` — PostGIS
- `schema/02_tables.sql` — Users, Monitored_Devices, Geofences, Routes, Location_History
- `schema/03_indexes.sql` — Indexuri pentru interogări rapide / hărți

Rulează în ordine pe o bază PostgreSQL (creată în prealabil).

## API (mod demo, fără DB)

```bash
cd backend
npm install
npm run dev
```

Server: `http://localhost:4000`

### Endpoints

| Metodă | URL | Descriere |
|--------|-----|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/devices?admin_id=...` | Listă device-uri pentru admin |
| GET | `/api/devices/:id` | Detalii device |
| GET | `/api/devices/:id/location` | Locație curentă (Orange Device Location Retrieval) |
| GET | `/api/devices/:id/reachability` | Status reachability (Orange Device Reachability Status: CONNECTED_DATA / CONNECTED_SMS / NOT_CONNECTED) |
| PATCH | `/api/devices/:id/live-tracking` | Body: `{ "enabled": true \| false }` — Live Tracking override; la `enabled: true` se setează auto-stop după 10 min |

## Flow Live Tracking

1. Frontend: utilizatorul apasă „Activează Live Tracking”.
2. Backend: `PATCH /api/devices/:id/live-tracking` cu `{ enabled: true }` → se setează `live_tracking_mode = TRUE` și `live_tracking_until = NOW() + 10 min`.
3. Worker (viitor): citește din DB device-urile cu `live_tracking_mode = TRUE` și interoghează Orange la 1 minut; dacă `NOW() > live_tracking_until`, resetează flag-ul. După expirare, frecvența revine la scenariile standard: pe traseu → 10 min; fără traseu → 5 min; în afara traseului → 1 min.
4. Frontend: buton „Prelungire 10 min” reapelează cu `enabled: true`; „Oprește Live” cu `enabled: false`.

## Integrare cu baza de date

Înlocuiește `src/store.js` cu un modul care folosește un client PostgreSQL (ex: `pg`) și mapează tabelele din `schema/`. Pentru PostGIS (geofences, routes, location_history) folosește funcții `ST_Contains`, `ST_DWithin` etc.
