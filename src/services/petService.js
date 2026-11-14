import { api } from './apiClient'

export function createPet(pet) {
  return api.post('/pets', pet)
}

export function addPetPhoto(petId, photo) {
  return api.post(`/pets/${petId}/photos`, photo)
}