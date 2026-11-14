import { describe, expect, it } from 'vitest'
import {
  canManageMedicalEvents,
  medicalEventTypeLabel,
  petSummary,
  sortByDateDescending,
  veterinarianName,
} from './medicalEvents'

describe('medicalEventTypeLabel', () => {
  it('maps the stored value to its accented label', () => {
    expect(medicalEventTypeLabel('Cirugia')).toBe('Cirugía')
    expect(medicalEventTypeLabel('Vacunacion')).toBe('Vacunación')
  })

  it('keeps an unknown value untouched', () => {
    expect(medicalEventTypeLabel('Otro')).toBe('Otro')
  })

  it('falls back to a generic title when there is no value', () => {
    expect(medicalEventTypeLabel(null)).toBe('Evento médico')
    expect(medicalEventTypeLabel(undefined)).toBe('Evento médico')
  })
})

describe('veterinarianName', () => {
  it('shows the full name of the veterinarian', () => {
    expect(veterinarianName({ firstName: 'Ana', lastName: 'Ruiz' })).toBe('Dr(a). Ana Ruiz')
  })

  it('shows a message when no veterinarian was assigned', () => {
    expect(veterinarianName(null)).toBe('Sin veterinario asignado')
    expect(veterinarianName({})).toBe('Sin veterinario asignado')
  })
})

describe('petSummary', () => {
  it('joins name, species, and breed', () => {
    expect(petSummary({ name: 'Luna', species: 'Perro', breed: 'Criollo' })).toBe(
      'Luna — Perro · Criollo',
    )
  })

  it('omits the breed when it is missing', () => {
    expect(petSummary({ name: 'Luna', species: 'Perro' })).toBe('Luna — Perro')
  })

  it('returns an empty string when there is no pet', () => {
    expect(petSummary(null)).toBe('')
  })
})

describe('canManageMedicalEvents', () => {
  it('lets the shelter staff edit and delete events', () => {
    expect(canManageMedicalEvents('SHELTER_ADMIN')).toBe(true)
    expect(canManageMedicalEvents('VETERINARIAN')).toBe(true)
  })

  it('keeps the other roles out', () => {
    expect(canManageMedicalEvents('ADOPTER')).toBe(false)
    expect(canManageMedicalEvents('VISITOR')).toBe(false)
    expect(canManageMedicalEvents(undefined)).toBe(false)
  })
})

describe('sortByDateDescending', () => {
  it('puts the newest event first without changing the received array', () => {
    const events = [
      { id: 1, date: '2026-01-09' },
      { id: 2, date: '2026-09-12T05:00:00.000+00:00' },
      { id: 3, date: '2026-09-10' },
    ]

    const sorted = sortByDateDescending(events)

    expect(sorted.map((event) => event.id)).toEqual([2, 3, 1])
    expect(events[0].id).toBe(1)
  })
})
