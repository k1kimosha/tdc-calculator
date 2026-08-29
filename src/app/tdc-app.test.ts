import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setLocale } from '../core/i18n.js'
import { resetCatalog } from '../core/tdc-store.js'
import { resetLog, startPatrol, getActivePatrol, recordShot, type ShotSnapshot } from '../core/tdc-log.js'
import { TdcApp } from './tdc-app.js'

const tick = () => new Promise<void>(r => setTimeout(r))

async function mount() {
  const el = new TdcApp()
  document.body.appendChild(el)
  await tick()
  await el.updateComplete
  return el
}

const SNAPSHOT: ShotSnapshot = [
  {
    calcId: 'distance',
    calcTitle: { ru: 'Дистанция', en: 'Range' },
    formulas: [{ id: 'dist', label: { ru: 'Дистанция', en: 'Range' }, expr: 'h/tan(a)' }],
    inputs: [{ name: 'h', label: 'Высота', value: '20' }],
    results: [{ id: 'dist', label: 'Расстояние', value: '3700', unit: 'м' }],
  },
]

beforeEach(() => {
  localStorage.clear()
  resetCatalog()
  resetLog()
  setLocale('ru')
})

afterEach(() => {
  document.body.innerHTML = ''
  delete (window as { confirm?: unknown }).confirm
})

describe('tdc app dock', () => {
  it('renders social links and the idle patrol dock', async () => {
    const el = await mount()
    const links = [...el.shadowRoot!.querySelectorAll<HTMLAnchorElement>('.social-link')]
    expect(links.length).toBe(2)
    expect(links[0].getAttribute('href')).toBe('https://github.com/k1kimosha/tdc-calculator')
    expect(links[1].getAttribute('href')).toBe('https://discord.gg/DGeRx7BY9q')
    expect(el.shadowRoot!.querySelector('.dock')!.textContent).toContain('Активного похода нет')
    expect(el.shadowRoot!.querySelector('.dock')!.textContent).toContain('Начать поход')
  })

  it('shows active patrol with timer, shot count and a record action', async () => {
    startPatrol('Первый выход', 'u96')
    recordShot(SNAPSHOT)
    const el = await mount()
    const dock = el.shadowRoot!.querySelector('.dock')!
    expect(el.shadowRoot!.querySelector('.dot')!.classList.contains('on')).toBe(true)
    expect(dock.textContent).toContain('Поход активен')
    expect(dock.textContent).toContain('1 выстрел')
    expect(dock.textContent).toContain('Записать выстрел')
    expect(dock.textContent).toContain('Завершить')
  })

  it('records a shot from the dock into the active patrol', async () => {
    const patrol = startPatrol('Поход', 'u552')
    const el = await mount()
    const recordBtn = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.dock .btn')].find(b =>
      b.textContent!.includes('Записать выстрел'),
    )!
    recordBtn.click()
    await el.updateComplete
    const active = getActivePatrol()!
    expect(active.id).toBe(patrol.id)
    expect(active.shots.length).toBe(1)
    expect(active.shots[0].method).toBe('calculated')
    expect(el.shadowRoot!.querySelector('.dock')!.textContent).toContain('Выстрел записан')
  })

  it('records a shot with the selected firing method', async () => {
    const patrol = startPatrol('Поход', 'u552')
    const el = await mount()
    const leadBtn = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.dock .seg')].find(b =>
      b.textContent!.includes('На упреждение'),
    )!
    leadBtn.click()
    await el.updateComplete
    const recordBtn = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.dock .btn')].find(b =>
      b.textContent!.includes('Записать выстрел'),
    )!
    recordBtn.click()
    await el.updateComplete
    const active = getActivePatrol()!
    expect(active.id).toBe(patrol.id)
    expect(active.shots[0].method).toBe('lead')
  })

  it('finishes the patrol from the dock after confirmation', async () => {
    startPatrol('Поход', 'u96')
    ;(window as { confirm?: () => boolean }).confirm = () => true
    const el = await mount()
    const stopBtn = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.dock .btn')].find(b =>
      b.textContent!.includes('Завершить'),
    )!
    stopBtn.click()
    await el.updateComplete
    expect(getActivePatrol()).toBeNull()
  })

  it('keeps the patrol when the confirmation is declined', async () => {
    startPatrol('Поход', 'u96')
    ;(window as { confirm?: () => boolean }).confirm = () => false
    const el = await mount()
    const stopBtn = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.dock .btn')].find(b =>
      b.textContent!.includes('Завершить'),
    )!
    stopBtn.click()
    await el.updateComplete
    expect(getActivePatrol()).not.toBeNull()
  })
})