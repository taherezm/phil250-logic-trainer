import { useState } from 'react'
import { loadAttempts, setReviewState, type AttemptRecord } from '../storage/progress'
import { allSubskills } from '../content/topics'

interface ReviewPageProps { onPractice: (subskill: string) => void }

export function ReviewPage({ onPractice }: ReviewPageProps) {
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => loadAttempts())
  const mistakes = attempts.filter((attempt) => attempt.review && !attempt.correct)
  const markReviewed = (id: string) => { setReviewState(id, false); setAttempts(loadAttempts()) }
  return (
    <section className="workspace-page review-page">
      <div className="workspace-heading"><div><p className="eyebrow">Stored on this device</p><h1>Mistake review</h1><p>Incorrect attempts return here until you mark them reviewed. Review status never changes topic access.</p></div><div className="review-count"><strong>{mistakes.length}</strong><span>to review</span></div></div>
      {mistakes.length === 0 ? <div className="empty-state"><h2>No mistakes are waiting.</h2><p>Incorrect answers from practice sets will appear here with the submitted and expected answers.</p></div> : <div className="mistake-list">{mistakes.map((attempt) => <article key={attempt.id}><div className="mistake-meta"><span>{allSubskills.find((subskill) => subskill.id === attempt.subskill)?.label ?? attempt.subskill}</span><time dateTime={attempt.timestamp}>{new Date(attempt.timestamp).toLocaleString()}</time></div><h2>Needs revision</h2><dl><div><dt>Your answer</dt><dd className="formula-text">{attempt.answer}</dd></div><div><dt>Expected</dt><dd className="formula-text">{attempt.expected}</dd></div><div><dt>Attempts / hints</dt><dd>{attempt.attempts} / {attempt.hintsUsed}</dd></div></dl><div className="mistake-actions"><button className="primary-button" onClick={() => onPractice(attempt.subskill)}>Practice this subskill</button><button onClick={() => markReviewed(attempt.id)}>Mark reviewed</button></div></article>)}</div>}
    </section>
  )
}
