/**
 * In-memory store aliniat la schema DB.
 * În producție: înlocuit cu PostgreSQL (vezi schema/).
 */

const LIVE_TRACKING_DURATION_MS = 10 * 60 * 1000 // 10 minute

export const users = new Map()
export const monitoredDevices = new Map()
export const otpEmailStore = new Map()
export const otpRateLimit = new Map()
export const otpAudit = []

// Seed minimal pentru demo
const seedAdminId = 'a1b2c3d4-0000-4000-8000-000000000001'
const seedDeviceId = 'd1e2v3i4-0000-4000-8000-000000000001'
if (!users.has(seedAdminId)) {
  users.set(seedAdminId, {
    user_id: seedAdminId,
    msisdn_admin: '0744123456',
    email: 'parent@example.com',
    notification_pref: { push: true, sms: true, smsWhenNoInternet: true, smsOnNoGoZone: true, smsOnDeviation: true },
    created_at: new Date().toISOString(),
  })
}
// Seed demo user for quick login
import { hashPassword } from './utils/hash.js'
const demoEmail = 'demo@example.com'
const demoMsisdn = '0700000000'
let demoUser = [...users.values()].find((u) => u.email === demoEmail)
if (!demoUser) {
  const id = 'a1b2c3d4-0000-4000-8000-0000000000DE'
  demoUser = {
    user_id: id,
    email: demoEmail,
    msisdn_admin: demoMsisdn,
    passwordHash: hashPassword('Passw0rd!'),
    notification_pref: { push: true, sms: true, smsWhenNoInternet: true, smsOnNoGoZone: true, smsOnDeviation: true },
    created_at: new Date().toISOString(),
  }
  users.set(id, demoUser)
}
// Seed device pentru demo user
const demoDeviceId = 'de-mo-0000-0000-0000-000000000001'
if (![...monitoredDevices.values()].some((d) => d.admin_id === demoUser.user_id)) {
  const dev = {
    device_id: demoDeviceId,
    admin_id: demoUser.user_id,
    msisdn_target: '0722987654',
    label: 'Demo Kid',
    gdpr_status: 'ACTIVE',
    otp_secret: null,
    live_tracking_mode: false,
    live_tracking_until: null,
    stationary_alert_enabled: true,
    stationary_threshold_min: 20,
    safe_zone_destination_ids: [],
    created_at: new Date().toISOString(),
  }
  monitoredDevices.set(demoDeviceId, dev)
}
const seedDevice = {
  device_id: seedDeviceId,
  admin_id: seedAdminId,
  msisdn_target: '0722123456',
  label: 'Andrei',
  gdpr_status: 'ACTIVE',
  otp_secret: null,
  live_tracking_mode: false,
  live_tracking_until: null,
  stationary_alert_enabled: true,
  stationary_threshold_min: 20,
  safe_zone_destination_ids: [],
  created_at: new Date().toISOString(),
}
if (!monitoredDevices.has(seedDeviceId)) monitoredDevices.set(seedDeviceId, seedDevice)
if (!monitoredDevices.has('1')) monitoredDevices.set('1', seedDevice) // alias pentru frontend demo (id "1")

export function setLiveTracking(deviceId, enabled) {
  const device = monitoredDevices.get(deviceId)
  if (!device) return null
  device.live_tracking_mode = !!enabled
  device.live_tracking_until = enabled
    ? new Date(Date.now() + LIVE_TRACKING_DURATION_MS).toISOString()
    : null
  return device
}

export function checkAutoStopLiveTracking() {
  const now = Date.now()
  for (const device of monitoredDevices.values()) {
    if (device.live_tracking_mode && device.live_tracking_until) {
      if (new Date(device.live_tracking_until).getTime() <= now) {
        device.live_tracking_mode = false
        device.live_tracking_until = null
      }
    }
  }
}

export { LIVE_TRACKING_DURATION_MS }

// Onboarding & management dispozitive (in-memory)
import { randomUUID } from 'crypto'

export function createPendingDevice({ admin_id, msisdn_target, label, otp }) {
  const id = randomUUID()
  const dev = {
    device_id: id,
    admin_id,
    msisdn_target: String(msisdn_target),
    label: String(label),
    gdpr_status: 'PENDING',
    otp_secret: String(otp),
    live_tracking_mode: false,
    live_tracking_until: null,
    stationary_alert_enabled: true,
    stationary_threshold_min: 20,
    safe_zone_destination_ids: [],
    created_at: new Date().toISOString(),
  }
  monitoredDevices.set(id, dev)
  return dev
}

export function validateDeviceOtp(device_id, otp) {
  const dev = monitoredDevices.get(device_id)
  if (!dev) return null
  if (dev.gdpr_status !== 'PENDING') return null
  if (!dev.otp_secret || String(otp) !== String(dev.otp_secret)) return null
  dev.gdpr_status = 'ACTIVE'
  dev.otp_secret = null
  monitoredDevices.set(device_id, dev)
  return dev
}

export function updateDevice(device_id, patch = {}) {
  const dev = monitoredDevices.get(device_id)
  if (!dev) return null
  const up = { ...dev }
  if (patch.label != null) up.label = String(patch.label)
  if (patch.stationary_alert_enabled != null) up.stationary_alert_enabled = !!patch.stationary_alert_enabled
  if (patch.stationary_threshold_min != null) up.stationary_threshold_min = Number(patch.stationary_threshold_min)
  if (Array.isArray(patch.safe_zone_destination_ids)) up.safe_zone_destination_ids = patch.safe_zone_destination_ids.map(String)
  monitoredDevices.set(device_id, up)
  return up
}

export function revokeDevice(device_id) {
  const dev = monitoredDevices.get(device_id)
  if (!dev) return false
  monitoredDevices.delete(device_id)
  return true
}

export function trackOtpRequest(email, ip) {
  const now = Date.now()
  const key = String(email).toLowerCase()
  const arr = otpRateLimit.get(key) || []
  const recent = arr.filter((t) => now - t < 60 * 1000)
  recent.push(now)
  otpRateLimit.set(key, recent)
  otpAudit.push({ type: 'request', email: key, ip: String(ip || ''), at: new Date(now).toISOString() })
  return recent.length
}

export function getOtpEntry(email) {
  const key = String(email).toLowerCase()
  const v = otpEmailStore.get(key)
  if (!v) return null
  if (v.expiresAt && Date.now() > v.expiresAt) {
    otpEmailStore.delete(key)
    return null
  }
  return v
}

export function setOtpEntry(email, entry) {
  const key = String(email).toLowerCase()
  otpEmailStore.set(key, entry)
}

export function deleteOtpEntry(email) {
  const key = String(email).toLowerCase()
  otpEmailStore.delete(key)
}
