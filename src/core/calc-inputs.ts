/**
 * Временное хранилище введённых значений калькуляторов.
 * Значения живут ТОЛЬКО в памяти сессии: журнал похода копирует их в снимок
 * при фиксации выстрела (см. snapshot-utils), а здесь они нужны, чтобы при
 * переключении вкладок калькуляторы не теряли текущий ввод.
 */
import type { ShotMethod } from './tdc-log.js'

const registry: Record<string, Record<string, string>> = {}

/** Способ стрельбы, выбранный перед записью выстрела (см. журнал похода). */
let shotMethod: ShotMethod = 'calculated'

/** Сохранить значение поля `name` калькулятора `calcId`. */
export function setCalcInput(calcId: string, name: string, value: string) {
  const entry = (registry[calcId] ??= {})
  entry[name] = value
}

/** Все сохранённые значения калькулятора `calcId` (без изменений записей нет). */
export function getCalcInputs(calcId: string): Record<string, string> {
  return registry[calcId] ?? {}
}

/** Очистить ввод всех калькуляторов (в начале новой сессии). */
export function clearCalcInputs() {
  for (const key of Object.keys(registry)) delete registry[key]
}

/** Текущий способ стрельбы (по расчётам / на упреждение). */
export function getShotMethod(): ShotMethod {
  return shotMethod
}

/** Запомнить способ стрельбы для следующих записей выстрелов. */
export function setShotMethod(method: ShotMethod) {
  shotMethod = method
}