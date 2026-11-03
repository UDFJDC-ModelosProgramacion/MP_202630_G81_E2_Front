import { Link, NavLink } from 'react-router-dom'
import { getSession, ROLES } from '../../config/session'
import styles from './Navbar.module.css'

const LINKS = [
  { path: '/pets', label: 'Mascotas' },
  { path: '/notifications', label: 'Notificaciones' },
  { path: '/veterinarians', label: 'Veterinarios' },
]

const ADMIN_LINKS = [
  { path: '/shelters/new', label: 'Registrar refugio', end: true },
  { path: '/pets/new', label: 'Registrar mascota', end: true },
  { path: '/medical-events/new', label: 'Registrar evento médico', end: true },
]

export default function Navbar() {
  const links =
    getSession().role === ROLES.SHELTER_ADMIN ? [...LINKS, ...ADMIN_LINKS] : LINKS
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.logo}>
        Pet Adoption Platform
      </Link>
      <nav aria-label="Principal">
        <ul className={styles.menu}>
          {links.map(({ path, label, end }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={end}
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