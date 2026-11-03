import { api } from './apiClient'

export function createMedicalEvent(medicalEvent) {
  return api.post('/medicalEvents', medicalEvent)
}
