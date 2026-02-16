import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { patchMe, getMe } from '../api/auth'
import styles from './Dashboard.module.css'

export function Profile() {
  const { currentUser, setCurrentUser } = useApp()
  const [email, setEmail] = useState(currentUser?.email || '')
  const [msisdn, setMsisdn] = useState(currentUser?.msisdn_admin || '')
  const [pref, setPref] = useState(currentUser?.notification_pref || { push: true, sms: true, smsWhenNoInternet: true, smsOnNoGoZone: true, smsOnDeviation: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [demoMode, setDemoMode] = useState(() => {
    try {
      return localStorage.getItem('demo_mode') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || '')
      setMsisdn(currentUser.msisdn_admin || '')
      setPref(currentUser.notification_pref || {})
    }
  }, [currentUser])

  const onSave = async () => {
    setError('')
    setOk(false)
    setSaving(true)
    try {
      await patchMe({ email, msisdn_admin: msisdn, notification_pref: pref })
      const me = await getMe()
      setCurrentUser(me)
      setOk(true)
    } catch (e) {
      setError(e.message || 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (k) => setPref((p) => ({ ...p, [k]: !p?.[k] }))

  return (
    <div className={styles.dashboard}>
      <nav className={styles.breadcrumb}>
        <Link to="/dashboard">Panou</Link>
        <span className={styles.sep}>/</span>
        <span>Profil</span>
      </nav>
      <div className={styles.header}>
        <h1 className={styles.title}>Profil utilizator</h1>
        <p className={styles.subtitle}>Actualizează emailul, numărul administrativ și preferințele de notificare.</p>
      </div>
      {error && <p className={styles.muted} style={{ color: 'var(--color-danger, #d00)' }}>{error}</p>}
      {ok && <p className={styles.muted} style={{ color: 'var(--color-success, #0a0)' }}>Salvat.</p>}
      <div className={styles.section}>
        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={styles.label}>
          Telefon administrare (MSISDN)
          <input className={styles.input} type="tel" value={msisdn} onChange={(e) => setMsisdn(e.target.value)} />
        </label>
      </div>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Mod demo</h2>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => {
              setDemoMode(e.target.checked)
              try {
                localStorage.setItem('demo_mode', e.target.checked ? '1' : '0')
              } catch {}
            }}
          />
          <span>Activează mod demo (autentificare rapidă din Login)</span>
        </label>
        <p className={styles.hint}>
          În modul demo, butonul din pagina de autentificare intră direct în contul demonstrativ.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Preferințe notificări</h2>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={!!pref.push} onChange={() => toggle('push')} /> <span>Push</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={!!pref.sms} onChange={() => toggle('sms')} /> <span>SMS</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={!!pref.smsWhenNoInternet} onChange={() => toggle('smsWhenNoInternet')} /> <span>SMS când nu am internet</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={!!pref.smsOnNoGoZone} onChange={() => toggle('smsOnNoGoZone')} /> <span>SMS la No-Go</span>
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={!!pref.smsOnDeviation} onChange={() => toggle('smsOnDeviation')} /> <span>SMS la deviere traseu</span>
        </label>
      </div>
      <button className={styles.primaryBtn} onClick={onSave} disabled={saving}>{saving ? 'Se salvează…' : 'Salvează'}</button>
    </div>
  )
}
