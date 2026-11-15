import { Link } from 'react-router-dom'
import { PawIcon } from '../Icons/Icons'
import styles from './PendingPage.module.css'

export default function PendingPage({ title }) {
  return (
    <section className={styles.page}>
      <span className={styles.mark} aria-hidden="true">
        <PawIcon className={styles.icon} />
      </span>
      <p className={styles.eyebrow}>Estamos preparando esta sección</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message} role="status">
        Esta función aún no está disponible. Mientras tanto, puedes explorar las mascotas y los
        refugios registrados.
      </p>
      <nav aria-label="Explorar otras secciones" className={styles.actions}>
        <Link to="/pets" className={styles.primaryLink}>
          Explorar mascotas
        </Link>
        <Link to="/shelters" className={styles.link}>
          Explorar refugios
        </Link>
      </nav>
    </section>
  )
}