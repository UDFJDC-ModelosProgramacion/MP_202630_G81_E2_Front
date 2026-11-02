import { describe, expect, it, vi } from 'vitest'
import {
  buildPhotoPayload,
  detectPhotoFormat,
  hasPhoto,
  isHttpUrl,
  PHOTO_FORMAT_MESSAGE,
  PHOTO_URL_LENGTH_MESSAGE,
  PHOTO_URL_MESSAGE,
  photoWarning,
  trySavePhoto,
  validatePhoto,
} from './photoForm'

const URL_JPG = 'https://fotos.example.com/luna.jpg'

describe('isHttpUrl', () => {
  it.each([URL_JPG, 'http://fotos.example.com/luna.png'])('accepts %s', (url) => {
    expect(isHttpUrl(url)).toBe(true)
  })

  it.each(['luna.jpg', 'ftp://fotos.example.com/luna.jpg', 'javascript:alert(1)', ''])(
    'rejects "%s"',
    (url) => {
      expect(isHttpUrl(url)).toBe(false)
    },
  )
})

describe('detectPhotoFormat', () => {
  it.each([
    [URL_JPG, 'JPG'],
    ['https://x.com/luna.JPEG', 'JPG'],
    ['https://x.com/luna.png?w=800', 'PNG'],
    ['https://x.com/luna.webp', 'WEBP'],
    ['https://x.com/luna.gif', 'GIF'],
    ['https://x.com/luna.bmp', 'BMP'],
  ])('reads the format of %s', (url, format) => {
    expect(detectPhotoFormat(url)).toBe(format)
  })

  it.each(['https://x.com/photo', 'https://x.com/doc.pdf', 'not a url', ''])(
    'returns null for "%s"',
    (url) => {
      expect(detectPhotoFormat(url)).toBeNull()
    },
  )
})

describe('validatePhoto', () => {
  it('accepts a form without photo, whatever the format says', () => {
    expect(validatePhoto({ photoUrl: '  ', photoType: '' })).toEqual({})
    expect(validatePhoto({ photoUrl: '', photoType: 'PNG' })).toEqual({})
  })

  it('accepts a link with its format', () => {
    expect(validatePhoto({ photoUrl: URL_JPG, photoType: 'JPG' })).toEqual({})
  })

  it('rejects a link that is not http(s)', () => {
    expect(validatePhoto({ photoUrl: 'luna.jpg', photoType: 'JPG' })).toEqual({
      photoUrl: PHOTO_URL_MESSAGE,
    })
  })

  it('rejects a link longer than the backend column', () => {
    const longUrl = `https://x.com/${'a'.repeat(250)}.jpg`

    expect(validatePhoto({ photoUrl: longUrl, photoType: 'JPG' })).toEqual({
      photoUrl: PHOTO_URL_LENGTH_MESSAGE,
    })
  })

  it('requires the format when there is a link', () => {
    expect(validatePhoto({ photoUrl: 'https://x.com/photo', photoType: '' })).toEqual({
      photoType: PHOTO_FORMAT_MESSAGE,
    })
  })
})

describe('buildPhotoPayload', () => {
  it('has no photo when the link is blank', () => {
    expect(hasPhoto({ photoUrl: ' ' })).toBe(false)
    expect(buildPhotoPayload({ photoUrl: ' ', photoType: 'JPG' }, 'Foto')).toBeNull()
  })

  it('builds the body of the photo request with the description of the caller', () => {
    expect(
      buildPhotoPayload({ photoUrl: ` ${URL_JPG} `, photoType: 'JPG' }, 'Foto de perfil'),
    ).toEqual({ url: URL_JPG, type: 'JPG', description: 'Foto de perfil' })
  })
})

describe('trySavePhoto', () => {
  const photo = { url: URL_JPG, type: 'JPG', description: 'Foto' }

  it('does nothing when there is no photo', async () => {
    const save = vi.fn()

    expect(await trySavePhoto(save, null)).toBeNull()
    expect(save).not.toHaveBeenCalled()
  })

  it('saves the photo and returns no error', async () => {
    const save = vi.fn().mockResolvedValue({ id: 1 })

    expect(await trySavePhoto(save, photo)).toBeNull()
    expect(save).toHaveBeenCalledWith(photo)
  })

  it('returns the message instead of throwing when the photo fails', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Photo format is not valid'))

    expect(await trySavePhoto(save, photo)).toBe('Photo format is not valid')
  })
})

describe('photoWarning', () => {
  it('has nothing to warn about when the photo was saved or there was none', () => {
    expect(photoWarning(null)).toBeNull()
  })

  it('explains that the pet exists but the photo failed', () => {
    expect(photoWarning('Foto no encontrada')).toBe(
      'La mascota se registró, pero la foto no se pudo guardar: Foto no encontrada. Podrá agregarla después.',
    )
  })
})