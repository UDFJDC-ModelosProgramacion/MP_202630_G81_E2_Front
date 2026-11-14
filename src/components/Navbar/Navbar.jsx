import { Link, NavLink } from 'react-router-dom'
import { getSession, ROLES } from '../../config/roleSession'
import styles from './Navbar.module.css'

const LINKS = [
  { path: '/pets', label: 'Mascotas' },
  { path: '/notifications', label: 'Notificaciones' },
  { path: '/veterinarians', label: 'Veterinarios' },
  { path: '/medical-events', label: 'Eventos médicos', end: true },
]

const ADMIN_LINKS = [
  { path: '/shelters/new', label: 'Registrar refugio', end: true },
  { path: '/pets/new', label: 'Registrar mascota', end: true },
  { path: '/medical-events/new', label: 'Registrar evento médico', end: true },
  { path: '/trial-cohabitation-requests/received', label: 'Solicitudes de convivencia', end: true },
  { path: '/adoptions/new', label: 'Registrar adopción', end: true },
  { path: '/adoptions/shelter', label: 'Adopciones del refugio', end: true },
]

const ADOPTER_LINKS = [
  { path: '/trial-cohabitation-requests', label: 'Mis solicitudes', end: true },
  { path: '/adoptions/mine', label: 'Mis adopciones', end: true },
]

function linksFor(role) {
  if (role === ROLES.SHELTER_ADMIN) return [...LINKS, ...ADMIN_LINKS]
  if (role === ROLES.ADOPTER) return [...LINKS, ...ADOPTER_LINKS]
  return LINKS
}

export default function Navbar() {
  const links = linksFor(getSession().role)
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