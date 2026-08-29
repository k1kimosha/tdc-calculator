import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { formatNumber, shipClassName, type ShipClass } from '../tdc-data.js'
import { compileFormulas, evaluateOrNull } from '../formula-engine.js'
import { getFormulas, getShips } from '../tdc-store.js'
import { I18nElement } from '../i18n.js'
import { formStyles } from '../shared-styles.js'

const SPEED_TABLE = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36]

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

@customElement('tdc-speed-panel')
export class SpeedPanel extends I18nElement {
  @state() private shipId = 'tribal'
  @state() private lengthText = '115'
  @state() private secondsText = '40'

  private get selectedShip(): ShipClass | undefined {
    return getShips().find(s => s.id === this.shipId)
  }

  private _onShipChange(e: Event) {
    this.shipId = (e.target as HTMLSelectElement).value
    const ship = this.selectedShip
    if (ship) this.lengthText = String(ship.length)
  }

  render() {
    const len = toNumber(this.lengthText)
    const sec = toNumber(this.secondsText)
    const { locale } = this
    const formulas = getFormulas('speed')
    const compiled = compileFormulas({
      speed: formulas['speed'] ?? 'l/t*1.94',
      transit: formulas['transit'] ?? 'l*1.94/spd',
    })
    const speedFn = compiled.fns['speed']
    const transitFn = compiled.fns['transit']
    const speed = len > 0 && sec > 0 ? evaluateOrNull(speedFn, { l: len, t: sec }) : null

    const formula =
      compiled.error
        ? this.t('calcs.invalid', { error: compiled.error })
        : speed !== null
          ? this.t('speed.formula.value', {
              l: formatNumber(len, 2, locale),
              t: formatNumber(sec, 2, locale),
              s: formatNumber(speed, 2, locale),
            })
          : this.t('speed.formula.empty')

    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('speed.title')}</h2>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="ship">${this.t('speed.ship.label')}</label>
            <select id="ship" @change=${this._onShipChange}>
              <option value="" ?selected=${this.shipId === ''}>${this.t('speed.ship.manual')}</option>
              ${getShips().map(
                s => html`
                  <option value=${s.id} ?selected=${this.shipId === s.id}>${shipClassName(s, locale)}</option>
                `,
              )}
            </select>
            ${this.selectedShip
              ? html`<span class="field-hint">${this.t('speed.ship.hint', { en: this.selectedShip.nameEn, len: this.selectedShip.length })}</span>`
              : html`<span class="field-hint">${this.t('speed.ship.manualHint')}</span>`}
          </div>

          <div class="field">
            <label class="field-label" for="length">${this.t('speed.length.label')}</label>
            <input
              id="length"
              type="number"
              step="1"
              min="0"
              .value=${this.lengthText}
              @input=${(e: Event) => (this.lengthText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('speed.length.hint')}</span>
          </div>

          <div class="field">
            <label class="field-label" for="seconds">${this.t('speed.time.label')}</label>
            <input
              id="seconds"
              type="number"
              step="0.1"
              min="0"
              .value=${this.secondsText}
              @input=${(e: Event) => (this.secondsText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('speed.time.hint')}</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">${this.t('speed.result.caption')}</div>
          <div class="result-value">${speed !== null ? `${formatNumber(speed, 2, locale)} ${this.t('units.knotsShort')}` : '—'}</div>
          <div class="result-formula">${formula}</div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">${this.t('speed.table.title')}</h2>
        <p class="hint">${this.t('speed.table.hint')}</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${this.t('speed.table.colSpeed')}</th>
                <th class="num">${this.t('speed.table.colTime')}</th>
              </tr>
            </thead>
            <tbody>
              ${SPEED_TABLE.map(spd => {
                const t = len > 0 ? evaluateOrNull(transitFn, { l: len, spd }) : null
                return html`
                  <tr>
                    <td>${spd}</td>
                    <td class="num">${t !== null ? formatNumber(t, 1, locale) : '—'}</td>
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
    css`
      :host {
        display: block;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-speed-panel': SpeedPanel
  }
}