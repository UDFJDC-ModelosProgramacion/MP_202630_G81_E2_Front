import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../auth/useAuth'
import { getSession, ROLES } from '../../config/session'
import { ROLE_LABELS } from '../../constants/roleLabels'
import ErrorDialog from '../ErrorDialog/ErrorDialog'
import { HeartIcon, UserIcon } from '../Icons/Icons'
import styles from './Navbar.module.css'

const PRIMARY_LINKS = [
  { path: '/', label: 'Inicio', end: true },
  { path: '/pets', label: 'Mascotas' },
  { path: '/shelters', label: 'Refugios' },
]

const COMMON_MORE_LINKS = [
  { path: '/veterinarians', label: 'Veterinarios' },
  { path: '/medical-events', label: 'Eventos médicos' },
]

const MORE_LINKS_BY_ROLE = {
  [ROLES.VISITOR]: [
    ...COMMON_MORE_LINKS,
    { path: '/adopters/new', label: 'Registrar adoptante' },
  ],
  [ROLES.ADOPTER]: COMMON_MORE_LINKS,
  [ROLES.SHELTER_ADMIN]: COMMON_MORE_LINKS,
  [ROLES.VETERINARIAN]: [
    ...COMMON_MORE_LINKS,
    { path: '/followUps', label: 'Mis seguimientos' },
  ],
  [ROLES.ADMIN]: [...COMMON_MORE_LINKS, { path: '/adopters', label: 'Adoptantes' }],
}

const ADMIN_LINKS = [
  { path: '/shelters/new', label: 'Registrar refugio' },
  { path: '/pets/new', label: 'Registrar mascota' },
  { path: '/veterinarians/new', label: 'Registrar veterinario' },
]

const SHELTER_ADMIN_LINKS = [
  { path: '/pets/inventory', label: 'Inventario de mascotas' },
  { path: '/medical-events/new', label: 'Registrar evento médico' },
  { path: '/vaccination-records/new', label: 'Crear carnet de vacunación' },
]

const VETERINARIAN_LINKS = [
  { path: '/medical-events/new', label: 'Registrar evento médico' },
]

// "AdminUser" -> "AU", "Ana Gómez" -> "AG", "luna" -> "LU"
function initials(name) {
  const capitals = name.match(/\p{Lu}/gu) ?? []
  return capitals.length >= 2 ? capitals.slice(0, 2).join('') : name.slice(0, 2).toUpperCase()
}

function NavigationDropdown({ id, label, ariaLabel, items, open, onToggle, onClose, onNavigate, admin }) {
  const triggerRef = useRef(null)
  const className = [
    styles.dropdown,
    open && styles.dropdownOpen,
    admin && styles.adminDropdown,
  ].filter(Boolean).join(' ')
  const triggerClassName = admin
    ? `${styles.dropdownTrigger} ${styles.adminTrigger}`
    : styles.dropdownTrigger
  const closeOnEscape = (event) => {
    if (event.key === 'Escape' && open) {
      onClose()
      triggerRef.current?.focus()
    }
  }

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        onKeyDown={closeOnEscape}
      >
        {admin && <span aria-hidden="true">＋</span>}
        {label}
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      <ul id={id} className={styles.dropdownMenu} hidden={!open}>
        {items.map(({ path, label: itemLabel }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                isActive
                  ? `${styles.dropdownLink} ${styles.dropdownLinkActive}`
                  : styles.dropdownLink
              }
              onClick={onNavigate}
              onKeyDown={closeOnEscape}
            >
              {itemLabel}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [logoutError, setLogoutError] = useState(null)
  const auth = useAuth()
  const navigate = useNavigate()
  const session = auth?.session ?? getSession()
  const isAuthenticated = auth?.isAuthenticated ?? session.role !== ROLES.VISITOR
  const moreLinks = MORE_LINKS_BY_ROLE[session.role] ?? []
  const registrationLinks =
    session.role === ROLES.ADMIN
      ? ADMIN_LINKS
      : session.role === ROLES.SHELTER_ADMIN
        ? SHELTER_ADMIN_LINKS
        : session.role === ROLES.VETERINARIAN
          ? VETERINARIAN_LINKS
          : null
  const closeMenu = () => {
    setMenuOpen(false)
    setMoreOpen(false)
    setRegisterOpen(false)
  }
  const handleLogout = async () => {
    try {
      await auth?.signOut()
      closeMenu()
      navigate('/', { replace: true })
    } catch (error) {
      setLogoutError(error)
    }
  }
  const toggleMenu = () => {
    if (menuOpen) {
      setMoreOpen(false)
      setRegisterOpen(false)
    }
    setMenuOpen((isOpen) => !isOpen)
  }

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
          onClick={toggleMenu}
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
              {PRIMARY_LINKS.map(({ path, label, end }) => (
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
              {moreLinks.length > 0 && (
                <li>
                  <NavigationDropdown
                    id="more-navigation"
                    label="Más"
                    ariaLabel="Más secciones"
                    items={moreLinks}
                    open={moreOpen}
                    onToggle={() => {
                      setMoreOpen((isOpen) => !isOpen)
                      setRegisterOpen(false)
                    }}
                    onClose={() => setMoreOpen(false)}
                    onNavigate={closeMenu}
                  />
                </li>
              )}
            </ul>
          </nav>

          <div className={styles.side}>
            {auth?.error && (
              <span className={styles.authError} role="alert">
                {auth.error}
              </span>
            )}
            {registrationLinks && (
              <NavigationDropdown
                id="admin-navigation"
                label="Registrar"
                items={registrationLinks}
                open={registerOpen}
                onToggle={() => {
                  setRegisterOpen((isOpen) => !isOpen)
                  setMoreOpen(false)
                }}
                onClose={() => setRegisterOpen(false)}
                onNavigate={closeMenu}
                admin
              />
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className={styles.user}
                  aria-label={`Perfil de ${session.name ?? 'Usuario'}`}
                  onClick={closeMenu}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {session.name ? initials(session.name) : <UserIcon className={styles.avatarIcon} />}
                  </span>
                  <span className={styles.userText}>
                    <span className={styles.userName}>{session.name ?? 'Usuario'}</span>
                    <span className={styles.userRole}>{ROLE_LABELS[session.role] ?? 'Visitante'}</span>
                  </span>
                </Link>
                {auth?.signOut && (
                  <button type="button" className={styles.logout} onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className={styles.login} onClick={closeMenu}>
                  Iniciar sesión
                </Link>
                <Link to="/register" className={styles.register} onClick={closeMenu}>
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {logoutError && (
        <ErrorDialog
          title="No se pudo cerrar la sesión"
          message={logoutError.message}
          status={logoutError.status}
          actionLabel="Entendido"
          onClose={() => setLogoutError(null)}
        />
      )}
    </header>
  )
}
