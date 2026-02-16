import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { createDevice, validateDeviceOtp } from '../../api/client'
import styles from './AddMember.module.css'

const steps = [
  { id: 'info', title: 'Date membru' },
  { id: 'otp', title: 'Cod activare' },
  { id: 'done', title: 'Confirmare' },
]

export function AddMember() {
  const navigate = useNavigate()
  const { addMember, refreshDevices } = useApp()
  const [step, setStep] = useState(0)
  const [msisdn, setMsisdn] = useState('')
  const [label, setLabel] = useState('')
  const [otp, setOtp] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  const handleSubmitInfo = async (e) => {
    e.preventDefault()
    setError('')
    if (!msisdn.trim() || !label.trim()) return
    const normalized = msisdn.replace(/\D/g, '')
    if (!/^07\d{8}$/.test(normalized)) {
      setError('Numărul trebuie să aibă 10 cifre și să înceapă cu 07')
      return
    }
    setLoading(true)
    try {
      const res = await createDevice({ msisdn_target: normalized, label: label.trim() })
      setDeviceId(res.device_id)
      setSmsSent(true)
      setStep(1)
    } catch (err) {
      setError(err.message || 'Eroare la inițiere onboarding')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (otp.length < 4 || !deviceId) return
    setLoading(true)
    try {
      await validateDeviceOtp(deviceId, otp)
      await refreshDevices()
      addMember({
        label: label.trim(),
        msisdn: msisdn.replace(/\D/g, ''),
        linkedAt: new Date().toISOString(),
        status: 'stationary',
        lastLocation: null,
        lastUpdated: null,
      })
      setStep(2)
    } catch (err) {
      setError(err.message || 'OTP invalid')
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    navigate('/dashboard')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <nav className={styles.breadcrumb}>
          <Link to="/dashboard">Panou</Link>
          <span className={styles.sep}>/</span>
          <Link to="/dashboard/member">Familie</Link>
          <span className={styles.sep}>/</span>
          <span>Adaugă membru</span>
        </nav>

        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={i <= step ? styles.stepActive : styles.step}
            >
              {i + 1}. {s.title}
            </div>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {step === 0 && (
          <form onSubmit={handleSubmitInfo} className={styles.form}>
            <h1 className={styles.title}>Legare cont membru (GDPR)</h1>
            <p className={styles.subtitle}>
              Introdu numărul de telefon al membrului și un nume (ex: Andrei). Membrul va primi un SMS
              cu un cod de activare pe care trebuie să îl introduci mai jos.
            </p>
            <label className={styles.label}>
              Nume / Label
              <input
                type="text"
                className={styles.input}
                placeholder="ex: Andrei"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </label>
            <label className={styles.label}>
              Număr telefon membru
              <input
                type="tel"
                className={styles.input}
                placeholder="ex: 0722123456"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                pattern="07\\d{8}"
                maxLength={10}
                title="10 cifre, trebuie să înceapă cu 07"
                required
              />
            </label>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Se trimite…' : 'Trimite SMS cu cod activare'}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmitOtp} className={styles.form}>
            <h1 className={styles.title}>Introdu codul primit pe telefonul membrului</h1>
            <p className={styles.subtitle}>
              Am trimis SMS către {msisdn}: „Numărul tău dorește să activeze EchoSafe. Codul tău:
              XXXXX”. Introdu codul OTP mai jos.
            </p>
            {demoMode && (
              <p className={styles.subtitle}>
                Mod demo activ: orice cod OTP introdus va fi acceptat.
              </p>
            )}
            <label className={styles.label}>
              Cod OTP
              <input
                type="text"
                className={styles.input}
                placeholder="ex: 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </label>
            <button type="submit" className={styles.submit} disabled={otp.length < 4 || loading}>
              {loading ? 'Se validează…' : 'Validează și creează legătura'}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setStep(0)}
            >
              Înapoi
            </button>
          </form>
        )}

        {step === 2 && (
          <div className={styles.done}>
            <h1 className={styles.title}>Legătura a fost creată</h1>
            <p className={styles.subtitle}>
              {label} este acum legat de contul tău. Poți defini trasee, destinații și zone
              interzise din panoul membrului.
            </p>
            <button type="button" className={styles.submit} onClick={handleDone}>
              Merg la Panou
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
