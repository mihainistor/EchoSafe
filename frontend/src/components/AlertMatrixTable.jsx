import { ALERT_MATRIX } from '../constants/alertMatrix'
import styles from './AlertMatrixTable.module.css'

export function AlertMatrixTable() {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Matrice alerte</h3>
      <p className={styles.hint}>
        Condiții de declanșare și formatul mesajelor trimise.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Eveniment</th>
              <th>Condiție</th>
              <th>Tip alertă</th>
              <th>Conținut alertă</th>
            </tr>
          </thead>
          <tbody>
            {ALERT_MATRIX.map((row) => (
              <tr key={row.eventKey}>
                <td className={styles.cellEvent}>{row.event}</td>
                <td className={styles.cellCondition}>{row.condition}</td>
                <td>
                  <span className={row.channel.includes('SMS') ? styles.channelSms : styles.channelPush}>
                    {row.channel}
                  </span>
                </td>
                <td className={styles.cellContent}>
                  <code>{row.content}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
