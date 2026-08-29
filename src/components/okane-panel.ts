import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
  TORPEDO_SPEEDS,
  formatNumber,
  leadDeg,
  okaneLeadDeg,
  torpedoRunSeconds,
  trackAngleDeg,
} from '../tdc-data.js'
import { formStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function formatRunTime(seconds: number): string {
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  const rest = s % 60
  return m > 0 ? `${s} с (≈ ${m} мин ${rest} с)` : `${s} с`
}

@customElement('tdc-okane-panel')
export class OkanePanel extends LitElement {
  @state() private vtText = '8'
  @state() private vsId = 't40'
  @state() private vsText = '40'
  @state() private distText = '1500'
  @state() private aobText = '90'

  private get torpedoPresetKnots(): number | null {
    return TORPEDO_SPEEDS.find(t => t.id === this.vsId)?.knots ?? null
  }

  private get isManualVs(): boolean {
    return this.vsId === 'manual'
  }

  render() {
    const vt = toNumber(this.vtText)
    const vs = this.isManualVs ? toNumber(this.vsText) : (this.torpedoPresetKnots ?? 0)
    const D = toNumber(this.distText)
    const aob = toNumber(this.aobText)

    const beta = vs > 0 ? okaneLeadDeg(vt, vs) : null
    const aobFire = beta !== null ? 90 - beta : null

    const generalLead = vs > 0 && aob > 0 ? leadDeg(vt, vs, aob) : null
    const tta = generalLead !== null ? trackAngleDeg(aob, generalLead) : null

    const runTime = D > 0 && vs > 0 ? torpedoRunSeconds(D, vs) : null

    return html`
      <section class="panel">
        <h2 class="panel-title">Метод Дика О'Кейна</h2>
        <p class="hint">
          Лодка стоит перпендикулярно курсу цели. В TDC выставляется КУЦ 90° (П/Л по борту), вводится
          скорость цели. Ждите, пока цель не подойдёт на упреждение β к траверзу, и стреляйте прямым ходом.
        </p>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="vt">Скорость цели, уз</label>
            <input
              id="vt"
              type="number"
              step="0.1"
              min="0"
              .value=${this.vtText}
              @input=${(e: Event) => (this.vtText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">Замерьте на вкладке «Скорость»</span>
          </div>

          <div class="field">
            <label class="field-label" for="vs">Скорость торпеды</label>
            <select id="vs" @change=${(e: Event) => (this.vsId = (e.target as HTMLSelectElement).value)}>
              ${TORPEDO_SPEEDS.map(
                t => html`
                  <option value=${t.id} ?selected=${this.vsId === t.id}>${t.label}</option>
                `,
              )}
              <option value="manual" ?selected=${this.vsId === 'manual'}>Вручную</option>
            </select>
            ${this.isManualVs
              ? html`
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    .value=${this.vsText}
                    @input=${(e: Event) => (this.vsText = (e.target as HTMLInputElement).value)}
                    aria-label="Скорость торпеды, уз"
                  />
                `
              : html`<span class="field-hint">${formatNumber(vs)} уз</span>`}
          </div>
        </div>

        <div class="kv">
          <div class="kv-row">
            <span class="kv-k">Угол упреждения β = arctan(Vt ÷ Vs)</span>
            <span class="kv-v">${beta !== null ? `${formatNumber(beta, 1)}°` : '—'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">Пеленг на выстрел (от носа)</span>
            <span class="kv-v">${beta !== null ? `${formatNumber(beta, 1)}° в сторону движения цели` : '—'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">КУЦ цели на момент выстрела</span>
            <span class="kv-v">${aobFire !== null ? `${formatNumber(aobFire, 1)}°` : '—'}</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">Держите упреждение</div>
          <div class="result-value">${beta !== null ? `${formatNumber(beta, 1)}°` : '—'}</div>
          <div class="result-formula">
            ${beta !== null
              ? `β = arctan(${formatNumber(vt)} ÷ ${formatNumber(vs)}) = ${formatNumber(beta, 1)}°`
              : 'Введите скорости цели и торпеды'}
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Общий случай упреждения</h2>
        <p class="hint">
          Если цель не на траверзе: входные данные — текущий КУЦ (AOB) на момент выстрела.
          Угол встречи (TTA) — угол между курсом цели и ходом торпеды в точке встречи.
        </p>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="aob">КУЦ цели на момент выстрела, °</label>
            <input
              id="aob"
              type="number"
              step="1"
              min="0"
              max="180"
              .value=${this.aobText}
              @input=${(e: Event) => (this.aobText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">Острый (&lt;90°) — идёт навстречу, тупой — отворачивает</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">Угол упреждения β = arcsin((Vt ÷ Vs) × sin(КУЦ))</div>
          <div class="result-value">${generalLead !== null ? `${formatNumber(generalLead, 1)}°` : '—'}</div>
          <div class="result-formula">
            ${generalLead !== null && tta !== null
              ? `β = ${formatNumber(generalLead, 1)}° · угол встречи TTA = 180° − ${formatNumber(aob, 1)}° − ${formatNumber(generalLead, 1)}° = ${formatNumber(tta, 1)}°`
              : 'Введите КУЦ и скорости'}
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Время хода торпеды</h2>

        <div class="form-grid">
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
            <span class="field-hint">С вкладки «Дистанция»</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">Время хода торпеды</div>
          <div class="result-value">${runTime !== null ? formatRunTime(runTime) : '—'}</div>
          <div class="result-formula">
            ${runTime !== null
              ? `${formatNumber(D)} м ÷ (${formatNumber(vs)} уз × 0,5144) = ${formatNumber(runTime, 0)} с`
              : 'Введите дистанцию и скорость торпеды'}
          </div>
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
    'tdc-okane-panel': OkanePanel
  }
}