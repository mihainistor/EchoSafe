import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { setLiveTracking as apiSetLiveTracking, getDeviceLocation, getDeviceReachability } from '../../api/client'
import { LiveMap } from '../../components/LiveMap'
import { AddressAutocomplete } from '../../components/AddressAutocomplete'
import { RouteBuilder } from '../../components/RouteBuilder'
import styles from './MemberDetail.module.css'

const LIVE_AUTO_STOP_MIN = 10

const statusLabels = {
  on_route: 'Pe traseu (interogare la 10 min)',
  off_route: 'În afara traseului (interogare la 1 min)',
  stationary: 'Stationar (interogare la 10 min)',
}

const dayNames = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm']
const transportLabels = { pedestrian: 'Pieton', bicycle: 'Bicicletă', transit: 'Transport în comun', car: 'Autoturism' }

const NO_GO_TYPES = [
  { value: 'permanent', label: 'Permanentă (24/7)' },
  { value: 'scheduled', label: 'Programabilă (interval orar)' },
  { value: 'adhoc', label: 'Ad-hoc (o singură zi)' },
]

const STATIONARY_MINUTES = [10, 20, 30]

export function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    linkedMembers,
    getDestinations,
    getNoGoZones,
    getRoutes,
    getInactivityAlert,
    getAlertTypes,
    addDestination,
    updateDestination,
    removeDestination,
    revokeMember,
    addNoGoZone,
    updateNoGoZone,
    removeNoGoZone,
    addRoute,
    removeRoute,
    updateInactivityAlert,
    updateAlertTypes,
    setLiveTrackingState,
    addAlert,
  } = useApp()
  const [showRevoke, setShowRevoke] = useState(false)
  const [liveTrackingLoading, setLiveTrackingLoading] = useState(false)
  const [liveTrackingError, setLiveTrackingError] = useState(null)
  const [liveCountdownSec, setLiveCountdownSec] = useState(null)
  const [showAddDest, setShowAddDest] = useState(false)
  const [showAddZone, setShowAddZone] = useState(false)
  const [showAddRoute, setShowAddRoute] = useState(false)
  const [loc, setLoc] = useState(null)
  const [locError, setLocError] = useState('')
  const [locLoading, setLocLoading] = useState(false)
  const [reach, setReach] = useState(null)
  const [reachError, setReachError] = useState('')
  const [reachDemo, setReachDemo] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)
  const [mapPoi, setMapPoi] = useState(null)

  const [zoneName, setZoneName] = useState('')
  const [zoneAddress, setZoneAddress] = useState('')
  const [zoneRadius, setZoneRadius] = useState(200)
  const [zoneType, setZoneType] = useState('permanent')
  const [zoneStartTime, setZoneStartTime] = useState('20:00')
  const [zoneEndTime, setZoneEndTime] = useState('06:00')
  const [zoneAdhocDate, setZoneAdhocDate] = useState(new Date().toISOString().slice(0, 10))
  const [zonePick, setZonePick] = useState(null)
  const [zoneError, setZoneError] = useState('')
  const [editingZoneId, setEditingZoneId] = useState(null)
  const [editZName, setEditZName] = useState('')
  const [editZAddress, setEditZAddress] = useState('')
  const [editZRadius, setEditZRadius] = useState(200)
  const [editZType, setEditZType] = useState('permanent')
  const [editZStart, setEditZStart] = useState('08:00')
  const [editZEnd, setEditZEnd] = useState('17:00')
  const [editZPick, setEditZPick] = useState(null)

  const [destName, setDestName] = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [destRadius, setDestRadius] = useState(100)
  const [destPick, setDestPick] = useState(null)

  const [editingDestId, setEditingDestId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editRadius, setEditRadius] = useState(100)

  const child = linkedMembers.find((c) => c.id === id)
  const destinations = getDestinations(id)
  const noGoZones = getNoGoZones(id)
  const routes = getRoutes(id)
  const inactivitySettings = getInactivityAlert(id)
  const alertTypeToggles = getAlertTypes(id)
  const liveOn = !!child?.live_tracking_mode
  const liveUntil = child?.live_tracking_until ? new Date(child.live_tracking_until).getTime() : null

  useEffect(() => {
    if (!liveOn || !liveUntil) {
      setLiveCountdownSec(null)
      return
    }
    const tick = () => {
      const left = Math.max(0, Math.round((liveUntil - Date.now()) / 1000))
      setLiveCountdownSec(left)
      if (left <= 0) setLiveTrackingState(id, { live_tracking_mode: false, live_tracking_until: null })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [liveOn, liveUntil, id, setLiveTrackingState])

  useEffect(() => {
    let t
    async function fetchLoc() {
      setLocError('')
      try {
        const data = await getDeviceLocation(id, { maxAge: 300 })
        setLoc({ lat: data.lat, lng: data.lng, accuracy: data.accuracy || 0, last: data.lastLocationTime })
        setMapCenter({ lat: data.lat, lng: data.lng })
      } catch (e) {
        setLocError(e.message || 'Eroare locație')
      }
    }
    async function fetchReach() {
      setReachError('')
      try {
        const r = await getDeviceReachability(id)
        setReach(r.reachabilityStatus || r.status || null)
        setReachDemo(!!r.demo)
      } catch (e) {
        setReachError(e.message || 'Eroare reachability')
      }
    }
    fetchLoc()
    fetchReach()
    if (liveOn) {
      t = setInterval(() => {
        fetchLoc()
        fetchReach()
      }, 60000)
    }
    return () => t && clearInterval(t)
  }, [id, liveOn])

  const refreshLocation = async () => {
    setLocLoading(true)
    setLocError('')
    try {
      const data = await getDeviceLocation(id, { maxAge: 0 })
      setLoc({ lat: data.lat, lng: data.lng, accuracy: data.accuracy || 0, last: data.lastLocationTime })
      setMapCenter({ lat: data.lat, lng: data.lng })
    } catch (e) {
      setLocError(e.message || 'Eroare locație')
    } finally {
      setLocLoading(false)
    }
  }

  const reachLabel = (r) => {
    if (r === 'CONNECTED_DATA') return 'Date'
    if (r === 'CONNECTED_SMS') return 'SMS'
    if (r === 'NOT_CONNECTED') return 'Neconectat'
    return 'necunoscut'
  }

  const handleLiveTracking = async (enabled) => {
    setLiveTrackingError(null)
    setLiveTrackingLoading(true)
    try {
      const data = await apiSetLiveTracking(id, enabled)
      setLiveTrackingState(id, {
        live_tracking_mode: data.live_tracking_mode,
        live_tracking_until: data.live_tracking_until || null,
      })
    } catch (e) {
      setLiveTrackingError(e.message || 'Eroare la setare Live Tracking')
    } finally {
      setLiveTrackingLoading(false)
    }
  }

  if (!child) {
    return (
      <div className={styles.wrapper}>
        <p>Membru negăsit.</p>
        <Link to="/dashboard/member">Înapoi la listă</Link>
      </div>
    )
  }

  const handleRevoke = () => {
    revokeMember(id)
    navigate('/dashboard/member')
  }

  const handleAddNoGo = () => {
    if (!zoneName.trim()) {
      setZoneError('Numele zonei este obligatoriu')
      return
    }
    const zone = {
      name: zoneName.trim(),
      lat: zonePick?.lat ?? 44.43,
      lng: zonePick?.lng ?? 26.1,
      radiusMeters: Number(zoneRadius) || 200,
      type: zoneType,
      address: zoneAddress.trim() || undefined,
    }
    if (zoneType === 'scheduled') {
      zone.scheduleStartTime = zoneStartTime
      zone.scheduleEndTime = zoneEndTime
    }
    if (zoneType === 'adhoc') {
      zone.adhocDate = zoneAdhocDate
    }
    addNoGoZone(id, zone)
    setZoneError('')
    setZoneName('')
    setZoneAddress('')
    setZoneRadius(200)
    setZonePick(null)
    setZoneType('permanent')
    setShowAddZone(false)
  }

  const toggleSafeZone = (destId) => {
    const current = inactivitySettings.safeZoneDestinationIds || []
    const next = current.includes(destId)
      ? current.filter((x) => x !== destId)
      : [...current, destId]
    updateInactivityAlert(id, { safeZoneDestinationIds: next })
  }

  const handleAddDestination = () => {
    if (!destName.trim()) return
    const radius = Number(destRadius) || 100
    const lat = destPick?.lat != null ? Number(destPick.lat) : 44.4268
    const lng = destPick?.lng != null ? Number(destPick.lng) : 26.1025
    addDestination(id, {
      name: destName.trim(),
      lat,
      lng,
      radiusMeters: radius,
      address: destAddress.trim() || undefined,
    })
    setDestName('')
    setDestAddress('')
    setDestRadius(100)
    setDestPick(null)
    setShowAddDest(false)
  }

  /* removed inline autocomplete logic in favor of AddressAutocomplete component */

  const beginEditDest = (d) => {
    setEditingDestId(d.id)
    setEditName(d.name || '')
    setEditAddress(d.address || '')
    setEditRadius(d.radiusMeters || 100)
  }

  const saveEditDest = () => {
    if (!editingDestId) return
    let patch = { name: editName.trim(), address: editAddress.trim() || undefined, radiusMeters: Number(editRadius) || 100 }
    if (destPick?.lat != null && destPick?.lng != null) {
      patch = { ...patch, lat: destPick.lat, lng: destPick.lng }
    }
    updateDestination(id, editingDestId, patch)
    setEditingDestId(null)
  }

  const cancelEditDest = () => {
    setEditingDestId(null)
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <Link to="/dashboard">Panou</Link>
        <span className={styles.sep}>/</span>
          <Link to="/dashboard/member">Familie</Link>
        <span className={styles.sep}>/</span>
        <span>{child.label}</span>
      </nav>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{child.label}</h1>
          <p className={styles.msisdn}>{child.msisdn}</p>
          <p className={styles.pollingStatus}>{statusLabels[child.status]}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.liveStartBtn}
            disabled={liveTrackingLoading}
            onClick={() => handleLiveTracking(!liveOn)}
          >
            {liveOn ? 'Oprește' : 'Live'}
          </button>
          {liveCountdownSec != null && (
            <>
              <span className={styles.liveBadge}>LIVE</span>
              <span className={styles.liveCountdown}>
                {Math.floor(liveCountdownSec / 60)}:{String(liveCountdownSec % 60).padStart(2, '0')}
              </span>
            </>
          )}
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Locație curentă</h2>
        {loc?.demo && (
          <p className={styles.hint} style={{ border: '1px solid var(--color-border)', padding: '8px', borderRadius: '8px', background: 'var(--color-bg)' }}>
            Locație demo afișată – conectează Orange pentru date reale.
          </p>
        )}
        <div className={styles.actionsRow}>
          <div className={styles.connectivityInline}>
            <span className={styles.hint}>Conectivitate:</span>
            {reach ? (
              <span
                className={
                  reach === 'CONNECTED_DATA'
                    ? `${styles.reachBadge} ${styles.reachData}`
                    : reach === 'CONNECTED_SMS'
                    ? `${styles.reachBadge} ${styles.reachSms}`
                    : `${styles.reachBadge} ${styles.reachNone}`
                }
                title={reach}
              >
                {reachLabel(reach)}
              </span>
            ) : (
              <span className={`${styles.reachBadge} ${styles.reachNone}`}>necunoscut</span>
            )}
            {reachDemo && <span className={styles.hint} title="Date demo">demo</span>}
          </div>
          <div className={styles.actionsRight}>
            <button type="button" className={styles.smallBtn} onClick={refreshLocation} disabled={locLoading}>
              {locLoading ? 'Se actualizează…' : 'Actualizează locația'}
            </button>
          </div>
        </div>
        <LiveMap
          lat={loc?.lat}
          lng={loc?.lng}
          accuracy={loc?.accuracy}
          height={240}
          centerLat={mapCenter?.lat}
          centerLng={mapCenter?.lng}
          poiLat={mapPoi?.lat}
          poiLng={mapPoi?.lng}
          poiRadius={mapPoi?.radius}
        />
        {locError && <p className={styles.liveError}>{locError}</p>}
        {loc?.last && <p className={styles.updated}>Actualizat: {new Date(loc.last).toLocaleString('ro-RO')}</p>}
        <div style={{ margin: '8px 0' }}>
          <button
            type="button"
            className={styles.smallBtn}
            onClick={() => {
              const label = child?.label || 'Membru'
              addAlert({
                type: 'check_in',
                memberLabel: label,
                message: `${label} — Check-in demo înregistrat.`,
                at: new Date().toISOString(),
              })
            }}
          >
            Check-in demo
          </button>
        </div>
        {reachError && <p className={styles.liveError}>{reachError}</p>}
        <div className={styles.legend}>
          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendData}`} /> Date</span>
          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendSms}`} /> SMS</span>
          <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendNone}`} /> Necunoscut</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Destinații</h2>
          <button type="button" className={styles.smallBtn} onClick={() => setShowAddDest(!showAddDest)}>
            + Adaugă
          </button>
        </div>
        <p className={styles.hint}>
          La intrarea membrului într-o destinație primești notificare: „{child.label} a ajuns la [Nume]”. Pot fi folosite și ca Safe Zones (fără alertă staționare).
        </p>
        {showAddDest && (
          <div className={styles.formCard}>
            <input
              type="text"
              placeholder="Nume (ex: Școală)"
              className={styles.input}
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
            />
            <AddressAutocomplete
              value={destAddress}
              onChange={setDestAddress}
              onSelect={(s) => setDestPick({ lat: s.lat, lng: s.lng })}
              placeholder="Adresă"
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Rază (m)"
              className={styles.input}
              value={destRadius}
              onChange={(e) => setDestRadius(e.target.value)}
              min={10}
              step={10}
            />
            <button type="button" className={styles.primaryBtn} onClick={handleAddDestination}>Salvează</button>
          </div>
        )}
        {destinations.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nume</th>
                  <th>Adresă</th>
                  <th>Rază (m)</th>
                  <th>Coordonate</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((d, idx) => {
                  const isEdit = editingDestId === d.id
                  return (
                    <tr key={d.id}>
                      <td>{idx + 1}</td>
                      <td>
                        {isEdit ? (
                          <input className={styles.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                        ) : (
                          d.name
                        )}
                      </td>
                      <td className={styles.addrCell}>
                        {isEdit ? (
                          <AddressAutocomplete
                            value={editAddress}
                            onChange={setEditAddress}
                            onSelect={(s) => {
                              setEditAddress(s.label)
                              setDestPick({ lat: s.lat, lng: s.lng })
                            }}
                            placeholder="Adresă"
                            className={styles.input}
                          />
                        ) : (
                          <span className={styles.truncate} title={d.address || '—'}>
                            {d.address || '—'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEdit ? (
                          <input
                            type="number"
                            className={styles.input}
                            value={editRadius}
                            onChange={(e) => setEditRadius(e.target.value)}
                            min={10}
                            step={10}
                            style={{ width: 100 }}
                          />
                        ) : (
                          d.radiusMeters
                        )}
                      </td>
                      <td>
                        {Number.isFinite(d.lat) && Number.isFinite(d.lng) ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}` : '—'}
                      </td>
                      <td>
                        {!isEdit ? (
                          <div className={styles.tableActions}>
                        <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => {
                                setMapCenter({ lat: d.lat, lng: d.lng })
                                setMapPoi({ lat: d.lat, lng: d.lng, radius: d.radiusMeters || 0 })
                              }}
                            >
                              Vezi pe hartă
                            </button>
                            <button type="button" className={styles.smallBtn} onClick={() => beginEditDest(d)}>
                              Editare
                            </button>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => {
                                const ok = window.confirm(`Ștergi destinația „${d.name}”?`)
                                if (ok) removeDestination(id, d.id)
                              }}
                            >
                              Ștergere
                            </button>
                          </div>
                        ) : (
                          <div className={styles.tableActions}>
                            <button type="button" className={styles.smallBtn} onClick={saveEditDest}>
                              Salvează
                            </button>
                            <button type="button" className={styles.smallBtn} onClick={cancelEditDest}>
                              Anulează
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !showAddDest && <p className={styles.listItemMuted}>Nicio destinație definită</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Zone No-Go</h2>
          <button type="button" className={styles.smallBtn} onClick={() => setShowAddZone(!showAddZone)}>
            + Adaugă
          </button>
        </div>
        <p className={styles.hint}>
          Definirea de zone interzise ajută la siguranță: vei primi alertă dacă membrul intră în aceste zone.
        </p>
        {showAddZone && (
          <div className={styles.formCard}>
            <input type="text" placeholder="Nume (ex: Centru vechi)" className={styles.input} value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
            {zoneError && <div className={styles.liveError}>{zoneError}</div>}
            <AddressAutocomplete
              value={zoneAddress}
              onChange={setZoneAddress}
              onSelect={(s) => setZonePick({ lat: s.lat, lng: s.lng })}
              placeholder="Adresă"
              className={styles.input}
            />
            <input type="number" placeholder="Rază (m)" className={styles.input} value={zoneRadius} onChange={(e) => setZoneRadius(e.target.value)} />
            <select className={styles.select} value={zoneType} onChange={(e) => setZoneType(e.target.value)}>
              {NO_GO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {zoneType === 'scheduled' && (
              <div className={styles.timeRow}>
                <select
                  className={styles.select}
                  value={zoneStartTime.split(':')[0]}
                  onChange={(e) => setZoneStartTime(`${String(e.target.value).padStart(2, '0')}:${zoneStartTime.split(':')[1] || '00'}`)}
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                    <option key={`sh-${h}`} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={styles.select}
                  value={zoneStartTime.split(':')[1] || '00'}
                  onChange={(e) => setZoneStartTime(`${zoneStartTime.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                >
                  {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                    const mm = String(m).padStart(2, '0')
                    return <option key={`sm-${mm}`} value={mm}>{mm}</option>
                  })}
                </select>
                <span>–</span>
                <select
                  className={styles.select}
                  value={zoneEndTime.split(':')[0]}
                  onChange={(e) => setZoneEndTime(`${String(e.target.value).padStart(2, '0')}:${zoneEndTime.split(':')[1] || '00'}`)}
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                    <option key={`eh-${h}`} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={styles.select}
                  value={zoneEndTime.split(':')[1] || '00'}
                  onChange={(e) => setZoneEndTime(`${zoneEndTime.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                >
                  {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                    const mm = String(m).padStart(2, '0')
                    return <option key={`em-${mm}`} value={mm}>{mm}</option>
                  })}
                </select>
              </div>
            )}
            {zoneType === 'adhoc' && (
              <div className={styles.timeRow}>
                <input type="date" className={styles.input} value={zoneAdhocDate} onChange={(e) => setZoneAdhocDate(e.target.value)} />
              </div>
            )}
            <button type="button" className={styles.primaryBtn} onClick={handleAddNoGo}>Salvează</button>
          </div>
        )}
        {noGoZones.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nume</th>
                  <th>Adresă</th>
                  <th>Rază (m)</th>
                  <th>Coordonate</th>
                  <th>Tip</th>
                  <th>Program</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {noGoZones.map((z, idx) => {
                  const isEdit = editingZoneId === z.id
                  return (
                    <tr key={z.id}>
                      <td>{idx + 1}</td>
                      <td>
                        {isEdit ? (
                          <input className={styles.input} value={editZName} onChange={(e) => setEditZName(e.target.value)} />
                        ) : (
                          z.name
                        )}
                      </td>
                      <td className={styles.addrCell}>
                        {isEdit ? (
                          <AddressAutocomplete
                            value={editZAddress}
                            onChange={setEditZAddress}
                            onSelect={(s) => setEditZPick({ lat: s.lat, lng: s.lng })}
                            placeholder="Adresă"
                            className={styles.input}
                          />
                        ) : (
                          <span className={styles.truncate} title={z.address || '—'}>{z.address || '—'}</span>
                        )}
                      </td>
                      <td>
                        {isEdit ? (
                          <input
                            type="number"
                            className={styles.input}
                            value={editZRadius}
                            onChange={(e) => setEditZRadius(e.target.value)}
                            min={10}
                            step={10}
                            style={{ width: 100 }}
                          />
                        ) : (
                          z.radiusMeters
                        )}
                      </td>
                      <td>{Number.isFinite(z.lat) && Number.isFinite(z.lng) ? `${z.lat.toFixed(4)}, ${z.lng.toFixed(4)}` : '—'}</td>
                      <td>
                        {isEdit ? (
                          <select className={styles.select} value={editZType} onChange={(e) => setEditZType(e.target.value)}>
                            {NO_GO_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        ) : (
                          z.type
                        )}
                      </td>
                      <td>
                        {isEdit ? (
                          editZType === 'scheduled' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <select
                                className={styles.select}
                                value={editZStart.split(':')[0]}
                                onChange={(e) => setEditZStart(`${String(e.target.value).padStart(2, '0')}:${editZStart.split(':')[1] || '00'}`)}
                              >
                                {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                                  <option key={`ezsh-${h}`} value={h}>{h}</option>
                                ))}
                              </select>
                              <select
                                className={styles.select}
                                value={editZStart.split(':')[1] || '00'}
                                onChange={(e) => setEditZStart(`${editZStart.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                              >
                                {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                                  const mm = String(m).padStart(2, '0')
                                  return <option key={`ezsm-${mm}`} value={mm}>{mm}</option>
                                })}
                              </select>
                              <span>–</span>
                              <select
                                className={styles.select}
                                value={editZEnd.split(':')[0]}
                                onChange={(e) => setEditZEnd(`${String(e.target.value).padStart(2, '0')}:${editZEnd.split(':')[1] || '00'}`)}
                              >
                                {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                                  <option key={`ezeh-${h}`} value={h}>{h}</option>
                                ))}
                              </select>
                              <select
                                className={styles.select}
                                value={editZEnd.split(':')[1] || '00'}
                                onChange={(e) => setEditZEnd(`${editZEnd.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                              >
                                {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                                  const mm = String(m).padStart(2, '0')
                                  return <option key={`ezem-${mm}`} value={mm}>{mm}</option>
                                })}
                              </select>
                            </div>
                          ) : (
                            '—'
                          )
                        ) : (
                          z.type === 'scheduled' && z.scheduleStartTime && z.scheduleEndTime ? `${z.scheduleStartTime}–${z.scheduleEndTime}` : '—'
                        )}
                      </td>
                      <td>
                        {!isEdit ? (
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => {
                                setMapCenter({ lat: z.lat, lng: z.lng })
                                setMapPoi({ lat: z.lat, lng: z.lng, radius: z.radiusMeters || 0 })
                              }}
                            >
                              Vezi pe hartă
                            </button>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => {
                                setEditingZoneId(z.id)
                                setEditZName(z.name || '')
                                setEditZAddress(z.address || '')
                                setEditZRadius(z.radiusMeters || 200)
                                setEditZType(z.type || 'permanent')
                                setEditZStart(z.scheduleStartTime || '08:00')
                                setEditZEnd(z.scheduleEndTime || '17:00')
                                setEditZPick(null)
                              }}
                            >
                              Editare
                            </button>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => {
                                const ok = window.confirm(`Ștergi zona „${z.name}”?`)
                                if (ok) removeNoGoZone(id, z.id)
                              }}
                            >
                              Ștergere
                            </button>
                          </div>
                        ) : (
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              className={styles.smallBtn}
                              onClick={() => {
                                const patch = {
                                  name: editZName.trim(),
                                  address: editZAddress.trim() || undefined,
                                  radiusMeters: Number(editZRadius) || 200,
                                  type: editZType,
                                }
                                if (editZType === 'scheduled') {
                                  patch.scheduleStartTime = editZStart
                                  patch.scheduleEndTime = editZEnd
                                } else {
                                  patch.scheduleStartTime = undefined
                                  patch.scheduleEndTime = undefined
                                }
                                if (editZPick?.lat != null && editZPick?.lng != null) {
                                  patch.lat = editZPick.lat
                                  patch.lng = editZPick.lng
                                }
                                updateNoGoZone(id, z.id, patch)
                                setEditingZoneId(null)
                              }}
                            >
                              Salvează
                            </button>
                            <button type="button" className={styles.smallBtn} onClick={() => setEditingZoneId(null)}>
                              Anulează
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !showAddZone && <p className={styles.listItemMuted}>Nicio zonă definită</p>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Trasee</h2>
          <button type="button" className={styles.smallBtn} onClick={() => setShowAddRoute(!showAddRoute)}>
            + Adaugă
          </button>
        </div>
        <p className={styles.hint}>
          Definirea unor trasee preferate ajută la monitorizare eficientă. La părăsirea traseului vei primi alertă.
        </p>
        {showAddRoute && (
          <>
            <RouteBuilder destinations={destinations} onAddRoute={addRoute} childId={id} />
          </>
        )}
        <ul className={styles.list}>
          {routes.map((r) => {
            const days = r.daysOfWeek
              ? r.daysOfWeek.map((d) => dayNames[d]).join(', ')
              : (r.dayOfWeek != null ? dayNames[r.dayOfWeek] : (r.day || ''))
            const transport = transportLabels[r.transportMode] || transportLabels[r.transport] || r.transportMode || r.transport || ''
            const assigned = (r.assignedTo && r.assignedTo.length > 0)
              ? r.assignedTo.map((mid) => (linkedMembers.find((m) => m.id === mid)?.label || mid)).join(', ')
              : (linkedMembers.find((m) => m.id === id)?.label || '')
            return (
              <li key={r.id} className={styles.listItem}>
                <strong>{r.name}</strong>
                <span className={styles.meta}> — {days} · {transport} · Alocat: {assigned}</span>
                <span className={styles.tableActions} style={{ marginLeft: 8 }}>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => {
                      const ok = window.confirm(`Ștergi traseul „${r.name}”?`)
                      if (ok) removeRoute(id, r.id)
                    }}
                  >
                    Șterge
                  </button>
                </span>
              </li>
            )
          })}
          {routes.length === 0 && !showAddRoute && <li className={styles.listItemMuted}>Niciun traseu definit</li>}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Configurare alerte</h2>
        </div>
        <p className={styles.hint}>
          Activează tipurile de alerte dorite. Pentru staționare prelungită poți seta durata și zonele sigure.
        </p>
        <div className={styles.inactivityCard}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={!!alertTypeToggles.no_go}
              onChange={(e) => updateAlertTypes(id, { no_go: e.target.checked })}
            />
            Intrare în zonă No-Go
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={!!alertTypeToggles.deviation}
              onChange={(e) => updateAlertTypes(id, { deviation: e.target.checked })}
            />
            Abatere de la traseu
          </label>
        </div>
        <div className={styles.inactivityCard}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={inactivitySettings.enabled}
              onChange={(e) => updateInactivityAlert(id, { enabled: e.target.checked })}
            />
            Staționare prelungită
          </label>
          <div className={styles.timeRow} style={{ display: inactivitySettings.enabled ? 'flex' : 'none' }}>
            <select
              className={styles.select}
              value={inactivitySettings.minutes || 10}
              onChange={(e) => updateInactivityAlert(id, { minutes: Number(e.target.value) })}
            >
              {STATIONARY_MINUTES.map((m) => (
                <option key={m} value={m}>{m} minute</option>
              ))}
            </select>
            <div>
              <div className={styles.safeZonesLabel}>Safe Zones (nu trimit alertă la staționare):</div>
              <div className={styles.safeZones}>
                {destinations.map((d) => (
                  <label key={d.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={(inactivitySettings.safeZoneDestinationIds || []).includes(d.id)}
                      onChange={() => toggleSafeZone(d.id)}
                    />
                    {d.name}
                  </label>
                ))}
                {destinations.length === 0 && <span className={styles.muted}>Nu există destinații</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      

      <section className={styles.section}>
        <div className={styles.revokeActions}>
          {!showRevoke ? (
            <button type="button" className={styles.dangerOutline} onClick={() => setShowRevoke(true)}>
              Șterge membru
            </button>
          ) : (
            <div className={styles.revokeConfirm}>
              <p className={styles.muted}>Confirmi ștergerea membrului {child.label}?</p>
              <div className={styles.revokeActions}>
                <button type="button" className={styles.dangerBtn} onClick={handleRevoke}>Da, revocă</button>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowRevoke(false)}>Anulează</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
