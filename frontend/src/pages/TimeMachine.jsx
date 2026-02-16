import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MapContainer, TileLayer, Polyline, Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import { getDeviceLocationHistory } from '../api/client'
import styles from './TimeMachine.module.css'

export function TimeMachine() {
  const { linkedMembers } = useApp()
  const [mode, setMode] = useState('replay') // replay | heatmap
  const [selectedChild, setSelectedChild] = useState(linkedMembers[0]?.id || '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [heatmapRange, setHeatmapRange] = useState('30') // zile
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(null)
  const [heat, setHeat] = useState(null)
  const [heatRadius] = useState(40)
  const [selectedRoute, setSelectedRoute] = useState(null)

  const points = history?.points || []
  const center = useMemo(() => {
    if (points.length) return [points[0].lat, points[0].lng]
    return [44.4268, 26.1025]
  }, [points])

  const icon = useMemo(() => L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }), [])

  const fetchHistory = async () => {
    if (!selectedChild) return
    const from = new Date(`${date}T${startTime}:00`).toISOString()
    const to = new Date(`${date}T${endTime}:00`).toISOString()
    setLoading(true)
    setError('')
    try {
      const data = await getDeviceLocationHistory(selectedChild, { from, to })
      setHistory(data)
    } catch (e) {
      setError(e.message || 'Eroare la încărcarea istoricului')
    } finally {
      setLoading(false)
    }
  }

  const fetchHeat = async () => {
    if (!selectedChild) return
    const now = new Date()
    const from = new Date(now.getTime() - Number(heatmapRange) * 24 * 60 * 60 * 1000).toISOString()
    setLoading(true)
    setError('')
    try {
      const data = await getDeviceLocationHistory(selectedChild, { from, to: now.toISOString() })
      // Binning simplu pe grid (~0.001° ~ 100–120m)
      const bin = {}
      for (const p of data.points || []) {
        const key = `${(p.lat).toFixed(3)},${(p.lng).toFixed(3)}`
        bin[key] = (bin[key] || 0) + 1
      }
      const max = Object.values(bin).reduce((m, v) => Math.max(m, v), 1)
      const cells = Object.entries(bin).map(([k, count]) => {
        const [la, ln] = k.split(',').map(Number)
        return { lat: la, lng: ln, count, weight: count / max }
      })
      setHeat({ cells, demo: data.demo })
    } catch (e) {
      setError(e.message || 'Eroare la încărcarea heatmap')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // auto load when child/date/time changes (optional)
    // fetchHistory()
  }, []) // eslint-disable-line

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <Link to="/dashboard">Panou</Link>
        <span className={styles.sep}>/</span>
        <span>Istoric Locatie</span>
      </nav>

      <h1 className={styles.title}>Istoric Locatie — Istoric & redare</h1>
      <p className={styles.subtitle}>
        Retenție 30 zile. Redare traseu pe interval orar sau heatmap zone frecventate.
      </p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === 'replay' ? styles.tabActive : styles.tab}
          onClick={() => setMode('replay')}
        >
          Redare traseu
        </button>
        <button
          type="button"
          className={mode === 'heatmap' ? styles.tabActive : styles.tab}
          onClick={() => setMode('heatmap')}
        >
          Heatmap
        </button>
      </div>

      <div className={styles.controls}>
        <label className={styles.label}>
          Membru
          <select
            className={styles.select}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
          >
            {linkedMembers.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
            {linkedMembers.length === 0 && (
              <option value="">— Adaugă un membru mai întâi —</option>
            )}
          </select>
        </label>

        {mode === 'replay' && (
          <>
            <label className={styles.label}>
              Dată
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Interval orar
              <div className={styles.timeRange}>
                <input
                  type="time"
                  className={styles.input}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <span>–</span>
                <input
                  type="time"
                  className={styles.input}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </label>
            <button
              type="button"
              className={`${styles.primaryBtn} btn btn--primary`}
              onClick={fetchHistory}
              disabled={loading || !selectedChild}
            >
              {loading ? 'Se încarcă…' : 'Redă traseul'}
            </button>
          </>
        )}

        {mode === 'heatmap' && (
          <>
            <label className={styles.label}>
              Ultimele (zile)
              <select
                className={styles.select}
                value={heatmapRange}
                onChange={(e) => setHeatmapRange(e.target.value)}
              >
                <option value="7">7 zile</option>
                <option value="14">14 zile</option>
                <option value="30">30 zile</option>
              </select>
            </label>
          </>
        )}
      </div>

      <section className={styles.mapSection}>
        {mode === 'replay' && (
          <div>
            <div style={{ marginBottom: 8 }}>
              {history?.demo && (
                <span className={styles.subtitle} style={{ marginLeft: 12 }}>Istoric demo (fără Orange)</span>
              )}
              {points.length > 0 && (
                <button
                  type="button"
                  className={`${styles.smallBtn} btn btn--sm`}
                  style={{ marginLeft: 12 }}
                  onClick={() => {
                    const csv = ['timestamp,lat,lng,speedKmh,reachability'].concat(
                      points.map(p => `${p.timestamp},${p.lat},${p.lng},${p.speedKmh || ''},${p.reachability || ''}`)
                    ).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `track_${date}_${startTime}_${endTime}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Export CSV
                </button>
              )}
            </div>
            {history?.routes && history.routes.length > 0 && (
              <div className={styles.routesPanel}>
                <div className={styles.routesHeader}>
                  <h3 className={styles.routesTitle}>Trasee înregistrate</h3>
                  <button type="button" className={styles.clearBtn} onClick={() => setSelectedRoute(null)}>Afișează toate</button>
                </div>
                <table className={styles.routesTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Start</th>
                      <th>Stop</th>
                      <th>Puncte</th>
                      <th>Durată</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.routes
                      .map((r, idx) => {
                        const start = r[0]?.timestamp ? new Date(r[0].timestamp) : null
                        const end = r[r.length - 1]?.timestamp ? new Date(r[r.length - 1].timestamp) : null
                        const durMin = start && end ? Math.max(1, Math.round((end - start) / 60000)) : r.length
                        return { r, idx, start, end, durMin }
                      })
                      .sort((a, b) => (b.start?.getTime() || 0) - (a.start?.getTime() || 0))
                      .map((x, i) => {
                        const colorPalette = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f43f5e','#a855f7','#14b8a6']
                        const color = colorPalette[x.idx % colorPalette.length]
                        const startLabel = x.start ? x.start.toLocaleString() : '-'
                        const endLabel = x.end ? x.end.toLocaleString() : '-'
                        return (
                          <tr
                            key={`row-${x.idx}`}
                            className={styles.routeRow}
                            onClick={() => setSelectedRoute(x.idx)}
                          >
                            <td><span className={styles.badge} style={{ backgroundColor: color }} />{i + 1}</td>
                            <td>{startLabel}</td>
                            <td>{endLabel}</td>
                            <td>{x.r.length}</td>
                            <td>{x.durMin} min</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
            <div className={styles.mapBox}>
              <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {(history?.routes && history.routes.length > 0) ? (
                  <>
                    {(selectedRoute != null ? history.routes.map((r, i) => ({ r, i })).filter(x => x.i === selectedRoute) : history.routes.map((r, i) => ({ r, i }))).map(({ r: route, i: ridx }) => {
                      const colorPalette = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f43f5e','#a855f7','#14b8a6']
                      const color = colorPalette[ridx % colorPalette.length]
                      return (
                        <div key={`r${ridx}`}>
                          {route.slice(1).map((p, idx) => {
                            const prev = route[idx]
                            return (
                              <Polyline key={`r${ridx}-${idx}`} positions={[[prev.lat, prev.lng], [p.lat, p.lng]]} pathOptions={{ color, weight: 3, opacity: 0.85 }} />
                            )
                          })}
                          {route.length > 0 && (
                            <>
                              <Marker position={[route[0].lat, route[0].lng]} icon={icon} />
                              <Marker position={[route[route.length - 1].lat, route[route.length - 1].lng]} icon={icon} />
                            </>
                          )}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <>
                    {points.length > 0 && (
                      <>
                        {points.slice(1).map((p, idx) => {
                          const prev = points[idx]
                          const color = (p.speedKmh || 0) > 20 ? '#2563eb' : (p.speedKmh || 0) > 12 ? '#10b981' : '#f59e0b'
                          return (
                            <Polyline key={idx} positions={[[prev.lat, prev.lng], [p.lat, p.lng]]} pathOptions={{ color, weight: 4, opacity: 0.9 }} />
                          )
                        })}
                        <Marker position={[points[0].lat, points[0].lng]} icon={icon} />
                        <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]} icon={icon} />
                        {points.filter(p => (p.speedKmh || 0) < 3).map((p, i) => (
                          <Circle key={`s${i}`} center={[p.lat, p.lng]} radius={25} pathOptions={{ color: '#ef4444', fillOpacity: 0.15 }} />
                        ))}
                      </>
                    )}
                  </>
                )}
              </MapContainer>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}
        {mode === 'heatmap' && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <button type="button" className={styles.primaryBtn} onClick={fetchHeat} disabled={loading || !selectedChild}>
                {loading ? 'Se încarcă…' : 'Afișează heatmap'}
              </button>
              {heat?.demo && (
                <span className={styles.subtitle} style={{ marginLeft: 12 }}>Heatmap demo (fără Orange/DB)</span>
              )}
              <button
                type="button"
                className={`${styles.smallBtn} btn btn--sm`}
                style={{ marginLeft: 12 }}
                onClick={() => setHeat(null)}
              >
                Curăță
              </button>
            </div>
            <div style={{ height: 420 }}>
              <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {heat?.cells?.map((c, idx) => {
              const w = c.weight
              const color = w > 0.66 ? '#ef4444' : w > 0.33 ? '#f59e0b' : '#10b981'
              return (
                <Circle
                  key={idx}
                  center={[c.lat, c.lng]}
                  radius={heatRadius}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.25 + 0.35 * w, opacity: 0.7 }}
                />
              )
            })}
          </MapContainer>
        </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}
      </section>
    </div>
  )
}
