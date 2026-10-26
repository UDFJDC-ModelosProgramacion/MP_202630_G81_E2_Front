import styles from './ScreenState.module.css'

const MESSAGES = {
  loading: 'Cargando...',
  error: 'Ocurrió un error. Inténtalo de nuevo.',
  empty: 'No hay resultados.',
}

export default function ScreenState({ state, message }) {
  const text = message ?? MESSAGES[state]
  return (
    <p
      className={`${styles.state} ${styles[state]}`}
      role={state === 'error' ? 'alert' : 'status'}
    >
      {text}
    </p>
  )
}
