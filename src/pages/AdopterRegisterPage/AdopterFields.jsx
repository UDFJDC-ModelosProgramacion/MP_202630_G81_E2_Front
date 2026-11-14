import { SelectField, TextField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import { HOUSING_TYPES, YES_NO_OPTIONS } from '../../constants/adopterOptions'
import styles from './AdopterFields.module.css'

// Shared form fields of the adopter profile, reused by the register (HU41)
// and edit (HU44) pages. All fields are required by the backend.
export default function AdopterFields({ values, errors, onChange }) {
  const field = (name, label) => ({
    id: name,
    name,
    label,
    value: values[name],
    error: errors[name],
    required: true,
    onChange,
  })

  return (
    <>
      <FormSection title="Datos personales" description="Identificación del adoptante.">
        <div className={styles.grid}>
          <TextField {...field('firstName', 'Nombres')} placeholder="María Fernanda" />
          <TextField {...field('lastName', 'Apellidos')} placeholder="Gómez Ruiz" />
          <TextField {...field('nationalId', 'Cédula')} placeholder="1020304050" />
          <TextField {...field('email', 'Correo electrónico')} type="email" placeholder="maria@example.com" />
          <TextField {...field('password', 'Contraseña')} type="password" placeholder="••••••••" />
        </div>
      </FormSection>

      <FormSection
        title="Contacto y hogar"
        description="El tipo de vivienda y la presencia de niños u otras mascotas se comparan con los requisitos de cada mascota."
      >
        <div className={styles.grid}>
          <TextField {...field('phone', 'Teléfono')} placeholder="3001234567" />
          <TextField {...field('address', 'Dirección')} placeholder="Calle 45 # 20-30" />
          <SelectField {...field('housingType', 'Tipo de vivienda')} options={HOUSING_TYPES} />
          <SelectField {...field('hasChildren', '¿Hay niños en casa?')} options={YES_NO_OPTIONS} />
          <SelectField
            {...field('hasOtherPets', '¿Hay otras mascotas en casa?')}
            options={YES_NO_OPTIONS}
          />
        </div>
      </FormSection>

      <FormSection
        title="Perfil socioeconómico"
        description="Información que ayuda al refugio a evaluar la suitability del hogar."
      >
        <div className={styles.grid}>
          <TextField {...field('occupation', 'Ocupación')} placeholder="Ingeniera" />
          <TextField
            {...field('earnings', 'Ingresos mensuales')}
            type="number"
            step="0.01"
            min="0"
            placeholder="3500000"
          />
          <TextField
            {...field('allergies', 'Alergias')}
            wide
            placeholder="Ninguna"
          />
        </div>
      </FormSection>
    </>
  )
}
