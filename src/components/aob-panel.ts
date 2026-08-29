import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  WARSHIPS,
  aobFromVisibleLength,
  formatNumber,
  rizkiFromVisibleMeters,
  visibleLengthFromAob,
  visibleMetersFromRizki,
  type ShipClass,
} from '../tdc-data.js'
import { formStyles, segmentStyles, tableStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

const AOB_TABLE = [10, 20, 30, 40, 50, 60, 70, 80, 90]

@customElement('tdc-aob-panel')
export class AobPanel extends LitElement {
  @state() private shipId = 'flavik'
  @state() private lengthText = '62'
  @state() private mode: 'rizki' | 'aob' = 'rizki'
  @state() private side: 'port' | 'starboard' = 'port'
  @state() private rizkiText = '15'
  @state() private distText = '2379'
  @state() private aobText = ''

  private get selectedShip(): ShipClass | undefined {
    return WARSHIPS.find(s => s.id === this.shipId)
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

    let visible: number | null = null
    let aobOut: number | null = null
    let rizkiOut: number | null = null

    if (isRizkiMode) {
      if (D > 0 && rizki > 0) visible = visibleMetersFromRizki(rizki, D)
      if (L > 0 && visible !== null && visible > 0) aobOut = aobFromVisibleLength(visible, L)
    } else {
      if (L > 0 && aobIn > 0) {
        visible = visibleLengthFromAob(aobIn, L)
        if (D > 0) rizkiOut = rizkiFromVisibleMeters(visible, D)
      }
    }

    const sideLabel = this.side === 'starboard' ? 'П' : 'Л'
    const aobDisplay = aobOut !== null ? `${formatNumber(aobOut, 1)}° ${sideLabel}` : '—'

    const formula =
      isRizkiMode && (aobOut !== null || visible !== null)
        ? `Видимая длина: ${formatNumber(rizki)} рис. × ${formatNumber(D)} м ÷ 1000 = ${formatNumber(visible ?? 0)} м → КУЦ = arcsin(${formatNumber(visible ?? 0, 1)} ÷ ${formatNumber(L)}) = ${formatNumber(aobOut ?? 0, 1)}°`
        : !isRizkiMode && (rizkiOut !== null || visible !== null)
          ? `КУЦ ${formatNumber(aobIn, 1)}° → длина = ${formatNumber(L)} м × sin(${formatNumber(aobIn, 1)}°) = ${formatNumber(visible ?? 0, 1)} м → ${formatNumber(rizkiOut ?? 0, 1)} рис. при D = ${formatNumber(D)} м`
          : 'Укажите видимую длину цели и дистанцию'

    return html`
      <section class="panel">
        <h2 class="panel-title">Курсовой угол цели (КУЦ / AOB)</h2>

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
              ? html`<span class="field-hint">${this.selectedShip.nameEn} · длина ${this.selectedShip.length} м</span>`
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
            <label class="field-label" for="dist">Дистанция до цели, м</label>
            <input
              id="dist"
              type="number"
              step="10"
              min="0"
              .value=${this.distText}
              @input=${(e: Event) => (this.distText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">Например, с вкладки «Дистанция»</span>
          </div>

          <div class="field">
            <span class="field-label">Борт цели</span>
            <div class="segment" role="radiogroup" aria-label="Борт">
              <label>
                <input
                  type="radio"
                  name="side"
                  value="port"
                  ?checked=${this.side === 'port'}
                  @change=${(e: Event) => (this.side = (e.target as HTMLInputElement).value as 'port')}
                />
                <span>Левый</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="side"
                  value="starboard"
                  ?checked=${this.side === 'starboard'}
                  @change=${(e: Event) => (this.side = (e.target as HTMLInputElement).value as 'starboard')}
                />
                <span>Правый</span>
              </label>
            </div>
          </div>
        </div>

        <div class="field" style="margin-top:16px">
          <span class="field-label">Рассчитать</span>
          <div class="segment" role="radiogroup" aria-label="Режим расчёта">
            <label>
              <input
                type="radio"
                name="mode"
                value="rizki"
                ?checked=${this.mode === 'rizki'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'rizki')}
              />
              <span>КУЦ по видимой длине</span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                value="aob"
                ?checked=${this.mode === 'aob'}
                @change=${(e: Event) => (this.mode = (e.target as HTMLInputElement).value as 'aob')}
              />
              <span>Риски по КУЦ</span>
            </label>
          </div>
        </div>

        <div class="form-grid" style="margin-top:14px">
          <div class="field">
            <label class="field-label" for="input">
              ${isRizkiMode ? 'Видимая длина цели, риски' : 'Курсовой угол, °'}
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
          <div class="result-caption">${isRizkiMode ? 'Курсовой угол цели (КУЦ)' : 'Видимая длина в рисках'}</div>
          <div class="result-value">${isRizkiMode ? aobDisplay : rizkiOut !== null ? formatNumber(rizkiOut, 1) : '—'}</div>
          <div class="result-formula">${formula}</div>
        </div>

        <div class="kv">
          <div class="kv-row">
            <span class="kv-k">Видимая длина ${isRizkiMode ? 'по введённым рискам' : 'при этом КУЦ'}</span>
            <span class="kv-v">${visible !== null ? `${formatNumber(visible, 1)} м` : '—'}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Шпаргалка: КУЦ → риски</h2>
        <p class="hint">Для этой цели и дистанции · нажмите на строку, чтобы подставить КУЦ</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>КУЦ, °</th>
                <th class="num">Видимая длина, м</th>
                <th class="num">Риски</th>
              </tr>
            </thead>
            <tbody>
              ${AOB_TABLE.map(a => {
                const vis = L > 0 ? visibleLengthFromAob(a, L) : null
                const r = vis !== null && D > 0 ? rizkiFromVisibleMeters(vis, D) : null
                const active =
                  (isRizkiMode && aobOut !== null && Math.abs(a - aobOut) < 0.5) ||
                  (!isRizkiMode && Math.abs(a - aobIn) < 0.5)
                return html`
                  <tr class="${active ? 'selected' : ''}" @click=${() => this._pickAob(a)}>
                    <td>${a}°</td>
                    <td class="num">${vis !== null ? formatNumber(vis, 1) : '—'}</td>
                    <td class="num">${r !== null ? formatNumber(r, 1) : '—'}</td>
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