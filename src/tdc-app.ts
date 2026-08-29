import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './components/calc-panel.js'
import './components/reference-panel.js'
import './components/docs-panel.js'
import './components/tdc-log-panel.js'
import { I18nElement, LOCALE_OPTIONS, setLocale } from './i18n.js'
import { locText, type CalculatorConfig } from './tdc-data.js'
import { getCalcs, subscribeCatalog } from './tdc-store.js'

@customElement('tdc-app')
export class TdcApp extends I18nElement {
  @state() private tab = ''
  @state() private calcs: CalculatorConfig[] = []

  private unsub: (() => void) | null = null

  override connectedCallback() {
    super.connectedCallback()
    this.refresh()
    this.unsub = subscribeCatalog(() => this.refresh())
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.unsub?.()
    this.unsub = null
  }

  private refresh() {
    this.calcs = getCalcs()
    if (this.tab !== 'reference' && this.tab !== 'docs' && this.tab !== 'log') {
      if (!this.calcs.some(c => c.id === this.tab)) {
        this.tab = this.calcs[0]?.id ?? 'reference'
      }
    }
  }

  static styles = css`
    :host {
      --bg: #0b1524;
      --panel: #101d31;
      --panel-2: #142338;
      --border: #24405f;
      --text: #c9d5e2;
      --text-dim: #7d93ad;
      --accent: #3fd9c7;
      --accent-dim: rgba(63, 217, 199, 0.12);
      --accent-border: rgba(63, 217, 199, 0.45);
      --radius: 12px;
      --mono: ui-monospace, 'Cascadia Mono', 'SFMono-Regular', Consolas, monospace;

      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px 64px;
      font-family: 'Noto Sans', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
        sans-serif;
      font-size: 15px;
      line-height: 1.5;
      color: var(--text);
    }

    .masthead {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 22px;
    }

    .masthead-titles {
      flex: 1;
      min-width: 0;
    }

    .brand-mark {
      width: 46px;
      height: 46px;
      flex: none;
      color: var(--accent);
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 650;
      letter-spacing: 0.02em;
      color: var(--text);
    }

    .subtitle {
      margin: 2px 0 0;
      font-size: 13px;
      color: var(--text-dim);
    }

    .lang {
      flex: none;
      align-self: flex-start;
      margin-top: 2px;
      appearance: none;
      box-sizing: border-box;
      background: #0a1422;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 7px 30px 7px 12px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="%237d93ad" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 10px center;
    }

    .lang:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-dim);
    }

    .lang option {
      background: var(--panel);
      color: var(--text);
    }

    .tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
      gap: 6px;
      padding: 6px;
      margin-bottom: 18px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .tab {
      appearance: none;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: var(--text-dim);
      padding: 9px 10px 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      font: inherit;
      transition:
        background 0.15s,
        color 0.15s;
    }

    .tab:hover {
      color: var(--text);
    }

    .tab.active {
      background: var(--accent-dim);
      color: var(--text);
      box-shadow: inset 0 0 0 1px var(--accent-border);
    }

    .tab .t-label {
      font-size: 14px;
      font-weight: 600;
    }

    .tab .t-hint {
      font-size: 11px;
      color: var(--text-dim);
    }

    .footer {
      margin-top: 26px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    @media (max-width: 520px) {
      :host {
        padding: 16px 12px 48px;
      }

      .tab .t-hint {
        display: none;
      }

      h1 {
        font-size: 20px;
      }
    }
  `

  render() {
    const tabs: { id: string; label: string; hint: string }[] = [
      ...this.calcs.map(c => ({
        id: c.id,
        label: locText(c.title, this.locale) || c.id,
        hint: c.hint ? locText(c.hint, this.locale) : '',
      })),
      { id: 'log', label: this.t('app.tabs.log.label'), hint: this.t('app.tabs.log.hint') },
      { id: 'reference', label: this.t('app.tabs.reference.label'), hint: this.t('app.tabs.reference.hint') },
      { id: 'docs', label: this.t('app.tabs.docs.label'), hint: this.t('app.tabs.docs.hint') },
    ]
    const active = this.calcs.find(c => c.id === this.tab)

    return html`
      <header class="masthead">
        <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-opacity="0.35" />
          <circle cx="24" cy="24" r="13" stroke="currentColor" stroke-opacity="0.55" />
          <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-opacity="0.75" />
          <circle cx="24" cy="24" r="1.6" fill="currentColor" />
          <path d="M24 24 V6" stroke="currentColor" stroke-linecap="round" />
          <circle cx="24" cy="5" r="1.8" fill="currentColor" />
        </svg>
        <div class="masthead-titles">
          <h1>${this.t('app.title')}</h1>
          <p class="subtitle">${this.t('app.subtitle')}</p>
        </div>
        <select
          class="lang"
          aria-label=${this.t('app.lang.label')}
          @change=${(e: Event) => setLocale((e.target as HTMLSelectElement).value)}
        >
          ${LOCALE_OPTIONS.map(
            o => html`
              <option value=${o.code} ?selected=${this.locale === o.code}>${o.label}</option>
            `,
          )}
        </select>
      </header>

      <nav class="tabs" role="tablist" aria-label=${this.t('app.tabs.aria')}>
        ${tabs.map(
          t => html`
            <button
              type="button"
              role="tab"
              aria-selected=${this.tab === t.id}
              class="tab ${this.tab === t.id ? 'active' : ''}"
              @click=${() => (this.tab = t.id)}
            >
              <span class="t-label">${t.label}</span>
              ${t.hint ? html`<span class="t-hint">${t.hint}</span>` : ''}
            </button>
          `,
        )}
      </nav>

      <main>
        ${active ? html`<tdc-calc-panel .config=${active}></tdc-calc-panel>` : ''}
        ${this.tab === 'reference' ? html`<tdc-reference-panel></tdc-reference-panel>` : ''}
        ${this.tab === 'docs' ? html`<tdc-docs-panel></tdc-docs-panel>` : ''}
        ${this.tab === 'log' ? html`<tdc-log-panel></tdc-log-panel>` : ''}
      </main>

      <footer class="footer">
        <span>${this.t('app.footer.left')}</span>
        <span>${this.t('app.footer.right')}</span>
      </footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-app': TdcApp
  }
}