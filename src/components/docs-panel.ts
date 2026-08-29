import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import type { PropertyValues } from 'lit'
import { I18nElement } from '../i18n.js'
import { extractSections, renderMarkdown } from '../markdown.js'
import { formStyles } from '../shared-styles.js'

interface DocSection {
  id: string
  title: string
}

@customElement('tdc-docs-panel')
export class DocsPanel extends I18nElement {
  @state() private content = ''
  @state() private sections: DocSection[] = []
  @state() private activeSection = ''
  @state() private loadError = false

  private controller: AbortController | null = null

  private async load(locale: string) {
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    try {
      const isProd = import.meta.env.PROD
      const response = await fetch(`docs/${locale}.${isProd ? 'html' : 'md'}`, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(String(response.status))
      const text = await response.text()
      if (controller.signal.aborted) return
      const html = isProd ? text : renderMarkdown(text)
      this.content = html
      this.sections = extractSections(html)
      this.loadError = false
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.content = ''
        this.sections = []
        this.loadError = true
      }
    }
  }

  private jumpTo(id: string) {
    this.activeSection = id
    const el = this.shadowRoot?.getElementById(id)
    el?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
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
        <h2 class="panel-title">${this.t('app.tabs.docs.label')}</h2>
        ${this.content
          ? html`
              ${this.sections.length > 0
                ? html`
                    <details class="docs-nav">
                      <summary>${this.t('docs.navLabel')}</summary>
                      <nav>
                        ${this.sections.map(
                          section => html`
                            <a
                              href="#${section.id}"
                              class=${section.id === this.activeSection ? 'active' : ''}
                              @click=${(event: Event) => {
                                event.preventDefault()
                                this.jumpTo(section.id)
                              }}
                            >
                              ${section.title}
                            </a>
                          `,
                        )}
                      </nav>
                    </details>
                  `
                : ''}
              <div class="docs-body">${unsafeHTML(this.content)}</div>
            `
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

      .docs-nav {
        margin-top: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
      }

      .docs-nav summary {
        cursor: pointer;
        user-select: none;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--accent);
      }

      .docs-nav nav {
        display: flex;
        flex-direction: column;
        gap: 1px;
        padding: 4px 8px 8px;
      }

      .docs-nav a {
        padding: 5px 8px;
        font-size: 13.5px;
        line-height: 1.4;
        color: var(--text-dim);
        border-radius: 6px;
        text-decoration: none;
      }

      .docs-nav a:hover,
      .docs-nav a.active {
        color: var(--accent);
        background: var(--accent-dim);
      }

      .docs-body {
        margin-top: 16px;
      }

      .docs-body h2 {
        margin: 26px 0 8px;
        font-size: 18px;
        color: var(--text);
        scroll-margin-top: 12px;
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