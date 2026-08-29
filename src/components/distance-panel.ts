import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  CHEAT_SHEET_RIZKI,
  MAGNIFICATIONS,
  WARSHIPS,
  distanceMeters,
  formatNumber,
  rizkiForDistance,
  shipClassName,
  type Magnification,
  type ShipClass,
} from '../tdc-data.js'
import { I18nElement } from '../i18n.js'
import { formStyles, segmentStyles, tableStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

@customElement('tdc-distance-panel')
export class DistancePanel extends I18nElement {
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
    const { locale } = this

    const resultDistance = h > 0 && rizki > 0 ? distanceMeters(h, c, rizki) : null
    const resultRizki = h > 0 && dist > 0 ? rizkiForDistance(h, c, dist) : null

    const distFormula =
      resultDistance !== null
        ? this.t('distance.formula.byTicks', {
            h: formatNumber(h, 2, locale),
            k: formatNumber(c, 2, locale),
            r: formatNumber(rizki, 2, locale),
            d: formatNumber(resultDistance, 0, locale),
          })
        : this.t('distance.formula.emptyTicks')

    const rizkiFormula =
      resultRizki !== null
        ? this.t('distance.formula.byDistance', {
            h: formatNumber(h, 2, locale),
            k: formatNumber(c, 2, locale),
            d: formatNumber(dist, 0, locale),
            r: formatNumber(resultRizki, 2, locale),
          })
        : this.t('distance.formula.emptyDist')

    const unitM = this.t('units.meterShort')

    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('distance.title')}</h2>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="ship">${this.t('distance.ship.label')}</label>
            <select id="ship" @change=${this._onShipChange}>
              <option value="" ?selected=${this.shipId === ''}>${this.t('distance.ship.manual')}</option>
              ${WARSHIPS.map(
                s => html`
                  <option value=${s.id} ?selected=${this.shipId === s.id}>${shipClassName(s, locale)}</option>
                `,
              )}
            </select>
            ${this.selectedShip
              ? html`<span class="field-hint">${locale === 'ru' ? this.selectedShip.nameEn : this.selectedShip.nameRu}</span>`
              : html`<span class="field-hint">${this.t('distance.ship.manualHint')}</span>`}
          </div>

          <div class="field">
            <span class="field-label">${this.t('distance.point.label')}</span>
            <div class="segment" role="radiogroup" aria-label=${this.t('distance.point.aria')}>
              <label>
                <input
                  type="radio"
                  name="landmark"
                  value="mast"
                  ?checked=${this.landmark === 'mast'}
                  @change=${this._onLandmarkChange}
                />
                <span>${this.t('distance.point.mast')}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="landmark"
                  value="funnel"
                  ?checked=${this.landmark === 'funnel'}
                  @change=${this._onLandmarkChange}
                />
                <span>${this.t('distance.point.funnel')}</span>
              </label>
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="height">${this.t('distance.height.label')}</label>
            <input
              id="height"
              type="number"
              step="0.5"
              min="0"
              .value=${this.heightText}
              @input=${(e: Event) => (this.heightText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('distance.height.hint')}</span>
          </div>

          <div class="field">
            <label class="field-label" for="mag">${this.t('distance.mag.label')}</label>
            <select id="mag" @change=${(e: Event) => (this.magId = (e.target as HTMLSelectElement).value)}>
              ${MAGNIFICATIONS.map(
                m => html`
                  <option value=${m.id} ?selected=${this.magId === m.id}>${m.label[locale]} — ${m.detail[locale]}</option>
                `,
              )}
            </select>
            <span class="field-hint">${this.t('distance.mag.hint', { k: formatNumber(c, 2, locale) })}</span>
          </div>
        </div>

        <div class="field" style="margin-top:16px">
          <span class="field-label">${this.t('distance.mode.label')}</span>
          <div class="segment" role="radiogroup" aria-label=${this.t('distance.mode.aria')}>
            <label>
              <input
                type="radio"
                name="mode"
                value="rizki"
                ?checked=${this.mode === 'rizki'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'rizki')}
              />
              <span>${this.t('distance.mode.byTicks')}</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="distance"
                ?checked=${this.mode === 'distance'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'distance')}
              />
              <span>${this.t('distance.mode.byDistance')}</span>
            </label>
          </div>
        </div>

        <div class="form-grid" style="margin-top:14px">
          <div class="field">
            <label class="field-label" for="rizki">${this.t(isRizkiMode ? 'distance.input.byTicks' : 'distance.input.byDistance')}</label>
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
          <div class="result-caption">${this.t(isRizkiMode ? 'distance.result.byTicks' : 'distance.result.byDistance')}</div>
          <div class="result-value">
            ${isRizkiMode
              ? resultDistance !== null
                ? `${formatNumber(resultDistance, 0, locale)} ${unitM}`
                : '—'
              : resultRizki !== null
                ? formatNumber(resultRizki, 2, locale)
                : '—'}
          </div>
          <div class="result-formula">${isRizkiMode ? distFormula : rizkiFormula}</div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">${this.t('distance.cheat.title')}</h2>
        <p class="hint">${this.t('distance.cheat.hint')}</p>
        <div class="table-wrap">
          <table class="cheat">
            <thead>
              <tr>
                <th>${this.t('distance.cheat.colTicks')}</th>
                <th class="num">${this.t('distance.cheat.colDistance')}</th>
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
                    <td>${formatNumber(r, 2, locale)}</td>
                    <td class="num">${d !== null ? formatNumber(d, 0, locale) : '—'}</td>
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