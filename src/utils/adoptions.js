import { ADOPTION_STATUSES } from '../constants/adoptionOptions'

export function adoptionStatusLabel(value) {
  return ADOPTION_STATUSES.find((option) => option.value === value)?.label ?? value ?? 'Sin estado'
}

// A pet is adopted while it has an adoption that was not cancelled (the back-end rule).
export function hasActiveAdoption(pet) {
  return (pet?.adoptions ?? []).some((adoption) => adoption.status !== 'CANCELLED')
}
