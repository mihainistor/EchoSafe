# Schema EchoSafe (PostgreSQL + PostGIS)

## Ordine rulare

```bash
psql -U user -d safekid -f 01_extensions.sql
psql -U user -d safekid -f 02_tables.sql
psql -U user -d safekid -f 03_indexes.sql
```

## Entități

| Tabel | Descriere |
|-------|-----------|
| **users** | Părinți/administratori: msisdn_admin, email, notification_pref (JSON) |
| **monitored_devices** | Membri familie: admin_id, msisdn_target, label, gdpr_status, live_tracking_mode, live_tracking_until, stationary_alert_enabled, stationary_threshold_min |
| **geofences** | Zone: SAFE_ZONE, NO_GO_PERMANENT, NO_GO_TEMPORARY, DESTINATION; shape (Polygon), active_from/active_until |
| **routes** | Trasee: route_path (LineString), buffer_meters, transport_mode, is_active |
| **location_history** | Istoric 30 zile: coordinates (Point), timestamp, is_on_route, event_triggered |

## Live Tracking

- `live_tracking_mode = TRUE` → worker interoghează la 15–30 s (override).
- `live_tracking_until` → auto-stop după 10 min; worker verifică și resetează `live_tracking_mode` dacă `NOW() > live_tracking_until`.

## Retenție

Ștergere periodică pentru `location_history`: `timestamp < NOW() - INTERVAL '30 days'`.
