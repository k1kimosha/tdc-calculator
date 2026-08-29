const registry: Record<string, Record<string, string>> = {}

export function setCalcInput(calcId: string, name: string, value: string) {
  const entry = (registry[calcId] ??= {})
  entry[name] = value
}

export function getCalcInputs(calcId: string): Record<string, string> {
  return registry[calcId] ?? {}
}

export function clearCalcInputs() {
  for (const key of Object.keys(registry)) delete registry[key]
}