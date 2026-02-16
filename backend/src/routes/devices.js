import { Router } from 'express'
import { monitoredDevices, setLiveTracking, checkAutoStopLiveTracking } from '../store.js'
import { retrieveDeviceLocation } from '../services/orangeLocationService.js'
import { retrieveDeviceReachability } from '../services/orangeReachabilityService.js'
import { requireAuth } from '../middleware/auth.js'
import { createPendingDevice, validateDeviceOtp, updateDevice, revokeDevice } from '../store.js'
import { sendOtpSms } from '../services/orangeSmsService.js'

export const devicesRouter = Router()

// Auto-stop live tracking la fiecare request (în producție: job separat)
devicesRouter.use((req, res, next) => {
  checkAutoStopLiveTracking()
  next()
})

// Protecție pentru toate rutele /api/devices
devicesRouter.use(requireAuth)

// Onboarding: POST /api/devices { msisdn_target, label }
devicesRouter.post('/', async (req, res) => {
  const { msisdn_target, label } = req.body || {}
  if (!msisdn_target || !label) return res.status(400).json({ error: 'msisdn_target, label required' })
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const dev = createPendingDevice({ admin_id: req.user.user_id, msisdn_target, label, otp })
  try {
    await sendOtpSms(msisdn_target, otp)
  } catch {
    // continuă și fără SMS real în demo
  }
  res.status(201).json({ device_id: dev.device_id, status: dev.gdpr_status })
})

// Validare OTP: POST /api/devices/:id/validate-otp { otp }
devicesRouter.post('/:id/validate-otp', (req, res) => {
  const id = req.params.id
  const { otp } = req.body || {}
  if (!otp) return res.status(400).json({ error: 'otp required' })
  const dev = validateDeviceOtp(id, otp)
  if (!dev) return res.status(400).json({ error: 'Invalid device or OTP' })
  if (dev.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  res.json({ device_id: dev.device_id, status: dev.gdpr_status })
})

// Update device: PATCH /api/devices/:id { label, stationary_alert_enabled, stationary_threshold_min, safe_zone_destination_ids }
devicesRouter.patch('/:id', (req, res) => {
  const id = req.params.id
  const dev = updateDevice(id, req.body || {})
  if (!dev) return res.status(404).json({ error: 'Device not found' })
  if (dev.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  res.json(dev)
})

// Revocare: DELETE /api/devices/:id
devicesRouter.delete('/:id', (req, res) => {
  const id = req.params.id
  const dev = monitoredDevices.get(id)
  if (!dev) return res.status(404).json({ error: 'Device not found' })
  if (dev.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  revokeDevice(id)
  res.json({ ok: true })
})

// Listă device-uri pentru un admin (folosește user-ul din token; fallback pe query pentru debug)
devicesRouter.get('/', (req, res) => {
  const adminId = req.user?.user_id || req.query.admin_id || req.headers['x-admin-id']
  if (!adminId) return res.status(400).json({ error: 'admin_id or X-Admin-Id required' })
  const list = [...monitoredDevices.values()].filter((d) => d.admin_id === adminId)
  res.json(list)
})

// Detalii device (pentru frontend: id = device_id sau id numeric din frontend)
devicesRouter.get('/:id', (req, res) => {
  const id = req.params.id
  const device = monitoredDevices.get(id) ||
    [...monitoredDevices.values()].find((d) => d.device_id === id || String(d.msisdn_target) === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  res.json({ ...device, device_id: device.device_id })
})

// Locație curentă via Orange Device Location Retrieval API
devicesRouter.get('/:id/location', async (req, res) => {
  const id = req.params.id
  const device = monitoredDevices.get(id) ||
    [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  if (String(process.env.ORANGE_DEMO || '').toLowerCase() === 'true') {
    return res.json({
      device_id: device.device_id,
      label: device.label,
      lat: 44.4268,
      lng: 26.1025,
      accuracy: 300,
      lastLocationTime: new Date().toISOString(),
      area: { areaType: 'CIRCLE', center: { latitude: 44.4268, longitude: 26.1025 }, radius: 300 },
      demo: true,
    })
  }
  try {
    const location = await retrieveDeviceLocation(device.msisdn_target, {
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge, 10) : undefined,
    })
    res.json({ device_id: device.device_id, label: device.label, ...location })
  } catch (err) {
    const demo = {
      device_id: device.device_id,
      label: device.label,
      lat: 44.4268,
      lng: 26.1025,
      accuracy: 300,
      lastLocationTime: new Date().toISOString(),
      area: { areaType: 'CIRCLE', center: { latitude: 44.4268, longitude: 26.1025 }, radius: 300 },
      demo: true,
    }
    res.json(demo)
  }
})

// Istoric locații (Istoric Locatie) — demo fallback
devicesRouter.get('/:id/location-history', (req, res) => {
  const id = req.params.id
  const device = monitoredDevices.get(id) ||
    [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 2 * 60 * 60 * 1000)
  const to = req.query.to ? new Date(req.query.to) : new Date()
  const totalMs = Math.max(1, to - from)
  const steps = Math.min(120, Math.ceil(totalMs / (60 * 1000))) // ~1 punct/min, max 120
  const center = { lat: 44.4268, lng: 26.1025 }
  const radius = 0.01 // ~1km
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = from.getTime() + Math.floor((totalMs / steps) * i)
    const angle = (i / steps) * 2 * Math.PI
    const lat = center.lat + Math.sin(angle) * radius
    const lng = center.lng + Math.cos(angle) * radius
    const speedKmh = 10 + 20 * Math.abs(Math.sin(angle * 2)) // 10–30 km/h
    const reach = speedKmh > 12 ? 'CONNECTED_DATA' : 'CONNECTED_SMS'
    points.push({
      lat,
      lng,
      timestamp: new Date(t).toISOString(),
      speedKmh,
      reachability: reach,
    })
  }
  res.json({ device_id: device.device_id, from: from.toISOString(), to: to.toISOString(), points, demo: true })
})

// Reachability status via Orange Device Reachability Status API
devicesRouter.get('/:id/reachability', async (req, res) => {
  const id = req.params.id
  const device = monitoredDevices.get(id) ||
    [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  if (String(process.env.ORANGE_DEMO || '').toLowerCase() === 'true') {
    return res.json({
      device_id: device.device_id,
      label: device.label,
      reachabilityStatus: 'CONNECTED_DATA',
      lastStatusTime: new Date().toISOString(),
      demo: true,
    })
  }
  try {
    const status = await retrieveDeviceReachability(device.msisdn_target)
    res.json({ device_id: device.device_id, label: device.label, ...status })
  } catch (err) {
    res.json({
      device_id: device.device_id,
      label: device.label,
      reachabilityStatus: 'CONNECTED_SMS',
      lastStatusTime: new Date().toISOString(),
      demo: true,
      fallbackMessage: err.message,
    })
  }
})

// Live Tracking override: PATCH /api/devices/:id/live-tracking
// Body: { enabled: true } -> activează 10 min; { enabled: false } -> oprește
devicesRouter.patch('/:id/live-tracking', (req, res) => {
  const id = req.params.id
  const device = monitoredDevices.get(id) ||
    [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  const canonicalId = device.device_id
  const enabled = req.body.enabled === true
  const updated = setLiveTracking(canonicalId, enabled)
  if (id !== canonicalId) monitoredDevices.set(id, updated)
  res.json(updated)
})
