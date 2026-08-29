import {
  DEFAULT_SCENARIOS,
  DEFAULT_SHIPS,
  type Scenario,
  type ScenarioMode,
  type ShipClass,
} from './tdc-data.js'

export const STORAGE_KEY = 'tdc-catalog'
export const CATALOG_VERSION = 1

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

function normalizeCatalogShape(value: unknown): TdcCatalog | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
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
    notes,
  }
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
  const { version, ships, scenarios, notes } = readCatalog()
  return JSON.stringify({ version, ships, scenarios, notes }, null, 2)
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