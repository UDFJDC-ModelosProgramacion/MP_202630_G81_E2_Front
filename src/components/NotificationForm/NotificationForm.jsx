import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorDialog from '../ErrorDialog/ErrorDialog'
import { SelectField, TextField } from '../FormField/FormField'
import FormSection from '../FormSection/FormSection'
import ScreenState from '../ScreenState/ScreenState'
import { CHANNELS } from '../../constants/notificationOptions'
import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import {
    buildPayload,
    EMPTY_VALUES,
    fieldOfBackendMessage,
    validateNotification,
} from './notificationFields'
import styles from './NotificationForm.module.css'

const SAVE_ERROR_TITLE = 'Error al guardar la notificación'
const DELETE_ERROR_TITLE = 'Error al eliminar la notificación'
const ERROR_HINT = 'Verifique los datos de la notificación o regrese al listado de notificaciones.'

const withoutKey = (object, key) =>
    Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))


export default function NotificationForm({
    defaultValues = EMPTY_VALUES,
    ariaLabel,
    submitLabel,
    notice,
    channelLocked = false,
    canDelete = true,
    onSubmit,
    onDelete,
}) {
    const navigate = useNavigate()
    const [values, setValues] = useState(defaultValues)
    const [errors, setErrors] = useState({})
    const [errorDialog, setErrorDialog] = useState(null)
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [busy, setBusy] = useState(null)

    function handleChange(event) {
        const { name, value } = event.target
        setValues((current) => ({ ...current, [name]: value }))
        setErrors((current) => withoutKey(current, name))
    }

    function showBackendError(error, title) {
        const field = fieldOfBackendMessage(error.message)
        setErrors(field ? { [field]: error.message } : {})
        setErrorDialog({ title, message: error.message, status: error.status, field })
        setBusy(null)
    }

    function closeErrorDialog() {
        const { field } = errorDialog
        setErrorDialog(null)
        if (field) document.getElementById(field)?.focus()
    }

    async function handleSubmit(event) {
        event.preventDefault()
        const found = validateNotification(values)
        setErrors(found)
        const [firstInvalid] = Object.keys(found)
        if (firstInvalid) {
            document.getElementById(firstInvalid)?.focus()
            return
        }

        setBusy('saving')
        try {
            await onSubmit(buildPayload(values))
        } catch (error) {
            showBackendError(error, SAVE_ERROR_TITLE)
        }
    }

    async function confirmDelete() {
        setConfirmingDelete(false)
        setBusy('deleting')
        try {
            await onDelete()
        } catch (error) {
            showBackendError(error, DELETE_ERROR_TITLE)
        }
    }

    const field = (name, label) => ({
        id: name,
        name,
        label,
        value: values[name],
        error: errors[name],
        required: true,
        onChange: handleChange,
    })

    return (
        <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label={ariaLabel}>
            <FormSection title="Datos de la notificación">
                <div className={styles.grid}>
                    <TextField {...field('message', 'Mensaje')} placeholder="Recordatorio de vacuna" />
                    <SelectField
                        {...field('channel', 'Canal')}
                        options={CHANNELS}
                        placeholder="Seleccione un canal"
                        disabled={channelLocked}
                    />
                    <TextField {...field('date', 'Fecha')} type="date" />
                    <TextField {...field('time', 'Hora')} type="time" />
                    <TextField {...field('content', 'Contenido')} placeholder="Escriba el contenido" />
                    <p className={styles.notice}>
                        <span className={styles.noticeIcon} aria-hidden="true">
                            !
                        </span>
                        {notice}
                    </p>
                </div>
            </FormSection>

            {busy && (
                <ScreenState
                    state="loading"
                    message={busy === 'deleting' ? 'Eliminando...' : 'Guardando cambios...'}
                />
            )}

            <div className={styles.footer}>
                <p className={styles.hint}>*Campos obligatorios</p>
                <div className={styles.actions}>
                    {onDelete && (
                        <button
                            type="button"
                            className={styles.delete}
                            disabled={!canDelete || busy !== null}
                            onClick={() => setConfirmingDelete(true)}
                        >
                            Eliminar
                        </button>
                    )}
                    <button type="submit" className={styles.submit} disabled={busy !== null}>
                        {submitLabel}
                    </button>
                </div>
            </div>

            {confirmingDelete && (
                <ConfirmDeleteDialog onConfirm={confirmDelete} onCancel={() => setConfirmingDelete(false)} />
            )}

            {errorDialog && (
                <ErrorDialog
                    title={errorDialog.title}
                    message={errorDialog.message}
                    status={errorDialog.status}
                    hint={ERROR_HINT}
                    actionLabel="Modificar datos"
                    onClose={closeErrorDialog}
                    onCancel={() => navigate('/notifications')}
                />
            )}
        </form>
    )
}