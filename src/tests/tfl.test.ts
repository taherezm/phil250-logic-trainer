import { describe, expect, it } from 'vitest'
import { buildTruthTable, classifyFormula, evaluateTFL, gradeTruthTable, truthFunctionallyEquivalent } from '../logic/tfl/evaluator'
import { mainConnective, normalizeTFLInput, parseTFL, renderTFL } from '../logic/tfl/parser'

describe('TFL parser and evaluator', () => {
  it('normalizes common keyboard operators', () => {
    expect(normalizeTFLInput('not (A /\\ B) -> _|_')).toBe('¬ (A ∧ B) → ⊥')
    expect(renderTFL(parseTFL('~A \\/ B <-> C'))).toBe('¬A ∨ B ↔ C')
  })

  it('respects precedence and right-associative conditionals', () => {
    const formula = parseTFL('A & B -> C -> D')
    expect(renderTFL(formula)).toBe('A ∧ B → C → D')
    expect(mainConnective(formula)).toBe('→')
    expect(evaluateTFL(formula, { A: true, B: true, C: true, D: false })).toBe(false)
  })

  it('classifies formulas and checks truth-functional equivalence', () => {
    expect(classifyFormula(parseTFL('A | ~A'))).toBe('tautology')
    expect(classifyFormula(parseTFL('A & ~A'))).toBe('contradiction')
    expect(classifyFormula(parseTFL('A -> B'))).toBe('contingent')
    expect(truthFunctionallyEquivalent(parseTFL('A -> B'), parseTFL('~A | B'))).toBe(true)
  })

  it('grades the earliest dependency and exact row', () => {
    const table = buildTruthTable(parseTFL('(A & B) -> A'))
    const answers: Record<string, 'T' | 'F' | ''> = {}
    for (const [rowIndex, row] of table.rows.entries()) {
      for (const column of table.columns) answers[`${rowIndex}:${column.key}`] = row.values[column.key] ? 'T' : 'F'
    }
    expect(gradeTruthTable(table, answers).correct).toBe(true)
    const firstColumn = table.columns[0].key
    answers[`1:${firstColumn}`] = answers[`1:${firstColumn}`] === 'T' ? 'F' : 'T'
    expect(gradeTruthTable(table, answers)).toMatchObject({ correct: false, row: 2, column: firstColumn })
  })
})
