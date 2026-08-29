import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocale } from './i18n.js'
import { TdcLogPanel } from './components/tdc-log-panel.js'
import {
  deletePatrol,
  endPatrol,
  getActivePatrol,
  getLog,
  recordShot,
  resetLog,
  startPatrol,
  type ShotSnapshot,
} from './tdc-log.js'

const tick = () => new Promise<void>(r => setTimeout(r))

async function mount() {
  const el = new TdcLogPanel()
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
    results: [{ id: 'dist', label: 'Дистанция', value: '3700', unit: 'м' }],
  },
]

beforeEach(() => {
  localStorage.clear()
  resetLog()
  setLocale('ru')
  vi.stubGlobal('confirm', vi.fn(() => true))
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('log panel', () => {
  it('shows the start card when no patrol is active', async () => {
    const el = await mount()

    expect(el.shadowRoot!.querySelector('.start-btn')).not.toBeNull()
    expect(el.shadowRoot!.querySelector('.stopwatch')).toBeNull()
    expect(el.shadowRoot!.querySelector('.patrol-card')).toBeNull()
  })

  it('starts a patrol with a label and a u-boat', async () => {
    const el = await mount()

    const label = el.shadowRoot!.querySelector<HTMLInputElement>('.label-input')!
    label.value = 'Первый выход'
    label.dispatchEvent(new Event('input', { bubbles: true, composed: true }))

    const uboat = el.shadowRoot!.querySelector<HTMLSelectElement>('.ship-select')!
    uboat.value = 'u552'
    uboat.dispatchEvent(new Event('change', { bubbles: true, composed: true }))

    el.shadowRoot!.querySelector<HTMLButtonElement>('.start-btn')!.click()
    await tick()
    await el.updateComplete

    const active = getActivePatrol()
    expect(active?.label).toBe('Первый выход')
    expect(active?.uboatId).toBe('u552')
    expect(el.shadowRoot!.querySelector('.stopwatch')!.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('records a shot and lets the outcome and note be edited', async () => {
    const el = await mount()
    startPatrol('Выход')

    recordShot(SNAPSHOT)
    await tick()
    await el.updateComplete

    const shotCards = el.shadowRoot!.querySelectorAll('.shot-card')
    expect(shotCards.length).toBe(1)
    expect(shotCards[0].querySelector('.shot-when')!.textContent).toBe('00:00:00')
    expect(shotCards[0].querySelector('.shot-calc-title')!.textContent).toContain('Дистанция')
    expect(shotCards[0].querySelector('.shot-formulas summary')!.textContent).toContain('Формулы')

    const outcome = shotCards[0].querySelector<HTMLSelectElement>('.outcome-select')!
    outcome.value = 'hit_1'
    outcome.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
    await tick()
    await el.updateComplete

    expect(getLog().patrols[0].shots[0].outcome).toBe('hit_1')
    expect(outcome.querySelector('option[value="hit_1"]')!.hasAttribute('selected')).toBe(true)

    const note = shotCards[0].querySelector<HTMLInputElement>('.note-input')!
    note.value = 'прошли спереди'
    note.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    await tick()

    expect(getLog().patrols[0].shots[0].note).toBe('прошли спереди')
  })

  it('stops the patrol and lists it as finished', async () => {
    const el = await mount()
    startPatrol('Выход', 'bittern')
    await tick()
    await el.updateComplete

    el.shadowRoot!.querySelector<HTMLButtonElement>('.stop-btn')!.click()
    await tick()
    await el.updateComplete

    expect(getActivePatrol()).toBeNull()
    expect(getLog().patrols[0].endedAt).not.toBeNull()
    expect(el.shadowRoot!.querySelector('.patrol-card')).not.toBeNull()
  })

  it('deletes a finished patrol after confirmation', async () => {
    const el = await mount()
    startPatrol('Удалю потом')
    await tick()
    await el.updateComplete

    el.shadowRoot!.querySelector<HTMLButtonElement>('.stop-btn')!.click()
    await tick()
    await el.updateComplete

    expect(getLog().patrols.length).toBe(1)
    el.shadowRoot!.querySelector<HTMLButtonElement>('.patrol-card .patrol-actions .btn-danger')!.click()
    await tick()
    await el.updateComplete

    expect(getLog().patrols.length).toBe(0)
    expect(window.confirm).toHaveBeenCalled()
  })

  it('stores the report author nick', async () => {
    const el = await mount()

    const author = el.shadowRoot!.querySelector<HTMLInputElement>('.author-input')!
    author.value = 'SubMariner42'
    author.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
    await tick()

    expect(getLog().authorNick).toBe('SubMariner42')
    expect(author.value).toBe('SubMariner42')
  })

  it('keeps editing live while a patrol runs', async () => {
    const el = await mount()
    startPatrol('Активный')

    recordShot(SNAPSHOT)
    await tick()
    await el.updateComplete

    endPatrol()
    recordShot(SNAPSHOT)
    await tick()

    expect(getLog().patrols[0].shots.length).toBe(1)
    expect(getActivePatrol()).toBeNull()

    const cards = el.shadowRoot!.querySelectorAll('.shot-card')
    expect(cards.length).toBe(1)
    expect(cards[0].querySelector('.outcome-select')).not.toBeNull()
    expect(cards[0].querySelector('.note-input')).not.toBeNull()

    deletePatrol(getLog().patrols[0].id)
    await tick()
    expect(el.shadowRoot!.querySelector('.shot-card')).toBeNull()
  })
})