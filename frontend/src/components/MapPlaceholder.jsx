import styles from './MapPlaceholder.module.css'

export function MapPlaceholder({ title = 'Hartă', height = 280 }) {
  return (
    <div className={styles.wrapper} style={{ minHeight: height }}>
      <div className={styles.placeholder}>
        <span className={styles.icon}>🗺️</span>
        <span className={styles.text}>{title}</span>
        <span className={styles.hint}>Integrare API Device Location / Leaflet sau Mapbox</span>
      </div>
    </div>
  )
}
