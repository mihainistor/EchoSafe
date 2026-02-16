import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo-orange.svg" alt="" width="24" height="24" />
            <strong>EchoSafe</strong>
          </div>
          <nav className={styles.footLinks}>
            <a className={styles.footLink} href="#" aria-label="Termeni și condiții">Termeni</a>
            <a className={styles.footLink} href="#" aria-label="Politica de confidențialitate">Confidențialitate</a>
            <a className={styles.footLink} href="#" aria-label="Contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
