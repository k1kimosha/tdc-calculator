/**
 * Интернационализация: текущая локаль, подписка на смену языка,
 * перевод по плоским ключам с подстановкой параметров,
 * базовый Web-компонент I18nElement (Lit) с локализованным состоянием.
 */
import { LitElement } from 'lit'
import { state } from 'lit/decorators.js'
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  messages,
} from '../locales/index.js'

export { DEFAULT_LOCALE, LOCALE_OPTIONS } from '../locales/index.js'

export type Locale = string

export type MessageParams = Record<string, string | number>

export const STORAGE_KEY = 'tdc-locale'

export function langFromNavigator(navLang: string | undefined): string {
  if (!navLang) return DEFAULT_LOCALE
  const base = navLang.split('-')[0].toLowerCase()
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE
}

export function resolveInitialLocale(
  stored: string | null,
  navLang: string | undefined,
): string {
  if (stored && isSupportedLocale(stored)) return stored
  return langFromNavigator(navLang)
}

function readStoredLocale(): string | null {
  try {
    return typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let currentLocale: Locale = resolveInitialLocale(
  readStoredLocale(),
  typeof navigator === 'undefined'
    ? undefined
    : navigator.language,
)

document.documentElement.lang = currentLocale

const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  if (!isSupportedLocale(locale)) locale = DEFAULT_LOCALE
  if (locale === currentLocale) return
  currentLocale = locale
  document.documentElement.lang = locale
  document.title = translate(locale, 'app.title')
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  listeners.forEach(fn => fn())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function flatten(
  obj: Record<string, unknown>,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      out[prefix + key] = value
    } else {
      flatten(value as Record<string, unknown>, prefix + key + '.', out)
    }
  }
  return out
}

const flatCache = new Map<string, Record<string, string>>()

function flatMessages(locale: string): Record<string, string> {
  const cached = flatCache.get(locale)
  if (cached) return cached
  const table = flatten((messages[locale] ?? {}) as Record<string, unknown>)
  flatCache.set(locale, table)
  return table
}

export function translate(locale: Locale, key: string, params?: MessageParams): string {
  let value = flatMessages(locale)[key]
  if (value === undefined) value = flatMessages(DEFAULT_LOCALE)[key]
  if (value === undefined) return key
  if (params) {
    for (const [name, paramValue] of Object.entries(params)) {
      value = value.replaceAll(`{${name}}`, String(paramValue))
    }
  }
  return value
}

export class I18nElement extends LitElement {
  @state() protected locale: Locale = getLocale()

  private _unsubscribe?: () => void

  connectedCallback() {
    super.connectedCallback()
    this._unsubscribe = subscribe(() => {
      this.locale = getLocale()
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubscribe?.()
    this._unsubscribe = undefined
  }

  protected t(key: string, params?: MessageParams): string {
    return translate(this.locale, key, params)
  }
}

document.title = translate(currentLocale, 'app.title')