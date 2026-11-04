import { useId } from 'react'
import ModalDialog, { DialogActions, DialogButton, DialogTitle } from '../ModalDialog/ModalDialog'
import styles from './ConfirmDialog.module.css'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  pendingLabel = 'Procesando...',
  cancelLabel = 'Cancelar',
  pending = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const messageId = useId()

  // While the action is running the dialog cannot be dismissed, so the outcome is always shown.
  const close = () => {
    if (!pending) onCancel()
  }

  return (
    <ModalDialog
      tone="error"
      role="alertdialog"
      labelledBy={titleId}
      describedBy={messageId}
      onClose={close}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <p id={messageId} className={styles.message}>
        {message}
      </p>
      <DialogActions>
        <DialogButton disabled={pending} onClick={onConfirm}>
          {pending ? pendingLabel : confirmLabel}
        </DialogButton>
        <DialogButton variant="secondary" autoFocus disabled={pending} onClick={close}>
          {cancelLabel}
        </DialogButton>
      </DialogActions>
    </ModalDialog>
  )
}
