import { useEffect, useId, useRef } from 'react'
import styles from './ErrorDialog.module.css'

export default function ErrorDialog({
  title,
  message,
  status,
  actionLabel,
  onClose,
}) {
  const titleId = useId()
  const messageId = useId()
  const actionRef = useRef(null)

  useEffect(() => {
    actionRef.current?.focus()

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className={styles.backdrop}>
      <button
        type="button"
        className={styles.backdropAction}
        aria-label="Cerrar diálogo"
        onClick={onClose}
      />

      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className={styles.badge} aria-hidden="true">
          !
        </div>

        {status > 0 && (
          <p className={styles.status}>Error {status}</p>
        )}

        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>

        <p id={messageId} className={styles.message}>
          {message}
        </p>

        <button
          ref={actionRef}
          type="button"
          className={styles.action}
          onClick={onClose}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}