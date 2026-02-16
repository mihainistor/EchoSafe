import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import styles from './MemberList.module.css'

const statusLabels = {
  on_route: 'Pe traseu',
  off_route: 'În afara traseului',
  stationary: 'Stationar',
}

const statusClass = {
  on_route: styles.statusOnRoute,
  off_route: styles.statusOffRoute,
  stationary: styles.statusStationary,
}

export function MemberList() {
  const { linkedMembers, revokeMember } = useApp()

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Membri familie</h1>
        </div>
        <Link to="/dashboard/member/add" className={styles.addButton}>
          + Adaugă membru
        </Link>
      </div>

      {linkedMembers.length === 0 ? (
        <div className={styles.empty}>
          <p>Nu ai încă niciun membru de familie.</p>
          <Link to="/dashboard/member/add" className={styles.addLink}>
            Adaugă primul membru
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {linkedMembers.map((child) => (
            <li key={child.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.avatar}>{child.label.charAt(0)}</div>
                <div className={styles.info}>
                  <h2 className={styles.name}>{child.label}</h2>
                  <p className={styles.msisdn}>{child.msisdn}</p>
                  <span className={`${styles.badge} ${statusClass[child.status] || styles.statusStationary}`}>
                    {statusLabels[child.status] || '—'}
                  </span>
                </div>
                <div className={styles.actions}>
                  <Link to={`/dashboard/member/${child.id}`} className={styles.primaryBtn}>
                    Vezi locație & setări
                  </Link>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={() => {
                      const ok = window.confirm(`Confirmi ștergerea legăturii pentru ${child.label}?`)
                      if (ok) revokeMember(child.id)
                    }}
                    title="Șterge membru"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
