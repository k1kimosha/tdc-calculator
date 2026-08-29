import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setLocale } from './i18n.js'
import { ReferencePanel } from './components/reference-panel.js'
import { getShips, resetCatalog } from './tdc-store.js'

const tick = () => new Promise<void>(r => setTimeout(r))

async function mount() {
  const el = new ReferencePanel()
  document.body.appendChild(el)
  await tick()
  await el.updateComplete
  return el
}

beforeEach(() => {
  localStorage.clear()
  resetCatalog()
  setLocale('ru')
})

afterEach(() => {
  document.body.innerHTML = ''
})

function textInput(el: ReferencePanel, index = 0): HTMLInputElement {
  const inputs = [...el.shadowRoot!.querySelectorAll<HTMLInputElement>('.form-grid input[type="text"]')]
  return inputs[index]
}

function triggerInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
}

describe('reference panel — single-language drafts', () => {
  it('keeps the unsaved ship draft alive across a locale switch', async () => {
    const el = await mount()

    el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.section-head .btn-accent')[0].click()
    await el.updateComplete

    const name = textInput(el)
    triggerInput(name, 'Крейсер «Феникс»')
    await el.updateComplete
    expect(textInput(el).value).toBe('Крейсер «Феникс»')

    setLocale('en')
    await tick()
    await el.updateComplete

    expect(textInput(el).value).toBe('')

    setLocale('ru')
    await tick()
    await el.updateComplete

    expect(textInput(el).value).toBe('Крейсер «Феникс»')

    el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.form-actions .btn-accent')[0].click()
    await el.updateComplete

    const saved = getShips().find(s => s.id !== 'flavik' && s.id !== 'bittern' && s.id !== 'tribal')
    expect(saved?.nameRu).toBe('Крейсер «Феникс»')
    expect(saved?.nameEn).toBe('')
  })

  it('shows the source-language name when the active locale is not localized', async () => {
    const el = await mount()

    el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.section-head .btn-accent')[0].click()
    await el.updateComplete

    triggerInput(textInput(el), 'Крейсер «Феникс»')
    await el.updateComplete

    el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.form-actions .btn-accent')[0].click()
    await el.updateComplete

    setLocale('en')
    await tick()
    await el.updateComplete

    const rows = [...el.shadowRoot!.querySelectorAll<HTMLTableRowElement>('tbody tr')].filter(r =>
      r.querySelector('.ship-name'),
    )
    const row = rows.at(-1)!
    expect(row.querySelector('.ship-name')!.textContent!.trim()).toBe('Крейсер «Феникс»')
  })

  it('keeps the unsaved scenario title across a locale switch', async () => {
    const el = await mount()

    el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.section-head .btn-accent')[1].click()
    await el.updateComplete

    const title = textInput(el, 0)
    triggerInput(title, 'Эскорт днём')
    await el.updateComplete

    setLocale('en')
    await tick()
    await el.updateComplete
    expect(textInput(el, 0).value).toBe('')

    setLocale('ru')
    await tick()
    await el.updateComplete
    expect(textInput(el, 0).value).toBe('Эскорт днём')
  })
})