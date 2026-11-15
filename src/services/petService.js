import { api, expectArray } from './apiClient'

export function getPets() {
  return api.get('/pets').then((data) => expectArray(data, 'el catálogo de mascotas'))
}

export function getPet(petId) {
  return api.get(`/pets/${encodeURIComponent(petId)}`)
}

export function createPet(pet) {
  return api.post('/pets', pet)
}

export function addPetPhoto(petId, photo) {
  return api.post(`/pets/${petId}/photos`, photo)
}