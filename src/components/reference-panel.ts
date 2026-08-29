import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import {
  IDENTIFICATION_INTRO,
  IDENTIFICATION_METHODS,
  SAFE_SCENARIOS,
  WARSHIPS,
} from '../tdc-data.js'
import { tableStyles } from '../shared-styles.js'

@customElement('tdc-reference-panel')
export class ReferencePanel extends LitElement {
  render() {
    return html`
      <section class="panel">
        <h2 class="panel-title">Параметры военных кораблей</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Класс</th>
                <th class="num">Длина, м</th>
                <th class="num">Мачта / труба, м</th>
                <th class="num">Осадка, м</th>
                <th class="num">Скорость, уз</th>
              </tr>
            </thead>
            <tbody>
              ${WARSHIPS.map(
                s => html`
                  <tr>
                    <td>
                      <div class="ship-name">${s.nameRu}</div>
                      <div class="ship-en">${s.nameEn}</div>
                    </td>
                    <td class="num">${s.length}</td>
                    <td class="num">${s.mastHeight} / ${s.funnelHeight}</td>
                    <td class="num">${s.draft}</td>
                    <td class="num">${s.speed}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section class="scenario-grid">
        ${SAFE_SCENARIOS.map(
          sc => html`
            <div class="panel scenario">
              <h2 class="panel-title">Безопасные дистанции</h2>
              <h3 class="scenario-title">${sc.title}</h3>
              <div class="stats">
                <div class="stat">
                  <span class="stat-k">Рекомендация</span>
                  <span class="stat-v">${sc.recommendation}</span>
                </div>
                <div class="stat">
                  <span class="stat-k">Обнаружение</span>
                  <span class="stat-v">${sc.detection}</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>${sc.leftCaption}</th>
                    <th class="num">${sc.rightCaption}</th>
                  </tr>
                </thead>
                <tbody>
                  ${sc.rows.map(
                    r => html`
                      <tr>
                        <td>${r.label}</td>
                        <td class="num">${r.value}</td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            </div>
          `,
        )}
      </section>

      <section class="panel">
        <h2 class="panel-title">Идентификация судов</h2>
        <p class="intro">${IDENTIFICATION_INTRO}</p>

        ${IDENTIFICATION_METHODS.map(
          m => html`
            <div class="method">
              <h3>${m.title}</h3>
              ${m.blocks
                ? html`
                    <div class="blocks">
                      ${m.blocks.map(
                        b => html`
                          <div class="block">
                            <div class="block-term">${b.termEn} <span>· ${b.termRu}</span></div>
                            <div class="pills">
                              ${b.options.map(
                                o => html`<span class="pill"><b>${o.en}</b> — ${o.ru}</span>`,
                              )}
                            </div>
                          </div>
                        `,
                      )}
                    </div>
                  `
                : ''}
              ${m.note ? html`<p class="note">${m.note}</p>` : ''}
            </div>
          `,
        )}
      </section>
    `
  }

  static styles = [
    tableStyles,
    css`
      :host {
        display: block;
      }

      .ship-name {
        font-weight: 600;
      }

      .ship-en {
        font-size: 11.5px;
        color: var(--text-dim);
        margin-top: 2px;
      }

      .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }

      .scenario .panel-title {
        margin-bottom: 10px;
      }

      .scenario-title {
        margin: 0 0 12px;
        font-size: 13.5px;
        font-weight: 650;
        color: var(--accent);
      }

      .stats {
        display: grid;
        gap: 10px;
        margin-bottom: 14px;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
      }

      .stat-k {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-dim);
      }

      .stat-v {
        font-family: var(--mono);
        font-size: 15px;
        color: var(--text);
      }

      .intro {
        margin: 0 0 18px;
        font-size: 13.5px;
        color: var(--text);
      }

      .method {
        padding: 14px 0;
        border-top: 1px solid var(--border);
      }

      .method h3 {
        margin: 0 0 10px;
        font-size: 14.5px;
        font-weight: 650;
        color: var(--text);
      }

      .blocks {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
        gap: 12px;
      }

      .block {
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel-2);
      }

      .block-term {
        font-family: var(--mono);
        font-size: 13px;
        color: var(--text);
        margin-bottom: 8px;
      }

      .block-term span {
        font-family: inherit;
        color: var(--text-dim);
      }

      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .pill {
        font-size: 12.5px;
        color: var(--text-dim);
        padding: 4px 9px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--panel);
      }

      .pill b {
        font-family: var(--mono);
        color: var(--accent);
        font-weight: 600;
      }

      .note {
        margin: 12px 0 0;
        font-size: 13px;
        color: var(--text-dim);
      }
    `,
  ]
}

declare global {
  interface HTMLElementTagNameMap {
    'tdc-reference-panel': ReferencePanel
  }
}