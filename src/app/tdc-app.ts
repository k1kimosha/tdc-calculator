/**
 * Корневой компонент приложения: вкладки калькуляторов/журнала/справочника/доков,
 * переключатель языка, ссылки на GitHub/Discord, авто-переключение активной
 * вкладки если калькулятор удалён.
 *
 * В шапке есть панель похода (dock): старт/стоп патруля, живой таймер,
 * фиксация выстрела с любой вкладки (снимок всех калькуляторов из общего
 * реестра) и переход в журнал.
 */
import { css, html, svg } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import '../components/calc-panel.js'
import '../components/reference-panel.js'
import '../components/docs-panel.js'
import '../components/tdc-log-panel.js'
import { I18nElement, LOCALE_OPTIONS, setLocale } from '../core/i18n.js'
import { locText, type CalculatorConfig } from '../core/tdc-data.js'
import { getCalcs, subscribeCatalog } from '../core/tdc-store.js'
import { getActivePatrol, subscribeLog, endPatrol, recordShot, formatDuration, type Patrol, type ShotMethod } from '../core/tdc-log.js'
import { getCalcInputs, getShotMethod, setShotMethod } from '../core/calc-inputs.js'
import { buildCalcSnapshots } from '../core/snapshot-utils.js'

const octocatIcon = svg`
  <svg viewBox="0 0 98 96" fill="currentColor" aria-hidden="true">
    <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" />
  </svg>`

const discordIcon = svg`
  <svg viewBox="0 0 126.644 96" fill="currentColor" aria-hidden="true">
    <path d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z" />
  </svg>`

const logsTabIcon = svg`
  <svg viewBox="0 0 512 512" fill="none" aria-hidden="true">
    <g fill="currentColor" transform="translate(85.572501, 42.666667)">
      <path d="M236.349632,7.10542736e-15 L1.68296533,7.10542736e-15 L1.68296533,234.666667 L44.349632,234.666667 L44.349632,192 L44.349632,169.6 L44.349632,42.6666667 L218.642965,42.6666667 L300.349632,124.373333 L300.349632,169.6 L300.349632,192 L300.349632,234.666667 L343.016299,234.666667 L343.016299,106.666667 L236.349632,7.10542736e-15 L236.349632,7.10542736e-15 Z M4.26325641e-14,405.333333 L4.26325641e-14,277.360521 L28.8096875,277.360521 L28.8096875,382.755208 L83.81,382.755208 L83.81,405.333333 L4.26325641e-14,405.333333 Z M153.17,275.102708 C173.279583,275.102708 188.692917,281.484792 199.41,294.248958 C209.705625,306.47125 214.853437,322.185625 214.853437,341.392083 C214.853437,362.404792 208.772396,379.112604 196.610312,391.515521 C186.134062,402.232604 171.653958,407.591146 153.17,407.591146 C133.060417,407.591146 117.647083,401.209062 106.93,388.444896 C96.634375,376.222604 91.4865625,360.267396 91.4865625,340.579271 C91.4865625,319.988021 97.5676042,303.490937 109.729687,291.088021 C120.266146,280.431146 134.74625,275.102708 153.17,275.102708 Z M153.079687,297.680833 C142.663646,297.680833 134.625833,302.015833 128.96625,310.685833 C123.848542,318.512917 121.289687,328.567708 121.289687,340.850208 C121.289687,355.059375 124.330208,366.0775 130.41125,373.904583 C136.131042,381.310208 143.717292,385.013021 153.17,385.013021 C163.525833,385.013021 171.59375,380.647917 177.37375,371.917708 C182.491458,364.211042 185.050312,354.035833 185.050312,341.392083 C185.050312,327.483958 182.009792,316.616354 175.92875,308.789271 C170.208958,301.383646 162.592604,297.680833 153.079687,297.680833 Z M343.91,333.715521 L343.91,399.011458 C336.564583,401.48 331.386667,403.105625 328.37625,403.888333 C319.043958,406.356875 309.019271,407.591146 298.302187,407.591146 C277.229271,407.591146 261.18375,402.292812 250.165625,391.696146 C237.943333,380.015729 231.832187,363.729375 231.832187,342.837083 C231.832187,318.813958 239.418437,300.69125 254.590937,288.468958 C265.609062,279.558125 280.480521,275.102708 299.205312,275.102708 C315.220729,275.102708 330.122292,278.022812 343.91,283.863021 L334.065937,306.350833 C327.563437,303.099583 321.87375,300.826719 316.996875,299.53224 C312.12,298.23776 306.761458,297.590521 300.92125,297.590521 C286.952917,297.590521 276.657292,302.13625 270.034375,311.227708 C264.435,318.934375 261.635312,329.079479 261.635312,341.663021 C261.635312,356.775312 265.849896,368.154687 274.279062,375.801146 C281.022396,381.942396 289.391354,385.013021 299.385937,385.013021 C305.226146,385.013021 310.765312,384.019583 316.003437,382.032708 L316.003437,356.293646 L293.967187,356.293646 L293.967187,333.715521 L343.91,333.715521 Z" />
    </g>
  </svg>`

const referenceTabIcon = svg`
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
    <path d="M23,8V6c0.551,0,1,0.449,1,1S23.551,8,23,8z M11.5,9H11v1.5h0.5c0.276,0,0.5-0.225,0.5-0.5V9.5 C12,9.225,11.776,9,11.5,9z M22,28c0,1.657-1.343,3-3,3H4c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3h15c1.657,0,3,1.343,3,3V28z M9,9.5C9,8.673,8.327,8,7.5,8S6,8.673,6,9.5v4C6,13.776,6.224,14,6.5,14S7,13.776,7,13.5V11h1v2.5C8,13.776,8.224,14,8.5,14 S9,13.776,9,13.5V9.5z M13,9.5C13,8.673,12.327,8,11.5,8h-1C10.224,8,10,8.224,10,8.5v5c0,0.276,0.224,0.5,0.5,0.5h1 c0.827,0,1.5-0.673,1.5-1.5V12c0-0.384-0.145-0.734-0.383-1C12.855,10.734,13,10.384,13,10V9.5z M15,12.5v-3 C15,9.225,15.224,9,15.5,9S16,9.225,16,9.5c0,0.276,0.224,0.5,0.5,0.5S17,9.776,17,9.5C17,8.673,16.327,8,15.5,8S14,8.673,14,9.5v3 c0,0.827,0.673,1.5,1.5,1.5s1.5-0.673,1.5-1.5c0-0.276-0.224-0.5-0.5-0.5S16,12.224,16,12.5c0,0.275-0.224,0.5-0.5,0.5 S15,12.775,15,12.5z M7.5,9C7.224,9,7,9.225,7,9.5V10h1V9.5C8,9.225,7.776,9,7.5,9z M11.5,11.5H11V13h0.5c0.276,0,0.5-0.225,0.5-0.5 V12C12,11.725,11.776,11.5,11.5,11.5z M29,26c0.551,0,1-0.449,1-1s-0.449-1-1-1V26z M25,12v2c0.551,0,1-0.449,1-1S25.551,12,25,12z M27,18v2c0.551,0,1-0.449,1-1S27.551,18,27,18z M30,26.723V28c0,1.657-1.343,3-3,3h-5.382C22.458,30.266,23,29.2,23,28V9 c1.105,0,2-0.895,2-2c0-1.105-0.895-2-2-2V4c0-1.2-0.542-2.266-1.382-3H27c1.657,0,3,1.343,3,3v19.277 C29.705,23.106,29.366,23,29,23h-1v4h1C29.366,27,29.705,26.894,30,26.723z M25,15c1.105,0,2-0.895,2-2c0-1.105-0.895-2-2-2h-1v4H25 z M27,21c1.105,0,2-0.895,2-2c0-1.105-0.895-2-2-2h-1v4H27z" />
  </svg>`

const docsTabIcon = svg`
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path fill-rule="evenodd" d="M3.5 3.25a.75.75 0 01.75-.75H8A.75.75 0 008 1H4.25A2.25 2.25 0 002 3.25v9.5A2.25 2.25 0 004.25 15h8.5c.69 0 1.25-.56 1.25-1.25V7a.75.75 0 00-1.5 0v3H4.25c-.263 0-.515.045-.75.128V3.25zm0 9v.5c0 .414.336.75.75.75h8.25v-2H4.25a.75.75 0 00-.75.75z" clip-rule="evenodd" />
    <path d="M12.5 3.56v.69a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 000 1.5h.69L9.47 4.47a.75.75 0 001.06 1.06l1.97-1.97z" />
  </svg>`

const calcTabIcon = svg`
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
    <circle cx="8" cy="8" r="4.6" />
    <path d="M8 3.4 V1.4 M8 12.6 V14.6 M3.4 8 H1.4 M12.6 8 H14.6" />
  </svg>`

@customElement('tdc-app')
export class TdcApp extends I18nElement {
  @state() private tab = ''
  @state() private calcs: CalculatorConfig[] = []
  @state() private patrol: Patrol | null = null
  @state() private now = Date.now()
  @state() private recorded = false
  @state() private shotMethod: ShotMethod = getShotMethod()

  private unsubCat: (() => void) | null = null
  private unsubLog: (() => void) | null = null
  private clock: number | null = null
  private flashTimer: number | null = null

  override connectedCallback() {
    super.connectedCallback()
    this.refresh()
    this.patrol = getActivePatrol()
    this.unsubCat = subscribeCatalog(() => this.refresh())
    this.unsubLog = subscribeLog(() => {
      this.patrol = getActivePatrol()
      this.requestUpdate()
    })
    this.clock = window.setInterval(() => this._tick(), 500)
  }

  override disconnectedCallback() {
    super.disconnectedCallback()
    this.unsubCat?.()
    this.unsubCat = null
    this.unsubLog?.()
    this.unsubLog = null
    if (this.clock !== null) window.clearInterval(this.clock)
    if (this.flashTimer !== null) window.clearTimeout(this.flashTimer)
  }

  private refresh() {
    this.calcs = getCalcs()
    if (this.tab !== 'reference' && this.tab !== 'docs' && this.tab !== 'log') {
      if (!this.calcs.some(c => c.id === this.tab)) {
        this.tab = this.calcs[0]?.id ?? 'reference'
      }
    }
  }

  private _tick() {
    if (this.patrol) this.now = Date.now()
  }

  /** Снимок всех калькуляторов из общего реестра (как у calc-panel). */
  private _allInputs(): Record<string, Record<string, string>> {
    const out: Record<string, Record<string, string>> = {}
    for (const c of getCalcs()) out[c.id] = getCalcInputs(c.id)
    return out
  }

  private _recordShot() {
    if (!this.patrol) return
    const snapshot = buildCalcSnapshots(getCalcs(), this._allInputs(), this.locale)
    if (!snapshot.length) return
    if (!recordShot(snapshot, getShotMethod())) return
    this.recorded = true
    if (this.flashTimer !== null) window.clearTimeout(this.flashTimer)
    this.flashTimer = window.setTimeout(() => {
      this.recorded = false
      this.flashTimer = null
    }, 2000)
  }

  private _setMethod(method: ShotMethod) {
    setShotMethod(method)
    this.shotMethod = method
  }

  private _stopPatrol() {
    const ok = typeof window.confirm === 'function' ? window.confirm(this.t('app.dock.stopConfirm')) : true
    if (ok) endPatrol()
  }

  private _shotLabel(n: number): string {
    const cat = new Intl.PluralRules(this.locale).select(n)
    const k: 'shots1' | 'shotsFew' | 'shotsMany' =
      cat === 'one' ? 'shots1' : cat === 'few' ? 'shotsFew' : 'shotsMany'
    return `${n} ${this.t(`app.dock.${k}`)}`
  }

  static styles = css`
    :host {
      --bg: #0b1524;
      --panel: #101d31;
      --panel-2: #142338;
      --border: #24405f;
      --text: #c9d5e2;
      --text-dim: #7d93ad;
      --accent: #3fd9c7;
      --accent-dim: rgba(63, 217, 199, 0.12);
      --accent-border: rgba(63, 217, 199, 0.45);
      --radius: 12px;
      --mono: ui-monospace, 'Cascadia Mono', 'SFMono-Regular', Consolas, monospace;

      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px 16px 56px;
      font-family: 'Noto Sans', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
        sans-serif;
      font-size: 15px;
      line-height: 1.5;
      color: var(--text);
    }

    /* ---- Шапка ---- */

    .masthead {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 14px;
    }

    .masthead-titles {
      flex: 1;
      min-width: 0;
    }

    .brand-mark {
      width: 46px;
      height: 46px;
      flex: none;
      color: var(--accent);
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 650;
      letter-spacing: 0.02em;
      color: var(--text);
    }

    .subtitle {
      margin: 2px 0 0;
      font-size: 13px;
      color: var(--text-dim);
    }

    .masthead-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: none;
    }

    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      color: var(--text-dim);
      background: #0a1422;
      border: 1px solid var(--border);
      border-radius: 10px;
      text-decoration: none;
      transition:
        color 0.15s,
        border-color 0.15s,
        background 0.15s,
        transform 0.15s;
    }

    .social-link svg {
      width: 19px;
      height: 19px;
    }

    .social-link:hover {
      color: var(--accent);
      border-color: var(--accent-border);
      background: var(--accent-dim);
      transform: translateY(-1px);
    }

    .lang {
      flex: none;
      appearance: none;
      box-sizing: border-box;
      background: #0a1422;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px 30px 8px 12px;
      font: inherit;
      font-size: 13.5px;
      cursor: pointer;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="%237d93ad" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 10px center;
    }

    .lang:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-dim);
    }

    .lang option {
      background: var(--panel);
      color: var(--text);
    }

    /* ---- Панель похода (dock) ---- */

    .dock {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 10px 14px;
      margin-bottom: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--panel);
      transition: border-color 0.2s;
    }

    .dock.dock-active {
      border-color: var(--accent-border);
      background: linear-gradient(180deg, var(--panel), var(--panel-2));
    }

    .dock-status {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #3d3d4d;
      flex: none;
      transition: background 0.2s;
    }

    .dot.on {
      background: var(--accent);
      box-shadow: 0 0 8px rgba(63, 217, 199, 0.7);
      animation: pulse 1.6s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        box-shadow: 0 0 6px rgba(63, 217, 199, 0.55);
      }
      50% {
        box-shadow: 0 0 12px rgba(63, 217, 199, 0.9);
      }
    }

    .dock-label {
      font-size: 13px;
      color: var(--text-dim);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .dock-timer {
      font-family: var(--mono);
      font-size: 17px;
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }

    .dock-count {
      font-size: 12.5px;
      color: var(--text-dim);
    }

    .dock-method {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: 9px;
      overflow: hidden;
      flex: none;
    }

    .dock-method .seg {
      appearance: none;
      border: 0;
      background: transparent;
      color: var(--text-dim);
      padding: 5px 11px;
      font: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition:
        background 0.15s,
        color 0.15s;
    }

    .dock-method .seg + .seg {
      border-left: 1px solid var(--border);
    }

    .dock-method .seg:hover {
      color: var(--text);
    }

    .dock-method .seg.on {
      background: var(--accent-dim);
      color: var(--accent);
      box-shadow: inset 0 0 0 1px var(--accent-border);
    }

    .dock-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 1px solid var(--border);
      border-radius: 9px;
      background: var(--panel-2);
      color: var(--text);
      padding: 8px 14px;
      font: inherit;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    }

    .btn:hover {
      border-color: var(--accent-border);
      color: var(--accent);
    }

    .btn-accent {
      background: var(--accent-dim);
      color: var(--accent);
      border-color: var(--accent-border);
    }

    .btn-accent:hover {
      background: rgba(63, 217, 199, 0.2);
    }

    .btn-danger {
      color: #e58a8a;
      border-color: rgba(229, 138, 138, 0.4);
    }

    .btn-danger:hover {
      background: rgba(229, 138, 138, 0.1);
      color: #e58a8a;
    }

    .btn-flash {
      background: rgba(63, 217, 199, 0.22);
      border-color: var(--accent-border);
      color: var(--accent);
    }

    /* ---- Вкладки ---- */

    .tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
      gap: 6px;
      padding: 6px;
      margin-bottom: 18px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .tab {
      appearance: none;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: var(--text-dim);
      padding: 8px 8px 7px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      font: inherit;
      position: relative;
      transition:
        background 0.15s,
        color 0.15s;
    }

    .tab:hover {
      color: var(--text);
    }

    .tab.active {
      background: var(--accent-dim);
      color: var(--text);
      box-shadow: inset 0 0 0 1px var(--accent-border);
    }

    .t-icon {
      display: inline-flex;
      color: var(--text-dim);
      transition: color 0.15s;
    }

    .t-icon svg {
      width: 16px;
      height: 16px;
    }

    .tab:hover .t-icon {
      color: var(--text);
    }

    .tab.active .t-icon {
      color: var(--accent);
    }

    .tab .t-label {
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.2;
      text-align: center;
    }

    .tab .t-hint {
      font-size: 11px;
      color: var(--text-dim);
      text-align: center;
    }

    .t-badge {
      position: absolute;
      top: 4px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: var(--accent);
      color: #06252a;
      font-size: 10.5px;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      box-sizing: border-box;
      pointer-events: none;
    }

    /* ---- Футер ---- */

    .footer {
      margin-top: 26px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .footer-links {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .footer .footer-links a {
      color: var(--text-dim);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: color 0.15s;
    }

    .footer .footer-links a:hover {
      color: var(--accent);
    }

    .footer .footer-links svg {
      width: 15px;
      height: 15px;
    }

    /* ---- Адаптив ---- */

    @media (max-width: 720px) {
      :host {
        padding: 14px 12px 40px;
      }

      .masthead {
        gap: 10px;
      }

      .social-link {
        width: 36px;
        height: 36px;
      }
    }

    @media (max-width: 560px) {
      .masthead {
        flex-wrap: wrap;
      }

      .masthead-titles {
        order: 1;
        flex-basis: calc(100% - 60px);
      }

      .masthead-meta {
        order: 2;
        margin-left: auto;
      }

      .subtitle {
        font-size: 12px;
      }

      h1 {
        font-size: 20px;
      }

      .tabs {
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
      }

      .tab .t-hint {
        display: none;
      }

      .dock {
        align-items: stretch;
      }

      .dock-status,
      .dock-actions {
        width: 100%;
      }

      .dock-actions {
        justify-content: flex-end;
      }
    }

    @media (max-width: 400px) {
      .masthead {
        gap: 8px;
      }

      .brand-mark {
        width: 38px;
        height: 38px;
      }

      .social-link {
        width: 34px;
        height: 34px;
      }

      .masthead-meta {
        gap: 6px;
      }

      .lang {
        padding: 8px 26px 8px 10px;
        font-size: 12.5px;
      }
    }
  `

  private _tabIcon(id: string) {
    if (id === 'log') return logsTabIcon
    if (id === 'reference') return referenceTabIcon
    if (id === 'docs') return docsTabIcon
    return calcTabIcon
  }

  render() {
    const tabs: { id: string; label: string; hint: string }[] = [
      ...this.calcs.map(c => ({
        id: c.id,
        label: locText(c.title, this.locale) || c.id,
        hint: c.hint ? locText(c.hint, this.locale) : '',
      })),
      { id: 'log', label: this.t('app.tabs.log.label'), hint: this.t('app.tabs.log.hint') },
      { id: 'reference', label: this.t('app.tabs.reference.label'), hint: this.t('app.tabs.reference.hint') },
      { id: 'docs', label: this.t('app.tabs.docs.label'), hint: this.t('app.tabs.docs.hint') },
    ]
    const active = this.calcs.find(c => c.id === this.tab)
    const pending = this.patrol ? this.patrol.shots.filter(s => s.outcome === 'none').length : 0

    return html`
      <header class="masthead">
        <svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-opacity="0.35" />
          <circle cx="24" cy="24" r="13" stroke="currentColor" stroke-opacity="0.55" />
          <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-opacity="0.75" />
          <circle cx="24" cy="24" r="1.6" fill="currentColor" />
          <path d="M24 24 V6" stroke="currentColor" stroke-linecap="round" />
          <circle cx="24" cy="5" r="1.8" fill="currentColor" />
        </svg>
        <div class="masthead-titles">
          <h1>${this.t('app.title')}</h1>
          <p class="subtitle">${this.t('app.subtitle')}</p>
        </div>
        <div class="masthead-meta">
          <a
            class="social-link"
            href="https://github.com/k1kimosha/tdc-calculator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label=${this.t('app.links.github')}
            title=${this.t('app.links.github')}
          >
            ${octocatIcon}
          </a>
          <a
            class="social-link"
            href="https://discord.gg/DGeRx7BY9q"
            target="_blank"
            rel="noopener noreferrer"
            aria-label=${this.t('app.links.discord')}
            title=${this.t('app.links.discord')}
          >
            ${discordIcon}
          </a>
          <select
            class="lang"
            aria-label=${this.t('app.lang.label')}
            @change=${(e: Event) => setLocale((e.target as HTMLSelectElement).value)}
          >
            ${LOCALE_OPTIONS.map(
              o => html`
                <option value=${o.code} ?selected=${this.locale === o.code}>${o.label}</option>
              `,
            )}
          </select>
        </div>
      </header>

      <div class="dock ${this.patrol ? 'dock-active' : ''}" aria-live="polite">
        <div class="dock-status">
          <span class="dot ${this.patrol ? 'on' : ''}"></span>
          ${this.patrol
            ? html`
                <span class="dock-label">${this.t('app.dock.active')}</span>
                <span class="dock-timer">${formatDuration(this.now - this.patrol.startedAt)}</span>
                <span class="dock-count">${this._shotLabel(this.patrol.shots.length)}</span>
                <span class="dock-method" role="group" aria-label=${this.t('log.methodLabel')}>
                  <button
                    type="button"
                    class="seg ${this.shotMethod === 'calculated' ? 'on' : ''}"
                    @click=${() => this._setMethod('calculated')}
                  >
                    ${this.t('log.methodCalculated')}
                  </button>
                  <button
                    type="button"
                    class="seg ${this.shotMethod === 'lead' ? 'on' : ''}"
                    @click=${() => this._setMethod('lead')}
                  >
                    ${this.t('log.methodLead')}
                  </button>
                </span>
              `
            : html`<span class="dock-label">${this.t('app.dock.noPatrol')}</span>`}
        </div>
        <div class="dock-actions">
          ${this.patrol
            ? html`
                <button
                  type="button"
                  class="btn ${this.recorded ? 'btn-accent btn-flash' : 'btn-accent'}"
                  @click=${this._recordShot}
                >
                  ${this.recorded ? this.t('app.dock.recorded') : this.t('app.dock.record')}
                </button>
                <button type="button" class="btn" @click=${() => (this.tab = 'log')}>
                  ${this.t('app.dock.goToLog')}
                </button>
                <button type="button" class="btn btn-danger" @click=${this._stopPatrol}>
                  ${this.t('app.dock.stop')}
                </button>
              `
            : html`
                <button type="button" class="btn btn-accent" @click=${() => (this.tab = 'log')}>
                  ${this.t('app.dock.start')}
                </button>
              `}
        </div>
      </div>

      <nav class="tabs" role="tablist" aria-label=${this.t('app.tabs.aria')}>
        ${tabs.map(
          t => html`
            <button
              type="button"
              role="tab"
              aria-selected=${this.tab === t.id}
              class="tab ${this.tab === t.id ? 'active' : ''}"
              @click=${() => (this.tab = t.id)}
            >
              ${t.id === 'log' && pending > 0
                ? html`
                    <span class="t-badge" title=${this.t('app.dock.pendingTitle')}>${pending}</span>
                  `
                : ''}
              <span class="t-icon">${this._tabIcon(t.id)}</span>
              <span class="t-label">${t.label}</span>
              ${t.hint ? html`<span class="t-hint">${t.hint}</span>` : ''}
            </button>
          `,
        )}
      </nav>

      <main>
        ${active ? html`<tdc-calc-panel .config=${active}></tdc-calc-panel>` : ''}
        ${this.tab === 'reference' ? html`<tdc-reference-panel></tdc-reference-panel>` : ''}
        ${this.tab === 'docs' ? html`<tdc-docs-panel></tdc-docs-panel>` : ''}
        ${this.tab === 'log' ? html`<tdc-log-panel></tdc-log-panel>` : ''}
      </main>

      <footer class="footer">
        <span>${this.t('app.footer.left')}</span>
        <span class="footer-links">
          <a
            href="https://github.com/k1kimosha/tdc-calculator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label=${this.t('app.links.github')}
          >
            ${octocatIcon}
          </a>
          <a
            href="https://discord.gg/DGeRx7BY9q"
            target="_blank"
            rel="noopener noreferrer"
            aria-label=${this.t('app.links.discord')}
          >
            ${discordIcon}
          </a>
        </span>
      </footer>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-app': TdcApp
  }
}