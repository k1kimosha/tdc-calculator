import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setLocale } from '../core/i18n.js'
import { CalcPanel } from './calc-panel.js'
import { getShips, resetCatalog } from '../core/tdc-store.js'
import type { CalculatorConfig } from '../core/tdc-data.js'

const tick = () => new Promise<void>(r => setTimeout(r))

async function mount(config: CalculatorConfig) {
  const el = new CalcPanel()
  el.config = config
  document.body.appendChild(el)
  await tick()
  await el.updateComplete
  return el
}

function resultValues(el: CalcPanel): string[] {
  return [...el.shadowRoot!.querySelectorAll<HTMLElement>('.calc-result-value')].map(v =>
    v.textContent!.trim(),
  )
}

function triggerInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
}

beforeEach(() => {
  localStorage.clear()
  resetCatalog()
  setLocale('ru')
})

afterEach(() => {
  document.body.innerHTML = ''
})

const FEED_CONFIG: CalculatorConfig = {
  id: 'demo',
  title: { ru: 'Демо', en: 'Demo' },
  hint: { ru: 'Тест', en: 'Test' },
  controls: [{ kind: 'number', id: 'x', label: { ru: 'X', en: 'X' }, name: 'x', default: 3 }],
  formulas: [
    { id: 'a', expr: 'x*2' },
    { id: 'b', expr: 'a+x' },
  ],
}

describe('calc panel', () => {
  it('evaluates formulas in order and feeds previous results', async () => {
    const el = await mount(FEED_CONFIG)
    expect(el.shadowRoot!.querySelector('.panel-title')!.textContent!.trim()).toBe('Демо')
    expect(resultValues(el)).toEqual(['6', '9'])
  })

  it('feeds previous results by case-insensitive id (visRizki)', async () => {
    const config: CalculatorConfig = {
      id: 'mixed',
      title: { ru: 'Регистр', en: 'Case' },
      controls: [{ kind: 'number', id: 'r', label: { ru: 'Риски', en: 'Ticks' }, name: 'r', default: 15 }],
      formulas: [
        { id: 'visRizki', expr: 'r*2' },
        { id: 'aob', expr: 'asin(visRizki/30)*180/pi' },
      ],
    }
    const el = await mount(config)
    expect(resultValues(el)).toEqual(['30', '90'])
  })

  it('recomputes on input change', async () => {
    const el = await mount(FEED_CONFIG)
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.calc-input')!
    triggerInput(input, '5')
    await el.updateComplete
    expect(resultValues(el)).toEqual(['10', '15'])
  })

  it('renders select values and live-table rows', async () => {
    const config: CalculatorConfig = {
      id: 'sel',
      title: { ru: 'Подбор', en: 'Pick' },
      controls: [
        {
          kind: 'select',
          id: 'k',
          label: { ru: 'Коэфф', en: 'Factor' },
          name: 'k',
          defaultId: 'o2',
          options: [
            { id: 'o1', label: { ru: 'Два', en: 'Two' }, value: 2 },
            { id: 'o2', label: { ru: 'Четыре', en: 'Four' }, value: 4 },
          ],
        },
        {
          kind: 'liveTable',
          id: 'lt',
          label: { ru: 'Шпаргалка', en: 'Cheat' },
          valueLabel: { ru: 'Значение', en: 'Value' },
          rows: [
            { label: { ru: 'А', en: 'A' }, expr: 'k*10' },
            { label: { ru: 'Б', en: 'B' }, expr: 'k*100' },
          ],
        },
      ],
      formulas: [{ id: 'res', expr: 'k*5' }],
    }
    const el = await mount(config)
    expect(resultValues(el)).toEqual(['20'])

    const cells = [...el.shadowRoot!.querySelectorAll<HTMLTableCellElement>('.live-table td:last-child')].map(
      c => c.textContent!.trim(),
    )
    expect(cells).toEqual(['40', '400'])
  })

  it('binds ship length into a variable', async () => {
    const config: CalculatorConfig = {
      id: 'ship',
      title: { ru: 'Корабль', en: 'Ship' },
      controls: [{ kind: 'ships', id: 's', label: { ru: 'Цель', en: 'Target' }, bindLength: 'l' }],
      formulas: [{ id: 'len', expr: 'l' }],
    }
    const el = await mount(config)
    expect(resultValues(el)[0]).toContain('Неизвестная переменная')

    const ship = getShips().find(s => s.id === 'tribal')!
    const select = el.shadowRoot!.querySelector<HTMLSelectElement>('.calc-grid .select')!
    select.value = ship.id
    select.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
    await el.updateComplete
    expect(resultValues(el)).toEqual(['115'])
  })
})