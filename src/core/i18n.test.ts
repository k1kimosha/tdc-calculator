import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as i18n from './i18n.js'

async function importWithBrowserLang(navLang: string) {
  vi.stubGlobal('navigator', { language: navLang })
  vi.resetModules()
  return await import('./i18n.js')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Авто-переключение локали при открытии страницы', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('ru-RU → ру (html lang=ru)', async () => {
    const m = await importWithBrowserLang('ru-RU')
    expect(m.getLocale()).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    expect(document.title).toBe('TDC калькулятор')
  })

  it('en-US → English (html lang=en)', async () => {
    const m = await importWithBrowserLang('en-US')
    expect(m.getLocale()).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('TDC Calculator')
  })
})

describe('Фолбэк на английский при отсутствии перевода', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('любой неподдерживаемый язык браузера → en', async () => {
    for (const navLang of ['de-DE', 'fr-CH', 'pt-BR', 'es-MX', 'ja-JP', 'zh-Hans-CN']) {
      const m = await importWithBrowserLang(navLang)
      expect(m.getLocale()).toBe('en')
    }
  })
})

describe('Сохранённый выбор пользователя', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('сохранённая локаль перекрывает язык браузера', async () => {
    localStorage.setItem(i18n.STORAGE_KEY, 'ru')
    const m = await importWithBrowserLang('de-DE')
    expect(m.getLocale()).toBe('ru')
  })

  it('битая сохранённая локаль не ломает определение', async () => {
    localStorage.setItem(i18n.STORAGE_KEY, 'xx')
    const m = await importWithBrowserLang('de-DE')
    expect(m.getLocale()).toBe('en')
  })
})

describe('setLocale', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('обновляет локализованный html lang и document.title', async () => {
    const m = await importWithBrowserLang('de-DE')
    expect(m.getLocale()).toBe('en')
    m.setLocale('ru')
    expect(document.documentElement.lang).toBe('ru')
    expect(document.title).toBe('TDC калькулятор')
    m.setLocale('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('TDC Calculator')
  })
})

describe('Чистые функции определения локали', () => {
  it('langFromNavigator: undefined → en', () => {
    expect(i18n.langFromNavigator(undefined)).toBe('en')
  })

  it('langFromNavigator: код без регистра → нижний регистр', () => {
    expect(i18n.langFromNavigator('RU')).toBe('ru')
    expect(i18n.langFromNavigator('en')).toBe('en')
  })

  it('langFromNavigator: неподдерживаемый язык → en', () => {
    expect(i18n.langFromNavigator('uk-UA')).toBe('en')
  })

  it('resolveInitialLocale: приоритет сохранённого значения', () => {
    expect(i18n.resolveInitialLocale('ru', 'de-DE')).toBe('ru')
  })

  it('resolveInitialLocale: валидная локаль из хранилища не требует браузера', () => {
    expect(i18n.resolveInitialLocale('ru', undefined)).toBe('ru')
  })

  it('resolveInitialLocale: пустое хранилище → язык браузера', () => {
    expect(i18n.resolveInitialLocale(null, 'ru-RU')).toBe('ru')
  })
})

describe('translate', () => {
  it('неизвестная локаль → фолбэк на английский', () => {
    expect(i18n.translate('xx', 'app.title')).toBe(i18n.translate('en', 'app.title'))
  })

  it('неизвестный ключ → возвращает сам ключ', () => {
    expect(i18n.translate('ru', 'absent.key')).toBe('absent.key')
  })
})