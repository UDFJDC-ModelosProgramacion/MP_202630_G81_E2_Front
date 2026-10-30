// Pure logic of the optional profile photo of the "register a pet" form (HU06).
// The backend stores a photo as { url, type, description } (POST /pets/{id}/photos),
// so the form asks for the image link and its format, and mirrors the backend rules.

export const PROFILE_PHOTO_DESCRIPTION = 'Foto de perfil'
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

// 'https://x.com/luna.PNG?w=800' -> 'PNG'. Returns null when the link has no known extension.
export function detectPhotoFormat(url) {
  try {
    const extension = new URL(url).pathname.split('.').pop().toLowerCase()
    return FORMAT_BY_EXTENSION[extension] ?? null
  } catch {
    return null
  }
}

// The photo is optional: it only exists when a link was written.
export const hasPhoto = ({ photoUrl }) => photoUrl.trim() !== ''

function validatePhotoUrl(url) {
  if (!isHttpUrl(url)) return PHOTO_URL_MESSAGE
  return url.length > MAX_PHOTO_URL_LENGTH ? PHOTO_URL_LENGTH_MESSAGE : null
}

// Returns { fieldName: message } for the photo fields. It is empty when there is no photo.
export function validatePhoto(values) {
  if (!hasPhoto(values)) return {}
  const errors = {}
  const urlMessage = validatePhotoUrl(values.photoUrl.trim())
  if (urlMessage) errors.photoUrl = urlMessage
  if (values.photoType === '') errors.photoType = PHOTO_FORMAT_MESSAGE
  return errors
}

// Body of POST /pets/{id}/photos, or null when the pet is registered without a photo.
export function buildPhotoPayload(values) {
  if (!hasPhoto(values)) return null
  return {
    url: values.photoUrl.trim(),
    type: values.photoType,
    description: PROFILE_PHOTO_DESCRIPTION,
  }
}
