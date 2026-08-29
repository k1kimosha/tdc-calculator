/**
 * Редактор калькулятора: правка заголовка, контролов (number/select/ships/
 * liveTable) и формул; эмитит события calc-save / calc-cancel (используется
 * в Справочнике).
 */
import { css, html, nothing, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  type CalcControl,
  type CalcFormula,
  type CalcLiveTableControl,
  type CalcSelectControl,
  type CalculatorConfig,
} from '../core/tdc-data.js'
import { newId } from '../core/tdc-store.js'
import { validateFormula } from '../core/formula-engine.js'
import { I18nElement } from '../core/i18n.js'
import { formStyles } from '../styles/shared-styles.js'

type Locale = 'ru' | 'en'

@customElement('tdc-calc-editor')
export class CalcEditor extends I18nElement {
  @property({ attribute: false }) config: CalculatorConfig | null = null

  @state() private draft: CalculatorConfig | null = null
  @state() private ctrlType = 'number'

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed)
    if (changed.has('config') && this.config) {
      this.draft = this.clone(this.config)
      this.ctrlType = 'number'
    }
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
  }

  private patch(p: Partial<CalculatorConfig>) {
    if (!this.draft) return
    this.draft = { ...this.draft, ...p }
  }

  private _save() {
    if (!this.draft || !this.valid) return
    this.dispatchEvent(new CustomEvent('calc-save', { detail: this.clone(this.draft), bubbles: true, composed: true }))
  }

  private _cancel() {
    this.dispatchEvent(new CustomEvent('calc-cancel', { bubbles: true, composed: true }))
  }

  private get valid(): boolean {
    return !!this.draft && (this.draft.title.ru.trim() !== '' || this.draft.title.en.trim() !== '')
  }

  private field(key: string, value: string, onInput: (v: string) => void, wide = false) {
    return html`
      <div class="field ${wide ? 'field-wide' : ''}">
        <label class="field-label">${this.t(key)}</label>
        <input
          type="text"
          .value=${value}
          @input=${(e: Event) => onInput((e.target as HTMLInputElement).value)}
        />
      </div>
    `
  }

  private _title(side: Locale, v: string) {
    if (!this.draft) return
    this.patch({ title: { ...this.draft.title, [side]: v } })
  }

  private _hint(side: Locale, v: string) {
    if (!this.draft) return
    const hint = this.draft.hint ? { ...this.draft.hint, [side]: v } : ({ ru: '', en: '', [side]: v } as Record<Locale, string>)
    this.patch({ hint: hint as CalculatorConfig['hint'] })
  }

  private _ctrlPatch(idx: number, patch: Partial<CalcControl>) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => (i === idx ? ({ ...c, ...patch } as CalcControl) : c))
    this.patch({ controls })
  }

  private _ctrlRemove(idx: number) {
    if (!this.draft) return
    this.patch({ controls: this.draft.controls.filter((_, i) => i !== idx) })
  }

  private _ctrlAdd(kind: string) {
    if (!this.draft) return
    const base: CalcControl =
      kind === 'select'
        ? { kind: 'select', id: newId('c'), label: { ru: '', en: '' }, name: 'x', options: [], defaultId: '' }
        : kind === 'ships'
          ? { kind: 'ships', id: newId('c'), label: { ru: '', en: '' } }
          : kind === 'liveTable'
            ? { kind: 'liveTable', id: newId('c'), label: { ru: '', en: '' }, valueLabel: { ru: '', en: '' }, rows: [] }
            : { kind: 'number', id: newId('c'), label: { ru: '', en: '' }, name: 'x', default: 0 }
    this.patch({ controls: [...this.draft.controls, base] })
  }

  private _optPatch(ci: number, oi: number, patch: Partial<CalcSelectControl['options'][number]>) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => {
      if (i !== ci || c.kind !== 'select') return c
      const options = c.options.map((o, j) => (j === oi ? { ...o, ...patch } : o))
      return { ...c, options }
    })
    this.patch({ controls })
  }

  private _optRemove(ci: number, oi: number) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => {
      if (i !== ci || c.kind !== 'select') return c
      return { ...c, options: c.options.filter((_, j) => j !== oi) }
    })
    this.patch({ controls })
  }

  private _optAdd(ci: number) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => {
      if (i !== ci || c.kind !== 'select') return c
      return { ...c, options: [...c.options, { id: newId('o'), label: { ru: '', en: '' }, value: '' }] }
    })
    this.patch({ controls })
  }

  private _rowPatch(ci: number, ri: number, patch: Partial<CalcLiveTableControl['rows'][number]>) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => {
      if (i !== ci || c.kind !== 'liveTable') return c
      const rows = c.rows.map((r, j) => (j === ri ? { ...r, ...patch } : r))
      return { ...c, rows }
    })
    this.patch({ controls })
  }

  private _rowRemove(ci: number, ri: number) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => {
      if (i !== ci || c.kind !== 'liveTable') return c
      return { ...c, rows: c.rows.filter((_, j) => j !== ri) }
    })
    this.patch({ controls })
  }

  private _rowAdd(ci: number) {
    if (!this.draft) return
    const controls = this.draft.controls.map((c, i) => {
      if (i !== ci || c.kind !== 'liveTable') return c
      return { ...c, rows: [...c.rows, { label: { ru: '', en: '' }, expr: '' }] }
    })
    this.patch({ controls })
  }

  private _formulaPatch(idx: number, patch: Partial<CalcFormula>) {
    if (!this.draft) return
    this.patch({ formulas: this.draft.formulas.map((f, i) => (i === idx ? { ...f, ...patch } : f)) })
  }

  private _formulaRemove(idx: number) {
    if (!this.draft) return
    this.patch({ formulas: this.draft.formulas.filter((_, i) => i !== idx) })
  }

  private _formulaAdd() {
    if (!this.draft) return
    this.patch({ formulas: [...this.draft.formulas, { id: newId('f'), expr: '' }] })
  }

  private ctrlKindName(kind: string): string {
    const map: Record<string, string> = {
      number: 'reference.calcs.controlNumber',
      select: 'reference.calcs.controlSelect',
      ships: 'reference.calcs.controlShips',
      liveTable: 'reference.calcs.controlLiveTable',
    }
    return this.t(map[kind] ?? map.number)
  }

  private renderFormula(f: CalcFormula, idx: number) {
    const err = validateFormula(f.expr)
    return html`
      <div class="ctrl-card">
        <div class="ctrl-head">
          <span class="ctrl-kind">${this.t('reference.calcs.formulaId')} · ${f.id}</span>
          <button class="icon-btn danger" title=${this.t('reference.calcs.delete')} @click=${() => this._formulaRemove(idx)}>×</button>
        </div>
        <div class="form-grid">
          ${this.field('reference.calcs.expr', f.expr, v => this._formulaPatch(idx, { expr: v }), true)}
          ${this.field('reference.calcs.labelRu', f.label?.ru ?? '', v => this._formulaPatch(idx, { label: { ru: v, en: f.label?.en ?? '' } }))}
          ${this.field('reference.calcs.labelEn', f.label?.en ?? '', v => this._formulaPatch(idx, { label: { ru: f.label?.ru ?? '', en: v } }))}
          ${this.field('reference.calcs.unitRu', f.unit?.ru ?? '', v => this._formulaPatch(idx, { unit: { ru: v, en: f.unit?.en ?? '' } }))}
          ${this.field('reference.calcs.unitEn', f.unit?.en ?? '', v => this._formulaPatch(idx, { unit: { ru: f.unit?.ru ?? '', en: v } }))}
        </div>
        ${err ? html`<p class="calc-error">${this.t('reference.calcs.invalid', { error: err })}</p>` : nothing}
      </div>
    `
  }

  private renderSelect(c: Extract<CalcControl, { kind: 'select' }>, idx: number) {
    return html`
      <div class="ctrl-card">
        <div class="ctrl-head">
          <span class="ctrl-kind">${this.ctrlKindName(c.kind)}</span>
          <button class="icon-btn danger" title=${this.t('reference.calcs.delete')} @click=${() => this._ctrlRemove(idx)}>×</button>
        </div>
        <div class="form-grid">
          ${this.field('reference.calcs.labelRu', c.label.ru, v => this._ctrlPatch(idx, { label: { ru: v, en: c.label.en } }))}
          ${this.field('reference.calcs.labelEn', c.label.en, v => this._ctrlPatch(idx, { label: { ru: c.label.ru, en: v } }))}
          ${this.field('reference.calcs.varName', c.name, v => this._ctrlPatch(idx, { name: v }))}
          <div class="field">
            <label class="field-label">${this.t('reference.calcs.defaultOption')}</label>
            <select
              .value=${c.defaultId}
              @change=${(e: Event) => this._ctrlPatch(idx, { defaultId: (e.target as HTMLSelectElement).value })}
            >
              <option value="">—</option>
              ${c.options.map(o => html`<option value=${o.id}>${o.label.ru || o.label.en || o.id}</option>`)}
            </select>
          </div>
        </div>
        <div class="option-block">
          <div class="option-block-head">
            <h5>${this.t('reference.calcs.options')}</h5>
            <button class="btn" @click=${() => this._optAdd(idx)}>${this.t('reference.calcs.optionAdd')}</button>
          </div>
          ${c.options.length
            ? c.options.map(
                (o, oi) => html`
                  <div class="option-row">
                    <input
                      type="text"
                      placeholder=${this.t('reference.calcs.labelRu')}
                      .value=${o.label.ru}
                      @input=${(e: Event) => this._optPatch(idx, oi, { label: { ru: (e.target as HTMLInputElement).value, en: o.label.en } })}
                    />
                    <input
                      type="text"
                      placeholder=${this.t('reference.calcs.labelEn')}
                      .value=${o.label.en}
                      @input=${(e: Event) => this._optPatch(idx, oi, { label: { ru: o.label.ru, en: (e.target as HTMLInputElement).value } })}
                    />
                    <input
                      type="text"
                      placeholder=${this.t('reference.calcs.optionValue')}
                      .value=${String(o.value ?? '')}
                      @input=${(e: Event) => this._optPatch(idx, oi, { value: (e.target as HTMLInputElement).value })}
                    />
                    <button class="icon-btn danger" title=${this.t('reference.calcs.delete')} @click=${() => this._optRemove(idx, oi)}>×</button>
                  </div>
                `,
              )
            : html`<p class="hint">${this.t('reference.calcs.noOptions')}</p>`}
        </div>
      </div>
    `
  }

  private renderLiveTable(c: CalcLiveTableControl, idx: number) {
    return html`
      <div class="ctrl-card">
        <div class="ctrl-head">
          <span class="ctrl-kind">${this.ctrlKindName(c.kind)}</span>
          <button class="icon-btn danger" title=${this.t('reference.calcs.delete')} @click=${() => this._ctrlRemove(idx)}>×</button>
        </div>
        <div class="form-grid">
          ${this.field('reference.calcs.labelRu', c.label.ru, v => this._ctrlPatch(idx, { label: { ru: v, en: c.label.en } }))}
          ${this.field('reference.calcs.labelEn', c.label.en, v => this._ctrlPatch(idx, { label: { ru: c.label.ru, en: v } }))}
          ${this.field('reference.calcs.rowLabelRu', c.rowLabel?.ru ?? '', v => this._ctrlPatch(idx, { rowLabel: { ru: v, en: c.rowLabel?.en ?? '' } }))}
          ${this.field('reference.calcs.rowLabelEn', c.rowLabel?.en ?? '', v => this._ctrlPatch(idx, { rowLabel: { ru: c.rowLabel?.ru ?? '', en: v } }))}
          ${this.field('reference.calcs.valueLabelRu', c.valueLabel.ru, v => this._ctrlPatch(idx, { valueLabel: { ru: v, en: c.valueLabel.en } }))}
          ${this.field('reference.calcs.valueLabelEn', c.valueLabel.en, v => this._ctrlPatch(idx, { valueLabel: { ru: c.valueLabel.ru, en: v } }))}
        </div>
        <div class="option-block">
          <div class="option-block-head">
            <h5>${this.t('reference.calcs.rows')}</h5>
            <button class="btn" @click=${() => this._rowAdd(idx)}>${this.t('reference.calcs.rowAdd')}</button>
          </div>
          ${c.rows.length
            ? c.rows.map(
                (r, ri) => html`
                  <div class="option-row">
                    <input
                      type="text"
                      placeholder=${this.t('reference.calcs.labelRu')}
                      .value=${r.label.ru}
                      @input=${(e: Event) => this._rowPatch(idx, ri, { label: { ru: (e.target as HTMLInputElement).value, en: r.label.en } })}
                    />
                    <input
                      type="text"
                      placeholder=${this.t('reference.calcs.labelEn')}
                      .value=${r.label.en}
                      @input=${(e: Event) => this._rowPatch(idx, ri, { label: { ru: r.label.ru, en: (e.target as HTMLInputElement).value } })}
                    />
                    <input
                      type="text"
                      placeholder=${this.t('reference.calcs.expr')}
                      .value=${r.expr}
                      @input=${(e: Event) => this._rowPatch(idx, ri, { expr: (e.target as HTMLInputElement).value })}
                    />
                    <button class="icon-btn danger" title=${this.t('reference.calcs.delete')} @click=${() => this._rowRemove(idx, ri)}>×</button>
                  </div>
                `,
              )
            : html`<p class="hint">${this.t('reference.calcs.noRows')}</p>`}
        </div>
      </div>
    `
  }

  private renderCtrl(c: CalcControl, idx: number): unknown {
    if (c.kind === 'select') return this.renderSelect(c, idx)
    if (c.kind === 'liveTable') return this.renderLiveTable(c, idx)
    if (c.kind === 'number' || c.kind === 'ships') {
      const common = html`
        <div class="ctrl-card">
          <div class="ctrl-head">
            <span class="ctrl-kind">${this.ctrlKindName(c.kind)}</span>
            <button class="icon-btn danger" title=${this.t('reference.calcs.delete')} @click=${() => this._ctrlRemove(idx)}>×</button>
          </div>
          <div class="form-grid">
            ${this.field('reference.calcs.labelRu', c.label.ru, v => this._ctrlPatch(idx, { label: { ru: v, en: c.label.en } }))}
            ${this.field('reference.calcs.labelEn', c.label.en, v => this._ctrlPatch(idx, { label: { ru: c.label.ru, en: v } }))}
            ${c.kind === 'number'
              ? html`
                  ${this.field('reference.calcs.varName', c.name, v => this._ctrlPatch(idx, { name: v }))}
                  <div class="field">
                    <label class="field-label">${this.t('reference.calcs.default')}</label>
                    <input
                      type="number"
                      step="any"
                      .value=${String(c.default ?? 0)}
                      @input=${(e: Event) => this._ctrlPatch(idx, { default: Number((e.target as HTMLInputElement).value) })}
                    />
                  </div>
                  ${this.field('reference.calcs.unitRu', c.unit?.ru ?? '', v => this._ctrlPatch(idx, { unit: { ru: v, en: c.unit?.en ?? '' } }))}
                  ${this.field('reference.calcs.unitEn', c.unit?.en ?? '', v => this._ctrlPatch(idx, { unit: { ru: c.unit?.ru ?? '', en: v } }))}
                `
              : html`
                  ${this.field('reference.calcs.bindLength', c.bindLength ?? '', v => this._ctrlPatch(idx, { bindLength: v }))}
                  ${this.field('reference.calcs.bindMast', c.bindMast ?? '', v => this._ctrlPatch(idx, { bindMast: v }))}
                  ${this.field('reference.calcs.bindFunnel', c.bindFunnel ?? '', v => this._ctrlPatch(idx, { bindFunnel: v }))}
                  ${this.field('reference.calcs.landmarkVar', c.landmarkVar ?? '', v => this._ctrlPatch(idx, { landmarkVar: v }))}
                `}
          </div>
        </div>
      `
      return common
    }
    return nothing
  }

  render() {
    const draft = this.draft
    if (!draft) return nothing
    return html`
      <div class="editor">
        <div class="form-grid">
          ${this.field('reference.calcs.nameRu', draft.title.ru, v => this._title('ru', v))}
          ${this.field('reference.calcs.nameEn', draft.title.en, v => this._title('en', v))}
          ${this.field('reference.calcs.hintRu', draft.hint?.ru ?? '', v => this._hint('ru', v), true)}
          ${this.field('reference.calcs.hintEn', draft.hint?.en ?? '', v => this._hint('en', v), true)}
        </div>

        <div class="editor-block">
          <div class="editor-block-head">
            <h4>${this.t('reference.calcs.controlsTitle')}</h4>
            <div class="row-actions">
              <select class="add-select" .value=${this.ctrlType} @change=${(e: Event) => (this.ctrlType = (e.target as HTMLSelectElement).value)}>
                <option value="number">${this.t('reference.calcs.controlNumber')}</option>
                <option value="select">${this.t('reference.calcs.controlSelect')}</option>
                <option value="ships">${this.t('reference.calcs.controlShips')}</option>
                <option value="liveTable">${this.t('reference.calcs.controlLiveTable')}</option>
              </select>
              <button class="btn btn-accent" @click=${() => this._ctrlAdd(this.ctrlType)}>${this.t('reference.calcs.controlAdd')}</button>
            </div>
          </div>
          ${draft.controls.length
            ? draft.controls.map((c, i) => this.renderCtrl(c, i))
            : html`<p class="hint">${this.t('reference.calcs.noControls')}</p>`}
        </div>

        <div class="editor-block">
          <div class="editor-block-head">
            <h4>${this.t('reference.calcs.formulasTitle')}</h4>
            <button class="btn btn-accent" @click=${this._formulaAdd}>${this.t('reference.calcs.formulaAdd')}</button>
          </div>
          ${draft.formulas.length
            ? draft.formulas.map((f, i) => this.renderFormula(f, i))
            : html`<p class="hint">${this.t('reference.calcs.noFormulas')}</p>`}
        </div>

        <div class="form-actions">
          <button class="btn btn-accent" ?disabled=${!this.valid} @click=${this._save}>${this.t('reference.save')}</button>
          <button class="btn" @click=${this._cancel}>${this.t('reference.cancel')}</button>
        </div>
      </div>
    `
  }

  static styles = [
    formStyles,
    css`
      :host {
        display: block;
      }

      .editor {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .field-wide {
        grid-column: 1 / -1;
      }

      .editor-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .editor-block-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .editor-block-head h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 650;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--accent);
      }

      .ctrl-card {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel-2);
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ctrl-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .ctrl-kind {
        font-family: var(--mono);
        font-size: 11.5px;
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .option-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-top: 1px dashed var(--border);
        padding-top: 12px;
      }

      .option-block-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .option-block-head h5 {
        margin: 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-dim);
      }

      .option-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 8px;
      }

      .option-row input {
        padding: 6px 8px;
        font-size: 13px;
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
        font-size: 15px;
        line-height: 1;
        flex-shrink: 0;
      }

      .icon-btn.danger {
        color: #e58a8a;
        border-color: rgba(229, 138, 138, 0.4);
      }

      .icon-btn.danger:hover {
        background: rgba(229, 138, 138, 0.1);
      }

      .add-select {
        width: auto;
        padding: 8px 10px;
        font-size: 13px;
      }

      .btn {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 14px;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        color: var(--text);
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
      }

      .btn:hover {
        border-color: var(--accent-border);
      }

      .btn:disabled {
        opacity: 0.45;
        cursor: default;
      }

      .btn-accent {
        background: var(--accent-dim);
        color: var(--accent);
        border-color: var(--accent-border);
      }

      .btn-accent:hover {
        background: rgba(63, 217, 199, 0.2);
      }

      .calc-error {
        font-family: var(--mono);
        font-size: 12px;
        color: #e58a8a;
      }

      @media (max-width: 640px) {
        .option-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-calc-editor': CalcEditor
  }
}