import { Link } from 'react-router-dom'
import { HeartIcon, PawIcon, SearchIcon, UserIcon } from '../../components/Icons/Icons'
import { getSession, ROLES } from '../../config/session'
import styles from './HomePage.module.css'

const EXPLORE_LINKS = [
  {
    title: 'Mascotas que buscan hogar',
    description: 'Conoce sus historias, características y lo que necesitan para sentirse en casa.',
    label: 'Explorar mascotas',
    path: '/pets',
    Icon: PawIcon,
  },
  {
    title: 'Refugios cerca de ti',
    description: 'Encuentra organizaciones y conoce las mascotas y actividades que acompañan.',
    label: 'Ver refugios',
    path: '/shelters',
    Icon: HeartIcon,
  },
  {
    title: 'Veterinarios',
    description: 'Consulta profesionales y su información para cuidar mejor a cada compañero.',
    label: 'Conocer veterinarios',
    path: '/veterinarians',
    Icon: UserIcon,
  },
  {
    title: 'Salud y bienestar',
    description: 'Explora los eventos médicos registrados para las mascotas.',
    label: 'Ver eventos médicos',
    path: '/medical-events',
    Icon: SearchIcon,
  },
]

export default function HomePage() {
  const isAdmin = getSession().role === ROLES.SHELTER_ADMIN

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Adopción responsable, desde el primer encuentro
          </p>
          <h1 id="home-title" className={styles.heroTitle}>
            Un hogar cambia una vida. <span>Encuentra a tu compañero.</span>
          </h1>
          <p className={styles.heroText}>
            Conoce mascotas, refugios y recursos para dar el siguiente paso con confianza y mucho cariño.
          </p>
          <div className={styles.heroActions}>
            <Link to="/pets" className={styles.primaryAction}>
              Conocer mascotas
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/shelters" className={styles.secondaryAction}>
              Explorar refugios
            </Link>
          </div>
          <p className={styles.promise}>
            <HeartIcon className={styles.promiseIcon} />
            Cada vínculo empieza con información clara y una decisión consciente.
          </p>
        </div>

        <div className={styles.heroArt} aria-hidden="true">
          <span className={styles.artHalo} />
          <span className={`${styles.artPaw} ${styles.artPawOne}`}><PawIcon /></span>
          <span className={`${styles.artPaw} ${styles.artPawTwo}`}><PawIcon /></span>
          <div className={styles.artCircle}>
            <PawIcon className={styles.bigPaw} />
            <span className={styles.heartBadge}><HeartIcon /></span>
          </div>
          <div className={styles.artNote}>
            <span className={styles.noteIcon}><HeartIcon /></span>
            <span>
              <strong>Un nuevo comienzo</strong>
              <small>para ti y para ellos</small>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.explore} aria-labelledby="explore-title">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Explora Huellitas Seguras</p>
          <h2 id="explore-title" className={styles.sectionTitle}>Da el siguiente paso a tu manera</h2>
          <p className={styles.sectionText}>
            Encuentra lo que necesitas para conocer, cuidar y acompañar a las mascotas.
          </p>
        </header>

        <ul className={styles.cardGrid}>
          {EXPLORE_LINKS.map(({ title, description, label, path, Icon }) => (
            <li key={path} className={styles.card}>
              <span className={styles.cardIcon}><Icon /></span>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardText}>{description}</p>
              <Link to={path} className={styles.cardLink}>
                {label}<span aria-hidden="true"> →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.steps} aria-labelledby="steps-title">
        <div className={styles.stepsIntro}>
          <p className={styles.eyebrow}>Un proceso más claro</p>
          <h2 id="steps-title" className={styles.sectionTitle}>Conoce. Pregunta. Decide con el corazón.</h2>
          <p className={styles.sectionText}>
            La adopción es un compromiso para toda la vida. Tómate el tiempo de conocer y conversar con el refugio.
          </p>
          <Link to="/pets" className={styles.textLink}>Empezar por las mascotas <span aria-hidden="true">→</span></Link>
        </div>
        <ol className={styles.stepsList}>
          <li>
            <span className={styles.stepNumber}>01</span>
            <div><h3>Descubre</h3><p>Explora perfiles y encuentra una historia que conecte contigo.</p></div>
          </li>
          <li>
            <span className={styles.stepNumber}>02</span>
            <div><h3>Conoce</h3><p>Visita el perfil del refugio y pregunta por el proceso y las necesidades.</p></div>
          </li>
          <li>
            <span className={styles.stepNumber}>03</span>
            <div><h3>Prepárate</h3><p>Piensa en el tiempo, espacio y cuidados que requiere un nuevo compañero.</p></div>
          </li>
        </ol>
      </section>

      {isAdmin && (
        <section className={styles.adminCallout} aria-labelledby="admin-title">
          <span className={styles.adminIcon}><PawIcon /></span>
          <div>
            <p className={styles.eyebrow}>Para quienes cuidan</p>
            <h2 id="admin-title">¿Administras un refugio?</h2>
            <p>Registra refugios y mascotas para que más personas puedan conocer sus historias.</p>
          </div>
          <div className={styles.adminActions}>
            <Link to="/shelters/new" className={styles.secondaryAction}>Registrar refugio</Link>
            <Link to="/pets/new" className={styles.primaryAction}>Registrar mascota</Link>
          </div>
        </section>
      )}
    </div>
  )
}
