import { sql } from '../db/index.js'
import {
  monitoredDevices,
  createPendingDevice as memCreate,
  validateDeviceOtp as memValidate,
  updateDevice as memUpdate,
  revokeDevice as memRevoke,
} from '../store.js'
import { randomUUID } from 'crypto'

export async function createPendingDevice({ admin_id, msisdn_target, label, otp }) {
  if (!sql) return memCreate({ admin_id, msisdn_target, label, otp })
  const id = randomUUID()
  const now = new Date().toISOString()
  const row = await sql`
    insert into devices (device_id, admin_id, msisdn_target, label, gdpr_status, otp_secret, created_at)
    values (${id}::uuid, ${admin_id}::uuid, ${msisdn_target}, ${label}, 'PENDING', ${otp}, ${now}::timestamptz)
    returning *
  `
  return mapRow(row[0])
}

export async function validateDeviceOtp(device_id, otp) {
  if (!sql) return memValidate(device_id, otp)
  const rows = await sql`select * from devices where device_id = ${device_id}::uuid and gdpr_status = 'PENDING' limit 1`
  const dev = rows[0]
  if (!dev || String(dev.otp_secret) !== String(otp)) return null
  const up = await sql`
    update devices set gdpr_status = 'ACTIVE', otp_secret = null where device_id = ${device_id}::uuid
    returning *
  `
  return mapRow(up[0])
}

export async function updateDevice(device_id, patch = {}) {
  if (!sql) return memUpdate(device_id, patch)
  const set = []
  if (patch.label != null) set.push(sql`label = ${patch.label}`)
  if (patch.stationary_alert_enabled != null) set.push(sql`stationary_alert_enabled = ${!!patch.stationary_alert_enabled}`)
  if (patch.stationary_threshold_min != null) set.push(sql`stationary_threshold_min = ${Number(patch.stationary_threshold_min)}`)
  if (Array.isArray(patch.safe_zone_destination_ids)) set.push(sql`safe_zone_destination_ids = ${sql.json(patch.safe_zone_destination_ids.map(String))}`)
  if (set.length === 0) {
    const rows = await sql`select * from devices where device_id = ${device_id}::uuid`
    return rows[0] ? mapRow(rows[0]) : null
  }
  const rows = await sql`update devices set ${sql.join(set, sql`, `)} where device_id = ${device_id}::uuid returning *`
  return rows[0] ? mapRow(rows[0]) : null
}

export async function revokeDevice(device_id) {
  if (!sql) return memRevoke(device_id)
  const r = await sql`delete from devices where device_id = ${device_id}::uuid returning device_id`
  return r.length > 0
}

export async function findDeviceById(device_id) {
  if (!sql) return monitoredDevices.get(device_id) || null
  const rows = await sql`select * from devices where device_id = ${device_id}::uuid`
  return rows[0] ? mapRow(rows[0]) : null
}

export async function listDevicesByAdmin(admin_id, opts = {}) {
  if (!sql) {
    const items = [...monitoredDevices.values()].filter((d) => d.admin_id === admin_id)
    const limit = Number.isFinite(Number(opts.limit)) ? Number(opts.limit) : undefined
    const offset = Number.isFinite(Number(opts.offset)) ? Number(opts.offset) : 0
    return typeof limit === 'number' ? items.slice(offset, offset + limit) : items
  }
  const lim = Math.max(1, Math.min(100, Number(opts.limit || 0))) || null
  const off = Math.max(0, Number(opts.offset || 0))
  const base = sql`select * from devices where admin_id = ${admin_id}::uuid order by created_at desc`
  const rows = lim ? await sql`${base} limit ${lim} offset ${off}` : await base
  return rows.map(mapRow)
}

export async function countDevicesByAdmin(admin_id) {
  if (!sql) return [...monitoredDevices.values()].filter((d) => d.admin_id === admin_id).length
  const r = await sql`select count(*)::int as c from devices where admin_id = ${admin_id}::uuid`
  return r[0]?.c || 0
}

function mapRow(row) {
  return {
    device_id: String(row.device_id),
    admin_id: String(row.admin_id),
    msisdn_target: row.msisdn_target,
    label: row.label,
    gdpr_status: row.gdpr_status,
    otp_secret: row.otp_secret ?? null,
    live_tracking_mode: row.live_tracking_mode ?? false,
    live_tracking_until: row.live_tracking_until ?? null,
    stationary_alert_enabled: row.stationary_alert_enabled ?? true,
    stationary_threshold_min: row.stationary_threshold_min ?? 20,
    safe_zone_destination_ids: row.safe_zone_destination_ids ?? [],
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  }
}
