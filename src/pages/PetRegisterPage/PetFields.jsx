import { SelectField, TextAreaField, TextField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import {
  ACTIVITY_LEVELS,
  REQUIRED_SPACES,
  SEXES,
  SIZES,
  SPECIES,
} from '../../constants/petOptions'
import styles from './PetRegisterPage.module.css'

const YES_NO = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]

// Builds one renderer per kind of control, already wired to the form state.
function createFieldRenderers({ values, errors, onChange }) {
  const common = (name, label, extra) => ({
    id: name,
    name,
    label,
    value: values[name],
    error: errors[name],
    onChange,
    ...extra,
  })
  return {
    text: (name, label, extra = {}) => <TextField {...common(name, label, extra)} />,
    textArea: (name, label, extra = {}) => <TextAreaField {...common(name, label, extra)} />,
    select: (name, label, options, extra = {}) => (
      <SelectField {...common(name, label, extra)} options={options} />
    ),
  }
}

function BasicInformation({ text, select }) {
  return (
    <FormSection title="Información básica" description="Identificación de la mascota rescatada.">
      <div className={styles.grid}>
        {text('name', 'Nombre', { required: true })}
        {select('species', 'Especie', SPECIES, { required: true })}
        {text('breed', 'Raza', { required: true })}
        {text('age', 'Edad', { required: true, type: 'number', min: 0, step: 1 })}
        {select('sex', 'Sexo', SEXES, { required: true })}
        {select('size', 'Tamaño', SIZES, { required: true })}
      </div>
    </FormSection>
  )
}

function HealthAndCompatibility({ text, select, today }) {
  return (
    <FormSection
      title="Salud y compatibilidad"
      description="Condiciones y entorno para una adopción responsable."
    >
      <div className={styles.grid}>
        {text('healthStatus', 'Estado de salud', { required: true })}
        {text('admissionDate', 'Fecha de ingreso (hasta hoy)', {
          required: true,
          type: 'date',
          max: today,
        })}
        {select('activityLevel', 'Nivel de actividad', ACTIVITY_LEVELS, { required: true })}
        {select('requiredSpace', 'Espacio requerido', REQUIRED_SPACES, { required: true })}
        {select('compatibilityChildren', 'Compatible con niños', YES_NO, { required: true })}
        {select('compatibilityOtherPets', 'Compatible con otras mascotas', YES_NO, {
          required: true,
        })}
      </div>
    </FormSection>
  )
}

function Behavior({ text, textArea }) {
  return (
    <FormSection
      title="Comportamiento y observaciones"
      description="Pueden ser desconocidos en un rescate; se completan cuando se conozcan (HU06)."
    >
      <div className={styles.grid}>
        {text('temperament', 'Temperamento')}
        {text('specificNeeds', 'Necesidades específicas', { wide: true })}
        {textArea('description', 'Descripción', { rows: 4, wide: true })}
      </div>
    </FormSection>
  )
}

// Fields of the pet itself, grouped in cards. The first twelve are required; description,
// temperament and specific needs may be unknown in a rescue (HU06).
export default function PetFields({ values, errors, today, onChange }) {
  const renderers = createFieldRenderers({ values, errors, onChange })
  return (
    <>
      <BasicInformation {...renderers} />
      <HealthAndCompatibility {...renderers} today={today} />
      <Behavior {...renderers} />
    </>
  )
}
