import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import { SelectField, TextField } from '../../components/FormField/FormField'
import FormActions from '../../components/FormActions/FormActions'
import FormSection from '../../components/FormSection/FormSection'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/session'
import { AVAILABILITIES, SPECIALIZATIONS } from '../../constants/veterinarianOptions'
import { getVeterinarian, updateVeterinarian } from '../../services/veterinarianService'
import {
    buildUpdatePayload,
    fieldOfBackendMessage,
    fullName,
    initialValues,
    validateUpdate,
    withCurrentOption,
} from './updateVeterinarianForm'
import styles from './UpdateVeterinarianPage.module.css'

const ERROR_HINT =
    'Verifique la especialización y la disponibilidad antes de continuar o regrese al listado de veterinarios.'

const withoutKey = (object, key) => Object.fromEntries(Object.entries(object).filter(([k]) => k !== key))

function UpdateVeterinarianForm({ veterinarian }) {
    const navigate = useNavigate()
    const [values, setValues] = useState(() => initialValues(veterinarian))
    const [errors, setErrors] = useState({})
    const [errorDialog, setErrorDialog] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const profilePath = `/veterinarians/${veterinarian.id}`

    function handleChange(event) {
        const { name, value } = event.target
        setValues((current) => ({ ...current, [name]: value }))
        setErrors((current) => withoutKey(current, name))
    }

    function showBackendError(error) {
        const field = fieldOfBackendMessage(error.message)
        setErrors(field ? { [field]: error.message } : {})
        setErrorDialog({ message: error.message, status: error.status, field })
    }

    function closeErrorDialog() {
        const { field } = errorDialog
        setErrorDialog(null)
        if (field) document.getElementById(field)?.focus()
    }

    async function handleSubmit(event) {
        event.preventDefault()
        const found = validateUpdate(values)
        setErrors(found)
        const [firstInvalid] = Object.keys(found)
        if (firstInvalid) {
            document.getElementById(firstInvalid)?.focus()
            return
        }

        setSubmitting(true)
        try {
            await updateVeterinarian(veterinarian.id, buildUpdatePayload(values))
            navigate(profilePath, { state: { updated: true } })
        } catch (error) {
            showBackendError(error)
            setSubmitting(false)
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
        <section className={styles.page}>
            <header>
                <h1 className={styles.title}>Actualizar veterinario</h1>
                <p className={styles.subtitle}>
                    Mantenga al día la información que ven los usuarios al agendar citas.
                </p>
            </header>

            <form
                className={styles.form}
                noValidate
                onSubmit={handleSubmit}
                aria-label="Actualización de veterinario"
            >
                <FormSection title="Datos del veterinario">
                    <div className={styles.grid}>
                        <TextField
                            id="veterinarian"
                            name="veterinarian"
                            label="Veterinario"
                            value={fullName(veterinarian)}
                            readOnly
                        />
                        <p className={styles.notice}>
                            <span className={styles.noticeIcon} aria-hidden="true">
                                !
                            </span>
                            Solo se pueden modificar la especialización y la disponibilidad.
                        </p>
                        <SelectField
                            {...field('specialization', 'Especialización')}
                            options={withCurrentOption(SPECIALIZATIONS, veterinarian.specialization)}
                        />
                        <SelectField
                            {...field('availability', 'Disponibilidad')}
                            options={withCurrentOption(AVAILABILITIES, veterinarian.availability)}
                        />
                    </div>
                </FormSection>

                {submitting && <ScreenState state="loading" message="Guardando cambios..." />}
                <FormActions
                    submitLabel="Guardar"
                    submitting={submitting}
                    onCancel={() => navigate(profilePath)}
                />
            </form>

            {errorDialog && (
                <ErrorDialog
                    title="Error al actualizar el veterinario"
                    message={errorDialog.message}
                    status={errorDialog.status}
                    hint={ERROR_HINT}
                    actionLabel="Modificar datos"
                    onClose={closeErrorDialog}
                    onCancel={() => navigate('/veterinarians')}
                />
            )}
        </section>
    )
}

function UpdateVeterinarianLoader({ veterinarianId }) {
    const [result, setResult] = useState({ status: 'loading', veterinarian: null, message: '' })

    useEffect(() => {
        let cancelled = false
        getVeterinarian(veterinarianId)
            .then((veterinarian) => {
                if (!cancelled) setResult({ status: 'ready', veterinarian, message: '' })
            })
            .catch((error) => {
                if (!cancelled) setResult({ status: 'error', veterinarian: null, message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [veterinarianId])

    const { status, veterinarian, message } = result
    if (status === 'loading') return <ScreenState state="loading" />
    if (status === 'error') {
        return (
            <>
                <ScreenState state="error" message={message} />
                <Link to="/veterinarians">Volver al listado</Link>
            </>
        )
    }
    return <UpdateVeterinarianForm veterinarian={veterinarian} />
}

export default function UpdateVeterinarianPage() {
    const { veterinarianId } = useParams()
    if (getSession().role !== ROLES.SHELTER_ADMIN) {
        return (
            <section className={styles.page}>
                <h1 className={styles.title}>Actualizar veterinario</h1>
                <ScreenState
                    state="error"
                    message="Solo el administrador de un refugio puede actualizar veterinarios."
                />
            </section>
        )
    }
    return <UpdateVeterinarianLoader key={veterinarianId} veterinarianId={veterinarianId} />
}