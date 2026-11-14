import { useId } from 'react'
import ModalDialog, {
    DialogActions,
    DialogButton,
    DialogTitle,
} from '../ModalDialog/ModalDialog'
import styles from './ConfirmDeleteDialog.module.css'


export default function ConfirmDeleteDialog({ onConfirm, onCancel }) {
    const titleId = useId()
    const messageId = useId()

    return (
        <ModalDialog
            tone="error"
            role="alertdialog"
            labelledBy={titleId}
            describedBy={messageId}
            onClose={onCancel}
        >
            <DialogTitle id={titleId}>¿Eliminar la notificación?</DialogTitle>
            <p id={messageId} className={styles.message}>
                Esta acción no se puede deshacer.
            </p>
            <DialogActions>
                <DialogButton autoFocus onClick={onCancel}>
                    Cancelar
                </DialogButton>
                <DialogButton variant="secondary" onClick={onConfirm}>
                    Eliminar
                </DialogButton>
            </DialogActions>
        </ModalDialog>
    )
}