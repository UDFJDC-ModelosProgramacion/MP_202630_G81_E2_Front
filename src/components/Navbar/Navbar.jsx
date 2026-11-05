import { Link, NavLink } from 'react-router-dom'
import { getSession, ROLES } from '../../config/session'
import { ROLE_LABELS } from '../../constants/roleLabels'
import { HeartIcon, UserIcon } from '../Icons/Icons'
import styles from './Navbar.module.css'

const LINKS = [
  { path: '/pets', label: 'Mascotas' },
  { path: '/shelters', label: 'Refugios', end: true },
  { path: '/notifications', label: 'Notificaciones' },
  { path: '/veterinarians', label: 'Veterinarios' },
]

const ADMIN_LINKS = [
  { path: '/shelters/new', label: 'Registrar refugio', end: true },
  { path: '/pets/new', label: 'Registrar mascota', end: true },
]

export default function Navbar() {
  const session = getSession()
  const links = session.role === ROLES.SHELTER_ADMIN ? [...LINKS, ...ADMIN_LINKS] : LINKS
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.mark}>
            <HeartIcon className={styles.markIcon} />
          </span>
          <span className={styles.brandName}>Pet Adoption Platform</span>
        </Link>

        <div className={styles.user} role="group" aria-label="Usuario actual">
          <span className={styles.avatar}>
            <UserIcon className={styles.avatarIcon} />
          </span>
          <span className={styles.userText}>
            <span className={styles.userName}>{session.name ?? 'Usuario'}</span>
            <span className={styles.userRole}>{ROLE_LABELS[session.role] ?? 'Visitante'}</span>
          </span>
        </div>

        <nav aria-label="Principal" className={styles.nav}>
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
      </div>
    </header>
  )
}