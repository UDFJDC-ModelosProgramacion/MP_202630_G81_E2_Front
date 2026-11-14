import { api } from './apiClient'

export function getAdoptionRequests({ petId, status, currentUserRole } = {}) {
  const params = new URLSearchParams()
  if (petId !== undefined && petId !== '') params.set('petId', petId)
  if (status?.trim()) params.set('status', status.trim())
  if (currentUserRole?.trim()) params.set('currentUserRole', currentUserRole.trim())
  const query = params.toString()
  return api.get(query ? `/adoptionRequests?${query}` : '/adoptionRequests')
}
