import { api } from './apiClient'

export function getMedicalEvents({ petId, type, date } = {}) {
  const params = new URLSearchParams()
  if (petId !== undefined && petId !== '') params.set('petId', petId)
  if (type?.trim()) params.set('type', type.trim())
  if (date?.trim()) params.set('date', date.trim())
  const query = params.toString()
  return api.get(query ? `/medicalEvents?${query}` : '/medicalEvents')
}

export function getMedicalEvent(medicalEventId) {
  return api.get(`/medicalEvents/${encodeURIComponent(medicalEventId)}`)
}

export function createMedicalEvent(medicalEvent) {
  return api.post('/medicalEvents', medicalEvent)
}

export function updateMedicalEvent(medicalEventId, medicalEvent) {
  return api.put(`/medicalEvents/${encodeURIComponent(medicalEventId)}`, medicalEvent)
}

export function deleteMedicalEvent(medicalEventId) {
  return api.delete(`/medicalEvents/${encodeURIComponent(medicalEventId)}`)
}
