import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents, Marker } from 'react-leaflet'
import L from 'leaflet'
import { MapPlaceholder } from './MapPlaceholder'
import styles from './RouteBuilder.module.css'
import { AddressAutocomplete } from './AddressAutocomplete'
import { useApp } from '../context/AppContext'

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const TRANSPORT_OPTIONS = [
  { value: 'pedestrian', label: 'Pieton' },
  { value: 'bicycle', label: 'Bicicletă' },
  { value: 'transit', label: 'Transport în comun' },
  { value: 'car', label: 'Autoturism' },
]

const DAYS = [
  { value: 1, label: 'Luni' },
  { value: 2, label: 'Marți' },
  { value: 3, label: 'Miercuri' },
  { value: 4, label: 'Joi' },
  { value: 5, label: 'Vineri' },
  { value: 6, label: 'Sâmbătă' },
  { value: 0, label: 'Duminică' },
]

function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (!coords || coords.length === 0) return
    const latlngs = coords.map(([lat, lng]) => [lat, lng])
    map.fitBounds(latlngs, { padding: [20, 20] })
  }, [coords, map])
  return null
}

export function RouteBuilder({ destinations = [], onAddRoute, childId }) {
  const { linkedMembers } = useApp()
  const [mode, setMode] = useState('smart') // smart | freehand
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [fromPick, setFromPick] = useState(null)
  const [toPick, setToPick] = useState(null)
  const [routeName, setRouteName] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState(childId ? [childId] : [])
  const [transportMode, setTransportMode] = useState('pedestrian')
  const [bufferMeters, setBufferMeters] = useState(50)
  const [daysOfWeek, setDaysOfWeek] = useState([1])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [drawPoints, setDrawPoints] = useState([])
  const [drawError, setDrawError] = useState('')
  const [freeEtaText, setFreeEtaText] = useState('')
  const [calcError, setCalcError] = useState('')
  const [etaText, setEtaText] = useState('')
  const [routeCoords, setRouteCoords] = useState(null)

  const handleSmartSubmit = (e) => {
    e.preventDefault()
    setCalcError('')
    setEtaText('')
    setRouteCoords(null)
    if (!fromAddress.trim() || !toAddress.trim()) {
      setCalcError('Completează ambele adrese')
      return
    }
    if (!fromPick || !toPick) {
      setCalcError('Selectează adrese din lista de sugestii pentru a calcula ruta')
      return
    }
    const profile =
      transportMode === 'car' ? 'driving' :
      transportMode === 'bicycle' ? 'cycling' :
      'walking'
    const url = `https://router.project-osrm.org/route/v1/${profile}/${fromPick.lng},${fromPick.lat};${toPick.lng},${toPick.lat}?overview=full&geometries=geojson`
    ;(async () => {
      try {
        let coords = null
        let duration = null
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error('OSRM indisponibil')
          const data = await res.json()
          const route = data?.routes?.[0]
          if (route?.geometry?.coordinates) {
            coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          }
          if (route?.duration != null) {
            duration = route.duration // seconds
          }
        } catch {
          const R = 6371e3
          const φ1 = fromPick.lat * Math.PI / 180
          const φ2 = toPick.lat * Math.PI / 180
          const Δφ = (toPick.lat - fromPick.lat) * Math.PI / 180
          const Δλ = (toPick.lng - fromPick.lng) * Math.PI / 180
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          const d = R * c // meters
          const speedKmh =
            transportMode === 'car' ? 40 :
            transportMode === 'bicycle' ? 15 :
            transportMode === 'transit' ? 25 : 5
          duration = (d / 1000) / speedKmh * 3600
          coords = [[fromPick.lat, fromPick.lng], [toPick.lat, toPick.lng]]
        }
        const mins = Math.round(duration / 60)
        const h = Math.floor(mins / 60)
        const m = mins % 60
        setEtaText(h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} minute`)
        setRouteCoords(coords)
      } catch (e2) {
        setCalcError('Nu s-a putut calcula traseul')
      }
    })()
  }

  useEffect(() => {
    if (!drawPoints || drawPoints.length < 2) {
      setFreeEtaText('')
      return
    }
    let dist = 0
    const R = 6371e3
    for (let i = 1; i < drawPoints.length; i++) {
      const [lat1, lon1] = drawPoints[i - 1]
      const [lat2, lon2] = drawPoints[i]
      const φ1 = lat1 * Math.PI / 180
      const φ2 = lat2 * Math.PI / 180
      const Δφ = (lat2 - lat1) * Math.PI / 180
      const Δλ = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      dist += R * c
    }
    const speedKmh =
      transportMode === 'car' ? 40 :
      transportMode === 'bicycle' ? 15 :
      transportMode === 'transit' ? 25 : 5
    const durationSec = (dist / 1000) / speedKmh * 3600
    const mins = Math.round(durationSec / 60)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    setFreeEtaText(h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} minute`)
  }, [drawPoints, transportMode])

  const handleSave = () => {
    if (!routeCoords || !fromPick || !toPick) return
    const name = routeName.trim() || `${fromAddress} → ${toAddress}`
    const targets = selectedMemberIds.length ? selectedMemberIds : (childId ? [childId] : [])
    targets.forEach((mid) => {
      onAddRoute(mid, {
        type: 'smart',
        name,
        fromAddress: fromAddress.trim(),
        toAddress: toAddress.trim(),
        fromLat: fromPick.lat,
        fromLng: fromPick.lng,
        toLat: toPick.lat,
        toLng: toPick.lng,
        transportMode,
        bufferMeters: Number(bufferMeters) || 50,
        corridorMeters: Number(bufferMeters) || 50,
        daysOfWeek,
        startTime,
        endTime,
        etaMinutes: etaText ? Number(etaText.match(/\d+/)?.[0] || 0) : undefined,
        assignedTo: targets,
      })
    })
    setFromAddress('')
    setToAddress('')
    setFromPick(null)
    setToPick(null)
    // păstrăm harta și ETA pe ecran după salvare
  }

  const handleFreehandSave = () => {
    setDrawError('')
    if (!drawPoints || drawPoints.length < 2) {
      setDrawError('Desenează cel puțin două puncte pe hartă')
      return
    }
    const name = routeName.trim() || 'Traseu desenat'
    const targets = selectedMemberIds.length ? selectedMemberIds : (childId ? [childId] : [])
    targets.forEach((mid) => {
      onAddRoute(mid, {
        type: 'freehand',
        name,
        transportMode,
        bufferMeters: Number(bufferMeters) || 50,
        corridorMeters: Number(bufferMeters) || 50,
        daysOfWeek,
        startTime,
        endTime,
        points: drawPoints.map(([lat, lng]) => ({ lat, lng })),
        assignedTo: targets,
      })
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === 'smart' ? styles.tabActive : styles.tab}
          onClick={() => setMode('smart')}
        >
          Smart Path (generare automată)
        </button>
        <button
          type="button"
          className={mode === 'freehand' ? styles.tabActive : styles.tab}
          onClick={() => setMode('freehand')}
        >
          Desenare manuală (free-hand)
        </button>
      </div>

      {mode === 'smart' && (
        <form onSubmit={handleSmartSubmit} className={styles.form}>
          <p className={styles.hint}>
            Punct plecare și destinație. Traseul optim (cel mai scurt timp) se calculează via motor de routing (ex: Google Directions API).
          </p>
          <label className={styles.label}>
            Nume traseu
            <input
              type="text"
              className={styles.input}
              placeholder="ex: Acasă → Școală"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Alocă membrilor
            <div className={styles.timeRow}>
              {linkedMembers.map((m) => (
                <label key={m.id} className={styles.checkbox} style={{ marginRight: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(m.id)}
                    onChange={(e) => {
                      setSelectedMemberIds((prev) =>
                        e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)
                      )
                    }}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </label>
          <label className={styles.label}>
            Punct plecare
            <AddressAutocomplete
              value={fromAddress}
              onChange={setFromAddress}
              onSelect={(s) => setFromPick({ lat: s.lat, lng: s.lng })}
              placeholder="Adresă sau nume (ex: Acasă)"
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Punct destinație
            <AddressAutocomplete
              value={toAddress}
              onChange={setToAddress}
              onSelect={(s) => setToPick({ lat: s.lat, lng: s.lng })}
              placeholder="Adresă sau nume (ex: Școală)"
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Mijloc de transport
            <select
              className={styles.select}
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
            >
              {TRANSPORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <div className={styles.row}>
            <label className={styles.label}>
              Zilele săptămânii
              <div className={styles.timeRow}>
                {DAYS.map((d) => (
                  <label key={d.value} className={styles.checkbox} style={{ marginRight: 8 }}>
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(d.value)}
                      onChange={(e) => {
                        setDaysOfWeek((prev) =>
                          e.target.checked ? [...prev, d.value] : prev.filter((x) => x !== d.value)
                        )
                      }}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </label>
          </div>
          <label className={styles.label}>
            Buffer / coridor de toleranță (m)
            <input
              type="number"
              min={10}
              max={500}
              step={10}
              className={styles.input}
              value={bufferMeters}
              onChange={(e) => setBufferMeters(e.target.value)}
            />
          </label>
          <p className={styles.smallHint}>Ieșirea din acest coridor declanșează interogare la 1 min. Implicit: 50 m.</p>
          <div className={styles.row}>
            <label className={styles.label}>
              Interval orar
              <div className={styles.timeRow}>
                <select
                  className={styles.select}
                  value={startTime.split(':')[0]}
                  onChange={(e) => setStartTime(`${String(e.target.value).padStart(2, '0')}:${startTime.split(':')[1] || '00'}`)}
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                    <option key={`rsh-${h}`} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={styles.select}
                  value={startTime.split(':')[1] || '00'}
                  onChange={(e) => setStartTime(`${startTime.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                >
                  {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                    const mm = String(m).padStart(2, '0')
                    return <option key={`rsm-${mm}`} value={mm}>{mm}</option>
                  })}
                </select>
                <span>–</span>
                <select
                  className={styles.select}
                  value={endTime.split(':')[0]}
                  onChange={(e) => setEndTime(`${String(e.target.value).padStart(2, '0')}:${endTime.split(':')[1] || '00'}`)}
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                    <option key={`reh-${h}`} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={styles.select}
                  value={endTime.split(':')[1] || '00'}
                  onChange={(e) => setEndTime(`${endTime.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                >
                  {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                    const mm = String(m).padStart(2, '0')
                    return <option key={`rem-${mm}`} value={mm}>{mm}</option>
                  })}
                </select>
              </div>
            </label>
          </div>
          {calcError && <p className={styles.smallHint} style={{ color: 'var(--color-error)' }}>{calcError}</p>}
          <div className={styles.actionsRow}>
            <button type="submit" className={styles.primaryBtn}>
              Calculează traseu
            </button>
            {routeCoords && (
              <button type="button" className={styles.secondaryBtn} onClick={handleSave}>
                Salvează
              </button>
            )}
          </div>
          {etaText && <p className={styles.hint}>Timp estimat: {etaText}</p>}
          {routeCoords && (
            <div style={{ marginTop: 12 }}>
              <MapContainer center={[44.4268, 26.1025]} zoom={13} style={{ height: 240, width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={routeCoords} pathOptions={{ color: '#2b6cb0' }} />
                <FitBounds coords={routeCoords} />
              </MapContainer>
            </div>
          )}
        </form>
      )}

      {mode === 'freehand' && (
        <div className={styles.freehand}>
          <p className={styles.hint}>
            Desenează cu mouse-ul sau degetul traseul pe hartă (scurtături prin parcuri, zone pietonale). Apoi setează buffer-ul și intervalul.
          </p>
          <label className={styles.label}>
            Nume traseu
            <input
              type="text"
              className={styles.input}
              placeholder="ex: Drumul spre parc"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Alocă membrilor
            <div className={styles.timeRow}>
              {linkedMembers.map((m) => (
                <label key={m.id} className={styles.checkbox} style={{ marginRight: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(m.id)}
                    onChange={(e) => {
                      setSelectedMemberIds((prev) =>
                        e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)
                      )
                    }}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </label>
          <div className={styles.mapWrap}>
            <MapContainer center={[44.4268, 26.1025]} zoom={13} style={{ height: 300, width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FreehandEvents
                onAddPoint={(latlng) => setDrawPoints((p) => [...p, [latlng.lat, latlng.lng]])}
                onUndo={() => setDrawPoints((p) => p.slice(0, -1))}
              />
              {drawPoints.length > 0 && (
                <>
                  <Polyline positions={drawPoints} pathOptions={{ color: '#dc2626' }} />
                  {drawPoints.map(([lat, lng], i) => (
                    <Marker
                      key={`${lat}-${lng}-${i}`}
                      position={[lat, lng]}
                      draggable
                      icon={pinIcon}
                      eventHandlers={{
                        dragend: (e) => {
                          const { lat: nlat, lng: nlng } = e.target.getLatLng()
                          setDrawPoints((pts) => pts.map((p, idx) => (idx === i ? [nlat, nlng] : p)))
                        },
                      }}
                    />
                  ))}
                </>
              )}
            </MapContainer>
          </div>
          {drawError && <p className={styles.smallHint} style={{ color: 'var(--color-error)' }}>{drawError}</p>}
          <label className={styles.label}>
            Buffer / coridor de toleranță (m)
            <input
              type="number"
              min={10}
              max={500}
              step={10}
              className={styles.input}
              value={bufferMeters}
              onChange={(e) => setBufferMeters(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Mijloc de transport
            <select
              className={styles.select}
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
            >
              {TRANSPORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <div className={styles.row}>
            <label className={styles.label}>
              Zile
              <div className={styles.timeRow}>
                {DAYS.map((d) => (
                  <label key={d.value} className={styles.checkbox} style={{ marginRight: 8 }}>
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(d.value)}
                      onChange={(e) => {
                        setDaysOfWeek((prev) =>
                          e.target.checked ? [...prev, d.value] : prev.filter((x) => x !== d.value)
                        )
                      }}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </label>
            <label className={styles.label}>
              Interval orar
              <div className={styles.timeRow}>
                <select
                  className={styles.select}
                  value={startTime.split(':')[0]}
                  onChange={(e) => setStartTime(`${String(e.target.value).padStart(2, '0')}:${startTime.split(':')[1] || '00'}`)}
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                    <option key={`frsh-${h}`} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={styles.select}
                  value={startTime.split(':')[1] || '00'}
                  onChange={(e) => setStartTime(`${startTime.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                >
                  {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                    const mm = String(m).padStart(2, '0')
                    return <option key={`frsm-${mm}`} value={mm}>{mm}</option>
                  })}
                </select>
                <span>–</span>
                <select
                  className={styles.select}
                  value={endTime.split(':')[0]}
                  onChange={(e) => setEndTime(`${String(e.target.value).padStart(2, '0')}:${endTime.split(':')[1] || '00'}`)}
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                    <option key={`freh-${h}`} value={h}>{h}</option>
                  ))}
                </select>
                <select
                  className={styles.select}
                  value={endTime.split(':')[1] || '00'}
                  onChange={(e) => setEndTime(`${endTime.split(':')[0]}:${String(e.target.value).padStart(2, '0')}`)}
                >
                  {Array.from({ length: 60 }, (_, m) => m).filter((m) => m % 5 === 0).map((m) => {
                    const mm = String(m).padStart(2, '0')
                    return <option key={`frem-${mm}`} value={mm}>{mm}</option>
                  })}
                </select>
              </div>
            </label>
          </div>
          <div className={styles.actionsRow}>
            <button type="button" className={styles.secondaryBtn} onClick={() => setDrawPoints([])}>
              Reset
            </button>
            <button type="button" className={styles.primaryBtn} onClick={handleFreehandSave}>
              Salvează traseul desenat
            </button>
          </div>
          {freeEtaText && <p className={styles.hint}>Timp estimat: {freeEtaText}</p>}
        </div>
      )}
    </div>
  )
}
function FreehandEvents({ onAddPoint, onUndo }) {
  useMapEvents({
    click(e) {
      onAddPoint(e.latlng)
    },
    contextmenu() {
      onUndo()
    },
  })
  return null
}
