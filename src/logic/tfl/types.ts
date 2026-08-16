export type BinaryOperator = 'and' | 'or' | 'imp' | 'iff'

export type TFLFormula =
  | { type: 'atom'; name: string }
  | { type: 'bottom' }
  | { type: 'not'; operand: TFLFormula }
  | { type: 'binary'; operator: BinaryOperator; left: TFLFormula; right: TFLFormula }

export class FormulaSyntaxError extends Error {
  position: number

  constructor(message: string, position: number) {
    super(`${message} at position ${position + 1}`)
    this.name = 'FormulaSyntaxError'
    this.position = position
  }
}
