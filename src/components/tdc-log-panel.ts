import { css, html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { I18nElement } from '../i18n.js'
import { formStyles } from '../shared-styles.js'
import { locText, submarineName, SUBMARINES } from '../tdc-data.js'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
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
} from '../tdc-log.js'

const OUTCOME_KEY: Record<ShotOutcome, string> = {
  none: 'log.outcomeNone',
  hit_1: 'log.outcomeHit1',
  hit_n: 'log.outcomeHitN',
  miss_front: 'log.outcomeMissFront',
  miss_behind: 'log.outcomeMissBehind',
  hit_other: 'log.outcomeHitOther',
}

function countOutcomes(shots: Shot[]): Record<ShotOutcome, number> {
  const counts: Record<ShotOutcome, number> = {
    none: 0,
    hit_1: 0,
    hit_n: 0,
    miss_front: 0,
    miss_behind: 0,
    hit_other: 0,
  }
  for (const s of shots) counts[s.outcome]++
  return counts
}

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
    const blob = new Blob([exportLogJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = logFileName()
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  private _onImportClick() {
    this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click()
  }

  private _onImportFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importLogJson(String(reader.result ?? ''))
      if (result.ok) this._showToast(this.t('log.importOk'))
      else
        this._showToast(
          this.t(result.error === 'json' ? 'log.importErrJson' : 'log.importErrShape'),
        )
    }
    reader.readAsText(file)
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
                  <button type="button" class="btn" @click=${() => this._exportPdf(p)}>
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

  private _reportFileName(patrol: Patrol): string {
    const name = (patrol.label.trim() || 'patrol').replace(/[^a-z0-9_-]+/gi, '-')
    const date = new Date(patrol.startedAt)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `tdc-report-${name}-${y}-${m}-${d}.pdf`
  }

  private _shotCellText(snap: ShotSnapshotCalc): { title: string; formulas: string; inputs: string; results: string } {
    const title = locText(snap.calcTitle, this.locale) || snap.calcId
    const formulas = snap.formulas
      .map(f => `${locText(f.label, this.locale) || f.id}: ${f.expr}`)
      .join('; ')
    const inputs = snap.inputs.map(i => `${i.label}: ${i.value}`).join(', ')
    const results = snap.results
      .map(r => `${r.label}${r.unit ? `, ${r.unit}` : ''}: ${r.value}`)
      .join(', ')
    return { title, formulas, inputs, results }
  }

  private async _exportPdf(patrol: Patrol) {
    const name = patrol.label.trim() || patrol.id.slice(0, 8)
    const author = getLog().authorNick.trim()
    const counts = countOutcomes(patrol.shots)
    const t = this.t.bind(this)
    const locale = this.locale

    const mod = (await import('pdfmake/build/pdfmake')) as unknown as {
      default: {
        vfs: Record<string, string>
        createPdf: (dd: TDocumentDefinitions) => { download: (filename?: string) => void }
      }
    }
    const fonts = (await import('pdfmake/build/vfs_fonts')) as unknown as {
      default?: { pdfMake?: { vfs: Record<string, string> } }
      pdfMake?: { vfs: Record<string, string> }
    }
    const pdf = mod.default
    const vfs = fonts.pdfMake?.vfs ?? fonts.default?.pdfMake?.vfs
    if (vfs) pdf.vfs = vfs

    const shotBlock = (s: Shot, i: number): Content[] => {
      const outcomeText = this.t(OUTCOME_KEY[s.outcome])
      const blocks: Content[] = []
      for (const snap of s.snapshot) {
        const cell = this._shotCellText(snap)
        blocks.push(
          { text: cell.title, style: 'calcTitle' },
          {
            text: [{ text: `${t('log.reportInputs')}: `, style: 'label' }, cell.inputs || '—'],
            style: 'kv',
          },
          {
            text: [{ text: `${t('log.formulasTitle')}: `, style: 'label' }, cell.formulas || '—'],
            style: 'kv',
          },
          {
            text: [{ text: `${t('log.reportResults')}: `, style: 'label' }, cell.results || '—'],
            style: 'kv',
          },
        )
      }
      return [
        { text: t('log.shotN', { n: String(i + 1) }), style: 'shotTitle' },
        {
          columns: [
            {
              width: 'auto',
              text: [{ text: `${t('log.at')}: `, style: 'label' }, formatDuration(s.elapsedMs)],
            },
            {
              width: 'auto',
              text: [
                { text: `${t('log.outcomeLabel')}: `, style: 'label' },
                { text: outcomeText, bold: true },
              ],
            },
          ],
          columnGap: 24,
          margin: [0, 0, 0, 4],
        },
        ...blocks,
        {
          text: [{ text: `${t('log.notePlaceholder')}: `, style: 'label' }, s.note || '—'],
          style: 'kv',
          margin: [0, 4, 0, 0],
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 770, y2: 0, lineWidth: 0.6, lineColor: '#c8d2dc' }],
          margin: [0, 10, 0, 12],
        },
      ]
    }

    const summaryRows = [
      [t('log.reportTotal'), String(patrol.shots.length)],
      [t('log.reportHit1'), String(counts.hit_1)],
      [t('log.reportHitN'), String(counts.hit_n)],
      [t('log.reportMissFront'), String(counts.miss_front)],
      [t('log.reportMissBehind'), String(counts.miss_behind)],
      [t('log.reportHitOther'), String(counts.hit_other)],
      [t('log.reportNone'), String(counts.none)],
    ]

    const logo = '#3fd9c7'
    const doc: TDocumentDefinitions = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [36, 36, 36, 36],
      content: [
        {
          columns: [
            {
              width: 48,
              alignment: 'center',
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 48, h: 48, r: 8, color: '#0b1524' },
                { type: 'ellipse', x: 24, y: 24, r1: 20, r2: 20, lineColor: logo, lineWidth: 1 },
                { type: 'ellipse', x: 24, y: 24, r1: 13, r2: 13, lineColor: logo, lineWidth: 1 },
                { type: 'ellipse', x: 24, y: 24, r1: 6, r2: 6, lineColor: logo, lineWidth: 1 },
                { type: 'ellipse', x: 24, y: 24, r1: 1.6, r2: 1.6, color: logo },
                { type: 'line', x1: 24, y1: 24, x2: 24, y2: 6, lineColor: logo, lineWidth: 1 },
                { type: 'ellipse', x: 24, y: 5, r1: 1.8, r2: 1.8, color: logo },
              ],
            },
            {
              width: '*',
              stack: [
                { text: t('log.reportTitle'), style: 'title' },
                { text: `${name} · ${this.dateStr(patrol.startedAt)}`, style: 'subtitle' },
              ],
            },
          ],
          columnGap: 14,
          margin: [0, 0, 0, 6],
        },
        {
          columns: [
            { width: '*', text: [
              { text: `${t('log.reportAuthor')}: `, style: 'label' },
              author || '—',
            ] },
            { width: '*', text: [
              { text: `${t('log.reportUboat')}: `, style: 'label' },
              patrol.uboatId ? submarineName(patrol.uboatId, locale) : '—',
            ] },
            { width: '*', text: [
              { text: `${t('log.reportPatrol')}: `, style: 'label' },
              name,
            ] },
          ],
          columnGap: 24,
        },
        { columns: [
            { width: '*', text: [
              { text: `${t('log.reportStarted')}: `, style: 'label' },
              this.dateStr(patrol.startedAt),
            ] },
            { width: '*', text: [
              { text: `${t('log.reportEnded')}: `, style: 'label' },
              patrol.endedAt ? this.dateStr(patrol.endedAt) : '—',
            ] },
            { width: '*', text: [
              { text: `${t('log.reportDuration')}: `, style: 'label' },
              formatDuration(patrolDuration(patrol)),
            ] },
          ],
          columnGap: 24,
          margin: [0, 4, 0, 0],
        },
        { text: t('log.reportSummary'), style: 'h2' },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              ...summaryRows.map(([k, v]) => [
                { text: String(k), style: 'cell' } as const,
                { text: String(v), alignment: 'right' as const, style: 'cell' } as const,
              ]),
            ],
          },
          margin: [0, 0, 0, 14],
        },
        { text: t('log.shotsTitle'), style: 'h2' },
        patrol.shots.length === 0
          ? { text: t('log.reportNoShots'), style: 'muted' }
          : patrol.shots.flatMap((s, i) => shotBlock(s, i)),
      ],
      styles: {
        title: { fontSize: 19, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 12.5, color: '#5a6a7a', margin: [0, 0, 0, 14] },
        label: { bold: true },
        h2: { fontSize: 13.5, bold: true, margin: [0, 16, 0, 6] },
        shotTitle: { fontSize: 12.5, bold: true, color: '#1e4f74', margin: [0, 14, 0, 4] },
        calcTitle: { fontSize: 11.5, bold: true, color: '#3a5a76', margin: [0, 6, 0, 2] },
        kv: { fontSize: 10, margin: [0, 0, 0, 2] },
        cell: { fontSize: 10.5 },
        muted: { color: '#5a6a7a' },
      },
      defaultStyle: { fontSize: 11, lineHeight: 1.35 },
    }

    pdf.createPdf(doc).download(this._reportFileName(patrol))
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