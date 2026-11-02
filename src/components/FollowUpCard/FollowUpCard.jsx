import { Link } from 'react-router-dom'
import { formatDay } from '../../utils/dates'
import { statusOfDay } from '../../utils/followUpDates'
import styles from './FollowUpCard.module.css'

const STATUS_LABELS = { past: 'Vencido', future: 'Próximo', today: 'Hoy' }
const STATUS_CLASSES = {
  past: styles.statusPast,
  future: styles.statusFuture,
  today: styles.statusToday,
}

const fullName = ({ firstName = '', lastName = '' }) => `${firstName} ${lastName}`.trim()

// Renders one follow-up of the list with its date, status, observation and
// veterinarian. With showAdoption it also links to the adoption follow-ups.
// actions renders the per-card actions of the current role (edit/delete).
export default function FollowUpCard({ followUp, actions = null, showAdoption = false }) {
  const status = statusOfDay(followUp.date)
  return (
    <li className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Seguimiento del {formatDay(followUp.date)}</h3>
        {status && (
          <span className={`${styles.status} ${STATUS_CLASSES[status]}`.trim()}>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>
      <p className={styles.observation}>{followUp.observation}</p>
      <p className={styles.meta}>
        Veterinario: {followUp.veterinarian ? fullName(followUp.veterinarian) || '—' : '—'}
      </p>
      {showAdoption && followUp.adoption && (
        <p className={styles.meta}>
          Adopción: <Link to={`/adoptions/${followUp.adoption.id}/followUps`}>#{followUp.adoption.id}</Link>
        </p>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </li>
  )
}
