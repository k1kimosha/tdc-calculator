import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { KNOTS_TO_MS, TORPEDO_SPEEDS, formatNumber } from '../tdc-data.js'
import { compileFormulas, evaluateOrNull } from '../formula-engine.js'
import { getFormulas } from '../tdc-store.js'
import { I18nElement } from '../i18n.js'
import { formStyles } from '../shared-styles.js'

function toNumber(value: string): number {
  const n = value.replace(',', '.')
  if (n === '') return 0
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

function formatRunTime(seconds: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m > 0) {
    return `${s} ${t('okane.run.sec')} (${t('okane.run.approx')} ${m} ${t('okane.run.min')} ${rest} ${t('okane.run.sec')})`
  }
  return `${s} ${t('okane.run.sec')}`
}

@customElement('tdc-okane-panel')
export class OkanePanel extends I18nElement {
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
    const { locale } = this

    const formulas = getFormulas('okane')
    const compiled = compileFormulas({
      lead: formulas['lead'] ?? 'atan(vt/vs)*180/pi',
      leadGen: formulas['leadGen'] ?? 'asin(vt/vs*sin(aob*pi/180))*180/pi',
      trackAngle: formulas['trackAngle'] ?? '180-aob-lead',
      runTime: formulas['runTime'] ?? 'd/(vs*c)',
    })
    const leadFn = compiled.fns['lead']
    const leadGenFn = compiled.fns['leadGen']
    const trackFn = compiled.fns['trackAngle']
    const runFn = compiled.fns['runTime']

    const beta = vs > 0 ? evaluateOrNull(leadFn, { vt, vs, aob, d: D, lead: 0, c: KNOTS_TO_MS }) : null
    const aobFire = beta !== null ? 90 - beta : null

    const generalLead =
      vs > 0 && aob > 0
        ? evaluateOrNull(leadGenFn, { vt, vs, aob, d: D, lead: 0, c: KNOTS_TO_MS })
        : null
    const tta =
      generalLead !== null
        ? evaluateOrNull(trackFn, { aob, lead: generalLead, vt, vs, d: D, c: KNOTS_TO_MS })
        : null

    const runTime =
      D > 0 && vs > 0 ? evaluateOrNull(runFn, { d: D, vs, c: KNOTS_TO_MS, vt, aob, lead: 0 }) : null
    const formulaError = compiled.error ? this.t('calcs.invalid', { error: compiled.error }) : null

    return html`
      <section class="panel">
        <h2 class="panel-title">${this.t('okane.title')}</h2>
        <p class="hint">${this.t('okane.intro')}</p>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="vt">${this.t('okane.vt.label')}</label>
            <input
              id="vt"
              type="number"
              step="0.1"
              min="0"
              .value=${this.vtText}
              @input=${(e: Event) => (this.vtText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('okane.vt.hint')}</span>
          </div>

          <div class="field">
            <label class="field-label" for="vs">${this.t('okane.vs.label')}</label>
            <select id="vs" @change=${(e: Event) => (this.vsId = (e.target as HTMLSelectElement).value)}>
              ${TORPEDO_SPEEDS.map(
                t => html`
                  <option value=${t.id} ?selected=${this.vsId === t.id}>${t.label[locale]}</option>
                `,
              )}
              <option value="manual" ?selected=${this.vsId === 'manual'}>${this.t('okane.vs.manual')}</option>
            </select>
            ${this.isManualVs
              ? html`
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    .value=${this.vsText}
                    @input=${(e: Event) => (this.vsText = (e.target as HTMLInputElement).value)}
                    aria-label=${this.t('okane.vs.aria')}
                  />
                `
              : html`<span class="field-hint">${this.t('okane.vs.hint', { k: formatNumber(vs, 2, locale) })}</span>`}
          </div>
        </div>

        <div class="kv">
          <div class="kv-row">
            <span class="kv-k">${this.t('okane.kv.beta')}</span>
            <span class="kv-v">${beta !== null ? `${formatNumber(beta, 1, locale)}°` : '—'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">${this.t('okane.kv.bearing')}</span>
            <span class="kv-v">${beta !== null ? this.t('okane.kv.bearingValue', { b: formatNumber(beta, 1, locale) }) : '—'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-k">${this.t('okane.kv.aobFire')}</span>
            <span class="kv-v">${aobFire !== null ? `${formatNumber(aobFire, 1, locale)}°` : '—'}</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">${this.t('okane.result.caption')}</div>
          <div class="result-value">${beta !== null ? `${formatNumber(beta, 1, locale)}°` : '—'}</div>
          <div class="result-formula">
            ${formulaError ??
            (beta !== null
              ? this.t('okane.result.formula', {
                  vt: formatNumber(vt, 2, locale),
                  vs: formatNumber(vs, 2, locale),
                  b: formatNumber(beta, 1, locale),
                })
              : this.t('okane.result.empty'))}
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">${this.t('okane.general.title')}</h2>
        <p class="hint">${this.t('okane.general.intro')}</p>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="aob">${this.t('okane.general.aobLabel')}</label>
            <input
              id="aob"
              type="number"
              step="1"
              min="0"
              max="180"
              .value=${this.aobText}
              @input=${(e: Event) => (this.aobText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('okane.general.aobHint')}</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">${this.t('okane.general.caption')}</div>
          <div class="result-value">${generalLead !== null ? `${formatNumber(generalLead, 1, locale)}°` : '—'}</div>
          <div class="result-formula">
            ${formulaError ??
            (generalLead !== null && tta !== null
              ? this.t('okane.general.formula', {
                  b: formatNumber(generalLead, 1, locale),
                  a: formatNumber(aob, 1, locale),
                  tta: formatNumber(tta, 1, locale),
                })
              : this.t('okane.general.empty'))}
          </div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">${this.t('okane.run.title')}</h2>

        <div class="form-grid">
          <div class="field">
            <label class="field-label" for="dist">${this.t('okane.run.distLabel')}</label>
            <input
              id="dist"
              type="number"
              step="10"
              min="0"
              .value=${this.distText}
              @input=${(e: Event) => (this.distText = (e.target as HTMLInputElement).value)}
            />
            <span class="field-hint">${this.t('okane.run.distHint')}</span>
          </div>
        </div>

        <div class="result">
          <div class="result-caption">${this.t('okane.run.caption')}</div>
          <div class="result-value">${runTime !== null ? formatRunTime(runTime, (k, p) => this.t(k, p)) : '—'}</div>
          <div class="result-formula">
            ${formulaError ??
            (runTime !== null
              ? this.t('okane.run.formula', {
                  d: formatNumber(D, 0, locale),
                  vs: formatNumber(vs, 2, locale),
                  t: formatNumber(runTime, 0, locale),
                })
              : this.t('okane.run.empty'))}
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