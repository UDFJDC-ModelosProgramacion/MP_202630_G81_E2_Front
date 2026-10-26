import { Link, NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const LINKS = [
  { path: '/pets', label: 'Mascotas' },
  { path: '/notifications', label: 'Notificaciones' },
  { path: '/veterinarians', label: 'Veterinarios' },
]

export default function Navbar() {
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.logo}>
        Pet Adoption Platform
      </Link>
      <nav aria-label="Principal">
        <ul className={styles.menu}>
          {LINKS.map(({ path, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
