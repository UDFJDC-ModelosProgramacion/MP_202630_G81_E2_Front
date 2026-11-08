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
  { path: '/register', label: 'Registrarse' },
]

const ADMIN_LINKS = [
  { path: '/shelters/new', label: 'Registrar refugio' },
  { path: '/pets/new', label: 'Registrar mascota' },
]

// "AdminUser" -> "AU", "Ana Gómez" -> "AG", "luna" -> "LU"
function initials(name) {
  const capitals = name.match(/\p{Lu}/gu) ?? []
  return capitals.length >= 2 ? capitals.slice(0, 2).join('') : name.slice(0, 2).toUpperCase()
}

export default function Navbar() {
  const session = getSession()
  const isAdmin = session.role === ROLES.SHELTER_ADMIN
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.mark}>
            <HeartIcon className={styles.markIcon} fill="currentColor" />
          </span>
          <span className={styles.brandName}>
            Huellitas <span className={styles.accent}>Seguras</span>
          </span>
        </Link>

        <nav aria-label="Principal" className={styles.nav}>
          <ul className={styles.menu}>
            {LINKS.map(({ path, label, end }) => (
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

        <div className={styles.side}>
          {isAdmin && (
            <nav aria-label="Acciones de administración">
              <ul className={styles.menu}>
                {ADMIN_LINKS.map(({ path, label }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end
                      className={({ isActive }) =>
                        isActive ? `${styles.cta} ${styles.ctaActive}` : styles.cta
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <Link to="/profile" className={styles.user} role="group" aria-label="Usuario actual">
            <span className={styles.avatar}>
              {session.name ? initials(session.name) : <UserIcon className={styles.avatarIcon} />}
            </span>
            <span className={styles.userText}>
              <span className={styles.userName}>{session.name ?? 'Usuario'}</span>
              <span className={styles.userRole}>{ROLE_LABELS[session.role] ?? 'Visitante'}</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
