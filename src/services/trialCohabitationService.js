import { api } from './apiClient'

export function getTrialCohabitationRequests({ adopterId, petId, status } = {}) {
  const params = new URLSearchParams()
  if (adopterId !== undefined && adopterId !== '') params.set('adopterId', adopterId)
  if (petId !== undefined && petId !== '') params.set('petId', petId)
  if (status?.trim()) params.set('status', status.trim())
  const query = params.toString()
  return api.get(query ? `/trialCohabitationRequests?${query}` : '/trialCohabitationRequests')
}

export function getTrialCohabitationRequest(requestId) {
  return api.get(`/trialCohabitationRequests/${encodeURIComponent(requestId)}`)
}

export function updateTrialCohabitationRequest(requestId, request) {
  return api.put(`/trialCohabitationRequests/${encodeURIComponent(requestId)}`, request)
}

export function createTrialCohabitationRequest(request) {
  return api.post('/trialCohabitationRequests', request)
}
