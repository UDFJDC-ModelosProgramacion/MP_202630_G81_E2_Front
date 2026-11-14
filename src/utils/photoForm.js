export const MAX_PHOTO_URL_LENGTH = 255

export const PHOTO_URL_MESSAGE = 'Ingrese un enlace válido que empiece por http:// o https://.'
export const PHOTO_URL_LENGTH_MESSAGE = `El enlace no puede superar los ${MAX_PHOTO_URL_LENGTH} caracteres.`
export const PHOTO_FORMAT_MESSAGE = 'Seleccione el formato de la imagen.'

const FORMAT_BY_EXTENSION = {
  jpg: 'JPG',
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WEBP',
  gif: 'GIF',
  bmp: 'BMP',
}

export function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export function detectPhotoFormat(url) {
  try {
    const extension = new URL(url).pathname.split('.').pop().toLowerCase()
    return FORMAT_BY_EXTENSION[extension] ?? null
  } catch {
    return null
  }
}

export const hasPhoto = ({ photoUrl }) => photoUrl.trim() !== ''

function validatePhotoUrl(url) {
  if (!isHttpUrl(url)) return PHOTO_URL_MESSAGE
  return url.length > MAX_PHOTO_URL_LENGTH ? PHOTO_URL_LENGTH_MESSAGE : null
}

export function validatePhoto(values) {
  if (!hasPhoto(values)) return {}
  const errors = {}
  const urlMessage = validatePhotoUrl(values.photoUrl.trim())
  if (urlMessage) errors.photoUrl = urlMessage
  if (values.photoType === '') errors.photoType = PHOTO_FORMAT_MESSAGE
  return errors
}

export function buildPhotoPayload(values, description) {
  if (!hasPhoto(values)) return null
  return { url: values.photoUrl.trim(), type: values.photoType, description }
}

export async function trySavePhoto(save, photo) {
  if (!photo) return null
  try {
    await save(photo)
    return null
  } catch (error) {
    return error.message
  }
}

// Text for the success dialog when the pet was registered but its photo could not be saved.
// Returns null when there is nothing to warn about.
export function photoWarning(photoError) {
  if (!photoError) return null
  return `La mascota se registró, pero la foto no se pudo guardar: ${photoError}. Podrá agregarla después.`
}