import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Header.module.css'

const navItems = [
  { to: '/', label: 'Acasă' },
  { to: '/login', label: 'Autentificare' },
  { to: '/register', label: 'Înregistrare' },
  { to: '/dashboard', label: 'Panou' },
]

const dashboardItems = [
  { to: '/dashboard', label: 'Panou de control' },
  { to: '/dashboard/member', label: 'Familie' },
  { to: '/dashboard/time-machine', label: 'Istoric Locatie' },
  { to: '/dashboard/alerts', label: 'Alerte' },
]

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useApp()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const [open, setOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef(null)
  const demoMenuRef = useRef(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoMode, setDemoMode] = useState(() => {
    try {
      return localStorage.getItem('demo_mode') === '1'
    } catch {
      return false
    }
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setOpen(false)
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target)) setDemoOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'demo_mode') {
        setDemoMode(e.newValue === '1')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Acasă">
          <img src="/header-logo.svg" alt="" width="40" height="40" style={{ display: 'inline-block' }} />
          <span>EchoSafe</span>
        </Link>
        <div className={styles.nav} style={{ gap: '0.5rem' }}>
          <div className={styles.dropdown} ref={demoMenuRef}>
            <button
              className={demoMode ? styles.demoToggle : `${styles.demoToggle} ${styles.demoToggleInactive}`}
              onClick={() => setDemoOpen(!demoOpen)}
              title={
                demoMode
                  ? 'Mod demo activ — pe Login poți folosi „Intră în demo” pentru autentificare rapidă'
                  : 'Mod demo inactiv — activează-l pentru autentificare rapidă pe Login'
              }
            >
              {demoMode ? 'DEMO' : 'DEMO OFF'}
            </button>
            {demoOpen && (
              <div className={styles.menu}>
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    const next = !demoMode
                    setDemoMode(next)
                    try {
                      localStorage.setItem('demo_mode', next ? '1' : '0')
                    } catch {}
                    if (!next) {
                      try {
                        logout()
                      } catch {}
                      navigate('/login', { replace: true })
                    }
                    setDemoOpen(false)
                  }}
                >
                  {demoMode ? 'Demo OFF' : 'Demo ON'}
                </button>
              </div>
            )}
          </div>
          <button className={styles.burger} onClick={() => setNavOpen(!navOpen)} aria-label="Deschide meniul">☰</button>
          <div className={styles.desktopOnly}>
            {!isDashboard ? (
              <>
                <div className={styles.dropdown} ref={menuRef}>
                  <Link
                    to="/dashboard"
                    className={location.pathname.startsWith('/dashboard') ? styles.navLinkActive : styles.navLink}
                  >
                    Panou
                  </Link>
                  <button className={styles.profileBtn} onClick={() => setOpen(!open)}>
                    {(currentUser?.email || currentUser?.msisdn_admin || 'U')[0].toUpperCase()}
                  </button>
                  {open && (
                    <div className={styles.menu}>
                      {currentUser && (
                        <Link className={styles.menuItem} to="/dashboard/profile" onClick={() => setOpen(false)}>Profil</Link>
                      )}
                      <button className={styles.menuItem} onClick={handleLogout}>Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {dashboardItems.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={
                      location.pathname === to ||
                      (to !== '/dashboard' && location.pathname.startsWith(to))
                        ? styles.navLinkActive
                        : styles.navLink
                    }
                  >
                    {label}
                  </Link>
                ))}
                <div className={styles.dropdown} ref={menuRef}>
                  <button className={styles.profileBtn} onClick={() => setOpen(!open)}>
                    {(currentUser?.email || currentUser?.msisdn_admin || 'U')[0].toUpperCase()}
                  </button>
                  {open && (
                    <div className={styles.menu}>
                      {currentUser && (
                        <Link className={styles.menuItem} to="/dashboard/profile" onClick={() => setOpen(false)}>Profil</Link>
                      )}
                      <button className={styles.menuItem} onClick={handleLogout}>Logout</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {navOpen && (
            <div className={styles.mobileMenu}>
              {isDashboard ? (
                <>
                  {dashboardItems.map(({ to, label }) => (
                    <Link
                      key={`m-${to}`}
                      to={to}
                      className={
                        location.pathname === to ||
                        (to !== '/dashboard' && location.pathname.startsWith(to))
                          ? styles.mobileLinkActive
                          : styles.mobileLink
                      }
                      onClick={() => setNavOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                  {currentUser && (
                    <Link className={styles.mobileLink} to="/dashboard/profile" onClick={() => setNavOpen(false)}>Profil</Link>
                  )}
                  <button className={styles.menuItem} onClick={() => { setNavOpen(false); handleLogout(); }}>Logout</button>
                </>
              ) : (
                <>
                  {navItems.map(({ to, label }) => (
                    <Link
                      key={`m-${to}`}
                      to={to}
                      className={location.pathname === to ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={() => setNavOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                  {currentUser && (
                    <Link className={styles.mobileLink} to="/dashboard/profile" onClick={() => setNavOpen(false)}>Profil</Link>
                  )}
                  <button className={styles.menuItem} onClick={() => { setNavOpen(false); handleLogout(); }}>Logout</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
