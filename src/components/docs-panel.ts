import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import type { PropertyValues } from 'lit'
import { APP_VERSION } from '../app-version.js'
import { I18nElement } from '../i18n.js'
import { renderMarkdown } from '../markdown.js'
import { formStyles } from '../shared-styles.js'

@customElement('tdc-docs-panel')
export class DocsPanel extends I18nElement {
  @state() private content = ''
  @state() private loadError = false

  private controller: AbortController | null = null

  private async load(locale: string) {
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    try {
      const response = await fetch(`docs/${locale}.md`, { signal: controller.signal })
      if (!response.ok) throw new Error(String(response.status))
      const text = await response.text()
      if (controller.signal.aborted) return
      this.content = renderMarkdown(text)
      this.loadError = false
    } catch {
      if (!controller.signal.aborted) {
        this.content = ''
        this.loadError = true
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback()
    void this.load(this.locale)
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.controller?.abort()
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed)
    if (changed.has('locale')) {
      void this.load(this.locale)
    }
  }

  render() {
    return html`
      <section class="panel">
        <div class="docs-head">
          <h2 class="panel-title">${this.t('app.tabs.docs.label')}</h2>
          <span class="docs-version">${this.t('docs.versionLabel')} ${APP_VERSION}</span>
        </div>
        ${this.content
          ? html`<div class="docs-body">${unsafeHTML(this.content)}</div>`
          : this.loadError
            ? html`<p class="hint">${this.t('docs.loadError')}</p>`
            : html`<p class="hint">${this.t('docs.loading')}</p>`}
      </section>
    `
  }

  static styles = [
    formStyles,
    css`
      :host {
        display: block;
      }

      .docs-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .docs-version {
        flex-shrink: 0;
        font-family: var(--mono);
        font-size: 12px;
        color: var(--accent);
        background: var(--accent-dim);
        border: 1px solid var(--accent-border);
        border-radius: 999px;
        padding: 3px 12px;
      }

      .docs-body {
        margin-top: 6px;
      }

      .docs-body h2 {
        margin: 26px 0 8px;
        font-size: 18px;
        color: var(--text);
      }

      .docs-body h2:first-child {
        margin-top: 12px;
      }

      .docs-body h3 {
        margin: 18px 0 6px;
        font-size: 15px;
        color: var(--text);
      }

      .docs-body h4 {
        margin: 14px 0 4px;
        font-size: 14px;
        color: var(--accent);
      }

      .docs-body p {
        margin: 10px 0;
        font-size: 14px;
        line-height: 1.65;
      }

      .docs-body strong {
        color: var(--text);
        font-weight: 600;
      }

      .docs-body ol,
      .docs-body ul {
        margin: 10px 0;
        padding-left: 24px;
      }

      .docs-body li {
        margin: 5px 0;
        font-size: 14px;
        line-height: 1.6;
      }

      .docs-body code {
        font-family: var(--mono);
        font-size: 12.5px;
        color: var(--accent);
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 1px 5px;
      }

      .docs-body pre {
        margin: 12px 0;
        padding: 12px 14px;
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        overflow-x: auto;
      }

      .docs-body pre code {
        background: none;
        border: none;
        padding: 0;
        color: var(--text);
        font-size: 13px;
        line-height: 1.5;
      }

      .docs-formula {
        margin: 14px 0;
        padding: 14px 18px;
        text-align: center;
        font-family: var(--mono);
        font-weight: 600;
        font-size: 16px;
        line-height: 1.6;
        color: var(--accent);
        background: var(--accent-dim);
        border: 1px dashed var(--accent-border);
        border-radius: 10px;
        overflow-x: auto;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-docs-panel': DocsPanel
  }
}