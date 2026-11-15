import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog'
import ErrorDialog from '../ErrorDialog/ErrorDialog'
import { TextAreaField, TextField } from '../FormField/FormField'
import FormSection from '../FormSection/FormSection'
import ScreenState from '../ScreenState/ScreenState'
import StarRating from '../StarRating/StarRating'
import {
    buildReviewPayload,
    EMPTY_VALUES,
    fieldOfBackendMessage,
    timeOfDay,
    validateReview,
} from './reviewFields'
import styles from './ReviewForm.module.css'

const SAVE_ERROR_TITLE = 'Error al guardar la reseña'
const DELETE_ERROR_TITLE = 'Error al eliminar la reseña'
const ERROR_HINT = 'Verifique los datos de la reseña o regrese al listado de reseñas.'

const withoutKey = (object, key) =>
    Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))


export default function ReviewForm({
    petName,
    defaultValues = EMPTY_VALUES,
    time,
    ariaLabel,
    submitLabel,
    notice,
    backPath,
    onSubmit,
    onDelete,
}) {
    const navigate = useNavigate()
    const [values, setValues] = useState(defaultValues)
    const [errors, setErrors] = useState({})
    const [errorDialog, setErrorDialog] = useState(null)
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [busy, setBusy] = useState(null)

    const [writtenAt] = useState(() => timeOfDay())

    function handleChange(event) {
        const { name, value } = event.target
        setValues((current) => ({ ...current, [name]: value }))
        setErrors((current) => withoutKey(current, name))
    }

    function handleRating(rating) {
        setValues((current) => ({ ...current, rating }))
        setErrors((current) => withoutKey(current, 'rating'))
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
        const found = validateReview(values)
        setErrors(found)
        const [firstInvalid] = Object.keys(found)
        if (firstInvalid) {
            document.getElementById(firstInvalid)?.focus()
            return
        }

        setBusy('saving')
        try {
            await onSubmit(buildReviewPayload(values, time || writtenAt))
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

    return (
        <form className={styles.form} noValidate onSubmit={handleSubmit} aria-label={ariaLabel}>
            <FormSection title="Datos de la reseña">
                <div className={styles.grid}>
                    <TextField id="pet" name="pet" label="Mascota" value={petName} readOnly />
                    <StarRating
                        id="rating"
                        label="Calificación"
                        value={values.rating}
                        error={errors.rating}
                        onChange={handleRating}
                    />
                    <TextField
                        id="date"
                        name="date"
                        label="Fecha"
                        type="date"
                        required
                        value={values.date}
                        error={errors.date}
                        onChange={handleChange}
                    />
                    <TextAreaField
                        id="comment"
                        name="comment"
                        label="Comentario"
                        required
                        rows={4}
                        placeholder="Cuéntenos su experiencia con la adopción..."
                        value={values.comment}
                        error={errors.comment}
                        onChange={handleChange}
                    />
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
                            disabled={busy !== null}
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
                <ConfirmDialog
                    title="¿Eliminar la reseña?"
                    confirmLabel="Eliminar"
                    message="Esta acción no se puede deshacer."
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmingDelete(false)}
                />
            )}

            {errorDialog && (
                <ErrorDialog
                    title={errorDialog.title}
                    message={errorDialog.message}
                    status={errorDialog.status}
                    hint={ERROR_HINT}
                    actionLabel="Modificar datos"
                    onClose={closeErrorDialog}
                    onCancel={() => navigate(backPath)}
                />
            )}
        </form>
    )
}