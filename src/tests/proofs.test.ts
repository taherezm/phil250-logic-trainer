import { describe, expect, it } from 'vitest'
import { checkProof, type ProofLine } from '../logic/proofs/checker'

const line = (formula: string, rule: string, citations = '', depth = 0, id = Math.random().toString()): ProofLine => ({ id, formula, rule, citations, depth })

describe('Fitch proof checker', () => {
  it('accepts a valid conjunction-elimination proof', () => {
    const result = checkProof([line('A ∧ B', 'PR'), line('B', '∧E', '1')], { premises: ['A ∧ B'], conclusion: 'B' })
    expect(result.complete).toBe(true)
    expect(result.lines.every((entry) => entry.valid)).toBe(true)
  })

  it('rejects a citation from a closed subproof', () => {
    const result = checkProof([
      line('A', 'AS', '', 1),
      line('A', 'R', '1', 1),
      line('A → A', '→I', '1-2', 0),
      line('A', 'R', '2', 0),
    ], { premises: [], conclusion: 'A' })
    expect(result.lines[3].valid).toBe(false)
    expect(result.lines[3].message).toMatch(/closed subproof/)
  })

  it('validates conditional introduction and discharge', () => {
    const result = checkProof([
      line('A', 'AS', '', 1),
      line('A', 'R', '1', 1),
      line('A → A', '→I', '1-2', 0),
    ], { premises: [], conclusion: 'A → A' })
    expect(result.complete).toBe(true)
  })

  it('supports sibling subproofs for disjunction elimination', () => {
    const result = checkProof([
      line('A ∨ B', 'PR'),
      line('C', 'PR'),
      line('A', 'AS', '', 1),
      line('C', 'R', '2', 1),
      line('B', 'AS', '', 1),
      line('C', 'R', '2', 1),
      line('C', '∨E', '1, 3-4, 5-6', 0),
    ], { premises: ['A ∨ B', 'C'], conclusion: 'C' })
    expect(result.complete).toBe(true)
  })

  it('enforces the arbitrary-name restriction on universal introduction', () => {
    const invalid = checkProof([
      line('P(a)', 'PR'),
      line('∀xP(x)', '∀I', '1'),
    ], { premises: ['P(a)'], conclusion: '∀xP(x)' })
    expect(invalid.lines[1].message).toMatch(/undischarged assumption/)

    const valid = checkProof([
      line('∀xP(x)', 'PR'),
      line('P(a)', '∀E', '1'),
      line('∀xP(x)', '∀I', '2'),
    ], { premises: ['∀xP(x)'], conclusion: '∀xP(x)' })
    expect(valid.complete).toBe(true)
  })

  it('enforces freshness for existential witnesses', () => {
    const valid = checkProof([
      line('∃xP(x)', 'PR'),
      line('Q', 'PR'),
      line('P(a)', 'AS', '', 1),
      line('Q', 'R', '2', 1),
      line('Q', '∃E', '1, 3-4', 0),
    ], { premises: ['∃xP(x)', 'Q'], conclusion: 'Q' })
    expect(valid.complete).toBe(true)

    const invalid = checkProof([
      line('∃xP(x)', 'PR'),
      line('P(a)', 'AS', '', 1),
      line('P(a)', 'R', '2', 1),
      line('P(a)', '∃E', '1, 2-3', 0),
    ], { premises: ['∃xP(x)'], conclusion: 'P(a)' })
    expect(invalid.lines[3].message).toMatch(/witness a occurs in the conclusion/)
  })

  it('rejects capture and validates identity elimination', () => {
    const capture = checkProof([
      line('∀x∃yR(x,y)', 'PR'),
      line('∃yR(y,y)', '∀E', '1'),
    ], { premises: ['∀x∃yR(x,y)'], conclusion: '∃yR(y,y)' })
    expect(capture.lines[1].valid).toBe(false)

    const identity = checkProof([
      line('a = b', 'PR'),
      line('P(a)', 'PR'),
      line('P(b)', '=E', '1, 2'),
    ], { premises: ['a = b', 'P(a)'], conclusion: 'P(b)' })
    expect(identity.complete).toBe(true)
  })
})
