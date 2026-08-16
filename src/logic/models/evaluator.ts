import type { FOLFormula, Term } from '../fol/types'

export interface FiniteModel {
  domain: string[]
  names: Record<string, string>
  predicates: Record<string, string[][]>
}

export interface EvaluationResult {
  value: boolean
  explanation: string
  witness?: string
}

function denotation(term: Term, model: FiniteModel, assignment: Record<string, string>): string {
  if (term.variable) {
    const value = assignment[term.name]
    if (!value) throw new Error(`Variable ${term.name} has no assignment.`)
    return value
  }
  const value = model.names[term.name]
  if (!value) throw new Error(`Name ${term.name} has no denotation in this model.`)
  return value
}

export function evaluateFOL(formula: FOLFormula, model: FiniteModel, assignment: Record<string, string> = {}): EvaluationResult {
  if (model.domain.length === 0) throw new Error('The domain must contain at least one object.')
  if (formula.type === 'bottom') return { value: false, explanation: '⊥ is false in every interpretation.' }
  if (formula.type === 'predicate') {
    const tuple = formula.terms.map((term) => denotation(term, model, assignment))
    const extension = model.predicates[formula.name] ?? []
    const value = extension.some((item) => item.length === tuple.length && item.every((entry, index) => entry === tuple[index]))
    return { value, explanation: `${formula.name}(${tuple.join(', ')}) is ${value ? '' : 'not '}in the extension of ${formula.name}.` }
  }
  if (formula.type === 'identity') {
    const left = denotation(formula.left, model, assignment)
    const right = denotation(formula.right, model, assignment)
    const value = left === right
    return { value, explanation: `${formula.left.name} denotes ${left} and ${formula.right.name} denotes ${right}; they ${value ? 'are' : 'are not'} the same object.` }
  }
  if (formula.type === 'not') {
    const inner = evaluateFOL(formula.operand, model, assignment)
    return { value: !inner.value, explanation: `The negated formula is ${inner.value ? 'true' : 'false'}, so the negation is ${inner.value ? 'false' : 'true'}. ${inner.explanation}` }
  }
  if (formula.type === 'binary') {
    const left = evaluateFOL(formula.left, model, assignment)
    const right = evaluateFOL(formula.right, model, assignment)
    const value = formula.operator === 'and' ? left.value && right.value : formula.operator === 'or' ? left.value || right.value : formula.operator === 'imp' ? !left.value || right.value : left.value === right.value
    const label = { and: 'conjunction', or: 'disjunction', imp: 'conditional', iff: 'biconditional' }[formula.operator]
    return { value, explanation: `The left side is ${left.value ? 'true' : 'false'} and the right side is ${right.value ? 'true' : 'false'}; therefore the ${label} is ${value ? 'true' : 'false'}.` }
  }
  if (formula.quantifier === 'exists') {
    for (const object of model.domain) {
      const result = evaluateFOL(formula.body, model, { ...assignment, [formula.variable]: object })
      if (result.value) return { value: true, witness: object, explanation: `${object} is a witness: the quantified condition is true when ${formula.variable} denotes ${object}.` }
    }
    return { value: false, explanation: `No object in the domain makes the quantified condition true.` }
  }
  for (const object of model.domain) {
    const result = evaluateFOL(formula.body, model, { ...assignment, [formula.variable]: object })
    if (!result.value) return { value: false, witness: object, explanation: `${object} is a counterexample: the quantified condition is false when ${formula.variable} denotes ${object}.` }
  }
  return { value: true, explanation: `Every object in the domain makes the quantified condition true.` }
}
