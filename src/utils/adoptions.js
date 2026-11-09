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

// A finalized or cancelled adoption cannot be modified (the back-end rule).
export function isClosedAdoption(adoption) {
  return ['FINALIZED', 'CANCELLED'].includes(adoption.status)
}

// Only the shelter that owns the pet edits an adoption that is still in progress.
export function canEditAdoption(adoption, session) {
  return (
    session.role === ROLES.SHELTER_ADMIN &&
    Number(adoption.pet?.shelter?.id) === Number(session.shelterId) &&
    !isClosedAdoption(adoption)
  )
}

// The shelter deletes an adoption that is not in progress and has no reviews or follow-ups (the
// back-end rules). The back-end still checks them, so a refused deletion shows its message.
export function canDeleteAdoption(adoption, session) {
  return (
    session.role === ROLES.SHELTER_ADMIN &&
    Number(adoption.pet?.shelter?.id) === Number(session.shelterId) &&
    adoption.status !== 'IN_PROGRESS' &&
    (adoption.reviews ?? []).length === 0 &&
    (adoption.followUps ?? []).length === 0
  )
}

// A pet is adopted while it has an adoption that was not cancelled (the back-end rule).
export function hasActiveAdoption(pet) {
  return (pet?.adoptions ?? []).some((adoption) => adoption.status !== 'CANCELLED')
}
