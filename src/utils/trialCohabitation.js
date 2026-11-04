import { TRIAL_REQUEST_STATUSES } from '../constants/trialCohabitationOptions'
import { ROLES } from '../config/roleSession'

export function trialRequestStatusLabel(value) {
  return TRIAL_REQUEST_STATUSES.find((option) => option.value === value)?.label ?? value ?? 'Sin estado'
}

// The adopter sees the requests they sent; the shelter sees the requests for its pets.
export function canViewTrialRequest(request, session) {
  if (session.role === ROLES.ADOPTER) {
    return Number(request.adopter?.id) === Number(session.userId)
  }
  if (session.role === ROLES.SHELTER_ADMIN) {
    return Number(request.pet?.shelter?.id) === Number(session.shelterId)
  }
  return false
}
