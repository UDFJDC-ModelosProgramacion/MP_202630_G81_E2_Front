import { SelectField, TextField } from '../../components/FormField/FormField'
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

// Fields of the pet itself, in the order of the mock-up. The first twelve are required;
// description, temperament and specific needs may be unknown in a rescue (HU06).
export default function PetFields({ values, errors, today, onChange }) {
  const text = (name, label, extra = {}) => (
    <TextField
      id={name}
      name={name}
      label={label}
      value={values[name]}
      error={errors[name]}
      onChange={onChange}
      {...extra}
    />
  )
  const select = (name, label, options, extra = {}) => (
    <SelectField
      id={name}
      name={name}
      label={label}
      options={options}
      value={values[name]}
      error={errors[name]}
      onChange={onChange}
      {...extra}
    />
  )

  return (
    <div className={styles.grid}>
      {text('name', 'Nombre', { required: true })}
      {select('species', 'Especie', SPECIES, { required: true })}
      {text('breed', 'Raza', { required: true })}
      {text('age', 'Edad', { required: true, type: 'number', min: 0, step: 1 })}
      {select('sex', 'Sexo', SEXES, { required: true })}
      {select('size', 'Tamaño', SIZES, { required: true })}
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
      {text('description', 'Descripción')}
      {text('temperament', 'Temperamento')}
      {text('specificNeeds', 'Necesidades específicas')}
    </div>
  )
}
