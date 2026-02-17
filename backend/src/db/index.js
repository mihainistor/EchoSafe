import postgres from 'postgres'

export let sql = null

export async function runMigrations() {
  const url = process.env.DATABASE_URL || ''
  if (!url) {
    return
  }
  if (!sql) {
    sql = postgres(url, {
      max: 5,
      prepare: true,
      idle_timeout: 20_000,
      connect_timeout: 5_000,
      max_lifetime: 60_000 * 30, // 30 min
    })
  }
  const base = sql`
    CREATE TABLE IF NOT EXISTS users (
      user_id uuid PRIMARY KEY,
      email text UNIQUE,
      msisdn_admin text,
      password_hash text,
      notification_pref jsonb,
      created_at timestamptz
    );
    CREATE TABLE IF NOT EXISTS devices (
      device_id uuid PRIMARY KEY,
      admin_id uuid NOT NULL,
      msisdn_target text NOT NULL,
      label text NOT NULL,
      gdpr_status text NOT NULL,
      otp_secret text,
      live_tracking_mode boolean DEFAULT false,
      live_tracking_until timestamptz,
      stationary_alert_enabled boolean DEFAULT true,
      stationary_threshold_min int DEFAULT 20,
      safe_zone_destination_ids jsonb DEFAULT '[]'::jsonb,
      created_at timestamptz
    );
    CREATE INDEX IF NOT EXISTS idx_devices_admin ON devices(admin_id);
    CREATE TABLE IF NOT EXISTS otp_audit (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text,
      email text,
      ip text,
      ok boolean,
      reason text,
      at timestamptz
    );
  `
  await base
  if (String(process.env.RUN_SCHEMA_SQL || '').toLowerCase() === '1') {
    const fs = await import('fs')
    const path = await import('path')
    const dir = path.resolve(process.cwd(), 'schema')
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
      for (const f of files) {
        const sqlText = fs.readFileSync(path.join(dir, f), 'utf8')
        if (sqlText && sqlText.trim()) {
          await sql.unsafe(sqlText)
        }
      }
    }
  }
  return true
}
