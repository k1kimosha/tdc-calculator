/**
 * Каталог калькуляторов (localStorage).
 * Хранит корабли, сценарии, калькуляторы и заметки; при чтении валидирует
 * и нормализует структуру (подстраивается под старые версии данных),
 * рассылает подписчикам уведомления об изменениях.
 */
import {
  DEFAULT_CALC_CONFIGS,
  DEFAULT_SCENARIOS,
  DEFAULT_SHIPS,
  defaultCalcConfig,
  defaultFormulasFor,
  type CalcControl,
  type CalcFormula,
  type CalculatorConfig,
  type CalcSelectOption,
  type Scenario,
  type ScenarioMode,
  type ShipClass,
} from './tdc-data.js'

export const STORAGE_KEY = 'tdc-catalog'
export const CATALOG_VERSION = 4

export const NOTE_CATEGORIES = ['tdc', 'identification', 'general'] as const
export type NoteCategory = (typeof NOTE_CATEGORIES)[number]

export interface Note {
  id: string
  category: string
  title: string
  body: string
}

export interface TdcCatalog {
  version: number
  ships: ShipClass[]
  scenarios: Scenario[]
  calcs: CalculatorConfig[]
  notes: Note[]
}

type LocaleText = Record<string, string>

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function defaultCatalog(): TdcCatalog {
  return {
    version: CATALOG_VERSION,
    ships: clone(DEFAULT_SHIPS),
    scenarios: clone(DEFAULT_SCENARIOS),
    calcs: clone(DEFAULT_CALC_CONFIGS),
    notes: [],
  }
}

function persist(catalog: TdcCatalog) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    /* ignore */
  }
}

export function readCatalog(): TdcCatalog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      const catalog = normalizeCatalogShape(parsed)
      if (catalog) return catalog
    }
  } catch {
    /* ignore */
  }
  const catalog = defaultCatalog()
  persist(catalog)
  return catalog
}

function migrateCalcFormulas(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    if (rec.id !== 'aob' || !Array.isArray(rec.formulas)) continue
    const list = rec.formulas as Array<Record<string, unknown> | null | undefined>
    const ids = new Set<string>()
    for (const f of list) {
      const fr = f as Record<string, unknown> | null | undefined
      if (fr && typeof fr.id === 'string') ids.add(fr.id)
    }
    const seen = new Set<string>()
    let broken = false
    for (const f of list) {
      const fr = f as Record<string, unknown> | null | undefined
      if (!fr || typeof fr.id !== 'string' || typeof fr.expr !== 'string') continue
      if (/(^|[^A-Za-z0-9_])v([^A-Za-z0-9_]|$)/.test(fr.expr)) {
        broken = true
        break
      }
      const re = /[A-Za-z_][A-Za-z0-9_]*/g
      let m: RegExpExecArray | null
      while ((m = re.exec(fr.expr)) !== null) {
        const dep = m[0]
        if (dep !== fr.id && ids.has(dep) && !seen.has(dep)) {
          broken = true
          break
        }
      }
      if (broken) break
      seen.add(fr.id)
    }
    if (broken) rec.formulas = clone(defaultFormulasFor('aob'))
  }
  return value
}

function normalizeCatalogShape(value: unknown): TdcCatalog | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  record.calcs = migrateCalcFormulas(record.calcs)
  const ships = Array.isArray(record.ships)
    ? record.ships.map(normalizeShip).filter((s): s is ShipClass => s !== null)
    : null
  const scenarios = Array.isArray(record.scenarios)
    ? record.scenarios.map(normalizeScenario).filter((s): s is Scenario => s !== null)
    : null
  const notes = Array.isArray(record.notes)
    ? record.notes.map(normalizeNote).filter((n): n is Note => n !== null)
    : null
  if (!ships || !scenarios || !notes) return null
  return {
    version: CATALOG_VERSION,
    ships,
    scenarios,
    calcs: normalizeCalcs(record.calcs),
    notes,
  }
}

function asLocaleTextOpt(value: unknown, fallback: string): LocaleText | undefined {
  if (value === undefined || value === null) return undefined
  return asLocaleText(value, fallback)
}

function normalizeSelectOption(value: unknown): CalcSelectOption | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asStr(raw.id, '')
  if (!id) return null
  return {
    id,
    label: asLocaleText(raw.label, ''),
    value: typeof raw.value === 'number' ? asNum(raw.value) : asStr(raw.value, ''),
  }
}

function normalizeLiveRow(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  return {
    label: asLocaleText(raw.label, ''),
    expr: asStr(raw.expr, ''),
  }
}

function normalizeCalcControl(value: unknown): CalcControl | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asStr(raw.id, '')
  if (!id) return null
  const label = asLocaleText(raw.label, '')
  const optVar = (v: unknown): string | undefined => {
    const s = asStr(v, '')
    return s === '' ? undefined : s
  }
  switch (raw.kind) {
    case 'number':
      return {
        kind: 'number',
        id,
        label,
        name: asStr(raw.name, id),
        default: asNum(raw.default, 0),
        ...(asLocaleTextOpt(raw.unit, '') ? { unit: asLocaleText(raw.unit, '') } : {}),
      }
    case 'select': {
      const options = Array.isArray(raw.options)
        ? raw.options
            .map(normalizeSelectOption)
            .filter((o): o is CalcSelectOption => o !== null)
        : []
      return {
        kind: 'select',
        id,
        label,
        name: asStr(raw.name, id),
        options,
        defaultId: asStr(raw.defaultId, options[0]?.id ?? ''),
      }
    }
    case 'ships':
      return {
        kind: 'ships',
        id,
        label,
        bindLength: optVar(raw.bindLength),
        bindMast: optVar(raw.bindMast),
        bindFunnel: optVar(raw.bindFunnel),
        landmarkVar: optVar(raw.landmarkVar),
      }
    case 'liveTable': {
      const rows = Array.isArray(raw.rows)
        ? raw.rows
            .map(normalizeLiveRow)
            .filter((r): r is NonNullable<ReturnType<typeof normalizeLiveRow>> => r !== null)
        : []
      return {
        kind: 'liveTable',
        id,
        label,
        ...(asLocaleTextOpt(raw.rowLabel, '') ? { rowLabel: asLocaleText(raw.rowLabel, '') } : {}),
        valueLabel: asLocaleText(raw.valueLabel, ''),
        rows,
      }
    }
    default:
      return null
  }
}

function normalizeFormulas(value: unknown, base: CalcFormula[]): CalcFormula[] {
  const raw = Array.isArray(value) ? value : []
  const out: CalcFormula[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const id = asStr(rec.id, '')
    if (!id || seen.has(id)) continue
    const def = base.find(b => b.id === id)
    out.push({
      id,
      expr: asStr(rec.expr, def?.expr ?? ''),
      ...(asLocaleTextOpt(rec.label, '') ? { label: asLocaleText(rec.label, '') } : def?.label ? { label: clone(def.label) } : {}),
      ...(asLocaleTextOpt(rec.unit, '') ? { unit: asLocaleText(rec.unit, '') } : def?.unit ? { unit: clone(def.unit) } : {}),
    })
    seen.add(id)
  }
  return out.length ? out : clone(base)
}

function normalizeCalculatorConfig(value: unknown): CalculatorConfig | null {
  if (!value || typeof value !== 'object') return null
  const rec = value as Record<string, unknown>
  const id = asStr(rec.id, '')
  if (!id) return null
  const base = defaultCalcConfig(id)
  const controls = Array.isArray(rec.controls)
    ? rec.controls
        .map(normalizeCalcControl)
        .filter((c): c is CalcControl => c !== null)
    : base
      ? clone(base.controls)
      : []
  const formulas = normalizeFormulas(rec.formulas, base?.formulas ?? [])
  const title =
    rec.title !== undefined && rec.title !== null
      ? asLocaleText(rec.title, '')
      : base?.title
        ? clone(base.title)
        : { ru: '', en: '' }
  const hint = asLocaleTextOpt(rec.hint, '') ?? (base?.hint ? clone(base.hint) : undefined)
  return {
    id,
    title,
    ...(hint ? { hint } : {}),
    controls,
    formulas,
  }
}

function normalizeCalcs(value: unknown): CalculatorConfig[] {
  if (!Array.isArray(value)) return clone(DEFAULT_CALC_CONFIGS)
  const result: CalculatorConfig[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const config = normalizeCalculatorConfig(item)
    if (config && !seen.has(config.id)) {
      result.push(config)
      seen.add(config.id)
    }
  }
  return result
}

export function newId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID()}`
  } catch {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }
}

function asStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNum(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asBool(value: unknown): boolean {
  return value === true
}

function asLocaleText(value: unknown, fallback: string): LocaleText {
  const record = value && typeof value === 'object' ? (value as LocaleText) : {}
  return {
    ru: asStr(record.ru, fallback),
    en: asStr(record.en, fallback),
  }
}

function normalizeShip(value: unknown): ShipClass | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  return {
    id: asStr(raw.id, newId('ship')),
    nameRu: asStr(raw.nameRu, ''),
    nameEn: asStr(raw.nameEn, ''),
    length: asNum(raw.length),
    mastHeight: asNum(raw.mastHeight),
    funnelHeight: asNum(raw.funnelHeight),
    draft: asNum(raw.draft),
    speed: asNum(raw.speed),
    deckGun: asBool(raw.deckGun),
  }
}

function normalizeRow(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  return {
    label: asLocaleText(raw.label, ''),
    value: asStr(raw.value),
  }
}

function normalizeMode(value: unknown): ScenarioMode | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const rows = Array.isArray(raw.rows)
    ? raw.rows.map(normalizeRow).filter((r): r is NonNullable<ReturnType<typeof normalizeRow>> => r !== null)
    : []
  return {
    recommendation: asLocaleText(raw.recommendation, ''),
    detection: asLocaleText(raw.detection, ''),
    leftCaption: asLocaleText(raw.leftCaption, ''),
    rightCaption: asLocaleText(raw.rightCaption, ''),
    rows,
  }
}

function normalizeScenario(value: unknown): Scenario | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const surface = normalizeMode(raw.surface)
  if (!surface) return null
  const submerged = normalizeMode(raw.submerged) ?? surface
  return {
    id: asStr(raw.id, newId('scenario')),
    title: asLocaleText(raw.title, ''),
    surface,
    submerged,
  }
}

function normalizeNote(value: unknown): Note | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  return {
    id: asStr(raw.id, newId('note')),
    category: asStr(raw.category, 'general'),
    title: asStr(raw.title, ''),
    body: asStr(raw.body, ''),
  }
}

const listeners = new Set<() => void>()

export function subscribeCatalog(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function notify() {
  listeners.forEach(fn => fn())
}

export function getShips(): ShipClass[] {
  return readCatalog().ships
}

export function getScenarios(): Scenario[] {
  return readCatalog().scenarios
}

export function getNotes(): Note[] {
  return readCatalog().notes
}

export function getCalcs(): CalculatorConfig[] {
  return readCatalog().calcs
}

export function getFormulas(id: string): Record<string, string> {
  const config = readCatalog().calcs.find(c => c.id === id)
  const list = config?.formulas.length ? config.formulas : defaultFormulasFor(id)
  const out: Record<string, string> = {}
  for (const f of list) out[f.id] = f.expr
  return out
}

export function upsertCalculator(config: Partial<CalculatorConfig> & { id: string }) {
  const normalized = normalizeCalculatorConfig(config)
  if (!normalized) return
  updateCatalog(catalog => {
    const index = catalog.calcs.findIndex(c => c.id === normalized.id)
    if (index >= 0) catalog.calcs[index] = normalized
    else catalog.calcs.push(normalized)
  })
}

export function removeCalculator(id: string) {
  updateCatalog(catalog => {
    catalog.calcs = catalog.calcs.filter(c => c.id !== id)
  })
}

function updateCatalog(mutate: (catalog: TdcCatalog) => void) {
  const catalog = readCatalog()
  mutate(catalog)
  persist(catalog)
  notify()
}

export function upsertShip(ship: ShipClass) {
  updateCatalog(catalog => {
    const index = catalog.ships.findIndex(s => s.id === ship.id)
    if (index >= 0) catalog.ships[index] = clone(ship)
    else catalog.ships.push(clone(ship))
  })
}

export function removeShip(id: string) {
  updateCatalog(catalog => {
    catalog.ships = catalog.ships.filter(s => s.id !== id)
  })
}

export function upsertScenario(scenario: Scenario) {
  updateCatalog(catalog => {
    const index = catalog.scenarios.findIndex(s => s.id === scenario.id)
    if (index >= 0) catalog.scenarios[index] = clone(scenario)
    else catalog.scenarios.push(clone(scenario))
  })
}

export function removeScenario(id: string) {
  updateCatalog(catalog => {
    catalog.scenarios = catalog.scenarios.filter(s => s.id !== id)
  })
}

export function upsertNote(note: Note) {
  updateCatalog(catalog => {
    const index = catalog.notes.findIndex(n => n.id === note.id)
    if (index >= 0) catalog.notes[index] = clone(note)
    else catalog.notes.push(clone(note))
  })
}

export function removeNote(id: string) {
  updateCatalog(catalog => {
    catalog.notes = catalog.notes.filter(n => n.id !== id)
  })
}

export function resetCatalog() {
  persist(defaultCatalog())
  notify()
}

export function exportCatalogJson(): string {
  const { version, ships, scenarios, calcs, notes } = readCatalog()
  return JSON.stringify({ version, ships, scenarios, calcs, notes }, null, 2)
}

export function catalogFileName(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `tdc-catalog-${y}-${m}-${d}.json`
}

export type ImportResult = { ok: true } | { ok: false; error: 'json' | 'shape' }

export function importCatalogJson(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'json' }
  }
  const catalog = normalizeCatalogShape(parsed)
  if (!catalog) return { ok: false, error: 'shape' }
  persist(catalog)
  notify()
  return { ok: true }
}