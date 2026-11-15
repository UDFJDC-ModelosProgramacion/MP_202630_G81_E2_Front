import { useState } from 'react'
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
  { path: '/medical-events', label: 'Eventos médicos', end: true },
  { path: '/register', label: 'Registrarse' },
]

const ADMIN_LINKS = [
  { path: '/shelters/new', label: 'Registrar refugio' },
  { path: '/pets/new', label: 'Registrar mascota' },
  { path: '/medical-events/new', label: 'Registrar evento médico' },
]

// "AdminUser" -> "AU", "Ana Gómez" -> "AG", "luna" -> "LU"
function initials(name) {
  const capitals = name.match(/\p{Lu}/gu) ?? []
  return capitals.length >= 2 ? capitals.slice(0, 2).join('') : name.slice(0, 2).toUpperCase()
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const session = getSession()
  const isAdmin = session.role === ROLES.SHELTER_ADMIN
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={styles.bar}>
      <div className={menuOpen ? `${styles.inner} ${styles.open}` : styles.inner}>
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.mark}>
            <HeartIcon className={styles.markIcon} fill="currentColor" />
          </span>
          <span className={styles.brandName}>
            Huellitas <span className={styles.accent}>Seguras</span>
          </span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <span className={styles.menuToggleIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div id="site-navigation" className={styles.navigation}>
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
                    onClick={closeMenu}
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
                        onClick={closeMenu}
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <Link
              to="/profile"
              className={styles.user}
              role="group"
              aria-label="Usuario actual"
              onClick={closeMenu}
            >
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
      </div>
    </header>
  )
}
