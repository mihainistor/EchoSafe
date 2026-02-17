import { monitoredDevices, setLiveTracking, checkAutoStopLiveTracking } from '../store.js'
import { retrieveDeviceLocation } from '../services/orangeLocationService.js'
import { retrieveDeviceReachability } from '../services/orangeReachabilityService.js'
import { createPendingDevice, validateDeviceOtp, updateDevice, revokeDevice, findDeviceById, listDevicesByAdmin, countDevicesByAdmin } from '../repositories/deviceRepo.js'
import { isE164, inLen, isSixDigits, isISODateString } from '../utils/validate.js'

export function autoStopMiddleware(req, res, next) {
  checkAutoStopLiveTracking()
  next()
}

export async function createDevice(req, res) {
  const { msisdn_target, label } = req.body || {}
  if (!msisdn_target || !label) return res.status(400).json({ error: 'msisdn_target, label required' })
  const msisdnClean = String(msisdn_target).trim().replace(/\D/g, '')
  if (!isE164(msisdnClean)) return res.status(400).json({ error: 'invalid_msisdn' })
  if (!inLen(String(label), 1, 60)) return res.status(400).json({ error: 'invalid_label' })
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const dev = await Promise.resolve(createPendingDevice({ admin_id: req.user.user_id, msisdn_target: msisdnClean, label, otp }))
  try {
    const { sendOtpSms } = await import('../services/orangeSmsService.js')
    await sendOtpSms(msisdnClean, otp)
  } catch (e) { void e }
  res.status(201).json({ device_id: dev.device_id, status: dev.gdpr_status })
}

export async function validateDeviceOtpCtrl(req, res) {
  const id = req.params.id
  const { otp } = req.body || {}
  if (!otp) return res.status(400).json({ error: 'otp required' })
  if (!isSixDigits(String(otp))) return res.status(400).json({ error: 'invalid_code_format' })
  const dev = await Promise.resolve(validateDeviceOtp(id, otp))
  if (!dev) return res.status(400).json({ error: 'Invalid device or OTP' })
  if (dev.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  res.json({ device_id: dev.device_id, status: dev.gdpr_status })
}

export async function updateDeviceCtrl(req, res) {
  const id = req.params.id
  const body = req.body || {}
  if (body.label != null && !inLen(String(body.label), 1, 60)) return res.status(400).json({ error: 'invalid_label' })
  if (body.stationary_threshold_min != null) {
    const v = Number(body.stationary_threshold_min)
    if (!Number.isFinite(v) || v < 1 || v > 180) return res.status(400).json({ error: 'invalid_threshold' })
  }
  const dev = await Promise.resolve(updateDevice(id, body))
  if (!dev) return res.status(404).json({ error: 'Device not found' })
  if (dev.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  res.json(dev)
}

export async function deleteDeviceCtrl(req, res) {
  const id = req.params.id
  const dev = (await Promise.resolve(findDeviceById(id))) || monitoredDevices.get(id)
  if (!dev) return res.status(404).json({ error: 'Device not found' })
  if (dev.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  await Promise.resolve(revokeDevice(id))
  res.json({ ok: true })
}

export async function listDevicesCtrl(req, res) {
  const adminId = req.user?.user_id || req.query.admin_id || req.headers['x-admin-id']
  if (!adminId) return res.status(400).json({ error: 'admin_id or X-Admin-Id required' })
  const limit = req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 0)) : undefined
  const offset = req.query.offset ? Math.max(0, parseInt(req.query.offset, 10) || 0) : 0
  const list = await Promise.resolve(listDevicesByAdmin(adminId, { limit, offset }))
  const total = await Promise.resolve(countDevicesByAdmin(adminId))
  res.setHeader('X-Total-Count', String(total))
  res.json(list)
}

export async function getDeviceCtrl(req, res) {
  const id = req.params.id
  const device = (await Promise.resolve(findDeviceById(id))) || monitoredDevices.get(id) || [...monitoredDevices.values()].find((d) => d.device_id === id || String(d.msisdn_target) === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  res.json({ ...device, device_id: device.device_id })
}

export async function getLocationCtrl(req, res) {
  const id = req.params.id
  const device = (await Promise.resolve(findDeviceById(id))) || monitoredDevices.get(id) || [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  if (req.query.maxAge != null) {
    const mv = parseInt(String(req.query.maxAge), 10)
    if (!Number.isFinite(mv) || mv < 0 || mv > 86400) return res.status(400).json({ error: 'invalid_maxAge' })
  }
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
    const location = await retrieveDeviceLocation(device.msisdn_target, { maxAge: req.query.maxAge ? parseInt(req.query.maxAge, 10) : undefined })
    res.json({ device_id: device.device_id, label: device.label, ...location })
  } catch {
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
}

export async function getLocationHistoryCtrl(req, res) {
  const id = req.params.id
  const device = (await Promise.resolve(findDeviceById(id))) || monitoredDevices.get(id) || [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  if (req.query.from && !isISODateString(String(req.query.from))) return res.status(400).json({ error: 'invalid_from' })
  if (req.query.to && !isISODateString(String(req.query.to))) return res.status(400).json({ error: 'invalid_to' })
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 2 * 60 * 60 * 1000)
  const to = req.query.to ? new Date(String(req.query.to)) : new Date()
  const totalMs = Math.max(1, to - from)
  const steps = Math.min(120, Math.ceil(totalMs / (60 * 1000)))
  const center = { lat: 44.4268, lng: 26.1025 }
  const radius = 0.01
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = from.getTime() + Math.floor((totalMs / steps) * i)
    const angle = (i / steps) * 2 * Math.PI
    const lat = center.lat + Math.sin(angle) * radius
    const lng = center.lng + Math.cos(angle) * radius
    const speedKmh = 10 + 20 * Math.abs(Math.sin(angle * 2))
    const reach = speedKmh > 12 ? 'CONNECTED_DATA' : 'CONNECTED_SMS'
    points.push({ lat, lng, timestamp: new Date(t).toISOString(), speedKmh, reachability: reach })
  }
  res.json({ device_id: device.device_id, from: from.toISOString(), to: to.toISOString(), points, demo: true })
}

export async function getReachabilityCtrl(req, res) {
  const id = req.params.id
  const device = (await Promise.resolve(findDeviceById(id))) || monitoredDevices.get(id) || [...monitoredDevices.values()].find((d) => d.device_id === id)
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
}

export function setLiveTrackingCtrl(req, res) {
  const id = req.params.id
  const device = monitoredDevices.get(id) || [...monitoredDevices.values()].find((d) => d.device_id === id)
  if (!device) return res.status(404).json({ error: 'Device not found' })
  if (device.admin_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' })
  const canonicalId = device.device_id
  const enabled = req.body.enabled === true
  const updated = setLiveTracking(canonicalId, enabled)
  if (id !== canonicalId) monitoredDevices.set(id, updated)
  res.json(updated)
}
