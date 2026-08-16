import type { BinaryOperator } from '../tfl/types'

export type Term = { type: 'term'; name: string; variable: boolean }

export type FOLFormula =
  | { type: 'predicate'; name: string; terms: Term[] }
  | { type: 'identity'; left: Term; right: Term }
  | { type: 'bottom' }
  | { type: 'not'; operand: FOLFormula }
  | { type: 'binary'; operator: BinaryOperator; left: FOLFormula; right: FOLFormula }
  | { type: 'quantifier'; quantifier: 'forall' | 'exists'; variable: string; body: FOLFormula }

export type AnyFormula = FOLFormula
