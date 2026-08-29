import { KNOTS_TO_MS, formatNumber, locText, shipClassName, type CalculatorConfig } from './tdc-data.js'
import { getShips } from './tdc-store.js'
import { type ShotSnapshotCalc } from './tdc-log.js'
import { evaluateFormula } from './formula-engine.js'
import type { Locale } from './i18n.js'

interface BuiltInput {
  name: string
  label: string
  value: string
}

export function buildCalcSnapshots(
  calcs: CalculatorConfig[],
  inputs: Record<string, Record<string, string>>,
  locale: Locale,
): ShotSnapshotCalc[] {
  const out: ShotSnapshotCalc[] = []
  for (const config of calcs) {
    const calcInputs = inputs[config.id] ?? {}
    const baseVars = computeBaseVars(config, calcInputs)
    const results: { id: string; label: string; value: string; unit?: string }[] = []
    const feed: Record<string, number> = {}
    for (const f of config.formulas) {
      const ctx: Record<string, number> = { ...baseVars }
      for (const k of Object.keys(feed)) ctx[k] = feed[k]
      const result: { id: string; label: string; value: string; unit?: string } = {
        id: f.id,
        label: f.label ? locText(f.label, locale) : f.id,
        value: '—',
      }
      try {
        const r = evaluateFormula(f.expr, ctx)
        if (typeof r === 'number' && Number.isFinite(r)) {
          result.value = formatNumber(r, 2, locale)
          feed[f.id] = r
        }
      } catch {
        result.value = '—'
      }
      if (f.unit) result.unit = locText(f.unit, locale)
      results.push(result)
    }
    const entry: ShotSnapshotCalc = {
      calcId: config.id,
      calcTitle: { ru: config.title.ru, en: config.title.en },
      formulas: config.formulas.map(f => {
        const formula: { id: string; label: { ru: string; en: string }; expr: string; unit?: { ru: string; en: string } } = {
          id: f.id,
          label: f.label ? { ru: f.label.ru, en: f.label.en } : { ru: '', en: '' },
          expr: f.expr,
        }
        if (f.unit) formula.unit = { ru: f.unit.ru, en: f.unit.en }
        return formula
      }),
      inputs: collectInputs(config, calcInputs, locale),
      results,
    }
    out.push(entry)
  }
  return out
}

function computeBaseVars(
  config: CalculatorConfig,
  inputs: Record<string, string>,
): Record<string, number> {
  const vars: Record<string, number> = {}
  for (const c of config.controls) {
    if (c.kind === 'number') {
      const n = Number(inputs[c.name] ?? String(c.default ?? 0))
      if (Number.isFinite(n)) vars[c.name] = n
    } else if (c.kind === 'select') {
      const optId = inputs[c.name] ?? c.defaultId ?? c.options[0]?.id ?? ''
      const opt = c.options.find(o => o.id === optId)
      if (opt && typeof opt.value === 'number') vars[c.name] = opt.value
    }
  }
  const ship = getShips().find(s => s.id === (inputs['ship'] ?? ''))
  if (ship) {
    for (const c of config.controls) {
      if (c.kind !== 'ships') continue
      if (c.landmarkVar && (c.bindMast || c.bindFunnel)) {
        const useFunnel = inputs[c.landmarkVar] === 'funnel'
        const target = useFunnel ? (c.bindFunnel ?? c.bindMast) : c.bindMast
        const height = useFunnel ? ship.funnelHeight : ship.mastHeight
        if (target && height > 0) vars[target] = height
        continue
      }
      if (c.bindLength) vars[c.bindLength] = ship.length
      if (!c.landmarkVar && c.bindMast && ship.mastHeight > 0) vars[c.bindMast] = ship.mastHeight
      if (!c.landmarkVar && c.bindFunnel && ship.funnelHeight > 0) vars[c.bindFunnel] = ship.funnelHeight
    }
  }
  vars['c'] = KNOTS_TO_MS
  return vars
}

function collectInputs(
  config: CalculatorConfig,
  inputs: Record<string, string>,
  locale: Locale,
): BuiltInput[] {
  const out: BuiltInput[] = []
  for (const c of config.controls) {
    if (c.kind === 'number') {
      const raw = inputs[c.name] ?? String(c.default ?? 0)
      out.push({ name: c.name, label: locText(c.label, locale), value: raw })
    } else if (c.kind === 'select') {
      const optId = inputs[c.name] ?? c.defaultId ?? c.options[0]?.id ?? ''
      const opt = c.options.find(o => o.id === optId)
      out.push({
        name: c.name,
        label: locText(c.label, locale),
        value: opt ? locText(opt.label, locale) : '',
      })
    } else if (c.kind === 'ships') {
      const ship = getShips().find(s => s.id === (inputs['ship'] ?? ''))
      out.push({
        name: 'ship',
        label: locText(c.label, locale),
        value: ship ? shipClassName(ship, locale) : '—',
      })
    }
  }
  return out
}