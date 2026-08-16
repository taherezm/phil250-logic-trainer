import { FormulaSyntaxError, type BinaryOperator } from '../tfl/types'
import type { FOLFormula, Term } from './types'

const variables = new Set(['x', 'y', 'z', 'u', 'v', 'w'])

export function normalizeFOLInput(input: string): string {
  return input
    .replace(/<=>|<->/g, '↔').replace(/=>|->/g, '→')
    .replace(/\/\\|&&|&/g, '∧').replace(/_\|_/g, '⊥').replace(/\\\/|\|\||\|/g, '∨')
    .replace(/\bforall\b/gi, '∀').replace(/\bexists\b/gi, '∃')
    .replace(/\bnot\b/gi, '¬').replace(/~/g, '¬').replace(/!=|≠/g, '≠')
    .replace(/\s+/g, ' ').trim()
}

type TokenType = 'upper' | 'lower' | 'bottom' | 'not' | 'and' | 'or' | 'imp' | 'iff' | 'forall' | 'exists' | 'equals' | 'notEquals' | 'lparen' | 'rparen' | 'comma' | 'eof'
type Token = { type: TokenType; value: string; position: number }

function tokenize(raw: string): Token[] {
  const input = normalizeFOLInput(raw)
  const result: Token[] = []
  const map: Record<string, TokenType> = { '⊥': 'bottom', '¬': 'not', '∧': 'and', '∨': 'or', '→': 'imp', '↔': 'iff', '∀': 'forall', '∃': 'exists', '=': 'equals', '≠': 'notEquals', '(': 'lparen', '[': 'lparen', '{': 'lparen', ')': 'rparen', ']': 'rparen', '}': 'rparen', ',': 'comma' }
  let index = 0
  while (index < input.length) {
    if (/\s/.test(input[index])) { index += 1; continue }
    const single = map[input[index]]
    if (single) { result.push({ type: single, value: input[index], position: index }); index += 1; continue }
    const upper = input.slice(index).match(/^[A-Z][A-Z0-9_]*/)
    if (upper) { result.push({ type: 'upper', value: upper[0], position: index }); index += upper[0].length; continue }
    const lower = input.slice(index).match(/^[a-z][a-z0-9_]*/)
    if (lower) { result.push({ type: 'lower', value: lower[0], position: index }); index += lower[0].length; continue }
    throw new FormulaSyntaxError(`Unexpected symbol “${input[index]}”`, index)
  }
  result.push({ type: 'eof', value: '', position: input.length })
  return result
}

export function parseFOL(input: string): FOLFormula {
  if (!input.trim()) throw new FormulaSyntaxError('Enter a formula', 0)
  const tokens = tokenize(input)
  let cursor = 0
  const peek = () => tokens[cursor]
  const take = (type?: TokenType) => {
    const token = tokens[cursor]
    if (type && token.type !== type) throw new FormulaSyntaxError(`Expected ${type}`, token.position)
    cursor += 1
    return token
  }
  const term = (): Term => {
    const token = take('lower')
    return { type: 'term', name: token.value, variable: variables.has(token.value) }
  }
  const primary = (): FOLFormula => {
    const token = peek()
    if (token.type === 'bottom') { take(); return { type: 'bottom' } }
    if (token.type === 'not') { take(); return { type: 'not', operand: primary() } }
    if (token.type === 'forall' || token.type === 'exists') {
      const quantifier = take().type as 'forall' | 'exists'
      const variableToken = take('lower')
      if (!variables.has(variableToken.value)) throw new FormulaSyntaxError('A quantifier must bind a variable such as x, y, or z', variableToken.position)
      return { type: 'quantifier', quantifier, variable: variableToken.value, body: primary() }
    }
    if (token.type === 'lparen') {
      take(); const formula = iff(); take('rparen'); return formula
    }
    if (token.type === 'upper') {
      const name = take().value
      const terms: Term[] = []
      if (peek().type === 'lparen') {
        take()
        if (peek().type !== 'rparen') {
          terms.push(term())
          while (peek().type === 'comma') { take(); terms.push(term()) }
        }
        take('rparen')
      } else {
        while (peek().type === 'lower') terms.push(term())
      }
      if (terms.length === 0) throw new FormulaSyntaxError('A predicate must have at least one term', token.position)
      return { type: 'predicate', name, terms }
    }
    if (token.type === 'lower') {
      const left = term()
      const relation = take()
      if (relation.type !== 'equals' && relation.type !== 'notEquals') throw new FormulaSyntaxError('Expected identity between two terms', relation.position)
      const identity: FOLFormula = { type: 'identity', left, right: term() }
      return relation.type === 'notEquals' ? { type: 'not', operand: identity } : identity
    }
    throw new FormulaSyntaxError('Expected a predicate, identity, quantifier, or opening parenthesis', token.position)
  }
  const chain = (next: () => FOLFormula, types: TokenType[]): FOLFormula => {
    let left = next()
    while (types.includes(peek().type)) { const operator = take().type as BinaryOperator; left = { type: 'binary', operator, left, right: next() } }
    return left
  }
  const and = () => chain(primary, ['and'])
  const or = () => chain(and, ['or'])
  const imp = (): FOLFormula => { const left = or(); if (peek().type === 'imp') { take(); return { type: 'binary', operator: 'imp', left, right: imp() } } return left }
  const iff = () => chain(imp, ['iff'])
  const result = iff()
  if (peek().type !== 'eof') throw new FormulaSyntaxError('Unexpected extra input', peek().position)
  return result
}

const marks = { and: '∧', or: '∨', imp: '→', iff: '↔' } as const
const ranks = { iff: 1, imp: 2, or: 3, and: 4 } as const

export function renderFOL(formula: FOLFormula, parentRank = 0): string {
  if (formula.type === 'predicate') return `${formula.name}(${formula.terms.map((item) => item.name).join(', ')})`
  if (formula.type === 'identity') return `${formula.left.name} = ${formula.right.name}`
  if (formula.type === 'bottom') return '⊥'
  if (formula.type === 'not') return `¬${formula.operand.type === 'binary' ? `(${renderFOL(formula.operand)})` : renderFOL(formula.operand, 5)}`
  if (formula.type === 'quantifier') return `${formula.quantifier === 'forall' ? '∀' : '∃'}${formula.variable}${formula.body.type === 'binary' ? `(${renderFOL(formula.body)})` : renderFOL(formula.body, 5)}`
  const rank = ranks[formula.operator]
  const text = `${renderFOL(formula.left, rank)} ${marks[formula.operator]} ${renderFOL(formula.right, formula.operator === 'imp' ? rank - 1 : rank)}`
  return rank < parentRank ? `(${text})` : text
}

export function folStructuralEqual(left: FOLFormula, right: FOLFormula): boolean {
  return renderFOL(left) === renderFOL(right)
}

export function freeVariables(formula: FOLFormula, bound = new Set<string>()): Set<string> {
  if (formula.type === 'predicate') return new Set(formula.terms.filter((term) => term.variable && !bound.has(term.name)).map((term) => term.name))
  if (formula.type === 'identity') return new Set([formula.left, formula.right].filter((term) => term.variable && !bound.has(term.name)).map((term) => term.name))
  if (formula.type === 'bottom') return new Set()
  if (formula.type === 'not') return freeVariables(formula.operand, bound)
  if (formula.type === 'binary') return new Set([...freeVariables(formula.left, bound), ...freeVariables(formula.right, bound)])
  const next = new Set(bound); next.add(formula.variable); return freeVariables(formula.body, next)
}

export function namesInFormula(formula: FOLFormula): Set<string> {
  const names = new Set<string>()
  const visitTerm = (term: Term) => { if (!term.variable) names.add(term.name) }
  const visit = (node: FOLFormula) => {
    if (node.type === 'predicate') node.terms.forEach(visitTerm)
    else if (node.type === 'identity') { visitTerm(node.left); visitTerm(node.right) }
    else if (node.type === 'not') visit(node.operand)
    else if (node.type === 'binary') { visit(node.left); visit(node.right) }
    else if (node.type === 'quantifier') visit(node.body)
  }
  visit(formula); return names
}

export function substitute(formula: FOLFormula, variable: string, replacement: Term): FOLFormula {
  const replaceTerm = (term: Term) => term.variable && term.name === variable ? replacement : term
  if (formula.type === 'predicate') return { ...formula, terms: formula.terms.map(replaceTerm) }
  if (formula.type === 'identity') return { ...formula, left: replaceTerm(formula.left), right: replaceTerm(formula.right) }
  if (formula.type === 'bottom') return formula
  if (formula.type === 'not') return { ...formula, operand: substitute(formula.operand, variable, replacement) }
  if (formula.type === 'binary') return { ...formula, left: substitute(formula.left, variable, replacement), right: substitute(formula.right, variable, replacement) }
  if (formula.variable === variable) return formula
  if (replacement.variable && formula.variable === replacement.name && freeVariables(formula.body).has(variable)) throw new Error(`Substitution would capture ${replacement.name}.`)
  return { ...formula, body: substitute(formula.body, variable, replacement) }
}
