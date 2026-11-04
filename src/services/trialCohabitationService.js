import { api } from './apiClient'

export function createTrialCohabitationRequest(request) {
  return api.post('/trialCohabitationRequests', request)
}
