import { formatDay } from '../../utils/dates'

const TIME = /T(\d{2}):(\d{2})/

const text = (value) => (value == null ? '' : String(value).trim())

const initials = (name) => text(name).slice(0, 2).toUpperCase()

export function formatAge(age) {
  if (age == null || age === '') return ''
  return Number(age) === 1 ? '1 año' : `${age} años`
}

// The time comes in its own field or as part of a date-time such as '2026-10-28T09:00:00'.
export function eventTime(event) {
  if (event.time) return text(event.time).slice(0, 5)
  const match = TIME.exec(text(event.date))
  return match ? `${match[1]}:${match[2]}` : ''
}

function toPet(pet) {
  return {
    id: pet.id,
    name: text(pet.name),
    initials: initials(pet.name),
    summary: [text(pet.species), text(pet.breed), formatAge(pet.age), text(pet.size)]
      .filter(Boolean)
      .join(' · '),
  }
}

function toEvent(event) {
  const [day, month = ''] = formatDay(event.date).split(' ')
  const when = [event.date ? formatDay(event.date) : '', eventTime(event)].filter(Boolean)
  const place = text(event.location ?? event.place)
  return {
    id: event.id,
    name: text(event.name),
    day,
    month: month.toUpperCase(),
    summary: [...when, place].filter(Boolean).join(' · '),
    type: text(event.type),
  }
}

// Only what HU03 shows is taken from the response (explicit list of fields). Adoptions, adopters,
// veterinarians, returns and requests belong to other modules and roles, so they are dropped even
// when the back-end sends them.
export function toShelterDetail(response) {
  return {
    id: response.id,
    name: text(response.name),
    city: text(response.city),
    nit: text(response.nit),
    location: text(response.location),
    adminIds: (response.users ?? []).map((user) => user.id),
    pets: (response.pets ?? []).map(toPet),
    events: (response.events ?? []).map(toEvent),
  }
}

export function canManageShelter(session, shelter, adminRole) {
  if (session.role !== adminRole) return false
  return shelter.adminIds.includes(session.userId) || Number(shelter.id) === session.shelterId
}
