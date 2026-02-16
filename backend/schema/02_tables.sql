-- ============================================================
-- Users (Părinții / Administratorii)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msisdn_admin    VARCHAR(20) NOT NULL UNIQUE,
  email           VARCHAR(255),
  notification_pref JSONB NOT NULL DEFAULT '{"push": true, "sms": true, "smsWhenNoInternet": true, "smsOnNoGoZone": true, "smsOnDeviation": true}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Monitored_Devices (Membri familie / Target)
-- ============================================================
CREATE TYPE gdpr_status_enum AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
CREATE TYPE transport_mode_enum AS ENUM ('PEDESTRIAN', 'BIKE', 'BUS', 'CAR', 'MANUAL');

CREATE TABLE IF NOT EXISTS monitored_devices (
  device_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id                 UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  msisdn_target            VARCHAR(20) NOT NULL,
  label                    VARCHAR(100) NOT NULL,
  gdpr_status              gdpr_status_enum NOT NULL DEFAULT 'PENDING',
  otp_secret               VARCHAR(255),
  live_tracking_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  live_tracking_until       TIMESTAMPTZ,
  stationary_alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  stationary_threshold_min INTEGER NOT NULL DEFAULT 20,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id, msisdn_target)
);

CREATE INDEX idx_monitored_devices_admin ON monitored_devices(admin_id);
CREATE INDEX idx_monitored_devices_live ON monitored_devices(live_tracking_mode) WHERE live_tracking_mode = TRUE;

-- ============================================================
-- Geofences (Safe, No-Go, Destinații)
-- ============================================================
CREATE TYPE geofence_type_enum AS ENUM ('SAFE_ZONE', 'NO_GO_PERMANENT', 'NO_GO_TEMPORARY', 'DESTINATION');

CREATE TABLE IF NOT EXISTS geofences (
  fence_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES monitored_devices(device_id) ON DELETE CASCADE,
  type         geofence_type_enum NOT NULL,
  shape        GEOMETRY(Polygon, 4326) NOT NULL,
  active_from  TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  label        VARCHAR(100) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofences_device ON geofences(device_id);
CREATE INDEX idx_geofences_shape ON geofences USING GIST(shape);

-- ============================================================
-- Routes (Trasee Predefinite)
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
  route_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      UUID NOT NULL REFERENCES monitored_devices(device_id) ON DELETE CASCADE,
  transport_mode transport_mode_enum NOT NULL,
  route_path     GEOMETRY(LineString, 4326) NOT NULL,
  buffer_meters  INTEGER NOT NULL DEFAULT 50,
  is_active      BOOLEAN NOT NULL DEFAULT FALSE,
  name           VARCHAR(200),
  day_of_week    SMALLINT,
  start_time     TIME,
  end_time       TIME,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routes_device ON routes(device_id);
CREATE INDEX idx_routes_path ON routes USING GIST(route_path);

-- ============================================================
-- Location_History (Istoric 30 zile) - Optimizat pentru volum
-- ============================================================
CREATE TABLE IF NOT EXISTS location_history (
  history_id      BIGSERIAL PRIMARY KEY,
  device_id       UUID NOT NULL REFERENCES monitored_devices(device_id) ON DELETE CASCADE,
  coordinates     GEOMETRY(Point, 4326) NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_on_route     BOOLEAN NOT NULL DEFAULT FALSE,
  event_triggered VARCHAR(50)
);

CREATE INDEX idx_location_history_device_time ON location_history(device_id, timestamp DESC);
CREATE INDEX idx_location_history_coordinates ON location_history USING GIST(coordinates);
-- Retenție 30 zile: rulează job periodic DELETE FROM location_history WHERE timestamp < NOW() - INTERVAL '30 days';
