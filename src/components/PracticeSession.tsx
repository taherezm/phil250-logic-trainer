import { useEffect, useMemo, useState } from 'react'
import { exercises, generatedTruthExercise, modelExercises, proofExercises, type Difficulty, type Exercise, type FormulaExercise } from '../content/exercises'
import { parseFOL, renderFOL } from '../logic/fol/parser'
import { parseTFL, renderTFL, structuralEqual } from '../logic/tfl/parser'
import { truthFunctionallyEquivalent, type TableGrade } from '../logic/tfl/evaluator'
import { clearSessionDraft, recordAttempt, saveSessionDraft } from '../storage/progress'
import { FormulaInput } from './FormulaInput'
import type { PracticeConfig } from './PracticeSetup'
import { TruthTableEditor } from './TruthTableEditor'

interface PracticeSessionProps {
  selected: string[]
  config: PracticeConfig
  resumeIds?: string[]
  resumeIndex?: number
  onFinish: () => void
  onOpenProof: (exercise: Extract<Exercise, { kind: 'proof' }>) => void
  onOpenModel: (exercise: Extract<Exercise, { kind: 'model' }>) => void
}

type Feedback = { correct: boolean; message: string; expected: string; answer: string }

function resolveExercise(id: string): Exercise | undefined {
  const found = [...exercises, ...proofExercises, ...modelExercises].find((exercise) => exercise.id === id)
  if (found) return found
  const match = id.match(/^truth-generated-(introductory|intermediate|advanced)-(\d+)$/)
  return match ? generatedTruthExercise(Number(match[2]), match[1] as Difficulty) : undefined
}

function buildSet(selected: string[], config: PracticeConfig): Exercise[] {
  const allowedDifficulties: Difficulty[] = config.difficulty === 'mixed' ? ['introductory', 'intermediate', 'advanced'] : [config.difficulty]
  const pool = [...exercises, ...proofExercises, ...modelExercises].filter((exercise) => selected.includes(exercise.subskill) && allowedDifficulties.includes(exercise.difficulty))
  const wantsTruth = selected.some((id) => ['connective-values', 'complete-table', 'classification', 'semantic-tests'].includes(id))
  if (wantsTruth) {
    for (let seed = 1; seed <= Math.max(5, config.length); seed += 1) pool.push(generatedTruthExercise(seed, allowedDifficulties[(seed - 1) % allowedDifficulties.length]))
  }
  const fallbacks = [...exercises, ...proofExercises, ...modelExercises].filter((exercise) => selected.includes(exercise.subskill))
  const source = pool.length > 0 ? pool : fallbacks
  if (source.length === 0) return []
  const bySubskill = selected.map((subskill) => source.filter((exercise) => exercise.subskill === subskill)).filter((items) => items.length > 0)
  if (bySubskill.length === 0) return Array.from({ length: config.length }, (_, index) => source[index % source.length])
  const step = Math.max(1, Math.floor(bySubskill.length / config.length))
  const uses = new Map<number, number>()
  return Array.from({ length: config.length }, (_, index) => {
    const groupIndex = (index * step) % bySubskill.length
    const group = bySubskill[groupIndex]
    const pass = uses.get(groupIndex) ?? 0
    uses.set(groupIndex, pass + 1)
    return group[pass % group.length]
  })
}

function expectedAnswer(exercise: Exercise) {
  if (exercise.kind === 'choice') return exercise.options[exercise.answer]
  if (exercise.kind === 'formula') return exercise.accepted.join(' or ')
  if (exercise.kind === 'truth-table') return `The completed truth table for ${exercise.formula}`
  if (exercise.kind === 'model') return exercise.expected ? 'True' : 'False'
  return `${exercise.premises.join(', ')} ⊢ ${exercise.conclusion}`
}

function gradeFormula(exercise: FormulaExercise, answer: string): Feedback {
  try {
    if (exercise.language === 'tfl') {
      const submitted = parseTFL(answer)
      const accepted = exercise.accepted.map(parseTFL)
      const correct = accepted.some((formula) => structuralEqual(formula, submitted) || (exercise.allowTflEquivalence && truthFunctionallyEquivalent(formula, submitted)))
      return { correct, message: correct ? 'Your formula has the required structure.' : 'The formula parses, but its structure does not express the required claim.', expected: expectedAnswer(exercise), answer: renderTFL(submitted) }
    }
    const submitted = renderFOL(parseFOL(answer))
    const accepted = exercise.accepted.map((formula) => renderFOL(parseFOL(formula)))
    return { correct: accepted.includes(submitted), message: accepted.includes(submitted) ? 'Your quantifier structure and predicate placement are correct.' : 'The formula parses, but its quantifier, scope, or predicate structure needs revision.', expected: expectedAnswer(exercise), answer: submitted }
  } catch (error) {
    return { correct: false, message: error instanceof Error ? error.message : 'The answer is not a well-formed formula.', expected: expectedAnswer(exercise), answer }
  }
}

export function PracticeSession({ selected, config, resumeIds, resumeIndex = 0, onFinish, onOpenProof, onOpenModel }: PracticeSessionProps) {
  const set = useMemo(() => resumeIds?.map(resolveExercise).filter((item): item is Exercise => Boolean(item)) ?? buildSet(selected, config), [selected, config, resumeIds])
  const [index, setIndex] = useState(Math.min(resumeIndex, Math.max(0, set.length - 1)))
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [testResults, setTestResults] = useState<Array<{ exercise: Exercise; feedback: Feedback }>>([])
  const [finished, setFinished] = useState(false)
  const exercise = set[index]

  useEffect(() => {
    if (set.length) saveSessionDraft({ exerciseIds: set.map((item) => item.id), selectedSubskills: selected, difficulty: config.difficulty, length: config.length, mode: config.mode, index, savedAt: new Date().toISOString() })
  }, [set, selected, config, index])

  if (!exercise) return <section className="empty-state"><h1>No matching exercises</h1><p>Adjust the selected subskills or difficulty. The topic library remains fully available.</p><button onClick={onFinish}>Return to setup</button></section>

  const submitFeedback = (result: Feedback) => {
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    recordAttempt({ exerciseId: exercise.id, topic: exercise.topic, subskill: exercise.subskill, difficulty: exercise.difficulty, correct: result.correct, attempts: nextAttempts, hintsUsed: hintLevel, answer: result.answer, expected: result.expected })
    if (config.mode === 'test') {
      setTestResults((current) => [...current, { exercise, feedback: result }])
      advance()
    } else setFeedback(result)
  }

  const advance = () => {
    if (index >= set.length - 1) {
      clearSessionDraft(); setFinished(true); return
    }
    setIndex((current) => current + 1); setAnswer(''); setFeedback(null); setHintLevel(0); setAttempts(0)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  if (finished) {
    const results = config.mode === 'test' ? testResults : []
    return (
      <section className="session-results">
        <p className="eyebrow">Set complete</p><h1>{config.mode === 'test' ? `${results.filter((result) => result.feedback.correct).length} of ${results.length} correct` : 'Practice set complete.'}</h1>
        {config.mode === 'test' && <div className="test-review">{results.map(({ exercise: item, feedback: result }, resultIndex) => <article key={`${item.id}-${resultIndex}`} className="result-row"><strong>{result.correct ? 'Correct' : 'Needs revision'}</strong><p>{item.prompt}</p><dl><div><dt>Your answer</dt><dd className="formula-text">{result.answer || 'No answer'}</dd></div><div><dt>Expected</dt><dd className="formula-text">{result.expected}</dd></div></dl><p>{item.explanation}</p></article>)}</div>}
        <button className="primary-button" onClick={onFinish}>Return to topic library</button>
      </section>
    )
  }

  const submit = () => {
    if (exercise.kind === 'choice') {
      const chosen = Number(answer)
      submitFeedback({ correct: chosen === exercise.answer, message: chosen === exercise.answer ? 'That distinction is correct.' : 'Reconsider the relevant definition or logical condition.', expected: expectedAnswer(exercise), answer: exercise.options[chosen] ?? 'No answer' })
    } else if (exercise.kind === 'formula') submitFeedback(gradeFormula(exercise, answer))
    else if (exercise.kind === 'model') {
      const value = answer === 'true'
      submitFeedback({ correct: value === exercise.expected, message: value === exercise.expected ? 'The sentence has that truth value in the displayed interpretation.' : 'Check every relevant object or tuple in the interpretation.', expected: expectedAnswer(exercise), answer: answer === 'true' ? 'True' : answer === 'false' ? 'False' : 'No answer' })
    }
  }

  const tableGrade = (grade: TableGrade, entered: string) => submitFeedback({ correct: grade.correct, message: grade.message, expected: expectedAnswer(exercise), answer: entered })

  return (
    <section className="practice-session">
      <header className="session-header"><div><p className="eyebrow">{exercise.topic.replaceAll('-', ' ')} · {exercise.difficulty}</p><p>Question {index + 1} of {set.length}</p></div><progress max={set.length} value={index + 1}>{index + 1} of {set.length}</progress></header>
      <article className="exercise-surface">
        <h1>{exercise.prompt}</h1>
        {'symbolizationKey' in exercise && exercise.symbolizationKey && <div className="symbolization-key"><strong>Symbolization key</strong>{exercise.symbolizationKey.map((entry) => <p key={entry}>{entry}</p>)}</div>}

        {exercise.kind === 'choice' && <fieldset className="answer-options" disabled={Boolean(feedback)}><legend className="sr-only">Choose an answer</legend>{exercise.options.map((option, optionIndex) => <label key={option}><input type="radio" name="answer" value={optionIndex} checked={answer === String(optionIndex)} onChange={(event) => setAnswer(event.target.value)} /><span><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>{option}</span></label>)}</fieldset>}
        {exercise.kind === 'formula' && <div><label htmlFor="formula-answer">Your formula</label><FormulaInput id="formula-answer" language={exercise.language} value={answer} onChange={setAnswer} disabled={Boolean(feedback)} autoFocus /></div>}
        {exercise.kind === 'truth-table' && <TruthTableEditor key={exercise.id} formula={exercise.formula} disabled={Boolean(feedback)} onGrade={tableGrade} />}
        {exercise.kind === 'model' && <div className="model-question"><div className="mini-model"><p><strong>Domain:</strong> {exercise.model.domain.join(', ')}</p><p><strong>Names:</strong> {Object.entries(exercise.model.names).map(([name, object]) => `${name}: ${object}`).join('; ')}</p><p><strong>Extensions:</strong> {Object.entries(exercise.model.predicates).map(([name, tuples]) => `${name}: {${tuples.map((tuple) => `⟨${tuple.join(', ')}⟩`).join(', ')}}`).join('; ')}</p></div><fieldset className="answer-options"><legend>Truth value</legend><label><input type="radio" name="model-answer" value="true" checked={answer === 'true'} onChange={(event) => setAnswer(event.target.value)} /><span>True</span></label><label><input type="radio" name="model-answer" value="false" checked={answer === 'false'} onChange={(event) => setAnswer(event.target.value)} /><span>False</span></label></fieldset><button className="secondary-button" onClick={() => onOpenModel(exercise)}>Open in model workspace</button></div>}
        {exercise.kind === 'proof' && <div className="proof-question"><div className="argument-display"><span>{exercise.premises.join(', ')}</span><span>∴ {exercise.conclusion}</span></div><button className="primary-button" onClick={() => onOpenProof(exercise)}>Open in proof workspace</button></div>}

        {config.mode === 'guided' && !feedback && exercise.kind !== 'truth-table' && <div className="hint-controls"><button disabled={hintLevel >= 3} onClick={() => setHintLevel((level) => Math.min(3, level + 1))}>{hintLevel === 0 ? 'Use a hint' : 'Next hint'}</button>{hintLevel > 0 && <div className="hint-box"><strong>Hint {hintLevel} of 3</strong><p>{exercise.hints[hintLevel - 1]}</p></div>}</div>}

        {!feedback && !['truth-table', 'proof'].includes(exercise.kind) && <button className="primary-button submit-answer" disabled={!answer} onClick={submit}>Submit answer</button>}

        {feedback && <div className={`feedback-panel ${feedback.correct ? 'is-correct' : 'needs-revision'}`} role="status"><p className="feedback-label">{feedback.correct ? '✓ Correct' : '× Needs revision'}</p><p>{feedback.message}</p><dl><div><dt>Your answer</dt><dd className="formula-text">{exercise.kind === 'truth-table' ? 'Entered table values' : feedback.answer || 'No answer'}</dd></div><div><dt>Expected reasoning</dt><dd>{feedback.correct || hintLevel >= 4 ? exercise.explanation : 'Try again before revealing the complete explanation.'}</dd></div></dl><div className="feedback-actions">{!feedback.correct && <button onClick={() => { setFeedback(null); setAnswer('') }}>Try again</button>}{!feedback.correct && hintLevel < 4 && <button onClick={() => setHintLevel(4)}>Reveal explanation</button>}{(feedback.correct || hintLevel >= 4) && <button className="primary-button" onClick={advance}>{index === set.length - 1 ? 'Finish set' : 'Next question'}</button>}</div>{hintLevel >= 4 && !feedback.correct && <p className="full-explanation"><strong>Explanation:</strong> {exercise.explanation}<br /><span className="formula-text">Accepted answer: {feedback.expected}</span></p>}</div>}
      </article>
    </section>
  )
}
