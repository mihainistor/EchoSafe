import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'

export function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      navigate(`/reset-password/sent?email=${encodeURIComponent(email)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Resetare parolă</h1>
        <p className={styles.subtitle}>
          Introdu adresa de email folosită la crearea contului. Dacă există un cont asociat, vei primi un email cu instrucțiuni de resetare.
        </p>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Adresă email
            <input
              type="email"
              className={styles.input}
              placeholder="email@exemplu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <button type="submit" className={`${styles.submit} btn btn--primary btn--lg`} disabled={loading}>
            {loading ? 'Se încarcă…' : 'Trimite link de resetare'}
          </button>
        </form>
      </div>
    </div>
  )
}
