import { beforeEach, describe, expect, it } from 'vitest'
import { resetCatalog } from './tdc-store.js'
import { buildCalcSnapshots } from './snapshot-utils.js'
import type { CalculatorConfig } from './tdc-data.js'

beforeEach(() => {
  localStorage.clear()
  resetCatalog()
})

describe('buildCalcSnapshots', () => {
  it('feeds previous formula results by case-insensitive id (visRizki)', () => {
    const config: CalculatorConfig = {
      id: 'aob',
      title: { ru: 'КУЦ', en: 'AOB' },
      controls: [{ kind: 'number', id: 'r', label: { ru: 'Риски', en: 'Ticks' }, name: 'r', default: 15 }],
      formulas: [
        { id: 'visRizki', expr: 'r*2' },
        { id: 'aob', expr: 'asin(visRizki/30)*180/pi' },
        { id: 'rizki', expr: 'visRizki*1000/100' },
      ],
    }
    const snaps = buildCalcSnapshots([config], { aob: { r: '15' } }, 'ru')
    expect(snaps[0].results.map(r => r.value)).toEqual(['30', '90', '300'])
  })

  it('marks failed formulas with em dash', () => {
    const config: CalculatorConfig = {
      id: 'bad',
      title: { ru: 'Бит', en: 'Bit' },
      controls: [{ kind: 'number', id: 'x', label: { ru: 'X', en: 'X' }, name: 'x', default: 2 }],
      formulas: [
        { id: 'y', expr: 'z*2' },
        { id: 'q', expr: 'x*3' },
      ],
    }
    const snaps = buildCalcSnapshots([config], { bad: { x: '2' } }, 'ru')
    expect(snaps[0].results.map(r => r.value)).toEqual(['—', '6'])
  })
})