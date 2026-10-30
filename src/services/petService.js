import { api } from './apiClient'

// Registers a pet together with its arrival event(s). The backend answers 201 with the
// created pet (including its id) or an apierror with a 404/412 message.
export function createPet(pet) {
  return api.post('/pets', pet)
}


// Adds a photo to an existing pet. The backend answers 201 with the created photo or an
// apierror with a 404/412 message.
export function addPetPhoto(petId, photo) {
  return api.post(`/pets/${petId}/photos`, photo)
}
