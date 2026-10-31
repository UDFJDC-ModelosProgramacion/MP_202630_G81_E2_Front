import { describe, expect, it } from 'vitest'
import {
  buildPhotoPayload,
  detectPhotoFormat,
  hasPhoto,
  isHttpUrl,
  PHOTO_FORMAT_MESSAGE,
  PHOTO_URL_LENGTH_MESSAGE,
  PHOTO_URL_MESSAGE,
  PROFILE_PHOTO_DESCRIPTION,
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
    expect(buildPhotoPayload({ photoUrl: ' ', photoType: 'JPG' })).toBeNull()
  })

  it('builds the body of POST /pets/{id}/photos', () => {
    expect(buildPhotoPayload({ photoUrl: ` ${URL_JPG} `, photoType: 'JPG' })).toEqual({
      url: URL_JPG,
      type: 'JPG',
      description: PROFILE_PHOTO_DESCRIPTION,
    })
  })
})
