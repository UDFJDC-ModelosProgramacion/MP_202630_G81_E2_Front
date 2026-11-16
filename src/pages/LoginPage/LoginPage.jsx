import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import { TextField } from '../../components/FormField/FormField'
import useAuth from '../../auth/useAuth'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await signIn({ email: email.trim(), password })
      await navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (requestError) {
      setError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Qué bueno tenerte de vuelta</p>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresa con el correo y la contraseña de tu cuenta.</p>
      </header>

      <form className={styles.form} onSubmit={(event) => { void handleSubmit(event) }}>
        <TextField
          id="login-email"
          name="email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="login-password"
          name="password"
          type="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <p className={styles.register}>
          ¿Aún no tienes cuenta? <Link to="/register">Crear cuenta de adoptante</Link>
        </p>
      </form>

      {error && (
        <ErrorDialog
          title="No se pudo iniciar sesión"
          message={error.message}
          status={error.status}
          actionLabel="Intentar de nuevo"
          onClose={() => setError(null)}
        />
      )}
    </section>
  )
}
