import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ScreenState from '../../components/ScreenState/ScreenState'
import { AVAILABILITIES, SPECIALIZATIONS } from '../../constants/veterinarianOptions'
import { createVeterinarian } from '../../services/veterinarianService'
import { EMPTY_VETERINARIAN, validateVeterinarian } from './validateVeterinarian'
import styles from './RegisterVeterinarianPage.module.css'

const TEXT_FIELDS = [
    { name: 'firstName', label: 'Nombre', type: 'text', placeholder: 'Camila', autoComplete: 'given-name' },
    { name: 'lastName', label: 'Apellido', type: 'text', placeholder: 'Rojas', autoComplete: 'family-name' },
    { name: 'email', label: 'Correo', type: 'email', placeholder: 'camila@refugio.com', autoComplete: 'email' },
    { name: 'phone', label: 'Teléfono', type: 'tel', placeholder: '300 123 4567', autoComplete: 'tel' },
]

const SELECT_FIELDS = [
    { name: 'specialization', label: 'Especialización', options: SPECIALIZATIONS },
    { name: 'availability', label: 'Disponibilidad', options: AVAILABILITIES },
]

const trimValues = (values) =>
    Object.fromEntries(Object.entries(values).map(([name, value]) => [name, value.trim()]))

function Field({ name, label, error, children }) {
    return (
        <div className={styles.field}>
            <label htmlFor={name}>
                {label}
                <span aria-hidden="true">*</span>
            </label>
            {children}
            {error && (
                <p id={`${name}-error`} className={styles.error}>
                    {error}
                </p>
            )}
        </div>
    )
}

export default function RegisterVeterinarianPage() {
    const navigate = useNavigate()
    const [values, setValues] = useState(EMPTY_VETERINARIAN)
    const [errors, setErrors] = useState({})
    const [submitError, setSubmitError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    function handleChange(event) {
        const { name, value } = event.target
        setValues((current) => ({ ...current, [name]: value }))
        setErrors((current) => ({ ...current, [name]: undefined }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        const validation = validateVeterinarian(values)
        setErrors(validation)
        setSubmitError('')
        if (Object.keys(validation).length > 0) return

        setSubmitting(true)
        const veterinarian = trimValues(values)
        try {
            await createVeterinarian(veterinarian)
            navigate('/veterinarians', {
                state: { registered: `${veterinarian.firstName} ${veterinarian.lastName}` },
            })
        } catch (error) {
            
            setSubmitError(error.message)
            setSubmitting(false)
        }
    }

    const fieldProps = (name) => ({
        id: name,
        name,
        value: values[name],
        onChange: handleChange,
        'aria-invalid': errors[name] ? 'true' : undefined,
        'aria-describedby': errors[name] ? `${name}-error` : undefined,
    })

    return (
        <section className={styles.panel}>
            <h1 className={styles.title}>Registre un veterinario</h1>

            <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Registro de veterinario">
                {TEXT_FIELDS.map(({ name, label, type, placeholder, autoComplete }) => (
                    <Field key={name} name={name} label={label} error={errors[name]}>
                        <input {...fieldProps(name)} type={type} placeholder={placeholder} autoComplete={autoComplete} />
                    </Field>
                ))}

                {SELECT_FIELDS.map(({ name, label, options }) => (
                    <Field key={name} name={name} label={label} error={errors[name]}>
                        <select {...fieldProps(name)}>
                            <option value="">Seleccione</option>
                            {options.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </Field>
                ))}

                {submitError && (
                    <div className={styles.wide}>
                        <ScreenState state="error" message={submitError} />
                    </div>
                )}

                <p className={styles.hint}>*Campos obligatorios</p>
                <div className={styles.actions}>
                    <Link to="/veterinarians">Cancelar</Link>
                    <button type="submit" className={styles.submit} disabled={submitting}>
                        {submitting ? 'Registrando...' : 'Registrar'}
                    </button>
                </div>
            </form>
        </section>
    )
}