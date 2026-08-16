import { describe, expect, it } from 'vitest'
import { freeVariables, normalizeFOLInput, parseFOL, renderFOL, substitute } from '../logic/fol/parser'
import { evaluateFOL } from '../logic/models/evaluator'

const model = {
  domain: ['Ada', 'Bo'],
  names: { a: 'Ada', b: 'Bo' },
  predicates: { P: [['Ada']], Q: [['Ada'], ['Bo']], R: [['Ada', 'Bo']] },
}

describe('FOL parser and finite-model evaluator', () => {
  it('normalizes quantifiers and parses multiple generality', () => {
    expect(normalizeFOLInput('forall x (P(x) -> exists y R(x,y))')).toBe('∀ x (P(x) → ∃ y R(x,y))')
    expect(renderFOL(parseFOL('forall x(P(x) -> exists y R(x,y))'))).toBe('∀x(P(x) → ∃yR(x, y))')
  })

  it('tracks free and bound variables', () => {
    expect([...freeVariables(parseFOL('P(x) & exists y R(x,y)'))]).toEqual(['x'])
  })

  it('rejects variable capture during substitution', () => {
    const formula = parseFOL('exists y R(x,y)')
    expect(() => substitute(formula, 'x', { type: 'term', name: 'y', variable: true })).toThrow(/capture/)
  })

  it('evaluates names, predicates, relations, and quantifiers with witnesses', () => {
    expect(evaluateFOL(parseFOL('P(a)'), model).value).toBe(true)
    expect(evaluateFOL(parseFOL('R(a,b)'), model).value).toBe(true)
    expect(evaluateFOL(parseFOL('exists x P(x)'), model)).toMatchObject({ value: true, witness: 'Ada' })
    expect(evaluateFOL(parseFOL('forall x P(x)'), model)).toMatchObject({ value: false, witness: 'Bo' })
    expect(evaluateFOL(parseFOL('a = b'), model).value).toBe(false)
  })
})
