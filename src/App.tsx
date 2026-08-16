import { useState } from 'react'
import { type Exercise, type ModelExercise, type ProofExercise } from './content/exercises'
import { allTopics, topicGroups } from './content/topics'
import { loadSessionDraft, type SessionDraft } from './storage/progress'
import { ModelWorkspace } from './pages/ModelWorkspace'
import { PracticePage } from './pages/PracticePage'
import { ProofWorkspace } from './pages/ProofWorkspace'
import { ReviewPage } from './pages/ReviewPage'
import { SourcesPage } from './pages/SourcesPage'
import githubMark from './assets/github-mark.svg'

type View = 'library' | 'practice' | 'proofs' | 'models' | 'review' | 'sources'

export default function App() {
  const [view, setView] = useState<View>('library')
  const [selected, setSelected] = useState<string[]>(['tfl-translation'])
  const [resume, setResume] = useState<SessionDraft | null>(null)
  const [storedDraft, setStoredDraft] = useState<SessionDraft | null>(() => loadSessionDraft())
  const [proofExercise, setProofExercise] = useState<ProofExercise | null>(null)
  const [modelExercise, setModelExercise] = useState<ModelExercise | null>(null)
  const selectedCount = selected.length
  const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

  const navigate = (next: View) => {
    if (next === 'proofs') setProofExercise(null)
    if (next === 'models') setModelExercise(null)
    if (next !== 'practice') setResume(null)
    setView(next)
    toTop()
  }
  const openPractice = (useResume = false) => {
    const draft = useResume ? loadSessionDraft() : null
    if (draft) setSelected(draft.selectedSubskills)
    setResume(draft); setView('practice'); toTop()
  }
  const returnToLibrary = () => { setStoredDraft(loadSessionDraft()); setResume(null); setView('library'); toTop() }
  const openProof = (exercise: Extract<Exercise, { kind: 'proof' }>) => { setProofExercise(exercise); setView('proofs'); toTop() }
  const openModel = (exercise: Extract<Exercise, { kind: 'model' }>) => { setModelExercise(exercise); setView('models'); toTop() }
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <nav aria-label="Primary navigation">
          <button aria-current={view === 'library' || view === 'practice' ? 'page' : undefined} onClick={() => navigate('library')}>Practice</button>
          <button aria-current={view === 'proofs' ? 'page' : undefined} onClick={() => navigate('proofs')}>Proof workspace</button>
          <button aria-current={view === 'models' ? 'page' : undefined} onClick={() => navigate('models')}>Model workspace</button>
          <button aria-current={view === 'review' ? 'page' : undefined} onClick={() => navigate('review')}>Review</button>
          <button aria-current={view === 'sources' ? 'page' : undefined} onClick={() => navigate('sources')}>Sources</button>
          <a className="github-link" href="https://github.com/taherezm/phil250-logic-trainer" target="_blank" rel="noreferrer" aria-label="View the Logic Trainer source code on GitHub">
            <img src={githubMark} alt="" />
          </a>
        </nav>
      </header>

      <main id="main-content">
        {view === 'library' && (
          <>
            <section className="page-heading">
              <h1>Choose what to practice.</h1>
              <p>Every topic and rule is available. Select one subskill or combine several into a mixed set.</p>
            </section>

            <div className="quick-actions" aria-label="Quick actions">
              <button onClick={() => setSelected(allTopics.flatMap((topic) => topic.subskills.map((subskill) => subskill.id)))}>Select all for mixed practice</button>
              <button onClick={() => navigate('review')}>Review previous mistakes</button>
              <button disabled={!storedDraft} title={storedDraft ? 'Continue the locally stored set' : 'No unfinished set is stored'} onClick={() => openPractice(true)}>Resume unfinished set</button>
            </div>

            <div className="topic-groups">
              {topicGroups.map((group) => (
                <section key={group.id} className="topic-group" aria-labelledby={`${group.id}-heading`}>
                  <h2 id={`${group.id}-heading`}>{group.label}</h2>
                  <div className="topic-grid">
                    {group.topics.map((topic) => (
                      <article className="topic-card" key={topic.id}>
                        <div><h3>{topic.label}</h3><p>{topic.description}</p></div>
                        <fieldset><legend className="sr-only">Subskills for {topic.label}</legend>
                          {topic.subskills.map((subskill) => <label key={subskill.id}><input type="checkbox" checked={selected.includes(subskill.id)} onChange={() => toggle(subskill.id)} /><span>{subskill.label}</span></label>)}
                        </fieldset>
                        <button className="text-action" onClick={() => { setSelected(topic.subskills.map((subskill) => subskill.id)); openPractice(false) }}>Practice this topic →</button>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <aside className="session-bar" aria-live="polite"><div><strong>{selectedCount}</strong> {selectedCount === 1 ? 'subskill' : 'subskills'} selected</div><button disabled={selectedCount === 0} onClick={() => openPractice(false)}>Configure set</button></aside>
          </>
        )}
        {view === 'practice' && <PracticePage selected={selected} onSelected={setSelected} resume={resume} onBack={returnToLibrary} onOpenProof={openProof} onOpenModel={openModel} />}
        {view === 'proofs' && <ProofWorkspace initial={proofExercise} />}
        {view === 'models' && <ModelWorkspace initial={modelExercise} />}
        {view === 'review' && <ReviewPage onPractice={(subskill) => { setSelected([subskill]); openPractice(false) }} />}
        {view === 'sources' && <SourcesPage />}
      </main>
    </div>
  )
}
