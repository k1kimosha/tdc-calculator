import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { formatNumber, shipClassName, type ShipClass } from '../tdc-data.js'
import { compileFormulas, evaluateOrNull } from '../formula-engine.js'
import { getFormulas, getShips } from '../tdc-store.js'
import { I18nElement } from '../i18n.js'
import { formStyles, segmentStyles, tableStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

const AOB_TABLE = [10, 20, 30, 40, 50, 60, 70, 80, 90]

@customElement('tdc-aob-panel')
export class AobPanel extends I18nElement {
  @state() private shipId = 'flavik'
  @state() private lengthText = '62'
  @state() private mode: 'rizki' | 'aob' = 'rizki'
  @state() private side: 'port' | 'starboard' = 'port'
  @state() private rizkiText = '15'
  @state() private distText = '2379'
  @state() private aobText = ''

  private get selectedShip(): ShipClass | undefined {
    return getShips().find(s => s.id === this.shipId)
  }

  private _onShipChange(e: Event) {
    this.shipId = (e.target as HTMLSelectElement).value
    const ship = this.selectedShip
    if (ship) this.lengthText = String(ship.length)
  }

  private _pickAob(aob: number) {
    this.mode = 'aob'
    this.aobText = String(aob)
  }

  render() {
    const L = toNumber(this.lengthText)
    const D = toNumber(this.distText)
    const isRizkiMode = this.mode === 'rizki'
    const rizki = toNumber(this.rizkiText)
    const aobIn = toNumber(this.aobText)
    const { locale } = this

    const formulas = getFormulas('aob')
    const compiled = compileFormulas({
      visRizki: formulas['visRizki'] ?? 'r*d/1000',
      aob: formulas['aob'] ?? 'asin(v/l)*180/pi',
      visAob: formulas['visAob'] ?? 'l*sin(a*pi/180)',
      rizki: formulas['rizki'] ?? 'v*1000/d',
    })
    const visRizkiFn = compiled.fns['visRizki']
    const aobFn = compiled.fns['aob']
    const visAobFn = compiled.fns['visAob']
    const rizkiFn = compiled.fns['rizki']

    let visible: number | null = null
    let aobOut: number | null = null
    let rizkiOut: number | null = null

    if (isRizkiMode) {
      if (D > 0 && rizki > 0) visible = evaluateOrNull(visRizkiFn, { r: rizki, d: D, l: L, v: 0, a: 0 })
      if (L > 0 && visible !== null && visible > 0) aobOut = evaluateOrNull(aobFn, { v: visible, l: L, r: rizki, d: D, a: 0 })
    } else {
      if (L > 0 && aobIn > 0) {
        visible = evaluateOrNull(visAobFn, { a: aobIn, l: L, r: rizki, d: D, v: 0 })
        if (D > 0) rizkiOut = evaluateOrNull(rizkiFn, { v: visible ?? 0, d: D, r: rizki, l: L, a: aobIn })
      }
    }

    const sideLabel =
      locale === 'ru'
        ? this.side === 'starboard'
          ? 'П'
          : 'Л'
        : this.side === 'starboard'
          ? 'S'
          : 'P'
    const aobDisplay = aobOut !== null ? `${formatNumber(aobOut, 1, locale)}° ${sideLabel}` : '—'

    const formula =
      compiled.error
        ? this.t('calcs.invalid', { error: compiled.error })
        : isRizkiMode && (aobOut !== null || visible !== null)
          ? this.t('aob.formula.byVisible', {
            r: formatNumber(rizki, 2, locale),
            d: formatNumber(D, 0, locale),
            v: formatNumber(visible ?? 0, 1, locale),
            l: formatNumber(L, 2, locale),
            a: formatNumber(aobOut ?? 0, 1, locale),
          })
        : !isRizkiMode && (rizkiOut !== null || visible !== null)
          ? this.t('aob.formula.byAob', {
              a: formatNumber(aobIn, 1, locale),
              l: formatNumber(L, 2, locale),
              v: formatNumber(visible ?? 0, 1, locale),
              ri: formatNumber(rizkiOut ?? 0, 1, locale),
              d: formatNumber(D, 0, locale),
            })
          : this.t('aob.formula.empty')

    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('aob.title')}</h2>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="ship">${this.t('aob.ship.label')}</label>
            <select id="ship" @change=${this._onShipChange}>
              <option value="" ?selected=${this.shipId === ''}>${this.t('aob.ship.manual')}</option>
              ${getShips().map(
                s => html`
                  <option value=${s.id} ?selected=${this.shipId === s.id}>${shipClassName(s, locale)}</option>
                `,
              )}
            </select>
            ${this.selectedShip
              ? html`<span class="field-hint">${this.t('aob.ship.hint', { en: this.selectedShip.nameEn, len: this.selectedShip.length })}</span>`
              : html`<span class="field-hint">${this.t('aob.ship.manualHint')}</span>`}
          </div>

          <div class="field">
            <label class="field-label" for="length">${this.t('aob.length.label')}</label>
            <input
              id="length"
              type="number"
              step="1"
              min="0"
              .value=${this.lengthText}
              @input=${(e: Event) => (this.lengthText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('aob.length.hint')}</span>
          </div>

          <div class="field">
            <label class="field-label" for="dist">${this.t('aob.dist.label')}</label>
            <input
              id="dist"
              type="number"
              step="10"
              min="0"
              .value=${this.distText}
              @input=${(e: Event) => (this.distText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('aob.dist.hint')}</span>
          </div>

          <div class="field">
            <span class="field-label">${this.t('aob.side.label')}</span>
            <div class="segment" role="radiogroup" aria-label=${this.t('aob.side.aria')}>
              <label>
                <input
                  type="radio"
                  name="side"
                  value="port"
                  ?checked=${this.side === 'port'}
                  @change=${(e: Event) => (this.side = (e.target as HTMLInputElement).value as 'port')}
                />
                <span>${this.t('aob.side.port')}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="side"
                  value="starboard"
                  ?checked=${this.side === 'starboard'}
                  @change=${(e: Event) => (this.side = (e.target as HTMLInputElement).value as 'starboard')}
                />
                <span>${this.t('aob.side.starboard')}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="field" style="margin-top:16px">
          <span class="field-label">${this.t('aob.mode.label')}</span>
          <div class="segment" role="radiogroup" aria-label=${this.t('aob.mode.aria')}>
            <label>
              <input
                type="radio"
                name="mode"
                value="rizki"
                ?checked=${this.mode === 'rizki'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'rizki')}
              />
              <span>${this.t('aob.mode.byVisible')}</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="aob"
                ?checked=${this.mode === 'aob'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'aob')}
              />
              <span>${this.t('aob.mode.byAob')}</span>
            </label>
          </div>
        </div>

        <div class="form-grid" style="margin-top:14px">
          <div class="field">
            <label class="field-label" for="input">
              ${this.t(isRizkiMode ? 'aob.input.byVisible' : 'aob.input.byAob')}
            </label>
            <input
              id="input"
              type="number"
              step=${isRizkiMode ? '0.1' : '1'}
              min="0"
              .value=${isRizkiMode ? this.rizkiText : this.aobText}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value
                if (isRizkiMode) this.rizkiText = v
                else this.aobText = v
              }}
            />
          </div>
        </div>

        <div class="result">
          <div class="result-caption">${this.t(isRizkiMode ? 'aob.result.byVisible' : 'aob.result.byAob')}</div>
          <div class="result-value">${isRizkiMode ? aobDisplay : rizkiOut !== null ? formatNumber(rizkiOut, 1, locale) : '—'}</div>
          <div class="result-formula">${formula}</div>
        </div>

        <div class="kv">
          <div class="kv-row">
            <span class="kv-k">${this.t(isRizkiMode ? 'aob.kv.byVisible' : 'aob.kv.byAob')}</span>
            <span class="kv-v">${visible !== null ? `${formatNumber(visible, 1, locale)} ${this.t('units.meterShort')}` : '—'}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">${this.t('aob.cheat.title')}</h2>
        <p class="hint">${this.t('aob.cheat.hint')}</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${this.t('aob.cheat.colAob')}</th>
                <th class="num">${this.t('aob.cheat.colVisible')}</th>
                <th class="num">${this.t('aob.cheat.colTicks')}</th>
              </tr>
            </thead>
            <tbody>
              ${AOB_TABLE.map(a => {
                const vis = L > 0 ? evaluateOrNull(visAobFn, { a, l: L, r: rizki, d: D, v: 0 }) : null
                const r = vis !== null && D > 0 ? evaluateOrNull(rizkiFn, { v: vis, d: D, r: rizki, l: L, a }) : null
                const active =
                  (isRizkiMode && aobOut !== null && Math.abs(a - aobOut) < 0.5) ||
                  (!isRizkiMode && Math.abs(a - aobIn) < 0.5)
                return html`
                  <tr class="${active ? 'selected' : ''}" @click=${() => this._pickAob(a)}>
                    <td>${a}°</td>
                    <td class="num">${vis !== null ? formatNumber(vis, 1, locale) : '—'}</td>
                    <td class="num">${r !== null ? formatNumber(r, 1, locale) : '—'}</td>
                  </tr>
                `
              })}
            </tbody>
          </table>
        </div>
      </section>
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

      tbody tr {
        cursor: pointer;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-aob-panel': AobPanel
  }
}