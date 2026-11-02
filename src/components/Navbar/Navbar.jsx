import { Link, NavLink } from 'react-router-dom'
import { getSession, ROLES } from '../../config/session'
import styles from './Navbar.module.css'

const LINKS = [
  { path: '/pets', label: 'Mascotas' },
  { path: '/notifications', label: 'Notificaciones' },
  { path: '/veterinarians', label: 'Veterinarios' },
]

const VISITOR_LINKS = [{ path: '/adopters/new', label: 'Registrarme' }]

export default function Navbar() {
  const links = getSession().role === ROLES.VISITOR ? [...LINKS, ...VISITOR_LINKS] : LINKS
  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.logo}>
        Pet Adoption Platform
      </Link>
      <nav aria-label="Principal">
        <ul className={styles.menu}>
          {links.map(({ path, label }) => (
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
