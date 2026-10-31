import { useId } from 'react'
import styles from './FormSection.module.css'

// A titled card that groups related fields of a form.
export default function FormSection({ title, description, children }) {
  const headingId = useId()
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <header className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
