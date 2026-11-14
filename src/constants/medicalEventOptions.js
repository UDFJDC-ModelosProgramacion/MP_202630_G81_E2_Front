// The backend stores the event type as free text. The values keep the spelling used by
// the Postman collections (without accents) so both sources compare as the same type;
// the labels are the ones shown to the user.
export const MEDICAL_EVENT_TYPES = [
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Vacunacion', label: 'Vacunación' },
  { value: 'Cirugia', label: 'Cirugía' },
  { value: 'Tratamiento', label: 'Tratamiento' },
  { value: 'Desparasitacion', label: 'Desparasitación' },
  { value: 'Emergencia', label: 'Emergencia' },
  { value: 'Control', label: 'Control' },
  { value: 'Ingreso', label: 'Ingreso' },
]
