import { useState } from 'react'
import type { ModelExercise } from '../content/exercises'
import { parseFOL, renderFOL } from '../logic/fol/parser'
import { evaluateFOL, type EvaluationResult, type FiniteModel } from '../logic/models/evaluator'
import { FormulaInput } from '../components/FormulaInput'

interface ModelWorkspaceProps { initial?: ModelExercise | null }

function modelToText(model: FiniteModel) {
  return {
    domain: model.domain.join(', '),
    names: Object.entries(model.names).map(([name, object]) => `${name} = ${object}`).join('\n'),
    predicates: Object.entries(model.predicates).map(([name, tuples]) => `${name}: ${tuples.map((tuple) => tuple.join(',')).join('; ')}`).join('\n'),
  }
}

function parseModel(domainText: string, namesText: string, predicatesText: string): FiniteModel {
  const domain = domainText.split(',').map((entry) => entry.trim()).filter(Boolean)
  const names = Object.fromEntries(namesText.split('\n').map((line) => line.split('=').map((entry) => entry.trim())).filter((parts) => parts.length === 2 && parts.every(Boolean)) as [string, string][])
  const predicates: Record<string, string[][]> = {}
  for (const line of predicatesText.split('\n').map((entry) => entry.trim()).filter(Boolean)) {
    const separator = line.indexOf(':')
    if (separator < 1) continue
    const name = line.slice(0, separator).trim()
    predicates[name] = line.slice(separator + 1).split(';').map((tuple) => tuple.split(',').map((entry) => entry.trim()).filter(Boolean)).filter((tuple) => tuple.length > 0)
  }
  return { domain, names, predicates }
}

export function ModelWorkspace({ initial }: ModelWorkspaceProps) {
  const initialModel = initial?.model ?? { domain: ['Ada', 'Bo', 'Cy'], names: { a: 'Ada', b: 'Bo' }, predicates: { P: [['Ada'], ['Cy']], R: [['Ada', 'Bo'], ['Bo', 'Cy']] } }
  const text = modelToText(initialModel)
  const [domain, setDomain] = useState(text.domain)
  const [names, setNames] = useState(text.names)
  const [predicates, setPredicates] = useState(text.predicates)
  const [formula, setFormula] = useState(initial?.formula ?? '∀x(P(x) → ∃yR(x,y))')
  const [comparison, setComparison] = useState('')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [comparisonResult, setComparisonResult] = useState<EvaluationResult | null>(null)
  const [error, setError] = useState('')

  const evaluate = () => {
    try {
      const model = parseModel(domain, names, predicates)
      setResult(evaluateFOL(parseFOL(formula), model))
      setComparisonResult(comparison.trim() ? evaluateFOL(parseFOL(comparison), model) : null)
      setError('')
    } catch (caught) { setResult(null); setComparisonResult(null); setError(caught instanceof Error ? caught.message : 'The model or formula could not be evaluated.') }
  }

  return (
    <section className="workspace-page">
      <div className="workspace-heading"><div><p className="eyebrow">Finite interpretation</p><h1>Model workspace</h1><p>Define a nonempty domain, assign names, and set predicate or relation extensions. Evaluation is recursive and local.</p></div></div>
      <div className="model-workspace-grid">
        <section className="model-definition"><h2>Interpretation</h2><label>Domain <span className="input-help">comma-separated objects</span><input value={domain} onChange={(event) => setDomain(event.target.value)} /></label><label>Name assignments <span className="input-help">one per line: a = Ada</span><textarea rows={5} value={names} onChange={(event) => setNames(event.target.value)} /></label><label>Predicate extensions <span className="input-help">P: Ada; Bo or R: Ada,Bo; Bo,Cy</span><textarea rows={7} value={predicates} onChange={(event) => setPredicates(event.target.value)} /></label></section>
        <section className="model-evaluation"><h2>Evaluate</h2><label htmlFor="model-formula">FOL sentence</label><FormulaInput id="model-formula" language="fol" value={formula} onChange={setFormula} /><details><summary>Compare a second formula in this model</summary><label htmlFor="comparison-formula">Comparison formula</label><FormulaInput id="comparison-formula" language="fol" value={comparison} onChange={setComparison} /></details><button className="primary-button" onClick={evaluate}>Evaluate in model</button>{error && <p className="field-error" role="alert">{error}</p>}{result && <div className={`evaluation-result ${result.value ? 'is-true' : 'is-false'}`} role="status"><p className="feedback-label">{result.value ? 'T · True in this model' : 'F · False in this model'}</p><p>{result.explanation}</p>{result.witness && <p><strong>Relevant object:</strong> {result.witness}</p>}</div>}{comparisonResult && result && <div className="comparison-result"><h3>Comparison</h3><p><span className="formula-text">{renderFOL(parseFOL(formula))}</span> is {result.value ? 'true' : 'false'}; <span className="formula-text">{renderFOL(parseFOL(comparison))}</span> is {comparisonResult.value ? 'true' : 'false'}.</p><strong>{result.value === comparisonResult.value ? 'They agree in this model.' : 'They differ in this model.'}</strong></div>}</section>
      </div>
      <aside className="model-note"><strong>What this establishes</strong><p>A single model can witness satisfiability, non-equivalence, or invalidity. Agreement in one finite model does not establish general FOL equivalence.</p></aside>
    </section>
  )
}
