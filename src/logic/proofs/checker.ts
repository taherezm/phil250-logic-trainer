import { proofRules } from '../../content/proofRules'
import { namesInFormula, parseFOL, renderFOL, substitute } from '../fol/parser'
import type { FOLFormula, Term } from '../fol/types'
import { parseTFL, renderTFL, structuralEqual } from '../tfl/parser'
import type { TFLFormula } from '../tfl/types'

export interface ProofLine {
  id: string
  formula: string
  rule: string
  citations: string
  depth: number
}

export interface ProofProblem {
  premises: string[]
  conclusion: string
}

export interface LineResult {
  line: number
  valid: boolean
  message: string
}

export interface ProofResult {
  valid: boolean
  complete: boolean
  lines: LineResult[]
  message: string
}

type Formula = TFLFormula | FOLFormula
type ScopedLine = ProofLine & { number: number; path: number[]; parsed?: Formula }
type Citation = { lines: number[]; ranges: Array<[number, number]> }

function isFOL(formula: Formula): formula is FOLFormula {
  return ['predicate', 'identity', 'quantifier'].includes(formula.type) || (formula.type === 'not' && isFOL(formula.operand as Formula)) || (formula.type === 'binary' && (isFOL(formula.left as Formula) || isFOL(formula.right as Formula)))
}

function parseFormula(value: string): Formula {
  if (/[∀∃=≠]|[A-Z][A-Z0-9_]*\s*\(|[A-Z][a-z]|\b[uvwxyz]\b/.test(value)) return parseFOL(value)
  return parseTFL(value)
}

function renderFormula(formula: Formula): string {
  return isFOL(formula) ? renderFOL(formula) : renderTFL(formula)
}

function equal(left: Formula, right: Formula): boolean {
  if (isFOL(left) || isFOL(right)) return renderFormula(left) === renderFormula(right)
  return structuralEqual(left, right)
}

function parseCitations(value: string): Citation {
  const result: Citation = { lines: [], ranges: [] }
  for (const part of value.split(',').map((item) => item.trim()).filter(Boolean)) {
    const range = part.match(/^(\d+)\s*[-–]\s*(\d+)$/)
    if (range) result.ranges.push([Number(range[1]), Number(range[2])])
    else if (/^\d+$/.test(part)) result.lines.push(Number(part))
    else throw new Error(`“${part}” is not a line or range citation.`)
  }
  return result
}

function annotate(lines: ProofLine[]): { lines: ScopedLine[]; structuralErrors: Map<number, string> } {
  const stack: number[] = []
  const structuralErrors = new Map<number, string>()
  const scoped = lines.map((line, index) => {
    const number = index + 1
    const depth = Math.max(0, Math.floor(line.depth))
    if (depth > stack.length + 1) structuralErrors.set(number, 'A proof may open only one subproof level at a time.')
    if (line.rule === 'AS') {
      if (depth === 0) structuralErrors.set(number, 'An assumption must be indented to open a subproof.')
      else if (depth > stack.length) stack.push(number)
      else { stack.splice(depth - 1); stack.push(number) }
    } else {
      if (depth > stack.length) structuralErrors.set(number, 'The first line of a subproof must be marked AS.')
      if (depth < stack.length) stack.splice(depth)
    }
    return { ...line, depth, number, path: stack.slice(0, depth) }
  })
  return { lines: scoped, structuralErrors }
}

function isPrefix(prefix: number[], path: number[]) {
  return prefix.length <= path.length && prefix.every((entry, index) => entry === path[index])
}

function citedLine(scoped: ScopedLine[], current: ScopedLine, number: number): ScopedLine {
  const cited = scoped[number - 1]
  if (!cited || number >= current.number) throw new Error(`Line ${number} must occur before line ${current.number}.`)
  if (!isPrefix(cited.path, current.path)) throw new Error(`Line ${number} is inside a closed subproof and cannot be cited here.`)
  if (!cited.parsed) throw new Error(`Line ${number} does not contain a well-formed formula.`)
  return cited
}

function citedRange(scoped: ScopedLine[], current: ScopedLine, range: [number, number]): [ScopedLine, ScopedLine] {
  const [startNumber, endNumber] = range
  const start = scoped[startNumber - 1]
  const end = scoped[endNumber - 1]
  if (!start || !end || startNumber >= endNumber || endNumber >= current.number) throw new Error(`Range ${startNumber}–${endNumber} must be a completed earlier subproof.`)
  if (start.rule !== 'AS') throw new Error(`Line ${startNumber} must be the assumption that opens the cited subproof.`)
  if (start.path.at(-1) !== startNumber || !isPrefix(start.path, end.path)) throw new Error(`Range ${startNumber}–${endNumber} is not one continuous subproof.`)
  const parentPath = start.path.slice(0, -1)
  if (parentPath.length !== current.path.length || !isPrefix(parentPath, current.path)) throw new Error(`Subproof ${startNumber}–${endNumber} is not accessible at line ${current.number}.`)
  if (end.path.length !== start.path.length) throw new Error(`The final line of range ${startNumber}–${endNumber} is inside a nested subproof.`)
  if (!start.parsed || !end.parsed) throw new Error(`Range ${startNumber}–${endNumber} contains an unusable endpoint.`)
  return [start, end]
}

function requireCounts(citation: Citation, lines: number, ranges: number) {
  if (citation.lines.length !== lines || citation.ranges.length !== ranges) throw new Error(`This rule requires ${lines ? `${lines} line citation${lines === 1 ? '' : 's'}` : ''}${lines && ranges ? ' and ' : ''}${ranges ? `${ranges} subproof range${ranges === 1 ? '' : 's'}` : ''}.`)
}

function asBinary(formula: Formula, operator: string) {
  return formula.type === 'binary' && formula.operator === operator ? formula : undefined
}

function asNegation(formula: Formula) { return formula.type === 'not' ? formula : undefined }
function isBottom(formula: Formula) { return formula.type === 'bottom' }

function termsIn(formula: FOLFormula): Term[] {
  if (formula.type === 'predicate') return formula.terms
  if (formula.type === 'identity') return [formula.left, formula.right]
  if (formula.type === 'not') return termsIn(formula.operand)
  if (formula.type === 'binary') return [...termsIn(formula.left), ...termsIn(formula.right)]
  if (formula.type === 'quantifier') return termsIn(formula.body)
  return []
}

function instantiatedBy(body: FOLFormula, variable: string, instance: Formula): Term | undefined {
  if (isFOL(instance)) {
    if (renderFOL(body) === renderFOL(instance)) return { type: 'term', name: '', variable: false }
    const candidates = [...new Map(termsIn(instance).map((term) => [term.name, term])).values()]
    return candidates.find((term) => renderFOL(substitute(body, variable, term)) === renderFOL(instance))
  }
  return undefined
}

function validNameSubstitution(source: FOLFormula, target: FOLFormula, from: string, to: string): { valid: boolean; changed: boolean } {
  const term = (left: Term, right: Term) => ({ valid: left.name === right.name && left.variable === right.variable || (!left.variable && left.name === from && !right.variable && right.name === to), changed: !left.variable && left.name === from && !right.variable && right.name === to })
  if (source.type !== target.type) return { valid: false, changed: false }
  if (source.type === 'bottom' && target.type === 'bottom') return { valid: true, changed: false }
  if (source.type === 'predicate' && target.type === 'predicate') {
    if (source.name !== target.name || source.terms.length !== target.terms.length) return { valid: false, changed: false }
    const results = source.terms.map((item, index) => term(item, target.terms[index]))
    return { valid: results.every((result) => result.valid), changed: results.some((result) => result.changed) }
  }
  if (source.type === 'identity' && target.type === 'identity') {
    const left = term(source.left, target.left); const right = term(source.right, target.right)
    return { valid: left.valid && right.valid, changed: left.changed || right.changed }
  }
  if (source.type === 'not' && target.type === 'not') return validNameSubstitution(source.operand, target.operand, from, to)
  if (source.type === 'binary' && target.type === 'binary') {
    if (source.operator !== target.operator) return { valid: false, changed: false }
    const left = validNameSubstitution(source.left, target.left, from, to); const right = validNameSubstitution(source.right, target.right, from, to)
    return { valid: left.valid && right.valid, changed: left.changed || right.changed }
  }
  if (source.type === 'quantifier' && target.type === 'quantifier') {
    if (source.quantifier !== target.quantifier || source.variable !== target.variable) return { valid: false, changed: false }
    return validNameSubstitution(source.body, target.body, from, to)
  }
  return { valid: false, changed: false }
}

function validateRule(current: ScopedLine, scoped: ScopedLine[], problem: ProofProblem): string {
  const target = current.parsed!
  if (!proofRules.some((rule) => rule.id === current.rule)) throw new Error('Select a recognized proof rule.')
  const citation = parseCitations(current.citations)
  const lines = citation.lines.map((number) => citedLine(scoped, current, number))
  const ranges = citation.ranges.map((range) => citedRange(scoped, current, range))
  const formulas = lines.map((line) => line.parsed!)

  if (current.rule === 'PR') {
    requireCounts(citation, 0, 0)
    if (current.depth !== 0) throw new Error('Premises must occur at the outermost scope.')
    if (!problem.premises.some((premise) => equal(parseFormula(premise), target))) throw new Error('This formula is not one of the stated premises.')
    return 'Premise accepted.'
  }
  if (current.rule === 'AS') {
    requireCounts(citation, 0, 0)
    if (current.depth === 0) throw new Error('An assumption must open an indented subproof.')
    return 'Assumption opens a subproof.'
  }
  if (current.rule === 'R') {
    requireCounts(citation, 1, 0)
    if (!equal(target, formulas[0])) throw new Error('Reiteration must repeat the cited formula exactly.')
    return 'The cited formula is accessible and has been reiterated.'
  }
  if (current.rule === '∧I') {
    requireCounts(citation, 2, 0); const conjunction = asBinary(target, 'and')
    if (!conjunction || !((equal(conjunction.left, formulas[0]) && equal(conjunction.right, formulas[1])) || (equal(conjunction.left, formulas[1]) && equal(conjunction.right, formulas[0])))) throw new Error('∧I requires both conjuncts as cited formulas.')
    return 'Both cited formulas support this conjunction.'
  }
  if (current.rule === '∧E') {
    requireCounts(citation, 1, 0); const conjunction = asBinary(formulas[0], 'and')
    if (!conjunction) throw new Error('∧E requires a conjunction as its cited formula.')
    if (!equal(target, conjunction.left) && !equal(target, conjunction.right)) throw new Error('∧E may infer either conjunct, and this formula is neither one.')
    return 'The formula is one conjunct of the cited conjunction.'
  }
  if (current.rule === '∨I') {
    requireCounts(citation, 1, 0); const disjunction = asBinary(target, 'or')
    if (!disjunction || (!equal(disjunction.left, formulas[0]) && !equal(disjunction.right, formulas[0]))) throw new Error('∨I requires the cited formula to appear as one disjunct.')
    return 'The cited formula licenses the disjunction.'
  }
  if (current.rule === '→E') {
    requireCounts(citation, 2, 0)
    const pairs = [[formulas[0], formulas[1]], [formulas[1], formulas[0]]] as const
    if (!pairs.some(([candidate, antecedent]) => { const conditional = asBinary(candidate, 'imp'); return conditional && equal(conditional.left, antecedent) && equal(conditional.right, target) })) throw new Error('→E requires a conditional and its antecedent; the result must be its consequent.')
    return 'The conditional and its antecedent support the consequent.'
  }
  if (current.rule === '→I') {
    requireCounts(citation, 0, 1); const conditional = asBinary(target, 'imp'); const [start, end] = ranges[0]
    if (!conditional || !equal(conditional.left, start.parsed!) || !equal(conditional.right, end.parsed!)) throw new Error(`This subproof establishes ${renderFormula(end.parsed!)} from ${renderFormula(start.parsed!)}, so it cannot justify this conditional.`)
    return `This subproof establishes ${renderFormula(end.parsed!)} from ${renderFormula(start.parsed!)}, justifying the conditional.`
  }
  if (current.rule === '¬E') {
    requireCounts(citation, 2, 0)
    if (!isBottom(target)) throw new Error('¬E concludes ⊥.')
    if (!((asNegation(formulas[0]) && equal((formulas[0] as { type: 'not'; operand: Formula }).operand, formulas[1])) || (asNegation(formulas[1]) && equal((formulas[1] as { type: 'not'; operand: Formula }).operand, formulas[0])))) throw new Error('¬E requires a formula and its negation.')
    return 'The cited formulas contradict one another.'
  }
  if (current.rule === '¬I' || current.rule === 'IP') {
    requireCounts(citation, 0, 1); const [start, end] = ranges[0]
    if (!isBottom(end.parsed!)) throw new Error(`${current.rule} requires the cited subproof to end with ⊥.`)
    if (current.rule === '¬I') {
      const negation = asNegation(target)
      if (!negation || !equal(negation.operand, start.parsed!)) throw new Error('¬I concludes the negation of the subproof assumption.')
    } else {
      const assumedNegation = asNegation(start.parsed!)
      if (!assumedNegation || !equal(assumedNegation.operand, target)) throw new Error('IP must assume the negation of the formula it concludes.')
    }
    return 'The contradiction discharges the cited assumption.'
  }
  if (current.rule === 'X') {
    requireCounts(citation, 1, 0)
    if (!isBottom(formulas[0])) throw new Error('Explosion requires ⊥ as its cited formula.')
    return 'Any formula follows from ⊥ by explosion.'
  }
  if (current.rule === '↔E') {
    requireCounts(citation, 2, 0)
    const pairs = [[formulas[0], formulas[1]], [formulas[1], formulas[0]]] as const
    if (!pairs.some(([candidate, side]) => { const biconditional = asBinary(candidate, 'iff'); return biconditional && ((equal(biconditional.left, side) && equal(biconditional.right, target)) || (equal(biconditional.right, side) && equal(biconditional.left, target))) })) throw new Error('↔E requires a biconditional and one side to infer the other.')
    return 'One direction of the biconditional applies.'
  }
  if (current.rule === '↔I') {
    requireCounts(citation, 0, 2); const biconditional = asBinary(target, 'iff')
    const [[aStart, aEnd], [bStart, bEnd]] = ranges
    if (!biconditional || !equal(aStart.parsed!, biconditional.left) || !equal(aEnd.parsed!, biconditional.right) || !equal(bStart.parsed!, biconditional.right) || !equal(bEnd.parsed!, biconditional.left)) throw new Error('↔I needs one subproof in each direction.')
    return 'The two subproofs establish both directions.'
  }
  if (current.rule === '∨E') {
    requireCounts(citation, 1, 2); const disjunction = asBinary(formulas[0], 'or'); const [[aStart, aEnd], [bStart, bEnd]] = ranges
    if (!disjunction || !equal(aStart.parsed!, disjunction.left) || !equal(bStart.parsed!, disjunction.right) || !equal(aEnd.parsed!, target) || !equal(bEnd.parsed!, target)) throw new Error('∨E needs a disjunction and one subproof from each disjunct to the same result.')
    return 'Each disjunct leads to the same result.'
  }
  if (current.rule === 'DNE') {
    requireCounts(citation, 1, 0); const outer = asNegation(formulas[0]); const inner = outer && asNegation(outer.operand)
    if (!inner || !equal(inner.operand, target)) throw new Error('DNE requires a double negation of this formula.')
    return 'The double negation has been eliminated.'
  }
  if (current.rule === 'DS') {
    requireCounts(citation, 2, 0)
    const pairs = [[formulas[0], formulas[1]], [formulas[1], formulas[0]]] as const
    if (!pairs.some(([candidate, negated]) => { const disjunction = asBinary(candidate, 'or'); const negation = asNegation(negated); return disjunction && negation && ((equal(negation.operand, disjunction.left) && equal(target, disjunction.right)) || (equal(negation.operand, disjunction.right) && equal(target, disjunction.left))) })) throw new Error('DS requires a disjunction and the negation of one disjunct.')
    return 'The remaining disjunct follows by DS.'
  }
  if (current.rule === 'MT') {
    requireCounts(citation, 2, 0)
    const pairs = [[formulas[0], formulas[1]], [formulas[1], formulas[0]]] as const
    const targetNegation = asNegation(target)
    if (!targetNegation || !pairs.some(([candidate, negated]) => { const conditional = asBinary(candidate, 'imp'); const negation = asNegation(negated); return conditional && negation && equal(negation.operand, conditional.right) && equal(targetNegation.operand, conditional.left) })) throw new Error('MT requires A → B and ¬B to infer ¬A.')
    return 'The antecedent is denied by modus tollens.'
  }
  if (current.rule === 'DeM') {
    requireCounts(citation, 1, 0)
    const sourceText = renderFormula(formulas[0]); const targetText = renderFormula(target)
    const recognizable = [sourceText, targetText].some((text) => text.includes('¬(') && (text.includes(' ∧ ') || text.includes(' ∨ ')))
    if (!recognizable) throw new Error('DeM requires one of the De Morgan equivalence patterns.')
    try {
      const sourceTFL = parseTFL(sourceText); const targetTFL = parseTFL(targetText)
      const { truthFunctionallyEquivalent } = requireTflEvaluator()
      if (!truthFunctionallyEquivalent(sourceTFL, targetTFL)) throw new Error('The formulas are not the corresponding De Morgan forms.')
    } catch { throw new Error('The formulas are not the corresponding De Morgan forms.') }
    return 'The formula is the corresponding De Morgan form.'
  }
  if (current.rule === 'LEM') {
    requireCounts(citation, 0, 2); const [[aStart, aEnd], [bStart, bEnd]] = ranges; const negation = asNegation(bStart.parsed!)
    if (!negation || !equal(negation.operand, aStart.parsed!) || !equal(aEnd.parsed!, target) || !equal(bEnd.parsed!, target)) throw new Error('LEM needs subproofs from A and ¬A to the same result.')
    return 'Both exhaustive cases establish the result.'
  }
  if (current.rule === '∀E' || current.rule === '∃I') {
    requireCounts(citation, 1, 0)
    const quantified = current.rule === '∀E' ? formulas[0] : target
    const instance = current.rule === '∀E' ? target : formulas[0]
    if (!isFOL(quantified) || quantified.type !== 'quantifier' || quantified.quantifier !== (current.rule === '∀E' ? 'forall' : 'exists')) throw new Error(`${current.rule} requires the appropriate quantified formula.`)
    if (!instantiatedBy(quantified.body, quantified.variable, instance)) throw new Error('The instance does not result from a consistent, capture-free substitution.')
    return 'The quantified formula and its instance match by substitution.'
  }
  if (current.rule === '∀I') {
    requireCounts(citation, 1, 0)
    if (!isFOL(target) || target.type !== 'quantifier' || target.quantifier !== 'forall') throw new Error('∀I must conclude a universal formula.')
    const arbitrary = instantiatedBy(target.body, target.variable, formulas[0])
    if (!arbitrary || arbitrary.variable) throw new Error('The cited formula is not an instance using an arbitrary name.')
    const openAssumptions = scoped.slice(0, current.number - 1).filter((line) => (line.rule === 'PR' || line.rule === 'AS') && line.parsed && isPrefix(line.path, current.path))
    if (arbitrary.name && openAssumptions.some((line) => isFOL(line.parsed!) && namesInFormula(line.parsed! as FOLFormula).has(arbitrary.name))) throw new Error(`∀I cannot use ${arbitrary.name}: it occurs in an undischarged assumption.`)
    return arbitrary.name ? `${arbitrary.name} is arbitrary, so universal introduction is permitted.` : 'The quantified variable is vacuous, so universal introduction adds no name restriction.'
  }
  if (current.rule === '∃E') {
    requireCounts(citation, 1, 1); const existential = formulas[0]; const [start, end] = ranges[0]
    if (!isFOL(existential) || existential.type !== 'quantifier' || existential.quantifier !== 'exists') throw new Error('∃E requires an existential formula.')
    const witness = instantiatedBy(existential.body, existential.variable, start.parsed!)
    if (!witness || witness.variable) throw new Error('The subproof assumption must be an instance using a witness name.')
    if (!equal(end.parsed!, target)) throw new Error('∃E must conclude the final formula of the witness subproof.')
    if (witness.name && namesInFormula(existential).has(witness.name)) throw new Error(`The ∃E witness ${witness.name} occurs in the existential premise.`)
    if (witness.name && isFOL(target) && namesInFormula(target).has(witness.name)) throw new Error(`The ∃E witness ${witness.name} occurs in the conclusion.`)
    const outsideAssumptions = scoped.slice(0, current.number - 1).filter((line) => (line.rule === 'PR' || line.rule === 'AS') && line.number !== start.number && line.parsed && isPrefix(line.path, current.path))
    if (witness.name && outsideAssumptions.some((line) => isFOL(line.parsed!) && namesInFormula(line.parsed! as FOLFormula).has(witness.name))) throw new Error(`The ∃E witness ${witness.name} occurs in an undischarged assumption.`)
    return witness.name ? `${witness.name} is a fresh witness and does not escape the subproof.` : 'The existential is vacuous, so no witness name can escape the subproof.'
  }
  if (current.rule === '=I') {
    requireCounts(citation, 0, 0)
    if (!isFOL(target) || target.type !== 'identity' || target.left.name !== target.right.name) throw new Error('=I may infer only a self-identity such as a = a.')
    return 'Every object is self-identical.'
  }
  if (current.rule === '=E') {
    requireCounts(citation, 2, 0)
    const equalityIndex = formulas.findIndex((formula) => isFOL(formula) && formula.type === 'identity')
    if (equalityIndex < 0 || !isFOL(target)) throw new Error('=E requires an identity and a formula containing one of its names.')
    const identity = formulas[equalityIndex] as Extract<FOLFormula, { type: 'identity' }>; const source = formulas[1 - equalityIndex]
    if (!isFOL(source) || identity.left.variable || identity.right.variable) throw new Error('=E requires names on the cited identity line.')
    const forward = validNameSubstitution(source, target, identity.left.name, identity.right.name); const backward = validNameSubstitution(source, target, identity.right.name, identity.left.name)
    if (!(forward.valid && forward.changed) && !(backward.valid && backward.changed)) throw new Error('The result must replace at least one occurrence of one identical name with the other in the cited formula.')
    return 'The identical names have been substituted consistently.'
  }
  if (current.rule === 'CQ') {
    requireCounts(citation, 1, 0)
    if (!isFOL(formulas[0]) || !isFOL(target)) throw new Error('CQ applies to quantified FOL formulas.')
    const source = renderFOL(formulas[0]); const result = renderFOL(target)
    const conversions = quantifierConversions(formulas[0] as FOLFormula)
    if (!conversions.includes(result)) throw new Error('This is not one of the permitted quantifier-conversion forms.')
    return `CQ converts ${source} to the corresponding negated quantifier form.`
  }
  throw new Error('This rule is listed but does not yet have a checker.')
}

function requireTflEvaluator() {
  return { truthFunctionallyEquivalent: (left: TFLFormula, right: TFLFormula) => {
    const atoms = new Set<string>()
    const collect = (f: TFLFormula) => { if (f.type === 'atom') atoms.add(f.name); else if (f.type === 'not') collect(f.operand); else if (f.type === 'binary') { collect(f.left); collect(f.right) } }
    collect(left); collect(right)
    const names = [...atoms]
    const evaluate = (f: TFLFormula, valuation: Record<string, boolean>): boolean => f.type === 'atom' ? valuation[f.name] : f.type === 'bottom' ? false : f.type === 'not' ? !evaluate(f.operand, valuation) : f.operator === 'and' ? evaluate(f.left, valuation) && evaluate(f.right, valuation) : f.operator === 'or' ? evaluate(f.left, valuation) || evaluate(f.right, valuation) : f.operator === 'imp' ? !evaluate(f.left, valuation) || evaluate(f.right, valuation) : evaluate(f.left, valuation) === evaluate(f.right, valuation)
    return Array.from({ length: 2 ** names.length }, (_, index) => Object.fromEntries(names.map((name, bit) => [name, Boolean(index & (1 << bit))]))).every((valuation) => evaluate(left, valuation) === evaluate(right, valuation))
  } }
}

function quantifierConversions(formula: FOLFormula): string[] {
  const results: string[] = []
  if (formula.type === 'quantifier' && formula.body.type === 'not') {
    const opposite = formula.quantifier === 'forall' ? 'exists' : 'forall'
    results.push(renderFOL({ type: 'not', operand: { type: 'quantifier', quantifier: opposite, variable: formula.variable, body: formula.body.operand } }))
  }
  if (formula.type === 'not' && formula.operand.type === 'quantifier') {
    const quantifier = formula.operand
    const opposite = quantifier.quantifier === 'forall' ? 'exists' : 'forall'
    results.push(renderFOL({ type: 'quantifier', quantifier: opposite, variable: quantifier.variable, body: { type: 'not', operand: quantifier.body } }))
  }
  return results
}

export function checkProof(inputLines: ProofLine[], problem: ProofProblem): ProofResult {
  const { lines, structuralErrors } = annotate(inputLines)
  const results: LineResult[] = []
  for (const line of lines) {
    if (structuralErrors.has(line.number)) { results.push({ line: line.number, valid: false, message: structuralErrors.get(line.number)! }); continue }
    try { line.parsed = parseFormula(line.formula) } catch (error) { results.push({ line: line.number, valid: false, message: error instanceof Error ? error.message : 'Invalid formula.' }); continue }
    try { results.push({ line: line.number, valid: true, message: validateRule(line, lines, problem) }) } catch (error) { results.push({ line: line.number, valid: false, message: error instanceof Error ? error.message : 'Invalid rule application.' }) }
  }
  const allValid = results.length > 0 && results.every((result) => result.valid)
  const last = lines.at(-1)
  let complete = false
  if (allValid && last?.parsed && last.depth === 0) {
    try { complete = equal(last.parsed, parseFormula(problem.conclusion)) } catch { complete = false }
  }
  const message = !allValid ? 'At least one proof line needs revision.' : complete ? 'Proof complete: the conclusion is derived at the outermost scope.' : 'Every entered line is valid, but the stated conclusion has not yet been derived at the outermost scope.'
  return { valid: allValid, complete, lines: results, message }
}
