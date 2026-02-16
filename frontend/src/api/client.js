import { getToken } from './auth'
function isDemo() {
  try {
    return localStorage.getItem('demo_mode') === '1'
  } catch {
    return false
  }
}
const API_BASE =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : ''

export async function createDevice({ msisdn_target, label }) {
  if (isDemo()) {
    const device_id = `demo-${Date.now()}`
    return Promise.resolve({ device_id, msisdn_target, label, demo: true })
  }
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ msisdn_target, label }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export async function validateDeviceOtp(deviceId, otp) {
  if (isDemo()) {
    return Promise.resolve({ ok: true, device_id: deviceId, demo: true })
  }
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(deviceId)}/validate-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ otp }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export async function listDevices() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/devices`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export async function setLiveTracking(deviceId, enabled) {
  if (isDemo()) {
    const until = enabled ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null
    return Promise.resolve({ device_id: deviceId, live_tracking_mode: !!enabled, live_tracking_until: until, demo: true })
  }
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(deviceId)}/live-tracking`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getDevice(deviceId) {
  if (isDemo()) {
    return Promise.resolve({ device_id: deviceId, label: 'Andrei', msisdn_target: '0722123456', demo: true })
  }
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(deviceId)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getDeviceLocation(deviceId, opts = {}) {
  if (isDemo()) {
    const base = { lat: 44.4268, lng: 26.1025 }
    const jitter = () => (Math.random() - 0.5) * 0.01
    const now = new Date().toISOString()
    return Promise.resolve({ lat: base.lat + jitter(), lng: base.lng + jitter(), accuracy: 15 + Math.round(Math.random() * 15), lastLocationTime: now, demo: true })
  }
  const token = getToken()
  const params = new URLSearchParams()
  if (opts.maxAge != null) params.set('maxAge', String(opts.maxAge))
  const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(deviceId)}/location?${params.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export async function getDeviceReachability(deviceId) {
  if (isDemo()) {
    const statuses = ['CONNECTED_DATA', 'CONNECTED_SMS', 'NOT_CONNECTED']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    return Promise.resolve({ status, reachabilityStatus: status, demo: true })
  }
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(deviceId)}/reachability`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export async function getDeviceLocationHistory(deviceId, { from, to }) {
  if (isDemo()) {
    const base = { lat: 44.4268, lng: 26.1025 }
    const deg = (a) => (a * Math.PI) / 180
    const noise = (s = 0.0005) => (Math.random() - 0.5) * s
    const makeStraightRoute = (idx) => {
      const angleDeg = (idx * 36) % 360 // 10 direcții diferite
      const angle = deg(angleDeg)
      const length = 0.01 + (idx % 3) * 0.006 // lungimi modeste, ~1–2.5 km
      const steps = 16
      const startLat = base.lat + Math.cos(angle + Math.PI) * 0.004
      const startLng = base.lng + Math.sin(angle + Math.PI) * 0.004
      const dLat = Math.cos(angle) * (length / steps)
      const dLng = Math.sin(angle) * (length / steps)
      const pts = []
      for (let i = 0; i < steps; i++) {
        const t = i
        const lat = startLat + dLat * t + noise()
        const lng = startLng + dLng * t + noise()
        pts.push({
          timestamp: new Date(Date.now() - ((idx * 45) + i) * 60 * 1000).toISOString(),
          lat,
          lng,
          speedKmh: Math.max(3, Math.round(8 + Math.random() * 18)),
          reachability: Math.random() > 0.15 ? 'CONNECTED_DATA' : 'CONNECTED_SMS',
        })
      }
      return pts
    }
    const routes = Array.from({ length: 10 }).map((_, i) => makeStraightRoute(i))
    const points = routes.flat()
    return Promise.resolve({ routes, points, demo: true })
  }
  const token = getToken()
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(deviceId)}/location-history?${params.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}
