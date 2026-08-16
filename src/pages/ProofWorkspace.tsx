import { useMemo, useRef, useState } from 'react'
import { proofExercises, type ProofExercise } from '../content/exercises'
import { proofRuleGroups, proofRules } from '../content/proofRules'
import { checkProof, type ProofLine } from '../logic/proofs/checker'

interface ProofWorkspaceProps { initial?: ProofExercise | null }

const blankLine = (id: number): ProofLine => ({ id: `line-${id}`, formula: '', rule: 'R', citations: '', depth: 0 })

function linesFor(exercise: ProofExercise): ProofLine[] {
  return [...exercise.premises.map((formula, index) => ({ id: `line-${index + 1}`, formula, rule: 'PR', citations: '', depth: 0 })), blankLine(exercise.premises.length + 1)]
}

export function ProofWorkspace({ initial }: ProofWorkspaceProps) {
  const fallback = proofExercises[0]
  const [problem, setProblem] = useState<ProofExercise>(initial ?? fallback)
  const [premises, setPremises] = useState((initial ?? fallback).premises.join('; '))
  const [conclusion, setConclusion] = useState((initial ?? fallback).conclusion)
  const [lines, setLines] = useState<ProofLine[]>(linesFor(initial ?? fallback))
  const [result, setResult] = useState<ReturnType<typeof checkProof> | null>(null)
  const [focusedLine, setFocusedLine] = useState(0)
  const nextId = useRef(lines.length + 1)
  const usesFOL = /[∀∃=]|[A-Z]\(/.test(`${premises} ${conclusion}`)

  const parsedPremises = useMemo(() => premises.split(';').map((entry) => entry.trim()).filter(Boolean), [premises])

  const loadProblem = (exercise: ProofExercise) => {
    setProblem(exercise); setPremises(exercise.premises.join('; ')); setConclusion(exercise.conclusion); setLines(linesFor(exercise)); setResult(null); nextId.current = exercise.premises.length + 2
  }

  const update = (index: number, patch: Partial<ProofLine>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line)); setResult(null)
  }
  const addLine = (after = lines.length - 1) => {
    const next = blankLine(nextId.current++)
    next.depth = lines[after]?.depth ?? 0
    setLines((current) => [...current.slice(0, after + 1), next, ...current.slice(after + 1)]); setResult(null)
  }
  const removeLine = (index: number) => { setLines((current) => current.filter((_, lineIndex) => lineIndex !== index)); setResult(null) }
  const move = (index: number, direction: -1 | 1) => {
    const destination = index + direction
    if (destination < 0 || destination >= lines.length) return
    setLines((current) => { const copy = [...current]; [copy[index], copy[destination]] = [copy[destination], copy[index]]; return copy }); setResult(null)
  }
  const insertSymbol = (symbol: string) => update(focusedLine, { formula: `${lines[focusedLine]?.formula ?? ''}${symbol}` })

  return (
    <section className="workspace-page">
      <div className="workspace-heading"><div><p className="eyebrow">Deterministic Fitch checker</p><h1>Proof workspace</h1><p>Build a derivation line by line. Formula syntax, rule application, citations, scope, discharge, and quantifier restrictions are checked locally.</p></div><label>Load exercise<select value={problem.id} onChange={(event) => { const next = proofExercises.find((item) => item.id === event.target.value); if (next) loadProblem(next) }}>{proofExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.prompt}</option>)}</select></label></div>

      <div className="problem-strip"><label>Premises <span className="input-help">separate with semicolons</span><input value={premises} onChange={(event) => { setPremises(event.target.value); setResult(null) }} aria-label="Proof premises" /></label><span aria-hidden="true">∴</span><label>Conclusion<input className="formula-text" value={conclusion} onChange={(event) => { setConclusion(event.target.value); setResult(null) }} aria-label="Proof conclusion" /></label></div>

      <div className="symbol-toolbar" aria-label="Formula symbols">{['¬', '∧', '∨', '→', '↔', '⊥', ...(usesFOL ? ['∀', '∃', '='] : [])].map((symbol) => <button key={symbol} type="button" onClick={() => insertSymbol(symbol)}>{symbol}</button>)}</div>

      <div className="proof-editor" role="region" aria-label="Fitch proof editor">
        <div className="proof-grid proof-grid-header" aria-hidden="true"><span>Line</span><span>Scope</span><span>Formula</span><span>Rule</span><span>Citations</span><span>Actions</span></div>
        {lines.map((line, index) => {
          const lineResult = result?.lines.find((entry) => entry.line === index + 1)
          return (
            <div key={line.id} className={`proof-line-wrap ${lineResult ? lineResult.valid ? 'line-valid' : 'line-invalid' : ''}`}>
              <div className="proof-grid proof-line" style={{ '--proof-depth': line.depth } as React.CSSProperties}>
                <span className="line-number">{index + 1}</span>
                <div className="depth-controls"><button type="button" aria-label={`Decrease indentation on line ${index + 1}`} disabled={line.depth === 0} onClick={() => update(index, { depth: Math.max(0, line.depth - 1) })}>−</button><output aria-label={`Scope depth ${line.depth}`}>{line.depth}</output><button type="button" aria-label={`Increase indentation on line ${index + 1}`} onClick={() => update(index, { depth: line.depth + 1 })}>+</button></div>
                <input className="proof-formula formula-text" aria-label={`Formula line ${index + 1}`} value={line.formula} onFocus={() => setFocusedLine(index)} onChange={(event) => update(index, { formula: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLine(index) } if (event.altKey && event.key === 'ArrowUp') move(index, -1); if (event.altKey && event.key === 'ArrowDown') move(index, 1) }} />
                <select aria-label={`Rule line ${index + 1}`} value={line.rule} onChange={(event) => update(index, { rule: event.target.value })}>{proofRuleGroups.map((group) => <optgroup key={group.id} label={group.label}>{proofRules.filter((rule) => rule.group === group.id).map((rule) => <option key={rule.id} value={rule.id}>{rule.label}</option>)}</optgroup>)}</select>
                <input aria-label={`Citations line ${index + 1}`} value={line.citations} onChange={(event) => update(index, { citations: event.target.value })} placeholder="1, 2–4" />
                <div className="line-actions"><button type="button" aria-label={`Move line ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Move line ${index + 1} down`} disabled={index === lines.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" aria-label={`Delete line ${index + 1}`} onClick={() => removeLine(index)}>×</button></div>
              </div>
              {lineResult && <p className="line-feedback"><strong>{lineResult.valid ? 'Valid.' : 'Needs revision.'}</strong> {lineResult.message}</p>}
            </div>
          )
        })}
        <button className="add-proof-line" type="button" onClick={() => addLine()}>+ Add proof line</button>
      </div>
      <div className="workspace-actions"><button className="primary-button" onClick={() => setResult(checkProof(lines, { premises: parsedPremises, conclusion }))}>Check proof</button><p className="input-help">Enter adds a line · Option/Alt + ↑/↓ reorders a focused line · ranges use 2–4</p></div>
      {result && <div className={`proof-summary ${result.complete ? 'is-complete' : ''}`} role="status"><strong>{result.complete ? '✓ Proof complete' : result.valid ? 'Valid so far' : 'Needs revision'}</strong><p>{result.message}</p></div>}

      <details className="rule-reference"><summary>Rule availability and restrictions</summary><div className="rule-reference-grid">{proofRuleGroups.map((group) => <section key={group.id}><h2>{group.label}</h2>{proofRules.filter((rule) => rule.group === group.id).map((rule) => <p key={rule.id}><strong>{rule.id}</strong> — {rule.description}</p>)}</section>)}</div><p>Current Calgary convention: IP is the basic classical rule; DNE and LEM are listed as derived. Course-specific derived-rule availability remains configurable in <span className="formula-text">proofRules.ts</span>.</p></details>
    </section>
  )
}
