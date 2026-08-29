import { css } from 'lit'

export const formStyles = css`
  .panel {
    background: linear-gradient(180deg, var(--panel), var(--panel-2));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 16px;
  }

  .panel-title {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--text);
  }

  .panel-title::after {
    content: '';
    display: block;
    width: 42px;
    height: 2px;
    margin-top: 6px;
    border-radius: 2px;
    background: var(--accent);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .field-hint {
    font-size: 12px;
    color: var(--text-dim);
  }

  input[type='number'],
  input[type='text'],
  select {
    width: 100%;
    box-sizing: border-box;
    background: #0a1422;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    font: inherit;
    font-size: 15px;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  select {
    cursor: pointer;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    gap: 14px;
  }

  .result {
    margin-top: 18px;
    padding: 16px 18px;
    border: 1px solid var(--accent-border);
    border-radius: var(--radius);
    background: var(--accent-dim);
  }

  .result .result-caption {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin-bottom: 2px;
  }

  .result .result-value {
    font-family: var(--mono);
    font-size: 34px;
    line-height: 1.15;
    color: var(--accent);
  }

  .result .result-formula {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--text-dim);
    margin-top: 6px;
  }

  .hint {
    font-size: 12.5px;
    color: var(--text-dim);
  }

  .kv {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  .kv-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--panel-2);
  }

  .kv-k {
    font-size: 12.5px;
    color: var(--text-dim);
  }

  .kv-v {
    font-family: var(--mono);
    color: var(--text);
    white-space: nowrap;
  }
`

export const segmentStyles = css`
  .segment {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    align-self: flex-start;
  }

  .segment label {
    position: relative;
    display: flex;
  }

  .segment input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .segment input:focus-visible + span {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .segment span {
    padding: 9px 16px;
    font-size: 13.5px;
    color: var(--text-dim);
    cursor: pointer;
    user-select: none;
    border-right: 1px solid var(--border);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .segment label:last-child span {
    border-right: 0;
  }

  .segment input:checked + span {
    background: var(--accent-dim);
    color: var(--text);
    box-shadow: inset 0 -2px 0 var(--accent);
  }
`

export const tableStyles = css`
  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }

  th {
    text-align: left;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-dim);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  td {
    padding: 9px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: middle;
  }

  tbody tr:hover {
    background: rgba(63, 217, 199, 0.06);
  }

  td.num,
  th.num {
    text-align: right;
    font-family: var(--mono);
  }

  tbody tr.selected {
    background: var(--accent-dim);
  }
`