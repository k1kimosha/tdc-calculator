import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { WARSHIPS, formatNumber, speedKnots, type ShipClass } from '../tdc-data.js'
import { formStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

@customElement('tdc-speed-panel')
export class SpeedPanel extends LitElement {
  @state() private shipId = 'tribal'
  @state() private lengthText = '115'
  @state() private secondsText = '40'

  private get selectedShip(): ShipClass | undefined {
    return WARSHIPS.find(s => s.id === this.shipId)
  }

  private _onShipChange(e: Event) {
    this.shipId = (e.target as HTMLSelectElement).value
    const ship = this.selectedShip
    if (ship) this.lengthText = String(ship.length)
  }

  render() {
    const len = toNumber(this.lengthText)
    const sec = toNumber(this.secondsText)
    const speed = len > 0 && sec > 0 ? speedKnots(len, sec) : null

    const formula =
      speed !== null
        ? `${formatNumber(len)} м ÷ ${formatNumber(sec)} с × 1,94 = ${formatNumber(speed)} уз`
        : 'Укажите длину цели и время прохода'

    return html`
      <section class="panel">
        <h2 class="panel-title">Скорость цели</h2>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="ship">Тип цели</label>
            <select id="ship" @change=${this._onShipChange}>
              <option value="" ?selected=${this.shipId === ''}>Ручной ввод</option>
              ${WARSHIPS.map(
                s => html`
                  <option value=${s.id} ?selected=${this.shipId === s.id}>${s.nameRu}</option>
                `,
              )}
            </select>
            ${this.selectedShip
              ? html`<span class="field-hint">${this.selectedShip.nameEn} · длина по справочнику ${this.selectedShip.length} м</span>`
              : html`<span class="field-hint">Введите длину цели вручную</span>`}
          </div>

          <div class="field">
            <label class="field-label" for="length">Длина цели, м</label>
            <input
              id="length"
              type="number"
              step="1"
              min="0"
              .value=${this.lengthText}
              @input=${(e: Event) => (this.lengthText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">По справочнику · можно править</span>
          </div>

          <div class="field">
            <label class="field-label" for="seconds">Время прохода нос–корма, с</label>
            <input
              id="seconds"
              type="number"
              step="0.1"
              min="0"
              .value=${this.secondsText}
              @input=${(e: Event) => (this.secondsText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">За какое время силуэт прошёл от носа до кормы</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">Скорость цели</div>
          <div class="result-value">${speed !== null ? `${formatNumber(speed)} уз` : '—'}</div>
          <div class="result-formula">${formula}</div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Быстрый подбор времени</h2>
        <p class="hint">Время прохода нос–корма для длины цели и нужной скорости (уз)</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Скорость, уз</th>
                <th class="num">Время, с (для этой длины)</th>
              </tr>
            </thead>
            <tbody>
              ${[6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36].map(spd => {
                const t = len > 0 ? (len * 1.94) / spd : null
                return html`
                  <tr>
                    <td>${spd}</td>
                    <td class="num">${t !== null ? formatNumber(t, 1) : '—'}</td>
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