import { api } from './apiClient'

export function getMedicalEvents({ petId } = {}) {
  const params = new URLSearchParams()
  if (petId !== undefined && petId !== '') params.set('petId', petId)
  const query = params.toString()
  return api.get(query ? `/medicalEvents?${query}` : '/medicalEvents')
}

export function getMedicalEvent(medicalEventId) {
  return api.get(`/medicalEvents/${encodeURIComponent(medicalEventId)}`)
}

export function createMedicalEvent(medicalEvent) {
  return api.post('/medicalEvents', medicalEvent)
}
