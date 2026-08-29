import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocale } from '../core/i18n.js'
import { DocsPanel } from './docs-panel.js'

const tick = () => new Promise<void>(r => setTimeout(r))

const SAMPLE_MD = `## How to use the calculator

1. Pick a target class.
2. Measure the ticks.

## Math basics

**Range:**

\`\`\`formula
D = H × K ÷ R
\`\`\`

\`\`\`js
h * k / r
\`\`\`
`

function stubFetch(text: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => text }))
}

async function mount() {
  const el = new DocsPanel()
  document.body.appendChild(el)
  await tick()
  await el.updateComplete
  return el
}

beforeEach(() => {
  localStorage.clear()
  setLocale('ru')
  stubFetch(SAMPLE_MD)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('docs panel (markdown)', () => {
  it('renders markdown headings, formulas and navigation', async () => {
    const el = await mount()

    const headings = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.docs-body h2')].map(h =>
      h.textContent!.trim(),
    )
    expect(headings).toEqual(['How to use the calculator', 'Math basics'])

    const formula = el.shadowRoot!.querySelector('.docs-formula')
    expect(formula?.textContent!.replace(/\s+/g, ' ').trim()).toBe('D = H × K ÷ R')

    const code = el.shadowRoot!.querySelector('pre code')
    expect(code?.textContent!.trim()).toBe('h * k / r')

    const nav = el.shadowRoot!.querySelector('.docs-nav summary')
    expect(nav?.textContent!.trim()).toBe('Содержание')

    const links = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.docs-nav a')]
    expect(links.map(a => a.textContent!.trim())).toEqual([
      'How to use the calculator',
      'Math basics',
    ])
    expect(links.every(a => (a.getAttribute('href') ?? '').startsWith('#sec-'))).toBe(true)
  })

  it('reloads localized markdown when the language changes', async () => {
    const el = await mount()
    expect(el.shadowRoot!.querySelector('.docs-body h2')).not.toBeNull()

    const textFn = vi.fn(async () => '# Docs EN\n\nLoaded english')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: textFn }))

    setLocale('en')
    await tick()
    await el.updateComplete

    expect(fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('docs/en.md', expect.anything())
    expect(el.shadowRoot!.textContent).toContain('Loaded english')
  })
})