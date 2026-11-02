import { SelectField, TextField } from '../../components/FormField/FormField'
import FormSection from '../../components/FormSection/FormSection'
import { HOUSING_TYPES, YES_NO_OPTIONS } from '../../constants/adopterOptions'
import styles from './AdopterEditPage.module.css'

// Editable fields of the adopter profile (HU44). Identity and contact data are
// shown read-only because the backend keeps them intact on update.
export default function AdopterEditFields({ values, errors, onChange }) {
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
      <FormSection
        title="Contacto y hogar"
        description="El tipo de vivienda y la presencia de niños u otras mascotas se comparan con los requisitos de cada mascota."
      >
        <div className={styles.grid}>
          <TextField
            {...field('address', 'Dirección')}
            wide
            placeholder="Calle 45 # 20-30"
          />
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
        description="Información que ayuda al refugio a evaluar la idoneidad del hogar."
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
          <TextField {...field('allergies', 'Alergias')} wide placeholder="Ninguna" />
        </div>
      </FormSection>
    </>
  )
}
