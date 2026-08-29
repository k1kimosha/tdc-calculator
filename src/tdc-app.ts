import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './components/distance-panel.js'
import './components/speed-panel.js'
import './components/aob-panel.js'
import './components/okane-panel.js'
import './components/reference-panel.js'
import { I18nElement, LOCALE_OPTIONS, setLocale } from './i18n.js'

type Tab = 'distance' | 'speed' | 'aob' | 'okane' | 'reference'

const TABS: { id: Tab; labelKey: string; hintKey: string }[] = [
  { id: 'distance', labelKey: 'app.tabs.distance.label', hintKey: 'app.tabs.distance.hint' },
  { id: 'speed', labelKey: 'app.tabs.speed.label', hintKey: 'app.tabs.speed.hint' },
  { id: 'aob', labelKey: 'app.tabs.aob.label', hintKey: 'app.tabs.aob.hint' },
  { id: 'okane', labelKey: 'app.tabs.okane.label', hintKey: 'app.tabs.okane.hint' },
  { id: 'reference', labelKey: 'app.tabs.reference.label', hintKey: 'app.tabs.reference.hint' },
]

@customElement('tdc-app')
export class TdcApp extends I18nElement {
  @state() private tab: Tab = 'distance'

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
      grid-template-columns: repeat(5, 1fr);
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
        ${TABS.map(
          t => html`
            <button
              type="button"
              role="tab"
              aria-selected=${this.tab === t.id}
              class="tab ${this.tab === t.id ? 'active' : ''}"
              @click=${() => (this.tab = t.id)}
            >
              <span class="t-label">${this.t(t.labelKey)}</span>
              <span class="t-hint">${this.t(t.hintKey)}</span>
            </button>
          `,
        )}
      </nav>

      <main>
        ${this.tab === 'distance'
          ? html`<tdc-distance-panel></tdc-distance-panel>`
          : ''}
        ${this.tab === 'speed' ? html`<tdc-speed-panel></tdc-speed-panel>` : ''}
        ${this.tab === 'aob' ? html`<tdc-aob-panel></tdc-aob-panel>` : ''}
        ${this.tab === 'okane' ? html`<tdc-okane-panel></tdc-okane-panel>` : ''}
        ${this.tab === 'reference'
          ? html`<tdc-reference-panel></tdc-reference-panel>`
          : ''}
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