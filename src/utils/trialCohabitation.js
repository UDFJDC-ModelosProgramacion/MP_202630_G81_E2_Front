import { TRIAL_REQUEST_STATUSES } from '../constants/trialCohabitationOptions'

export function trialRequestStatusLabel(value) {
  return TRIAL_REQUEST_STATUSES.find((option) => option.value === value)?.label ?? value ?? 'Sin estado'
}
