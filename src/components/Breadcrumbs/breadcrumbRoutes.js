import { generatePath, matchPath } from 'react-router-dom'
import { trimTrailingSlashes } from '../../utils/trimTrailingSlashes'

const ROUTES = [
  { path: '/', label: 'Inicio' },
  { path: '/login', label: 'Iniciar sesión' },
  { path: '/register', label: 'Crear cuenta' },
  { path: '/profile', label: 'Mi perfil' },
  { path: '/pets', label: 'Mascotas' },
  { path: '/pets/new', parent: '/pets', label: 'Registrar mascota' },
  { path: '/pets/inventory', parent: '/pets', label: 'Inventario' },
  {
    path: '/pets/:petId',
    parent: '/pets',
    label: ({ petId }) => `Mascota #${petId}`,
  },
  {
    path: '/pets/:petId/medical-events',
    parent: '/pets/:petId',
    label: 'Historial médico',
  },
  {
    path: '/pets/:petId/reviews',
    parent: '/pets/:petId',
    label: 'Reseñas',
  },
  {
    path: '/pets/:petId/reviews/new',
    parent: '/pets/:petId/reviews',
    label: 'Escribir reseña',
  },
  {
    path: '/pets/:petId/reviews/:reviewId/edit',
    parent: '/pets/:petId/reviews',
    label: 'Editar reseña',
  },
  {
    path: '/pets/:petId/vaccination-record',
    parent: '/pets/:petId',
    label: 'Carnet de vacunación',
  },
  {
    path: '/vaccination-records/new',
    parent: '/pets',
    label: 'Crear carnet de vacunación',
  },
  { path: '/shelters', label: 'Refugios' },
  { path: '/shelters/new', parent: '/shelters', label: 'Registrar refugio' },
  {
    path: '/shelters/:shelterId',
    parent: '/shelters',
    label: ({ shelterId }) => `Refugio #${shelterId}`,
  },
  {
    path: '/shelters/:shelterId/edit',
    parent: '/shelters/:shelterId',
    label: 'Editar refugio',
  },
  {
    path: '/shelters/:shelterId/events/new',
    parent: '/shelters/:shelterId',
    label: 'Crear evento',
  },
  {
    path: '/events/:eventId',
    parent: '/shelters',
    label: ({ eventId }) => `Evento #${eventId}`,
  },
  { path: '/medical-events', label: 'Eventos médicos' },
  { path: '/medical-events/new', parent: '/medical-events', label: 'Registrar evento médico' },
  {
    path: '/medical-events/:medicalEventId',
    parent: '/medical-events',
    label: ({ medicalEventId }) => `Evento médico #${medicalEventId}`,
  },
  {
    path: '/medical-events/:medicalEventId/edit',
    parent: '/medical-events/:medicalEventId',
    label: 'Editar evento médico',
  },
  { path: '/veterinarians', label: 'Veterinarios' },
  { path: '/veterinarians/new', parent: '/veterinarians', label: 'Registrar veterinario' },
  {
    path: '/veterinarians/:veterinarianId',
    parent: '/veterinarians',
    label: ({ veterinarianId }) => `Veterinario #${veterinarianId}`,
  },
  {
    path: '/veterinarians/:veterinarianId/edit',
    parent: '/veterinarians/:veterinarianId',
    label: 'Editar veterinario',
  },
  { path: '/adopters', label: 'Adoptantes' },
  { path: '/adopters/new', parent: '/adopters', label: 'Registrar adoptante' },
  {
    path: '/adopters/:adopterId',
    parent: '/adopters',
    label: ({ adopterId }) => `Adoptante #${adopterId}`,
  },
  {
    path: '/adopters/:adopterId/edit',
    parent: '/adopters/:adopterId',
    label: 'Editar adoptante',
  },
  { path: '/followUps', label: 'Seguimientos' },
  {
    path: '/adoptions/:adoptionId/followUps',
    parent: '/followUps',
    label: ({ adoptionId }) => `Seguimiento de adopción #${adoptionId}`,
  },
  {
    path: '/adoptions/:adoptionId/followUps/new',
    parent: '/adoptions/:adoptionId/followUps',
    label: 'Registrar seguimiento',
  },
  {
    path: '/adoptions/:adoptionId/followUps/:followUpId/edit',
    parent: '/adoptions/:adoptionId/followUps',
    label: 'Editar seguimiento',
  },
  { path: '/notifications', label: 'Notificaciones' },
]

export function getBreadcrumbItems(pathname) {
  const normalizedPath = trimTrailingSlashes(pathname) || '/'
  let match
  let route

  for (const candidate of ROUTES) {
    match = matchPath({ path: candidate.path, end: true }, normalizedPath)
    if (match) {
      route = candidate
      break
    }
  }

  if (!route) return [{ label: 'Inicio', to: '/' }, { label: 'Página actual' }]

  const items = []
  while (route) {
    const label = typeof route.label === 'function' ? route.label(match.params) : route.label
    items.push({ label, to: generatePath(route.path, match.params) })
    route = ROUTES.find((candidate) => candidate.path === route.parent)
  }
  items.reverse()
  items[items.length - 1].to = null
  if (normalizedPath !== '/') items.unshift({ label: 'Inicio', to: '/' })
  return items
}
