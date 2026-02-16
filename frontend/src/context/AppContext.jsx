import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getMe } from '../api/auth'
import { listDevices } from '../api/client'

const defaultMembers = Array.from({ length: 5 }).map((_, i) => {
  const names = ['Andrei', 'Maria', 'Ioana', 'Vlad', 'Elena']
  const id = String(i + 1)
  const label = names[i] || `Membru ${i + 1}`
  const msisdn = `0722${String(123450 + i).padStart(6, '0')}`
  const statuses = ['on_route', 'off_route', 'stationary']
  const status = statuses[i % statuses.length]
  return {
    id,
    label,
    msisdn,
    linkedAt: new Date().toISOString(),
    status,
    lastLocation: { lat: 44.4268 + (Math.random() - 0.5) * 0.02, lng: 26.1025 + (Math.random() - 0.5) * 0.02 },
    lastUpdated: new Date().toISOString(),
    live_tracking_mode: false,
    live_tracking_until: null,
  }
})

const defaultAlerts = [
  { id: '1', type: 'check_in', memberLabel: 'Andrei', message: 'Andrei a ajuns la Școală la ora 08:05.', at: '2025-02-14T06:05:00Z' },
  { id: '2', type: 'deviation', memberLabel: 'Andrei', message: 'Andrei s-a abătut de la traseu la ora 15:22. Locație: [Link Hartă]', at: '2025-02-13T15:22:00Z' },
  { id: '3', type: 'inactivity', memberLabel: 'Andrei', message: 'Andrei staționează de 20 minute în zona [Adresă/Coordonate].', at: '2025-02-13T14:00:00Z' },
]

// Routes: type smart (from/to + transport + buffer) | freehand (drawn path + buffer)
const defaultRoutes = (() => {
  const baseNames = [
    { name: 'Acasă → Școală', transportMode: 'pedestrian' },
    { name: 'Școală → Antrenament', transportMode: 'bicycle' },
    { name: 'Acasă → Centru', transportMode: 'transit' },
  ]
  const obj = {}
  for (let i = 1; i <= 5; i++) {
    obj[i] = baseNames.map((b, idx) => ({
      id: `r${i}-${idx + 1}`,
      type: 'smart',
      name: b.name,
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: ['07:30', '15:00', '10:00'][idx] || '08:00',
      endTime: ['09:00', '16:30', '11:00'][idx] || '09:00',
      fromAddress: b.name.split(' → ')[0],
      toAddress: b.name.split(' → ')[1],
      transportMode: b.transportMode,
      bufferMeters: 50 + idx * 10,
      corridorMeters: 50 + idx * 10,
    }))
  }
  return obj
})()

// No-Go: permanent | scheduled (time window) | adhoc (single date)
const defaultNoGoZones = (() => {
  const obj = {}
  for (let i = 1; i <= 5; i++) {
    const arr = Array.from({ length: 5 }).map((_, k) => ({
      id: `z${i}-${k + 1}`,
      name: `No-Go ${k + 1}`,
      lat: 44.4268 + (Math.cos((k * 72) * Math.PI / 180) * 0.01) + (Math.random() - 0.5) * 0.002,
      lng: 26.1025 + (Math.sin((k * 72) * Math.PI / 180) * 0.01) + (Math.random() - 0.5) * 0.002,
      radiusMeters: 150 + k * 25,
      type: k % 2 === 0 ? 'permanent' : 'scheduled',
      scheduleStartTime: k % 2 !== 0 ? '12:00' : undefined,
      scheduleEndTime: k % 2 !== 0 ? '18:00' : undefined,
    }))
    obj[i] = arr
  }
  return obj
})()

// Inactivity alert per child: enabled, minutes, safeZoneDestinationIds (destinations that don't trigger alert)
const defaultInactivityAlert = {
  1: { enabled: true, minutes: 20, safeZoneDestinationIds: ['d1', 'd2'] },
}

// Per-member alert type toggles
const defaultAlertTypes = {
  1: { no_go: true, deviation: true, inactivity: true },
}
const AppContext = createContext(null)

const TRANSPORT_MODES = [
  { value: 'pedestrian', label: 'Pieton' },
  { value: 'bicycle', label: 'Bicicletă' },
  { value: 'transit', label: 'Transport în comun' },
  { value: 'car', label: 'Autoturism' },
]

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [linkedMembers, setLinkedMembers] = useState(defaultMembers)
  const [alerts, setAlerts] = useState(defaultAlerts)
  const [destinations, setDestinations] = useState(() => {
    const obj = {}
    for (let i = 1; i <= 5; i++) {
      obj[i] = [
        { id: `d${i}-1`, name: 'Acasă', lat: 44.4268 + (Math.random() - 0.5) * 0.01, lng: 26.1025 + (Math.random() - 0.5) * 0.01, radiusMeters: 100 },
        { id: `d${i}-2`, name: 'Școală', lat: 44.428 + (Math.random() - 0.5) * 0.01, lng: 26.104 + (Math.random() - 0.5) * 0.01, radiusMeters: 150 },
        { id: `d${i}-3`, name: 'Antrenament', lat: 44.43 + (Math.random() - 0.5) * 0.01, lng: 26.1 + (Math.random() - 0.5) * 0.01, radiusMeters: 100 },
      ]
    }
    return obj
  })
  const [noGoZones, setNoGoZones] = useState(defaultNoGoZones)
  const [routes, setRoutes] = useState(defaultRoutes)
  const [inactivityAlert, setInactivityAlert] = useState(defaultInactivityAlert)
  const [alertTypes, setAlertTypes] = useState(defaultAlertTypes)
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    smsEnabled: true,
    smsWhenNoInternet: true,
    smsOnNoGoZone: true,
    smsOnDeviation: true,
  })

  const setLiveTrackingState = useCallback((memberId, payload) => {
    setLinkedMembers((prev) =>
      prev.map((c) => (c.id === memberId ? { ...c, ...payload } : c))
    )
  }, [])

  const addMember = useCallback((member) => {
    const id = String(Date.now())
    setLinkedMembers((prev) => [...prev, { ...member, id, live_tracking_mode: false, live_tracking_until: null }])
    setDestinations((d) => ({
      ...d,
      [id]: [
        { id: 'd' + Date.now(), name: 'Acasă', lat: 44.4268, lng: 26.1025, radiusMeters: 100 },
        { id: 'd' + (Date.now() + 1), name: 'Școală', lat: 44.428, lng: 26.104, radiusMeters: 150 },
        { id: 'd' + (Date.now() + 2), name: 'Antrenament', lat: 44.43, lng: 26.1, radiusMeters: 100 },
      ],
    }))
    setNoGoZones((z) => ({ ...z, [id]: [] }))
    setRoutes((r) => ({ ...r, [id]: [] }))
    setInactivityAlert((a) => ({ ...a, [id]: { enabled: false, minutes: 20, safeZoneDestinationIds: [] } }))
    setAlertTypes((t) => ({ ...t, [id]: { no_go: true, deviation: true, inactivity: true } }))
  }, [])

  const revokeMember = useCallback((memberId) => {
    setLinkedMembers((prev) => prev.filter((c) => c.id !== memberId))
  }, [])

  const addDestination = useCallback((memberId, dest) => {
    setDestinations((d) => ({
      ...d,
      [memberId]: [...(d[memberId] || []), { ...dest, id: 'd' + Date.now() }],
    }))
  }, [])

  const updateDestination = useCallback((memberId, destId, patch) => {
    setDestinations((d) => ({
      ...d,
      [memberId]: (d[memberId] || []).map((x) => (x.id === destId ? { ...x, ...patch } : x)),
    }))
  }, [])

  const removeDestination = useCallback((memberId, destId) => {
    setDestinations((d) => ({
      ...d,
      [memberId]: (d[memberId] || []).filter((x) => x.id !== destId),
    }))
  }, [])

  const addNoGoZone = useCallback((memberId, zone) => {
    setNoGoZones((z) => ({
      ...z,
      [memberId]: [...(z[memberId] || []), { ...zone, id: 'z' + Date.now() }],
    }))
  }, [])

  const removeNoGoZone = useCallback((memberId, zoneId) => {
    setNoGoZones((z) => ({
      ...z,
      [memberId]: (z[memberId] || []).filter((x) => x.id !== zoneId),
    }))
  }, [])

  const updateNoGoZone = useCallback((memberId, zoneId, patch) => {
    setNoGoZones((z) => ({
      ...z,
      [memberId]: (z[memberId] || []).map((x) => (x.id === zoneId ? { ...x, ...patch } : x)),
    }))
  }, [])

  const addRoute = useCallback((memberId, route) => {
    setRoutes((r) => ({
      ...r,
      [memberId]: [...(r[memberId] || []), { ...route, id: 'r' + Date.now() }],
    }))
  }, [])
  const removeRoute = useCallback((memberId, routeId) => {
    setRoutes((r) => ({
      ...r,
      [memberId]: (r[memberId] || []).filter((x) => x.id !== routeId),
    }))
  }, [])

  const updateInactivityAlert = useCallback((memberId, settings) => {
    setInactivityAlert((a) => ({ ...a, [memberId]: { ...(a[memberId] || {}), ...settings } }))
  }, [])
  const updateAlertTypes = useCallback((memberId, patch) => {
    setAlertTypes((t) => ({ ...t, [memberId]: { ...(t[memberId] || {}), ...patch } }))
  }, [])

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [{ ...alert, id: String(Date.now()) }, ...prev])
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      setAuthLoading(true)
      try {
        const me = await getMe()
        if (!cancelled) setCurrentUser(me)
      } catch {
        if (!cancelled) setCurrentUser(null)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }
    // încearcă încărcarea profilului dacă există token
    try {
      if (localStorage.getItem('auth_token')) {
        loadMe()
      } else {
        setAuthLoading(false)
      }
    } catch {
      setAuthLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadDevices() {
      try {
        const devs = await listDevices()
        if (cancelled) return
        const mapped = (devs || []).map((d) => ({
          id: d.device_id,
          label: d.label,
          msisdn: d.msisdn_target,
          status: 'stationary',
          lastLocation: null,
          lastUpdated: null,
          live_tracking_mode: !!d.live_tracking_mode,
          live_tracking_until: d.live_tracking_until || null,
        }))
        setLinkedMembers(mapped)
      } catch {
        // ignoră erorile de fetch când nu avem token
      }
    }
    if (!authLoading && currentUser) loadDevices()
    return () => {
      cancelled = true
    }
  }, [authLoading, currentUser])

  const refreshDevices = useCallback(async () => {
    try {
      const devs = await listDevices()
      const mapped = (devs || []).map((d) => ({
        id: d.device_id,
        label: d.label,
        msisdn: d.msisdn_target,
        status: 'stationary',
        lastLocation: null,
        lastUpdated: null,
        live_tracking_mode: !!d.live_tracking_mode,
        live_tracking_until: d.live_tracking_until || null,
      }))
      setLinkedMembers(mapped)
    } catch {}
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('auth_token')
    } catch {}
    setCurrentUser(null)
  }, [])

  const value = {
    currentUser,
    setCurrentUser,
    authLoading,
    logout,
    refreshDevices,
    linkedMembers,
    alerts,
    destinations,
    noGoZones,
    routes,
    inactivityAlert,
    notificationSettings,
    setNotificationSettings,
    alertTypes,
    updateAlertTypes,
    addMember,
    revokeMember,
    addDestination,
    addNoGoZone,
    updateNoGoZone,
    removeNoGoZone,
    addRoute,
    removeRoute,
    updateDestination,
    removeDestination,
    updateInactivityAlert,
    setLiveTrackingState,
    addAlert,
    getDestinations: (memberId) => destinations[memberId] || [],
    getNoGoZones: (memberId) => noGoZones[memberId] || [],
    getRoutes: (memberId) => routes[memberId] || [],
    getInactivityAlert: (memberId) => inactivityAlert[memberId] || { enabled: false, minutes: 20, safeZoneDestinationIds: [] },
    getAlertTypes: (memberId) => alertTypes[memberId] || { no_go: true, deviation: true, inactivity: true },
    TRANSPORT_MODES,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
