import { MEDICAL_EVENT_TYPES } from '../constants/medicalEventOptions'
import { ROLES } from '../config/session'

// The back-end stores the type as a plain value (Cirugia, Vacunacion, ...); the screen
// shows the accented label of the shared option list and falls back to the raw value.
export function medicalEventTypeLabel(value) {
  return (
    MEDICAL_EVENT_TYPES.find((option) => option.value === value)?.label ??
    value ??
    'Evento médico'
  )
}

export function veterinarianName(veterinarian) {
  if (!veterinarian) return 'Sin veterinario asignado'
  const name = `Dr(a). ${veterinarian.firstName ?? ''} ${veterinarian.lastName ?? ''}`.trim()
  return name === 'Dr(a).' ? 'Sin veterinario asignado' : name
}

export function petSummary(pet) {
  if (!pet) return ''
  const breed = pet.breed ? ` · ${pet.breed}` : ''
  return `${pet.name ?? ''} — ${pet.species ?? ''}${breed}`
}

// Editing and deleting medical events is reserved to the shelter staff (HU23 uses the same rule).
export function canManageMedicalEvents(role) {
  return role === ROLES.SHELTER_ADMIN || role === ROLES.VETERINARIAN
}
