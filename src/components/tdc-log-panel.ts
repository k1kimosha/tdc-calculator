/**
 * Журнал походов: старт/стоп патруля, фиксация выстрелов (исход, заметка),
 * список завершённых походов, экспорт/импорт JSON и PDF-отчёт.
 */
import { css, html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { I18nElement } from '../core/i18n.js'
import { formStyles } from '../styles/shared-styles.js'
import { locText, submarineName, SUBMARINES } from '../core/tdc-data.js'
import { OUTCOME_KEY, countOutcomes, exportPatrolPdf } from '../report/pdf-report.js'
import { downloadText, readFileAsText } from '../utils/download.js'
import {
  SHOT_OUTCOMES,
  deletePatrol,
  deleteShot,
  endPatrol,
  exportLogJson,
  formatDuration,
  getActivePatrol,
  getLog,
  importLogJson,
  logFileName,
  patrolDuration,
  resetLog,
  setAuthorNick,
  setShotNote,
  setShotOutcome,
  startPatrol,
  subscribeLog,
  type Patrol,
  type Shot,
  type ShotOutcome,
  type ShotSnapshotCalc,
} from '../core/tdc-log.js'

@customElement('tdc-log-panel')
export class TdcLogPanel extends I18nElement {
  @state() private clock = Date.now()
  @state() private label = ''
  @state() private uboatId = ''
  @state() private toast: string | null = null

  private unsub: (() => void) | null = null
  private interval = 0
  private toastTimer = 0

  override connectedCallback() {
    super.connectedCallback()
    this.unsub = subscribeLog(() => this.requestUpdate())
    this.interval = window.setInterval(() => {
      this.clock = Date.now()
    }, 500)
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.unsub?.()
    this.unsub = null
    window.clearInterval(this.interval)
    window.clearTimeout(this.toastTimer)
  }

  private _showToast(text: string) {
    this.toast = text
    window.clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => {
      this.toast = null
    }, 4000)
  }

  private _start() {
    startPatrol(this.label.trim(), this.uboatId)
  }

  private _stop() {
    if (window.confirm(this.t('log.stopConfirm'))) endPatrol()
  }

  private _onLabel(e: Event) {
    this.label = (e.target as HTMLInputElement).value
  }

  private _onUboat(e: Event) {
    this.uboatId = (e.target as HTMLSelectElement).value
  }

  private _onAuthor(e: Event) {
    setAuthorNick((e.target as HTMLInputElement).value)
  }

  private _onOutcome(patrolId: string, shotId: string, e: Event) {
    setShotOutcome(patrolId, shotId, (e.target as HTMLSelectElement).value as ShotOutcome)
  }

  private _onNote(patrolId: string, shotId: string, e: Event) {
    setShotNote(patrolId, shotId, (e.target as HTMLInputElement).value)
  }

  private _onExport() {
    downloadText(exportLogJson(), logFileName(), 'application/json')
  }

  private _onImportClick() {
    this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click()
  }

  private async _onImportFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const result = importLogJson(await readFileAsText(file))
    if (result.ok) this._showToast(this.t('log.importOk'))
    else
      this._showToast(
        this.t(result.error === 'json' ? 'log.importErrJson' : 'log.importErrShape'),
      )
  }

  private _onClear() {
    if (window.confirm(this.t('log.clearLogConfirm'))) {
      resetLog()
      this._showToast(this.t('log.logCleared'))
    }
  }

  private _onDeletePatrol(id: string, name: string) {
    if (window.confirm(this.t('log.deletePatrolConfirm', { name }))) deletePatrol(id)
  }

  private dateStr(ts: number): string {
    return new Date(ts).toLocaleString(this.locale)
  }

  private renderCalcBlock(snap: ShotSnapshotCalc) {
    return html`
      <div class="shot-calc-block">
        <div class="shot-calc-title">
          ${locText(snap.calcTitle, this.locale) || snap.calcId}
        </div>
        ${snap.formulas.length > 0
          ? html`
              <details class="shot-formulas">
                <summary>${this.t('log.formulasTitle')}</summary>
                ${snap.formulas.map(
                  f => html`
                    <div class="kv-row">
                      <span class="kv-k">${locText(f.label, this.locale) || f.id}</span>
                      <code class="kv-code">${f.expr}</code>
                    </div>
                  `,
                )}
              </details>
            `
          : nothing}
        <div class="shot-cols">
          <div class="shot-col">
            <div class="shot-col-title">${this.t('log.reportInputs')}</div>
            ${snap.inputs.length === 0
              ? html`<div class="shot-empty">—</div>`
              : snap.inputs.map(
                  i => html`
                    <div class="kv-row">
                      <span class="kv-k">${i.label}</span>
                      <span class="kv-v">${i.value}</span>
                    </div>
                  `,
                )}
          </div>
          <div class="shot-col">
            <div class="shot-col-title">${this.t('log.reportResults')}</div>
            ${snap.results.length === 0
              ? html`<div class="shot-empty">—</div>`
              : snap.results.map(
                  r => html`
                    <div class="kv-row">
                      <span class="kv-k">${r.label}${r.unit ? ` · ${r.unit}` : ''}</span>
                      <span class="kv-v">${r.value}</span>
                    </div>
                  `,
                )}
          </div>
        </div>
      </div>
    `
  }

  private renderShot(patrol: Patrol, shot: Shot) {
    const calcNames = shot.snapshot
      .map(s => locText(s.calcTitle, this.locale) || s.calcId)
      .join(' · ')
    return html`
      <div class="shot-card">
        <div class="shot-head">
          <span class="shot-when">${formatDuration(shot.elapsedMs)}</span>
          <span class="shot-calc">${calcNames}</span>
          <span class="shot-actions">
            <button
              type="button"
              class="icon-btn danger"
              title=${this.t('log.deleteShot')}
              @click=${() => deleteShot(patrol.id, shot.id)}
            >×</button>
          </span>
        </div>
        <div class="shot-blocks">
          ${shot.snapshot.map(snap => this.renderCalcBlock(snap))}
        </div>
        <div class="shot-meta">
          <select class="select outcome-select" @change=${(e: Event) => this._onOutcome(patrol.id, shot.id, e)}>
            ${SHOT_OUTCOMES.map(
              o => html`
                <option value=${o} ?selected=${shot.outcome === o}>
                  ${this.t(OUTCOME_KEY[o])}
                </option>
              `,
            )}
          </select>
          <input
            class="note-input"
            type="text"
            .value=${shot.note}
            placeholder=${this.t('log.notePlaceholder')}
            @input=${(e: Event) => this._onNote(patrol.id, shot.id, e)}
          />
        </div>
      </div>
    `
  }

  private renderActive() {
    const active = getActivePatrol()
    if (!active) return nothing
    const elapsed = Math.max(0, (this.clock || Date.now()) - active.startedAt)
    return html`
      <section class="panel">
        <div class="section-head">
          <h2 class="panel-title">${this.t('log.running')}</h2>
          <button type="button" class="btn btn-danger stop-btn" @click=${this._stop}>
            ${this.t('log.stop')}
          </button>
        </div>
        <p class="hint">${this.t('log.recordHint')}</p>
        <div class="stopwatch">${formatDuration(elapsed)}</div>
        <h3 class="sub-title">${this.t('log.shotsTitle')}</h3>
        ${active.shots.length === 0
          ? html`<p class="empty">${this.t('log.noShots')}</p>`
          : active.shots.map(s => this.renderShot(active, s))}
      </section>
    `
  }

  private renderStartCard() {
    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('log.startTitle')}</h2>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">${this.t('log.labelField')}</label>
            <input class="label-input" type="text" .value=${this.label} @input=${this._onLabel} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('log.uboatField')}</label>
            <select class="select ship-select" @change=${this._onUboat}>
              <option value="">—</option>
              ${SUBMARINES.map(
                s => html`
                  <option value=${s.id} ?selected=${this.uboatId === s.id}>
                    ${submarineName(s.id, this.locale)}
                  </option>
                `,
              )}
            </select>
          </div>
        </div>
        <div class="start-actions">
          <button type="button" class="btn btn-accent start-btn" @click=${this._start}>
            ${this.t('log.start')}
          </button>
        </div>
      </section>
    `
  }

  private renderFinished() {
    const active = getActivePatrol()
    const patrols = getLog()
      .patrols.filter(p => p.id !== active?.id)
      .reverse()
    if (patrols.length === 0) return nothing
    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('log.endedTitle')}</h2>
        ${patrols.map(p => {
          const counts = countOutcomes(p.shots)
          const name = p.label.trim() || p.id.slice(0, 8)
          return html`
            <div class="patrol-card">
              <div class="patrol-head">
                <div>
                  <div class="patrol-title">${this.t('log.reportPatrol')}: ${name}</div>
                  <div class="patrol-sub">
                    ${this.dateStr(p.startedAt)} · ${formatDuration(patrolDuration(p))}
                    ${p.uboatId ? ` · ${submarineName(p.uboatId, this.locale)}` : ''}
                  </div>
                </div>
                <div class="patrol-actions">
                  <button type="button" class="btn" @click=${() => exportPatrolPdf(p, this.locale, this.t.bind(this))}>
                    ${this.t('log.printReport')}
                  </button>
                  <button type="button" class="btn btn-danger" @click=${() => this._onDeletePatrol(p.id, name)}>
                    ${this.t('log.deletePatrol')}
                  </button>
                </div>
              </div>
              <div class="patrol-stats">
                <div class="stat">
                  <span class="stat-v">${p.shots.length}</span>
                  <span class="stat-k">${this.t('log.numShots')}</span>
                </div>
                ${this.renderStats(counts)}
              </div>
              <div class="ended-shots">
                ${p.shots.map(s => this.renderShot(p, s))}
              </div>
            </div>
          `
        })}
      </section>
    `
  }

  private renderStats(counts: Record<ShotOutcome, number>) {
    const items: { key: string; count: number }[] = [
      { key: this.t('log.outcomeHit1'), count: counts.hit_1 },
      { key: this.t('log.outcomeHitN'), count: counts.hit_n },
      { key: this.t('log.outcomeMissFront'), count: counts.miss_front },
      { key: this.t('log.outcomeMissBehind'), count: counts.miss_behind },
      { key: this.t('log.outcomeHitOther'), count: counts.hit_other },
    ]
    return items
      .filter(i => i.count > 0)
      .map(
        i => html`
          <div class="stat">
            <span class="stat-v">${i.count}</span>
            <span class="stat-k">${i.key}</span>
          </div>
        `,
      )
  }

  render() {
    const active = getActivePatrol()
    return html`
      <section class="panel">
        <div class="toolbar-head">
          <div>
            <h2 class="panel-title">${this.t('app.tabs.log.label')}</h2>
            <p class="hint">${this.t('log.toolbarHint')}</p>
          </div>
          <div class="toolbar-btns">
            <button type="button" class="btn" @click=${this._onExport}>
              ${this.t('log.exportJson')}
            </button>
            <button type="button" class="btn" @click=${this._onImportClick}>
              ${this.t('log.importJson')}
            </button>
            <button type="button" class="btn btn-danger" @click=${this._onClear}>
              ${this.t('log.clearLog')}
            </button>
          </div>
        </div>
        <div class="author-row">
          <label class="field-label" for="log-author">${this.t('log.authorLabel')}</label>
          <input
            id="log-author"
            class="author-input"
            type="text"
            .value=${getLog().authorNick}
            @input=${this._onAuthor}
          />
        </div>
        ${this.toast ? html`<p class="toast">${this.toast}</p>` : nothing}
        <input
          type="file"
          class="file-input"
          accept=".json,application/json"
          @change=${this._onImportFile}
        />
      </section>

      ${active ? this.renderActive() : this.renderStartCard()}
      ${this.renderFinished()}
    `
  }

  static styles = [
    formStyles,
    css`
      :host {
        display: block;
      }

      .toolbar-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .toolbar-btns {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .author-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 12px;
      }

      .author-row .field-label {
        margin: 0;
        white-space: nowrap;
      }

      .author-input {
        max-width: 280px;
      }

      .toast {
        margin: 12px 0 0;
        padding: 10px 14px;
        font-size: 13px;
        color: var(--accent);
        background: var(--accent-dim);
        border: 1px solid var(--accent-border);
        border-radius: 8px;
      }

      .stopwatch {
        margin-top: 14px;
        padding: 18px;
        text-align: center;
        font-family: var(--mono);
        font-size: 42px;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: var(--accent);
        background: var(--panel-2);
        border: 1px solid var(--accent-border);
        border-radius: 12px;
      }

      .sub-title {
        margin: 22px 0 10px;
        font-size: 13px;
        font-weight: 650;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text);
      }

      .shot-card {
        margin-bottom: 12px;
        padding: 12px 14px;
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 10px;
      }

      .shot-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .shot-when {
        font-family: var(--mono);
        font-size: 13px;
        font-weight: 600;
        color: var(--accent);
        background: var(--accent-dim);
        border: 1px solid var(--accent-border);
        border-radius: 999px;
        padding: 2px 10px;
      }

      .shot-calc {
        font-size: 14px;
        color: var(--text);
      }

      .shot-actions {
        flex: 1;
        display: flex;
        justify-content: flex-end;
      }

      .icon-btn {
        appearance: none;
        width: 28px;
        height: 28px;
        border: 1px solid var(--border);
        background: transparent;
        border-radius: 6px;
        color: var(--text-dim);
        font-size: 15px;
        line-height: 1;
        cursor: pointer;
      }

      .icon-btn.danger:hover {
        border-color: #e58a8a;
        color: #e58a8a;
      }

      .shot-cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }

      .shot-col-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-dim);
        margin-bottom: 6px;
      }

      .shot-col .kv-row {
        font-size: 12.5px;
        padding: 5px 8px;
      }

      .shot-empty {
        font-family: var(--mono);
        font-size: 12px;
        color: var(--text-dim);
      }

      .shot-meta {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        flex-wrap: wrap;
      }

      .outcome-select {
        flex: 1;
        min-width: 180px;
        max-width: 320px;
      }

      .note-input {
        flex: 2;
        min-width: 180px;
      }

      .start-actions {
        margin-top: 14px;
      }

      .patrol-card {
        margin-bottom: 16px;
        padding: 14px 16px;
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 10px;
      }

      .patrol-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .patrol-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text);
      }

      .patrol-sub {
        font-size: 12px;
        color: var(--text-dim);
        margin-top: 2px;
      }

      .patrol-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .patrol-stats {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 12px 0;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6px 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
      }

      .stat-v {
        font-family: var(--mono);
        font-size: 17px;
        font-weight: 700;
        color: var(--accent);
      }

      .stat-k {
        font-size: 11px;
        color: var(--text-dim);
        text-align: center;
      }

      .shot-cards {
        margin-top: 8px;
      }

      .shot-blocks {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .shot-calc-block {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 10px 12px;
        background: var(--panel);
      }

      .shot-calc-title {
        font-size: 13px;
        font-weight: 650;
        color: var(--accent);
        margin-bottom: 6px;
      }

      .shot-formulas {
        margin: 0 0 8px;
        font-size: 12.5px;
        color: var(--text-dim);
      }

      .shot-formulas summary {
        cursor: pointer;
        user-select: none;
        margin-bottom: 4px;
      }

      .kv-code {
        font-family: var(--mono);
        font-size: 11.5px;
        color: var(--text-dim);
        margin-left: auto;
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60%;
      }

      .kv-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .ended-shots {
        margin-top: 8px;
      }

      .empty {
        font-size: 13px;
        color: var(--text-dim);
      }

      .btn {
        appearance: none;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text);
        border-radius: 8px;
        padding: 9px 16px;
        font: inherit;
        font-size: 13.5px;
        cursor: pointer;
        transition:
          background 0.15s,
          border-color 0.15s,
          color 0.15s;
      }

      .btn:hover {
        border-color: var(--accent-border);
      }

      .btn-accent {
        background: var(--accent);
        border-color: transparent;
        color: #06121b;
        font-weight: 600;
      }

      .btn-accent:hover {
        filter: brightness(1.08);
      }

      .btn-danger {
        color: #e58a8a;
        border-color: rgba(229, 138, 138, 0.4);
      }

      .btn-danger:hover {
        background: rgba(229, 138, 138, 0.1);
        border-color: #e58a8a;
      }

      .file-input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-log-panel': TdcLogPanel
  }
}