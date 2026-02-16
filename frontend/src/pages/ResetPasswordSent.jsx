import { Link, useLocation } from 'react-router-dom'
import styles from './Auth.module.css'

export function ResetPasswordSent() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const email = params.get('email') || ''
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verifică-ți emailul</h1>
        <p className={styles.subtitle}>
          Dacă există un cont asociat adresei {email}, vei primi în curând un email cu instrucțiuni pentru resetarea parolei.
        </p>
        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>Înapoi la autentificare</Link>
        </p>
      </div>
    </div>
  )
}
