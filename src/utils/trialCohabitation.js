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

// Only a pending request can be approved or rejected; the back-end blocks any other change.
export function isPendingRequest(request) {
  return request.status === 'PENDING'
}

// Only the shelter that owns the pet approves or rejects a pending request.
export function canDecideTrialRequest(request, session) {
  return (
    session.role === ROLES.SHELTER_ADMIN &&
    Number(request.pet?.shelter?.id) === Number(session.shelterId) &&
    isPendingRequest(request)
  )
}

// Only the adopter who sent a pending request can cancel it.
export function canCancelTrialRequest(request, session) {
  return (
    session.role === ROLES.ADOPTER &&
    Number(request.adopter?.id) === Number(session.userId) &&
    isPendingRequest(request)
  )
}

// The back-end keeps the adopter, the pet, and the period when they are not sent, and it
// requires the description, so a decision only needs the new status and the description.
export function buildDecisionPayload(request, status) {
  return { status, description: request.description }
}
