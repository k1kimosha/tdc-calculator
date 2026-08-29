/**
 * Журнал боевых походов (localStorage).
 * Хранит патрули со снимками выстрелов; поддерживает миграцию версий
 * (LOG_VERSION), экспорт/импорт JSON и уведомление подписчиков.
 */
import { newId } from './tdc-store.js'

export const LOG_STORAGE_KEY = 'tdc-log'
export const LOG_VERSION = 2

export const SHOT_OUTCOMES = [
  'none',
  'hit_1',
  'hit_n',
  'miss_front',
  'miss_behind',
  'hit_other',
] as const
export type ShotOutcome = (typeof SHOT_OUTCOMES)[number]

export interface ShotSnapshotInput {
  name: string
  label: string
  value: string
}

export interface ShotSnapshotResult {
  id: string
  label: string
  value: string
  unit?: string
}

export interface ShotFormula {
  id: string
  label: { ru: string; en: string }
  expr: string
  unit?: { ru: string; en: string }
}

export interface ShotSnapshotCalc {
  calcId: string
  calcTitle: { ru: string; en: string }
  formulas: ShotFormula[]
  inputs: ShotSnapshotInput[]
  results: ShotSnapshotResult[]
}

export type ShotSnapshot = ShotSnapshotCalc[]

export interface Shot {
  id: string
  elapsedMs: number
  at: number
  snapshot: ShotSnapshot
  outcome: ShotOutcome
  note: string
}

export interface Patrol {
  id: string
  startedAt: number
  endedAt: number | null
  label: string
  uboatId: string
  shots: Shot[]
}

export interface TdcLog {
  version: number
  authorNick: string
  activePatrolId: string | null
  patrols: Patrol[]
}

export type ImportResult = { ok: true } | { ok: false; error: 'json' | 'shape' }

function defaultLog(): TdcLog {
  return {
    version: LOG_VERSION,
    authorNick: '',
    activePatrolId: null,
    patrols: [],
  }
}

function persist(log: TdcLog) {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(log))
  } catch {
    /* ignore */
  }
}

function asStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNum(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asLocaleTitle(value: unknown): { ru: string; en: string } {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    ru: asStr(record.ru, ''),
    en: asStr(record.en, ''),
  }
}

function isOutcome(value: unknown): value is ShotOutcome {
  return (SHOT_OUTCOMES as readonly string[]).includes(asStr(value))
}

function normalizeSnapshotCalc(value: unknown): ShotSnapshotCalc | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const calcId = asStr(raw.calcId, '')
  if (!calcId) return null
  const formulas = Array.isArray(raw.formulas)
    ? (raw.formulas as unknown[]).map(item => {
        const rec = item as Record<string, unknown>
        const formula: ShotFormula = {
          id: asStr(rec.id, ''),
          label: asLocaleTitle(rec.label),
          expr: asStr(rec.expr, ''),
        }
        const unit = asLocaleTitle(rec.unit)
        if (unit.ru || unit.en) formula.unit = unit
        return formula
      })
    : []
  const inputs = Array.isArray(raw.inputs)
    ? (raw.inputs as unknown[]).map(item => {
        const rec = item as Record<string, unknown>
        return {
          name: asStr(rec.name, ''),
          label: asStr(rec.label, ''),
          value: asStr(rec.value, ''),
        }
      })
    : []
  const results = Array.isArray(raw.results)
    ? (raw.results as unknown[]).map(item => {
        const rec = item as Record<string, unknown>
        const result: ShotSnapshotResult = {
          id: asStr(rec.id, ''),
          label: asStr(rec.label, ''),
          value: asStr(rec.value, ''),
        }
        const unit = asStr(rec.unit, '')
        if (unit) result.unit = unit
        return result
      })
    : []
  return {
    calcId,
    calcTitle: asLocaleTitle(raw.calcTitle),
    formulas,
    inputs,
    results,
  }
}

function normalizeSnapshot(value: unknown): ShotSnapshot | null {
  if (Array.isArray(value)) {
    const calcs = value.map(normalizeSnapshotCalc).filter((c): c is ShotSnapshotCalc => c !== null)
    return calcs.length > 0 ? calcs : null
  }
  const legacy = normalizeSnapshotCalc(value)
  return legacy ? [legacy] : null
}

function normalizeShot(value: unknown): Shot | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const snapshot = normalizeSnapshot(raw.snapshot)
  if (!snapshot) return null
  return {
    id: asStr(raw.id, newId('shot')),
    elapsedMs: asNum(raw.elapsedMs),
    at: asNum(raw.at, Date.now()),
    snapshot,
    outcome: isOutcome(raw.outcome) ? raw.outcome : 'none',
    note: asStr(raw.note, ''),
  }
}

function normalizePatrol(value: unknown): Patrol | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const id = asStr(raw.id, '')
  if (!id) return null
  const startedAt = asNum(raw.startedAt, Date.now())
  const endedAt = typeof raw.endedAt === 'number' ? asNum(raw.endedAt) : null
  return {
    id,
    startedAt,
    endedAt,
    label: asStr(raw.label, ''),
    uboatId: asStr(raw.uboatId, asStr(raw.shipId, '')),
    shots: Array.isArray(raw.shots)
      ? (raw.shots as unknown[]).map(normalizeShot).filter((s): s is Shot => s !== null)
      : [],
  }
}

function normalizeLogShape(value: unknown): TdcLog | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const patrols = Array.isArray(raw.patrols)
    ? (raw.patrols as unknown[]).map(normalizePatrol).filter((p): p is Patrol => p !== null)
    : null
  if (!patrols) return null
  const activePatrolId = asStr(raw.activePatrolId, '')
  const activeExists = patrols.some(p => p.id === activePatrolId)
  return {
    version: LOG_VERSION,
    authorNick: asStr(raw.authorNick, ''),
    activePatrolId: activeExists ? activePatrolId : null,
    patrols,
  }
}

function readLog(): TdcLog {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      const log = normalizeLogShape(parsed)
      if (log) return log
    }
  } catch {
    /* ignore */
  }
  return defaultLog()
}

const listeners = new Set<() => void>()

export function subscribeLog(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function notify() {
  listeners.forEach(fn => fn())
}

function updateLog(mutate: (log: TdcLog) => void) {
  const log = readLog()
  mutate(log)
  persist(log)
  notify()
}

export function getLog(): TdcLog {
  return readLog()
}

export function getActivePatrol(): Patrol | null {
  const log = readLog()
  return log.patrols.find(p => p.id === log.activePatrolId) ?? null
}

export function patrolDuration(patrol: Patrol, now = Date.now()): number {
  return Math.max(0, (patrol.endedAt ?? now) - patrol.startedAt)
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function startPatrol(label = '', uboatId = ''): Patrol {
  const log = readLog()
  const existing = log.patrols.find(p => p.id === log.activePatrolId)
  if (existing) return existing
  const patrol: Patrol = {
    id: newId('patrol'),
    startedAt: Date.now(),
    endedAt: null,
    label,
    uboatId,
    shots: [],
  }
  log.patrols.push(patrol)
  log.activePatrolId = patrol.id
  persist(log)
  notify()
  return patrol
}

export function endPatrol(): Patrol | null {
  const log = readLog()
  const patrol = log.patrols.find(p => p.id === log.activePatrolId)
  if (!patrol) return null
  patrol.endedAt = Date.now()
  log.activePatrolId = null
  persist(log)
  notify()
  return patrol
}

export function recordShot(snapshot: ShotSnapshot): Shot | null {
  const log = readLog()
  const patrol = log.patrols.find(p => p.id === log.activePatrolId)
  if (!patrol) return null
  const shot: Shot = {
    id: newId('shot'),
    elapsedMs: Math.max(0, Date.now() - patrol.startedAt),
    at: Date.now(),
    snapshot,
    outcome: 'none',
    note: '',
  }
  patrol.shots.push(shot)
  persist(log)
  notify()
  return shot
}

export function setShotOutcome(patrolId: string, shotId: string, outcome: ShotOutcome) {
  updateLog(log => {
    const patrol = log.patrols.find(p => p.id === patrolId)
    const shot = patrol?.shots.find(s => s.id === shotId)
    if (shot) shot.outcome = outcome
  })
}

export function setShotNote(patrolId: string, shotId: string, note: string) {
  updateLog(log => {
    const patrol = log.patrols.find(p => p.id === patrolId)
    const shot = patrol?.shots.find(s => s.id === shotId)
    if (shot) shot.note = note
  })
}

export function deleteShot(patrolId: string, shotId: string) {
  updateLog(log => {
    const patrol = log.patrols.find(p => p.id === patrolId)
    if (patrol) patrol.shots = patrol.shots.filter(s => s.id !== shotId)
  })
}

export function deletePatrol(patrolId: string) {
  updateLog(log => {
    if (log.activePatrolId === patrolId) log.activePatrolId = null
    log.patrols = log.patrols.filter(p => p.id !== patrolId)
  })
}

export function resetLog() {
  persist(defaultLog())
  notify()
}

export function setAuthorNick(nick: string) {
  updateLog(log => {
    log.authorNick = nick
  })
}

export function exportLogJson(): string {
  return JSON.stringify(readLog(), null, 2)
}

export function logFileName(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `tdc-log-${y}-${m}-${d}.json`
}

export function importLogJson(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'json' }
  }
  const log = normalizeLogShape(parsed)
  if (!log) return { ok: false, error: 'shape' }
  persist(log)
  notify()
  return { ok: true }
}