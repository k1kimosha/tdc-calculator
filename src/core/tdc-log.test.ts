import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOG_STORAGE_KEY,
  LOG_VERSION,
  deletePatrol,
  deleteShot,
  endPatrol,
  exportLogJson,
  formatDuration,
  getActivePatrol,
  getLog,
  importLogJson,
  logFileName,
  patrolDuration,
  recordShot,
  resetLog,
  setAuthorNick,
  setShotNote,
  setShotOutcome,
  startPatrol,
  type ShotSnapshot,
} from './tdc-log.js'

const SNAPSHOT: ShotSnapshot = [
  {
    calcId: 'distance',
    calcTitle: { ru: 'Дистанция', en: 'Range' },
    formulas: [{ id: 'dist', label: { ru: 'Дистанция', en: 'Range' }, expr: 'h/tan(a)' }],
    inputs: [{ name: 'h', label: 'Высота', value: '20' }],
    results: [{ id: 'dist', label: 'Дистанция', value: '3700', unit: 'м' }],
  },
]

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('tdc log', () => {
  it('starts empty and starts a patrol on demand', () => {
    const log = getLog()
    expect(log.version).toBe(LOG_VERSION)
    expect(log.patrols).toEqual([])
    expect(log.activePatrolId).toBeNull()

    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    const patrol = startPatrol('Первый выход', 'flavik')
    expect(patrol.startedAt).toBe(Date.now())
    expect(patrol.label).toBe('Первый выход')
    expect(patrol.uboatId).toBe('flavik')
    expect(patrol.endedAt).toBeNull()
    expect(patrol.shots).toEqual([])
    expect(getActivePatrol()?.id).toBe(patrol.id)
  })

  it('does not start a second patrol while one is active', () => {
    startPatrol()
    const first = getActivePatrol()
    const second = startPatrol('другое')
    expect(second.id).toBe(first?.id)
    expect(getLog().patrols.length).toBe(1)
  })

  it('records shots with elapsed time into the active patrol only', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    startPatrol()
    vi.setSystemTime(new Date('2026-01-01T12:00:30Z'))
    const shot = recordShot(SNAPSHOT)
    expect(shot).not.toBeNull()
    expect(shot!.elapsedMs).toBe(30000)
    expect(shot!.outcome).toBe('none')
    expect(shot!.method).toBe('calculated')
    expect(shot!.snapshot).toEqual(SNAPSHOT)
    expect(getActivePatrol()!.shots.length).toBe(1)
  })

  it('records a shot with the chosen firing method', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    startPatrol()
    const shot = recordShot(SNAPSHOT, 'lead')!
    expect(shot.method).toBe('lead')
    expect(getActivePatrol()!.shots[0].method).toBe('lead')
  })

  it('returns null while trying to record without an active patrol', () => {
    expect(recordShot(SNAPSHOT)).toBeNull()
  })

  it('ends the patrol with end time and duration', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    const patrol = startPatrol()
    vi.setSystemTime(new Date('2026-01-01T12:05:00Z'))
    recordShot(SNAPSHOT)
    const ended = endPatrol()
    expect(ended?.id).toBe(patrol.id)
    expect(ended?.endedAt).toBe(new Date('2026-01-01T12:05:00Z').getTime())
    expect(patrolDuration(ended!)).toBe(300000)
    expect(getActivePatrol()).toBeNull()
    expect(ended!.shots.length).toBe(1)
  })

  it('updates outcome and note for a shot', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    startPatrol()
    const shot = recordShot(SNAPSHOT)!
    const patrolId = getActivePatrol()!.id
    setShotOutcome(patrolId, shot.id, 'hit_1')
    setShotNote(patrolId, shot.id, 'зашла под ватерлинию')
    const stored = getActivePatrol()!.shots[0]
    expect(stored.outcome).toBe('hit_1')
    expect(stored.note).toBe('зашла под ватерлинию')
  })

  it('deletes a single shot', () => {
    startPatrol()
    const first = recordShot(SNAPSHOT)!
    const second = recordShot([{ ...SNAPSHOT[0], calcId: 'speed' }])!
    const patrolId = getActivePatrol()!.id
    deleteShot(patrolId, first.id)
    const left = getActivePatrol()!.shots
    expect(left.length).toBe(1)
    expect(left[0].id).toBe(second.id)
  })

  it('deletes a patrol and keeps the rest', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    startPatrol('один')
    endPatrol()
    startPatrol('два')
    endPatrol()
    const patrols = getLog().patrols
    expect(patrols.length).toBe(2)
    deletePatrol(patrols[0].id)
    const left = getLog().patrols
    expect(left.length).toBe(1)
    expect(left[0].label).toBe('два')
  })

  it('stores the author nick', () => {
    expect(getLog().authorNick).toBe('')
    setAuthorNick('SubMariner42')
    expect(getLog().authorNick).toBe('SubMariner42')
  })

  it('persists the log to localStorage and reads it back', () => {
    startPatrol('персист')
    const shot = recordShot(SNAPSHOT)!
    const patrolId = getActivePatrol()!.id
    setShotOutcome(patrolId, shot.id, 'miss_front')
    setAuthorNick('Nick')
    const raw = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '{}')
    expect(raw.version).toBe(LOG_VERSION)
    expect(raw.patrols.length).toBe(1)
    const patrol = getLog().patrols[0]
    expect(patrol.label).toBe('персист')
    expect(patrol.shots[0].outcome).toBe('miss_front')
  })

  it('exports readable JSON with a dated filename', () => {
    startPatrol()
    const text = exportLogJson()
    const parsed = JSON.parse(text)
    expect(parsed.patrols.length).toBe(1)
    expect(parsed.version).toBe(LOG_VERSION)
    expect(logFileName()).toMatch(/^tdc-log-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('imports a well-formed log and rejects broken ones', () => {
    resetLog()
    startPatrol('до экспорта')
    const exported = exportLogJson()
    resetLog()
    expect(getLog().patrols.length).toBe(0)
    const result = importLogJson(exported)
    expect(result).toEqual({ ok: true })
    expect(getLog().patrols.length).toBe(1)
    expect(getLog().patrols[0].label).toBe('до экспорта')

    expect(importLogJson('not json')).toEqual({ ok: false, error: 'json' })
    expect(importLogJson('{"patrols": "oops"}')).toEqual({ ok: false, error: 'shape' })
  })

  it('migrates v1 logs: shipId → uboatId, single-shot snapshot → array', () => {
    localStorage.setItem(
      LOG_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        authorNick: 'OldSalt',
        activePatrolId: null,
        patrols: [
          {
            id: 'p-1',
            startedAt: 1700000000000,
            endedAt: 1700003600000,
            label: 'старый',
            shipId: 'flavik',
            shots: [
              {
                id: 's-1',
                elapsedMs: 120000,
                at: 1700000120000,
                snapshot: {
                  calcId: 'distance',
                  calcTitle: { ru: 'Дистанция', en: 'Range' },
                  inputs: [{ name: 'h', label: 'Высота', value: '20' }],
                  results: [{ id: 'dist', label: 'Дистанция', value: '3700' }],
                },
                outcome: 'none',
                note: '',
              },
            ],
          },
        ],
      }),
    )
    const log = getLog()
    expect(log.version).toBe(LOG_VERSION)
    expect(log.patrols.length).toBe(1)
    expect(log.patrols[0].uboatId).toBe('flavik')
    const snapshot = log.patrols[0].shots[0].snapshot
    expect(snapshot).toHaveLength(1)
    expect(snapshot[0].calcId).toBe('distance')
    expect(snapshot[0].formulas).toEqual([])
    expect(snapshot[0].inputs).toEqual([{ name: 'h', label: 'Высота', value: '20' }])
    expect(log.patrols[0].shots[0].method).toBe('calculated')
  })

  it('formats durations as HH:MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00:00')
    expect(formatDuration(3599000)).toBe('00:59:59')
    expect(formatDuration(3600000)).toBe('01:00:00')
    expect(formatDuration(7325000)).toBe('02:02:05')
  })
})