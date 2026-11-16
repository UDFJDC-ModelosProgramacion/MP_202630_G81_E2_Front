import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ErrorDialog from '../../components/ErrorDialog/ErrorDialog'
import { SelectField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import ScreenState from '../../components/ScreenState/ScreenState'
import { getSession, ROLES } from '../../config/roleSession'
import { getPets } from '../../services/petService'
import { createVaccinationRecord } from '../../services/vaccinationRecordService'
import {
    fieldOfBackendMessage,
    petOptions,
    petsWithoutRecord,
    preselectedPet,
    validatePet,
} from './vaccinationFields'
import styles from './CreateVaccinationRecordPage.module.css'

const ERROR_HINT = 'Seleccione otra mascota o regrese al listado de mascotas.'

function CreateVaccinationRecordForm({ options, initialPetId }) {
    const navigate = useNavigate()
    const [petId, setPetId] = useState(initialPetId)
    const [error, setError] = useState('')
    const [errorDialog, setErrorDialog] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    function handleChange(event) {
        setPetId(event.target.value)
        setError('')
    }

    function closeErrorDialog() {
        const { field } = errorDialog
        setErrorDialog(null)
        if (field) document.getElementById(field)?.focus()
    }

    async function handleSubmit(event) {
        event.preventDefault()
        const found = validatePet(petId)
        setError(found)
        if (found) {
            document.getElementById('petId')?.focus()
            return
        }

        setSubmitting(true)
        try {
            await createVaccinationRecord(petId)
            await navigate(`/pets/${petId}/vaccination-record`, { state: { created: true } })
        } catch (requestError) {
            const field = fieldOfBackendMessage(requestError.message)
            setError(field ? requestError.message : '')
            setErrorDialog({ message: requestError.message, status: requestError.status, field })
            setSubmitting(false)
        }
    }

    return (
        <form
            className={styles.form}
            noValidate
            onSubmit={(event) => { void handleSubmit(event) }}
            aria-label="Creación de carnet de vacunación"
        >
            <FormSection title="Datos del carnet">
                <div className={styles.grid}>
                    <SelectField
                        id="petId"
                        name="petId"
                        label="Mascota"
                        required
                        placeholder="Seleccione una mascota"
                        options={options}
                        value={petId}
                        error={error}
                        onChange={handleChange}
                    />
                    <p className={styles.notice}>
                        <span className={styles.noticeIcon} aria-hidden="true">
                            !
                        </span>
                        Cada mascota solo puede tener un carnet de vacunación.
                    </p>
                </div>
            </FormSection>

            {submitting && <ScreenState state="loading" message="Creando carnet..." />}

            <div className={styles.footer}>
                <p className={styles.hint}>*Campos obligatorios</p>
                <button type="submit" className={styles.submit} disabled={submitting}>
                    Crear carnet
                </button>
            </div>

            {errorDialog && (
                <ErrorDialog
                    title="Error al crear el carnet"
                    message={errorDialog.message}
                    status={errorDialog.status}
                    hint={ERROR_HINT}
                    actionLabel="Modificar datos"
                    onClose={closeErrorDialog}
                    onCancel={() => { void navigate('/pets') }}
                />
            )}
        </form>
    )
}

function CreateVaccinationRecordLoader() {
    const [searchParams] = useSearchParams()
    const [result, setResult] = useState({ status: 'loading', pets: [], message: '' })

    useEffect(() => {
        let cancelled = false
        getPets()
            .then((pets) => {
                if (!cancelled) setResult({ status: 'ready', pets, message: '' })
            })
            .catch((error) => {
                if (!cancelled) setResult({ status: 'error', pets: [], message: error.message })
            })
        return () => {
            cancelled = true
        }
    }, [])

    const { status, pets, message } = result
    if (status === 'loading') return <ScreenState state="loading" />
    if (status === 'error') return <ScreenState state="error" message={message} />

    const options = petOptions(petsWithoutRecord(pets))
    if (options.length === 0) {
        return <ScreenState state="empty" message="Todas las mascotas ya tienen carnet de vacunación." />
    }
    return (
        <CreateVaccinationRecordForm
            options={options}
            initialPetId={preselectedPet(searchParams.get('petId'), options)}
        />
    )
}

export default function CreateVaccinationRecordPage() {
    const allowed = getSession().role === ROLES.SHELTER_ADMIN

    return (
        <section className={styles.page}>
            <Link to="/pets">Volver a las mascotas</Link>
            <h1 className={styles.title}>Crear carnet de vacunación</h1>
            {allowed ? (
                <CreateVaccinationRecordLoader />
            ) : (
                <ScreenState
                    state="error"
                    message="Solo el administrador de un refugio puede crear carnets de vacunación."
                />
            )}
        </section>
    )
}