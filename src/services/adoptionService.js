import { api } from './apiClient'

export function getAdoptions({ adopterId, petId, shelterId, status } = {}) {
  const params = new URLSearchParams()
  if (adopterId !== undefined && adopterId !== '') params.set('adopterId', adopterId)
  if (petId !== undefined && petId !== '') params.set('petId', petId)
  if (shelterId !== undefined && shelterId !== '') params.set('shelterId', shelterId)
  if (status?.trim()) params.set('status', status.trim())
  const query = params.toString()
  return api.get(query ? `/adoptions?${query}` : '/adoptions')
}

export function getAdoption(adoptionId) {
  return api.get(`/adoptions/${encodeURIComponent(adoptionId)}`)
}

export function updateAdoption(adoptionId, adoption) {
  return api.put(`/adoptions/${encodeURIComponent(adoptionId)}`, adoption)
}

export function createAdoption(adoption) {
  return api.post('/adoptions', adoption)
}
