import { FormulaSyntaxError, type BinaryOperator, type TFLFormula } from './types'

const replacements: Array<[RegExp, string]> = [
  [/<=>|<->/g, '↔'],
  [/=>|->/g, '→'],
  [/\/\\|&&|&/g, '∧'],
  [/_\|_/g, '⊥'],
  [/\\\/|\|\||\|/g, '∨'],
  [/\bnot\b/gi, '¬'],
  [/\band\b/gi, '∧'],
  [/\bor\b/gi, '∨'],
]

export function normalizeTFLInput(input: string): string {
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input)
    .replace(/~/g, '¬')
    .replace(/\s+/g, ' ')
    .trim()
}

type Token = { type: 'atom' | 'bottom' | 'not' | 'and' | 'or' | 'imp' | 'iff' | 'lparen' | 'rparen' | 'eof'; value: string; position: number }

function tokenize(raw: string): Token[] {
  const input = normalizeTFLInput(raw)
  const tokens: Token[] = []
  let index = 0
  const symbols: Record<string, Token['type']> = { '⊥': 'bottom', '¬': 'not', '∧': 'and', '∨': 'or', '→': 'imp', '↔': 'iff', '(': 'lparen', '[': 'lparen', '{': 'lparen', ')': 'rparen', ']': 'rparen', '}': 'rparen' }
  while (index < input.length) {
    const character = input[index]
    if (/\s/.test(character)) { index += 1; continue }
    if (symbols[character]) {
      tokens.push({ type: symbols[character], value: character, position: index })
      index += 1
      continue
    }
    const atom = input.slice(index).match(/^[A-Z][A-Z0-9_]*/)
    if (atom) {
      tokens.push({ type: 'atom', value: atom[0], position: index })
      index += atom[0].length
      continue
    }
    throw new FormulaSyntaxError(`Unexpected symbol “${character}”`, index)
  }
  tokens.push({ type: 'eof', value: '', position: input.length })
  return tokens
}

export function parseTFL(input: string): TFLFormula {
  if (!input.trim()) throw new FormulaSyntaxError('Enter a formula', 0)
  const tokens = tokenize(input)
  let cursor = 0
  const peek = () => tokens[cursor]
  const take = (type?: Token['type']) => {
    const token = tokens[cursor]
    if (type && token.type !== type) throw new FormulaSyntaxError(`Expected ${type}`, token.position)
    cursor += 1
    return token
  }

  const primary = (): TFLFormula => {
    const token = peek()
    if (token.type === 'atom') return { type: 'atom', name: take().value }
    if (token.type === 'bottom') { take(); return { type: 'bottom' } }
    if (token.type === 'not') { take(); return { type: 'not', operand: primary() } }
    if (token.type === 'lparen') {
      take()
      const formula = iff()
      if (peek().type !== 'rparen') throw new FormulaSyntaxError('Expected a closing parenthesis', peek().position)
      take()
      return formula
    }
    throw new FormulaSyntaxError('Expected an atomic formula, negation, or opening parenthesis', token.position)
  }

  const chain = (next: () => TFLFormula, types: Token['type'][]): TFLFormula => {
    let left = next()
    while (types.includes(peek().type)) {
      const operator = take().type as BinaryOperator
      left = { type: 'binary', operator, left, right: next() }
    }
    return left
  }
  const and = () => chain(primary, ['and'])
  const or = () => chain(and, ['or'])
  const imp = (): TFLFormula => {
    const left = or()
    if (peek().type === 'imp') { take(); return { type: 'binary', operator: 'imp', left, right: imp() } }
    return left
  }
  const iff = () => chain(imp, ['iff'])

  const result = iff()
  if (peek().type !== 'eof') throw new FormulaSyntaxError('Unexpected extra input', peek().position)
  return result
}

const marks: Record<BinaryOperator, string> = { and: '∧', or: '∨', imp: '→', iff: '↔' }
const precedence: Record<BinaryOperator, number> = { iff: 1, imp: 2, or: 3, and: 4 }

export function renderTFL(formula: TFLFormula, parentPrecedence = 0): string {
  if (formula.type === 'atom') return formula.name
  if (formula.type === 'bottom') return '⊥'
  if (formula.type === 'not') {
    const inner = formula.operand.type === 'binary' ? `(${renderTFL(formula.operand)})` : renderTFL(formula.operand, 5)
    return `¬${inner}`
  }
  const current = precedence[formula.operator]
  const text = `${renderTFL(formula.left, current)} ${marks[formula.operator]} ${renderTFL(formula.right, formula.operator === 'imp' ? current - 1 : current)}`
  return current < parentPrecedence ? `(${text})` : text
}

export function structuralEqual(left: TFLFormula, right: TFLFormula): boolean {
  if (left.type !== right.type) return false
  if (left.type === 'atom' && right.type === 'atom') return left.name === right.name
  if (left.type === 'bottom' && right.type === 'bottom') return true
  if (left.type === 'not' && right.type === 'not') return structuralEqual(left.operand, right.operand)
  return left.type === 'binary' && right.type === 'binary' && left.operator === right.operator && structuralEqual(left.left, right.left) && structuralEqual(left.right, right.right)
}

export function mainConnective(formula: TFLFormula): string {
  if (formula.type === 'atom') return 'atomic'
  if (formula.type === 'bottom') return 'bottom'
  if (formula.type === 'not') return '¬'
  return marks[formula.operator]
}
