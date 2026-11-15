import { describe, expect, it } from 'vitest'
import { canManageShelter, eventTime, formatAge, toShelterDetail } from './shelterDetail'

describe('formatAge', () => {
  it('uses the singular for one year and the plural otherwise', () => {
    expect(formatAge(1)).toBe('1 año')
    expect(formatAge(0)).toBe('0 años')
    expect(formatAge(4)).toBe('4 años')
  })

  it('returns nothing when there is no age', () => {
    expect(formatAge(null)).toBe('')
    expect(formatAge(undefined)).toBe('')
  })
})

describe('eventTime', () => {
  it('reads the time of a date-time', () => {
    expect(eventTime({ date: '2026-10-28T09:30:00' })).toBe('09:30')
  })

  it('prefers a separate time field and trims its seconds', () => {
    expect(eventTime({ date: '2026-10-28', time: '14:05:00' })).toBe('14:05')
  })

  it('returns nothing when the event has no time', () => {
    expect(eventTime({ date: '2026-10-28' })).toBe('')
  })
})

describe('toShelterDetail', () => {
  it('keeps the shelter data and builds the rows of pets and events', () => {
    const detail = toShelterDetail({
      id: 3,
      name: ' Patitas Felices ',
      city: 'Bogotá',
      nit: '9014587123',
      location: 'Calle 127 # 45-20',
      users: [{ id: 5 }],
      pets: [{ id: 8, name: 'Luna', species: 'Perro', breed: 'Criollo', age: 2, size: 'Mediano' }],
      events: [
        {
          id: 9,
          name: 'Jornada de Adopción',
          date: '2026-10-28T09:00:00',
          location: 'Parque El Virrey',
          type: 'Adopción',
        },
      ],
    })

    expect(detail).toMatchObject({
      id: 3,
      name: 'Patitas Felices',
      city: 'Bogotá',
      nit: '9014587123',
      location: 'Calle 127 # 45-20',
      adminIds: [5],
    })
    expect(detail.pets[0]).toEqual({
      id: 8,
      name: 'Luna',
      initials: 'LU',
      summary: 'Perro · Criollo · 2 años · Mediano',
    })
    expect(detail.events[0]).toEqual({
      id: 9,
      name: 'Jornada de Adopción',
      day: '28',
      month: 'OCT',
      summary: '28 oct 2026 · 09:00 · Parque El Virrey',
      type: 'Adopción',
    })
  })

  it('accepts "place" as the name of the event location', () => {
    const [event] = toShelterDetail({ events: [{ id: 1, name: 'Feria', date: '2026-11-19', place: 'Suba' }] })
      .events

    expect(event.summary).toBe('19 nov 2026 · Suba')
  })

  it('shows only the place when the event has no date', () => {
    const [event] = toShelterDetail({ events: [{ id: 1, name: 'Feria', location: 'Suba' }] }).events

    expect(event).toMatchObject({ day: '—', month: '', summary: 'Suba' })
  })

  it('drops what belongs to other modules and roles', () => {
    const detail = toShelterDetail({
      id: 1,
      name: 'Patitas Felices',
      adoptions: [{ id: 1 }],
      adopters: [{ id: 2 }],
      veterinarians: [{ id: 3 }],
      returns: [{ id: 4 }],
      adopterRequests: [{ id: 5 }],
      pets: [{ id: 8, name: 'Luna', adoption: { id: 1 }, medicalEvents: [{ id: 2 }] }],
    })

    expect(Object.keys(detail).sort()).toEqual(
      ['adminIds', 'city', 'events', 'id', 'location', 'name', 'nit', 'pets'].sort(),
    )
    expect(Object.keys(detail.pets[0]).sort()).toEqual(['id', 'initials', 'name', 'summary'])
  })

  it('treats missing lists as empty', () => {
    const detail = toShelterDetail({ id: 1, name: 'Vacío' })

    expect(detail.pets).toEqual([])
    expect(detail.events).toEqual([])
    expect(detail.adminIds).toEqual([])
  })
})

describe('canManageShelter', () => {
  const ADMIN = 'SHELTER_ADMIN'
  const session = { role: ADMIN, userId: 1, shelterId: 1 }

  it('allows the administrator of that shelter', () => {
    expect(canManageShelter(session, { id: 1, adminIds: [] }, ADMIN)).toBe(true)
  })

  it('allows an administrator listed among the users of the shelter', () => {
    expect(canManageShelter(session, { id: 7, adminIds: [1] }, ADMIN)).toBe(true)
  })

  it('denies an administrator of another shelter', () => {
    expect(canManageShelter(session, { id: 7, adminIds: [2] }, ADMIN)).toBe(false)
  })

  it('denies any other role', () => {
    expect(canManageShelter({ ...session, role: 'ADOPTER' }, { id: 1, adminIds: [1] }, ADMIN)).toBe(
      false,
    )
  })
})