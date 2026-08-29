import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './components/distance-panel.js'
import './components/speed-panel.js'
import './components/aob-panel.js'
import './components/okane-panel.js'
import './components/reference-panel.js'

type Tab = 'distance' | 'speed' | 'aob' | 'okane' | 'reference'

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'distance', label: 'Дистанция', hint: 'риски ↔ метры' },
  { id: 'speed', label: 'Скорость', hint: 'длина ÷ время' },
  { id: 'aob', label: 'КУЦ', hint: 'курсовой угол' },
  { id: 'okane', label: 'О’Кейн', hint: 'упреждение' },
  { id: 'reference', label: 'Справочник', hint: 'корабли и уставки' },
]

@customElement('tdc-app')
export class TdcApp extends LitElement {
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
      font-family: system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
        <div>
          <h1>TDC калькулятор</h1>
          <p class="subtitle">Расчёт уставок торпедного компьютера: дистанция и скорость цели</p>
        </div>
      </header>

      <nav class="tabs" role="tablist" aria-label="Разделы">
        ${TABS.map(
          t => html`
            <button
              type="button"
              role="tab"
              aria-selected=${this.tab === t.id}
              class="tab ${this.tab === t.id ? 'active' : ''}"
              @click=${() => (this.tab = t.id)}
            >
              <span class="t-label">${t.label}</span>
              <span class="t-hint">${t.hint}</span>
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
        <span>TDC калькулятор · расчёт уставок торпедного компьютера</span>
        <span>Дистанция: H × K ÷ риски &nbsp;·&nbsp; Скорость: длина ÷ время × 1,94</span>
      </footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-app': TdcApp
  }
}