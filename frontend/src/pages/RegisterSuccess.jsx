import { Link, useLocation } from 'react-router-dom'
import styles from './Auth.module.css'

export function RegisterSuccess() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const email = params.get('email') || ''
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cont creat cu succes</h1>
        <p className={styles.subtitle}>
          Urmează să primești un mail de validare pe adresa {email}.
        </p>
        <p className={styles.footer}>
          Mergi la <Link to="/login" className={styles.link}>Autentificare</Link>
        </p>
      </div>
    </div>
  )
}
