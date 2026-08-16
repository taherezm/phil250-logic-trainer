import type { Difficulty } from '../content/exercises'
import { allSubskills, allTopics } from '../content/topics'

export interface PracticeConfig {
  difficulty: Difficulty | 'mixed'
  length: 5 | 10 | 20
  mode: 'guided' | 'practice' | 'test'
}

interface PracticeSetupProps {
  selected: string[]
  onChangeSelection: (selected: string[]) => void
  onStart: (config: PracticeConfig) => void
  config: PracticeConfig
  onConfig: (config: PracticeConfig) => void
}

export function PracticeSetup({ selected, onChangeSelection, onStart, config, onConfig }: PracticeSetupProps) {
  const selectedLabels = allSubskills.filter((subskill) => selected.includes(subskill.id))
  return (
    <div className="setup-layout">
      <section className="setup-main">
        <p className="eyebrow">Practice setup</p>
        <h1>Configure the set.</h1>
        <p className="lede">The selection affects only this set. Every subject remains available in the library.</p>

        <div className="setup-section">
          <div className="section-number">01</div>
          <div>
            <h2>Topics and subskills</h2>
            <div className="selection-summary">
              {selectedLabels.length > 0 ? selectedLabels.map((subskill) => (
                <button key={subskill.id} className="selection-chip" onClick={() => onChangeSelection(selected.filter((id) => id !== subskill.id))} aria-label={`Remove ${subskill.label}`}>{subskill.label} <span aria-hidden="true">×</span></button>
              )) : <p>No subskills selected.</p>}
            </div>
            <details>
              <summary>Adjust selection</summary>
              <div className="compact-topic-list">
                {allTopics.map((topic) => (
                  <fieldset key={topic.id}>
                    <legend>{topic.label}</legend>
                    {topic.subskills.map((subskill) => <label key={subskill.id}><input type="checkbox" checked={selected.includes(subskill.id)} onChange={() => onChangeSelection(selected.includes(subskill.id) ? selected.filter((id) => id !== subskill.id) : [...selected, subskill.id])} /> {subskill.label}</label>)}
                  </fieldset>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="setup-section">
          <div className="section-number">02</div>
          <fieldset className="choice-fieldset"><legend>Difficulty</legend>
            {(['introductory', 'intermediate', 'advanced', 'mixed'] as const).map((value) => <label key={value}><input type="radio" name="difficulty" checked={config.difficulty === value} onChange={() => onConfig({ ...config, difficulty: value })} /><span>{value[0].toUpperCase() + value.slice(1)}</span></label>)}
          </fieldset>
        </div>

        <div className="setup-section">
          <div className="section-number">03</div>
          <fieldset className="choice-fieldset"><legend>Set length</legend>
            {([5, 10, 20] as const).map((value) => <label key={value}><input type="radio" name="length" checked={config.length === value} onChange={() => onConfig({ ...config, length: value })} /><span>{value} questions</span></label>)}
          </fieldset>
        </div>

        <div className="setup-section">
          <div className="section-number">04</div>
          <fieldset className="choice-fieldset feedback-choices"><legend>Feedback mode</legend>
            <label><input type="radio" name="mode" checked={config.mode === 'guided'} onChange={() => onConfig({ ...config, mode: 'guided' })} /><span><strong>Guided</strong><small>Hints available before submission.</small></span></label>
            <label><input type="radio" name="mode" checked={config.mode === 'practice'} onChange={() => onConfig({ ...config, mode: 'practice' })} /><span><strong>Practice</strong><small>Feedback immediately after each answer.</small></span></label>
            <label><input type="radio" name="mode" checked={config.mode === 'test'} onChange={() => onConfig({ ...config, mode: 'test' })} /><span><strong>Test</strong><small>Feedback after the complete set.</small></span></label>
          </fieldset>
        </div>
      </section>
      <aside className="setup-aside">
        <p className="eyebrow">Set summary</p>
        <dl><div><dt>Subskills</dt><dd>{selected.length}</dd></div><div><dt>Difficulty</dt><dd>{config.difficulty}</dd></div><div><dt>Questions</dt><dd>{config.length}</dd></div><div><dt>Feedback</dt><dd>{config.mode}</dd></div></dl>
        <button className="primary-button wide" disabled={selected.length === 0} onClick={() => onStart(config)}>Begin set</button>
      </aside>
    </div>
  )
}
