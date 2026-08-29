import { describe, expect, it } from 'vitest'
import {
  FormulaError,
  compileFormula,
  compileFormulas,
  evaluateFormula,
  evaluateOrNull,
  validateFormula,
} from './formula-engine.js'

describe('formula engine — arithmetic', () => {
  it('evaluates basic arithmetic', () => {
    expect(evaluateFormula('2+3*4', {})).toBe(14)
    expect(evaluateFormula('(2+3)*4', {})).toBe(20)
    expect(evaluateFormula('10-2-3', {})).toBe(5)
    expect(evaluateFormula('100/4/5', {})).toBe(5)
    expect(evaluateFormula('7%4', {})).toBe(3)
    expect(evaluateFormula('2^10', {})).toBe(1024)
  })

  it('handles power right-associativity', () => {
    expect(evaluateFormula('2^3^2', {})).toBe(512)
    expect(evaluateFormula('-2^2', {})).toBe(4)
    expect(evaluateFormula('2^-2', {})).toBeCloseTo(0.25)
  })

  it('handles unary and decimals', () => {
    expect(evaluateFormula('--5', {})).toBe(5)
    expect(evaluateFormula('1.5*2', {})).toBe(3)
    expect(evaluateFormula('1e3+1', {})).toBe(1001)
    expect(evaluateFormula('2.5e-1*4', {})).toBe(1)
  })
})

describe('formula engine — variables and constants', () => {
  it('evaluates variables case-insensitively', () => {
    expect(evaluateFormula('h*K/r', { h: 20, k: 366, r: 6 })).toBeCloseTo(1220)
    expect(evaluateFormula('L/t*1.94', { l: 115, t: 40 })).toBeCloseTo(5.5775)
  })

  it('uses built-in constants', () => {
    expect(evaluateFormula('pi', {})).toBeCloseTo(Math.PI)
    expect(evaluateFormula('tau/2', {})).toBeCloseTo(Math.PI)
    expect(evaluateFormula('e', {})).toBeCloseTo(Math.E)
  })
})

describe('formula engine — functions', () => {
  it('applies trig and inverse functions', () => {
    expect(evaluateFormula('sin(pi/2)', {})).toBeCloseTo(1)
    expect(evaluateFormula('cos(0)', {})).toBeCloseTo(1)
    expect(evaluateFormula('asin(1)*180/pi', {})).toBeCloseTo(90)
    expect(evaluateFormula('deg(asin(1))', {})).toBeCloseTo(90)
    expect(evaluateFormula('rad(180)/pi', {})).toBeCloseTo(1)
  })

  it('applies atan2, hyperbolic, power and rounding functions', () => {
    expect(evaluateFormula('atan2(1,1)*180/pi', {})).toBeCloseTo(45)
    expect(evaluateFormula('sqrt(49)', {})).toBeCloseTo(7)
    expect(evaluateFormula('cbrt(27)', {})).toBeCloseTo(3)
    expect(evaluateFormula('abs(-4)', {})).toBe(4)
    expect(evaluateFormula('floor(2.9)', {})).toBe(2)
    expect(evaluateFormula('ceil(2.1)', {})).toBe(3)
    expect(evaluateFormula('round(2.5)', {})).toBe(3)
    expect(evaluateFormula('trunc(-2.7)', {})).toBe(-2)
    expect(evaluateFormula('sign(-3)', {})).toBe(-1)
    expect(evaluateFormula('ln(e)', {})).toBeCloseTo(1)
    expect(evaluateFormula('log(100)', {})).toBeCloseTo(2)
    expect(evaluateFormula('log2(8)', {})).toBeCloseTo(3)
    expect(evaluateFormula('exp(ln(5))', {})).toBeCloseTo(5)
    expect(evaluateFormula('min(3,1,2)', {})).toBe(1)
    expect(evaluateFormula('max(3,1,2)', {})).toBe(3)
  })

  it('applies clamp and multiline nesting', () => {
    expect(evaluateFormula('clamp(5,0,2)', {})).toBe(2)
    expect(evaluateFormula('clamp(-1,0,2)', {})).toBe(0)
    expect(evaluateFormula('clamp(1,0,2)', {})).toBe(1)
    expect(evaluateFormula('sin(radius*pi/180 + 0)', { radius: 90 })).toBeCloseTo(1)
  })
})

describe('formula engine — default calculator expressions', () => {
  it('computes the default distance/aob/okane formulas', () => {
    expect(evaluateFormula('h*k/r', { h: 20, k: 366, r: 6 })).toBeCloseTo(1220)
    expect(evaluateFormula('h*k/d', { h: 20, k: 366, d: 1000 })).toBeCloseTo(7.32)
    expect(evaluateFormula('r*d/1000', { r: 15, d: 2379 })).toBeCloseTo(35.685)
    expect(evaluateFormula('asin(v/l)*180/pi', { v: 40, l: 62 })).toBeCloseTo(40.1778)
    expect(evaluateFormula('l*sin(a*pi/180)', { l: 62, a: 40 })).toBeCloseTo(39.8514)
    expect(evaluateFormula('atan(vt/vs)*180/pi', { vt: 8, vs: 40 })).toBeCloseTo(11.3099)
    expect(evaluateFormula('d/(vs*c)', { d: 1500, vs: 40, c: 0.5144444 })).toBeCloseTo(72.8945)
  })
})

describe('formula engine — errors', () => {
  it('throws for unknown variables and functions', () => {
    expect(() => compileFormula('x + 1').evaluate({})).toThrow(FormulaError)
    expect(() => compileFormula('foo(1)')).toThrow(/Неизвестная функция/)
  })

  it('reports invalid syntax', () => {
    expect(() => compileFormula('2 +')).toThrow(FormulaError)
    expect(() => compileFormula('2@3')).toThrow(/Недопустимый символ/)
    expect(() => compileFormula('(2+3')).toThrow(/закрывающая скобка/)
    expect(() => compileFormula('2 3')).toThrow(/Неожиданный токен/)
  })

  it('validateFormula returns a message or null', () => {
    expect(validateFormula('h*k/r')).toBeNull()
    expect(validateFormula('h *')).not.toBeNull()
    expect(validateFormula('nope + 1')).toBeNull()
  })

  it('evaluateOrNull swallows missing variables', () => {
    const fn = compileFormula('x*2')
    expect(evaluateOrNull(fn, {})).toBeNull()
    expect(evaluateOrNull(undefined, { x: 1 })).toBeNull()
    expect(evaluateOrNull(fn, { x: 3 })).toBe(6)
  })

  it('compileFormulas fails fast and caches', () => {
    const compiled = compileFormulas({ a: '1+1', bad: '2+' })
    expect(compiled.error).not.toBeNull()
    expect(Object.keys(compiled.fns)).toHaveLength(0)
    const ok = compileFormulas({ a: '1+1', b: '2*3' })
    expect(ok.error).toBeNull()
    expect(ok.fns.a!.evaluate({})).toBe(2)
    expect(ok.fns.b!.evaluate({})).toBe(6)
    expect(compileFormula('1+1')).toBe(compileFormula('1+1'))
  })
})