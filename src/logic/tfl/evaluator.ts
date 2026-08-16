import { renderTFL, structuralEqual } from './parser'
import type { TFLFormula } from './types'

export type Valuation = Record<string, boolean>

export function evaluateTFL(formula: TFLFormula, valuation: Valuation): boolean {
  if (formula.type === 'atom') return Boolean(valuation[formula.name])
  if (formula.type === 'bottom') return false
  if (formula.type === 'not') return !evaluateTFL(formula.operand, valuation)
  const left = evaluateTFL(formula.left, valuation)
  const right = evaluateTFL(formula.right, valuation)
  if (formula.operator === 'and') return left && right
  if (formula.operator === 'or') return left || right
  if (formula.operator === 'imp') return !left || right
  return left === right
}

export function collectAtoms(formula: TFLFormula): string[] {
  const atoms = new Set<string>()
  const visit = (node: TFLFormula) => {
    if (node.type === 'atom') atoms.add(node.name)
    if (node.type === 'not') visit(node.operand)
    if (node.type === 'binary') { visit(node.left); visit(node.right) }
  }
  visit(formula)
  return [...atoms].sort()
}

export function collectSubformulas(formula: TFLFormula): TFLFormula[] {
  const found: TFLFormula[] = []
  const add = (node: TFLFormula) => {
    if (node.type === 'not') add(node.operand)
    if (node.type === 'binary') { add(node.left); add(node.right) }
    if (!found.some((item) => structuralEqual(item, node))) found.push(node)
  }
  add(formula)
  return found
}

export function valuations(atoms: string[]): Valuation[] {
  const rowCount = 2 ** atoms.length
  return Array.from({ length: rowCount }, (_, row) => Object.fromEntries(atoms.map((atom, index) => [atom, Math.floor(row / 2 ** (atoms.length - index - 1)) % 2 === 0])))
}

export interface TruthTable {
  atoms: string[]
  columns: Array<{ key: string; formula: TFLFormula }>
  rows: Array<{ valuation: Valuation; values: Record<string, boolean> }>
}

export function buildTruthTable(formula: TFLFormula): TruthTable {
  const atoms = collectAtoms(formula)
  const columns = collectSubformulas(formula)
    .filter((node) => node.type !== 'atom')
    .map((node) => ({ key: renderTFL(node), formula: node }))
  return {
    atoms,
    columns,
    rows: valuations(atoms).map((valuation) => ({
      valuation,
      values: Object.fromEntries(columns.map((column) => [column.key, evaluateTFL(column.formula, valuation)])),
    })),
  }
}

export function classifyFormula(formula: TFLFormula): 'tautology' | 'contradiction' | 'contingent' {
  const results = valuations(collectAtoms(formula)).map((valuation) => evaluateTFL(formula, valuation))
  if (results.every(Boolean)) return 'tautology'
  if (results.every((value) => !value)) return 'contradiction'
  return 'contingent'
}

export function truthFunctionallyEquivalent(left: TFLFormula, right: TFLFormula): boolean {
  const atoms = [...new Set([...collectAtoms(left), ...collectAtoms(right)])].sort()
  return valuations(atoms).every((valuation) => evaluateTFL(left, valuation) === evaluateTFL(right, valuation))
}

export function argumentCounterexamples(premises: TFLFormula[], conclusion: TFLFormula): Valuation[] {
  const atoms = [...new Set([...premises.flatMap(collectAtoms), ...collectAtoms(conclusion)])].sort()
  return valuations(atoms).filter((valuation) => premises.every((premise) => evaluateTFL(premise, valuation)) && !evaluateTFL(conclusion, valuation))
}

export interface TableGrade {
  correct: boolean
  message: string
  row?: number
  column?: string
}

export function gradeTruthTable(table: TruthTable, answers: Record<string, 'T' | 'F' | ''>): TableGrade {
  for (const column of table.columns) {
    for (let row = 0; row < table.rows.length; row += 1) {
      const key = `${row}:${column.key}`
      const expected = table.rows[row].values[column.key] ? 'T' : 'F'
      if (answers[key] !== expected) {
        return { correct: false, row: row + 1, column: column.key, message: answers[key] ? `Row ${row + 1}: check the ${column.key} column. This is the earliest incorrect dependency.` : `Complete row ${row + 1} of the ${column.key} column.` }
      }
    }
  }
  return { correct: true, message: 'Every entered column follows from its dependencies.' }
}
