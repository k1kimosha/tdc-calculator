import { ru, type Messages } from './ru.js'
import { en } from './en.js'

export type { Messages } from './ru.js'

export const DEFAULT_LOCALE = 'en'

export interface LocaleOption {
  code: string
  label: string
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
]

export const messages: Record<string, Messages> = { ru, en }

export function isSupportedLocale(code: string): boolean {
  return code in messages
}