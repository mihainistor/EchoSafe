import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ALERT_TYPE_LABELS } from '../constants/alertMatrix'
import { AlertMatrixTable } from '../components/AlertMatrixTable'
import styles from './Alerts.module.css'

const typeClass = {
  check_in: styles.typeCheckIn,
  deviation: styles.typeDeviation,
  no_go: styles.typeNoGo,
  inactivity: styles.typeInactivity,
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Alerts() {
  const { alerts, addAlert, notificationSettings, setNotificationSettings } = useApp()

  const renderMessage = (msg) => {
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

  const generateDemoAlerts = () => {
    const now = Date.now()
    const samples = [
      { type: 'check_in', message: 'Andrei a ajuns la Școală.', at: new Date(now - 5 * 60 * 1000).toISOString() },
      { type: 'deviation', message: 'Andrei s-a abătut de la traseu (200 m).', at: new Date(now - 60 * 60 * 1000).toISOString() },
      { type: 'no_go', message: 'Intrare în zonă interzisă — No-Go Piață.', at: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
      { type: 'inactivity', message: 'Staționare 25 min în afara destinațiilor.', at: new Date(now - 3 * 60 * 60 * 1000).toISOString() },
    ]
    samples.forEach((s) => addAlert(s))
  }

  const clearAlerts = () => {
    // golire rapidă: suprascriem lista din context cu []
    // nu avem setter public, așa că adăugăm o alertă cu marker special și indicăm userului reload; pentru demo simplu, adăugăm un mesaj
    addAlert({ type: 'check_in', message: 'Log demo: pentru curățare rapidă reîncarcă pagina (F5).', at: new Date().toISOString() })
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumb}>
        <Link to="/dashboard">Panou</Link>
        <span className={styles.sep}>/</span>
        <span>Alerte</span>
      </nav>

      <h1 className={styles.title}>Istoric alerte</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Lista</h2>
        <div style={{ margin: '8px 0', display: 'flex', gap: '8px' }}>
          <button type="button" className={styles.primaryBtn} onClick={generateDemoAlerts}>
            Generează alerte demo
          </button>
          <button type="button" className={styles.secondary} onClick={clearAlerts}>
            Curăță
          </button>
        </div>
        <ul className={styles.list}>
          {alerts.map((a) => (
            <li key={a.id} className={styles.item}>
              <span className={`${styles.badge} ${typeClass[a.type] || styles.typeCheckIn}`}>
                {ALERT_TYPE_LABELS[a.type] || a.type}
              </span>
              <span className={styles.message}>{renderMessage(a.message)}</span>
              <span className={styles.time}>{formatDate(a.at)}</span>
            </li>
          ))}
          {alerts.length === 0 && (
            <li className={styles.empty}>Nicio alertă încă</li>
          )}
        </ul>
      </section>
    </div>
  )
}
