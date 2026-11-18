export const NO_FILTERS = { startDate: '', endDate: '' }

export const RANGE_ERROR = 'La fecha inicial no puede ser posterior a la fecha final.'


export function validateRange({ startDate, endDate }) {
    if (startDate && endDate && startDate > endDate) return RANGE_ERROR
    return ''
}

export const hasFilters = ({ startDate, endDate }) => Boolean(startDate || endDate)