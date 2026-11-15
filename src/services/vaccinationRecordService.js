import { api } from './apiClient'

export const getVaccinationRecordByPet = (petId) =>
  api.get(`/vaccinationRecords/pet/${encodeURIComponent(petId)}`)


export const createVaccinationRecord = (petId) =>
  api.post('/vaccinationRecords', { pet: { id: Number(petId) } })

export const deleteVaccinationRecord = (recordId) =>
  api.delete(`/vaccinationRecords/${encodeURIComponent(recordId)}`)