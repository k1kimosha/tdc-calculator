import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  CHEAT_SHEET_RIZKI,
  MAGNIFICATIONS,
  WARSHIPS,
  distanceMeters,
  formatNumber,
  rizkiForDistance,
  type Magnification,
  type ShipClass,
} from '../tdc-data.js'
import { formStyles, segmentStyles, tableStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

@customElement('tdc-distance-panel')
export class DistancePanel extends LitElement {
  @state() private shipId = 'flavik'
  @state() private landmark: 'mast' | 'funnel' = 'mast'
  @state() private magId = 'approach'
  @state() private mode: 'rizki' | 'distance' = 'rizki'
  @state() private heightText = '20'
  @state() private rizkiText = '6'
  @state() private distText = ''

  private get selectedShip(): ShipClass | undefined {
    return WARSHIPS.find(s => s.id === this.shipId)
  }

  private get magnification(): Magnification {
    return MAGNIFICATIONS.find(m => m.id === this.magId) ?? MAGNIFICATIONS[1]
  }

  private _onShipChange(e: Event) {
    const id = (e.target as HTMLSelectElement).value
    this.shipId = id
    const ship = WARSHIPS.find(s => s.id === id)
    if (ship) {
      this.heightText = String(
        this.landmark === 'mast' ? ship.mastHeight : ship.funnelHeight,
      )
    }
  }

  private _onLandmarkChange(e: Event) {
    this.landmark = (e.target as HTMLInputElement).value as 'mast' | 'funnel'
    const ship = this.selectedShip
    if (ship) {
      this.heightText = String(this.landmark === 'mast' ? ship.mastHeight : ship.funnelHeight)
    }
  }

  private _pickRizki(rizki: number) {
    this.mode = 'rizki'
    this.rizkiText = String(rizki)
  }

  render() {
    const h = toNumber(this.heightText)
    const c = this.magnification.coefficient
    const isRizkiMode = this.mode === 'rizki'
    const rizki = toNumber(this.rizkiText)
    const dist = toNumber(this.distText)

    const resultDistance = h > 0 && rizki > 0 ? distanceMeters(h, c, rizki) : null
    const resultRizki = h > 0 && dist > 0 ? rizkiForDistance(h, c, dist) : null

    const distFormula =
      resultDistance !== null
        ? `${formatNumber(h)} м × ${formatNumber(c)} ÷ ${formatNumber(rizki)} = ${formatNumber(resultDistance, 0)} м`
        : 'Укажите высоту цели и количество рисок'

    const rizkiFormula =
      resultRizki !== null
        ? `${formatNumber(h)} м × ${formatNumber(c)} ÷ ${formatNumber(dist)} м = ${formatNumber(resultRizki)}`
        : 'Укажите высоту цели и дистанцию'

    return html`
      <section class="panel">
        <h2 class="panel-title">Дистанция до цели</h2>

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
              ? html`<span class="field-hint">${this.selectedShip.nameEn}</span>`
              : html`<span class="field-hint">Введите высоту цели вручную</span>`}
          </div>

          <div class="field">
            <span class="field-label">Ориентир для замера</span>
            <div class="segment" role="radiogroup" aria-label="Ориентир">
              <label>
                <input
                  type="radio"
                  name="landmark"
                  value="mast"
                  ?checked=${this.landmark === 'mast'}
                  @change=${this._onLandmarkChange}
                />
                <span>Мачта</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="landmark"
                  value="funnel"
                  ?checked=${this.landmark === 'funnel'}
                  @change=${this._onLandmarkChange}
                />
                <span>Труба</span>
              </label>
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="height">Высота цели, м</label>
            <input
              id="height"
              type="number"
              step="0.5"
              min="0"
              .value=${this.heightText}
              @input=${(e: Event) => (this.heightText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">По справочнику · можно править</span>
          </div>

          <div class="field">
            <label class="field-label" for="mag">Кратность прицела</label>
            <select id="mag" @change=${(e: Event) => (this.magId = (e.target as HTMLSelectElement).value)}>
              ${MAGNIFICATIONS.map(
                m => html`
                  <option value=${m.id} ?selected=${this.magId === m.id}>${m.label} — ${m.detail}</option>
                `,
              )}
            </select>
            <span class="field-hint">Коэффициент K = ${formatNumber(c)}</span>
          </div>
        </div>

        <div class="field" style="margin-top:16px">
          <span class="field-label">Что рассчитать</span>
          <div class="segment" role="radiogroup" aria-label="Режим расчёта">
            <label>
              <input
                type="radio"
                name="mode"
                value="rizki"
                ?checked=${this.mode === 'rizki'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'rizki')}
              />
              <span>Дистанцию по рискам</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="distance"
                ?checked=${this.mode === 'distance'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'distance')}
              />
              <span>Риски по дистанции</span>
            </label>
          </div>
        </div>

        <div class="form-grid" style="margin-top:14px">
          <div class="field">
            <label class="field-label" for="rizki">${isRizkiMode ? 'Риски' : 'Введите дистанцию, м'}</label>
            <input
              id="rizki"
              type="number"
              step="0.1"
              min="0"
              .value=${isRizkiMode ? this.rizkiText : this.distText}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value
                if (isRizkiMode) this.rizkiText = v
                else this.distText = v
              }}
            />
          </div>
        </div>

        <div class="result">
          <div class="result-caption">${isRizkiMode ? 'Дистанция до цели' : 'Риски (рисок)'}</div>
          <div class="result-value">
            ${isRizkiMode
              ? resultDistance !== null
                ? `${formatNumber(resultDistance, 0)} м`
                : '—'
              : resultRizki !== null
                ? formatNumber(resultRizki)
                : '—'}
          </div>
          <div class="result-formula">${isRizkiMode ? distFormula : rizkiFormula}</div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Шпаргалка: риски → дистанция</h2>
        <p class="hint">Текущая цель и кратность · нажмите на строку, чтобы подставить значение риски</p>
        <div class="table-wrap">
          <table class="cheat">
            <thead>
              <tr>
                <th>Риски</th>
                <th class="num">Дистанция, м</th>
              </tr>
            </thead>
            <tbody>
              ${CHEAT_SHEET_RIZKI.map(r => {
                const d = h > 0 ? distanceMeters(h, c, r) : null
                const isActive = isRizkiMode
                  ? rizki > 0 && Math.abs(r - rizki) < 0.005
                  : resultRizki !== null && Math.abs(r - resultRizki) < 0.005
                return html`
                  <tr class="${isActive ? 'selected' : ''}" @click=${() => this._pickRizki(r)}>
                    <td>${formatNumber(r)}</td>
                    <td class="num">${d !== null ? formatNumber(d, 0) : '—'}</td>
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

      .cheat tbody tr {
        cursor: pointer;
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-distance-panel': DistancePanel
  }
}