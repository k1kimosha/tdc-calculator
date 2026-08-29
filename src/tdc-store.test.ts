import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario, ShipClass } from './tdc-data.js'
import {
  CATALOG_VERSION,
  STORAGE_KEY,
  catalogFileName,
  exportCatalogJson,
  getCalcs,
  getFormulas,
  getNotes,
  getScenarios,
  getShips,
  importCatalogJson,
  newId,
  removeCalculator,
  removeNote,
  removeScenario,
  removeShip,
  resetCatalog,
  subscribeCatalog,
  upsertCalculator,
  upsertNote,
  upsertScenario,
  upsertShip,
} from './tdc-store.js'
import type { Note } from './tdc-store.js'

function defaultShip(overrides: Partial<ShipClass> = {}): ShipClass {
  return {
    id: 'ship-1',
    nameRu: 'Тестовый',
    nameEn: 'Test',
    length: 100,
    mastHeight: 25,
    funnelHeight: 12,
    draft: 4,
    speed: 30,
    deckGun: true,
    ...overrides,
  }
}

function defaultScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario-1',
    title: { ru: 'Тест', en: 'Test' },
    surface: {
      recommendation: { ru: '1000 м', en: '1000 m' },
      detection: { ru: '800 м', en: '800 m' },
      leftCaption: { ru: 'Л', en: 'L' },
      rightCaption: { ru: 'П', en: 'R' },
      rows: [{ label: { ru: 'А', en: 'A' }, value: '1' }],
    },
    submerged: {
      recommendation: { ru: '500 м', en: '500 m' },
      detection: { ru: '300 м', en: '300 m' },
      leftCaption: { ru: 'Л', en: 'L' },
      rightCaption: { ru: 'П', en: 'R' },
      rows: [],
    },
    ...overrides,
  }
}

function defaultNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    category: 'general',
    title: 'Заметка',
    body: 'Текст',
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  localStorage.removeItem(STORAGE_KEY)
})

describe('defaults', () => {
  it('seeds default ships with deck gun flag', () => {
    const ships = getShips()
    expect(ships).toHaveLength(3)
    expect(ships.every(s => s.deckGun === true)).toBe(true)
    expect(ships.map(s => s.id)).toEqual(['flavik', 'bittern', 'tribal'])
  })

  it('seeds default scenarios with surface and submerged modes', () => {
    const scenarios = getScenarios()
    expect(scenarios).toHaveLength(2)
    for (const s of scenarios) {
      expect(s.surface.rows.length).toBeGreaterThan(0)
      expect(s.submerged).toBeDefined()
    }
  })

  it('starts with no notes', () => {
    expect(getNotes()).toEqual([])
  })

  it('fresh catalog has a stored version', () => {
    getShips()
    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored as string).version).toBe(CATALOG_VERSION)
  })
})

describe('CRUD ships', () => {
  it('adds a new ship', () => {
    upsertShip(defaultShip())
    expect(getShips().map(s => s.id)).toContain('ship-1')
  })

  it('updates an existing ship by id', () => {
    upsertShip(defaultShip())
    upsertShip(defaultShip({ length: 120, nameRu: 'Обновлён' }))
    const ship = getShips().find(s => s.id === 'ship-1')
    expect(ship?.length).toBe(120)
    expect(ship?.nameRu).toBe('Обновлён')
    expect(getShips()).toHaveLength(4)
  })

  it('removes a ship', () => {
    upsertShip(defaultShip())
    removeShip('ship-1')
    expect(getShips().map(s => s.id)).not.toContain('ship-1')
  })
})

describe('CRUD scenarios and notes', () => {
  it('adds and updates a scenario', () => {
    upsertScenario(defaultScenario())
    expect(getScenarios()).toHaveLength(3)
    upsertScenario(defaultScenario({ title: { ru: 'Новый', en: 'New' } }))
    expect(getScenarios()).toHaveLength(3)
    expect(getScenarios().find(s => s.id === 'scenario-1')?.title.ru).toBe('Новый')
  })

  it('removes a scenario', () => {
    upsertScenario(defaultScenario())
    removeScenario('scenario-1')
    expect(getScenarios().map(s => s.id)).not.toContain('scenario-1')
  })

  it('adds, updates and removes a note', () => {
    upsertNote(defaultNote())
    expect(getNotes()).toHaveLength(1)
    upsertNote(defaultNote({ body: 'Изменено' }))
    expect(getNotes()[0].body).toBe('Изменено')
    removeNote('note-1')
    expect(getNotes()).toHaveLength(0)
  })

  it('keeps unrelated entries untouched on edits', () => {
    upsertNote(defaultNote())
    upsertShip(defaultShip())
    upsertNote(defaultNote({ body: 'Изменено' }))
    expect(getShips().length).toBe(4)
    expect(getNotes().length).toBe(1)
  })
})

describe('catalog calculators', () => {
  it('seeds all four calculators with default formulas', () => {
    const calcs = getCalcs()
    expect(calcs.map(c => c.id)).toEqual(['distance', 'speed', 'aob', 'okane'])
    const dist = calcs.find(c => c.id === 'distance')!
    expect(dist.formulas.find(f => f.id === 'dist')?.expr).toBe('h*k/r')
    expect(dist.formulas.find(f => f.id === 'rizki')?.expr).toBe('h*k/d')
  })

  it('getFormulas falls back to defaults for a calculator', () => {
    expect(getFormulas('distance').dist).toBe('h*k/r')
    expect(getFormulas('aob').aob).toBe('asin(v/l)*180/pi')
    expect(getFormulas('okane').runTime).toBe('d/(vs*c)')
  })

  it('upserts a calculator and persists the change', () => {
    upsertCalculator({
      id: 'distance',
      formulas: [
        { id: 'dist', expr: 'h*K/r' },
        { id: 'rizki', expr: 'h*K/d' },
      ],
    })
    expect(getFormulas('distance').dist).toBe('h*K/r')
    expect(getCalcs().find(c => c.id === 'distance')!.formulas).toHaveLength(2)
  })

  it('includes calculators in export and restores them on import', () => {
    upsertCalculator({ id: 'distance', formulas: [{ id: 'dist', expr: 'h*K/r' }, { id: 'rizki', expr: 'h*k/d' }] })
    const json = exportCatalogJson()
    const parsed = JSON.parse(json)
    expect(Array.isArray(parsed.calcs)).toBe(true)
    importCatalogJson(json)
    expect(getFormulas('distance').dist).toBe('h*K/r')
  })

  it('fills calculator defaults when the imported file has none', () => {
    const json = JSON.stringify({
      version: 1,
      ships: [],
      scenarios: [],
      calcs: [],
      notes: [],
    })
    expect(importCatalogJson(json)).toEqual({ ok: true })
    expect(getFormulas('speed').speed).toBe('l/t*1.94')
  })

  it('removes a calculator and leaves the others intact', () => {
    upsertCalculator({
      id: 'custom-del',
      title: { ru: 'Временный', en: 'Temporary' },
      formulas: [{ id: 'x', expr: '1+1' }],
    })
    removeCalculator('custom-del')
    expect(getCalcs().some(c => c.id === 'custom-del')).toBe(false)
    expect(getCalcs().some(c => c.id === 'distance')).toBe(true)
  })

  it('creates a custom calculator with controls and persists it', () => {
    upsertCalculator({
      id: 'custom-1',
      title: { ru: 'Мой', en: 'My calculator' },
      hint: { ru: 'Подсказка', en: 'Hint' },
      controls: [
        { kind: 'number', id: 'n1', label: { ru: 'X', en: 'X' }, name: 'x', default: 5, unit: { ru: 'м', en: 'm' } },
      ],
      formulas: [{ id: 'res', expr: 'x*2', label: { ru: 'Результат', en: 'Result' } }],
    })
    const calcs = getCalcs()
    const mine = calcs.find(c => c.id === 'custom-1')
    expect(mine).toBeDefined()
    expect(mine!.title.ru).toBe('Мой')
    expect(mine!.controls).toHaveLength(1)
    expect(mine!.controls[0]).toMatchObject({ kind: 'number', name: 'x', default: 5 })
    expect(mine!.formulas.find(f => f.id === 'res')?.expr).toBe('x*2')
    expect(calcs[calcs.length - 1].id).toBe('custom-1')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.calcs.some((c: { id: string }) => c.id === 'custom-1')).toBe(true)
  })

  it('migrates a legacy partial upsert to a full config', () => {
    upsertCalculator({ id: 'distance', formulas: [{ id: 'dist', expr: 'h*K/r' }] })
    const dist = getCalcs().find(c => c.id === 'distance')!
    expect(dist.formulas.find(f => f.id === 'dist')?.expr).toBe('h*K/r')
    expect(dist.title.ru.length).toBeGreaterThan(0)
    expect(dist.controls.length).toBeGreaterThan(0)
  })
})

describe('reset', () => {
  it('restores factory defaults after mutations', () => {
    upsertShip(defaultShip())
    upsertNote(defaultNote())
    resetCatalog()
    expect(getShips().map(s => s.id)).toEqual(['flavik', 'bittern', 'tribal'])
    expect(getNotes()).toEqual([])
  })
})

describe('subscription', () => {
  it('notifies subscribers on mutation and reset', () => {
    const seen: number[] = []
    subscribeCatalog(() => seen.push(seen.length))
    upsertShip(defaultShip())
    resetCatalog()
    expect(seen.length).toBeGreaterThanOrEqual(2)
  })
})

describe('newId', () => {
  it('produces prefixed ids', () => {
    expect(newId('ship')).toMatch(/^ship-/)
    expect(newId('scenario')).toMatch(/^scenario-/)
    expect(newId('note')).toMatch(/^note-/)
  })
})

describe('export / import', () => {
  it('exports valid JSON with a catalog shape', () => {
    const json = exportCatalogJson()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(CATALOG_VERSION)
    expect(Array.isArray(parsed.ships)).toBe(true)
    expect(Array.isArray(parsed.scenarios)).toBe(true)
    expect(Array.isArray(parsed.notes)).toBe(true)
  })

  it('builds a dated file name', () => {
    expect(catalogFileName()).toMatch(/^tdc-catalog-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('imports a valid export and replaces the catalog', () => {
    upsertShip(defaultShip())
    const json = exportCatalogJson()
    expect(getShips()).toHaveLength(4)
    expect(importCatalogJson(json)).toEqual({ ok: true })
    expect(getShips()).toHaveLength(4)
    resetCatalog()
    expect(importCatalogJson(exportCatalogJson())).toEqual({ ok: true })
    expect(getShips()).toHaveLength(3)
  })

  it('rejects malformed JSON', () => {
    expect(importCatalogJson('{not json')).toEqual({ ok: false, error: 'json' })
  })

  it('rejects valid JSON with wrong shape', () => {
    expect(importCatalogJson('42')).toEqual({ ok: false, error: 'shape' })
    expect(
      importCatalogJson(JSON.stringify({ version: 1, ships: [], scenarios: [], notes: 'oops' })),
    ).toEqual({ ok: false, error: 'shape' })
  })

  it('filters invalid entries but imports the rest', () => {
    const json = JSON.stringify({
      version: 1,
      ships: [defaultShip(), null, 'bad', 7],
      scenarios: [defaultScenario()],
      notes: [defaultNote(), null],
    })
    expect(importCatalogJson(json)).toEqual({ ok: true })
    expect(getShips()).toHaveLength(1)
    expect(getScenarios()).toHaveLength(1)
    expect(getNotes()).toHaveLength(1)
  })

  it('falls back to the surface mode when submerged is missing', () => {
    const json = JSON.stringify({
      version: 1,
      ships: [],
      scenarios: [{ ...defaultScenario(), submerged: undefined }],
      notes: [],
    })
    expect(importCatalogJson(json)).toEqual({ ok: true })
    const scenario = getScenarios()[0]
    expect(scenario.submerged).toBeDefined()
  })
})