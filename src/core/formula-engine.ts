/**
 * Математический движок формул калькуляторов.
 *
 * Умеет: числа (включая e-нотацию), переменные, константы (pi/e/tau),
 * бинарные операторы + - * / % ^, унарные +/-, скобки и функции
 * (sin, cos, tan, asin, acos, atan, atan2, sqrt, ln, log2, min, max, ...).
 * Строка компилируется один раз в замыкание (с кэшем) и затем
 * многократно оценивается подставляя переменные.
 */
export class FormulaError extends Error {
  readonly position?: number

  constructor(message: string, position?: number) {
    super(message)
    this.name = 'FormulaError'
    this.position = position
  }
}

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'ident'; name: string }
  | { kind: 'op'; op: '+' | '-' | '*' | '/' | '%' | '^' }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'comma' }
  | { kind: 'eol' }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  function error(message: string, pos: number): never {
    throw new FormulaError(message, pos)
  }

  while (i < expr.length) {
    const ch = expr[i]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }
    if (ch >= '0' && ch <= '9') {
      const start = i
      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) i++
      if (i < expr.length && (expr[i] === 'e' || expr[i] === 'E')) {
        const ePos = i
        i++
        if (i < expr.length && (expr[i] === '+' || expr[i] === '-')) i++
        if (i < expr.length && expr[i] >= '0' && expr[i] <= '9') {
          while (i < expr.length && expr[i] >= '0' && expr[i] <= '9') i++
        } else {
          i = ePos
        }
      }
      const text = expr.slice(start, i)
      const value = Number(text)
      if (!Number.isFinite(value)) error(`Некорректное число: ${text}`, start)
      tokens.push({ kind: 'number', value })
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i
      while (i < expr.length && /[A-Za-z0-9_]/.test(expr[i])) i++
      tokens.push({ kind: 'ident', name: expr.slice(start, i) })
      continue
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma' })
      i++
      continue
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '^') {
      tokens.push({ kind: 'op', op: ch })
      i++
      continue
    }
    error(`Недопустимый символ: «${ch}»`, i)
  }
  tokens.push({ kind: 'eol' })
  return tokens
}

type Node =
  | { type: 'num'; value: number }
  | { type: 'var'; name: string }
  | { type: 'unary'; op: '+' | '-'; node: Node }
  | { type: 'bin'; op: '+' | '-' | '*' | '/' | '%' | '^'; left: Node; right: Node }
  | { type: 'call'; name: string; args: Node[] }

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
}

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  sin: args => Math.sin(args[0]),
  cos: args => Math.cos(args[0]),
  tan: args => Math.tan(args[0]),
  asin: args => Math.asin(args[0]),
  acos: args => Math.acos(args[0]),
  atan: args => Math.atan(args[0]),
  atan2: args => Math.atan2(args[0], args[1]),
  sinh: args => Math.sinh(args[0]),
  cosh: args => Math.cosh(args[0]),
  tanh: args => Math.tanh(args[0]),
  sqrt: args => Math.sqrt(args[0]),
  cbrt: args => Math.cbrt(args[0]),
  abs: args => Math.abs(args[0]),
  floor: args => Math.floor(args[0]),
  ceil: args => Math.ceil(args[0]),
  round: args => Math.round(args[0]),
  trunc: args => Math.trunc(args[0]),
  sign: args => Math.sign(args[0]),
  ln: args => Math.log(args[0]),
  log: args => Math.log10(args[0]),
  log2: args => Math.log2(args[0]),
  exp: args => Math.exp(args[0]),
  min: args => Math.min(...args),
  max: args => Math.max(...args),
  clamp: args => Math.min(Math.max(args[0], args[1]), args[2]),
  rad: args => (args[0] * Math.PI) / 180,
  deg: args => (args[0] * 180) / Math.PI,
}

class Parser {
  pos = 0
  readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private next(): Token {
    return this.tokens[this.pos++]
  }

  private error(message: string, token: Token): never {
    const pos = this.tokens.indexOf(token)
    throw new FormulaError(message, pos >= 0 ? pos : undefined)
  }

  parse(): Node {
    const node = this.parseExpr()
    const last = this.peek()
    if (last.kind !== 'eol') {
      this.error(`Неожиданный токен: ${this.describe(last)}`, last)
    }
    return node
  }

  private describe(token: Token): string {
    if (token.kind === 'number') return String(token.value)
    if (token.kind === 'ident') return token.name
    if (token.kind === 'op') return token.op
    if (token.kind === 'comma') return ','
    return token.kind
  }

  private parseExpr(): Node {
    return this.parseAdditive()
  }

  private parseAdditive(): Node {
    let left = this.parseMultiplicative()
    for (;;) {
      const t = this.peek()
      if (t.kind === 'op' && (t.op === '+' || t.op === '-')) {
        this.next()
        left = { type: 'bin', op: t.op, left, right: this.parseMultiplicative() }
      } else {
        return left
      }
    }
  }

  private parseMultiplicative(): Node {
    let left = this.parsePower()
    for (;;) {
      const t = this.peek()
      if (t.kind === 'op' && (t.op === '*' || t.op === '/' || t.op === '%')) {
        this.next()
        left = { type: 'bin', op: t.op, left, right: this.parsePower() }
      } else {
        return left
      }
    }
  }

  private parsePower(): Node {
    const left = this.parseUnary()
    const t = this.peek()
    if (t.kind === 'op' && t.op === '^') {
      this.next()
      return { type: 'bin', op: '^', left, right: this.parsePower() }
    }
    return left
  }

  private parseUnary(): Node {
    const t = this.peek()
    if (t.kind === 'op' && (t.op === '+' || t.op === '-')) {
      this.next()
      return { type: 'unary', op: t.op, node: this.parseUnary() }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): Node {
    const t = this.next()
    if (t.kind === 'number') return { type: 'num', value: t.value }
    if (t.kind === 'lparen') {
      const node = this.parseExpr()
      const close = this.next()
      if (close.kind !== 'rparen') this.error('Ожидалась закрывающая скобка «)»', close)
      return node
    }
    if (t.kind === 'ident') {
      const next = this.peek()
      if (next.kind === 'lparen') {
        this.next()
        const args: Node[] = []
        if (this.peek().kind !== 'rparen') {
          for (;;) {
            args.push(this.parseExpr())
            const sep = this.peek()
            if (sep.kind === 'comma') {
              this.next()
              continue
            }
            break
          }
        }
        const close = this.next()
        if (close.kind !== 'rparen') this.error('Ожидалась закрывающая скобка «)»', close)
        return { type: 'call', name: t.name, args }
      }
      return { type: 'var', name: t.name }
    }
    this.error(`Ожидалось число, переменная или скобка, найдено: ${this.describe(t)}`, t)
  }
}

export interface CompiledFormula {
  /** Оценить выражение, используя `vars` как значения переменных. */
  evaluate(vars: Record<string, number>): number
}

function compileNode(node: Node): (vars: Record<string, number>) => number {
  switch (node.type) {
    case 'num':
      return () => node.value
    case 'var': {
      const name = node.name.toLowerCase()
      const constant = CONSTANTS[name]
      if (constant !== undefined) return () => constant
      return vars => {
        const value = vars[name]
        if (value === undefined) {
          throw new FormulaError(`Неизвестная переменная: ${node.name}`)
        }
        return value
      }
    }
    case 'unary': {
      const inner = compileNode(node.node)
      return node.op === '-'
        ? vars => -inner(vars)
        : vars => inner(vars)
    }
    case 'bin': {
      const left = compileNode(node.left)
      const right = compileNode(node.right)
      switch (node.op) {
        case '+':
          return vars => left(vars) + right(vars)
        case '-':
          return vars => left(vars) - right(vars)
        case '*':
          return vars => left(vars) * right(vars)
        case '/':
          return vars => left(vars) / right(vars)
        case '%':
          return vars => left(vars) % right(vars)
        case '^':
          return vars => Math.pow(left(vars), right(vars))
      }
      break
    }
    case 'call': {
      const fn = FUNCTIONS[node.name.toLowerCase()]
      if (!fn) {
        throw new FormulaError(`Неизвестная функция: ${node.name}`)
      }
      const args = node.args.map(compileNode)
      return vars => fn(args.map(arg => arg(vars)))
    }
  }
}

const compileCache = new Map<string, CompiledFormula>()

/** Скомпилировать выражение (кэшируется по строке). Бросает FormulaError при синтаксической ошибке. */
export function compileFormula(expr: string): CompiledFormula {
  const cached = compileCache.get(expr)
  if (cached) return cached
  const tokens = tokenize(expr)
  const ast = new Parser(tokens).parse()
  const evaluate = compileNode(ast)
  const compiled: CompiledFormula = { evaluate }
  compileCache.set(expr, compiled)
  return compiled
}

/** Оценить выражение немедленно (компиляция с кэшем). */
export function evaluateFormula(expr: string, vars: Record<string, number>): number {
  return compileFormula(expr).evaluate(vars)
}

/** Проверить синтаксис: возвращает сообщение ошибки или `null` если выражение валидно. */
export function validateFormula(expr: string): string | null {
  try {
    compileFormula(expr)
    return null
  } catch (err) {
    return err instanceof FormulaError ? err.message : String(err)
  }
}

export interface CompiledFormulas {
  fns: Record<string, CompiledFormula>
  error: string | null
}

/** Компилировать набор выражений ({id: expr}) атомарно: при первой ошибке возвращает error. */
export function compileFormulas(exprs: Record<string, string>): CompiledFormulas {
  const fns: Record<string, CompiledFormula> = {}
  for (const [key, expr] of Object.entries(exprs)) {
    try {
      fns[key] = compileFormula(expr)
    } catch (err) {
      return {
        fns: {},
        error: err instanceof FormulaError ? err.message : String(err),
      }
    }
  }
  return { fns, error: null }
}

/** Оценить скомпилированную формулу без «взрыва»: вернёт `null` при ошибке или отсутствии функции. */
export function evaluateOrNull(fn: CompiledFormula | undefined, vars: Record<string, number>): number | null {
  if (!fn) return null
  try {
    return fn.evaluate(vars)
  } catch {
    return null
  }
}