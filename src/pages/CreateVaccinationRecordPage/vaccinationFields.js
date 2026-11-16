export const PET_REQUIRED = 'Selecciona una mascota.'

const FIELD_BY_BACKEND_MESSAGE = {
    'Pet not found': 'petId',
    'This pet already has a vaccination record': 'petId',
    'Vaccination record must be associated with an existing pet': 'petId',
}

export const fieldOfBackendMessage = (message) => FIELD_BY_BACKEND_MESSAGE[message] ?? null

export const validatePet = (petId) => (petId ? '' : PET_REQUIRED)


export const petsWithoutRecord = (pets) => pets.filter((pet) => !pet.vaccinationRecord)

const petName = (pet) => pet.name || `Mascota ${pet.id}`


export function petOptions(pets) {
    const counts = new Map()
    pets.forEach((pet) => counts.set(petName(pet), (counts.get(petName(pet)) ?? 0) + 1))
    return pets.map((pet) => ({
        value: String(pet.id),
        label: counts.get(petName(pet)) > 1 ? `${petName(pet)} (N.º ${pet.id})` : petName(pet),
    }))
}


export const preselectedPet = (petId, options) =>
    options.some((option) => option.value === String(petId ?? '')) ? String(petId) : ''