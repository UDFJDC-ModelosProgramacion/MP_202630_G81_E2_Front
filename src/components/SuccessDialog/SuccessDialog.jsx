import { useId } from 'react'
import ModalDialog, {
  DialogActions,
  DialogButton,
  DialogPill,
  DialogTitle,
} from '../ModalDialog/ModalDialog'
import styles from './SuccessDialog.module.css'

export default function SuccessDialog({
  title,
  message,
  details = [],
  warning,
  actionLabel,
  closeLabel,
  onAction,
  onClose,
}) {
  const titleId = useId()
  const messageId = useId()

  return (
    <ModalDialog
      tone="success"
      role="dialog"
      labelledBy={titleId}
      describedBy={messageId}
      onClose={onClose}
    >
      <DialogPill>Código HTTP 201 • Creado con éxito</DialogPill>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <p id={messageId} className={styles.message}>
        {message}
      </p>
      {details.length > 0 && (
        <dl className={styles.details}>
          {details.map(({ label, value }) => (
            <div key={label} className={styles.detail}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {warning && (
        <p role="status" className={styles.warning}>
          {warning}
        </p>
      )}
      <DialogActions>
        <DialogButton autoFocus onClick={onAction}>
          {actionLabel}
        </DialogButton>
        <DialogButton variant="secondary" onClick={onClose}>
          {closeLabel}
        </DialogButton>
      </DialogActions>
    </ModalDialog>
  )
}