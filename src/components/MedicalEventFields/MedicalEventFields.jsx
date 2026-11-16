import { MEDICAL_EVENT_TYPES } from '../../constants/medicalEventOptions'
import { SelectField, TextAreaField, TextField } from '../FormField/FormField'

export default function MedicalEventFields({ values, errors, onChange, today, veterinarianOptions }) {
  return (
    <>
      <SelectField
        id="veterinarianId"
        name="veterinarianId"
        label="Veterinario"
        required
        options={veterinarianOptions}
        placeholder="Seleccione el veterinario"
        value={values.veterinarianId}
        error={errors.veterinarianId}
        onChange={onChange}
      />
      <TextField
        id="date"
        name="date"
        label="Fecha del evento (hasta hoy)"
        required
        type="date"
        max={today}
        value={values.date}
        error={errors.date}
        onChange={onChange}
      />
      <SelectField
        id="type"
        name="type"
        label="Tipo de evento"
        required
        options={MEDICAL_EVENT_TYPES}
        placeholder="Seleccione el tipo"
        value={values.type}
        error={errors.type}
        onChange={onChange}
      />
      <TextAreaField
        id="description"
        name="description"
        label="Descripción"
        required
        wide
        rows={4}
        value={values.description}
        error={errors.description}
        onChange={onChange}
      />
    </>
  )
}
