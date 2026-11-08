import { ADOPTION_STATUSES } from '../constants/adoptionOptions'
import { ROLES } from '../config/roleSession'

export function adoptionStatusLabel(value) {
  return ADOPTION_STATUSES.find((option) => option.value === value)?.label ?? value ?? 'Sin estado'
}

// The adopter who takes part in the adoption and the shelter that owns its pet can see it.
export function canViewAdoption(adoption, session) {
  if (session.role === ROLES.ADOPTER) {
    return Number(adoption.adopter?.id) === Number(session.userId)
  }
  if (session.role === ROLES.SHELTER_ADMIN) {
    return Number(adoption.pet?.shelter?.id) === Number(session.shelterId)
  }
  return false
}

// A pet is adopted while it has an adoption that was not cancelled (the back-end rule).
export function hasActiveAdoption(pet) {
  return (pet?.adoptions ?? []).some((adoption) => adoption.status !== 'CANCELLED')
}
