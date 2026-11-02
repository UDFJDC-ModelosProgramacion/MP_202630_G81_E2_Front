import { useEffect, useRef } from 'react'
import styles from './ModalDialog.module.css'

const BADGE_SYMBOL = { error: '!', success: '✓' }

export default function ModalDialog({
  tone,
  role = 'dialog',
  labelledBy,
  describedBy,
  onClose,
  children,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
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

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[tone]}`}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <div className={styles.badge} aria-hidden="true">
          {BADGE_SYMBOL[tone]}
        </div>

        {children}
      </div>
    </div>
  )
}

export function DialogPill({ children }) {
  return <p className={styles.pill}>{children}</p>
}

export function DialogTitle({ id, children }) {
  return (
    <h2 id={id} className={styles.title}>
      {children}
    </h2>
  )
}

export function DialogActions({ children }) {
  return <div className={styles.actions}>{children}</div>
}

export function DialogButton({ variant = 'primary', ...buttonProps }) {
  return (
    <button
      type="button"
      className={styles[variant]}
      {...buttonProps}
    />
  )
}
