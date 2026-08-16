import { useMemo, useState } from 'react'
import { buildTruthTable, gradeTruthTable, type TableGrade } from '../logic/tfl/evaluator'
import { parseTFL, renderTFL } from '../logic/tfl/parser'

interface TruthTableEditorProps {
  formula: string
  disabled?: boolean
  onGrade: (grade: TableGrade, answer: string) => void
}

export function TruthTableEditor({ formula, disabled, onGrade }: TruthTableEditorProps) {
  const table = useMemo(() => buildTruthTable(parseTFL(formula)), [formula])
  const [answers, setAnswers] = useState<Record<string, 'T' | 'F' | ''>>({})

  const submit = () => {
    const grade = gradeTruthTable(table, answers)
    onGrade(grade, JSON.stringify(answers))
  }

  return (
    <div className="truth-editor">
      <div className="table-scroll" tabIndex={0} aria-label={`Truth table for ${renderTFL(parseTFL(formula))}`}>
        <table className="truth-table">
          <thead>
            <tr>
              {table.atoms.map((atom) => <th key={atom} scope="col" className="atom-column">{atom}</th>)}
              {table.columns.map((column) => <th key={column.key} scope="col" className="formula-column">{column.key}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {table.atoms.map((atom) => <td key={atom} className="given-cell">{row.valuation[atom] ? 'T' : 'F'}</td>)}
                {table.columns.map((column) => {
                  const key = `${rowIndex}:${column.key}`
                  return (
                    <td key={column.key}>
                      <label className="sr-only" htmlFor={`truth-${rowIndex}-${column.key}`}>Row {rowIndex + 1}, {column.key}</label>
                      <select id={`truth-${rowIndex}-${column.key}`} value={answers[key] ?? ''} disabled={disabled} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value as 'T' | 'F' | '' }))}>
                        <option value="">—</option><option value="T">T</option><option value="F">F</option>
                      </select>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="primary-button" type="button" disabled={disabled} onClick={submit}>Check table</button>
    </div>
  )
}
