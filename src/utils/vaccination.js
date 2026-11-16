import { toDateInput } from './dateFields'

export const isApplied = (vaccine) => vaccine.status === true

export const vaccineStatusLabel = (vaccine) => (isApplied(vaccine) ? 'Aplicada' : 'Pendiente')


const sortKey = (vaccine) =>
    isApplied(vaccine)
        ? `0${toDateInput(vaccine.administrationDate)}`
        : `1${toDateInput(vaccine.nextAdministration)}`

export const sortVaccines = (vaccines) =>
    [...vaccines].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))