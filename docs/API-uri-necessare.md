# API-uri necesare — EchoSafe

Lista API-urilor de implementat: **backend propriu (EchoSafe API)** și **API-uri externe** (Orange, Google, Push).

---

## 1. API-uri backend propriu (EchoSafe API)

### Autentificare și utilizatori

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/auth/register` | Înregistrare: email, parolă, msisdn_admin → creează user, returnează token/session |
| POST | `/api/auth/login` | Login: email+parolă sau MSISDN+OTP → returnează token și user_id |
| POST | `/api/auth/logout` | Invalidare session/token |
| GET | `/api/users/me` | Profil utilizator curent (user_id, msisdn_admin, email, notification_pref) |
| PATCH | `/api/users/me` | Actualizare profil și/sau `notification_pref` (Push/SMS on-off) |

---

### Dispozitive monitorizate (copii)

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/devices` | Listă device-uri pentru user curent (admin_id din token) — **existent** |
| GET | `/api/devices/:id` | Detalii device (inclusiv live_tracking_mode, stationary_*) — **existent** |
| PATCH | `/api/devices/:id/live-tracking` | Body: `{ "enabled": true \| false }` — **existent** |
| POST | `/api/devices` | **De adăugat:** Începe onboarding — body: `{ "msisdn_target", "label" }` → generează OTP, trimite SMS (via Orange), returnează `device_id` cu status PENDING |
| POST | `/api/devices/:id/validate-otp` | **De adăugat:** Body: `{ "otp": "123456" }` → validează OTP, setează gdpr_status ACTIVE, creează legătura |
| PATCH | `/api/devices/:id` | **De adăugat:** Actualizare label, stationary_alert_enabled, stationary_threshold_min, safe_zone_destination_ids (pentru excepție inactivity) |
| DELETE | `/api/devices/:id` | **De adăugat:** Revocare legătură (gdpr_status = REVOKED sau ștergere soft) |

---

### Geofences (destinații, zone No-Go, Safe Zones)

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/devices/:deviceId/geofences` | **De adăugat:** Listă geofences pentru device (tip: DESTINATION, NO_GO_*, SAFE_ZONE) |
| POST | `/api/devices/:deviceId/geofences` | **De adăugat:** Creare geofence — body: type, label, shape (polygon/centru+rază), active_from, active_until (pentru temporare/adhoc) |
| PATCH | `/api/geofences/:fenceId` | **De adăugat:** Editare zonă |
| DELETE | `/api/geofences/:fenceId` | **De adăugat:** Ștergere zonă |

---

### Trasee (routes)

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/devices/:deviceId/routes` | **De adăugat:** Listă trasee pentru device |
| POST | `/api/devices/:deviceId/routes` | **De adăugat:** Creare traseu — body: transport_mode, route_path (LineString sau puncte), buffer_meters, name, day_of_week, start_time, end_time. Poate apela intern Google Directions API pentru Smart Path |
| PATCH | `/api/routes/:routeId` | **De adăugat:** Editare (ex: is_active) |
| DELETE | `/api/routes/:routeId` | **De adăugat:** Ștergere traseu |

---

### Locație și istoric

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/devices/:deviceId/location` | **De adăugat:** Ultima locație cunoscută (pentru hartă în timp real) — citit din Location_History sau cache |
| GET | `/api/devices/:deviceId/location-history` | **De adăugat:** Istoric pentru Time Machine — query: `from`, `to` (date/ISO), opțional `limit`. Returnează puncte (lat, lng, timestamp, is_on_route) pentru Redare traseu |
| GET | `/api/devices/:deviceId/location-history/heatmap` | **De adăugat:** Agregare pentru heatmap (zone frecventate în ultimele N zile) — poate returna grid sau puncte agregate |

*Notă: scrierea în `location_history` se face din **Worker** (după ce primește locația de la Orange), nu direct din aplicația web.*

---

### Alerte

| Metodă | Endpoint | Descriere |
|--------|----------|-----------|
| GET | `/api/alerts` | **De adăugat:** Istoric alerte pentru user curent — query: device_id opțional, limit, offset. Returnează tip (check_in, deviation, no_go, inactivity), mesaj, timestamp |
| POST | `/api/alerts` | **De adăugat:** (Opțional) Pentru testare: inserare alertă manuală. În producție alertele sunt create de **Service Alerte** după analiza geospațială |

---

## 2. API-uri externe (terți)

### Orange (Romania)

| API | Rol | Ce face |
|-----|-----|--------|
| **Device Location Retrieval** | Locație GSM | Worker-ul îl apelează periodic (1/5/10 min sau 15–30 s la Live) cu MSISDN-ul copilului; returnează coordonate (lat/lng). Necesar pentru toată logica de traseu, geofences, alerte. |
| **SMS Gateway** | Trimite SMS | 1) SMS cu OTP la onboarding („Codul tău de activare: [OTP]”). 2) Alerte SMS: No-Go (prioritar), Părăsire traseu, fallback când utilizatorul nu are internet. |

*Documentație / acces: Orange Developer (contract, API key / OAuth).*

---

### Routing (traseu optim)

| API | Rol | Ce face |
|-----|-----|--------|
| **Google Directions API** (sau alternativ: OpenRouteService, HERE) | Smart Path | La „Calculează traseu”: punct plecare + destinație + mijloc transport (pedestrian, bicycle, transit, car) → returnează polyline/puncte pentru `route_path` și afișare pe hartă. |

*Google: necesită API key, facturare după utilizare.*

---

### Notificări Push

| API / Serviciu | Rol | Ce face |
|----------------|-----|--------|
| **Firebase Cloud Messaging (FCM)** sau **Apple Push Notification service (APNS)** | Push | Service Alerte trimite notificări: Check-in, Părăsire traseu, Staționare. Frontend/App înregistrează device token; backend salvează token per user și trimite payload (titlu, mesaj, link). |

---

## 3. Rezumat pe categorii

| Categorie | API-uri de adăugat (backend propriu) | API-uri externe |
|-----------|--------------------------------------|-----------------|
| **Auth** | register, login, logout, users/me (GET/PATCH) | — |
| **Devices** | POST (onboarding), validate-otp, PATCH device, DELETE device | Orange SMS (OTP) |
| **Geofences** | CRUD pe /devices/:id/geofences și /geofences/:id | — |
| **Routes** | CRUD pe /devices/:id/routes și /routes/:id | Google Directions (sau alt routing) |
| **Location** | GET location, GET location-history, GET heatmap | Orange Device Location |
| **Alerts** | GET alerts (istoric) | Orange SMS, FCM/APNS |

---

## 4. Ordine recomandată de implementare

1. **Auth** — login/register + users/me (pentru a lega toate cererile de un user).
2. **Devices** — onboarding + validate-otp + PATCH/DELETE (integrare Orange SMS pentru OTP).
3. **Geofences** — CRUD (formularele din frontend sunt gata).
4. **Routes** — CRUD + integrare Google Directions pentru Smart Path.
5. **Location** — GET location și GET location-history (după ce Worker-ul scrie în DB din Orange).
6. **Alerts** — GET alerts; Service Alerte + FCM/Orange SMS (după ce Worker + Motor PostGIS sunt implementate).

Dacă vrei, următorul pas poate fi un **OpenAPI (Swagger)** pentru aceste endpoint-uri sau implementarea efectivă a unuia dintre grupuri (ex: Auth sau Geofences).
