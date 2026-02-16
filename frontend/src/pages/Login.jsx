import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import styles from './Auth.module.css'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(() => {
    try {
      return localStorage.getItem('demo_mode') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'demo_mode') {
        setDemoMode(e.newValue === '1')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const creds = demoMode
        ? { email: 'demo@example.com', password: 'Passw0rd!' }
        : { email, password }
      await login(creds)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Eroare autentificare')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>{demoMode ? 'Autentificare demo' : 'Autentificare'}</h1>
        <p className={styles.subtitle}>
          {demoMode
            ? 'Mod Demo activ: poți intra fără a completa câmpurile.'
            : 'Intră în contul EchoSafe pentru a accesa panoul de control.'}
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              placeholder="exemplu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={demoMode}
              required
            />
          </label>
          <label className={styles.label}>
            Parolă
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={demoMode}
              required
            />
          </label>
          <button
            type="submit"
            className={`${styles.submit} btn btn--primary btn--lg`}
            disabled={loading}
          >
            {loading ? 'Se încarcă…' : demoMode ? 'Intră în demo' : 'Intră în cont'}
          </button>
        </form>
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate('/reset-password')}
          >
            Resetare parolă
          </button>
        </div>
        <p className={styles.footer}>
          Nu ai cont? <Link to="/register" className={styles.link}>Înregistrează-te</Link>
        </p>
      </div>
    </div>
  )
}
