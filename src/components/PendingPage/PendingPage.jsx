import { Link } from 'react-router-dom'
import styles from './PendingPage.module.css'

export default function PendingPage({ title }) {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message} role="status">
        Esta sección todavía no está disponible. Pronto podrá consultarla aquí.
      </p>
      <Link to="/shelters" className={styles.link}>
        Ir a la lista de refugios
      </Link>
    </section>
  )
}