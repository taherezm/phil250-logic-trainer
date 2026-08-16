import { useState } from 'react'
import type { Exercise } from '../content/exercises'
import type { SessionDraft } from '../storage/progress'
import { PracticeSession } from '../components/PracticeSession'
import { PracticeSetup, type PracticeConfig } from '../components/PracticeSetup'

interface PracticePageProps {
  selected: string[]
  onSelected: (selected: string[]) => void
  resume?: SessionDraft | null
  onBack: () => void
  onOpenProof: (exercise: Extract<Exercise, { kind: 'proof' }>) => void
  onOpenModel: (exercise: Extract<Exercise, { kind: 'model' }>) => void
}

export function PracticePage({ selected, onSelected, resume, onBack, onOpenProof, onOpenModel }: PracticePageProps) {
  const [config, setConfig] = useState<PracticeConfig>(resume ? { difficulty: resume.difficulty, length: resume.length, mode: resume.mode } : { difficulty: 'mixed', length: 5, mode: 'guided' })
  const [running, setRunning] = useState(Boolean(resume))
  if (running) return <PracticeSession selected={selected} config={config} resumeIds={resume?.exerciseIds} resumeIndex={resume?.index} onFinish={onBack} onOpenProof={onOpenProof} onOpenModel={onOpenModel} />
  return <PracticeSetup selected={selected} onChangeSelection={onSelected} config={config} onConfig={setConfig} onStart={() => { setRunning(true); window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }} />
}
