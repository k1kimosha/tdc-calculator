/**
 * Живой калькулятор: рендерит контролы конфигурации, пересчитывает формулы
 * по мере ввода, фиксирует выстрелы в журнал похода (см. snapshot-utils).
 */
import { css, html, nothing, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import {
  KNOTS_TO_MS,
  formatNumber,
  locText,
  shipClassName,
  type CalcControl,
  type CalcFormula,
  type CalculatorConfig,
} from '../core/tdc-data.js'
import { getShips, getCalcs } from '../core/tdc-store.js'
import { getActivePatrol, recordShot } from '../core/tdc-log.js'
import { getCalcInputs, setCalcInput } from '../core/calc-inputs.js'
import { buildCalcSnapshots } from '../core/snapshot-utils.js'
import { evaluateFormula } from '../core/formula-engine.js'
import { I18nElement } from '../core/i18n.js'
import { formStyles } from '../styles/shared-styles.js'

interface CalcResult {
  formula: CalcFormula
  value: number | null
  error: string | null
}

@customElement('tdc-calc-panel')
export class CalcPanel extends I18nElement {
  @property({ attribute: false }) config: CalculatorConfig | null = null

  @state() private values: Record<string, string> = {}
  @state() private shipId = ''
  @state() private recorded = false

  private touched = new Set<string>()
  private recordTimer = 0

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed)
    if (changed.has('config')) {
      this.init()
    }
  }

  private init() {
    const config = this.config
    if (!config) return
    const prev = getCalcInputs(config.id)
    const values: Record<string, string> = {}
    for (const c of config.controls) {
      if (c.kind === 'number') {
        values[c.name] = prev[c.name] ?? String(c.default ?? 0)
        setCalcInput(config.id, c.name, values[c.name])
      } else if (c.kind === 'select') {
        const opt = c.options.find(o => o.id === c.defaultId) ?? c.options[0]
        values[c.name] = prev[c.name] ?? (opt ? opt.id : '')
        setCalcInput(config.id, c.name, values[c.name])
      }
    }
    this.values = values
    this.shipId = prev['ship'] ?? ''
    setCalcInput(config.id, 'ship', this.shipId)
    this.touched = new Set()
  }

  private numVars(): Record<string, number> {
    const vars: Record<string, number> = {}
    const controls = this.config?.controls ?? []
    for (const c of controls) {
      if (c.kind === 'number') {
        const n = Number(this.values[c.name])
        if (Number.isFinite(n)) vars[c.name] = n
      } else if (c.kind === 'select') {
        const opt = c.options.find(o => o.id === this.values[c.name])
        if (opt && typeof opt.value === 'number') vars[c.name] = opt.value
      }
    }
    const ship = getShips().find(s => s.id === this.shipId)
    if (ship) {
      for (const c of controls) {
        if (c.kind !== 'ships') continue
        if (c.landmarkVar && (c.bindMast || c.bindFunnel)) {
          const useFunnel = this.values[c.landmarkVar] === 'funnel'
          const target = useFunnel ? (c.bindFunnel ?? c.bindMast) : c.bindMast
          const height = useFunnel ? ship.funnelHeight : ship.mastHeight
          if (target && height > 0 && !this.touched.has(target)) vars[target] = height
          continue
        }
        if (c.bindLength && !this.touched.has(c.bindLength)) vars[c.bindLength] = ship.length
        if (!c.landmarkVar && c.bindMast && !this.touched.has(c.bindMast) && ship.mastHeight > 0) {
          vars[c.bindMast] = ship.mastHeight
        }
        if (!c.landmarkVar && c.bindFunnel && !this.touched.has(c.bindFunnel) && ship.funnelHeight > 0) {
          vars[c.bindFunnel] = ship.funnelHeight
        }
      }
    }
    vars['c'] = KNOTS_TO_MS
    return vars
  }

  private evalExpr(expr: string, vars: Record<string, number>): number | null {
    try {
      const r = evaluateFormula(expr, vars)
      return typeof r === 'number' && Number.isFinite(r) ? r : null
    } catch {
      return null
    }
  }

  private computeResults(): CalcResult[] {
    const config = this.config
    if (!config) return []
    const base = this.numVars()
    const out: CalcResult[] = []
    const feed: Record<string, number> = {}
    for (const f of config.formulas) {
      const ctx: Record<string, number> = { ...base }
      for (const k of Object.keys(feed)) ctx[k] = feed[k]
      let value: number | null = null
      let error: string | null = null
      try {
        const r = evaluateFormula(f.expr, ctx)
        value = typeof r === 'number' && Number.isFinite(r) ? r : null
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }
      out.push({ formula: f, value, error })
      if (value !== null) feed[f.id.toLowerCase()] = value
    }
    return out
  }

  private resultLabel(f: CalcFormula): string {
    return f.label ? locText(f.label, this.locale) : f.id
  }

  private snapshotInputs(): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}
    for (const c of getCalcs()) result[c.id] = getCalcInputs(c.id)
    return result
  }

  private buildSnapshot() {
    return buildCalcSnapshots(getCalcs(), this.snapshotInputs(), this.locale)
  }

  private _shoot() {
    const patrol = getActivePatrol()
    if (!this.config || !patrol) return
    const snapshot = this.buildSnapshot()
    if (snapshot.length === 0) return
    recordShot(snapshot)
    this.recorded = true
    window.clearTimeout(this.recordTimer)
    this.recordTimer = window.setTimeout(() => {
      this.recorded = false
    }, 2000)
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    window.clearTimeout(this.recordTimer)
  }

  private _onNumber(name: string, e: Event) {
    this.touched.add(name)
    this.values = { ...this.values, [name]: (e.target as HTMLInputElement).value }
    if (this.config) setCalcInput(this.config.id, name, this.values[name])
  }

  private _onSelect(name: string, e: Event) {
    this.values = { ...this.values, [name]: (e.target as HTMLSelectElement).value }
    if (this.config) setCalcInput(this.config.id, name, this.values[name])
  }

  private _onShip(e: Event) {
    this.shipId = (e.target as HTMLSelectElement).value
    if (this.config) setCalcInput(this.config.id, 'ship', this.shipId)
  }

  private renderControl(c: CalcControl) {
    switch (c.kind) {
      case 'number':
        return html`
          <div class="field">
            <label class="field-label">${locText(c.label, this.locale)}</label>
            <input
              class="calc-input"
              type="number"
              step="any"
              .value=${this.values[c.name] ?? ''}
              @input=${(e: Event) => this._onNumber(c.name, e)}
            />
          </div>
        `
      case 'select':
        return html`
          <div class="field">
            <label class="field-label">${locText(c.label, this.locale)}</label>
            <select class="select" @change=${(e: Event) => this._onSelect(c.name, e)}>
              ${c.options.map(
                o => html`
                  <option value=${o.id} ?selected=${o.id === this.values[c.name]}>
                    ${locText(o.label, this.locale)}
                  </option>
                `,
              )}
            </select>
          </div>
        `
      case 'ships':
        return html`
          <div class="field">
            <label class="field-label">${locText(c.label, this.locale)}</label>
            <select class="select" @change=${this._onShip}>
              <option value="">—</option>
              ${getShips().map(
                s => html`
                  <option value=${s.id} ?selected=${s.id === this.shipId}>
                    ${shipClassName(s, this.locale)}
                  </option>
                `,
              )}
            </select>
          </div>
        `
      case 'liveTable':
        return html`
          <div class="live-table">
            <h3>${locText(c.label, this.locale)}</h3>
            <table>
              <thead>
                <tr>
                  ${c.rowLabel ? html`<th>${locText(c.rowLabel, this.locale)}</th>` : nothing}
                  <th>${locText(c.valueLabel, this.locale)}</th>
                </tr>
              </thead>
              <tbody>
                ${c.rows.map(row => {
                  const vars = this.numVars()
                  const v = this.evalExpr(row.expr, vars)
                  return html`
                    <tr>
                      <td>${locText(row.label, this.locale)}</td>
                      <td>${v !== null ? formatNumber(v, 2, this.locale) : '—'}</td>
                    </tr>
                  `
                })}
              </tbody>
            </table>
          </div>
        `
      default:
        return nothing
    }
  }

  private renderResult(r: CalcResult) {
    const label = this.resultLabel(r.formula)
    return html`
      <div class="calc-result">
        <div class="calc-result-head">
          <span class="calc-result-label">${label}</span>
          ${r.formula.unit ? html`<span class="calc-result-unit">${locText(r.formula.unit, this.locale)}</span>` : nothing}
          <code class="calc-result-expr">${r.formula.expr}</code>
        </div>
        <div class="calc-result-value">
          ${r.error
            ? html`<span class="calc-error">${this.t('calcs.invalid', { error: r.error })}</span>`
            : r.value !== null
              ? formatNumber(r.value, 2, this.locale)
              : '—'}
        </div>
      </div>
    `
  }

  render() {
    const config = this.config
    if (!config) return nothing
    const results = this.computeResults()
    const patrolActive = getActivePatrol() !== null
    return html`
      <section class="panel">
        <h2 class="panel-title">${locText(config.title, this.locale)}</h2>
        ${config.hint ? html`<p class="hint">${locText(config.hint, this.locale)}</p>` : nothing}
        <div class="calc-grid">${config.controls.map(c => this.renderControl(c))}</div>
        <div class="calc-results">${results.map(r => this.renderResult(r))}</div>
        <div class="record-bar">
          <button
            type="button"
            class="btn btn-accent"
            ?disabled=${!patrolActive}
            @click=${this._shoot}
          >
            ${this.recorded ? this.t('calcs.recorded') : this.t('calcs.recordShot')}
          </button>
          ${patrolActive || this.recorded
            ? nothing
            : html`<span class="record-hint">${this.t('calcs.recordHint')}</span>`}
        </div>
      </section>
    `
  }

  static styles = [
    formStyles,
    css`
      :host {
        display: block;
      }

      .calc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        align-items: start;
      }

      .calc-input {
        width: 100%;
        box-sizing: border-box;
        font-family: var(--mono);
        font-size: 14px;
        color: var(--text);
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 8px 10px;
      }

      .calc-input:focus {
        outline: none;
        border-color: var(--accent);
      }

      .live-table {
        grid-column: 1 / -1;
        margin-top: 4px;
      }

      .live-table h3 {
        margin: 0 0 8px;
        font-size: 14px;
        color: var(--text);
      }

      .live-table table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .live-table th,
      .live-table td {
        text-align: left;
        padding: 6px 10px;
        border-bottom: 1px solid var(--border);
      }

      .live-table thead th {
        color: var(--text-dim);
        font-weight: 500;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .live-table td {
        color: var(--text);
      }

      .live-table td:last-child {
        font-family: var(--mono);
        color: var(--accent);
      }

      .calc-results {
        margin-top: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .calc-result {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 14px;
        background: var(--panel-2);
        border: 1px solid var(--border);
        border-radius: 10px;
      }

      .calc-result-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        min-width: 0;
      }

      .calc-result-label {
        font-size: 14px;
        color: var(--text);
      }

      .calc-result-unit {
        font-size: 12px;
        color: var(--text-dim);
      }

      .calc-result-expr {
        font-family: var(--mono);
        font-size: 11.5px;
        color: var(--text-dim);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .calc-result-value {
        flex-shrink: 0;
        font-family: var(--mono);
        font-size: 17px;
        font-weight: 600;
        color: var(--accent);
      }

      .calc-error {
        font-family: var(--mono);
        font-size: 12px;
        color: #e58a8a;
      }

      .record-bar {
        margin-top: 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .record-hint {
        font-size: 12.5px;
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
        color: var(--text);
      }

      .btn:disabled {
        opacity: 0.45;
        cursor: default;
      }

      .btn-accent {
        background: var(--accent);
        border-color: transparent;
        color: #06121b;
        font-weight: 600;
      }

      .btn-accent:hover {
        background: var(--accent);
        filter: brightness(1.08);
        color: #06121b;
      }

      .btn-accent:disabled {
        background: var(--panel-2);
        border: 1px solid var(--border);
        color: var(--text-dim);
      }

      @media (max-width: 640px) {
        .calc-result {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-calc-panel': CalcPanel
  }
}