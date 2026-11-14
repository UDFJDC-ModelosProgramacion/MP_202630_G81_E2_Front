import { dayOf, isPastDay, toEndOfDay } from '../../utils/followUpDates'

export const EMPTY_FOLLOW_UP = { date: '', observation: '' }

export const REQUIRED_MESSAGE = 'Este campo es obligatorio.'
export const PAST_DATE_MESSAGE = 'La fecha no puede ser anterior a hoy.'

const isBlank = (value) => String(value ?? '').trim() === ''

export function validateFollowUp(values, today = undefined) {
  const errors = {}
  if (!dayOf(values.date)) {
    errors.date = REQUIRED_MESSAGE
  } else if (isPastDay(values.date, today)) {
    errors.date = PAST_DATE_MESSAGE
  }
  if (isBlank(values.observation)) errors.observation = REQUIRED_MESSAGE
  return errors
}

// On edit only the observation can change: the date is disabled and the stored
// date may already be in the past, so it must not be revalidated.
export function validateObservation(values) {
  return isBlank(values.observation) ? { observation: REQUIRED_MESSAGE } : {}
}

export function buildCreatePayload(values, { adoptionId, veterinarianId }) {
  return {
    date: toEndOfDay(values.date),
    observation: values.observation.trim(),
    veterinarian: { id: veterinarianId },
    adoption: { id: Number(adoptionId) },
  }
}

export function buildUpdatePayload(values) {
  return {
    date: toEndOfDay(values.date),
    observation: values.observation.trim(),
  }
}

const FIELD_BY_BACKEND_MESSAGE = {
  'Follow-up date cannot be null': 'date',
  'The scheduled follow-up date cannot be before the current date': 'date',
  'Observation cannot be null or empty': 'observation',
}

export function fieldOfFollowUpMessage(message) {
  return FIELD_BY_BACKEND_MESSAGE[message] ?? null
}
