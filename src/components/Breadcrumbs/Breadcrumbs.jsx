import { Link, useLocation } from 'react-router-dom'
import { getBreadcrumbItems } from './breadcrumbRoutes'
import styles from './Breadcrumbs.module.css'

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const items = getBreadcrumbItems(pathname)

  return (
    <nav aria-label="Ruta de navegación" className={styles.breadcrumbs}>
      <ol className={styles.list}>
        {items.map(({ label, to }, index) => (
          <li key={`${label}-${index}`} className={styles.item}>
            {to ? (
              <Link to={to} className={styles.link}>
                {label}
              </Link>
            ) : (
              <span aria-current="page" className={styles.current}>
                {label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
