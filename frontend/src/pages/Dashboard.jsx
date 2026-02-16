import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { setLiveTracking as apiSetLiveTracking } from '../api/client'
import styles from './Dashboard.module.css'

const statusLabels = {
  on_route: 'Pe traseu',
  off_route: 'În afara traseului',
  stationary: 'Stationar',
}

const statusHint = {
  on_route: 'Interogare la 10 min',
  off_route: 'Interogare la 1 min',
  stationary: 'Interogare la 10 min',
}

export function Dashboard() {
  const { linkedMembers, alerts, addAlert, setLiveTrackingState } = useApp()
  const recentAlerts = alerts.slice(0, 3)
  const [tick, setTick] = useState(0)
  const renderAlertMessage = (msg) => {
    const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g
    const nodes = []
    let lastIndex = 0
    let m
    while ((m = urlRegex.exec(msg)) !== null) {
      if (m.index > lastIndex) nodes.push(msg.slice(lastIndex, m.index))
      const href = m[0]
      const isMap = href.includes('maps.google.com') || href.includes('google.com/maps')
      if (href.startsWith('/')) nodes.push(<Link key={`${href}-${m.index}`} to={href}>Vezi detalii</Link>)
      else nodes.push(<a key={`${href}-${m.index}`} href={href} target="_blank" rel="noopener noreferrer">{isMap ? 'Vezi hartă' : href}</a>)
      lastIndex = m.index + m[0].length
    }
    if (lastIndex < msg.length) nodes.push(msg.slice(lastIndex))
    return nodes
  }
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const [demoMode, setDemoMode] = useState(() => {
    try {
      return localStorage.getItem('demo_mode') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'demo_mode') setDemoMode(e.newValue === '1')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const [liveBusy, setLiveBusy] = useState({})
  const startLive = async (id) => {
    setLiveBusy((b) => ({ ...b, [id]: true }))
    try {
      await apiSetLiveTracking(id, true)
      setLiveTrackingState(id, { live_tracking_mode: true, live_tracking_until: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
    } catch {
      // ignore
    } finally {
      setLiveBusy((b) => ({ ...b, [id]: false }))
    }
  }
  const stopLive = async (id) => {
    setLiveBusy((b) => ({ ...b, [id]: true }))
    try {
      await apiSetLiveTracking(id, false)
      setLiveTrackingState(id, { live_tracking_mode: false, live_tracking_until: null })
    } catch {
      // ignore
    } finally {
      setLiveBusy((b) => ({ ...b, [id]: false }))
    }
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Panou de control</h1>
        <p className={styles.subtitle}>
          Localizare inteligentă (adaptive polling), destinații, trasee și alerte.
        </p>
      </div>
      {demoMode && (
        <div className={styles.demoBanner}>
          <span>Mod demo activ — folosești date demonstrative pentru locație și reachability.</span>
          <Link to="/dashboard/profile" className={styles.demoLink}>Setări demo</Link>
        </div>
      )}

      <div className={styles.quickLinks}>
        <Link to="/dashboard/member" className={styles.quickCard}>
          <span className={styles.quickIcon}>👤</span>
          <span className={styles.quickLabel}>Membri familie</span>
          <span className={styles.quickCount}>{linkedMembers.length}</span>
        </Link>
        <Link to="/dashboard/time-machine" className={styles.quickCard}>
          <span className={styles.quickIcon}>🕐</span>
          <span className={styles.quickLabel}>Istoric Locatie</span>
          <span className={styles.quickHint}>Traseu & heatmap</span>
        </Link>
        <Link to="/dashboard/alerts" className={styles.quickCard}>
          <span className={styles.quickIcon}>🔔</span>
          <span className={styles.quickLabel}>Alerte</span>
          <span className={styles.quickCount}>{alerts.length}</span>
        </Link>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Membri familie — status localizare</h2>
        <p className={styles.hint}>
          In cazul in care exista un traseu definit pentru membru familiei, actualizarea locatiei se va face o data la 10 minute. Daca nu exista un traseu definit, actualizarea se va face la 5 minute. Daca membrul se abate de la traseu, actualizarea se va face la 1 minut.
        </p>
        {linkedMembers.length === 0 ? (
          <div className={styles.empty}>
            <p>Nu ai membri de familie adăugați. Legătura se face prin consimțământ OTP (GDPR).</p>
            <Link to="/dashboard/member/add" className={styles.cta}>Adaugă membru</Link>
          </div>
        ) : (
          <ul className={styles.memberList}>
            {linkedMembers.map((child) => (
              <li key={child.id} className={styles.memberCard}>
                <div className={styles.memberInfo}>
                  <strong>{child.label}</strong>
                  <span className={styles.memberMsisdn}>{child.msisdn}</span>
                  <span className={styles.memberStatus}>
                    {statusLabels[child.status]} — {statusHint[child.status]}
                  </span>
                </div>
                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    className={
                      child.live_tracking_mode
                        ? `${styles.smallBtn} ${styles.smallBtnLiveActive}`
                        : styles.smallBtn
                    }
                    onClick={() => (child.live_tracking_mode ? stopLive(child.id) : startLive(child.id))}
                    disabled={!!liveBusy[child.id]}
                    title={child.live_tracking_mode ? 'Oprește Live' : 'Activează Live 10 min'}
                  >
                    Live
                  </button>
                  {child.live_tracking_mode && child.live_tracking_until && (
                    <span className={styles.countdown} title="Timp rămas Live">
                      {(() => {
                        const left = Math.max(0, Math.round((new Date(child.live_tracking_until).getTime() - Date.now()) / 1000))
                        const mm = String(Math.floor(left / 60)).padStart(2, '0')
                        const ss = String(left % 60).padStart(2, '0')
                        return `${mm}:${ss}`
                      })()}
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => {
                      const now = new Date()
                      const time = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
                      const loc = child.lastLocation
                      const link =
                        loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)
                          ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
                          : `/dashboard/member/${child.id}`
                      addAlert({
                        type: 'deviation',
                        memberLabel: child.label,
                        message: `${child.label} s-a abătut de la traseu la ora ${time}. Ultima locație: ${link}`,
                        at: now.toISOString(),
                      })
                    }}
                  >
                    Simulează deviere
                  </button>
                  <button
                    type="button"
                    className={styles.smallBtn}
                    onClick={() => {
                      const now = new Date()
                      const time = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
                      const loc = child.lastLocation
                      const link =
                        loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)
                          ? `https://maps.google.com/?q=${loc.lat},${loc.lng}`
                          : `/dashboard/member/${child.id}`
                      addAlert({
                        type: 'no_go',
                        memberLabel: child.label,
                        message: `${child.label} a intrat într-o zonă No-Go la ora ${time}. Ultima locație: ${link}`,
                        at: now.toISOString(),
                      })
                    }}
                  >
                    Simulează zona No-Go
                  </button>
                  <Link to={`/dashboard/member/${child.id}`} className={styles.memberLink}>
                    Detaliu & hartă →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Alerte recente</h2>
        {recentAlerts.length === 0 ? (
          <p className={styles.muted}>Nicio alertă încă.</p>
        ) : (
          <ul className={styles.alertList}>
            {recentAlerts.map((a) => (
              <li key={a.id} className={styles.alertItem}>
                <span className={styles.alertMessage}>{renderAlertMessage(a.message)}</span>
                <span className={styles.alertTime}>
                  {new Date(a.at).toLocaleString('ro-RO', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/dashboard/alerts" className={styles.seeAll}>Vezi toate alertele →</Link>
      </section>
    </div>
  )
}
