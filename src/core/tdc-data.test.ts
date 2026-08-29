import { describe, expect, it } from 'vitest'
import { locText, shipClassName, type ShipClass } from './tdc-data.js'

const base: ShipClass = {
  id: 'x',
  nameRu: '',
  nameEn: '',
  length: 0,
  mastHeight: 0,
  funnelHeight: 0,
  draft: 0,
  speed: 0,
  deckGun: false,
}

describe('shipClassName fallback', () => {
  it('returns Russian name on ru locale', () => {
    expect(shipClassName({ ...base, nameRu: 'Пики', nameEn: '' }, 'ru')).toBe('Пики')
  })

  it('falls back to Russian name on en locale when English is empty', () => {
    expect(shipClassName({ ...base, nameRu: 'Пики', nameEn: '' }, 'en')).toBe('Пики')
  })

  it('returns English name on en locale', () => {
    expect(shipClassName({ ...base, nameEn: 'Picket', nameRu: '' }, 'en')).toBe('Picket')
  })

  it('falls back to English name on ru locale when Russian is empty', () => {
    expect(shipClassName({ ...base, nameEn: 'Picket', nameRu: '' }, 'ru')).toBe('Picket')
  })

  it('prefers own locale over the fallback', () => {
    const ship = { ...base, nameRu: 'Пики', nameEn: 'Picket' }
    expect(shipClassName(ship, 'ru')).toBe('Пики')
    expect(shipClassName(ship, 'en')).toBe('Picket')
  })

  it('returns empty string when both names are empty', () => {
    expect(shipClassName(base, 'en')).toBe('')
  })
})

describe('locText fallback', () => {
  it('uses the record value for the locale', () => {
    expect(locText({ ru: 'А', en: 'B' }, 'ru')).toBe('А')
    expect(locText({ ru: 'А', en: 'B' }, 'en')).toBe('B')
  })

  it('falls back to the other language when empty', () => {
    expect(locText({ ru: 'А', en: '' }, 'en')).toBe('А')
    expect(locText({ ru: '', en: 'B' }, 'ru')).toBe('B')
  })

  it('respects the original empty vs missing', () => {
    expect(locText({ ru: 'А' }, 'en')).toBe('А')
    expect(locText({ en: 'B' }, 'ru')).toBe('B')
  })

  it('returns empty string when nothing is filled', () => {
    expect(locText({ ru: '', en: '' }, 'en')).toBe('')
    expect(locText({}, 'en')).toBe('')
  })
})