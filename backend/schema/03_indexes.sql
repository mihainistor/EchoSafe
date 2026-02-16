-- Indexuri suplimentare pentru interogări rapide (hărți, rapoarte)

-- Location history: range pe timp pentru Istoric Locatie / heatmap
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp DESC);

-- Geofences: filtrare pe tip
CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(device_id, type);

-- Monitored devices: lookup rapid pentru worker (ce device-uri au live_tracking sau trebuie pollate)
-- (idx_monitored_devices_live deja definit în 02_tables.sql)
