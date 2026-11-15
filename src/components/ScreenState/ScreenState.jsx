import styles from './ScreenState.module.css'

const MESSAGES = {
  loading: 'Cargando...',
  error: 'Ocurrió un error. Inténtelo de nuevo.',
  empty: 'No hay resultados.',
}

export default function ScreenState({ state, message, onRetry, retryLabel = 'Reintentar' }) {
  const text = message ?? MESSAGES[state]
  return (
    <div className={`${styles.state} ${styles[state]}`} role={state === 'error' ? 'alert' : 'status'}>
      <span>{text}</span>
      {state === 'error' && onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}