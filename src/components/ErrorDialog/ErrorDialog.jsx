import { useId } from 'react'
import ModalDialog, {
  DialogActions,
  DialogButton,
  DialogPill,
  DialogTitle,
} from '../ModalDialog/ModalDialog'
import styles from './ErrorDialog.module.css'

const STATUS_NAMES = { 404: 'No encontrado', 412: 'Conflicto de registro' }

function statusLabel(status) {
  const name = STATUS_NAMES[status]
  return name ? `Error ${status} • ${name}` : `Error ${status}`
}

export default function ErrorDialog({
  title,
  message,
  status,
  hint,
  actionLabel,
  cancelLabel = 'Cancelar / Volver',
  onClose,
  onCancel,
}) {
  const titleId = useId()
  const messageId = useId()

  return (
    <ModalDialog
      tone="error"
      role="alertdialog"
      labelledBy={titleId}
      describedBy={messageId}
      onClose={onClose}
    >
      {status > 0 && <DialogPill>{statusLabel(status)}</DialogPill>}
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <div className={styles.detail}>
        <p id={messageId} className={styles.message}>
          {message}
        </p>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
      <DialogActions>
        <DialogButton autoFocus onClick={onClose}>
          {actionLabel}
        </DialogButton>
        {onCancel && (
          <DialogButton variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </DialogButton>
        )}
      </DialogActions>
    </ModalDialog>
  )
}