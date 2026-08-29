import { css, html, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  IDENTIFICATION_INTRO,
  IDENTIFICATION_METHODS,
  locText,
  shipClassName,
  type CalculatorConfig,
  type Scenario,
  type ScenarioMode,
  type ShipClass,
} from '../tdc-data.js'
import { I18nElement } from '../i18n.js'
import { formStyles, segmentStyles, tableStyles } from '../shared-styles.js'
import {
  NOTE_CATEGORIES,
  catalogFileName,
  exportCatalogJson,
  getCalcs,
  getNotes,
  getScenarios,
  getShips,
  importCatalogJson,
  newId,
  removeCalculator,
  removeNote,
  removeScenario,
  removeShip,
  resetCatalog,
  subscribeCatalog,
  upsertCalculator,
  upsertNote,
  upsertScenario,
  upsertShip,
  type Note,
} from '../tdc-store.js'
import './calc-editor.js'

type EditingState =
  | { kind: 'ship'; draft: ShipClass }
  | { kind: 'scenario'; draft: Scenario }
  | { kind: 'note'; draft: Note }
  | { kind: 'calc'; draft: CalculatorConfig }
  | null

type ScenarioModeKey = 'surface' | 'submerged'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

const editIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3L6 13l-4 1 1-4z"></path></svg>`
const trashIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M6 4V2h4v2M4 4l1 10h6l1-10"></path></svg>`

@customElement('tdc-reference-panel')
export class ReferencePanel extends I18nElement {
  @state() private editing: EditingState = null
  @state() private modeOf: Record<string, ScenarioModeKey> = {}
  @state() private toast: string | null = null

  private unsub?: () => void
  private toastTimer?: ReturnType<typeof setTimeout>

  connectedCallback() {
    super.connectedCallback()
    this.unsub = subscribeCatalog(() => this.requestUpdate())
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.unsub?.()
    this.unsub = undefined
  }

  private _showToast(message: string) {
    this.toast = message
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => {
      this.toast = null
    }, 4000)
  }

  private get currentSide(): 'ru' | 'en' {
    return this.locale === 'ru' ? 'ru' : 'en'
  }

  private blankShip(): ShipClass {
    return {
      id: '',
      nameRu: '',
      nameEn: '',
      length: 0,
      mastHeight: 0,
      funnelHeight: 0,
      draft: 0,
      speed: 0,
      deckGun: false,
    }
  }

  private blankMode(): ScenarioMode {
    return {
      recommendation: { ru: '', en: '' },
      detection: { ru: '', en: '' },
      leftCaption: { ru: '', en: '' },
      rightCaption: { ru: '', en: '' },
      rows: [],
    }
  }

  private blankScenario(): Scenario {
    return {
      id: '',
      title: { ru: '', en: '' },
      surface: this.blankMode(),
      submerged: this.blankMode(),
    }
  }

  private blankNote(): Note {
    return { id: '', category: 'general', title: '', body: '' }
  }

  private _openShip(ship: ShipClass | 'new') {
    this.editing = { kind: 'ship', draft: ship === 'new' ? this.blankShip() : { ...ship } }
  }

  private _openScenario(scenario: Scenario | 'new') {
    const draft = scenario === 'new' ? this.blankScenario() : JSON.parse(JSON.stringify(scenario)) as Scenario
    this.editing = { kind: 'scenario', draft }
  }

  private _openNote(note: Note | 'new') {
    this.editing = { kind: 'note', draft: note === 'new' ? this.blankNote() : { ...note } }
  }

  private _shipText(field: 'nameRu' | 'nameEn', value: string) {
    if (!this.editing || this.editing.kind !== 'ship') return
    this.editing = { kind: 'ship', draft: { ...this.editing.draft, [field]: value } }
  }

  private _shipNum(field: 'length' | 'mastHeight' | 'funnelHeight' | 'draft' | 'speed', value: string) {
    if (!this.editing || this.editing.kind !== 'ship') return
    const draft: ShipClass = { ...this.editing.draft, [field]: toNumber(value) }
    this.editing = { kind: 'ship', draft }
  }

  private _shipGun(value: boolean) {
    if (!this.editing || this.editing.kind !== 'ship') return
    this.editing = { kind: 'ship', draft: { ...this.editing.draft, deckGun: value } }
  }

  private _saveShip() {
    if (!this.editing || this.editing.kind !== 'ship') return
    upsertShip({ ...this.editing.draft, id: this.editing.draft.id || newId('ship') })
    this.editing = null
  }

  private _deleteShip(id: string) {
    if (window.confirm(this.t('reference.confirmDelete'))) removeShip(id)
  }

  private _scTitle(value: string) {
    if (!this.editing || this.editing.kind !== 'scenario') return
    const draft = this.editing.draft
    draft.title = { ...draft.title, [this.currentSide]: value }
    this.editing = { kind: 'scenario', draft }
  }

  private _scModeText(
    mode: ScenarioModeKey,
    field: 'recommendation' | 'detection' | 'leftCaption' | 'rightCaption',
    value: string,
  ) {
    if (!this.editing || this.editing.kind !== 'scenario') return
    const draft = this.editing.draft
    draft[mode][field] = { ...draft[mode][field], [this.currentSide]: value }
    this.editing = { kind: 'scenario', draft }
  }

  private _scAddRow(mode: ScenarioModeKey) {
    if (!this.editing || this.editing.kind !== 'scenario') return
    const draft = this.editing.draft
    draft[mode].rows = [...draft[mode].rows, { label: { ru: '', en: '' }, value: '' }]
    this.editing = { kind: 'scenario', draft }
  }

  private _scRemoveRow(mode: ScenarioModeKey, index: number) {
    if (!this.editing || this.editing.kind !== 'scenario') return
    const draft = this.editing.draft
    draft[mode].rows = draft[mode].rows.filter((_, i) => i !== index)
    this.editing = { kind: 'scenario', draft }
  }

  private _scRow(
    mode: ScenarioModeKey,
    index: number,
    kind: 'label' | 'value',
    value: string,
  ) {
    if (!this.editing || this.editing.kind !== 'scenario') return
    const draft = this.editing.draft
    const row = draft[mode].rows[index]
    if (kind === 'value') row.value = value
    else row.label = { ...row.label, [this.currentSide]: value }
    this.editing = { kind: 'scenario', draft }
  }

  private _saveScenario() {
    if (!this.editing || this.editing.kind !== 'scenario') return
    upsertScenario({ ...this.editing.draft, id: this.editing.draft.id || newId('scenario') })
    this.editing = null
  }

  private _deleteScenario(id: string) {
    if (window.confirm(this.t('reference.confirmDelete'))) removeScenario(id)
  }

  private _noteField(field: 'title' | 'body' | 'category', value: string) {
    if (!this.editing || this.editing.kind !== 'note') return
    this.editing = { kind: 'note', draft: { ...this.editing.draft, [field]: value } }
  }

  private _saveNote() {
    if (!this.editing || this.editing.kind !== 'note') return
    upsertNote({ ...this.editing.draft, id: this.editing.draft.id || newId('note') })
    this.editing = null
  }

  private _deleteNote(id: string) {
    if (window.confirm(this.t('reference.confirmDelete'))) removeNote(id)
  }

  private _onMode(sc: Scenario, value: ScenarioModeKey) {
    this.modeOf = { ...this.modeOf, [sc.id]: value }
  }

  private _openCalc(id: string) {
    const existing = getCalcs().find(c => c.id === id)
    const draft = existing
      ? (JSON.parse(JSON.stringify(existing)) as CalculatorConfig)
      : {
          id: newId('calc'),
          title: { ru: '', en: '' },
          hint: { ru: '', en: '' },
          controls: [],
          formulas: [],
        }
    this.editing = { kind: 'calc', draft }
  }

  private _deleteCalc(id: string) {
    const calc = getCalcs().find(c => c.id === id)
    const name = calc ? locText(calc.title, this.locale) || id : id
    if (!window.confirm(this.t('reference.calcs.deleteConfirm', { name }))) return
    removeCalculator(id)
    if (this.editing?.kind === 'calc' && this.editing.draft.id === id) this.editing = null
    this._showToast(this.t('reference.calcs.deleted'))
  }

  private _onCalcSaved(e: Event) {
    const detail = (e as CustomEvent<CalculatorConfig>).detail
    upsertCalculator(detail)
    this.editing = null
    this._showToast(this.t('reference.calcs.saved'))
  }

  private _onCalcCancel() {
    this.editing = null
  }

  private _onExport() {
    const blob = new Blob([exportCatalogJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = catalogFileName()
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
      const result = importCatalogJson(String(reader.result ?? ''))
      if (result.ok) this._showToast(this.t('reference.import.ok'))
      else
        this._showToast(
          this.t(result.error === 'json' ? 'reference.import.errJson' : 'reference.import.errShape'),
        )
    }
    reader.readAsText(file)
  }

  private _onReset() {
    if (window.confirm(this.t('reference.confirmReset'))) resetCatalog()
  }

  private renderToolbar() {
    return html`
      <section class="panel toolbar">
        <p class="toolbar-hint">${this.t('reference.toolbar.hint')}</p>
        <div class="toolbar-btns">
          <button type="button" class="btn" @click=${this._onExport}>
            ${this.t('reference.toolbar.export')}
          </button>
          <button type="button" class="btn" @click=${this._onImportClick}>
            ${this.t('reference.toolbar.import')}
          </button>
          <button type="button" class="btn btn-danger" @click=${this._onReset}>
            ${this.t('reference.toolbar.reset')}
          </button>
        </div>
        ${this.toast ? html`<p class="toast">${this.toast}</p>` : nothing}
        <input
          type="file"
          class="file-input"
          accept=".json,application/json"
          @change=${this._onImportFile}
        />
      </section>
    `
  }

  private renderShips() {
    const ships = getShips()
    return html`
      <section class="panel">
        <div class="section-head">
          <h2 class="panel-title">${this.t('reference.ships.title')}</h2>
          <button type="button" class="btn btn-accent" @click=${() => this._openShip('new')}>
            + ${this.t('reference.ships.add')}
          </button>
        </div>
        ${ships.length === 0
          ? html`<p class="empty">${this.t('reference.ships.empty')}</p>`
          : html`
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>${this.t('reference.ships.colClass')}</th>
                      <th class="num">${this.t('reference.ships.colLength')}</th>
                      <th class="num">${this.t('reference.ships.colMastFunnel')}</th>
                      <th class="num">${this.t('reference.ships.colDraft')}</th>
                      <th class="num">${this.t('reference.ships.colSpeed')}</th>
                      <th>${this.t('reference.ships.colGun')}</th>
                      <th class="th-actions" aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ships.map(
                      s => html`
                        <tr>
                          <td>
                            ${this.locale === 'ru'
                              ? html`
                                  <div class="ship-name">${s.nameRu || s.nameEn}</div>
                                  ${
                                    s.nameEn && s.nameEn !== (s.nameRu || s.nameEn)
                                      ? html`<div class="ship-en">${s.nameEn}</div>`
                                      : nothing
                                  }
                                `
                              : html`<div class="ship-name">${s.nameEn || s.nameRu}</div>`}
                          </td>
                          <td class="num">${s.length}</td>
                          <td class="num">${s.mastHeight} / ${s.funnelHeight}</td>
                          <td class="num">${s.draft}</td>
                          <td class="num">${s.speed}</td>
                          <td class="num">
                            ${s.deckGun
                              ? this.t('reference.ships.gunYes')
                              : this.t('reference.ships.gunNo')}
                          </td>
                          <td class="row-actions">
                            <button
                              type="button"
                              class="icon-btn"
                              title=${this.t('reference.confirmDelete')}
                              aria-label=${this.t('reference.ships.colClass')}
                              @click=${() => this._openShip(s)}
                            >
                              ${editIcon}
                            </button>
                            <button
                              type="button"
                              class="icon-btn danger"
                              title=${`${this.t('reference.ships.colClass')}: ${shipClassName(s, this.locale)}`}
                              aria-label=${this.t('reference.confirmDelete')}
                              @click=${() => this._deleteShip(s.id)}
                            >
                              ${trashIcon}
                            </button>
                          </td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            `}
        ${this.editing?.kind === 'ship' ? this.renderShipForm() : nothing}
      </section>
    `
  }

  private renderShipForm() {
    const d = (this.editing as { kind: 'ship'; draft: ShipClass }).draft
    return html`
      <div class="editor">
        <h3>
          ${d.id ? this.t('reference.ships.formTitleEdit') : this.t('reference.ships.formTitleNew')}
        </h3>
        <div class="form-grid">
          <div class="field field-wide">
            <label class="field-label">${this.t(this.currentSide === 'ru' ? 'reference.ships.nameRu' : 'reference.ships.nameEn')}</label>
            <input type="text" .value=${d[this.currentSide === 'ru' ? 'nameRu' : 'nameEn']} @input=${(e: Event) => this._shipText(this.currentSide === 'ru' ? 'nameRu' : 'nameEn', (e.target as HTMLInputElement).value)} />
            <p class="field-hint">${this.t('reference.form.fallbackHint')}</p>
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.ships.length')}</label>
            <input type="number" step="any" .value=${String(d.length)} @change=${(e: Event) => this._shipNum('length', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.ships.mast')}</label>
            <input type="number" step="any" .value=${String(d.mastHeight)} @change=${(e: Event) => this._shipNum('mastHeight', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.ships.funnel')}</label>
            <input type="number" step="any" .value=${String(d.funnelHeight)} @change=${(e: Event) => this._shipNum('funnelHeight', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.ships.draft')}</label>
            <input type="number" step="any" .value=${String(d.draft)} @change=${(e: Event) => this._shipNum('draft', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.ships.speed')}</label>
            <input type="number" step="any" .value=${String(d.speed)} @change=${(e: Event) => this._shipNum('speed', (e.target as HTMLInputElement).value)} />
          </div>
        </div>
        <label class="check">
          <input type="checkbox" ?checked=${d.deckGun} @change=${(e: Event) => this._shipGun((e.target as HTMLInputElement).checked)} />
          <span>${this.t('reference.ships.deckGun')}</span>
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-accent" @click=${this._saveShip}>
            ${this.t('reference.save')}
          </button>
          <button type="button" class="btn" @click=${() => (this.editing = null)}>
            ${this.t('reference.cancel')}
          </button>
        </div>
      </div>
    `
  }

  private renderScenarioModeGroup(mode: ScenarioModeKey) {
    if (!this.editing || this.editing.kind !== 'scenario') return nothing
    const draft = this.editing.draft
    const m = draft[mode]
    const groupTitle = mode === 'surface' ? 'reference.scenario.modeSurf' : 'reference.scenario.modeSub'
    const fieldVal = (field: 'recommendation' | 'detection' | 'leftCaption' | 'rightCaption') =>
      m[field][this.currentSide]
    return html`
      <div class="mode-group">
        <h4>${this.t(groupTitle)}</h4>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">${this.t('reference.scenario.recommendationValue')}</label>
            <input type="text" .value=${fieldVal('recommendation')} @input=${(e: Event) => this._scModeText(mode, 'recommendation', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.scenario.detectionValue')}</label>
            <input type="text" .value=${fieldVal('detection')} @input=${(e: Event) => this._scModeText(mode, 'detection', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.scenario.leftCaption')}</label>
            <input type="text" .value=${fieldVal('leftCaption')} @input=${(e: Event) => this._scModeText(mode, 'leftCaption', (e.target as HTMLInputElement).value)} />
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.scenario.rightCaption')}</label>
            <input type="text" .value=${fieldVal('rightCaption')} @input=${(e: Event) => this._scModeText(mode, 'rightCaption', (e.target as HTMLInputElement).value)} />
          </div>
        </div>
        <p class="rows-hint">${this.t('reference.form.fallbackHint')}</p>
        <div class="rows-editor">
          ${m.rows.length === 0 ? html`<p class="empty">${this.t('reference.scenario.rowsHint')}</p>` : nothing}
          ${m.rows.map(
            (row, i) => html`
              <div class="row-line">
                <input type="text" placeholder=${this.t(this.currentSide === 'ru' ? 'reference.scenario.rowLabelRu' : 'reference.scenario.rowLabelEn')} .value=${row.label[this.currentSide]} @input=${(e: Event) => this._scRow(mode, i, 'label', (e.target as HTMLInputElement).value)} />
                <input type="text" class="row-wide" placeholder=${this.t('reference.scenario.rowValue')} .value=${row.value} @input=${(e: Event) => this._scRow(mode, i, 'value', (e.target as HTMLInputElement).value)} />
                <button type="button" class="icon-btn danger" @click=${() => this._scRemoveRow(mode, i)}>
                  ${trashIcon}
                </button>
              </div>
            `,
          )}
        </div>
        <button type="button" class="btn" @click=${() => this._scAddRow(mode)}>
          + ${this.t('reference.scenario.addRow')}
        </button>
      </div>
    `
  }

  private renderScenarioForm() {
    const d = (this.editing as { kind: 'scenario'; draft: Scenario }).draft
    return html`
      <div class="editor">
        <h3>
          ${d.id
            ? this.t('reference.scenario.formTitleEdit')
            : this.t('reference.scenario.formTitleNew')}
        </h3>
        <div class="form-grid">
          <div class="field field-wide">
            <label class="field-label">${this.t(this.currentSide === 'ru' ? 'reference.scenario.titleRu' : 'reference.scenario.titleEn')}</label>
            <input type="text" .value=${d.title[this.currentSide]} @input=${(e: Event) => this._scTitle((e.target as HTMLInputElement).value)} />
            <p class="field-hint">${this.t('reference.form.fallbackHint')}</p>
          </div>
        </div>
        ${this.renderScenarioModeGroup('surface')}
        ${this.renderScenarioModeGroup('submerged')}
        <div class="form-actions">
          <button type="button" class="btn btn-accent" @click=${this._saveScenario}>
            ${this.t('reference.save')}
          </button>
          <button type="button" class="btn" @click=${() => (this.editing = null)}>
            ${this.t('reference.cancel')}
          </button>
        </div>
      </div>
    `
  }

  private renderScenarioCard(sc: Scenario) {
    const mode = this.modeOf[sc.id] ?? 'surface'
    const m = sc[mode]
    return html`
      <div class="panel scenario">
        <div class="scenario-head">
          <h3 class="scenario-title">${locText(sc.title, this.locale)}</h3>
          <div class="row-actions">
            <button type="button" class="icon-btn" aria-label=${this.t('reference.scenario.formTitleEdit')} @click=${() => this._openScenario(sc)}>
              ${editIcon}
            </button>
            <button type="button" class="icon-btn danger" aria-label=${this.t('reference.confirmDelete')} @click=${() => this._deleteScenario(sc.id)}>
              ${trashIcon}
            </button>
          </div>
        </div>
        <div class="field mode-field">
          <span class="field-label">${this.t('reference.scenario.modeLabel')}</span>
          <div class="segment" role="radiogroup">
            <label>
              <input type="radio" name="mode-${sc.id}" ?checked=${mode === 'surface'} @change=${() => this._onMode(sc, 'surface')} />
              <span>${this.t('reference.scenario.modeSurf')}</span>
            </label>
            <label>
              <input type="radio" name="mode-${sc.id}" ?checked=${mode === 'submerged'} @change=${() => this._onMode(sc, 'submerged')} />
              <span>${this.t('reference.scenario.modeSub')}</span>
            </label>
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <span class="stat-k">${this.t('reference.scenario.recommendation')}</span>
            <span class="stat-v">${locText(m.recommendation, this.locale)}</span>
          </div>
          <div class="stat">
            <span class="stat-k">${this.t('reference.scenario.detection')}</span>
            <span class="stat-v">${locText(m.detection, this.locale)}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>${locText(m.leftCaption, this.locale)}</th>
              <th class="num">${locText(m.rightCaption, this.locale)}</th>
            </tr>
          </thead>
          <tbody>
            ${m.rows.map(
              r => html`
                <tr>
                  <td>${locText(r.label, this.locale)}</td>
                  <td class="num">${r.value}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `
  }

  private renderScenarios() {
    const scenarios = getScenarios()
    return html`
      <section>
        <div class="section-head">
          <h2 class="panel-title">${this.t('reference.scenario.title')}</h2>
          <button type="button" class="btn btn-accent" @click=${() => this._openScenario('new')}>
            + ${this.t('reference.scenario.add')}
          </button>
        </div>
        ${scenarios.length === 0
          ? html`<div class="panel"><p class="empty">${this.t('reference.scenario.empty')}</p></div>`
          : html`<div class="scenario-grid">${scenarios.map(sc => this.renderScenarioCard(sc))}</div>`}
      </section>
      ${this.editing?.kind === 'scenario' ? this.renderScenarioForm() : nothing}
    `
  }

  private renderNotes() {
    const notes = getNotes()
    return html`
      <section class="panel">
        <div class="section-head">
          <h2 class="panel-title">${this.t('reference.notes.title')}</h2>
          <button type="button" class="btn btn-accent" @click=${() => this._openNote('new')}>
            + ${this.t('reference.notes.add')}
          </button>
        </div>
        ${notes.length === 0
          ? html`<p class="empty">${this.t('reference.notes.empty')}</p>`
          : html`
              <div class="note-grid">
                ${notes.map(
                  n => html`
                    <div class="note-card">
                      <div class="note-head">
                        <span class="note-cat">${this.t(`reference.notes.category${this._catKey(n.category)}`)}</span>
                        <div class="row-actions">
                          <button type="button" class="icon-btn" @click=${() => this._openNote(n)}>
                            ${editIcon}
                          </button>
                          <button type="button" class="icon-btn danger" @click=${() => this._deleteNote(n.id)}>
                            ${trashIcon}
                          </button>
                        </div>
                      </div>
                      <h3 class="note-title">${n.title || '—'}</h3>
                      <p class="note-body">${n.body}</p>
                    </div>
                  `,
                )}
              </div>
            `}
        ${this.editing?.kind === 'note' ? this.renderNoteForm() : nothing}
      </section>
    `
  }

  private _catKey(category: string): string {
    if (category === 'tdc') return 'Tdc'
    if (category === 'identification') return 'Identification'
    return 'General'
  }

  private renderNoteForm() {
    const d = (this.editing as { kind: 'note'; draft: Note }).draft
    return html`
      <div class="editor">
        <h3>
          ${d.id ? this.t('reference.notes.formTitleEdit') : this.t('reference.notes.formTitleNew')}
        </h3>
        <div class="form-grid">
          <div class="field">
            <label class="field-label">${this.t('reference.notes.category')}</label>
            <select @change=${(e: Event) => this._noteField('category', (e.target as HTMLSelectElement).value)}>
              ${NOTE_CATEGORIES.map(
                c => html`
                  <option value=${c} ?selected=${d.category === c}>
                    ${this.t(`reference.notes.category${this._catKey(c)}`)}
                  </option>
                `,
              )}
            </select>
          </div>
          <div class="field">
            <label class="field-label">${this.t('reference.notes.titleLabel')}</label>
            <input type="text" .value=${d.title} @input=${(e: Event) => this._noteField('title', (e.target as HTMLInputElement).value)} />
          </div>
        </div>
        <div class="field">
          <label class="field-label">${this.t('reference.notes.body')}</label>
          <textarea rows="4" .value=${d.body} @input=${(e: Event) => this._noteField('body', (e.target as HTMLTextAreaElement).value)}></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-accent" @click=${this._saveNote}>
            ${this.t('reference.save')}
          </button>
          <button type="button" class="btn" @click=${() => (this.editing = null)}>
            ${this.t('reference.cancel')}
          </button>
        </div>
      </div>
    `
  }

  private renderCalcs() {
    const calcs = getCalcs()
    return html`
      <section class="panel">
        <div class="section-head">
          <h2 class="panel-title">${this.t('reference.calcs.title')}</h2>
          <div class="row-actions">
            <button type="button" class="btn btn-accent" @click=${() => this._openCalc('')}>
              ${this.t('reference.calcs.add')}
            </button>
          </div>
        </div>
        <p class="hint">${this.t('reference.calcs.hint')}</p>
        ${calcs.length === 0
          ? html`<p class="hint">${this.t('reference.calcs.empty')}</p>`
          : html`
              <div class="calc-grid">
                ${calcs.map(calc => {
                  const name = locText(calc.title, this.locale) || calc.id
                  const editingThis = this.editing?.kind === 'calc' && this.editing.draft.id === calc.id
                  return html`
                    <div class="calc-card">
                      <div class="scenario-head">
                        <h3 class="scenario-title">${name}</h3>
                        <div class="row-actions">
                          <button
                            type="button"
                            class="btn"
                            ?disabled=${editingThis}
                            @click=${() => this._openCalc(calc.id)}
                          >
                            ${this.t('reference.calcs.edit')}
                          </button>
                          <button type="button" class="btn btn-danger" @click=${() => this._deleteCalc(calc.id)}>
                            ${this.t('reference.calcs.delete')}
                          </button>
                        </div>
                      </div>
                      <div class="calc-formulas">
                        ${calc.formulas.map(f => {
                          const flabel = f.label ? locText(f.label, this.locale) : f.id
                          return html`
                            <div class="calc-formula">
                              <span class="calc-label">${flabel}</span>
                              <code class="calc-expr">${f.expr}</code>
                            </div>
                          `
                        })}
                      </div>
                      <p class="calc-vars">
                        <b>${this.t('reference.calcs.varsTitle')}:</b>
                        ${calc.controls
                          .flatMap(c => (c.kind === 'number' || c.kind === 'select' ? [c.name] : []))
                          .join(', ') || '—'}
                      </p>
                    </div>
                  `
                })}
              </div>
            `}
        ${this.editing?.kind === 'calc' ? this.renderCalcForm() : nothing}
      </section>
    `
  }

  private renderCalcForm() {
    const d = (this.editing as { kind: 'calc'; draft: CalculatorConfig }).draft
    const label = d.title.ru || d.title.en || this.t('reference.calcs.formTitleNew')
    return html`
      <div class="editor">
        <h3>${label}</h3>
        <tdc-calc-editor
          .config=${d}
          @calc-save=${(e: Event) => this._onCalcSaved(e)}
          @calc-cancel=${this._onCalcCancel}
        ></tdc-calc-editor>
      </div>
    `
  }

  private renderIdent() {
    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('reference.ident.title')}</h2>
        <p class="intro">${IDENTIFICATION_INTRO[this.locale]}</p>
        ${IDENTIFICATION_METHODS.map(
          m => html`
            <div class="method">
              <h3>${m.title[this.locale]}</h3>
              ${m.blocks
                ? html`
                    <div class="blocks">
                      ${m.blocks.map(
                        b => html`
                          <div class="block">
                            <div class="block-term">
                              ${this.locale === 'ru'
                                ? html`${b.termEn} <span>· ${b.termRu}</span>`
                                : b.termEn}
                            </div>
                            <div class="pills">
                              ${b.options.map(
                                o =>
                                  this.locale === 'ru'
                                    ? html`<span class="pill"><b>${o.en}</b> — ${o.ru}</span>`
                                    : html`<span class="pill"><b>${o.en}</b></span>`,
                              )}
                            </div>
                          </div>
                        `,
                      )}
                    </div>
                  `
                : ''}
              ${m.note ? html`<p class="note">${m.note[this.locale]}</p>` : ''}
            </div>
          `,
        )}
      </section>
    `
  }

  render() {
    return html`
      ${this.renderToolbar()}
      ${this.renderShips()}
      ${this.renderScenarios()}
      ${this.renderNotes()}
      ${this.renderCalcs()}
      ${this.renderIdent()}
    `
  }

  static styles = [
    formStyles,
    segmentStyles,
    tableStyles,
    css`
      :host {
        display: block;
      }

      .ship-name {
        font-weight: 600;
      }

      .ship-en {
        font-size: 11.5px;
        color: var(--text-dim);
        margin-top: 2px;
      }

      .field-wide {
        grid-column: 1 / -1;
      }

      .field-hint {
        margin: 6px 0 0;
        font-size: 11.5px;
        line-height: 1.45;
        color: var(--text-dim);
      }

      .rows-hint {
        margin: 12px 0 0;
        font-size: 11.5px;
        line-height: 1.45;
        color: var(--text-dim);
      }

      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .section-head .panel-title {
        margin: 0;
      }

      .empty {
        margin: 0;
        font-size: 13px;
        color: var(--text-dim);
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: center;
      }

      .toolbar-hint {
        margin: 0;
        flex: 1 1 220px;
        font-size: 12.5px;
        color: var(--text-dim);
      }

      .toolbar-btns {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .file-input {
        display: none;
      }

      .toast {
        width: 100%;
        margin: 0;
        padding: 10px 14px;
        border: 1px solid var(--accent-border);
        border-radius: 8px;
        background: var(--accent-dim);
        font-size: 13px;
        color: var(--text);
      }

      .btn {
        appearance: none;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
        color: var(--text);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 14px;
        cursor: pointer;
        transition:
          border-color 0.15s,
          background 0.15s;
      }

      .btn:hover {
        border-color: var(--accent-border);
      }

      .btn-accent {
        background: var(--accent-dim);
        color: var(--accent);
        border-color: var(--accent-border);
      }

      .btn-accent:hover {
        background: rgba(63, 217, 199, 0.2);
      }

      .btn-danger {
        color: #e58a8a;
        border-color: rgba(229, 138, 138, 0.4);
      }

      .btn-danger:hover {
        background: rgba(229, 138, 138, 0.1);
      }

      .th-actions {
        width: 64px;
      }

      .row-actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }

      .icon-btn {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--panel-2);
        color: var(--text-dim);
        cursor: pointer;
        transition:
          color 0.15s,
          border-color 0.15s;
      }

      .icon-btn:hover {
        color: var(--accent);
        border-color: var(--accent-border);
      }

      .icon-btn.danger:hover {
        color: #e58a8a;
        border-color: rgba(229, 138, 138, 0.5);
      }

      .editor {
        margin-top: 16px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel-2);
      }

      .editor h3 {
        margin: 0 0 14px;
        font-size: 14.5px;
        font-weight: 650;
        color: var(--text);
      }

      .form-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .check {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 14px;
        font-size: 14px;
        color: var(--text);
        cursor: pointer;
      }

      .check input {
        accent-color: var(--accent);
        width: 16px;
        height: 16px;
      }

      .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }

      .scenario .panel-title {
        margin-bottom: 10px;
      }

      .scenario-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .scenario-title {
        margin: 0 0 12px;
        font-size: 13.5px;
        font-weight: 650;
        color: var(--accent);
      }

      .mode-field {
        margin-bottom: 12px;
      }

      .stats {
        display: grid;
        gap: 10px;
        margin-bottom: 14px;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
      }

      .stat-k {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-dim);
      }

      .stat-v {
        font-family: var(--mono);
        font-size: 15px;
        color: var(--text);
      }

      .mode-group {
        margin-top: 14px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel);
      }

      .mode-group h4 {
        margin: 0 0 12px;
        font-size: 12px;
        font-weight: 650;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-dim);
      }

      .rows-editor {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }

      .row-line {
        display: grid;
        grid-template-columns: 1fr 1.4fr auto;
        gap: 8px;
        align-items: center;
      }

      .row-line input {
        width: 100%;
        box-sizing: border-box;
        background: #0a1422;
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 7px;
        padding: 7px 10px;
        font: inherit;
        font-size: 13px;
      }

      .row-line input:focus {
        outline: none;
        border-color: var(--accent);
      }

      .note-grid {
        display: grid;
        gap: 12px;
      }

      .note-card {
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel-2);
      }

      .note-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }

      .note-cat {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--accent);
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid var(--accent-border);
        background: var(--accent-dim);
      }

      .note-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 650;
        color: var(--text);
      }

      .note-body {
        margin: 0;
        font-size: 13px;
        color: var(--text-dim);
        white-space: pre-wrap;
      }

      textarea {
        width: 100%;
        box-sizing: border-box;
        background: #0a1422;
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 10px 12px;
        font: inherit;
        font-size: 14px;
        resize: vertical;
      }

      textarea:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-dim);
      }

      .intro {
        margin: 0 0 18px;
        font-size: 13.5px;
        color: var(--text);
      }

      .method {
        padding: 14px 0;
        border-top: 1px solid var(--border);
      }

      .method h3 {
        margin: 0 0 10px;
        font-size: 14.5px;
        font-weight: 650;
        color: var(--text);
      }

      .blocks {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
        gap: 12px;
      }

      .block {
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
      }

      .block-term {
        font-family: var(--mono);
        font-size: 13px;
        color: var(--text);
        margin-bottom: 8px;
      }

      .block-term span {
        font-family: inherit;
        color: var(--text-dim);
      }

      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .pill {
        font-size: 12.5px;
        color: var(--text-dim);
        padding: 4px 9px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--panel);
      }

      .pill b {
        font-family: var(--mono);
        color: var(--accent);
        font-weight: 600;
      }

      .note {
        margin: 12px 0 0;
        font-size: 13px;
        color: var(--text-dim);
      }

      .calc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
        margin-top: 14px;
      }

      .calc-card {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel);
        padding: 14px;
      }

      .calc-formulas {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
      }

      .calc-formula {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        font-size: 13px;
      }

      .calc-label {
        color: var(--text-dim);
      }

      .calc-expr {
        font-family: var(--mono);
        color: var(--accent);
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 2px 7px;
        white-space: nowrap;
      }

      .calc-vars {
        margin: 12px 0 0;
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--text-dim);
      }

      .calc-vars b {
        color: var(--text);
        font-weight: 600;
      }

      .calc-error {
        margin-top: 4px;
        font-size: 11.5px;
        color: #ff7a7a;
      }

      .mono-input {
        font-family: var(--mono);
        font-size: 13px;
      }

      .calc-help {
        margin-top: 10px;
        padding: 10px 12px;
        border: 1px dashed var(--accent-border);
        border-radius: 8px;
        background: var(--accent-dim);
        font-size: 12.5px;
        line-height: 1.55;
        color: var(--text-dim);
      }

      .calc-help h4 {
        margin: 0 0 4px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent);
      }

      @media (max-width: 640px) {
        .row-line {
          grid-template-columns: 1fr auto;
        }

        .row-line .row-wide {
          grid-column: 1 / -1;
        }
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-reference-panel': ReferencePanel
  }
}